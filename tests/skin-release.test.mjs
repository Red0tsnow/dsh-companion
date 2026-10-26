import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { createHash } from 'node:crypto';
import * as commands from '../lib/core/world-commands.js';
import { SetupManager } from '../lib/core/setup.js';
import { ConfigStore } from '../lib/core/config.js';
import { paperAvailability,prepareWorldComponents } from '../lib/core/world-components.js';
import { downloadVerified } from '../lib/core/downloads.js';

const identity = { instance:'test-instance', launchId:'launch', pid:123, startedAt:1000 };
async function directory(t) { const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-skin-release-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root; }
async function channel(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-skin-channel-')), child={stdin:new PassThrough(),stdout:new PassThrough(),stderr:new PassThrough()};
  const bridge=commands.createConsoleChannel(root,identity,child);
  const timer=setInterval(()=>bridge.poll().catch(()=>{}),5);
  t.after(async()=>{clearInterval(timer);await bridge.close();for(const s of Object.values(child))s.destroy();await fs.rm(root,{recursive:true,force:true});});
  return {root,child,bridge};
}
test('console channel correlates a split successful skin response with this request',async t=>{
  const {root,child}=await channel(t);let sent='';child.stdin.on('data',b=>{sent+=b;child.stdout.write('[SkinsRestorer] You changed the skin of Com');setTimeout(()=>child.stdout.write('panion.\n'),5);});
  const r=await commands.sendConsoleCommand(root,identity,'skin set companion_skin Companion',{timeoutMs:500});
  assert.equal(r.ok,true);assert.match(r.output.join('\n'),/changed the skin of Companion/);assert.equal(sent,'skin set companion_skin Companion\n');
});
test('console channel ignores another player success and never reports timeout as success',async t=>{
  const {root,child}=await channel(t);child.stdin.on('data',()=>child.stdout.write('[SkinsRestorer] You changed the skin of SomeoneElse.\n'));
  await assert.rejects(commands.sendConsoleCommand(root,identity,'skin set companion_skin Companion',{timeoutMs:80}),e=>e.code==='COMMAND_TIMEOUT');
});
test('player chat cannot impersonate a successful SkinsRestorer console reply',async t=>{
  const {root,child}=await channel(t);child.stdin.on('data',()=>child.stdout.write('[02:30:00 INFO]: <OtherPlayer> [SkinsRestorer] You changed the skin of Companion.\n'));
  await assert.rejects(commands.sendConsoleCommand(root,identity,'skin set companion_skin Companion',{timeoutMs:80}),e=>e.code==='COMMAND_TIMEOUT');
});
test('stale world identity cannot send commands to the current Java process',async t=>{
  const {root,child}=await channel(t);let writes=0;child.stdin.on('data',()=>writes++);
  await assert.rejects(commands.sendConsoleCommand(root,{...identity,startedAt:999},'skin set companion_skin Companion',{timeoutMs:150}),e=>e.code==='WORLD_CHANGED');assert.equal(writes,0);
});
test('expired requests and multiline or arbitrary console commands cannot execute',async t=>{
  const {root,child,bridge}=await channel(t);let writes=0;child.stdin.on('data',()=>writes++);
  for(const command of ['stop','op Companion','skin set companion_skin Companion\nstop','sr createcustom other https://example.com/a.png'])await assert.rejects(commands.sendConsoleCommand(root,identity,command,{timeoutMs:50}),/command|命令/i);
  await fs.writeFile(path.join(root,'world-command.json'),JSON.stringify({...identity,id:'expired',command:'skin set companion_skin Companion',expiresAt:Date.now()-1}));await bridge.poll();assert.equal(writes,0);
});
test('missing plugin and server skin fetch failures have distinct reasons',async t=>{
  for(const [line,code] of [['Unknown or incomplete command, see below for error','PLUGIN_UNAVAILABLE'],['[SkinsRestorer] Could not generate skin from that URL.','SKIN_FETCH_FAILED']]){
    const {root,child}=await channel(t);child.stdin.on('data',()=>child.stdout.write(line+'\n'));
    await assert.rejects(commands.sendConsoleCommand(root,identity,'sr createcustom companion_skin https://example.com/a.png',{timeoutMs:150}),e=>e.code===code);
  }
});
test('both component acceptance flags are required before advertising Paper',()=>{
  assert.equal(paperAvailability({paper:{releaseVerified:true,minecraftVersion:'1.21.8'},skinsrestorer:{releaseVerified:false}}).available,false);
});
test('new managed Paper avoids the blocking join listener and preserves existing plugin settings',async t=>{
  const root=await directory(t),jar=Buffer.from('paper fixture'),plugin=Buffer.from('plugin fixture'),archive=path.join(root,'paper.jar'),directoryPath=path.join(root,'world');await fs.writeFile(archive,jar);
  const options={algorithm:'sha256',expected:createHash('sha256').update(jar).digest('hex'),skin:{url:'https://cdn.modrinth.com/plugin.jar',sha512:createHash('sha512').update(plugin).digest('hex')},fetch:async()=>new Response(plugin)};
  await prepareWorldComponents(root,directoryPath,archive,options);const file=path.join(directoryPath,'plugins/SkinsRestorer/config.yml');
  const initial=await fs.readFile(file,'utf8');assert.match(initial,/enablePaperJoinListener: false/);assert.match(initial,/consoleLocale: en/);
  const custom='advanced:\n  enablePaperJoinListener: true\n# user settings\n';await fs.writeFile(file,custom);await prepareWorldComponents(root,directoryPath,archive,options);assert.equal(await fs.readFile(file,'utf8'),custom);
});
async function setup(t,{fetch=async()=>new Response('png',{headers:{'content-type':'image/png'}}),run=async()=>({ok:true})}={}){
  const root=await directory(t), store=new ConfigStore(root);await store.save({mc:{serverType:'paper',version:'1.21.8',serverDir:root,username:'Character'}});
  const manager=new SetupManager(store,{platform:'win32',knownGood:{paper:{releaseVerified:true,minecraftVersion:'1.21.8',build:60,sha256:'a'.repeat(64)},skinsrestorer:{releaseVerified:true}},fetch,worldCommands:run});t.after(()=>manager.close());return manager;
}
test('skin application uses fixed name, configured player and existing world command channel',async t=>{
  let actual;const manager=await setup(t,{run:async(root,config,list)=>{actual={name:config.mc.username,list};return {ok:true};}});
  manager.java=async()=>{throw Error('must not launch Java');};
  assert.equal((await manager.applySkin({url:'https://example.com/a.png'})).ok,true);
  assert.deepEqual(actual,{name:'Character',list:['sr createcustom companion_skin https://example.com/a.png','skin set companion_skin Character']});
});
test('unreachable image fails before any Minecraft command',async t=>{
  let called=false;const manager=await setup(t,{fetch:async()=>{throw Error('network down');},run:async()=>{called=true;}});
  await assert.rejects(manager.applySkin({url:'https://example.com/a.png'}),/图片.*不可达/);assert.equal(called,false);
});
test('server rejection is surfaced and never converted to skin applied',async t=>{
  const manager=await setup(t,{run:async()=>{const e=Error('Minecraft 无法获取皮肤图片');e.code='SKIN_FETCH_FAILED';throw e;}});
  await assert.rejects(manager.applySkin({url:'https://example.com/a.png'}),/Minecraft 无法获取/);
});
test('Paper and Modrinth retry a failed transfer without retaining partial files',async t=>{
  for(const host of ['fill-data.papermc.io','cdn.modrinth.com']){
    const root=await directory(t),file=path.join(root,'component.jar'),content=Buffer.from('verified bytes');let calls=0;
    await downloadVerified({root,url:`https://${host}/component.jar`,file,sha256:createHash('sha256').update(content).digest('hex'),stallMs:20,fetch:async()=>{calls++;return calls===1?new Response(new ReadableStream({start(c){c.enqueue(Buffer.from('partial'));c.error(Error('connection lost'));}})):new Response(content);}});
    assert.equal(calls,2);assert.deepEqual(await fs.readFile(file),content);assert.deepEqual(await fs.readdir(root),['component.jar']);
  }
});
test('official download errors identify source and stage and preserve integrity checks',async t=>{
  const root=await directory(t);let calls=0;
  await assert.rejects(downloadVerified({root,url:'https://cdn.modrinth.com/plugin.jar',file:path.join(root,'plugin.jar'),sha256:'0'.repeat(64),fetch:async()=>{calls++;return new Response('wrong');}}),e=>/cdn.modrinth.com/.test(e.message)&&/校验|verify/.test(e.message));
  assert.equal(calls,1);assert.deepEqual(await fs.readdir(root),[]);
});
