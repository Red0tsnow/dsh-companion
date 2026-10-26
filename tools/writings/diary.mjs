import fs from 'node:fs/promises';
import {ROOT,CONFIG} from '../runtime.mjs';
import {dailyStatus,writeDiary} from '../../lib/core/daily.js';
const [cmd='status',...args]=process.argv.slice(2);
try{
  if(cmd==='status'||cmd==='show')console.log(JSON.stringify(await dailyStatus(ROOT,'diary',CONFIG.life.timeZone),null,2));
  else if(cmd==='write'||cmd==='skip'){
    if(!CONFIG.life.diary.enabled)throw new Error('日记尚未启用 / Diary is disabled');
    const at=args.indexOf('--file'),text=at<0?args.join(' '):await fs.readFile(args[at+1],'utf8');
    console.log(JSON.stringify(await writeDiary(ROOT,{text,skip:cmd==='skip',zone:CONFIG.life.timeZone})));
  }else throw new Error('diary status|show|write --file <text-file>|skip');
}catch(e){console.error(e.message);process.exitCode=e.code==='DAILY_DUPLICATE'?3:1;}
