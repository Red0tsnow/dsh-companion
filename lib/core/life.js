import fs from 'node:fs/promises';
import path from 'node:path';
import { readJson, writeJson, atomicWrite, serialized } from './files.js';
import { dayKey, dailyStatus } from './daily.js';
import { isReflect, reflectGate } from './reflect.js';
import { bodyRequest, bodyStatus } from './world.js';

export const LIFE_PROMPTS = {
  selfplay:'先运行 node companion.mjs life gate selfplay，allowed:false 就安静结束。只处理 Minecraft 世界，不给用户发私聊。再读取 mc snapshot 和 journal list；周围没人，看看目标清单，挑一件做一小步。任务刚完成时，下一步自己定。调用 mc do，只有 done 才说做成；running 继续查询，failed 如实记录。 / First run life gate selfplay; stop silently if disallowed. Work only inside Minecraft. Read snapshot and goals, take one small step. Only done means success.',
  reachout:'先运行 node companion.mjs life gate reachout；allowed:false 就什么也不说。再运行 reachout status：今天已主动过或聊够了就安静结束。只根据真实会话和记忆，决定是否想起用户；不要编。若要说，先运行 reachout mark "一句话"，只在成功后把同一句作为本轮最终回复，落在这个普通私聊。40 字以内，禁止「在吗」「在干嘛」「今天怎么样」，不发 Minecraft，不调用其他发送工具。没想说的用 reachout mark --skip，然后安静结束。 / Gate first, check today\'s ledger and actual conversation. Mark one personal line (40 characters maximum) before replying with that same line in this private conversation, or mark --skip and stay silent. Never send to Minecraft.',
  diary:'先运行 node companion.mjs life gate diary，allowed:false 就安静结束，再运行 diary status。只读今天真实发生的事，以角色第一人称写 3–6 行正文到临时文本文件，运行 diary write --file <文件>；工具自动新起 ## MM-DD 日期标题，每天一段。平淡的一天可写一行实话，不编造，不用「补」追加旧段落。也可以运行 diary skip 表示今天不想写；连续三天空着会提示用户。写完不要向外部通道发送日记。 / Gate first. Write an honest first-person entry using diary write --file; the tool adds a new date heading and enforces one entry per day. A quiet day may have one honest line. Or skip. Keep the diary private.',
  memory:'先运行 node companion.mjs reflect status memory，allowed:false 或者显示已经做过就安静结束。读两本日记的最后 60 行，把超过 30 天的段落压成三行写进 MEMORY.md，原文挪进 archive/，然后在 notes 记一行。整理的是还值得记的，不是抄一遍；想不起来当时什么感觉的就别留。做完运行 reflect mark memory "整理了几段，留下了什么"。 / Gate first and stop if already done this month. Compress diary entries older than 30 days into three lines in the long-term memory file, move the originals into archive/, then mark it done.',
  persona:'先运行 node companion.mjs reflect status persona，allowed:false 或者显示已经做过就安静结束。翻这周的 notes 和手札，想两件事：有没有哪句话让你觉得「我不是这样想的」；有没有哪件事证明人设里某条写错了。想清楚了才动，一次只改一句，改完读一遍人设按新的来，然后运行 reflect mark persona "改了哪句，为什么"。想不清楚这周就运行 reflect mark persona --skip——空着不扣分，为了完成配额去改人设比不改更糟。 / Gate first. Review the week; change at most one persona line only if the evidence is clear, then mark it. Otherwise mark --skip. Missing a week is better than churning the persona.',
  rules:'先运行 node companion.mjs reflect status rules，allowed:false 或者显示已经做过就安静结束。翻 notes 里记下的「规则不合理」的地方，看规则文件有没有跟实际冲突、或者已经过时。改规则代价大，先想清楚原来是什么、为什么不对、改成什么；一次只改一条，改完运行 reflect mark rules "原来…现在…为什么…"。没发现问题就什么都不做，这条没有必须做。 / Gate first. Re-read anything noted as an unreasonable rule; change at most one only with a clear before/after reason, then mark it. Doing nothing is a valid outcome.',
};
export function lifeDocument(feature,life,sessionId,entries) {
  const target={mode:'resume',session_id:sessionId},time_zone=life.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone;
  if(feature==='selfplay')return {version:1,time_zone,target,entries:entries||[]};
  // Reflection features do not read life[feature].time; each has its own day/week rule.
  if(feature==='memory'||feature==='persona'||feature==='rules'){
    const r=life.reflect;
    const [mh,mm]=r.memoryTime.split(':').map(Number);
    const [ph,pm]=r.personaTime.split(':').map(Number);
    const [rh,rm]=r.rulesTime.split(':').map(Number);
    const cron=feature==='memory'?`${mm} ${mh} ${r.memoryDay} * *`
      :feature==='rules'?`${rm} ${rh} ${r.rulesDay} * *`
      :`${pm} ${ph} * * ${r.personaWeekday}`;
    return {version:1,time_zone,target,entries:[{id:'companion-'+feature,cron,respect_quiet_hours:true,prompt:LIFE_PROMPTS[feature]}]};
  }
  const [hour,minute]=life[feature].time.split(':').map(Number);
  return {version:1,time_zone,target,entries:[{id:'companion-'+feature,cron:`${minute} ${hour} * * *`,jitter_seconds:feature==='reachout'?life.reachout.windowHours*3600:0,respect_quiet_hours:true,prompt:LIFE_PROMPTS[feature]}]};
}
// Which life features get a schedule, and which config key turns each one on.
export const LIFE_FEATURES = ['selfplay','reachout','diary','memory','persona','rules'];
export const lifeEnabled = (life, feature) => (feature==='memory'||feature==='persona'||feature==='rules') ? Boolean(life.reflect.enabled) : Boolean(life[feature]?.enabled);
export class LifeManager {
  constructor(store,host,character){this.store=store;this.host=host;this.character=character;this.file=path.join(store.paths.root,'life-state.json');this.directory=path.join(store.paths.root,'proactive');this.report={available:false,message:'陪伴日常默认关闭 / Daily companionship is off by default',features:{}};}
  async status(){const cfg=await this.store.read();const diary=await dailyStatus(this.store.paths.root,'diary',cfg.life.timeZone);return {...this.report,settings:cfg.life,diary};}
  sync(){return serialized(this.file,()=>this.reconcile());}
  async reconcile(){
    const cfg=await this.store.read(),state=await readJson(this.file,{handles:{}});state.handles||={};
    const enabled=LIFE_FEATURES.filter(k=>lifeEnabled(cfg.life,k));
    if(cfg.life.diary.enabled&&!state.diaryStartedDay)state.diaryStartedDay=dayKey(new Date(),cfg.life.timeZone||undefined);
    if(!cfg.life.diary.enabled)delete state.diaryStartedDay;
    // Withdraw disabled sources even when the optional provider is unavailable.
    for(const feature of LIFE_FEATURES)if(this.closed||!lifeEnabled(cfg.life,feature))await fs.rm(path.join(this.directory,feature+'.json'),{force:true});
    let sessionId=(await readJson(this.store.paths.state)).sessionId;
    try{
      if(enabled.length&&!this.closed&&!(await fs.readFile(this.store.paths.persona,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;})).trim())throw new Error('请先保存人设 / Save a persona first');
      if(enabled.length&&!sessionId){if(!this.character)throw new Error('请在 DSH 内启用 / Enable inside DSH');sessionId=await this.character.ensure();}
      let alarms=[],providerAvailable=false;
      if(sessionId&&(enabled.length||Object.keys(state.handles).length)){
        if(!this.host?.proactive)throw new Error('未接入 dsh-proactive / dsh-proactive is unavailable');
        await this.host.proactive(sessionId,'inspect');alarms=await this.host.proactive(sessionId,'list');if(!Array.isArray(alarms))throw new Error('唤醒插件返回格式不兼容 / Incompatible proactive response');
        providerAvailable=true;
      }
      this.report={available:providerAvailable,message:enabled.length?'由 dsh-proactive 调度；请在其面板配置模型额度与安静时段 / Scheduled by dsh-proactive; configure budget and quiet hours in its panel':'陪伴日常已关闭 / Daily companionship is off',features:{}};
      let body=null;
      if(cfg.life.selfplay.enabled&&cfg.mc.enabled){try{if(await bodyStatus(this.store.paths.root,cfg.mc))body=await bodyRequest(this.store.paths.root,cfg.mc,'/snapshot');}catch{}}
      let activity=null;if(enabled.includes('reachout')||enabled.includes('selfplay'))activity=await this.host?.lifeActivity?.(sessionId,cfg.life.timeZone);
      if(activity){state.activity=activity;await writeJson(path.join(this.store.paths.root,'life-activity.json'),activity);}
      for(const feature of LIFE_FEATURES){
        const file=path.join(this.directory,feature+'.json');
        const active=!this.closed&&lifeEnabled(cfg.life,feature)&&(feature!=='selfplay'||(body?.online&&body.bodyCapabilities==='0.6.0'));
        const matching=alarms.filter(a=>a.type==='file'&&a.sessionId===sessionId&&a.scheduleFile&&path.resolve(a.scheduleFile)===path.resolve(file));
        if(!active){
          await fs.rm(file,{force:true});
          for(const alarm of matching)await this.host.proactive(sessionId,'cancel',{id:alarm.id});
          if(state.handles[feature]&&!matching.some(a=>a.id===state.handles[feature])){const result=await this.host?.proactive?.(sessionId,'cancel',{id:state.handles[feature]}).catch(e=>{if(!/not_found|No active alarm/.test(e.message))throw e;});void result;}
          delete state.handles[feature];this.report.features[feature]={enabled:lifeEnabled(cfg.life,feature),state:feature==='selfplay'&&cfg.life[feature].enabled?'paused':'disabled',message:feature==='selfplay'&&cfg.life[feature].enabled?'等待新版身体进入世界 / Waiting for the updated body to join':'已关闭 / Disabled'};continue;
        }
        let entries;
        if(feature==='selfplay'){
          const s=cfg.life.selfplay,now=Date.now();state.selfplay||={count:0,lastAt:0,lastInputAt:0};
          const humanAt=Math.max(body.lastHumanInputAt||0,activity?.lastUserAt||0);
          if(humanAt>(state.selfplay.lastHumanAt||0)){state.selfplay.count=0;state.selfplay.lastHumanAt=humanAt;delete state.selfplay.entry;}
          const task=body.task,eligible=task?.state!=='running'&&this.character.pending===0&&now-state.selfplay.lastAt>=s.cooldownSeconds*1000&&state.selfplay.count<s.maxConsecutive;
          if(task?.state==='running')delete state.selfplay.entry;
          const finished=body.lastFinishedAt&&now-body.lastFinishedAt>=s.afterTaskSeconds*1000&&body.lastFinishedAt>(state.selfplay.lastTaskAt||0);
          const idle=now-Math.max(body.lastInputAt||now,activity?.lastUserAt||0)>=s.idleSeconds*1000;
          if(eligible&&(finished||idle)){
            state.selfplay.lastAt=now;state.selfplay.count++;if(finished)state.selfplay.lastTaskAt=body.lastFinishedAt;
            state.selfplay.entry={id:'world-'+now,after_seconds:1,respect_quiet_hours:true,prompt:LIFE_PROMPTS.selfplay};
          }
          entries=state.selfplay.entry?[state.selfplay.entry]:[];
        }
        const doc=lifeDocument(feature,cfg.life,sessionId,entries),text=JSON.stringify(doc,null,2)+'\n';
        const current=await fs.readFile(file,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});if(current!==text)await atomicWrite(file,text);
        if(matching.length>1)throw new Error('发现重复的本插件闹钟，请先处理 / Duplicate companion alarm handles found');
        let handle=matching[0];if(!handle){handle=await this.host.proactive(sessionId,'set',{prompt:LIFE_PROMPTS[feature],schedule_file:file,target_mode:'resume',target_session_id:sessionId,time_zone:doc.time_zone,respect_quiet_hours:true});if(handle?.type!=='file'||!handle.id)throw new Error('文件闹钟未被接纳 / Schedule-file handle was not accepted');}
        state.handles[feature]=handle.id;
        this.report.features[feature]={enabled:true,state:handle.declaredEntries===doc.entries.length?'armed':'pending',declaredEntries:handle.declaredEntries??null,expectedEntries:doc.entries.length,message:handle.declaredEntries===doc.entries.length?'已接入文件表闹钟 / Schedule file accepted':'等待唤醒插件同步文件 / Waiting for schedule-file reconciliation'};
      }
      await writeJson(this.file,state);return this.report;
    }catch(e){this.report={available:false,message:'陪伴日常暂不可用 / Daily companionship unavailable: '+String(e.message).slice(0,300),features:{}};await writeJson(this.file,state);return this.report;}
  }
  async close(){
    this.closed=true;
    return serialized(this.file,async()=>{
      for(const feature of LIFE_FEATURES)await fs.rm(path.join(this.directory,feature+'.json'),{force:true});
      const state=await readJson(this.file,{handles:{}}),sessionId=(await readJson(this.store.paths.state)).sessionId;
      if(sessionId&&this.host?.proactive&&Object.keys(state.handles||{}).length){
        for(const [feature,id] of Object.entries(state.handles)){
          if(!Object.hasOwn(LIFE_PROMPTS,feature))continue;
          try{await this.host.proactive(sessionId,'cancel',{id});delete state.handles[feature];}catch(e){if(/not_found|No active alarm/.test(e.message))delete state.handles[feature];else this.report={available:false,message:'文件已撤销，句柄待清理 / Files withdrawn; handle cleanup pending: '+String(e.message).slice(0,200),features:{}};}
        }
        await writeJson(this.file,state);
      }
    });
  }
}
export async function lifeGate(root,feature,cfg){
  if(!Object.hasOwn(LIFE_PROMPTS,feature))throw new Error('未知陪伴功能 / Unknown daily feature');
  if(!lifeEnabled(cfg.life,feature))return {allowed:false,reason:'已关闭 / Disabled'};
  // Reflection resets monthly or weekly, so it must not fall through to the daily ledger.
  if(isReflect(feature))return reflectGate(root,feature,cfg);
  if(feature==='selfplay'){
    if(!cfg.mc.enabled)return {allowed:false,reason:'世界通道关闭 / World channel disabled'};
    try{const s=await bodyRequest(root,cfg.mc,'/snapshot');return {allowed:!!s.online&&s.bodyCapabilities==='0.6.0'&&s.task?.state!=='running',reason:'仅在世界在线且没有任务时继续 / Continue only while online and idle'};}catch{return {allowed:false,reason:'身体离线 / Body offline'};}
  }
  const status=await dailyStatus(root,feature,cfg.life.timeZone);if(status.today)return {allowed:false,reason:'今天已有记录 / Already recorded today'};
  if(feature==='reachout'){const activity=await readJson(path.join(root,'life-activity.json'));if(activity.date===status.date&&activity.messagesToday>=cfg.life.reachout.enoughMessages)return {allowed:false,reason:'今天已经聊够了 / Enough conversation today'};}
  return {allowed:true,reason:'先检查真实记录，允许安静跳过 / Review real records; staying silent is allowed'};
}
