import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocketServer } from 'ws';
import { once } from 'node:events';
import http from 'node:http';
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const qq = await import('../lib/adapters/onebot.js').catch(() => ({}));
test('OneBot correlates out-of-order responses and rejects failed actions', async t => {
  assert.equal(typeof qq.OneBot, 'function');
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise(r => server.once('listening', r));
  t.after(() => { for (const c of server.clients) c.terminate(); server.close(); });
  server.on('connection', socket => socket.on('message', raw => { const msg = JSON.parse(raw); setTimeout(() => socket.send(JSON.stringify({ echo: msg.echo, status: msg.action === 'bad' ? 'failed' : 'ok', retcode: msg.action === 'bad' ? 100 : 0, data: { name: msg.action } })), msg.action === 'slow' ? 35 : 1); }));
  const client = new qq.OneBot({ url: `ws://127.0.0.1:${server.address().port}`, reconnect: false }); t.after(() => client.close());
  await client.connect(); const results = await Promise.all([client.call('slow'), client.call('fast')]);
  assert.deepEqual(results.map(x => x.name), ['slow', 'fast']); await assert.rejects(client.call('bad'));
});

test('OneBot close rejects requests immediately and a closed client cannot reopen', async t => {
  const server = new WebSocketServer({host:'127.0.0.1',port:0}); await once(server,'listening');
  let received; const requestSeen = new Promise(resolve => { received = resolve; });
  server.on('connection', socket => socket.on('message',received));
  const client = new qq.OneBot({url:`ws://127.0.0.1:${server.address().port}`,reconnect:true});
  t.after(() => { client.close(); for (const socket of server.clients) socket.terminate(); server.close(); });
  await client.connect(); const request = client.call('never_replied');
  let rejected = false; request.catch(() => { rejected = true; }); await requestSeen;
  client.close(); client.close(); await Promise.resolve(); await Promise.resolve();
  assert.equal(rejected,true,'close rejects before a later socket close event');
  await assert.rejects(request); await assert.rejects(client.connect());
});

test('OneBot close settles an in-progress handshake without a dangling rejection', async t => {
  const server = http.createServer(); const sockets = new Set();
  server.on('connection',socket => { sockets.add(socket); socket.once('close',()=>sockets.delete(socket)); });
  const upgrading = once(server,'upgrade');
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const client = new qq.OneBot({url:`ws://127.0.0.1:${server.address().port}`,reconnect:true});
  t.after(() => { client.close(); for (const socket of sockets) socket.destroy(); server.close(); });
  const opening = client.connect(); const rejected = assert.rejects(opening,/stopped/);
  await upgrading; client.close(); await rejected; await sleep(25);
});

test('OneBot ignores malformed event JSON and remains usable after an action timeout', async t => {
  const server = new WebSocketServer({host:'127.0.0.1',port:0}); await once(server,'listening');
  server.on('connection', socket => {
    for (const raw of ['{','null','[]','"text"','{"echo":{"toString":"bad"}}']) socket.send(raw);
    socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.action === 'slow') return;
      socket.send(JSON.stringify({echo:message.echo,status:'ok',retcode:0,data:{ok:true}}));
    });
  });
  const client = new qq.OneBot({url:`ws://127.0.0.1:${server.address().port}`,reconnect:false});
  t.after(() => { client.close(); for (const socket of server.clients) socket.terminate(); server.close(); });
  await client.connect(); await assert.rejects(client.call('slow',{},25),/timed out/);
  assert.deepEqual(await client.call('get_status'),{ok:true});
});

test('OneBot reconnects one active connection and stopping cancels further reconnects', async t => {
  const server = new WebSocketServer({host:'127.0.0.1',port:0}); await once(server,'listening'); let connections = 0;
  server.on('connection', socket => { connections++; if (connections === 1) setTimeout(() => socket.terminate(),20); });
  const client = new qq.OneBot({url:`ws://127.0.0.1:${server.address().port}`,reconnect:true});
  t.after(() => { client.close(); for (const socket of server.clients) socket.terminate(); server.close(); });
  let online = 0; const back = new Promise(resolve => client.on('state',state => { if (state === 'online' && ++online === 2) resolve(); }));
  await client.connect(); await Promise.race([back,sleep(3000).then(() => { throw new Error('No reconnect'); })]);
  client.close(); client.close(); await sleep(1200); assert.equal(connections,2);
});
test('OneBot disconnect rejects pending requests instead of hanging', async t => {
  assert.equal(typeof qq.OneBot, 'function');
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await new Promise(r => server.once('listening', r));
  server.on('connection', s => s.on('message', () => s.close()));
  const client = new qq.OneBot({ url: `ws://127.0.0.1:${server.address().port}`, reconnect: false });
  t.after(() => { client.close(); for (const c of server.clients) c.terminate(); server.close(); });
  await client.connect(); await assert.rejects(client.call('get_status'));
});
