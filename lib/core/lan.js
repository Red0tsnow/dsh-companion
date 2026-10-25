import dgram from 'node:dgram';
import net from 'node:net';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export function discoverLan({timeoutMs=4000,signal,socketFactory=()=>dgram.createSocket({type:'udp4',reuseAddr:true})}={}){
  return new Promise(resolve=>{
    const socket=socketFactory();let settled=false;
    const done=result=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);try{socket.close();}catch{}resolve(result);};
    const abort=()=>done({ok:false,found:false,cancelled:true,message:'Discovery cancelled / 已取消寻找世界'});
    const timer=setTimeout(()=>done({ok:true,found:false,message:'Enter your single-player world, press Esc, open to LAN, then retry / 先在游戏里：进入单人世界 → Esc → 对局域网开放 → 再回来点重试'}),Math.min(15000,Math.max(1,timeoutMs)));
    socket.on('error',()=>done({ok:false,found:false,message:'LAN discovery is unavailable; check local network access and retry / 暂时无法寻找局域网世界，请检查本地网络访问后重试'}));
    socket.on('message',(buffer,remote)=>{
      const text=buffer.toString('utf8'),ad=/\[AD\](\d+)\[\/AD\]/.exec(text),port=Number(ad?.[1]);
      if(!ad||!Number.isInteger(port)||port<1||port>65535||net.isIP(remote?.address)!==4)return;
      const motd=/\[MOTD\]([\s\S]*?)\[\/MOTD\]/.exec(text)?.[1]?.trim().slice(0,160)||'';
      done({ok:true,found:true,host:remote.address,port,motd});
    });
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}
    try{socket.bind(4445,()=>{if(settled)return;try{socket.addMembership('224.0.2.60');}catch{done({ok:false,found:false,message:'LAN announcements are blocked; check local network permissions / 局域网公告暂不可用，请检查本地网络权限'});}});}catch{done({ok:false,found:false,message:'LAN discovery could not start / 暂时无法寻找世界，请重试'});}
  });
}
export function pingMinecraft(host,port,{timeoutMs=3000}={}){
  return new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>{done=true;reject(new Error('World port is unreachable / 找到世界了，但暂时连不上，请保持游戏开启后重试'));},timeoutMs);
    require('minecraft-protocol').ping({host,port,closeTimeout:timeoutMs},(error,response)=>{if(done)return;done=true;clearTimeout(timer);if(error)reject(new Error('World port is unreachable / 找到世界了，但暂时连不上，请保持游戏开启后重试'));else resolve({version:response.version?.name?.match(/\d+(?:\.\d+){1,2}/)?.[0]||'',description:response.description});});
  });
}
