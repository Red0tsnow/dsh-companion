import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,expect} from '@playwright/test';
import {CompanionService} from '../lib/core/service.js';
import {bodyStatus,bodyRequest,worldStatus,portOpen,delay} from '../lib/core/world.js';
if(!process.argv.includes('--download'))throw new Error('Pass --download to prepare official Java/Minecraft components in an isolated .dev directory');
const root=path.resolve('.dev/030-world-verification'),service=new CompanionService(root),report={kind:'0.3.0-real-isolated-worlds',checks:[],at:new Date().toISOString()};
const mark=(name,detail={})=>{report.checks.push({name,pass:true,...detail});console.log(JSON.stringify({check:name,...detail}));};let timer,preview,browser;
async function entered(){for(let i=0;i<100;i++){const b=await bodyStatus(root,(await service.store.read()).mc);if(b?.online)return b;await delay(500);}throw new Error('Actual body did not enter world');}
try{
 await service.init();await service.store.save({runtime:{nodePath:process.execPath},mc:{memoryMb:1024}});
 const catalog=await service.setup.versionCatalog();report.defaultVersion=catalog.defaultVersion;report.catalog=catalog.versions.filter(v=>['26.1','26.3'].includes(v.id));
 assert.equal(catalog.defaultVersion,'26.1');assert.equal(catalog.versions.find(v=>v.id==='26.3').state,'server-only');mark('dynamic default and unsupported latest release are distinguished');
 await service.request('POST','/setup/mc',{source:'managed',version:'26.1',downloadConsent:true,eulaAccepted:true});let previous='';
 timer=setInterval(()=>{const current=service.setup.status().mc;if(current?.phase!==previous){previous=current?.phase;console.log(JSON.stringify({phase:previous}));}},1000);
 await service.setup.wait('mc');clearInterval(timer);timer=null;assert.equal(service.setup.status().mc.phase,'complete',service.setup.status().mc.error);
 const cfg=await service.store.read();report.managed={directory:cfg.mc.serverDir,port:cfg.mc.port,javaPath:cfg.mc.javaPath};
 mark('A official 26.1 server started with the required Java runtime',{version:cfg.mc.version});
 const body=await entered();mark('A actual body entered 26.1',{pid:body.pid});assert.equal((await bodyRequest(root,cfg.mc,'/around')).ok,true);mark('A actual observation works');
 preview=spawn(process.execPath,['scripts/dev.mjs'],{windowsHide:true,env:{...process.env,PORT:'0',DSH_COMPANION_HOME:root},stdio:['ignore','pipe','pipe']});let stderr='';preview.stderr.on('data',d=>stderr+=d);
 const base=await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error('Preview failed '+stderr)),20000);preview.stdout.on('data',d=>{output+=d;const url=output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timeout);resolve(url);}});preview.once('error',reject);});
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1240,height:1100}});await page.goto(base);await page.request.post(base+'/api/dsh-companion/adapters/mc/probe',{data:{}});await page.getByRole('button',{name:'刷新',exact:true}).click();const card=page.locator('[data-channel=mc]');await card.getByRole('button',{name:'连接向导',exact:true}).click();await expect(card.locator('.dsc-join')).toBeVisible();await expect(card.getByLabel('你选择的版本',{exact:true})).toHaveValue('26.1',{timeout:20000});await card.screenshot({path:'artifacts/030-managed-actual.png'});await browser.close();browser=null;preview.kill();preview=null;
 await service.channels.adapters.mc.actions.down();mark('A graceful shutdown');
 report.result='passed';
}catch(error){report.result='failed';report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{
 preview?.kill();await browser?.close();
 clearInterval(timer);try{const cfg=await service.store.read();if(cfg.mc.serverDir.startsWith(root+path.sep)&&(await worldStatus(root,cfg.mc)).owned)await service.channels.adapters.mc.actions.down();const ports=[cfg.mc.port,cfg.mc.commandPort,cfg.mc.testPort];report.remainingListeners=[];for(const port of ports)if(await portOpen('127.0.0.1',port))report.remainingListeners.push(port);if(report.remainingListeners.length)process.exitCode=1;}catch(e){report.cleanupError=e.message;process.exitCode=1;}
 service.close();await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/030-world-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
