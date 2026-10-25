import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {SetupManager} from '../lib/core/setup.js';
import {ConfigStore} from '../lib/core/config.js';
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
