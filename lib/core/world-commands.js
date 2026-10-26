import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { randomUUID } from 'node:crypto';
import { readJson, writeJson } from './files.js';

const failure = (code, message) => Object.assign(new Error(message), { code });
const timeoutMessage = 'Skin command was not confirmed / 等待皮肤命令回执超时，未确认成功；请检查世界日志，正常重启世界后再试。';
const sameWorld = (a,b) => ['instance','launchId','pid','startedAt'].every(key => a[key] !== undefined && a[key] === b[key]);
export function skinImageURL(value) {
  const text=String(value||'').trim();let url;
  if (!text || text.length>2048 || /[\s\u0000-\u001f\u007f]/.test(text)) throw new Error('Use an https skin image URL / 请填写皮肤图片的 https 地址');
  try { url=new URL(text); } catch { throw new Error('Use an https skin image URL / 请填写皮肤图片的 https 地址'); }
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an https skin image URL / 请填写皮肤图片的 https 地址');
  return url.href;
}
function parse(command) {
  if(typeof command!=='string'||/[\r\n\u0000]/.test(command))throw new Error('Unsupported world command / 不允许此世界命令');
  let match=/^sr createcustom companion_skin (https:\/\/\S+)$/.exec(command);
  if(match){skinImageURL(match[1]);return {kind:'create'};}
  match=/^skin set companion_skin ([A-Za-z0-9_]{1,16})$/.exec(command);
  if(match)return {kind:'apply',player:match[1]};
  throw new Error('Unsupported world command / 不允许此世界命令');
}
function resultFor(parsed,line) {
  line=line.replace(/^\[[^\]]+\s(?:INFO|WARN|ERROR)\]:\s*/,'');
  if(/^(?:Unknown or incomplete command|Unknown command|未知.*命令)/i.test(line))return {ok:false,code:'PLUGIN_UNAVAILABLE',message:'SkinsRestorer is not loaded / 世界尚未加载 SkinsRestorer，请检查世界日志和插件文件。'};
  if(!/^\[SkinsRestorer\]/i.test(line))return null;
  if(parsed.kind==='create'&&/The skin companion_skin was created\./i.test(line))return {ok:true};
  if(parsed.kind==='apply'&&line.toLowerCase().includes(`you changed the skin of ${parsed.player.toLowerCase()}.`))return {ok:true};
  if(/not online|is offline|player.*not found/i.test(line))return {ok:false,code:'PLAYER_OFFLINE',message:'Character is offline / 角色尚未进入世界，请先让角色进入再应用皮肤。'};
  if(/could not|failed|error|invalid|not found|does not exist|unable|rate.limit|API key|Mineskin|cooldown|please wait/i.test(line))return {ok:false,code:'SKIN_FETCH_FAILED',message:'Minecraft could not fetch or apply the skin / Minecraft 无法获取或应用皮肤图片，请检查世界联网、图片地址及 SkinsRestorer 日志。'};
  return null;
}
// The caller holds the world lock. Java is owned exclusively by its supervisor.
export async function sendConsoleCommand(directory,identity,command,{timeoutMs=90000,signal}={}) {
  parse(command);signal?.throwIfAborted();
  if(!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>180000)throw new Error('Invalid command timeout');
  const requestFile=path.join(directory,'world-command.json'),replyFile=path.join(directory,'world-command-reply.json');
  const request={...identity,id:randomUUID(),command,expiresAt:Date.now()+timeoutMs};
  await writeJson(requestFile,request);
  try {
    while(Date.now()<request.expiresAt){
      signal?.throwIfAborted();const reply=await readJson(replyFile);
      if(reply.id===request.id){
        if(!sameWorld(reply,identity))throw failure('WORLD_CHANGED','World changed / 世界进程已变化，请重新检测连接。');
        if(!reply.ok)throw failure(reply.code||'COMMAND_FAILED',reply.message||'World command failed / 世界命令执行失败');
        return reply;
      }
      await new Promise(resolve=>setTimeout(resolve,Math.min(40,Math.max(1,request.expiresAt-Date.now()))));
    }
    throw failure('COMMAND_TIMEOUT',timeoutMessage);
  } finally {
    if((await readJson(requestFile)).id===request.id)await fs.unlink(requestFile).catch(e=>{if(e.code!=='ENOENT')throw e;});
  }
}
export function createConsoleChannel(directory,identity,child) {
  const replyFile=path.join(directory,'world-command-reply.json'),seen=new Set();
  let active,closed=false,polling=false,uncertain=false,finishing=Promise.resolve();
  const respond=(request,result,output=[])=>writeJson(replyFile,{...identity,id:request.id,...result,output});
  function finish(result) {
    const current=active;if(!current)return finishing;active=null;
    if(result.code==='COMMAND_TIMEOUT')uncertain=true;
    finishing=respond(current.request,result,current.output);return finishing;
  }
  const readers=[child.stdout,child.stderr].map(input=>{
    const reader=readline.createInterface({input});reader.on('line',raw=>{
      if(!active)return;
      if(Date.now()>=active.request.expiresAt){void finish({ok:false,code:'COMMAND_TIMEOUT',message:timeoutMessage}).catch(()=>{});return;}
      const line=raw.replace(/\u001b\[[0-9;]*m/g,'').replace(/§./g,'');
      if(active.output.length<60)active.output.push(line.slice(0,2000));
      const result=resultFor(active.parsed,line);if(result)void finish(result).catch(()=>{});
    });return reader;
  });
  return {
    async poll(){
      if(closed||polling)return;polling=true;
      try{
        await finishing;
        if(closed)return;
        if(active){if(Date.now()>=active.request.expiresAt)await finish({ok:false,code:'COMMAND_TIMEOUT',message:timeoutMessage});return;}
        const request=await readJson(path.join(directory,'world-command.json'));
        if(closed)return;
        if(!/^[\w-]{1,64}$/.test(request.id||'')||seen.has(request.id))return;
        seen.add(request.id);if(seen.size>128)seen.delete(seen.values().next().value);
        if(!sameWorld(request,identity)){await respond(request,{ok:false,code:'WORLD_CHANGED',message:'World changed / 世界进程已变化，请重新检测连接。'});return;}
        if(!Number.isFinite(request.expiresAt)||request.expiresAt<=Date.now()||request.expiresAt>Date.now()+180000){await respond(request,{ok:false,code:'COMMAND_TIMEOUT',message:timeoutMessage});return;}
        // Java plugin replies carry no request ID. After an expired asynchronous
        // operation, a late reply cannot safely be assigned to a later command.
        if(uncertain){await respond(request,{ok:false,code:'COMMAND_UNCERTAIN',message:'Previous command is unconfirmed / 上一次皮肤命令未确认完成，请正常重启世界后再试。'});return;}
        let parsed;try{parsed=parse(request.command);}catch(e){await respond(request,{ok:false,code:'COMMAND_REJECTED',message:e.message});return;}
        active={request,parsed,output:[]};
        if(child.stdin.destroyed||!child.stdin.writable){await finish({ok:false,code:'WORLD_OFFLINE',message:'World console is closed / 世界控制台已关闭，请重新开启世界。'});return;}
        child.stdin.write(request.command+'\n');
      }finally{polling=false;}
    },
    async close(){closed=true;for(const r of readers)r.close();await finish({ok:false,code:'WORLD_OFFLINE',message:'World stopped / 世界已停止，皮肤操作未完成。'});await finishing;},
  };
}
