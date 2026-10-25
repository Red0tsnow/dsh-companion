import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {WebSocketServer} from 'ws';
import {ConfigStore} from '../lib/core/config.js';
import {createAdapters} from '../lib/adapters/index.js';
const api = await import('../lib/core/service.js').catch(() => ({}));
test('fresh service has four unconfigured channels and seven writings; malformed actions stay bounded', async t => {
  assert.equal(typeof api.CompanionService, 'function');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-api-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const service = new api.CompanionService(root); await service.init(); t.after(() => service.close());
  const state = await service.request('GET', '/status'); assert.equal(Object.keys(state.channels).length, 4);
  for (const id of ['mc', 'qq', 'xhh', 'bili']) assert.equal((await service.request('POST', `/adapters/${id}/probe`, {})).state, 'unconfigured');
  assert.equal(Object.keys(await service.request('GET', '/writings')).length, 7);
  await assert.rejects(service.request('POST', '/adapters/mc/actions/run-shell', {}));
  await assert.rejects(service.request('POST', '/adapters/mc/actions/up', {}));
});

test('opening a character checks host readiness each time and never creates a session when unconfigured',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-model-gate-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));let creates=0,state='unconfigured';
  const host={modelStatus:async()=>({state,message:'DSH 还没登录，先去设置里登录。'}),create:async()=>{creates++;return {sessionId:'actual-id'};},exists:async()=>true};
  const service=new api.CompanionService(root,host);await service.init();t.after(()=>service.close());await service.request('POST','/persona',{text:'You are a friend.'});
  assert.equal((await service.request('GET','/host-model')).state,'unconfigured');await assert.rejects(service.request('POST','/session',{}),/设置里登录/);assert.equal(creates,0);
  state='available';assert.equal((await service.request('POST','/session',{})).sessionId,'actual-id');assert.equal(creates,1);
});

test('a setup completion arriving after plugin close cannot reopen a QQ connection',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-closed-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const server=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>server.once('listening',r));let connections=0;server.on('connection',()=>connections++);
  const store=new ConfigStore(root);await store.save({qq:{enabled:true,wsUrl:`ws://127.0.0.1:${server.address().port}`}});
  const channels=createAdapters(store,()=>{});
  try{channels.close();await channels.refresh();assert.equal(connections,0);}finally{channels.close();for(const socket of server.clients)socket.terminate();await new Promise(r=>server.close(r));}
});

test('offline Minecraft body actions return degradation results and leave the panel usable', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-body-offline-'));
  t.after(() => fs.rm(root, { recursive:true, force:true }));
  const service = new api.CompanionService(root); await service.init(); t.after(() => service.close());
  const server = net.createServer(); await new Promise(r => server.listen(0,'127.0.0.1',r));
  const port = server.address().port; await new Promise(r => server.close(r));
  await service.store.save({mc:{enabled:true,commandPort:port}});
  for (const action of ['around','map','say']) {
    const result = await service.request('POST', `/adapters/mc/actions/${action}`, {text:'hello'});
    assert.equal(result.ok,false); assert.equal(result.state,'offline'); assert.equal(typeof result.message,'string');
  }
  assert.equal(Object.keys((await service.request('GET','/status')).channels).length,4);
});
