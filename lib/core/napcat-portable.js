import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {managedPath,extractZip} from './downloads.js';
import {readJson,writeJson,atomicWrite} from './files.js';
const required=['napcat.bat','node.exe','index.js','wrapper.node','napcat/napcat.mjs'];
export const isPortable=pin=>pin?.mode==='portable'&&pin.asset==='NapCat.Shell.Windows.Node.zip';
const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
export function portableBootstrapSource(){return `// Owned process-local data bridge for the reviewed NapCat native loader.
'use strict';
const path=require('node:path');
const fs=require('node:fs');
const file=path.resolve(__dirname,'wrapper.node').toLowerCase();
const load=process.dlopen;
process.dlopen=function(module,filename,...flags){
 const result=Reflect.apply(load,this,[module,filename,...flags]);
 if(path.resolve(filename).toLowerCase()!==file)return result;
 const native=module.exports,original=native.NodeQQNTWrapperUtil;
 if(typeof original?.getNTUserDataInfoConfig!=='function')throw new Error('Unsupported portable native data interface');
 const data=path.join(__dirname,'profile','qq-data');
 const util=new Proxy(Object.create(null),{get:(_,key)=>{
  if(key==='getNTUserDataInfoConfig')return ()=>{fs.writeFileSync(path.join(__dirname,'companion-data-scope.json'),JSON.stringify({directory:data,pid:process.pid}));return data;};
  const value=Reflect.get(original,key,original);
  return typeof value==='function'?value.bind(original):value;
 }});
 const scoped=Object.create(native);
 Object.defineProperty(scoped,'NodeQQNTWrapperUtil',{value:util});
 module.exports=scoped;
 return result;
};
`;}
export async function verifyPortable(root,directory,pin){
 await managedPath(root,directory);const manifest=await readJson(path.join(directory,'.companion-portable.json'),{});
 if(manifest.sha256!==pin.sha256||manifest.version!==pin.version)throw new Error('Portable runtime needs preparation / 便携版目录尚未完成校验，请重新准备');
 for(const name of required){const file=await managedPath(root,path.join(directory,name));if(!manifest.files?.[name]||await hash(file)!==manifest.files[name])throw new Error('Portable runtime changed / 便携版运行文件已改变，请备份该目录后重新准备');}
 return {directory,node:path.join(directory,'node.exe'),script:path.join(directory,'index.js'),module:path.join(directory,'napcat','napcat.mjs')};
}
export async function preparePortable(root,archive,pin,{signal,extract=extractZip}={}){
 const directory=await managedPath(root,path.join(root,'qq','napcat'));await fs.mkdir(path.dirname(directory),{recursive:true});
 if(await fs.stat(directory).catch(()=>null))return verifyPortable(root,directory,pin);
 const staging=await managedPath(root,path.join(root,'qq',`.napcat-preparing-${randomUUID()}`));
 try{
  await extract(root,archive,staging,signal);signal?.throwIfAborted();const files={};
  for(const name of required)files[name]=await hash(await managedPath(root,path.join(staging,name)));
  await writeJson(path.join(staging,'.companion-portable.json'),{version:pin.version,sha256:pin.sha256,files});
  await managedPath(root,directory);await fs.rename(staging,directory);return verifyPortable(root,directory,pin);
 }finally{await managedPath(root,staging);await fs.rm(staging,{recursive:true,force:true});}
}
export async function launchPortable(root,info,{selfId,signal,onSpawn,isLoggedIn,spawnProcess=spawn,startupMs=60000,pollMs=500}={}){
 signal?.throwIfAborted();
 // Equivalent to the reviewed root napcat.bat. Never run inner launcher*.bat,
 // installer executables, shell elevation helpers or system QQ processes.
 const profile=await managedPath(root,path.join(info.directory,'profile'));await fs.mkdir(profile,{recursive:true});
  await fs.mkdir(await managedPath(root,path.join(profile,'qq-data')),{recursive:true});
  const bootstrap=await managedPath(root,path.join(info.directory,'companion-bootstrap.cjs'));await atomicWrite(bootstrap,portableBootstrapSource());
  const previousQr=await managedPath(root,path.join(info.directory,'napcat','cache','qrcode.png'));
  await fs.unlink(previousQr).catch(e=>{if(e.code!=='ENOENT')throw e;});
 const log=await fs.open(await managedPath(root,path.join(info.directory,'companion-startup.log')),'a');let child;
 try{
  child=spawnProcess(info.node,['--require',bootstrap,info.script,'-q',selfId],{cwd:info.directory,windowsHide:true,stdio:['ignore',log.fd,log.fd],env:{...process.env,USERPROFILE:profile,HOME:profile,APPDATA:path.join(profile,'AppData','Roaming'),LOCALAPPDATA:path.join(profile,'AppData','Local'),NAPCAT_DISABLE_MULTI_PROCESS:'1',NAPCAT_DISABLE_PIPE:'1'}});
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});onSpawn?.(child);
 }finally{await log.close();}
 const abort=()=>child.kill();signal?.addEventListener('abort',abort,{once:true});
 try{
  const deadline=Date.now()+startupMs;while(Date.now()<deadline){
   signal?.throwIfAborted();if(child.exitCode!==null)throw new Error('NapCat could not start / NapCat 启动未完成，请检查便携版日志或使用手动接入');
   if(isLoggedIn&&await isLoggedIn())return {child,phase:'complete'};
   const qr=await readPortableLogin(root,info.directory);if(qr.image)return {child,phase:'waiting-login'};
   await new Promise(r=>setTimeout(r,pollMs));
  }
  throw new Error('NapCat login service timed out / NapCat 暂时未能取得登录二维码，请检查网络后重试');
 }catch(error){if(child.exitCode===null)child.kill();throw error;}
 finally{signal?.removeEventListener('abort',abort);}
}
export async function readPortableLogin(root,directory){
 const file=await managedPath(root,path.join(directory,'napcat','cache','qrcode.png'));
 const stat=await fs.stat(file).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});if(!stat)return {phase:'starting-login'};
 if(stat.size>1024*1024)throw new Error('Invalid login image');const data=await fs.readFile(file);
 if(!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Invalid login image');
 return {phase:'waiting-login',image:`data:image/png;base64,${data.toString('base64')}`};
}
