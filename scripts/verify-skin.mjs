// Opt-in real pinned Paper integration. All mutations stay in .dev.
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {CompanionService} from '../lib/core/service.js';
import {VERSION} from '../lib/core/version.js';
import {bodyStatus,worldStatus,processFacts,portOpen,delay} from '../lib/core/world.js';
import {readJson} from '../lib/core/files.js';
import {prepareWorldComponents} from '../lib/core/world-components.js';
if(!process.argv.includes('--local-assets'))throw Error('Pass --local-assets to reuse the isolated, already accepted author spike');
const root=path.resolve('.dev/skin-release-verification'),source=path.resolve('.dev/skin-client-acceptance/server'),server=path.join(root,'server');
const report={packageVersion:VERSION,at:new Date().toISOString(),kind:'real-Paper-supervisor-command-channel',checks:[]};
const mark=(name,detail={})=>{report.checks.push({name,pass:true,...detail});console.log(JSON.stringify({check:name,...detail}));};
const pin=await readJson('tools/known-good.json'),exec=promisify(execFile);
await fs.mkdir(root,{recursive:true});
if(!await fs.stat(server).catch(()=>null))await fs.cp(source,server,{recursive:true,force:false,errorOnExist:true,filter:file=>{const rel=path.relative(source,file).replaceAll('\\','/');return rel!=='plugins/SkinsRestorer'&&!rel.startsWith('plugins/SkinsRestorer/');}});
const originalHash=createHash('sha256').update(await fs.readFile(path.join(source,'paper.jar'))).digest('hex');
assert.equal(originalHash,pin.paper.sha256);
await prepareWorldComponents(root,server,path.join(source,'paper.jar'),{algorithm:'sha256',expected:pin.paper.sha256,skin:pin.skinsrestorer});
const servers=[];for(let i=0;i<3;i++){const s=net.createServer();await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(0,'127.0.0.1',resolve);});servers.push(s);}
const ports=servers.map(s=>s.address().port);await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));
const props=await fs.readFile(path.join(server,'server.properties'),'utf8');await fs.writeFile(path.join(server,'server.properties'),props.replace(/^server-port=\d+/m,`server-port=${ports[0]}`));
const service=new CompanionService(root);let config,pluginDisabled=false;
const plugin=path.join(server,'plugins','SkinsRestorer.jar'),disabled=path.join(root,'SkinsRestorer-disabled.jar');
try{
  await service.init();await service.store.save({runtime:{nodePath:process.execPath},mc:{enabled:true,source:'managed',serverType:'paper',version:'1.21.8',serverDir:server,jar:'server.jar',javaPath:'C:/Program Files/Java/jdk-21/bin/java.exe',username:'SkinRelease',memoryMb:1024,port:ports[0],commandPort:ports[1],testPort:ports[2]}});
  config=await service.store.read();
  const up=await service.channels.adapters.mc.actions.up();assert.equal(up.owned,true);mark('Paper starts through world.mjs up with verified process ownership');
  let body;for(let i=0;i<90;i++){body=await bodyStatus(root,config.mc);if(body?.online)break;await delay(500);}assert.equal(body?.online,true);mark('actual packaged body enters pinned 1.21.8',{username:body.username});
  const before=await readJson(service.store.paths.world),pidsBefore=(await processFacts(config.mc.port)).processes.filter(p=>p.jar).map(p=>p.pid).sort();
  const result=await service.request('POST','/setup/skin',{url:'https://textures.minecraft.net/texture/292009a4925b58f02c77dadc3ecef07ea4c7472f64e0fdc32ce5522489362680'});
  assert.equal(result.ok,true);assert.equal(result.results.length,2);assert.ok(result.results.every(r=>r.ok));report.commandReplies=result.results;mark('actual createcustom and skin set return explicit success through supervisor stdin');
  const after=await readJson(service.store.paths.world);for(const key of ['pid','startedAt','instance','launchId'])assert.equal(after[key],before[key]);assert.deepEqual((await processFacts(config.mc.port)).processes.filter(p=>p.jar).map(p=>p.pid).sort(),pidsBefore);mark('applying a skin does not start, stop, or replace any Java process');
  const {stdout}=await exec(process.execPath,[path.resolve('tools/mc/world.mjs'),'command','skin set companion_skin SkinRelease'],{env:{...process.env,DSH_COMPANION_HOME:root},windowsHide:true,timeout:120000});assert.equal(JSON.parse(stdout).ok,true);mark('whitelisted world.mjs command uses the same running supervisor');
  const custom=await readJson(path.join(server,'plugins/SkinsRestorer/skins/companion_skin.customskin'));assert.ok(custom.value&&custom.signature);assert.match(JSON.parse(Buffer.from(custom.value,'base64')).textures.SKIN.url,/292009a4925b58f02c77dadc3ecef07ea4c7472f64e0fdc32ce5522489362680/);mark('expected signed texture persists in the isolated plugin store');
  await service.channels.adapters.mc.actions.down();assert.equal(await portOpen('127.0.0.1',ports[0]),false);mark('command-enabled supervisor saves and stops cleanly');
  await fs.rename(plugin,disabled);pluginDisabled=true;await service.channels.adapters.mc.actions.up();
  await assert.rejects(service.request('POST','/setup/skin',{url:'https://textures.minecraft.net/texture/292009a4925b58f02c77dadc3ecef07ea4c7472f64e0fdc32ce5522489362680'}),e=>e.code==='PLUGIN_UNAVAILABLE');mark('a real world without SkinsRestorer reports plugin unavailable rather than success');
  assert.equal(createHash('sha256').update(await fs.readFile(path.join(source,'paper.jar'))).digest('hex'),originalHash);mark('source spike jar remains unchanged');
  report.result='passed';
}catch(e){report.result='failed';report.error=e.message;report.code=e.code;process.exitCode=1;console.error(e);}
finally{
  try{config=await service.store.read();if((await worldStatus(root,config.mc)).owned)await service.channels.adapters.mc.actions.down();}catch(e){report.cleanupError=e.message;process.exitCode=1;}
  if(pluginDisabled)await fs.rename(disabled,plugin);
  report.remainingListeners=[];for(const port of ports)if(await portOpen('127.0.0.1',port))report.remainingListeners.push(port);
  if(report.remainingListeners.length)process.exitCode=1;
  service.close();await fs.writeFile('artifacts/skin-release-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
