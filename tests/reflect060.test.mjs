import test from 'node:test';
import assert from 'node:assert/strict';
import { lifeDocument, LIFE_FEATURES, lifeEnabled, LIFE_PROMPTS } from '../lib/core/life.js';
import { DEFAULTS, validateConfig } from '../lib/core/config.js';

const life = (patch = {}) => {
  const value = structuredClone(DEFAULTS.life);
  value.reflect.enabled = true;
  return Object.assign(value, patch);
};

test('reflection features are off by default and gated by a single switch', () => {
  const off = structuredClone(DEFAULTS.life);
  for (const feature of ['memory', 'persona', 'rules']) {
    assert.equal(lifeEnabled(off, feature), false, feature + ' must default to off');
    assert.equal(lifeEnabled(life(), feature), true, feature + ' must follow life.reflect.enabled');
  }
  // Turning reflection on must not turn the other three on.
  assert.equal(lifeEnabled(life(), 'selfplay'), false);
  assert.equal(lifeEnabled(life(), 'reachout'), false);
  assert.equal(lifeEnabled(life(), 'diary'), false);
});

test('each reflection feature schedules on its own rhythm', () => {
  const monthly = (day, time) => {
    const [h, m] = time.split(':').map(Number);
    return `${m} ${h} ${day} * *`;
  };
  const value = life();
  const memory = lifeDocument('memory', value, 's', []).entries[0];
  const persona = lifeDocument('persona', value, 's', []).entries[0];
  const rules = lifeDocument('rules', value, 's', []).entries[0];
  const r = DEFAULTS.life.reflect;
  assert.equal(memory.cron, monthly(r.memoryDay, r.memoryTime));
  assert.equal(rules.cron, monthly(r.rulesDay, r.rulesTime));
  const [ph, pm] = r.personaTime.split(':').map(Number);
  assert.equal(persona.cron, `${pm} ${ph} * * ${r.personaWeekday}`, 'persona is weekly, not monthly');
  // Every one of them must carry a prompt.
  for (const doc of [memory, persona, rules]) assert.ok(doc.prompt && doc.prompt.length > 40);
});

test('the reflection prompts keep their guards', () => {
  // Persona drift is the thing most likely to break a character; the prompt must allow skipping.
  assert.match(LIFE_PROMPTS.persona, /--skip/);
  assert.match(LIFE_PROMPTS.persona, /一次只改一句|at most one/i);
  assert.match(LIFE_PROMPTS.rules, /一次只改一条|at most one/i);
  assert.match(LIFE_PROMPTS.memory, /30 天|30 days|older than 30/i);
  // All three must stop when the gate says so, and none may message the user.
  for (const key of ['memory', 'persona', 'rules']) {
    assert.match(LIFE_PROMPTS[key], /allowed:false/);
  }
});

test('day numbers are validated so short months cannot be skipped', () => {
  assert.ok(LIFE_FEATURES.includes('memory') && LIFE_FEATURES.includes('persona') && LIFE_FEATURES.includes('rules'));
  for (const key of ['memoryDay', 'rulesDay']) {
    const bad = structuredClone(DEFAULTS);
    bad.life.reflect[key] = 31;
    assert.throws(() => validateConfig(bad), /1–28/, key + ' must reject day 31');
    const ok = structuredClone(DEFAULTS);
    ok.life.reflect[key] = 28;
    assert.doesNotThrow(() => validateConfig(ok));
  }
  const badWeekday = structuredClone(DEFAULTS);
  badWeekday.life.reflect.personaWeekday = 7;
  assert.throws(() => validateConfig(badWeekday), /星期|weekday/i);
});

test('reflection uses window quotas, not the daily ledger', async (t) => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const { lifeGate } = await import('../lib/core/life.js');
  const { markReflect } = await import('../lib/core/reflect.js');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-reflect-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'workspace'), { recursive: true });
  const cfg = structuredClone(DEFAULTS);
  cfg.life.reflect.enabled = true;
  cfg.life.timeZone = 'Asia/Shanghai';

  // Monthly features are allowed once, then blocked for the rest of the month.
  assert.equal((await lifeGate(root, 'memory', cfg)).allowed, true);
  await markReflect(root, 'memory', { text: '整理了三段', zone: 'Asia/Shanghai' });
  const after = await lifeGate(root, 'memory', cfg);
  assert.equal(after.allowed, false, 'the second monthly run must be refused');
  assert.match(after.reason, /窗口|window/i);

  // A different monthly feature is unaffected.
  assert.equal((await lifeGate(root, 'rules', cfg)).allowed, true);
  // Weekly persona is unaffected by the monthly one.
  assert.equal((await lifeGate(root, 'persona', cfg)).allowed, true);

  // Dropping a second monthly entry is refused at the ledger level too.
  await assert.rejects(markReflect(root, 'memory', { text: 'again', zone: 'Asia/Shanghai' }), (e) => e.code === 'DAILY_DUPLICATE');

  // Disabling reflection closes all three.
  cfg.life.reflect.enabled = false;
  for (const feature of ['memory', 'persona', 'rules']) assert.equal((await lifeGate(root, feature, cfg)).allowed, false);
});
