import fs from 'node:fs/promises';
import path from 'node:path';
import { paths } from './paths.js';
import { atomicWrite, readJson } from './files.js';
import { withFileLock } from './data-lock.js';

export function dayKey(now=new Date(),timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone){const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));return `${parts.year}-${parts.month}-${parts.day}`;}
export async function readLedger(file){try{return (await fs.readFile(file,'utf8')).split('\n').filter(Boolean).map(l=>JSON.parse(l));}catch(e){if(e.code==='ENOENT')return [];throw new Error('日常账本损坏，请恢复备份 / Daily ledger is unreadable; restore a backup');}}
function ledgerFile(root,kind){if(!['diary','reachout'].includes(kind))throw new Error('未知日常功能 / Unknown daily feature');return path.join(paths(root).work,kind+'.jsonl');}
export async function dailyStatus(root,kind,zone){const date=dayKey(new Date(),zone||undefined),rows=await readLedger(ledgerFile(root,kind));let emptyDays=0;
  if(kind==='diary'){const since=(await readJson(path.join(paths(root).root,'life-state.json'))).diaryStartedDay;const start=new Date(date+'T12:00:00Z');for(let n=1;n<=3;n++){const d=new Date(start);d.setUTCDate(d.getUTCDate()-n);const key=d.toISOString().slice(0,10);if(!since||key<since)break;const row=rows.findLast(r=>r.date===key);if(row?.kind==='written')break;emptyDays++;}}
  return {date,today:rows.findLast(r=>r.date===date)||null,recent:rows.slice(-7),emptyDays,warning:kind==='diary'&&emptyDays>=3?'连续三天没有日记，可以关心一下角色 / No diary for three days; check in with your character':null};
}
export function validateReachout(text){text=String(text||'').trim();if(!text||Array.from(text).length>40||/[\r\n]/.test(text)||/在吗|在干嘛|今天怎么样|\bare you there\b|\bwhat are you doing\b|\bhow (?:was|is) your day\b/i.test(text))throw new Error('主动消息须为 40 字以内的一句话，不能打卡问候 / Reach-out must be one personal line, at most 40 characters, without check-in greetings');return text;}
export async function markReachout(root,{text='',skip=false,zone}={}){const file=ledgerFile(root,'reachout');return withFileLock(file,async()=>{const rows=await readLedger(file),date=dayKey(new Date(),zone||undefined);if(rows.some(r=>r.date===date)){const e=new Error('今天已经主动过或决定跳过 / Already reached out or skipped today');e.code='DAILY_DUPLICATE';throw e;}if(!skip)text=validateReachout(text);const row={date,at:new Date().toISOString(),kind:skip?'skipped':'sent',text:skip?'':text};await atomicWrite(file,[...rows,row].map(r=>JSON.stringify(r)).join('\n')+'\n');return {ok:true,...row};});}
export async function writeDiary(root,{text='',skip=false,zone}={}){
  const p=paths(root),file=ledgerFile(root,'diary');return withFileLock(file,async()=>{
    const rows=await readLedger(file),date=dayKey(new Date(),zone||undefined);if(rows.some(r=>r.date===date)){const e=new Error('今天已有日记记录 / Diary already recorded today');e.code='DAILY_DUPLICATE';throw e;}
    const diary=path.join(p.work,'diary.md'),pending=path.join(p.work,'diary-pending.json');
    let old=await fs.readFile(diary,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
    let recovery;try{recovery=JSON.parse(await fs.readFile(pending,'utf8'));}catch(e){if(e.code!=='ENOENT')throw new Error('日记写入记录损坏 / Diary recovery record is unreadable');}
    if(recovery){if(!old.endsWith(recovery.append))throw new Error('上次日记写入未完成，请恢复备份后重试 / Interrupted diary write; restore before retrying');if(!rows.some(r=>r.date===recovery.row.date)){rows.push(recovery.row);await atomicWrite(file,rows.map(r=>JSON.stringify(r)).join('\n')+'\n');}await fs.rm(pending,{force:true});if(recovery.row.date===date)return {ok:true,recovered:true,...recovery.row};}
    const lines=String(text).replace(/\r\n?/g,'\n').trim().split('\n').map(s=>s.trim());
    if(!skip&&((lines.length!==1&&(lines.length<3||lines.length>6))||lines.some(s=>!s||s.startsWith('#'))||lines.join('\n').length>6000))throw new Error('日记需要 3–6 行正文；平淡的一天可写一行实话，不要手写日期标题 / Diary needs 3–6 lines, or one honest quiet-day line; omit headings');
    const row={date,at:new Date().toISOString(),kind:skip?'skipped':'written',lines:skip?0:lines.length};
    if(!skip){const heading='## '+date.slice(5);if(old.split(/\r?\n/).some(l=>l.trim()===heading))throw new Error('已有今天的日期标题，请核对账本，不重复追加 / Today\'s heading already exists; reconcile the ledger before writing');const append=(old?old.endsWith('\n')?'\n':'\n\n':'')+heading+'\n'+lines.join('\n')+'\n';await atomicWrite(pending,JSON.stringify({row,append}));await atomicWrite(diary,old+append);}
    await atomicWrite(file,[...rows,row].map(r=>JSON.stringify(r)).join('\n')+'\n');if(!skip)await fs.rm(pending,{force:true});return {ok:true,...row};
  });
}
