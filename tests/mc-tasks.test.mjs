import test from 'node:test';
import assert from 'node:assert/strict';
import { BodyTasks, inventory, progressFingerprint, validateIntent } from '../lib/core/mc-tasks.js';

// 用假身体把"做完没有"的每条分支都跑一遍。真的身体只在验收时用。
const rig = ({ online = true, position = { x: 0, y: 64, z: 0 }, health = 20, items = [], players = {}, entities = {}, data = {}, findBlocks = () => [], blockAt = () => null } = {}) => {
  const calls = { goals: [], clear: 0, attacks: [], collected: [], finishes: [] };
  const state = { online };
  const bot = {
    version: '1.21.8',
    health,
    username: 'Care',
    entity: { position: { ...position } },
    players,
    entities,
    inventory: { items: () => items.map((i) => ({ ...i })) },
    pathfinder: { goal: null, setGoal(goal) { this.goal = goal; calls.goals.push(goal); } },
    clearControlStates() { calls.clear++; },
    stopDigging() { return Promise.resolve(); },
    collectBlock: { cancelTask() { return Promise.resolve(); }, collect: async (block) => { calls.collected.push(block); } },
    findBlocks: (options) => findBlocks(options),
    blockAt: (point) => blockAt(point),
    attack(target) { calls.attacks.push(target); },
  };
  const goals = {
    GoalNear: class { constructor(x, y, z, range) { Object.assign(this, { kind: 'near', x, y, z, range }); } },
    GoalFollow: class { constructor(entity, range) { Object.assign(this, { kind: 'follow', entity, range }); } },
  };
  const tasks = new BodyTasks({
    getBot: () => bot,
    online: () => state.online,
    goals,
    mcData: () => data,
    onFinish: (status) => calls.finishes.push(status),
  });
  return { bot, tasks, calls, state, items, goals };
};

const silent = () => new Promise((resolve) => setImmediate(resolve));

test('validateIntent fills safe defaults and accepts the type alias', () => {
  assert.deepEqual(validateIntent({ intent: 'goto', x: 112, y: 70, z: -8 }), {
    intent: 'goto', x: 112, y: 70, z: -8, waitSec: 8, timeoutSec: 300,
  });
  assert.deepEqual(validateIntent({ type: 'idle', seconds: 12 }), { type: 'idle', intent: 'idle', waitSec: 8, timeoutSec: 300, seconds: 12 });
  assert.deepEqual(validateIntent({ intent: 'mine', block: 'oak_log' }), {
    intent: 'mine', block: 'oak_log', waitSec: 8, timeoutSec: 300, count: 1,
  });
  assert.equal(validateIntent({ intent: 'hunt', waitSec: 30, timeoutSec: 3600, maxHits: 120 }).maxHits, 120);
});

test('validateIntent rejects anything the body cannot actually do', () => {
  assert.throws(() => validateIntent({}), /未知意图|Unknown intent/);
  assert.throws(() => validateIntent({ intent: 'fly' }), /未知意图|Unknown intent/);
  assert.throws(() => validateIntent({ intent: 'goto', x: 1, y: 2 }), /坐标|coordinates/);
  assert.throws(() => validateIntent({ intent: 'goto', x: 1, y: Infinity, z: 3 }), /坐标|coordinates/);
  assert.throws(() => validateIntent({ intent: 'goto', x: 1e9, y: 64, z: 0 }), /坐标|coordinates/);
  assert.throws(() => validateIntent({ intent: 'follow', player: 'not a name' }), /玩家|Player name/);
  assert.throws(() => validateIntent({ intent: 'goto', x: 1, y: 2, z: 3, waitSec: 31 }), /超出范围|out of range/);
  assert.throws(() => validateIntent({ intent: 'goto', x: 1, y: 2, z: 3, timeoutSec: 3601 }), /超出范围|out of range/);
  assert.throws(() => validateIntent({ intent: 'idle', seconds: 3601 }), /超出范围|out of range/);
  assert.throws(() => validateIntent({ intent: 'idle', seconds: -1 }), /超出范围|out of range/);
  assert.throws(() => validateIntent({ intent: 'hunt', maxHits: 0 }), /maxHits/);
  assert.throws(() => validateIntent({ intent: 'hunt', maxHits: 1.5 }), /maxHits/);
  assert.throws(() => validateIntent({ intent: 'hunt', maxHits: 121 }), /超出范围|out of range/);
  assert.throws(() => validateIntent({ intent: 'mine', block: 'Stone!' }), /方块|Block name/);
  assert.throws(() => validateIntent({ intent: 'mine', block: 'stone', count: 0 }), /count/);
  assert.throws(() => validateIntent({ intent: 'mine', block: 'stone', count: 2.5 }), /count/);
  assert.throws(() => validateIntent({ intent: 'mine', block: 'stone', count: 65 }), /超出范围|out of range/);
});

