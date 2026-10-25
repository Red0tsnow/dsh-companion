import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAdapter, result } from '../lib/core/probe.js';

test('adapter reset clears stale health when settings change and never connects', async () => {
  let calls = 0;
  const adapter = makeAdapter({ id:'sample', configured: c => Boolean(c.address), check: async () => { calls++; return result('online','Ready'); } });
  assert.equal(typeof adapter.reset,'function');
  const original = { enabled:true,address:'one' };
  await adapter.probe(original); assert.equal(adapter.status.ok,true); assert.ok(adapter.status.lastSuccessAt);
  adapter.reset({address:'one',enabled:true}); assert.equal(adapter.status.ok,true);
  adapter.reset({address:'two',enabled:true});
  assert.equal(adapter.status.state,'offline'); assert.equal(adapter.status.checkedAt,null); assert.equal(adapter.status.lastSuccessAt,null); assert.equal(calls,1);
  adapter.reset({address:'two',enabled:false}); assert.equal(adapter.status.state,'disabled');
  adapter.reset({enabled:true}); assert.equal(adapter.status.state,'unconfigured');
  await adapter.probe(original); adapter.reset(original,{force:true});
  assert.equal(adapter.status.state,'offline'); assert.equal(adapter.status.lastSuccessAt,null);
});
test('late probe cannot overwrite the reset disabled state', async () => {
  let release;
  const adapter = makeAdapter({ id:'sample', configured:c => Boolean(c.address), check:() => new Promise(resolve => { release = resolve; }) });
  assert.equal(typeof adapter.reset,'function');
  const pending = adapter.probe({enabled:true,address:'one'});
  await Promise.resolve(); await Promise.resolve();
  adapter.reset({enabled:false,address:'one'});
  release(result('online','Old settings succeeded')); await pending;
  assert.equal(adapter.status.state,'disabled'); assert.equal(adapter.status.lastSuccessAt,null);
});
test('all malformed adapter configs resolve and configured predicate errors stay local', async () => {
  const adapter = makeAdapter({ id:'sample', configured:c => { if (c.fail) throw new Error('Broken predicate'); return Boolean(c.address); }, check: async () => result('online','Ready') });
  const circular = {enabled:true,address:'one'}; circular.self = circular;
  for (const cfg of [null,undefined,[], 'text',5, {enabled:true,fail:true}, circular]) {
    const value = await adapter.probe(cfg); assert.equal(value.ok,false); assert.equal(typeof value.message,'string'); assert.equal(typeof value.level,'string'); assert.ok(Object.hasOwn(value,'detail'));
  }
});

test('closing an adapter aborts its in-flight probe and prevents later health updates', async () => {
  let signal;
  const adapter = makeAdapter({ id:'sample', configured:() => true, check:(_,s) => { signal = s; return new Promise(() => {}); } });
  const pending = adapter.probe({enabled:true});
  await Promise.resolve(); await Promise.resolve();
  assert.equal(typeof adapter.close, 'function');
  adapter.close();
  assert.equal(signal.aborted, true);
  assert.equal((await pending).state, 'disabled');
  assert.equal((await adapter.probe({enabled:true})).state, 'disabled');
});
