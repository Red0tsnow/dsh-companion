import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {createHash} from 'node:crypto';
import {SetupManager} from '../lib/core/setup.js';
import {ConfigStore} from '../lib/core/config.js';
// 这个用例以前默认 25565 没人监听；本机真在世界里玩的时候就会假失败。
// 拿一个立刻关掉的真端口，保证它和宿主机状态无关。
const closedPort=()=>new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const {port}=s.address();s.close(()=>resolve(port));});});
const digest=(algorithm,bytes)=>createHash(algorithm).update(bytes).digest('hex');
async function directory(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-051-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return root;}
async function worldFixture(t,{pluginFailure=false,gameVersion='26.1',verified=true}={}){
 const root=await directory(t),store=new ConfigStore(root),vanilla=Buffer.from('vanilla fixture'),paper=Buffer.from('paper fixture'),skin=Buffer.from('skin fixture');let downloads=0;
 const pin={paper:{releaseVerified:verified,minecraftVersion:gameVersion,version:gameVersion+'-60',build:60,url:'https://fill-data.papermc.io/paper.jar',sha256:digest('sha256',paper),size:paper.length},skinsrestorer:{releaseVerified:verified,version:'fixture',url:'https://cdn.modrinth.com/skin.jar',sha512:digest('sha512',skin),size:skin.length}};
 const manager=new SetupManager(store,{knownGood:pin,platform:'win32',java:async()=>({file:'fixture-java',version:'25'}),startWorld:async()=>{},fetch:async url=>{
  if(String(url).includes('version_manifest'))return Response.json({versions:[{id:'26.1',type:'release',url:'https://piston-meta.mojang.com/fixture.json'}]});
  if(String(url).endsWith('fixture.json'))return Response.json({javaVersion:{majorVersion:25},downloads:{server:{url:'https://piston-data.mojang.com/vanilla.jar',sha1:digest('sha1',vanilla),size:vanilla.length}}});
  downloads++;if(String(url).includes('modrinth')&&pluginFailure)throw new Error('Fixture network disconnected');return new Response(String(url).includes('papermc')?paper:String(url).includes('modrinth')?skin:vanilla);
 }});t.after(()=>manager.close());return {manager,root,store,downloads:()=>downloads};
}
const start=async(manager,serverType)=>{await manager.startMinecraft({version:'26.1',serverType,downloadConsent:true,eulaAccepted:true});await manager.wait('mc');};
test('release keeps Paper gated until every spike acceptance condition is met',async t=>{
 const {manager,downloads}=await worldFixture(t,{verified:false});await start(manager,'paper');assert.equal(manager.status().mc.phase,'error');assert.match(manager.status().mc.error,/验收|验证/);assert.equal(downloads(),0);
});
test('Paper pin must match the selected Minecraft version before component downloads',async t=>{
 const {manager,downloads}=await worldFixture(t,{gameVersion:'1.21.8'});await start(manager,'paper');assert.equal(manager.status().mc.phase,'error');assert.match(manager.status().mc.error,/版本/);assert.equal(downloads(),0);
});
test('server types use separate directories and switching back preserves the old world',async t=>{
 const {manager,store}=await worldFixture(t);await start(manager,'vanilla');const before=(await store.read()).mc.serverDir;await fs.writeFile(path.join(before,'keep.txt'),'preserve me');
 await start(manager,'paper');assert.equal(manager.status().mc.phase,'complete',manager.status().mc.error);assert.notEqual((await store.read()).mc.serverDir,before);
 await start(manager,'vanilla');assert.equal(manager.status().mc.phase,'complete',manager.status().mc.error);assert.equal((await store.read()).mc.serverDir,before);assert.equal(await fs.readFile(path.join(before,'keep.txt'),'utf8'),'preserve me');
});
test('failed Paper preparation leaves no partial world and keeps the previous configuration',async t=>{
 const {manager,store,root}=await worldFixture(t,{pluginFailure:true});await start(manager,'vanilla');const before=await store.read();await start(manager,'paper');assert.equal(manager.status().mc.phase,'error');assert.match(manager.status().mc.error,/network disconnected/);assert.deepEqual(await store.read(),before);assert.deepEqual(await fs.readdir(path.join(root,'worlds')),['companion-26.1']);
});
test('unverified skin action never starts Java or changes a world',async t=>{
 const root=await directory(t),manager=new SetupManager(new ConfigStore(root),{platform:'win32',knownGood:{paper:{releaseVerified:false},skinsrestorer:{releaseVerified:false}}});t.after(()=>manager.close());await manager.store.save({mc:{serverType:'paper',serverDir:root}});let java=0;manager.java=async()=>{java++;throw new Error('must not start');};
 await assert.rejects(manager.applySkin({url:'https://example.com/skin.png'}),/验收|验证/);assert.equal(java,0);
});

test('vanilla fallback from a legacy 0.5.0 Paper folder preserves that folder',async t=>{
 const {manager,store,root}=await worldFixture(t);const legacy=path.join(root,'worlds','companion-26.1');await fs.mkdir(legacy,{recursive:true});await fs.writeFile(path.join(legacy,'server.jar'),'legacy paper data');await fs.writeFile(path.join(legacy,'keep.txt'),'old save');await store.save({mc:{serverType:'paper',version:'26.1',serverDir:legacy,port:await closedPort()}});
 await start(manager,'vanilla');assert.equal(manager.status().mc.phase,'complete',manager.status().mc.error);assert.notEqual((await store.read()).mc.serverDir,legacy);assert.equal(await fs.readFile(path.join(legacy,'keep.txt'),'utf8'),'old save');
});
