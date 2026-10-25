import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {managedPath,downloadVerified} from './downloads.js';
export const skinPending='自定义皮肤尚未完成 Paper 26.1、原版客户端显示及存档迁移验收，暂未开放。原版世界和已有存档可继续使用。';
export function paperAvailability(pin){
 const ready=pin?.paper?.releaseVerified===true;
 return {available:ready,message:ready?'':skinPending,versions:ready?[pin.paper.minecraftVersion]:[]};
}
export function paperForVersion(pin,version){
 if(!paperAvailability(pin).available)throw new Error(skinPending);
 const paper=pin.paper;
 if(paper.minecraftVersion!==version)throw new Error('Paper 固定版本与所选 Minecraft 版本不一致，请选择已验证的版本或改用原版。');
 if(!Number.isInteger(paper.build)||paper.build<1||!/^\d+(?:\.\d+){1,2}$/.test(version)||!/^[a-f0-9]{64}$/i.test(paper.sha256||''))throw new Error('Paper 固定版本与 build 信息不完整，请改用原版。');
 return paper;
}
export async function prepareWorldComponents(root,directory,archive,{algorithm,expected,skin,fetch,signal,progress}={}){
 await managedPath(root,directory);const exists=Boolean(await fs.stat(directory).catch(e=>{if(e.code!=='ENOENT')throw e;return null;}));
 const staging=exists?directory:await managedPath(root,path.join(path.dirname(directory),`.preparing-${randomUUID()}`));
 try{
  await fs.mkdir(staging,{recursive:true});const jar=await managedPath(root,path.join(staging,'server.jar'));
  await fs.copyFile(archive,jar,fs.constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
  if(createHash(algorithm).update(await fs.readFile(jar)).digest('hex')!==expected)throw new Error('Existing world component was changed; manage it in advanced settings / 世界组件已被修改，请在高级设置中管理');
  if(skin){
   if(!/^[a-f0-9]{128}$/i.test(skin.sha512||''))throw new Error('SkinsRestorer 固定校验值不完整，请改用原版。');
   await downloadVerified({root,url:skin.url,file:await managedPath(root,path.join(staging,'plugins','SkinsRestorer.jar')),sha512:skin.sha512,size:skin.size,fetch,signal,progress});
  }
  signal?.throwIfAborted();if(!exists){await managedPath(root,directory);await fs.rename(staging,directory);}return {created:!exists};
 }finally{if(!exists){await managedPath(root,staging);await fs.rm(staging,{recursive:true,force:true});}}
}
