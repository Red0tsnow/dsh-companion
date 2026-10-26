import fs from 'node:fs/promises';
import path from 'node:path';
// Cross-process exclusion. Never steal an uncertain lock; a terminated writer can be
// recovered explicitly by removing its .lock file after confirming it has stopped.
export async function withFileLock(file,work,{timeoutMs=5000}={}) {
  await fs.mkdir(path.dirname(file),{recursive:true});const lock=file+'.lock',until=Date.now()+timeoutMs;let handle;
  while(!handle){try{handle=await fs.open(lock,'wx',0o600);}catch(e){if(e.code!=='EEXIST')throw e;if(Date.now()>=until)throw new Error('记录正在使用，请稍后重试 / Record is busy; try again');await new Promise(r=>setTimeout(r,100));}}
  try{await handle.writeFile(JSON.stringify({pid:process.pid,at:new Date().toISOString()}));return await work();}finally{await handle.close();await fs.rm(lock,{force:true});}
}