test('inventory merges stacks by name and the fingerprint notices change', () => {
  const { bot, items } = rig({ items: [{ name: 'stone', count: 3 }, { name: 'stone', count: 2 }, { name: 'torch', count: 5 }] });
  assert.deepEqual(inventory(bot), { stone: 5, torch: 5 });

  const before = progressFingerprint(bot);
  assert.equal(progressFingerprint(bot), before, 'a still body must fingerprint the same');
  items.push({ name: 'dirt', count: 1 });
  assert.notEqual(progressFingerprint(bot), before, 'picking something up is progress');
  bot.entity.position.x += 1;
  assert.notEqual(progressFingerprint(bot), before, 'moving is progress');
});

test('no task, offline body and a second task are all refused', () => {
  const { tasks, calls } = rig();
  assert.equal(tasks.status().state, 'failed');
  assert.match(tasks.status().reason, /没有任务|No task/);

  const { tasks: offline } = rig({ online: false });
  assert.throws(() => offline.start({ intent: 'idle', seconds: 5 }), /离线|offline/);

  const running = rig();
  running.tasks.start({ intent: 'goto', x: 100, y: 64, z: 100 });
  assert.throws(() => running.tasks.start({ intent: 'idle', seconds: 5 }), /已有任务|stop it first/);
  assert.equal(running.tasks.status().state, 'running');

  running.tasks.cancel();
  assert.equal(running.calls.clear > 0, true, 'cancelling must release the controls');
  assert.equal(running.bot.pathfinder.goal, null);
});

test('goto arrives, sets a goal on the way, and reports arrival', () => {
  const { tasks, calls, goals } = rig({ position: { x: 0, y: 64, z: 0 } });
  const result = tasks.start({ intent: 'goto', x: 2, y: 64, z: 1 });
  assert.equal(result.state, 'done');
  assert.equal(result.arrived, true);
  assert.equal(calls.finishes.length, 1, 'onFinish must fire exactly once');
  assert.match(calls.finishes[0].reason, /已到达|Arrived/);

  const far = rig();
  far.tasks.start({ intent: 'goto', x: 120, y: 70, z: 40 });
  assert.ok(far.bot.pathfinder.goal instanceof far.goals.GoalNear);
  assert.deepEqual(
    { x: far.bot.pathfinder.goal.x, y: far.bot.pathfinder.goal.y, z: far.bot.pathfinder.goal.z, range: far.bot.pathfinder.goal.range },
    { x: 120, y: 70, z: 40, range: 2 },
  );
  assert.equal(far.tasks.status().state, 'running');
});

test('goto fails honestly on timeout and on being stuck', () => {
  const timed = rig();
  timed.tasks.start({ intent: 'goto', x: 500, y: 64, z: 500 });
  timed.tasks.task.startedAt = Date.now() - 301 * 1000;
  timed.tasks.tick();
  assert.equal(timed.tasks.status().state, 'failed');
  assert.match(timed.tasks.status().reason, /超时|timed out/);

  const stuck = rig();
  stuck.tasks.start({ intent: 'goto', x: 500, y: 64, z: 500 });
  for (let i = 0; i < 9; i++) stuck.tasks.tick();
  assert.equal(stuck.tasks.status().state, 'running', 'nine still ticks are not proof of being stuck');
  stuck.tasks.tick();
  assert.equal(stuck.tasks.status().state, 'failed');
  assert.equal(stuck.tasks.status().code, 'stuck');
  assert.match(stuck.tasks.status().reason, /没有进展|No progress/);
});

test('follow needs a visible player and says whether it caught up', () => {
  const absent = rig();
  absent.tasks.start({ intent: 'follow', player: 'Steve', seconds: 10 });
  assert.equal(absent.tasks.status().state, 'failed');
  assert.match(absent.tasks.status().reason, /看不到玩家|not visible/);

  const near = rig({ players: { Steve: { entity: { position: { x: 1, y: 64, z: 0 } } } } });
  near.tasks.start({ intent: 'follow', player: 'Steve', seconds: 10 });
  assert.equal(near.tasks.status().state, 'done');
  assert.equal(near.tasks.status().near, true);

  const far = rig({ players: { Steve: { entity: { position: { x: 40, y: 64, z: 0 } } } } });
  far.tasks.start({ intent: 'follow', player: 'Steve', seconds: 10 });
  assert.equal(far.tasks.status().state, 'running');
  assert.equal(far.bot.pathfinder.goal.kind, 'follow');
  far.tasks.task.startedAt = Date.now() - 11 * 1000;
  far.tasks.tick();
  assert.equal(far.tasks.status().state, 'failed');
  assert.equal(far.tasks.status().near, false);
  assert.match(far.tasks.status().reason, /跟随时间到|Follow ended/);
});

