import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const core = await import('../lib/core/config.js').catch(() => ({}));
const persona = await import('../lib/core/persona.js').catch(() => ({}));
const probe = await import('../lib/core/probe.js').catch(() => ({}));
async function temp(t) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-test-')); t.after(() => fs.rm(dir, { recursive: true, force: true })); return dir; }

test('configuration rejects bad ports without replacing previous configuration', async t => {
  assert.equal(typeof core.ConfigStore, 'function', 'configuration store is implemented');
  const dir = await temp(t); const store = new core.ConfigStore(dir);
  await store.save({ character: { name: 'River' }, mc: { port: 25566 } });
  await assert.rejects(store.save({ mc: { port: 70000 } }));
  assert.equal((await store.read()).character.name, 'River');
  assert.equal((await store.read()).mc.port, 25566);
});
test('secrets never appear in public configuration and remain after unrelated saves', async t => {
  assert.equal(typeof core.ConfigStore, 'function');
  const dir = await temp(t); const store = new core.ConfigStore(dir);
  await store.saveSecrets('qq', { token: 'local-test-token' });
  await store.save({ owner: { callName: 'Friend' } });
  assert.equal(JSON.stringify(await store.public()).includes('local-test-token'), false);
  assert.equal((await store.secrets('qq')).token, 'local-test-token');
});
test('corrupt configuration is surfaced and preserved instead of silently overwritten', async t => {
  assert.equal(typeof core.ConfigStore, 'function');
  const dir = await temp(t); const store = new core.ConfigStore(dir);
  await fs.writeFile(path.join(dir, 'config.json'), '{broken');
  await assert.rejects(store.save({ character: { name: 'test' } }));
  assert.equal(await fs.readFile(path.join(dir, 'config.json'), 'utf8'), '{broken');
});
test('persona rejects overflow without truncation and normalizes line endings', async t => {
  assert.equal(typeof persona.savePersona, 'function', 'persona saving is implemented');
  const dir = await temp(t);
  await persona.savePersona(dir, '字'.repeat(3999));
  assert.equal((await persona.readPersona(dir)).count, 3999);
  await persona.savePersona(dir, '字'.repeat(4000));
  await assert.rejects(persona.savePersona(dir, '字'.repeat(4001)));
  assert.equal((await persona.readPersona(dir)).text.length, 4000);
  await persona.savePersona(dir, '你好\r\n🙂');
  const p = await persona.readPersona(dir);
  assert.equal(p.text, '你好\n🙂'); assert.equal(p.count, 5);
  assert.equal(await fs.readFile(path.join(dir, 'persona.md'), 'utf8'), p.text);
});

test('persona reports a mirror failure while preserving the saved workspace original', async t => {
  const dir = await temp(t); await fs.mkdir(path.join(dir,'persona.md'));
  const result = await persona.savePersona(dir,'A saved persona');
  assert.equal(result.ok,true); assert.equal(result.mirrored,false); assert.ok(result.warning);
  assert.equal((await persona.readPersona(dir)).text,'A saved persona');
});
test('probe converts rejection, malformed input and hung dependency to bounded results', async () => {
  assert.equal(typeof probe.safeProbe, 'function', 'bounded probes are implemented');
  for (const fn of [() => { throw new Error('failed'); }, () => Promise.reject(new Error('failed')), () => new Promise(() => {})]) {
    const result = await probe.safeProbe(fn, { timeoutMs: 25 });
    assert.equal(result.ok, false); assert.equal(typeof result.message, 'string');
  }
  const result = await probe.safeProbe(() => null);
  assert.equal(result.ok, false);
});
