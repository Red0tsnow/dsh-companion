import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { nodeCandidates } from '../lib/core/paths.js';
import { resolveNode, isUsableNode } from '../lib/core/runner.js';

test('node candidates: explicit path first, PATH lookup last, every entry has a file', () => {
  const list = nodeCandidates('C:/custom/node.exe');
  assert.equal(list[0].file, 'C:/custom/node.exe');
  assert.equal(list.at(-1).file, 'node');
  assert.ok(list.every((c) => typeof c.file === 'string' && c.file.length > 0));
});

test('an Electron host binary counts as node only when ELECTRON_RUN_AS_NODE is set', () => {
  const probe = { node: '24.21.0', electron: true };
  assert.equal(isUsableNode(probe, { env: { ELECTRON_RUN_AS_NODE: '1' } }), true);
  assert.equal(isUsableNode(probe, {}), false);
  assert.equal(isUsableNode({ node: '24.21.0' }, {}), true);
  assert.equal(isUsableNode({ node: '20.11.0' }, {}), false);
  assert.equal(isUsableNode({ node: '22.0.0' }, {}), true);
  assert.equal(isUsableNode(null, {}), false);
});

test('resolveNode finds a runtime even when PATH has no node and DSH has no bundled runtime', async () => {
  const saved = { PATH: process.env.PATH, DSH_NODE: process.env.DSH_NODE, DSH_HOME: process.env.DSH_HOME };
  process.env.PATH = process.platform === 'win32' ? 'C:\\Windows\\System32' : '/usr/bin';
  delete process.env.DSH_NODE;
  process.env.DSH_HOME = path.join(os.tmpdir(), `companion-no-runtime-${Date.now()}`);
  try {
    const node = await resolveNode('');
    assert.equal(typeof node.file, 'string');
    assert.ok(node.file.length > 0);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
