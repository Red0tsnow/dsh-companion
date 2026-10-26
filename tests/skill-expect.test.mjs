import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSkill } from '../lib/core/skill-expect.js';

const body = (extra = {}) => ({
  online: true,
  dimension: 'overworld',
  position: [0, 64, 0],
  health: 20,
  inventory: {},
  ...extra,
});

test('a skill without acceptance criteria is never "learned"', () => {
  for (const expect of [null, undefined]) {
    const r = evaluateSkill(expect, body(), body());
    assert.equal(r.status, 'unverified');
    assert.equal(r.ok, false);
    assert.match(r.reason, /未验收|No acceptance/);
  }
});

test('malformed criteria are rejected, not ignored', () => {
  const bad = [
    [],
    'healthAtLeast',
    42,
    {},
    { ate: 1 },
    { inventoryDelta: {} },
    { inventoryDelta: [] },
    { inventoryDelta: 'stone' },
    { movedAtLeast: 0 },
    { movedAtLeast: -1 },
    { movedAtLeast: '3' },
    { healthAtLeast: -1 },
    { healthAtLeast: 21 },
    { healthAtLeast: '10' },
  ];
  for (const expect of bad) {
    const r = evaluateSkill(expect, body(), body());
    assert.equal(r.status, 'failed', `must reject ${JSON.stringify(expect)}`);
    assert.equal(r.ok, false);
    assert.match(r.reason, /验收条件|criteria/);
    assert.equal(r.checks, undefined, 'nothing may be reported as checked');
  }
});

test('invalid inventory entries are rejected too', () => {
  for (const expect of [
    { inventoryDelta: { stone: 0 } },
    { inventoryDelta: { stone: -2 } },
    { inventoryDelta: { 'Stone': 1 } },
    { inventoryDelta: { stone: '1' } },
    { inventoryDelta: { stone: Infinity } },
  ]) {
    const r = evaluateSkill(expect, body(), body());
    assert.equal(r.status, 'failed', `must reject ${JSON.stringify(expect)}`);
    assert.match(r.reason, /背包验收条件|inventory criteria/);
  }
});

test('inventory growth is measured as a difference, not an absolute amount', () => {
  const before = body({ inventory: { stone: 2 } });
  const after = body({ inventory: { stone: 5 } });
  const r = evaluateSkill({ inventoryDelta: { stone: 3 } }, before, after);
  assert.equal(r.status, 'passed');
  assert.equal(r.ok, true);
  assert.deepEqual(r.checks, [{ kind: 'inventoryDelta', name: 'stone', expected: 3, actual: 3 }]);

  const short = evaluateSkill({ inventoryDelta: { stone: 4 } }, before, after);
  assert.equal(short.status, 'failed');
  assert.equal(short.ok, false);
  assert.equal(short.checks[0].actual, 3);
  assert.match(short.reason, /未达到验收条件|not met/);
});

test('a missing inventory count counts as zero, not as an error', () => {
  const r = evaluateSkill({ inventoryDelta: { torch: 2 } }, body(), body({ inventory: { torch: 2 } }));
  assert.equal(r.status, 'passed');
});

test('movement is only credited inside the same dimension', () => {
  const before = body({ position: [0, 64, 0] });
  const moved = evaluateSkill({ movedAtLeast: 4 }, before, body({ position: [3, 64, 4] }));
  assert.equal(moved.status, 'passed');
  assert.equal(moved.checks[0].actual, 5);

  const teleport = evaluateSkill({ movedAtLeast: 4 }, before, body({ dimension: 'the_nether', position: [3, 64, 4] }));
  assert.equal(teleport.status, 'failed');
  assert.equal(teleport.checks[0].actual, 0, 'a dimension change is not walking somewhere');

  const malformed = evaluateSkill({ movedAtLeast: 4 }, body({ position: [0, 64] }), body({ position: [1, 64, 0] }));
  assert.equal(malformed.status, 'failed', 'a body without a full position has not moved');
});

test('health must be at least the threshold, and exactly the threshold passes', () => {
  assert.equal(evaluateSkill({ healthAtLeast: 12 }, body({ health: 12 }), body({ health: 12 })).status, 'passed');
  const hurt = evaluateSkill({ healthAtLeast: 12 }, body({ health: 20 }), body({ health: 11 }));
  assert.equal(hurt.status, 'failed');
  assert.equal(hurt.checks[0].actual, 11);
});

test('an offline body cannot verify anything, even with matching numbers', () => {
  for (const [before, after] of [
    [body({ online: false }), body()],
    [body(), body({ online: false })],
    [{}, body()],
  ]) {
    const r = evaluateSkill({ healthAtLeast: 10 }, before, after);
    assert.equal(r.status, 'failed');
    assert.match(r.reason, /身体离线|Body offline/);
    assert.equal(r.checks, undefined);
  }
});

test('every criterion must pass for the skill to count', () => {
  const before = body({ inventory: { stone: 1 } });
  const after = body({ inventory: { stone: 3 }, health: 20, position: [1, 64, 0] });
  const r = evaluateSkill({ inventoryDelta: { stone: 2 }, movedAtLeast: 1, healthAtLeast: 20 }, before, after);
  assert.equal(r.status, 'passed');
  assert.equal(r.checks.length, 3);
  assert.ok(r.checks.every((c) => c.actual >= c.expected));

  const failed = evaluateSkill({ inventoryDelta: { stone: 2 }, movedAtLeast: 5, healthAtLeast: 20 }, before, after);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.checks.find((c) => c.kind === 'movedAtLeast').actual, 1, 'the failing check must show the real distance');
  assert.ok(r.checks.every((c) => Number.isFinite(c.actual)));
});
