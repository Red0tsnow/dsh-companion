// Opt-in real official portable runtime, isolated profile, no account login.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {SetupManager} from '../lib/core/setup.js';
import {ConfigStore} from '../lib/core/config.js';
import {VERSION} from '../lib/core/version.js';
const root=path.resolve('.dev/040-portable-verification'),pin=JSON.parse(await fs.readFile('tools/known-good.json','utf8'));
let manager=new SetupManager(new ConfigStore(root));const report={kind:'real-pinned-portable-runtime-no-account-login',packageVersion:VERSION,at:new Date().toISOString(),checks:[],pending:['Real user QR confirmation and QQ round trip']};
const mark=name=>{report.checks.push({name,pass:true});console.log(name);};
try{
 await manager.init();const archive=await manager.componentFile('cache',`napcat-${pin.sha256}.zip`);await fs.mkdir(path.dirname(archive),{recursive:true});
 if(!await fs.stat(archive).catch(()=>null))await fs.copyFile('.dev/040-napcat-spike/portable.zip',archive);
 await manager.startQQ({downloadConsent:true,confirmExecution:true,version:pin.version,sha256:pin.sha256,ownerId:'12345',selfId:'90001'});let last='';const timer=setInterval(()=>{const phase=manager.status().qq?.phase;if(phase!==last){last=phase;console.log(phase);}},1000);
 try{await manager.wait('qq');}finally{clearInterval(timer);}assert.equal(manager.status().qq.phase,'waiting-login',manager.status().qq.error);
 mark('official pinned portable archive extracted and started without an installer');
 const login=await manager.qqLogin();assert.ok(login.image?.startsWith('data:image/png;base64,'));mark('actual QQ login QR obtained without account confirmation');
 const state=JSON.parse(await fs.readFile(path.join(root,'setup-private.json'),'utf8'));assert.equal(state.qq.directory,path.join(root,'qq','napcat'));mark('portable runtime resides under qq/napcat');
 report.pid=manager.portableChild.pid;assert.equal(manager.portableChild.exitCode,null);mark('actual bundled Node process remains alive while waiting for scan');
 const child=manager.portableChild;manager.close();for(let i=0;i<50&&child.exitCode===null&&child.signalCode===null;i++)await new Promise(r=>setTimeout(r,100));assert.ok(child.exitCode!==null||child.signalCode!==null);mark('plugin cleanup stops only its own portable process');
 const scope=JSON.parse(await fs.readFile(path.join(root,'qq','napcat','companion-data-scope.json'),'utf8'));assert.equal(scope.directory,path.join(root,'qq','napcat','profile','qq-data'));mark('actual native data accessor is redirected to the dedicated portable profile');
 manager=new SetupManager(new ConfigStore(root));await manager.init();assert.equal(manager.status().qq.phase,'reconnect-required');const before=Date.now();
 await manager.resumeQQ({confirmExecution:true,version:pin.version,sha256:pin.sha256});await manager.wait('qq');assert.equal(manager.status().qq.phase,'waiting-login',manager.status().qq.error);assert.ok((await fs.stat(path.join(root,'qq','napcat','napcat','cache','qrcode.png'))).mtimeMs>=before);mark('real restart obtains a new QR and does not reuse the previous image');
 report.result='passed';
}catch(e){report.result='failed';report.error=e.message;process.exitCode=1;console.error(e.message);}
finally{
 const active=manager.portableChild;manager.close();for(let i=0;i<50&&active?.exitCode===null&&active.signalCode===null;i++)await new Promise(r=>setTimeout(r,100));
 report.remainingOwnedPids=active&&active.exitCode===null&&active.signalCode===null?[active.pid]:[];if(report.remainingOwnedPids.length){report.result='failed';process.exitCode=1;}
 await fs.writeFile('artifacts/040-portable-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