test('hunt fights when close, gives up at the hit limit and retreats when hurt', () => {
  const zombie = (x) => ({ id: 'z1', name: 'zombie', position: { x, y: 64, z: 0 }, isValid: true });

  const none = rig({ entities: {} });
  none.tasks.start({ intent: 'hunt' });
  assert.equal(none.tasks.status().state, 'failed');
  assert.match(none.tasks.status().reason, /附近没有目标|No target nearby/);

  const fight = rig({ entities: { z1: zombie(2) } });
  fight.tasks.start({ intent: 'hunt' });
  assert.equal(fight.calls.attacks.length, 1, 'a hostile in reach is hit once per tick window');
  assert.equal(fight.tasks.status().hits, 1);

  const limited = rig({ entities: { z1: zombie(2) } });
  limited.tasks.start({ intent: 'hunt', maxHits: 1 });
  limited.tasks.tick();
  assert.equal(limited.tasks.status().state, 'failed');
  assert.match(limited.tasks.status().reason, /攻击上限|Hit limit/);

  const hurt = rig({ health: 6, entities: { z1: zombie(2) } });
  hurt.tasks.start({ intent: 'hunt' });
  assert.equal(hurt.tasks.status().state, 'failed');
  assert.equal(hurt.tasks.status().retreated, true);
  assert.equal(hurt.bot.pathfinder.goal.kind, 'near', 'retreating must actually move away');
  const goal = hurt.bot.pathfinder.goal;
  assert.ok(Math.hypot(goal.x - 2, goal.z - 0) > Math.hypot(0 - 2, 0), 'the retreat point must be farther from the zombie than the body is');

  const giant = rig({ entities: { z1: { ...zombie(2), name: 'not_a_hostile' } } });
  giant.tasks.start({ intent: 'hunt' });
  assert.equal(giant.calls.attacks.length, 0, 'a non-hostile entity is never attacked');
});

test('a target that dies ends the hunt as done', () => {
  const { tasks, bot, calls } = rig({ entities: { z1: { id: 'z1', name: 'zombie', position: { x: 8, y: 64, z: 0 }, isValid: true } } });
  tasks.start({ intent: 'hunt' });
  assert.equal(tasks.status().state, 'running');
  assert.equal(calls.goals.at(-1).kind, 'follow');
  bot.entities = {};
  tasks.tick();
  assert.equal(tasks.status().state, 'done');
  assert.match(tasks.status().reason, /目标消失|Target disappeared/);
});

test('mine counts real inventory growth, not the digging animation', async () => {
  const point = { x: 1, y: 64, z: 1 };
  const block = { name: 'oak_log' };
  const { tasks, items, calls } = rig({ data: { blocksByName: { oak_log: { id: 17 } } }, findBlocks: () => [point], blockAt: () => block });
  tasks.start({ intent: 'mine', block: 'oak_log', count: 4 });
  assert.equal(tasks.status().state, 'running');
  await silent();
  assert.equal(calls.collected.length, 1, 'digging must be started exactly once');
  assert.equal(calls.collected[0], block);

  items.push({ name: 'oak_log', count: 3 });
  tasks.tick();
  assert.equal(tasks.status().state, 'running', 'three of four is not done');
  assert.equal(tasks.status().inventoryDelta, 3);

  items.push({ name: 'oak_log', count: 1 });
  tasks.tick();
  assert.equal(tasks.status().state, 'done');
  assert.match(tasks.status().reason, /背包数量|Inventory target/);
});

test('mine refuses unknown blocks and empty surroundings', () => {
  const unknown = rig({ data: { blocksByName: {} } });
  unknown.tasks.start({ intent: 'mine', block: 'unobtainium' });
  assert.equal(unknown.tasks.status().state, 'failed');
  assert.match(unknown.tasks.status().reason, /未知方块|Unknown block/);

  const empty = rig({ data: { blocksByName: { stone: { id: 1 } } }, findBlocks: () => [] });
  empty.tasks.start({ intent: 'mine', block: 'stone' });
  assert.equal(empty.tasks.status().state, 'failed');
  assert.match(empty.tasks.status().reason, /附近没有方块|No matching block/);
});

test('wait returns the finished result, or the running one when the clock runs out', () => {
  const { tasks } = rig({ position: { x: 0, y: 64, z: 0 } });
  const started = tasks.start({ intent: 'goto', x: 1, y: 64, z: 0 });
  return tasks.wait(started.id, 1).then((result) => {
    assert.equal(result.state, 'done');
  });
});

test('wait with no time left reports "still running" instead of pretending', async () => {
  const { tasks } = rig();
  const started = tasks.start({ intent: 'idle', seconds: 30 });
  const result = await tasks.wait(started.id, 0);
  assert.equal(result.state, 'running');
  tasks.cancel();
});
