import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { decideReflex, distance, HOSTILES } from './mc-reflex.js';
import { BodyTasks } from './mc-tasks.js';

export function createBodyCapabilities({root,getBot,online,status,goals,mcData,readOnly=false,trial=false}) {
  const placesFile=path.join(root,'places.json');
  let reflex={last:null,count:0},releaseAt=0,lastInputAt=Date.now(),lastFinishedAt=0,lastHumanInputAt=0,placeError=null;
  const tasks=new BodyTasks({getBot,online,goals,mcData,onFinish:t=>{lastFinishedAt=t.finishedAt;}});
  const loadPlaces=()=>{try{const value=JSON.parse(fs.readFileSync(placesFile,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value)||Object.values(value).some(v=>!v||!Array.isArray(v.position)||v.position.length!==3||!v.position.every(Number.isFinite)||typeof v.dimension!=='string'))throw new Error('Invalid place document');return value;}catch(e){if(e.code==='ENOENT')return {};throw new Error('地点记录损坏 / Cannot read places');}};
  function savePlace(name,position,dimension){
    if(trial)return;
    if(!name||name.length>64||/[\x00-\x1f]/.test(name)||['__proto__','constructor','prototype'].includes(name))throw new Error('地点名无效 / Invalid place name');
    const places=loadPlaces();places[name]={position:[position.x,position.y,position.z],dimension:dimension??'overworld',at:new Date().toISOString()};writePlaces(places);
  }
  function writePlaces(places){const temp=placesFile+'.'+randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(places,null,2)+'\n',{mode:0o600});fs.renameSync(temp,placesFile);}finally{fs.rmSync(temp,{force:true});}}
  function places(){const b=getBot(),p=online()?b.entity.position:null;return Object.entries(loadPlaces()).map(([name,v])=>({name,...v,distance:p&&v.dimension===b.game?.dimension?distance(p,{x:v.position[0],y:v.position[1],z:v.position[2]}):null})).sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity));}
  function snapshot(){
    const s=status();if(!s.online)return {...s,task:tasks.status(),reflex};
    const b=getBot(),p=b.entity.position.floored();
    const block=(v)=>b.blockAt(v)?.name??null;
    const sides=Object.fromEntries([[0,-1,'north'],[0,1,'south'],[-1,0,'west'],[1,0,'east']].map(([x,z,name])=>{let hit=null;for(let d=1;d<=6;d++){const v=b.blockAt(p.offset(x*d,0,z*d));if(v?.boundingBox==='block'){hit={distance:d,block:v.name};break;}}return [name,hit||{distance:6,block:null}];}));
    const hostiles=Object.values(b.entities).filter(e=>e!==b.entity&&e.position&&HOSTILES.has(e.name)&&distance(b.entity.position,e.position)<=16).map(e=>({id:e.id,name:e.name,position:[e.position.x,e.position.y,e.position.z],distance:distance(b.entity.position,e.position)})).sort((a,b)=>a.distance-b.distance);
    const degrees=((b.entity.yaw*180/Math.PI)%360+360)%360,facing=['south','west','north','east'][Math.round(degrees/90)%4];
    return {...s,yaw:b.entity.yaw,pitch:b.entity.pitch,facing,blocks:{below:block(p.offset(0,-1,0)),under:[1,2,3].map(n=>block(p.offset(0,-n,0))),feet:block(p),head:block(p.offset(0,1,0))},sides,hostiles,places:places(),task:tasks.status(),reflex,lastInputAt,lastFinishedAt,lastHumanInputAt,placeError};
  }
  const release=()=>{try{getBot()?.pathfinder.setGoal(null);getBot()?.clearControlStates();}catch{}releaseAt=0;tasks.retreatUntil=0;};
  const scan=setInterval(()=>{
    if(!online()||trial)return;
    try{const b=getBot(),decision=decideReflex({position:b.entity.position,health:b.health,entities:Object.values(b.entities),lastAt:reflex.last?.at??null});if(!decision)return;
      tasks.cancel('生存反射中断了任务 / Survival reflex interrupted task');reflex={last:decision,count:reflex.count+1};const p=decision.target;b.pathfinder.setGoal(new goals.GoalNear(p.x,p.y,p.z,1));releaseAt=Date.now()+2500;
    }catch(e){reflex.error='反射失败 / Reflex failed: '+String(e.message).slice(0,100);}
  },400);
  const tick=setInterval(()=>{if((releaseAt&&Date.now()>=releaseAt)||(tasks.retreatUntil&&Date.now()>=tasks.retreatUntil))release();if(!releaseAt&&!tasks.retreatUntil)tasks.tick();},250);
  scan.unref();tick.unref();
  async function doTask(data){if(releaseAt||tasks.retreatUntil)throw new Error('正在避险，请稍后 / Retreat in progress');if(readOnly&&['mine','hunt'].includes(data.intent||data.type))throw new Error('只读模式 / Read-only mode');lastInputAt=Date.now();const started=tasks.start(data);return tasks.wait(started.id,started.params.waitSec);}
  return {
    tasks,doTask,snapshot,
    stop(){tasks.cancel();release();return tasks.status();},
    status:()=>({reflex,task:tasks.status(),lastInputAt,lastFinishedAt,lastHumanInputAt,placeError,bodyCapabilities:'0.6.0'}),
    touch:()=>{lastInputAt=Date.now();},
    attach(bot){const remember=name=>{try{if(bot.entity?.position)savePlace(name,bot.entity.position,bot.game?.dimension);placeError=null;}catch(e){placeError=e.message;}};bot.once('spawn',()=>remember('spawn'));bot.on('chat',username=>{if(username!==bot.username)lastHumanInputAt=lastInputAt=Date.now();});bot.on('death',()=>{remember('death');tasks.cancel('角色死亡 / Character died');});bot.on('end',()=>{if(getBot()===bot){tasks.cancel('连接已断开 / Disconnected');release();}});},
    async handle(method,url,data){
      if(method==='GET'&&url.pathname==='/snapshot')return snapshot();
      if(method==='GET'&&url.pathname==='/do/status')return tasks.status();
      if(method==='GET'&&url.pathname==='/places')return {ok:true,places:places()};
      if(method==='POST'&&url.pathname==='/do')return doTask(data);
      if(method==='POST'&&url.pathname==='/go'){
        const place=loadPlaces()[data.name];if(!place)return {ok:false,state:'failed',arrived:false,reason:'没有这个地点 / Place not found'};
        if(!online()||place.dimension!==getBot().game?.dimension)return {ok:false,state:'failed',arrived:false,reason:'地点不在当前维度 / Place is in another dimension'};
        const [x,y,z]=place.position;const result=await doTask({intent:'goto',x,y,z,waitSec:data.waitSec});return {...result,arrived:result.state==='done'};
      }
      if(method==='POST'&&url.pathname==='/places'){
        if(trial)throw new Error('试用身体不保存地点 / Trial bodies do not save places');
        if(data.action==='rm'){const all=loadPlaces();delete all[data.name];writePlaces(all);return {ok:true};}
        if(data.action==='here'){if(!online())throw new Error('身体离线 / Body offline');savePlace(data.name,getBot().entity.position,getBot().game?.dimension);}
        else if(data.action==='add'){if(![data.x,data.y,data.z].every(Number.isFinite))throw new Error('需要有效坐标 / Valid coordinates required');savePlace(data.name,data,data.dimension||getBot()?.game?.dimension||'overworld');}
        else throw new Error('未知地点操作 / Unknown place action');
        return {ok:true,places:places()};
      }
      return null;
    },
    close(){clearInterval(scan);clearInterval(tick);tasks.cancel();release();},
  };
}
