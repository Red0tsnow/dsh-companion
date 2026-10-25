// Real vanilla server/body integration. The LAN announcement is explicitly a
// protocol fixture; this is not evidence of an actual Minecraft client opening LAN.
import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import dgram from 'node:dgram';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,expect} from '@playwright/test';
import {CompanionService} from '../lib/core/service.js';
import {bodyStatus,bodyRequest,worldStatus,portOpen,delay} from '../lib/core/world.js';
const workspace=path.resolve('.'),root=path.resolve('.dev/030-source-verification'),a=JSON.parse(await fs.readFile('artifacts/030-world-verification.json','utf8'));
assert.ok(a.managed.directory.startsWith(path.join(workspace,'.dev')+path.sep));
const report={kind:'real-existing-server-and-real-body-LAN-with-synthetic-UDP-announcement',at:new Date().toISOString(),checks:[],pending:['Actual Minecraft Java Edition client Open to LAN and host exit acceptance']};
const c=new CompanionService(path.join(root,'existing')),b=new CompanionService(path.join(root,'lan'));let server,announcer,timer,browser,preview;
const mark=name=>{report.checks.push({name,pass:true});console.log(name);};
const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function entered(service){for(let i=0;i<100;i++){const body=await bodyStatus(service.root,(await service.store.read()).mc);if(body?.online)return body;await delay(500);}throw new Error('Body did not join');}
async function screenshot(service,name){
 preview=spawn(process.execPath,['scripts/dev.mjs'],{windowsHide:true,env:{...process.env,PORT:'0',DSH_COMPANION_HOME:service.root},stdio:['ignore','pipe','pipe']});let stderr='';preview.stderr.on('data',d=>stderr+=d);
 const base=await new Promise((resolve,reject)=>{let out='';const timeout=setTimeout(()=>reject(new Error('Preview failed: '+stderr)),20000);preview.stdout.on('data',d=>{out+=d;const url=out.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timeout);resolve(url);}});preview.once('error',reject);});
 const page=await browser.newPage({viewport:{width:1240,height:1000}});await page.goto(base);await page.request.post(base+'/api/dsh-companion/adapters/mc/probe',{data:{}});await page.getByRole('button',{name:'刷新',exact:true}).click();const card=page.locator('[data-channel=mc]');await card.getByRole('button',{name:'连接向导',exact:true}).click();await expect(card.locator('.dsc-join')).toBeVisible();await card.screenshot({path:`artifacts/030-${name}-actual.png`});await page.close();preview.kill();preview=null;
}
try{
 await Promise.all([c.init(),b.init()]);for(const service of [c,b]){await service.store.save({runtime:{nodePath:process.execPath},mc:{javaPath:a.managed.javaPath,memoryMb:1024}});service.setup.fetch=async()=>{throw new Error('No network downloads allowed in B/C');};}
 const eula=path.join(a.managed.directory,'eula.txt'),before=await hash(eula);
 await c.request('POST','/setup/mc',{source:'existing',directory:a.managed.directory,javaPath:a.managed.javaPath});await c.setup.wait('mc');assert.equal(c.setup.status().mc.phase,'complete',c.setup.status().mc.error);await entered(c);mark('C existing real 26.1 server and body entered without downloading');assert.equal(await hash(eula),before);mark('C existing EULA byte-for-byte preserved');
 browser=await chromium.launch({channel:'msedge',headless:true});await screenshot(c,'existing');await c.channels.adapters.mc.actions.down();mark('C owned server shut down gracefully');
 const external=path.join(root,'external-server');await fs.mkdir(external,{recursive:true});await fs.copyFile(path.join(a.managed.directory,'server.jar'),path.join(external,'server.jar'));
 const free=net.createServer();await new Promise(r=>free.listen(0,'0.0.0.0',r));const port=free.address().port;await new Promise(r=>free.close(r));
 await fs.writeFile(path.join(external,'eula.txt'),'# Explicit test-only agreement; never written by source C\neula=true\n');await fs.writeFile(path.join(external,'server.properties'),`server-port=${port}\nserver-ip=\nonline-mode=false\nenforce-secure-profile=false\nview-distance=3\nsimulation-distance=3\nlevel-type=minecraft:flat\nmax-players=4\n`);
 const log=await fs.open(path.join(external,'verification.log'),'w');server=spawn(a.managed.javaPath,['-Xmx1024M','-Xms512M','-jar',path.join(external,'server.jar'),'nogui'],{cwd:external,windowsHide:true,stdio:['pipe',log.fd,log.fd]});await log.close();server.stdin.on('error',()=>{});let spawnError;server.once('error',e=>spawnError=e);
 for(let i=0;i<120&&!await portOpen('127.0.0.1',port);i++){if(spawnError)throw spawnError;if(server.exitCode!==null)throw new Error('External test server exited');await delay(500);}assert.equal(await portOpen('127.0.0.1',port),true);
 announcer=dgram.createSocket('udp4');await new Promise(r=>announcer.bind(0,r));announcer.setMulticastLoopback(true);timer=setInterval(()=>announcer.send(Buffer.from(`[MOTD]Explicit UDP test fixture[/MOTD][AD]${port}[/AD]`),4445,'224.0.2.60'),250);
 await b.request('POST','/setup/mc',{source:'lan'});await b.setup.wait('mc');assert.equal(b.setup.status().mc.phase,'complete',b.setup.status().mc.error);await entered(b);mark('B real UDP discovery and real body joined external vanilla server; announcement is synthetic');clearInterval(timer);timer=null;announcer.close();announcer=null;
 const cfg=await b.store.read();assert.equal(cfg.mc.serverDir,'');assert.equal((await worldStatus(b.root,cfg.mc)).owned,false);mark('B does not own external world or create a local server');await screenshot(b,'lan');
 await b.channels.adapters.mc.actions.leave();assert.equal(await portOpen('127.0.0.1',port),true);mark('B leaving disconnects only the body and keeps external world online');
 await delay(700);await b.channels.adapters.mc.actions.up();await entered(b);server.stdin.write('stop\n');for(let i=0;i<100&&server.exitCode===null;i++)await delay(300);assert.notEqual(server.exitCode,null);const status=await worldStatus(b.root,cfg.mc);assert.equal(status.state,'offline');assert.match(status.message,/世界已关闭/);mark('B host shutdown degrades to world closed');await b.channels.adapters.mc.actions.leave();server=null;
 report.result='passed';
}catch(e){report.result='failed';report.error=e.message;process.exitCode=1;console.error(e.stack);}
finally{
 clearInterval(timer);announcer?.close();preview?.kill();await browser?.close();
 if(server?.exitCode===null){server.stdin.write('stop\n');for(let i=0;i<100&&server.exitCode===null;i++)await delay(300);}
 try{const cfg=await c.store.read();if((await worldStatus(c.root,cfg.mc)).owned)await c.channels.adapters.mc.actions.down();await b.channels.adapters.mc.actions.leave();}catch(e){report.cleanupError=e.message;process.exitCode=1;}
 report.remainingListeners=[];for(const service of [c,b]){const cfg=await service.store.read();for(const port of [cfg.mc.commandPort,cfg.mc.testPort])if(await portOpen('127.0.0.1',port))report.remainingListeners.push(port);service.close();}
 await fs.writeFile('artifacts/030-source-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
