import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {SetupManager} from '../lib/core/setup.js';
import {ConfigStore} from '../lib/core/config.js';
import {EventEmitter} from 'node:events';
import {launchPortable} from '../lib/core/napcat-portable.js';
import vm from 'node:vm';
const portableModule=await import('../lib/core/napcat-portable.js');
const bytes=Buffer.from('reviewed portable fixture'),pin={version:'v-fixture',asset:'NapCat.Shell.Windows.Node.zip',sha256:createHash('sha256').update(bytes).digest('hex'),mode:'portable',automaticExecution:true};
const consent={downloadConsent:true,confirmExecution:true,version:pin.version,sha256:pin.sha256,ownerId:'12345',selfId:'90001'};
async function fixture(t,extra={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-portable-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));let downloads=0,launches=0,installers=0;
 const manager=new SetupManager(new ConfigStore(root),{platform:'win32',knownGood:pin,
 fetch:async url=>{if(String(url).includes('/releases/latest'))return Response.json({tag_name:pin.version,assets:[{name:pin.asset,digest:'sha256:'+pin.sha256,browser_download_url:'https://github.com/NapNeko/NapCatQQ/releases/download/v-fixture/portable.zip',size:bytes.length}]});downloads++;return new Response(bytes);},
 extract:async(_,a,d)=>{await fs.mkdir(path.join(d,'napcat'),{recursive:true});for(const name of ['napcat/napcat.mjs','node.exe','napcat.bat','wrapper.node','index.js'])await fs.writeFile(path.join(d,name),'fixture');},
 launchPortable:async info=>{launches++;assert.ok(info.directory.startsWith(path.join(root,'qq','napcat')));},openInstaller:async()=>installers++,...extra});t.after(()=>manager.close());return {root,manager,counts:()=>({downloads,launches,installers})};
}
test('portable setup requires matching execution consent before network access',async t=>{
 const {manager,counts}=await fixture(t);
 for(const body of [{...consent,confirmExecution:false},{...consent,version:'wrong'},{...consent,sha256:'0'.repeat(64)}])await assert.rejects(manager.startQQ(body),/确认|Confirm|hash|版本/);
 assert.deepEqual(counts(),{downloads:0,launches:0,installers:0});
});
test('portable QQ uses its data directory, starts once and waits for scan without an installer',async t=>{
 const {root,manager,counts}=await fixture(t);await manager.startQQ(consent);await manager.wait('qq');
 assert.equal(manager.status().qq.phase,'waiting-login',manager.status().qq.error);assert.deepEqual(counts(),{downloads:1,launches:1,installers:0});
 const state=JSON.parse(await fs.readFile(path.join(root,'setup-private.json'),'utf8'));assert.equal(path.resolve(state.qq.directory),path.join(root,'qq','napcat'));
 assert.equal((await manager.store.read()).qq.enabled,true);assert.equal(JSON.stringify(manager.status()).includes((await manager.store.secrets('qq')).token),false);
});
test('deleting a portable runtime permits preparation again using the verified cache',async t=>{
 const {root,manager,counts}=await fixture(t);await manager.startQQ(consent);await manager.wait('qq');assert.equal(manager.status().qq.phase,'waiting-login',manager.status().qq.error);
 await fs.rm(path.join(root,'qq','napcat'),{recursive:true});await manager.startQQ(consent);await manager.wait('qq');assert.equal(manager.status().qq.phase,'waiting-login',manager.status().qq.error);assert.equal(counts().downloads,1);assert.equal(counts().launches,2);
});
test('installer-only anchors keep the manual fallback and never run an installer',async t=>{
 const legacy={...pin,asset:'NapCat.Shell.Windows.OneKey.zip',mode:undefined,automaticExecution:false,publisherSubject:null};const {manager,counts}=await fixture(t,{knownGood:legacy});
 await manager.startQQ(consent);await manager.wait('qq');assert.equal(manager.status().qq.phase,'manual-required');assert.equal(counts().launches,0);assert.equal(counts().installers,0);
});

test('restart turns completed portable setup into a resumable state and needs fresh consent',async t=>{
 const {root,manager}=await fixture(t);await manager.startQQ(consent);await manager.wait('qq');await manager.mark('qq',{phase:'complete'});manager.close();let launches=0;
 const next=new SetupManager(new ConfigStore(root),{platform:'win32',knownGood:pin,launchPortable:async()=>{launches++;}});t.after(()=>next.close());await next.init();assert.equal(next.status().qq.phase,'reconnect-required');assert.equal(launches,0);
 await assert.rejects(next.resumeQQ({}),/确认|Confirm/);await next.resumeQQ(consent);await next.wait('qq');assert.equal(next.status().qq.phase,'waiting-login');assert.equal(launches,1);
});

async function launchFixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-qr-restart-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const directory=path.join(root,'qq','napcat');await fs.mkdir(path.join(directory,'napcat','cache'),{recursive:true});const child=new EventEmitter();child.exitCode=null;child.kill=()=>{child.exitCode=0;};return {root,directory,child,spawnProcess:()=>{queueMicrotask(()=>child.emit('spawn'));return child;}};
}
test('a previous QR image cannot satisfy a new portable launch',async t=>{
 const f=await launchFixture(t);await fs.writeFile(path.join(f.directory,'napcat','cache','qrcode.png'),Buffer.from([137,80,78,71,13,10,26,10]));
 await assert.rejects(launchPortable(f.root,{directory:f.directory,node:'fixture',script:'fixture'},{selfId:'90001',spawnProcess:f.spawnProcess,startupMs:25,pollMs:5}),/二维码|timed out/);assert.equal(f.child.exitCode,0);
});
test('a resumed saved login can complete without producing a new QR image',async t=>{
 const f=await launchFixture(t);const result=await launchPortable(f.root,{directory:f.directory,node:'fixture',script:'fixture'},{selfId:'90001',spawnProcess:f.spawnProcess,isLoggedIn:async()=>true,startupMs:25,pollMs:5});assert.equal(result.phase,'complete');f.child.kill();
});

test('portable bootstrap isolates native data paths without changing native global settings',()=>{
 assert.equal(typeof portableModule.portableBootstrapSource,'function');
 const directory=path.resolve('fixture'),file=path.join(directory,'wrapper.node');const util={};Object.defineProperty(util,'getNTUserDataInfoConfig',{value:()=> 'existing-system-QQ',writable:false,configurable:false});util.other= function(){return this===util;};
 const native={};Object.defineProperty(native,'NodeQQNTWrapperUtil',{value:util,writable:false,configurable:false});
 const scopedRequire=name=>name==='node:path'?path:name==='node:fs'?{writeFileSync:(file,text)=>assert.equal(JSON.parse(text).directory,path.join(directory,'profile','qq-data'))}:native;scopedRequire.resolve=()=>file;scopedRequire.cache={[file]:{exports:native}};
 const process={pid:42,dlopen:module=>{module.exports=native;}};vm.runInNewContext(portableModule.portableBootstrapSource(),{require:scopedRequire,__dirname:directory,process});
 const module={exports:{}};process.dlopen(module,file);const scoped=module.exports.NodeQQNTWrapperUtil;assert.equal(scoped.getNTUserDataInfoConfig(),path.join(directory,'profile','qq-data'));assert.equal(util.getNTUserDataInfoConfig(),'existing-system-QQ');assert.equal(scoped.other(),true);
});
