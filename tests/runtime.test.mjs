import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const world = await import('../lib/core/world.js').catch(() => ({}));
const sessions = await import('../lib/core/session.js').catch(() => ({}));

test('world reconciliation does not adopt another jar or a reused PID', () => {
  assert.equal(typeof world.reconcileWorld, 'function');
  const target = { jar: '/srv/one/server.jar', port: 25565 };
  const stale = { pid: 10, startedAt: 100, jar: '/srv/one/server.jar', owned: true };
  let r = world.reconcileWorld(target, { listenerPid: 10, processes: [{ pid: 99, startedAt: 100, jar: '/srv/one/server.jar' }, { pid: 10, startedAt: 200, jar: '/srv/two/server.jar' }], open: true }, stale);
  assert.equal(r.owned, false); assert.equal(r.state, 'conflict');
  r = world.reconcileWorld(target, { listenerPid: 11, processes: [{ pid: 11, startedAt: 300, jar: '/srv/one/server.jar' }], open: true }, stale);
  assert.equal(r.startedAt, 300); assert.equal(r.owned, false); assert.equal(r.state, 'online');
  r = world.reconcileWorld(target, { listenerPid: 10, processes: [{ pid: 10, startedAt: 200, jar: '/srv/one/server.jar' }], open: true }, stale);
  assert.equal(r.owned, false); assert.equal(r.startedAt, 200);
});
test('world is offline when the saved process is gone, regardless of old timestamps', () => {
  assert.equal(typeof world.reconcileWorld, 'function');
  const r = world.reconcileWorld({ jar: '/srv/one/server.jar', port: 25565 }, { open: false, processes: [], listenerPid: null }, { pid: 10, startedAt: 100, owned: true });
  assert.equal(r.state, 'offline'); assert.equal(r.startedAt, null); assert.equal(r.owned, false);
});
test('cross-process lock admits only one simultaneous launch', async t => {
  assert.equal(typeof world.withWorldLock, 'function');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-lock-')); t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let running = 0, peak = 0;
  await Promise.all(Array.from({ length: 6 }, () => world.withWorldLock(dir, async () => { peak = Math.max(peak, ++running); await new Promise(r => setTimeout(r, 10)); running--; })));
  assert.equal(peak, 1);
});
test('session identity survives restart and uses the actual host-created ID', async t => {
  assert.equal(typeof sessions.CharacterSession, 'function');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-session-')); t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let creates = 0;
  const host = { create: async () => { creates++; return { sessionId: 'actual-host-id' }; }, exists: async id => id === 'actual-host-id' };
  const first = new sessions.CharacterSession(dir, host);
  assert.equal(await first.ensure(), 'actual-host-id');
  const second = new sessions.CharacterSession(dir, host);
  assert.equal(await second.ensure(), 'actual-host-id'); assert.equal(creates, 1);
});
test('message routing sends each reply only to its original channel and suppresses duplicates', async t => {
  assert.equal(typeof sessions.CharacterSession, 'function');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-route-')); t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const sends = [], inputs = [];
  const s = new sessions.CharacterSession(dir, { create: async () => ({ sessionId: 's' }), exists: async () => true, turn: async (id, input) => { inputs.push(input); return `reply:${input.text}`; } });
  s.send = async (route, text) => sends.push({ route, text });
  await Promise.all([s.receive({ id: 'q1', channel: 'qq', target: '123', text: 'hello' }), s.receive({ id: 'm1', channel: 'mc', kind: 'world', text: 'rain' })]);
  await s.receive({ id: 'q1', channel: 'qq', target: '123', text: 'hello' });
  assert.deepEqual(sends.map(x => x.route.channel), ['qq', 'mc']);
  assert.equal(inputs[1].kind, 'world'); assert.equal(sends.length, 2);
});
