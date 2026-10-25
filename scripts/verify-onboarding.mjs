// Opt-in real downloads to a separate data directory. Never logs into an account.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CompanionService } from '../lib/core/service.js';
import { bodyStatus, bodyRequest, portOpen, worldStatus } from '../lib/core/world.js';
if(!process.argv.includes('--download'))throw new Error('Pass --download to allow official component downloads into .dev only');
const root=path.resolve('.dev/onboarding-verification'),service=new CompanionService(root);
const report={kind:'real-official-downloads-and-isolated-Minecraft',at:new Date().toISOString(),checks:[]};
const mark=name=>{report.checks.push({name,pass:true});console.log(name);};
let timer;
try {
  await service.init();
  // Prove the portable-Java fallback even on a developer machine with Java installed.
  service.setup.options.java=async()=>{throw new Error('Force portable Java verification');};
  await service.request('POST','/setup/mc',{downloadConsent:true,eulaAccepted:true});
  let lastPhase='';timer=setInterval(()=>{const current=service.setup.status().mc;if(current?.phase!==lastPhase){lastPhase=current?.phase;console.log(JSON.stringify({phase:lastPhase}));}},1000);
  await service.setup.wait('mc');clearInterval(timer);timer=null;
  assert.equal(service.setup.status().mc.phase,'complete',service.setup.status().mc.error);mark('confirmed official downloads prepared world and started through unified entry');
  const config=await service.store.read();assert.ok(config.mc.javaPath.startsWith(root));assert.ok(config.mc.serverDir.startsWith(root));mark('portable Java and world files stay in independent data directory');
  let body;for(let i=0;i<60;i++){body=await bodyStatus(root,config.mc);if(body?.online)break;await new Promise(r=>setTimeout(r,500));}
  assert.equal(body?.online,true);mark('actual body entered newly prepared local world');
  assert.equal((await bodyRequest(root,config.mc,'/around')).ok,true);mark('actual body observation works');
  await service.request('POST','/setup/qq',{downloadConsent:true,ownerId:'12345',selfId:'90001'});await service.setup.wait('qq');
  assert.equal(service.setup.status().qq.phase,'helper-ready',service.setup.status().qq.error);mark('official QQ installation helper downloaded verified and extracted without launching');
  const login=await service.request('POST','/setup/bili/start',{});assert.match(login.image,/^data:image\/png;base64,/);mark('official Bilibili endpoint returns a locally rendered scannable login code');
  await service.request('POST','/setup/cancel',{id:'bili'});assert.equal((await service.store.secrets('bili')).sessdata,undefined);mark('unscanned login code saves no account credential');
  report.result='passed';
}catch(e){report.result='failed';report.error=e.message;process.exitCode=1;console.error(e.message);}
finally{
  clearInterval(timer);
  const config=await service.store.read();
  if(config.mc.serverDir.startsWith(root+path.sep)){
    try {const world=await worldStatus(root,config.mc);if(world.owned)await service.channels.adapters.mc.actions.down();}
    catch(e){report.cleanupError=e.message;process.exitCode=1;}
    report.remainingListeners=[];for(const port of [config.mc.port,config.mc.commandPort,config.mc.testPort])if(await portOpen('127.0.0.1',port))report.remainingListeners.push(port);
    if(report.remainingListeners.length)process.exitCode=1;
  }
  service.close();await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/onboarding-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
