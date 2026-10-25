import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import QRCode from 'qrcode';
import { EnvHttpProxyAgent } from 'undici';
import { javaRuntime, portOpen, withWorldLock,bodyStatus } from './world.js';
import { readJson, writeJson, atomicWrite, serialized } from './files.js';
import { managedPath, officialJSON, downloadVerified, extractZip, findManagedFile } from './downloads.js';
import { exec } from './runner.js';
import {knownGood,assertPinnedRelease,assertAuthenticode,authenticode,InstallerTrustError} from './installer-trust.js';
import {buildVersionCatalog,bodySupportsVersion} from './mc-versions.js';
import {prepareMojangJava} from './mc-java.js';
import {discoverLan,pingMinecraft} from './lan.js';
import {inspectExistingWorld,javaMajor} from './mc-sources.js';

async function freePorts(count,exclude=[]) {
  const servers=[];
  try {
    while(servers.length<count){const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});if(exclude.includes(server.address().port)){await new Promise(r=>server.close(r));continue;}servers.push(server);}
    return servers.map(s=>s.address().port);
  } finally {await Promise.all(servers.map(s=>new Promise(r=>s.listening?s.close(r):r())));}
}
export class SetupManager {
  constructor(store,options={}) {
    this.store=store;this.root=store.paths.root;this.options=options;
    if(!options.fetch&&(process.env.HTTPS_PROXY||process.env.https_proxy||process.env.HTTP_PROXY||process.env.http_proxy))this.dispatcher=new EnvHttpProxyAgent();
    this.fetch=options.fetch||((url,init={})=>globalThis.fetch(url,{...init,...(this.dispatcher?{dispatcher:this.dispatcher}:{})}));
    this.jobs=new Map();this.records={};this.controllers=new Set();this.closed=false;
    this.file=path.join(this.root,'setup-state.json');this.privateFile=path.join(this.root,'setup-private.json');
  }
  async init() {
    this.records=await readJson(this.file,{});
    for(const record of Object.values(this.records))if(record.running){record.running=false;record.phase='interrupted';}
  }
  status(){return structuredClone(this.records);}
  async mark(id,patch){this.records[id]={...this.records[id],...patch};await serialized(this.file,()=>writeJson(this.file,this.records));return structuredClone(this.records[id]);}
  async job(id,work) {
    if(this.closed)throw new Error('Setup is closed');
    if(this.jobs.get(id)?.running)return structuredClone(this.records[id]);
    const controller=new AbortController(),record={id:randomUUID(),phase:'preparing',running:true,bytes:0,total:0};
    this.controllers.add(controller);this.records[id]=record;
    const active={running:true,controller};this.jobs.set(id,active);
    active.promise=Promise.resolve().then(()=>withWorldLock(path.join(this.root,'setup-locks',id),()=>work(controller.signal)))
      .catch(async error=>this.mark(id,{phase:controller.signal.aborted?'cancelled':(id==='qq'||error.manualRequired)?'manual-required':'error',error:error.cmd?'Preparation failed; use the manual guide or advanced diagnostics / 准备失败，请使用手动说明或查看高级诊断':String(error.message).slice(0,300)}))
      .finally(async()=>{active.running=false;this.controllers.delete(controller);await this.mark(id,{running:false});});
    await serialized(this.file,()=>writeJson(this.file,this.records));return structuredClone(record);
  }
  async wait(id){await this.jobs.get(id)?.promise;}
  requireConsent(body){if(body?.downloadConsent!==true)throw new Error('Confirm official downloads first / 请先确认下载官方组件');}
  requireWindows(){if((this.options.platform||process.platform)!=='win32')throw new Error('Guided component preparation currently supports Windows / 一键准备目前支持 Windows');}
  progress(id){return value=>{if(this.records[id])Object.assign(this.records[id],value);};}
  async componentFile(...parts){return managedPath(this.root,path.join(this.root,'components',...parts));}
  async unpackComponent(archive,directory,expectedName,signal) {
    if(await fs.stat(directory).catch(()=>null)){
      const existing=await findManagedFile(this.root,directory,name=>name.toLowerCase()===expectedName);
      if(existing)return directory;
      // Preserve an incomplete previous attempt and prepare a fresh runtime copy.
      directory=await managedPath(this.root,directory+'-repair-'+randomUUID());
    }
    const staging=await managedPath(this.root,directory+'.preparing-'+randomUUID());
    await (this.options.extract||extractZip)(this.root,archive,staging,signal);
    if(!await findManagedFile(this.root,staging,name=>name.toLowerCase()===expectedName))throw new Error('Component preparation incomplete / 组件准备未完成，请重试');
    signal?.throwIfAborted();await managedPath(this.root,directory);await managedPath(this.root,staging);await fs.rename(staging,directory);return directory;
  }
  async versionCatalog(){
    if(this.catalog&&Date.now()-this.catalogAt<60000)return this.catalog;
    this.manifest=await officialJSON('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',{fetch:this.fetch});
    this.catalog=buildVersionCatalog(this.manifest);this.catalogAt=Date.now();return this.catalog;
  }
  async qqTrust(){const pin=this.options.knownGood||await knownGood();return {version:pin.version,asset:pin.asset,sha256:pin.sha256,hashPrefix:pin.sha256.slice(0,8),automaticExecution:pin.automaticExecution===true,manualUrl:pin.manualUrl||'https://napneko.github.io/guide/boot/Shell'};}
  async java(signal,requirement={majorVersion:21,component:'java-runtime-delta'}) {
    const minimum=requirement.majorVersion||21;
    const config=await this.store.read();
    try {const runtime=await (this.options.java||javaRuntime)(config.mc.javaPath);if(javaMajor(runtime.version)>=minimum)return runtime.file;} catch {}
    await this.mark('mc',{phase:'downloading-java',bytes:0,total:0});
    if(minimum>21){const binary=await prepareMojangJava(this.root,{major:minimum,component:requirement.component,fetch:this.fetch,signal,progress:this.progress('mc')});await javaRuntime(binary);return binary;}
    const arch=process.arch==='arm64'?'aarch64':'x64';
    const releases=await officialJSON(`https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=${arch}&image_type=jre&os=windows`,{fetch:this.fetch,signal});
    const artifact=releases[0]?.binary?.package;if(!artifact?.checksum)throw new Error('Official Java metadata unavailable / 暂时无法获取 Java，请重试');
    const archive=await this.componentFile('cache',`java-${artifact.checksum}.zip`);
    await downloadVerified({root:this.root,url:artifact.link,file:archive,sha256:artifact.checksum,size:artifact.size,fetch:this.fetch,signal,progress:this.progress('mc')});
    await this.mark('mc',{phase:'extracting-java'});
    const directory=await this.unpackComponent(archive,await this.componentFile(`java-${artifact.checksum}`),'java.exe',signal);
    const binary=await findManagedFile(this.root,directory,name=>name.toLowerCase()==='java.exe');
    if(!binary)throw new Error('Java preparation incomplete / Java 准备未完成，请重试');
    await javaRuntime(binary);return binary;
  }
  async startMinecraft(body={}) {
    const source=body.source||'managed';if(!['managed','lan','existing'].includes(source))throw new Error('Choose a world source / 请选择世界来源');
    if(source==='managed'){this.requireConsent(body);if(body.eulaAccepted!==true)throw new Error('Accept the Minecraft agreement first / 请先阅读并同意 Minecraft 协议');}
    this.requireWindows();
    return this.job('mc',async signal=>{
      if(source==='lan')return this.connectLan(signal);
      if(source==='existing')return this.connectExisting(body,signal);
      const catalog=await this.versionCatalog(),selected=body.version||catalog.defaultVersion;
      const choice=catalog.versions.find(v=>v.id===selected);
      if(!choice||choice.state==='unavailable')throw new Error('This version is unavailable / 该版本不可选，请选择正式版');
      if(choice.state==='server-only'&&body.acknowledgeServerOnly!==true)throw new Error('This version cannot host the character body yet / 该版本身体暂不支持，请选择支持版本，或确认只创建世界');
      await this.options.beforeSwitch?.({source:'managed',directory:path.join(this.root,'worlds',`companion-${selected}`),version:selected});
      const configBefore=await this.store.read();
      if(configBefore.mc.source==='lan'){if(await bodyStatus(this.root,configBefore.mc))throw new Error('Disconnect the current world first / 请先断开当前世界，再切换版本');}
      else if(configBefore.mc.serverDir&&configBefore.mc.version!==selected&&await portOpen('127.0.0.1',configBefore.mc.port))throw new Error('Close your current world before switching versions / 请先关闭当前世界，再切换版本；旧世界会保留');
      const version=this.manifest.versions.find(v=>v.id===selected),metadata=await officialJSON(version.url,{fetch:this.fetch,signal}),artifact=metadata.downloads?.server;
      if(!artifact?.sha1)throw new Error('Official world metadata unavailable');
      const javaPath=await this.java(signal,metadata.javaVersion);
      await this.mark('mc',{phase:'downloading-world',bytes:0,total:0});
      const archive=await this.componentFile('cache',`minecraft-${artifact.sha1}.jar`);
      await downloadVerified({root:this.root,url:artifact.url,file:archive,sha1:artifact.sha1,size:artifact.size,fetch:this.fetch,signal,progress:this.progress('mc')});
      signal.throwIfAborted();await this.mark('mc',{phase:'preparing-world'});
      const directory=await managedPath(this.root,path.join(this.root,'worlds',`companion-${selected}`));
      await fs.mkdir(directory,{recursive:true});await managedPath(this.root,path.join(directory,'server.jar'));
      await fs.copyFile(archive,path.join(directory,'server.jar'),fs.constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
      if(createHash('sha1').update(await fs.readFile(path.join(directory,'server.jar'))).digest('hex')!==artifact.sha1)throw new Error('Existing world component was changed; manage it in advanced settings / 世界组件已被修改，请在高级设置中管理');
      const config=await this.store.read(),properties=path.join(directory,'server.properties');let port,commandPort,testPort;
      await managedPath(this.root,properties);
      const previousProperties=await fs.readFile(properties,'utf8').catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
      if(previousProperties!==null){
        port=Number(/^server-port=(\d+)/m.exec(previousProperties)?.[1]);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('World settings need attention in advanced settings / 请在高级设置中检查世界配置');
        if(config.mc.serverDir===directory)({commandPort,testPort}=config.mc);else [commandPort,testPort]=await freePorts(2,[port]);
      }
      else {
        if(config.mc.serverDir&&await portOpen('127.0.0.1',config.mc.port))throw new Error('Close your current world before preparing a new one / 请先关闭当前世界，再创建新世界');
        [port,commandPort,testPort]=await freePorts(3);
        await fs.writeFile(properties,[`server-port=${port}`,'server-ip=127.0.0.1','online-mode=false','enforce-secure-profile=false','max-players=4','view-distance=6','simulation-distance=4','spawn-protection=0','level-name=companion-world','motd=Companion local world','enable-rcon=false'].join('\n')+'\n',{flag:'wx'});
      }
      await managedPath(this.root,path.join(directory,'eula.txt'));await atomicWrite(path.join(directory,'eula.txt'),'# Explicitly accepted in the Companion setup wizard\neula=true\n');
      signal.throwIfAborted();
      await this.store.save({mc:{enabled:true,source:'managed',serverDir:directory,jar:'server.jar',javaPath,host:'127.0.0.1',port,commandPort,testPort,version:selected,auth:'offline'}});
      await this.options.connected?.('mc');
      await this.mark('mc',{phase:'starting-world',address:`127.0.0.1:${port}`,version:selected});
      signal.throwIfAborted();if(this.options.startWorld)await this.options.startWorld(signal);
      await this.mark('mc',{phase:choice.state==='supported'?'complete':'server-only-ready',address:`127.0.0.1:${port}`,version:selected,bodySupported:choice.state==='supported',source:'managed'});
    });
  }
  async connectLan(signal){
    await this.mark('mc',{phase:'discovering-lan',source:'lan'});const found=await(this.options.discoverLan||discoverLan)({timeoutMs:4000,signal});
    if(!found?.found)throw new Error(found?.message||'先在游戏里进入单人世界 → Esc → 对局域网开放 → 再回来点重试');
    const actual=await(this.options.ping||pingMinecraft)(found.host,found.port);signal.throwIfAborted();
    if(actual.version&&!bodySupportsVersion(actual.version))throw new Error('该版本身体暂不支持，请在游戏中使用支持的版本后重试');
    await this.options.beforeSwitch?.({source:'lan',host:found.host,port:found.port,version:actual.version});
    const [commandPort,testPort]=await freePorts(2,[found.port]);
    await this.store.save({mc:{enabled:true,source:'lan',serverDir:'',host:found.host,port:found.port,version:actual.version||'',commandPort,testPort}});
    await this.options.connected?.('mc');await this.mark('mc',{phase:'starting-world'});signal.throwIfAborted();await this.options.startWorld?.(signal);
    return this.mark('mc',{phase:'complete',source:'lan',address:`${found.host}:${found.port}`,version:actual.version||'',bodySupported:true,modWarning:true});
  }
  async connectExisting(body,signal){
    await this.mark('mc',{phase:'checking-existing',source:'existing'});
    const config=await this.store.read(),report=await(this.options.inspectExisting||inspectExistingWorld)(body.directory,{javaPath:body.javaPath||config.mc.javaPath,java:this.options.java});
    await this.mark('mc',{checks:report.checks});if(!report.ok)throw new Error(report.checks.filter(c=>!c.ok).map(c=>c.message).join('\n'));
    await this.options.beforeSwitch?.({source:'existing',directory:report.directory,host:'127.0.0.1',port:report.port,version:report.version});
    const [commandPort,testPort]=await freePorts(2,[report.port]);signal.throwIfAborted();
    await this.store.save({mc:{enabled:true,source:'existing',serverDir:report.directory,jar:'server.jar',host:'127.0.0.1',port:report.port,version:report.version||'',javaPath:report.javaPath,commandPort,testPort}});
    await this.options.connected?.('mc');await this.mark('mc',{phase:'starting-world'});await this.options.startWorld?.(signal);
    return this.mark('mc',{phase:bodySupportsVersion(report.version)?'complete':'server-only-ready',source:'existing',address:`127.0.0.1:${report.port}`,version:report.version,bodySupported:bodySupportsVersion(report.version)});
  }
  async startQQ(body={}) {
    this.requireConsent(body);this.requireWindows();
    if(!/^\d{5,12}$/.test(body.ownerId||'')||!/^\d{5,12}$/.test(body.selfId||'')||body.ownerId===body.selfId)throw new Error('Enter your QQ and a different character QQ / 请填写你和角色的两个不同 QQ 号');
    return this.job('qq',async signal=>{
      await this.mark('qq',{phase:'downloading-helper'});
      const release=await officialJSON('https://api.github.com/repos/NapNeko/NapCatQQ/releases/latest',{fetch:this.fetch,signal});
      const pin=this.options.knownGood||await knownGood(),artifact=assertPinnedRelease(release,pin),checksum=pin.sha256;
      const archive=await this.componentFile('cache',`napcat-${checksum}.zip`);
      await downloadVerified({root:this.root,url:artifact.browser_download_url,file:archive,sha256:checksum,size:artifact.size,fetch:this.fetch,signal,progress:this.progress('qq')});
      const directory=await this.unpackComponent(archive,await this.componentFile(`qq-helper-${checksum}`),'napcatinstaller.exe',signal);
      const installer=await findManagedFile(this.root,directory,name=>name.toLowerCase()==='napcatinstaller.exe');if(!installer)throw new Error('Helper installer not found / 安装助手准备失败，请重试');
      const previous=await readJson(this.privateFile,{});
      await writeJson(this.privateFile,{...previous,qq:{directory,installer,archive,pinVersion:pin.version,pinHash:pin.sha256,ownerId:body.ownerId,selfId:body.selfId}});
      await this.mark('qq',{phase:'helper-ready',version:pin.version,hashPrefix:pin.sha256.slice(0,8)});
    });
  }
  async openQQInstaller(body={}) {
    this.requireWindows();const state=(await readJson(this.privateFile,{})).qq;
    if(!state?.installer)throw new Error('Prepare the QQ helper first');
    const pin=this.options.knownGood||await knownGood();
    if(body.confirmExecution!==true||body.version!==pin.version||body.sha256!==pin.sha256)throw new Error('Confirm the displayed version and hash before execution / 请先确认显示的版本号与哈希，再执行');
    try{
    if(state.pinVersion!==pin.version||state.pinHash!==pin.sha256)throw new InstallerTrustError('安装助手不是当前信任锚版本，请使用手动安装说明');
    await managedPath(this.root,state.installer);await managedPath(this.root,state.directory);await managedPath(this.root,state.archive);
    if(createHash('sha256').update(await fs.readFile(state.archive)).digest('hex')!==pin.sha256)throw new InstallerTrustError('安装助手文件校验失败，请使用手动安装说明');
    const signature=await(this.options.verifySignature||authenticode)(state.installer);assertAuthenticode(signature,pin);
    if(this.options.openInstaller)await this.options.openInstaller(state.installer);
    else {const child=spawn(state.installer,[],{cwd:state.directory,windowsHide:false,detached:true,stdio:'ignore'});await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();}
    await writeJson(this.privateFile,{...(await readJson(this.privateFile,{})),qq:{...state,executionApproved:true}});return this.mark('qq',{phase:'install-helper'});
    }catch(error){await this.mark('qq',{phase:'manual-required',error:error.cmd?'安装助手校验未完成，请使用手动安装说明':error.message});throw error;}
  }
  async launchQQ() {
    this.requireWindows();const state=(await readJson(this.privateFile,{})).qq;
    if(!state?.directory)throw new Error('Prepare the QQ helper first');
    if(!state.executionApproved)throw new InstallerTrustError('安装助手没有通过执行校验，请按手动说明接入 NapCat');
    const launcher=await findManagedFile(this.root,state.directory,name=>name.toLowerCase()==='napcat.bat',8);
    const moduleFile=await findManagedFile(this.root,state.directory,name=>name.toLowerCase()==='napcat.mjs',10);
    if(!launcher||!moduleFile)throw new Error('Complete the installation in the helper window, then retry / 请先在助手窗口完成安装，再点击继续');
    const configDirectory=await managedPath(this.root,path.join(path.dirname(moduleFile),'config'));await fs.mkdir(configDirectory,{recursive:true});
    const [port]=await freePorts(1),token=randomBytes(24).toString('hex');
    const configFile=await managedPath(this.root,path.join(configDirectory,`onebot11_${state.selfId}.json`));
    const existing=await readJson(configFile,{});const servers=(existing.network?.websocketServers||[]).filter(x=>x.name!=='dsh-companion');
    servers.push({name:'dsh-companion',enable:true,host:'127.0.0.1',port,token,messagePostFormat:'array',reportSelfMessage:false,enableForcePushEvent:true,heartInterval:30000,debug:false});
    await writeJson(configFile,{...existing,network:{...existing.network,websocketServers:servers}});
    await this.store.saveSecrets('qq',{token});await this.store.save({owner:{id:state.ownerId},qq:{enabled:true,selfId:state.selfId,wsUrl:`ws://127.0.0.1:${port}`}});
    if(this.options.launchHelper)await this.options.launchHelper(launcher,state.selfId);
    else await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command','Start-Process -FilePath $env:COMPANION_HELPER_LAUNCH -ArgumentList $env:COMPANION_HELPER_ACCOUNT -WorkingDirectory $env:COMPANION_HELPER_DIR -WindowStyle Normal'],{windowsHide:true,timeout:10000,env:{...process.env,COMPANION_HELPER_LAUNCH:launcher,COMPANION_HELPER_ACCOUNT:state.selfId,COMPANION_HELPER_DIR:path.dirname(launcher)}});
    await this.options.connected?.('qq');return this.mark('qq',{phase:'waiting-login'});
  }
  async requestBili(url) {
    if(this.closed)throw new Error('Setup is closed');
    const response=await this.fetch(url,{redirect:'manual',signal:AbortSignal.timeout(10000),headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com/'}});
    if(!response.ok)throw new Error('Login service unavailable / 登录服务暂不可用，请重试');
    return response;
  }
  async startBili() {
    const response=await this.requestBili('https://passport.bilibili.com/x/passport-login/web/qrcode/generate');const result=await response.json();
    const data=result.data;let loginURL;try{loginURL=new URL(data?.url);}catch{}
    if(result.code!==0||!data?.qrcode_key||loginURL?.protocol!=='https:'||!['passport.bilibili.com','account.bilibili.com'].includes(loginURL.hostname)||loginURL.username||loginURL.password||loginURL.port)throw new Error('Could not create login code / 暂时无法获取二维码，请重试');
    const id=randomUUID();this.bili={id,key:data.qrcode_key,expires:Date.now()+180000};
    const image=await (this.options.qrImage||QRCode.toDataURL)(data.url,{width:220,margin:2});
    return {id,phase:'waiting-scan',image};
  }
  async pollBili({id}={}) {
    const login=this.bili;if(!login||login.id!==id||Date.now()>login.expires)throw new Error('Login code expired / 二维码已失效，请重新获取');
    const response=await this.requestBili(`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${encodeURIComponent(login.key)}`),result=await response.json();
    if(this.bili!==login||this.closed)throw new Error('Login code expired / 二维码已失效');
    if(result.code!==0)throw new Error('Login check failed / 登录检查失败，请重试');
    const code=result.data?.code;
    if(code===86038){this.bili=null;return {phase:'expired'};}
    if(code===86090)return {phase:'confirm-on-phone'};
    if(code!==0)return {phase:'waiting-scan'};
    const fields={};
    for(const line of response.headers.getSetCookie())for(const cookie of line.split(/,(?=\s*[A-Za-z_]+=)/)){const m=/^\s*(SESSDATA|bili_jct|buvid3)=([^;]*)/.exec(cookie);if(m)fields[m[1]==='SESSDATA'?'sessdata':m[1]]=m[2];}
    if(result.data?.url){const url=new URL(result.data.url);for(const key of ['SESSDATA','bili_jct','buvid3'])if(!fields[key==='SESSDATA'?'sessdata':key]&&url.searchParams.has(key))fields[key==='SESSDATA'?'sessdata':key]=url.searchParams.get(key);}
    if(!fields.sessdata)throw new Error('Login was not confirmed; obtain a new code / 登录尚未确认，请重新扫码');
    this.bili=null;await this.store.saveSecrets('bili',fields);await this.store.save({bili:{enabled:true}});await this.options.connected?.('bili');return {phase:'complete'};
  }
  async cancel({id}={}) {if(id==='bili'){this.bili=null;return {ok:true};}if(!['mc','qq'].includes(id))throw new Error('Invalid setup channel');this.jobs.get(id)?.controller?.abort();return {ok:true};}
  close(){this.closed=true;this.bili=null;for(const controller of this.controllers)controller.abort();this.dispatcher?.destroy().catch(()=>{});}
}
