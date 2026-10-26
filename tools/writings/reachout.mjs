import {ROOT,CONFIG} from '../runtime.mjs';
import {dailyStatus,markReachout} from '../../lib/core/daily.js';
const [cmd='status',...args]=process.argv.slice(2);
try{
  if(cmd==='status'||cmd==='show')console.log(JSON.stringify(await dailyStatus(ROOT,'reachout',CONFIG.life.timeZone),null,2));
  else if(cmd==='mark'){if(!CONFIG.life.reachout.enabled)throw new Error('主动找你尚未启用 / Reach-out is disabled');console.log(JSON.stringify(await markReachout(ROOT,{text:args.filter(x=>x!=='--skip').join(' '),skip:args.includes('--skip'),zone:CONFIG.life.timeZone})));}
  else throw new Error('reachout status|show|mark "text" [--skip]');
}catch(e){console.error(e.message);process.exitCode=e.code==='DAILY_DUPLICATE'?3:1;}
