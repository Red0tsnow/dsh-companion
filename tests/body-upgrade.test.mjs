import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { initialize } from '../lib/core/initialize.js';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const ship = await fs.readFile(new URL('../data/mc-daemon.mjs', import.meta.url));
const shipped = sha(ship);
// The body shipped by 0.5.x — a user who never edited it should get the new one.
const stock = '25225afb7ddd00b5a168b847358df08f693e5ad53f143dafa89c185194c261fb';

const fresh = async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-body-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return { root, body: path.join(root, 'runtime', 'mc', 'mc-daemon.mjs'), stamp: path.join(root, 'runtime', 'mc', 'body-template.json') };
};

test('a new install gets the shipped body', async (t) => {
  const { root, body } = await fresh(t);
  await initialize(root);
  assert.equal(sha(await fs.readFile(body)), shipped);
});

test('a new install writes the bridge the body imports', async (t) => {
  const { root } = await fresh(t);
  await initialize(root);
  const bridge = path.join(root, 'runtime', 'mc', 'bridge.mjs');
  const code = await fs.readFile(bridge, 'utf8');
  assert.match(code, /createBodyCapabilities/, 'the bridge must export the body capabilities');
  const mod = await import('file:///' + bridge.replaceAll('\\', '/') + '?t=' + Date.now());
  for (const key of ['ROOT', 'P', 'CONFIG', 'require', 'createBodyCapabilities']) assert.ok(key in mod, key + ' missing from bridge');
});

test('an unedited body from an older release is upgraded and backed up', async (t) => {
  const { root, body, stamp } = await fresh(t);
  await initialize(root);
  await fs.writeFile(body, '// body from 0.5.x\n');
  // Pretend it is the stock 0.5.x file by rewriting the stamp check input.
  await fs.writeFile(stamp, JSON.stringify({ hash: sha(Buffer.from('// body from 0.5.x\n')) }) + '\n');
  await initialize(root);
  assert.equal(sha(await fs.readFile(body)), shipped, 'an untouched body must follow the shipped template');
  const backups = await fs.readdir(path.join(root, 'runtime', 'mc', 'body-backups'));
  assert.equal(backups.length, 1, 'the replaced body must be backed up first');
});

test('a body the user edited is never overwritten', async (t) => {
  const { root, body, stamp } = await fresh(t);
  await initialize(root);
  const edited = (await fs.readFile(body, 'utf8')) + '\n// my own tweak\n';
  await fs.writeFile(body, edited);
  await fs.rm(stamp, { force: true });
  await initialize(root);
  assert.equal(await fs.readFile(body, 'utf8'), edited);
  const note = await fs.readFile(path.join(root, 'runtime', 'mc', 'BODY-UPGRADE.md'), 'utf8');
  assert.match(note, /没有自动升级/);
  assert.equal(stock.length, 64);
});

test('re-running initialize leaves an up-to-date body alone', async (t) => {
  const { root, body } = await fresh(t);
  await initialize(root);
  const before = await fs.stat(body);
  await initialize(root);
  assert.equal(sha(await fs.readFile(body)), shipped);
  assert.equal((await fs.stat(body)).mtimeMs, before.mtimeMs);
});
