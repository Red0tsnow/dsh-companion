import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DEFAULTS, validateConfig } from '../lib/core/config.js';
import { checkEmptyWorld } from '../lib/core/world-idle.js';

test('the auto-stop setting defaults to 15 minutes and validates', () => {
  assert.equal(DEFAULTS.mc.autoStopEmptyMinutes, 15);
  for (const bad of [-1, 1441, 1.5, '15', null]) {
    const c = structuredClone(DEFAULTS);
    c.mc.autoStopEmptyMinutes = bad;
    // A wrong type is rejected by the generic merge check; a wrong range by ours.
    assert.throws(() => validateConfig(c), /自动关世界|auto-stop|Invalid setting/i, `must reject ${String(bad)}`);
  }
  for (const ok of [0, 1, 15, 1440]) {
    const c = structuredClone(DEFAULTS);
    c.mc.autoStopEmptyMinutes = ok;
    assert.doesNotThrow(() => validateConfig(c), `must accept ${ok}`);
  }
});

test('0 minutes disables the watchdog entirely', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-idle-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const stateFile = path.join(root, 'world-idle.json');
  const cfg = { ...DEFAULTS.mc, enabled: true, autoStopEmptyMinutes: 0 };
  const r = await checkEmptyWorld({ root, cfg, stateFile });
  assert.equal(r.action, 'none');
  // Nothing should have been written; the watchdog must not even track state.
  await assert.rejects(fs.readFile(stateFile, 'utf8'), /ENOENT/);
});

test('a disabled channel never stops anything', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-idle-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cfg = { ...DEFAULTS.mc, enabled: false, autoStopEmptyMinutes: 15 };
  const r = await checkEmptyWorld({ root, cfg, stateFile: path.join(root, 'world-idle.json') });
  assert.equal(r.action, 'none');
});

test('nothing happens while the world is not running', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-idle-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  // No serverDir and source 'managed' means worldStatus reports unconfigured.
  const cfg = { ...DEFAULTS.mc, enabled: true, source: 'managed', serverDir: '', autoStopEmptyMinutes: 15 };
  const r = await checkEmptyWorld({ root, cfg, stateFile: path.join(root, 'world-idle.json') });
  assert.equal(r.action, 'none', 'a world that is not up must not be "stopped"');
});

// —— 下面是注入假世界的完整路径测试 ——

const rig = async (t, { humans, taskState = 'idle' } = {}) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-idle-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const calls = [];
  const deps = {
    worldStatus: async () => ({ state: 'online' }),
    bodyStatus: async () => ({ humansOnline: humans, task: { state: taskState } }),
    worldAction: async (r, c, action) => { calls.push(action); return { ok: true }; },
  };
  return { root, stateFile: path.join(root, 'world-idle.json'), cfg: { ...DEFAULTS.mc, enabled: true, autoStopEmptyMinutes: 15 }, deps, calls };
};

test('stops the world once nobody has been there for the configured time', async (t) => {
  const { root, stateFile, cfg, deps, calls } = await rig(t, { humans: 0 });
  const t0 = 1_000_000;
  // First observation only starts the clock.
  let r = await checkEmptyWorld({ root, cfg, stateFile, now: t0, deps });
  assert.equal(r.action, 'none');
  assert.deepEqual(calls, [], 'must not stop on the first sighting');
  // Still inside the window.
  r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 14 * 60000, deps });
  assert.equal(r.action, 'none');
  // Past 15 minutes: stop, exactly once.
  r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 15 * 60000 + 1, deps });
  assert.equal(r.action, 'stopped');
  assert.deepEqual(calls, ['down'], 'the world must be taken down once');
  assert.match(r.reason, /15/);
  // A second pass during the same gap must not stop again.
  r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 16 * 60000, deps });
  assert.equal(calls.length, 1, 'must not issue a second stop');
});

test('a player arriving resets the clock', async (t) => {
  const { root, stateFile, cfg, deps, calls } = await rig(t, { humans: 0 });
  const t0 = 2_000_000;
  await checkEmptyWorld({ root, cfg, stateFile, now: t0, deps });
  // Somebody joins: the accumulated time is cleared.
  deps.bodyStatus = async () => ({ humansOnline: 1, task: { state: 'idle' } });
  let r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 10 * 60000, deps });
  assert.equal(r.action, 'none');
  const saved = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  assert.equal(saved.emptySince, null, 'arriving must clear the empty clock');
  // They leave again; the clock restarts, so 15 minutes from now is not enough yet.
  deps.bodyStatus = async () => ({ humansOnline: 0, task: { state: 'idle' } });
  r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 20 * 60000, deps });
  assert.equal(r.action, 'none', 'the clock restarted when the player arrived');
  assert.deepEqual(calls, []);
});

test('a running task keeps the world alive', async (t) => {
  const { root, stateFile, cfg, deps, calls } = await rig(t, { humans: 0, taskState: 'running' });
  const t0 = 3_000_000;
  await checkEmptyWorld({ root, cfg, stateFile, now: t0, deps });
  const r = await checkEmptyWorld({ root, cfg, stateFile, now: t0 + 60 * 60000, deps });
  assert.equal(r.action, 'none', 'she must not be shut down mid-task');
  assert.deepEqual(calls, []);
});
