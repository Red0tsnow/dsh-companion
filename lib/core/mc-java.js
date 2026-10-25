import fs from 'node:fs/promises';
import path from 'node:path';
import {officialJSON,downloadVerified,managedPath} from './downloads.js';
const runtimeIndex='https://piston-meta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';
export async function prepareMojangJava(root,{major,component,fetch,signal,progress=()=>{}}){
  const all=await officialJSON(runtimeIndex,{fetch,signal}),platform=process.arch==='arm64'?'windows-arm64':'windows-x64';
  const runtime=(all[platform]?.[component]||[]).find(r=>Number(r.version?.name?.split('.')[0])>=major);
  if(!runtime?.manifest?.url||!/^[a-f0-9]{40}$/i.test(runtime.manifest.sha1||''))throw new Error(`No official Java ${major} runtime is available / 暂时无法获取 Java ${major}，请稍后重试或在高级设置中指定`);
  const manifest=await officialJSON(runtime.manifest.url,{fetch,signal}),entries=Object.entries(manifest.files||{});
  if(entries.length>25000||entries.some(([name,file])=>!name||path.isAbsolute(name)||name.split(/[\\/]/).includes('..')||name.includes(':')||!['directory','file'].includes(file.type)))throw new Error('Invalid official Java file list / 官方 Java 文件清单未通过检查');
  const total=entries.reduce((n,[,f])=>n+(f.downloads?.raw?.size||0),0);if(total>1024*1024*1024)throw new Error('Java runtime exceeds size limit');
  const directory=await managedPath(root,path.join(root,'components',`mojang-java-${major}-${runtime.manifest.sha1}`));await fs.mkdir(directory,{recursive:true});
  const files=entries.filter(([,f])=>f.type==='file');let index=0,bytes=0,failure;const received=new Map();
  await Promise.all(Array.from({length:6},async()=>{while(!failure&&index<files.length){const [name,entry]=files[index++];try{
    const artifact=entry.downloads?.raw;if(!artifact)throw new Error('Official Java file is missing download metadata');
    await downloadVerified({root,file:await managedPath(root,path.join(directory,name)),url:artifact.url,sha1:artifact.sha1,size:artifact.size,fetch,signal,progress:p=>{bytes+=p.bytes-(received.get(name)||0);received.set(name,p.bytes);progress({bytes,total});}});
  }catch(error){failure=error;}}}));
  if(failure)throw failure;signal?.throwIfAborted();return managedPath(root,path.join(directory,'bin','java.exe'));
}
