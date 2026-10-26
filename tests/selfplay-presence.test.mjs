import test from 'node:test';
import assert from 'node:assert/strict';
import { selfplayDecision } from '../lib/core/life.js';
import { DEFAULTS } from '../lib/core/config.js';

const settings = () => ({ ...DEFAULTS.life.selfplay, enabled: true });
const fresh = () => ({}); // the function owns state.selfplay
const count = (state) => state.selfplay?.count ?? 0;
// A body where a human is present but has been silent for ten minutes.
const idleBody = (now, extra = {}) => ({
  task: { state: 'idle' },
  lastInputAt: now - 600000,
  lastFinishedAt: 0,
  lastHumanInputAt: now - 600000,
  humansOnline: 1,
  ...extra,
});
const now = 5_000_000;

test('wakes only while another player is in the world', () => {
  const state = fresh();
  const woke = selfplayDecision({ body: idleBody(now), state, settings: settings(), now });
  assert.equal(woke.length, 1, 'a present human plus idle time should produce one wake');
  assert.equal(woke[0].after_seconds, 1);
});

test('never wakes when the world is empty, and resets the streak', () => {
  const state = fresh();
  const woke = selfplayDecision({ body: idleBody(now, { humansOnline: 0 }), state, settings: settings(), now });
  assert.deepEqual(woke, [], 'nobody in the world must not produce a wake');
  assert.equal(count(state), 0, 'an empty world must not accumulate a streak');
});

test('an empty world clears a previously armed entry instead of leaving it to fire', () => {
  const state = fresh();
  assert.equal(selfplayDecision({ body: idleBody(now), state, settings: settings(), now }).length, 1);
  assert.equal(count(state), 1);
  // The human leaves; the armed entry must be withdrawn on the next reconcile.
  const woke = selfplayDecision({ body: idleBody(now + 1000, { humansOnline: 0 }), state, settings: settings(), now: now + 1000 });
  assert.deepEqual(woke, [], 'the previously armed entry must be removed, not fired later');
  assert.equal(count(state), 0);
});

test('requireHuman:false is the explicit opt-out for solo play', () => {
  const state = fresh();
  const woke = selfplayDecision({
    body: idleBody(now, { humansOnline: 0 }),
    state,
    settings: { ...settings(), requireHuman: false },
    now,
  });
  assert.equal(woke.length, 1, 'opting out must restore the old behaviour');
});

test('a running task blocks waking', () => {
  const state = fresh();
  assert.deepEqual(selfplayDecision({ body: idleBody(now, { task: { state: 'running' } }), state, settings: settings(), now }), []);
});

test('cooldown refuses a second wake, and allows one after it expires', () => {
  const s = settings();
  const state = fresh();
  const body = idleBody(now);
  const first = selfplayDecision({ body, state, settings: s, now });
  assert.equal(count(state), 1);

  // Within the cooldown: not a new wake. The armed entry may still be reported
  // (it stays in the schedule file until it fires), so compare identity.
  const early = selfplayDecision({ body, state, settings: s, now: now + 1000 });
  assert.equal(count(state), 1, 'cooldown must not count a new wake');
  assert.equal(early[0]?.id, first[0]?.id, 'cooldown must not arm a different entry');

  const later = selfplayDecision({ body, state, settings: s, now: now + s.cooldownSeconds * 1000 + 1 });
  assert.equal(count(state), 2, 'after the cooldown it may wake again');
  assert.notEqual(later[0]?.id, first[0]?.id);
});

test('the consecutive cap holds across many idle periods', () => {
  const s = settings();
  const state = fresh();
  for (let i = 0; i <= s.maxConsecutive + 3; i++) {
    selfplayDecision({ body: idleBody(now), state, settings: s, now: now + i * s.cooldownSeconds * 1000 });
  }
  assert.equal(count(state), s.maxConsecutive, 'the cap must stop at maxConsecutive');
});

test('a human speaking resets the streak so the cap is per-visit', () => {
  const s = settings();
  const state = fresh();
  for (let i = 0; i < 4; i++) {
    selfplayDecision({ body: idleBody(now), state, settings: s, now: now + i * s.cooldownSeconds * 1000 });
  }
  assert.ok(count(state) >= 3);
  const spokeAt = now + 4 * s.cooldownSeconds * 1000;
  // A human message updates both stamps in the body (see mc-body attach()).
  selfplayDecision({ body: idleBody(spokeAt, { lastHumanInputAt: spokeAt, lastInputAt: spokeAt }), state, settings: s, now: spokeAt });
  assert.equal(count(state), 0, 'a human message must reset the consecutive counter');
  // And right after speaking, idle time is zero, so nothing is armed either.
  assert.deepEqual(state.selfplay.entry, undefined, 'a fresh message must not leave an entry armed');
});
