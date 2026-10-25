import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { hostBridge } from '../lib/core/host.js';
import { savePersona } from '../lib/core/persona.js';
import { initialize } from '../lib/core/initialize.js';

test('host forwards only the turn containing its exact input identity', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-host-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await initialize(root); await savePersona(root, 'You are River.');
  const events = []; let queued;
  const agent = { session: { snapshotEvents: () => events }, whenIdle: async () => {}, followup(message) {
    queued = message;
    events.push({ seq: 1, type: 'turn/start', data: { turn: 1 } }, { seq: 2, type: 'user/message', data: message }, { seq: 3, type: 'assistant/message', data: { turn: 1, message: { content: [{ type: 'text', text: 'own answer' }] } } }, { seq: 4, type: 'turn/start', data: { turn: 2 } }, { seq: 5, type: 'user/message', data: { id: 'native-user', source: { kind: 'user' } } }, { seq: 6, type: 'assistant/message', data: { turn: 2, message: { content: [{ type: 'text', text: 'unrelated private answer' }] } } });
  } };
  const bridge = hostBridge({ sessionController: {}, agents: { get: () => agent } }, root, async () => 'River');
  const answer = await bridge.turn('s', { channel: 'mc', kind: 'world', text: 'rain' }, new AbortController().signal);
  assert.equal(answer, 'own answer'); assert.equal(queued.source.kind, 'dsh-companion-world'); assert.match(queued.content[0].text, /world_event source="minecraft"/);
});
test('host declines to forward a mixed native and channel turn', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-host-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await initialize(root); await savePersona(root, 'You are River.'); const events = [];
  const agent = { session: { snapshotEvents: () => events }, whenIdle: async () => {}, followup(message) {
    events.push({ seq: 1, type: 'turn/start', data: { turn: 1 } }, { seq: 2, type: 'user/message', data: message }, { seq: 3, type: 'user/message', data: { id: 'native', source: { kind: 'user' } } }, { seq: 4, type: 'assistant/message', data: { turn: 1, message: { content: [{ type: 'text', text: 'private' }] } } });
  } };
  const bridge = hostBridge({ sessionController: {}, agents: { get: () => agent } }, root, async () => 'River');
  await assert.rejects(bridge.turn('s', { channel: 'qq', text: 'hi' }, new AbortController().signal), /mixed|multiple|多个/i);
});
