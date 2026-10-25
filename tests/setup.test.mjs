import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ConfigStore } from '../lib/core/config.js';
const setup = await import('../lib/core/setup.js').catch(()=>({}));
const downloads = await import('../lib/core/downloads.js').catch(()=>({}));
const sha = data=>createHash('sha256').update(data).digest('hex');
async function root(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'companion-setup-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return dir;}
test('setup never starts a download without explicit consent and the Minecraft agreement',async t=>{
  assert.equal(typeof setup.SetupManager,'function'); let requests=0;
  const manager=new setup.SetupManager(new ConfigStore(await root(t)),{fetch:async()=>{requests++;throw new Error('unexpected request');}});t.after(()=>manager.close());
  await assert.rejects(manager.startMinecraft({downloadConsent:false,eulaAccepted:true}),/consent|确认/i);
  await assert.rejects(manager.startMinecraft({downloadConsent:true,eulaAccepted:false}),/agreement|协议/i);
  await assert.rejects(manager.startQQ({downloadConsent:false,ownerId:'12345',selfId:'90001'}),/consent|确认/i);
  assert.equal(requests,0);
});
test('downloads enforce official sources, verify checksums and never commit partial or corrupt files',async t=>{
  assert.equal(typeof downloads.downloadVerified,'function');const dir=await root(t), file=path.join(dir,'components/test.bin');
  const content=Buffer.from('official fixture bytes');let calls=0;const fetch=async()=>{calls++;return new Response(content);};
  await assert.rejects(downloads.downloadVerified({root:dir,url:'https://example.com/file',file,sha256:sha(content),fetch}),/official|官方/i);assert.equal(calls,0);
  await assert.rejects(downloads.downloadVerified({root:dir,url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/test.zip',file,sha256:'0'.repeat(64),fetch}),/checksum|校验/i);
  await assert.rejects(fs.access(file));
  await downloads.downloadVerified({root:dir,url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/test.zip',file,sha256:sha(content),fetch});
  assert.deepEqual(await fs.readFile(file),content);
  await assert.rejects(downloads.downloadVerified({root:dir,url:'https://github.com/unrelated/project/releases/file',file,sha256:sha(content),fetch}),/official|官方/i);
});
test('stalled downloads fail promptly and remove their partial file',{timeout:300},async t=>{
  const dir=await root(t),file=path.join(dir,'components/stalled.zip');
  await assert.rejects(downloads.downloadVerified({root:dir,url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/test.zip',file,sha256:'0'.repeat(64),stallMs:15,fetch:async()=>new Response(new ReadableStream({start(){}}))}),/progress|进展/i);
  await assert.rejects(fs.access(file));assert.deepEqual(await fs.readdir(path.dirname(file)),[]);
});
test('Minecraft preparation creates its own world with distinct automatic ports and joins through the existing world entry',async t=>{
  assert.equal(typeof setup.SetupManager,'function');const dir=await root(t),store=new ConfigStore(dir);let starts=0;
  const priorDirectory=path.join(dir,'worlds','companion-1.21.8');await fs.mkdir(priorDirectory,{recursive:true});
  await fs.writeFile(path.join(priorDirectory,'server.properties'),'server-port=25689\nserver-ip=127.0.0.1\n# preserved after interrupted setup\n');
  const bytes=Buffer.from('server fixture'),serverHash=createHash('sha1').update(bytes).digest('hex');
  const manager=new setup.SetupManager(store,{
    platform:'win32',java:async()=>({file:'java',version:'openjdk version "21.0.1"'}),
    startWorld:async()=>{starts++;return {body:{online:true}};},
    fetch:async url=>{
      if(String(url).includes('version_manifest'))return Response.json({versions:[{id:'1.21.8',type:'release',url:'https://piston-meta.mojang.com/v1/fixture.json'}]});
      if(String(url).includes('fixture.json'))return Response.json({downloads:{server:{url:'https://piston-data.mojang.com/v1/server.jar',sha1:serverHash,size:bytes.length}}});
      return new Response(bytes);
    },
  });t.after(()=>manager.close());
  const first=await manager.startMinecraft({downloadConsent:true,eulaAccepted:true});
  const second=await manager.startMinecraft({downloadConsent:true,eulaAccepted:true});assert.equal(first.id,second.id);
  await manager.wait('mc');const state=manager.status().mc;assert.equal(state.phase,'complete');assert.equal(starts,1);
  const cfg=await store.read();assert.equal(cfg.mc.enabled,true);assert.ok(cfg.mc.serverDir.startsWith(dir+path.sep));
  assert.equal(new Set([cfg.mc.port,cfg.mc.commandPort,cfg.mc.testPort]).size,3);
  assert.match(await fs.readFile(path.join(cfg.mc.serverDir,'eula.txt'),'utf8'),/eula=true/);
  assert.match(await fs.readFile(path.join(cfg.mc.serverDir,'server.properties'),'utf8'),/server-ip=127\.0\.0\.1/);
  assert.equal(cfg.mc.port,25689);assert.match(await fs.readFile(path.join(cfg.mc.serverDir,'server.properties'),'utf8'),/preserved after interrupted setup/);
  assert.equal(JSON.stringify(manager.status()).includes('bodyToken'),false);
});

test('QQ preparation only configures the downloaded helper and does not expose its generated connection token',async t=>{
  assert.equal(typeof setup.SetupManager,'function');const dir=await root(t),store=new ConfigStore(dir),bytes=Buffer.from('official helper fixture');let launched=0;
  await fs.mkdir(path.join(dir,'components',`qq-helper-${sha(bytes)}`),{recursive:true}); // interrupted older extraction
  const manager=new setup.SetupManager(store,{platform:'win32',
    knownGood:{version:'v-fixture',asset:'NapCat.Shell.Windows.OneKey.zip',sha256:sha(bytes),publisherSubject:'CN=Fixture Publisher',automaticExecution:true},verifySignature:async()=>({status:'Valid',subject:'CN=Fixture Publisher'}),
    fetch:async url=>String(url).includes('/releases/latest')?Response.json({tag_name:'v-fixture',assets:[{name:'NapCat.Shell.Windows.OneKey.zip',digest:'sha256:'+sha(bytes),size:bytes.length,browser_download_url:'https://github.com/NapNeko/NapCatQQ/releases/download/v1/helper.zip'}]}):new Response(bytes),
    extract:async(_,archive,destination)=>{await fs.mkdir(path.join(destination,'NapCat.Test.Shell','napcat'),{recursive:true});await fs.writeFile(path.join(destination,'NapCatInstaller.exe'),'fixture');await fs.writeFile(path.join(destination,'NapCat.Test.Shell','napcat.bat'),'fixture');await fs.writeFile(path.join(destination,'NapCat.Test.Shell','napcat','napcat.mjs'),'fixture');},
    openInstaller:async()=>{},launchHelper:async()=>{launched++;},
  });t.after(()=>manager.close());
  await manager.startQQ({downloadConsent:true,ownerId:'12345',selfId:'90001'});await manager.wait('qq');assert.equal(manager.status().qq.phase,'helper-ready');assert.equal((await store.read()).qq.enabled,false);
  await manager.openQQInstaller({confirmExecution:true,version:'v-fixture',sha256:sha(bytes)});await manager.launchQQ();const config=await store.read(),token=(await store.secrets('qq')).token;
  assert.equal(launched,1);assert.equal(config.owner.id,'12345');assert.equal(config.qq.selfId,'90001');assert.ok(token.length>20);assert.equal(JSON.stringify(manager.status()).includes(token),false);assert.equal(manager.status().qq.phase,'waiting-login');
  const privateState=JSON.parse(await fs.readFile(path.join(dir,'setup-private.json'),'utf8'));
  const network=JSON.parse(await fs.readFile(path.join(privateState.qq.directory,'NapCat.Test.Shell','napcat','config','onebot11_90001.json'),'utf8'));
  assert.equal(network.network.websocketServers[0].token,token);assert.equal(network.network.websocketServers[0].host,'127.0.0.1');
});
test('a failed preparation reports a retryable state and never enables an incomplete channel',async t=>{
  assert.equal(typeof setup.SetupManager,'function');const store=new ConfigStore(await root(t));
  const manager=new setup.SetupManager(store,{platform:'win32',java:async()=>({file:'java',version:'21'}),fetch:async()=>{throw new Error('network unavailable');}});t.after(()=>manager.close());
  await manager.startMinecraft({downloadConsent:true,eulaAccepted:true});await manager.wait('mc');
  assert.equal(manager.status().mc.phase,'error');assert.equal((await store.read()).mc.enabled,false);
});
test('Bilibili QR login saves credentials only after confirmation and does not echo them',async t=>{
  assert.equal(typeof setup.SetupManager,'function');const store=new ConfigStore(await root(t));let saved=0,polls=0;
  const manager=new setup.SetupManager(store,{qrImage:async()=> 'data:image/png;base64,fixture',connected:async()=>{saved++;},fetch:async url=>{
    if(String(url).includes('generate'))return Response.json({code:0,data:{qrcode_key:'private-login-key',url:'https://account.bilibili.com/h5/account-h5/auth/scan-web?key=fixture'}});
    if(++polls===1)return Response.json({code:0,data:{code:86101}});
    return new Response(JSON.stringify({code:0,data:{code:0,url:'https://passport.bilibili.com/'}}),{headers:{'Content-Type':'application/json','Set-Cookie':'SESSDATA=private-cookie; Path=/, bili_jct=private-csrf; Path=/'}});
  }});t.after(()=>manager.close());
  const login=await manager.startBili();assert.equal(JSON.stringify(login).includes('private-login-key'),false);
  assert.equal((await manager.pollBili({id:login.id})).phase,'waiting-scan');assert.equal(saved,0);
  const confirmed=await manager.pollBili({id:login.id});assert.equal(confirmed.phase,'complete');assert.equal(saved,1);
  assert.equal((await store.secrets('bili')).sessdata,'private-cookie');
  assert.equal(JSON.stringify(confirmed).includes('private-cookie'),false);assert.equal((await store.read()).bili.enabled,true);
  await assert.rejects(manager.pollBili({id:login.id}),/expired|失效/i);
});
