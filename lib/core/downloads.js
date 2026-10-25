import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { exec } from './runner.js';

export function officialURL(value) {
  const url = new URL(value);
  const hosts = ['piston-meta.mojang.com','launchermeta.mojang.com','piston-data.mojang.com','launcher.mojang.com','api.adoptium.net','release-assets.githubusercontent.com','objects.githubusercontent.com'];
  const github = url.hostname === 'github.com' && /^\/(?:NapNeko\/NapCatQQ|adoptium\/temurin21-binaries)\/releases\/download\//.test(url.pathname);
  const githubMetadata = url.hostname === 'api.github.com' && url.pathname === '/repos/NapNeko/NapCatQQ/releases/latest';
  if (url.protocol !== 'https:' || url.username || url.password || url.port || (!hosts.includes(url.hostname) && !github && !githubMetadata)) throw new Error('Only official download sources are allowed / 仅允许官方组件来源');
  return url.href;
}
export async function managedPath(root, file) {
  const base = path.resolve(root), target = path.resolve(file), relative = path.relative(base,target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Managed path escapes character data');
  let current = base;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current,part);
    const st = await fs.lstat(current).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
    if (st?.isSymbolicLink()) throw new Error('Managed component paths cannot contain links / 组件目录不能是链接');
  }
  return target;
}
async function request(url,{fetch:fetcher=globalThis.fetch,signal,timeout=30000}={}) {
  let current = officialURL(url);
  for (let i=0;i<6;i++) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);let response;
    try{response=await fetcher(current,{redirect:'manual',signal:signal?AbortSignal.any([signal,controller.signal]):controller.signal,headers:{'User-Agent':'dsh-companion','Accept':'application/json, application/octet-stream;q=0.9'}});}finally{clearTimeout(timer);}
    if ([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get('location');await response.body?.cancel();
      if(!location)throw new Error('Official download returned an invalid redirect');
      current=officialURL(new URL(location,current).href);continue;
    }
    if(!response.ok)throw new Error(`Official source returned ${response.status} / 官方下载暂不可用，请稍后重试`);
    return response;
  }
  throw new Error('Too many download redirects');
}
export async function officialJSON(url,options) {
  const response=await request(url,options),chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>5*1024*1024)throw new Error('Official metadata is too large');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function downloadVerified({root,url,file,sha256,sha1,size,fetch:fetcher=globalThis.fetch,signal,progress=()=>{},maxBytes=384*1024*1024,stallMs=45000}) {
  officialURL(url);await managedPath(root,file);
  const algorithm=sha256?'sha256':'sha1',expected=sha256||sha1;
  if(!new RegExp(`^[a-f0-9]{${algorithm==='sha256'?64:40}}$`,'i').test(expected||''))throw new Error('Official checksum missing / 官方校验值缺失，已停止下载');
  try {
    const existing=await fs.readFile(file);
    if(createHash(algorithm).update(existing).digest('hex').toLowerCase()===expected.toLowerCase()){progress({bytes:existing.length,total:existing.length});return file;}
    throw new Error('Existing component checksum differs; keep it and retry in a clean component directory');
  } catch(e) {if(e.code!=='ENOENT')throw e;}
  await fs.mkdir(path.dirname(file),{recursive:true});await managedPath(root,file);
  const temporary=file+'.partial-'+randomUUID();let handle,reader,timer;const cancellation=new AbortController();
  try {
    const combined=signal?AbortSignal.any([signal,cancellation.signal]):cancellation.signal;
    const response=await request(url,{fetch:fetcher,signal:combined,timeout:60000});
    const total=Number(response.headers.get('content-length'))||size||0;
    if(total>maxBytes)throw new Error('Component download exceeds size limit');
    handle=await fs.open(temporary,'wx');const hash=createHash(algorithm);let bytes=0;reader=response.body.getReader();
    while(true){
      let next;
      try{next=await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Download made no progress / 下载暂时没有进展，请检查网络后重试')),stallMs);})]);}finally{clearTimeout(timer);}
      if(next.done)break;const chunk=next.value;combined.throwIfAborted();bytes+=chunk.length;if(bytes>maxBytes)throw new Error('Component download exceeds size limit');hash.update(chunk);await handle.write(chunk);progress({bytes,total});
    }
    if((size&&bytes!==size)||hash.digest('hex').toLowerCase()!==expected.toLowerCase())throw new Error('Download checksum failed / 下载校验失败，请重试');
    await handle.close();handle=undefined;await managedPath(root,file);await fs.rename(temporary,file);return file;
  } finally {clearTimeout(timer);cancellation.abort();reader?.cancel().catch(()=>{});await handle?.close();await fs.unlink(temporary).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
export async function extractZip(root,archive,destination,signal) {
  if(process.platform!=='win32')throw new Error('Component preparation currently requires Windows');
  await managedPath(root,archive);await managedPath(root,destination);await fs.mkdir(destination,{recursive:false});
  // Validate all entries before extraction. No shell interpolation of archive paths.
  const script = `Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($env:COMPANION_ZIP)
$basePath = [IO.Path]::GetFullPath($env:COMPANION_EXTRACT) + [IO.Path]::DirectorySeparatorChar
try {
  if ($zip.Entries.Count -gt 25000) { throw 'Archive contains too many entries' }
  [long]$total = 0
  foreach ($entry in $zip.Entries) {
    $name = $entry.FullName.Replace('\\','/')
    if ($name -match '(^/|:|(^|/)\\.\\.(/|$))' -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'Unsafe archive entry' }
    $target = [IO.Path]::GetFullPath([IO.Path]::Combine($basePath,$name))
    if (-not $target.StartsWith($basePath,[StringComparison]::OrdinalIgnoreCase)) { throw 'Archive path escapes destination' }
    $total += $entry.Length
    if ($total -gt 2147483648) { throw 'Expanded archive is too large' }
  }
} finally { $zip.Dispose() }
[IO.Compression.ZipFile]::ExtractToDirectory($env:COMPANION_ZIP,$env:COMPANION_EXTRACT)`;
  await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:120000,signal,env:{...process.env,COMPANION_ZIP:archive,COMPANION_EXTRACT:destination}});
}
export async function findManagedFile(root,directory,predicate,depth=5) {
  await managedPath(root,directory);
  for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isSymbolicLink())continue;
    if(entry.isFile()&&predicate(entry.name))return file;
    if(entry.isDirectory()&&depth>0){const found=await findManagedFile(root,file,predicate,depth-1);if(found)return found;}
  }
  return null;
}
