import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {createHash} from 'node:crypto';
import {auditReleaseGuards} from '../scripts/check.mjs';
import {ConfigStore} from '../lib/core/config.js';
import {SetupManager} from '../lib/core/setup.js';
const versions=await import('../lib/core/mc-versions.js').catch(()=>({}));
const trust=await import('../lib/core/installer-trust.js').catch(()=>({}));
const lan=await import('../lib/core/lan.js').catch(()=>({}));
const sources=await import('../lib/core/mc-sources.js').catch(()=>({}));
const models=await import('../lib/core/model-status.js').catch(()=>({}));
const known={version:'v1.2.3',asset:'NapCat.Shell.Windows.OneKey.zip',sha256:'a'.repeat(64),publisherSubject:'CN=Fixture Publisher',automaticExecution:true};

test('release audit rejects malformed anchors, literal versions and missing download/execution guards',async()=>{
  const source=await fs.readFile(new URL('../lib/core/setup.js',import.meta.url),'utf8');
  assert.deepEqual(auditReleaseGuards(known,source),[]);
  for(const pin of [{...known,sha256:'x'.repeat(64)},{...known,version:''},{...known,asset:''}])assert.ok(auditReleaseGuards(pin,source).length);
  for(const changed of [source+'\nconst MC_VERSION="1.21.8";',source.replace('artifact=assertPinnedRelease(release,pin)','artifact=release.assets[0]'),source.replace('assertAuthenticode(signature,pin);',''),source.replace('const signature=await(this.options.verifySignature||authenticode)(state.installer);','const signature={status:"Valid"};')])assert.ok(auditReleaseGuards(known,changed).length);
});

