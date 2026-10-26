import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createBodyCapabilities } from '../lib/core/mc-body.js';

const make = async (t, bot) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-body-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return createBodyCapabilities({
    root,
    getBot: () => bot,
    online: () => Boolean(bot?.entity),
    status: () => ({ online: true }),
    goals: () => [],
    mcData: {},
  });
};

test('counts other players, not itself, and ignores players who left', async (t) => {
  const bot = {
    username: 'her',
    players: {
      her: { username: 'her', entity: { id: 1 } },
      friend: { username: 'friend', entity: { id: 2 } },
      // A player who quit: mineflayer keeps the entry but drops the entity.
      gone: { username: 'gone', entity: null },
    },
  };
  const caps = await make(t, bot);
  const s = caps.status();
  assert.equal(s.humansOnline, 1, 'only the player actually in the world counts');
});

test('reports an empty world when only she is online', async (t) => {
  const bot = { username: 'her', players: { her: { username: 'her', entity: { id: 1 } } } };
  const caps = await make(t, bot);
  assert.equal(caps.status().humansOnline, 0);
});

test('reports an empty world instead of throwing when the bot is gone', async (t) => {
  const caps = await make(t, null);
  const s = caps.status();
  assert.equal(s.humansOnline, 0, 'a disconnected body must not crash the status probe');
});

test('remembers when a human was last seen, so presence survives a short gap', async (t) => {
  const bot = { username: 'her', players: { her: { username: 'her', entity: { id: 1 } }, friend: { username: 'friend', entity: { id: 2 } } } };
  const caps = await make(t, bot);
  const first = caps.status();
  assert.equal(first.humansOnline, 1);
  assert.ok(first.lastHumanSeenAt > 0, 'seeing a human must stamp the time');
  // The friend leaves; the stamp stays behind as evidence of the last visit.
  bot.players.friend.entity = null;
  const second = caps.status();
  assert.equal(second.humansOnline, 0);
  assert.equal(second.lastHumanSeenAt, first.lastHumanSeenAt, 'the stamp must not be cleared by someone leaving');
});
