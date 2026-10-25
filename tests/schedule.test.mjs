import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ConfigStore } from '../lib/core/config.js';
import { initialize } from '../lib/core/initialize.js';
import { tickSchedules } from '../lib/core/scheduler.js';
const scheduleApi = await import('../lib/core/scheduler.js');

async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-schedule-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await initialize(root); const store = new ConfigStore(root); await store.save({ schedule: { enabled: true } });
  return { root, store, save: (name, schedule) => fs.writeFile(path.join(store.paths.schedules, name + '.schedule.json'), JSON.stringify(schedule)) };
}
test('cron honors timezone and top-level target mode, once per matching minute', async t => {
  const { store, save } = await setup(t); const calls = [];
  await save('night', { version: 1, target: { mode: 'fork', channel: 'qq', id: '123' }, entries: [{ id: 'hello', enabled: true, cron: '*/15 22 * * *', time_zone: 'Asia/Shanghai', prompt: 'Good night' }] });
  const character = { receive: async value => calls.push(value) };
  await tickSchedules(store, character, () => true, new Date('2026-10-25T14:15:01Z'));
  await tickSchedules(store, character, () => true, new Date('2026-10-25T14:15:22Z'));
  assert.equal(calls.length, 1); assert.equal(calls[0].mode, 'fork'); assert.equal(calls[0].channel, 'qq'); assert.equal(calls[0].target, '123');
});
test('offline task is claimed as skipped and never replayed after reconnect', async t => {
  const { store, save, root } = await setup(t); const calls = [];
  await save('night', { version: 1, entries: [{ id: 'hello', enabled: true, at: '22:00', time_zone: 'Asia/Shanghai', target: { mode: 'resume', channel: 'qq', id: '123' }, prompt: 'Good night' }] });
  const character = { receive: async value => calls.push(value) };
  await tickSchedules(store, character, () => false, new Date('2026-10-25T14:00:01Z'));
  await tickSchedules(store, character, () => true, new Date('2026-10-25T14:00:22Z'));
  assert.equal(calls.length, 0);
  const state = JSON.parse(await fs.readFile(path.join(root, 'schedule-state.json'), 'utf8')); assert.equal(Object.values(state)[0].status, 'skipped-offline');
});
test('a malformed schedule does not suppress a healthy later file', async t => {
  const { store, save } = await setup(t); const calls = [];
  await fs.writeFile(path.join(store.paths.schedules, 'a-broken.schedule.json'), '{');
  await save('z-working', { version: 1, entries: [{ id: 'now', enabled: true, cron: '30 10 * * 0', time_zone: 'UTC', prompt: 'Sunday' }] });
  const report = await tickSchedules(store, { receive: async value => calls.push(value) }, () => true, new Date('2026-10-25T10:30:00Z'));
  assert.equal(calls.length, 1); assert.equal(report.errors.length, 1);
});
test('schedule editor rejects bad timezone and traversal without changing a valid saved file', async t => {
  assert.equal(typeof scheduleApi.saveSchedule, 'function'); assert.equal(typeof scheduleApi.loadSchedules, 'function');
  const { root } = await setup(t);
  const document = { version: 1, target: { mode:'new',channel:'dsh' }, entries:[{id:'night', enabled:true, cron:'0 22 * * *',time_zone:'Asia/Shanghai',prompt:'Keep a journal'}] };
  await scheduleApi.saveSchedule(root, { name:'daily.schedule.json', document });
  const bad = structuredClone(document); bad.entries[0].time_zone = 'Not/AZone';
  await assert.rejects(scheduleApi.saveSchedule(root, { name:'daily.schedule.json', document:bad }));
  await assert.rejects(scheduleApi.saveSchedule(root, { name:'../outside.schedule.json', document }));
  const loaded = await scheduleApi.loadSchedules(root); assert.equal(loaded.files.length,1); assert.equal(loaded.files[0].document.entries[0].time_zone,'Asia/Shanghai');
});