test('QQ manager rejects changed releases without downloading or executing and falls back to manual instructions',async t=>{
  for(const change of ['asset','digest','version']){
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-trust-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));let downloads=0,executions=0;
    const release={tag_name:change==='version'?'v9':known.version,assets:[{name:change==='asset'?'other.zip':known.asset,digest:'sha256:'+(change==='digest'?'b'.repeat(64):known.sha256),browser_download_url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/file.zip'}]};
    const manager=new SetupManager(new ConfigStore(root),{platform:'win32',knownGood:known,fetch:async url=>{if(String(url).includes('/releases/latest'))return Response.json(release);downloads++;throw new Error('Unexpected download');},openInstaller:async()=>executions++});t.after(()=>manager.close());
    await manager.startQQ({downloadConsent:true,ownerId:'12345',selfId:'90001'});await manager.wait('qq');
    assert.equal(manager.status().qq.phase,'manual-required');assert.match(manager.status().qq.error,/上游有新版本/);assert.equal(downloads,0);assert.equal(executions,0);
  }
});

test('QQ manager never executes or launches when Authenticode validation fails',async t=>{
  for(const signature of [{status:'NotSigned',subject:null},{status:'Valid',subject:'CN=Wrong'}]){
    const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-signature-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));let executions=0;const bytes=Buffer.from('fixture zip'),pin={...known,sha256:createHash('sha256').update(bytes).digest('hex')};
    const manager=new SetupManager(new ConfigStore(root),{platform:'win32',knownGood:pin,fetch:async url=>String(url).includes('/releases/latest')?Response.json({tag_name:pin.version,assets:[{name:pin.asset,digest:'sha256:'+pin.sha256,browser_download_url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/file.zip'}]}):new Response(bytes),extract:async(_,a,d)=>{await fs.mkdir(d,{recursive:true});await fs.writeFile(path.join(d,'NapCatInstaller.exe'),'fixture');},verifySignature:async()=>signature,openInstaller:async()=>executions++,launchHelper:async()=>executions++});t.after(()=>manager.close());
    await manager.startQQ({downloadConsent:true,ownerId:'12345',selfId:'90001'});await manager.wait('qq');assert.equal(manager.status().qq.phase,'helper-ready');
    await assert.rejects(manager.openQQInstaller({confirmExecution:true,version:pin.version,sha256:pin.sha256}),/签名|发布者/);assert.equal(manager.status().qq.phase,'manual-required');await assert.rejects(manager.launchQQ(),/手动|校验/);assert.equal(executions,0);
  }
});
test('pinned helper rejects changed asset, digest and version before any download',()=>{
  assert.equal(typeof trust.assertPinnedRelease,'function');
  const release={tag_name:known.version,assets:[{name:known.asset,digest:'sha256:'+known.sha256}]};
  assert.equal(trust.assertPinnedRelease(release,known).name,known.asset);
  for(const changed of [{...release,tag_name:'v1.2.4'},{...release,assets:[{...release.assets[0],name:'other.zip'}]},{...release,assets:[{...release.assets[0],digest:'sha256:'+'b'.repeat(64)}]}])assert.throws(()=>trust.assertPinnedRelease(changed,known),/上游有新版本/);
});
test('installer execution requires explicit version/hash confirmation and a valid expected publisher',()=>{
  assert.equal(typeof trust.assertAuthenticode,'function');
  assert.doesNotThrow(()=>trust.assertAuthenticode({status:'Valid',subject:known.publisherSubject},known));
  for(const signature of [{status:'NotSigned',subject:null},{status:'UnknownError',subject:known.publisherSubject},{status:'Valid',subject:'CN=Another Publisher'}])assert.throws(()=>trust.assertAuthenticode(signature,known),/签名|发布者/);
  assert.throws(()=>trust.assertAuthenticode({status:'Valid',subject:'CN=Somebody'},{...known,publisherSubject:null,automaticExecution:false}),/发布者|手动/);
});
test('version catalog chooses the newest supported release and labels unsupported and preview versions',()=>{
  assert.equal(typeof versions.buildVersionCatalog,'function');
  const manifest={versions:[{id:'1.21.7',type:'release'},{id:'26.3',type:'release'},{id:'26.1',type:'release'},{id:'26.4-snapshot-5',type:'snapshot'},{id:'1.21.8',type:'release'}]};
  const catalog=versions.buildVersionCatalog(manifest,['1.21.7','1.21.8','26.1']);
  assert.equal(catalog.defaultVersion,'26.1');assert.equal(catalog.versions.some(v=>v.id==='1.21.7'),false);
  assert.equal(catalog.versions.find(v=>v.id==='26.3').state,'server-only');assert.equal(catalog.versions.find(v=>v.id==='26.4-snapshot-5').state,'unavailable');
  assert.equal(versions.buildVersionCatalog(manifest,['1.21.8','26.1','26.3']).defaultVersion,'26.3');
  assert.equal(versions.buildVersionCatalog(manifest,[]).defaultVersion,null);
});
test('LAN discovery shares one implementation, validates announcement ports and closes its socket',async()=>{
  assert.equal(typeof lan.discoverLan,'function');const socket=new EventEmitter();let closed=0;
  socket.bind=(_,fn)=>fn();socket.addMembership=()=>{};socket.close=()=>closed++;
  const pending=lan.discoverLan({timeoutMs:100,socketFactory:()=>socket});
  socket.emit('message',Buffer.from('[MOTD]Bad[/MOTD][AD]70000[/AD]'),{address:'127.0.0.1'});
  socket.emit('message',Buffer.from('[MOTD]Local game[/MOTD][AD]25588[/AD]'),{address:'192.168.1.10'});
  const result=await pending;assert.equal(result.found,true);assert.equal(result.host,'192.168.1.10');assert.equal(result.port,25588);assert.equal(closed,1);
});
test('missing LAN announcements and socket errors return a bounded recoverable result',async()=>{
  const make=()=>{const s=new EventEmitter();s.bind=(_,fn)=>fn();s.addMembership=()=>{};s.close=()=>{};return s;};
  const no=await lan.discoverLan({timeoutMs:15,socketFactory:make});assert.equal(no.found,false);assert.match(no.message,/对局域网开放/);
  const socket=make(),waiting=lan.discoverLan({timeoutMs:100,socketFactory:()=>socket});socket.emit('error',new Error('blocked'));assert.equal((await waiting).ok,false);
});
test('existing server inspection reports missing files, old Java and occupied ports without writing EULA',async t=>{
  assert.equal(typeof sources.inspectExistingWorld,'function');const dir=await fs.mkdtemp(path.join(os.tmpdir(),'companion-existing-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  let report=await sources.inspectExistingWorld(dir,{java:async()=>({file:'java',version:'21'}),inspectJar:async()=>({id:'26.1',java_version:25}),portOpen:async()=>false});
  assert.equal(report.ok,false);assert.ok(report.checks.some(c=>c.id==='jar'&&!c.ok));assert.ok(report.checks.some(c=>c.id==='properties'&&!c.ok));
  await fs.writeFile(path.join(dir,'server.jar'),'fixture');await fs.writeFile(path.join(dir,'server.properties'),'server-port=25686\n');await fs.writeFile(path.join(dir,'eula.txt'),'eula=true\n');
  report=await sources.inspectExistingWorld(dir,{java:async()=>({file:'java',version:'openjdk version "21.0.1"'}),inspectJar:async()=>({id:'26.1',java_version:25}),portOpen:async()=>true,processFacts:async()=>({listenerPid:7,processes:[]})});
  assert.ok(report.checks.some(c=>c.id==='java'&&!c.ok));assert.ok(report.checks.some(c=>c.id==='port'&&!c.ok));
  assert.equal(await fs.readFile(path.join(dir,'eula.txt'),'utf8'),'eula=true\n');
  report=await sources.inspectExistingWorld(dir,{java:async()=>({file:'java25',version:'openjdk version "25.0.1"'}),inspectJar:async()=>({id:'26.1',java_version:25}),portOpen:async()=>false});assert.equal(report.ok,true);assert.equal(report.port,25686);
});
test('model status is unknown without public evidence and unconfigured for a missing model or sign-in',async()=>{
  assert.equal(typeof models.hostModelStatus,'function');
  assert.equal((await models.hostModelStatus({get:()=>undefined})).state,'unknown');
  const ctx=services=>({get:name=>services[name]});
  assert.equal((await models.hostModelStatus(ctx({agentDefaultModel:{currentSelection:()=>({})}}))).state,'unconfigured');
  const services={agentDefaultModel:{currentSelection:()=>({provider:'workbuddy-cn',model:'model'})},llm:{listProviders:()=>[{id:'workbuddy-cn'}],listModels:async()=>[{id:'model'}],listConfigurableProviders:()=>[{provider:'workbuddy-cn',nativeAuth:{oauth:true,env:[]}}]},credentials:{describeRecord:async()=>({configured:false})}};
  assert.equal((await models.hostModelStatus(ctx(services))).state,'unconfigured');
  services.credentials.describeRecord=async()=>({configured:true});
  assert.equal((await models.hostModelStatus(ctx(services))).state,'unknown');
  assert.equal((await models.hostModelStatus(ctx(services),{lastSuccess:{provider:'workbuddy-cn',model:'model',at:Date.now()}})).state,'available');
});
test('LAN and existing-server branches connect without downloading or writing a server EULA',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'companion-sources-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const store=new ConfigStore(dir);let downloads=0,starts=0;
  const manager=new SetupManager(store,{platform:'win32',fetch:async()=>{downloads++;throw new Error('No downloads allowed');},discoverLan:async()=>({ok:true,found:true,host:'127.0.0.1',port:25686,motd:'test'}),ping:async()=>({version:'26.1'}),inspectExisting:async()=>({ok:true,checks:[],directory:path.join(dir,'existing'),port:25687,version:'26.1',javaMajor:25,javaPath:'java25'}),startWorld:async()=>{starts++;return {body:{online:true}};}});t.after(()=>manager.close());
  await manager.startMinecraft({source:'lan'});await manager.wait('mc');assert.equal(manager.status().mc.phase,'complete');assert.equal((await store.read()).mc.source,'lan');
  await manager.startMinecraft({source:'existing',directory:path.join(dir,'existing')});await manager.wait('mc');assert.equal(manager.status().mc.phase,'complete');assert.equal((await store.read()).mc.source,'existing');assert.equal(downloads,0);assert.equal(starts,2);await assert.rejects(fs.access(path.join(dir,'existing','eula.txt')));
});
test('LAN no-announcement, unreachable port and existing-server validation failures stay local',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'companion-source-errors-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const manager=new SetupManager(new ConfigStore(dir),{platform:'win32',discoverLan:async()=>({ok:true,found:false,message:'先对局域网开放'}),inspectExisting:async()=>({ok:false,checks:[{id:'jar',ok:false,message:'缺少 server.jar'}]})});t.after(()=>manager.close());
  await manager.startMinecraft({source:'lan'});await manager.wait('mc');assert.equal(manager.status().mc.phase,'error');assert.match(manager.status().mc.error,/局域网/);
  manager.options.discoverLan=async()=>({ok:true,found:true,host:'127.0.0.1',port:25686});manager.options.ping=async()=>{throw new Error('公告端口连不上');};
  await manager.startMinecraft({source:'lan'});await manager.wait('mc');assert.match(manager.status().mc.error,/连不上/);
  await manager.startMinecraft({source:'existing',directory:'fixture'});await manager.wait('mc');assert.deepEqual(manager.status().mc.checks,[{id:'jar',ok:false,message:'缺少 server.jar'}]);
});

test('changing managed versions creates separate worlds and retains the previous world',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-world-versions-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const store=new ConfigStore(root),bytes=Buffer.from('fixture server'),sha1=createHash('sha1').update(bytes).digest('hex');
  const manager=new SetupManager(store,{platform:'win32',java:async()=>({file:'java25',version:'25'}),startWorld:async()=>{},fetch:async url=>String(url).includes('version_manifest')?Response.json({versions:['1.21.8','26.1'].map(id=>({id,type:'release',url:`https://piston-meta.mojang.com/${id}.json`}))}):String(url).endsWith('.json')?Response.json({javaVersion:{majorVersion:25},downloads:{server:{sha1,url:'https://piston-data.mojang.com/server.jar',size:bytes.length}}}):new Response(bytes)});t.after(()=>manager.close());
  for(const version of ['1.21.8','26.1']){await manager.startMinecraft({version,downloadConsent:true,eulaAccepted:true});await manager.wait('mc');assert.equal(manager.status().mc.phase,'complete',manager.status().mc.error);}
  const dirs=await fs.readdir(path.join(root,'worlds'));assert.ok(dirs.includes('companion-1.21.8')&&dirs.includes('companion-26.1'));assert.deepEqual(await fs.readFile(path.join(root,'worlds/companion-1.21.8/server.jar')),bytes);assert.equal((await store.read()).mc.version,'26.1');
});
