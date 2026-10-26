import { randomUUID } from 'node:crypto';
import { distance, awayFrom, HOSTILES } from './mc-reflex.js';
const message = {offline:'身体离线 / Body offline',stuck:'没有进展 / No progress',cancelled:'已取消 / Cancelled',busy:'上个动作尚未停止 / Previous action is stopping'};
const bounded = (v,fallback,max) => {const n=Number(v??fallback);if(!Number.isFinite(n)||n<0||n>max)throw new Error('参数超出范围 / Parameter out of range');return n;};
export function validateIntent(input) {
  const type=input.intent || input.type;
  if(!['goto','follow','hunt','mine','idle'].includes(type))throw new Error('未知意图 / Unknown intent');
  const p={...input,intent:type};
  p.waitSec=bounded(p.waitSec,8,30);p.timeoutSec=bounded(p.timeoutSec,300,3600);
  if(type==='goto'&&![p.x,p.y,p.z].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=30000000))throw new Error('需要有效坐标 / Valid coordinates required');
  if(type==='follow'&&!/^[A-Za-z0-9_]{1,16}$/.test(p.player||''))throw new Error('需要玩家名字 / Player name required');
  if(type==='follow'||type==='idle')p.seconds=bounded(p.seconds,30,3600);
  if(type==='hunt'){p.maxHits=bounded(p.maxHits,40,120);if(!Number.isInteger(p.maxHits)||p.maxHits<1)throw new Error('maxHits 必须是正整数 / maxHits must be a positive integer');}
  if(type==='mine'){if(!/^[a-z0-9_]+$/.test(p.block||''))throw new Error('需要方块名称 / Block name required');p.count=bounded(p.count,1,64);if(!Number.isInteger(p.count)||p.count<1)throw new Error('count 必须是正整数 / count must be a positive integer');}
  return p;
}
export const inventory = bot => Object.fromEntries(bot.inventory.items().reduce((m,i)=>m.set(i.name,(m.get(i.name)||0)+i.count),new Map()));
export const progressFingerprint = bot => JSON.stringify([...[bot.entity.position.x,bot.entity.position.y,bot.entity.position.z].map(n=>Math.round(n*10)),bot.inventory.items().reduce((n,i)=>n+i.count,0),bot.health]);
export class BodyTasks {
  constructor({getBot,online,goals,mcData,onFinish=()=>{}}){Object.assign(this,{getBot,online,goals,mcData,onFinish});this.task=null;this.operation=null;}
  status(){return this.task?structuredClone(this.task):{ok:false,state:'failed',reason:'没有任务 / No task'};}
  halt(){const b=this.getBot();try{b?.pathfinder.setGoal(null);b?.clearControlStates();b?.stopDigging()?.catch?.(()=>{});const pending=b?.collectBlock?.cancelTask?.();pending?.catch(()=>{});}catch{}}
  finish(state,reason,extra={}){if(!this.task||this.task.state!=='running')return;Object.assign(this.task,{ok:state==='done',state,reason,finishedAt:Date.now(),...extra});this.halt();this.onFinish(this.status());}
  cancel(reason=message.cancelled){this.finish('failed',reason);this.halt();return this.status();}
  start(input){
    const p=validateIntent(input);if(!this.online())throw new Error(message.offline);
    if(this.operation)throw new Error(message.busy);
    if(this.task?.state==='running')throw new Error('已有任务，请先 stop / A task is running; stop it first');
    const b=this.getBot();this.halt();this.task={id:randomUUID(),intent:p.intent,params:p,ok:false,state:'running',reason:'执行中 / Running',startedAt:Date.now(),hits:0};
    this.initialInventory=inventory(b);this.lastFingerprint=null;this.unchanged=0;this.target=null;this.lastHit=0;this.lastGoal=0;
    if(p.intent==='goto')b.pathfinder.setGoal(new this.goals.GoalNear(p.x,p.y,p.z,2));
    this.tick();return this.status();
  }
  async wait(id,seconds){const end=Date.now()+seconds*1000;while(this.task?.id===id&&this.task.state==='running'&&Date.now()<end)await new Promise(r=>setTimeout(r,100));return this.task?.id===id?this.status():{ok:false,state:'failed',reason:'任务已被替换 / Task replaced',id};}
  launch(work){const id=this.task.id;this.operation=Promise.resolve().then(()=>{if(this.task?.id===id&&this.task.state==='running')return work();}).catch(e=>{if(this.task?.id===id)this.finish('failed','动作失败 / Action failed: '+String(e.message||e).slice(0,160));}).finally(()=>{this.operation=null;});}
  tick(){
    const t=this.task;if(t?.state!=='running')return;
    if(!this.online()){this.finish('failed',message.offline);return;}
    const b=this.getBot(),p=t.params,elapsed=(Date.now()-t.startedAt)/1000;
    try{
      if(elapsed>p.timeoutSec){this.finish('failed','任务超时 / Task timed out');return;}
      if(t.intent==='idle'){if(elapsed>=p.seconds)this.finish('done','等待结束 / Wait complete');return;}
      if(t.intent==='goto'&&distance(b.entity.position,p)<=3){this.finish('done','已到达 / Arrived',{arrived:true});return;}
      if(t.intent==='follow'){
        const target=b.players[p.player]?.entity;if(!target){this.finish('failed','看不到玩家 / Player not visible');return;}
        const near=distance(b.entity.position,target.position)<=3;
        if(near){this.finish('done','已跟上 / Reached player',{near:true});return;}
        if(elapsed>=p.seconds){this.finish('failed','跟随时间到，尚未跟上 / Follow ended before reaching player',{near:false});return;}
        if(!this.lastGoal){b.pathfinder.setGoal(new this.goals.GoalFollow(target,2),true);this.lastGoal=Date.now();}
      }
      if(t.intent==='hunt'){
        if(!this.target){this.target=Object.values(b.entities).filter(e=>e!==b.entity&&e.position&&HOSTILES.has(e.name)&&e.isValid!==false&&distance(b.entity.position,e.position)<=24).sort((a,c)=>distance(b.entity.position,a.position)-distance(b.entity.position,c.position))[0];if(!this.target){this.finish('failed','附近没有目标 / No target nearby');return;}t.target=this.target.name;}
        const target=b.entities[this.target.id];if(!target||target.isValid===false){this.finish('done','目标消失 / Target disappeared');return;}
        if(b.health<=8){const to=awayFrom(b.entity.position,target.position,8);this.finish('failed','已撤退 / Retreated',{retreated:true});b.pathfinder.setGoal(new this.goals.GoalNear(to.x,to.y,to.z,2));this.retreatUntil=Date.now()+2500;return;}
        if(t.hits>=p.maxHits){this.finish('failed','达到攻击上限，目标仍在 / Hit limit; target remains');return;}
        if(distance(b.entity.position,target.position)>3){if(Date.now()-this.lastGoal>1000){b.pathfinder.setGoal(new this.goals.GoalFollow(target,2),true);this.lastGoal=Date.now();}}
        else if(Date.now()-this.lastHit>=650){b.pathfinder.setGoal(null);b.attack(target);t.hits++;this.lastHit=Date.now();}
      }
      if(t.intent==='mine'){
        const delta=(inventory(b)[p.block]||0)-(this.initialInventory[p.block]||0);t.inventoryDelta=delta;
        if(delta>=p.count){this.finish('done','背包数量已达到目标 / Inventory target reached');return;}
        if(!this.operation){const type=this.mcData(b.version).blocksByName[p.block];if(!type){this.finish('failed','未知方块 / Unknown block');return;}const points=b.findBlocks({matching:type.id,maxDistance:32,count:1});const block=points[0]&&b.blockAt(points[0]);if(!block){this.finish('failed','附近没有方块 / No matching block nearby');return;}this.launch(()=>b.collectBlock.collect(block));}
      }
      const fingerprint=progressFingerprint(b);this.unchanged=fingerprint===this.lastFingerprint?this.unchanged+1:0;this.lastFingerprint=fingerprint;
      if(this.unchanged>=10)this.finish('failed',message.stuck,{code:'stuck'});
    }catch(e){this.finish('failed','任务失败 / Task failed: '+String(e.message||e).slice(0,160));}
  }
}
