import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileWorld } from '../lib/core/world.js';

test('a verified owned Java process keeps ownership while its game port is not yet listening', () => {
  const target = { jar: '/srv/world/server.jar', port: 25565 };
  const saved = { pid: 42, startedAt: 1000, jar: '/srv/world/server.jar', owned: true };
  const facts = { open: false, listenerPid: null, processes: [{ pid: 42, startedAt: 1000, jar: '/srv/world/server.jar' }] };
  const status = reconcileWorld(target, facts, saved);
  assert.equal(status.state, 'starting'); assert.equal(status.owned, true);
  assert.equal(status.pid, 42); assert.equal(status.startedAt, 1000);
});

test('a closed port never grants ownership to a reused PID or different jar', () => {
  const target = { jar: '/srv/world/server.jar', port: 25565 };
  const saved = { pid: 42, startedAt: 1000, jar: '/srv/world/server.jar', owned: true };
  for (const process of [
    { pid: 42, startedAt: 2000, jar: '/srv/world/server.jar' },
    { pid: 42, startedAt: 1000, jar: '/srv/other/server.jar' },
  ]) assert.equal(reconcileWorld(target, { open: false, listenerPid: null, processes: [process] }, saved).owned, false);
});
