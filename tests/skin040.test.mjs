import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SetupManager } from '../lib/core/setup.js';
import { ConfigStore } from '../lib/core/config.js';

const pin = JSON.parse(await fs.readFile(new URL('../tools/known-good.json', import.meta.url), 'utf8'));

test('known-good pins Paper and SkinsRestorer with complete hashes and official hosts', () => {
  assert.equal(pin.mode, 'portable');
  assert.equal(pin.paper.releaseVerified,true,'Client-visible evidence is required before enabling the reviewed Paper pin');
  assert.equal(pin.skinsrestorer.releaseVerified,true);
  assert.match(pin.paper.sha256, /^[a-f0-9]{64}$/);
  assert.match(pin.paper.url, /^https:\/\/fill-data\.papermc\.io\//);
  assert.ok(Number(pin.paper.size) > 0);
  assert.match(pin.skinsrestorer.sha512, /^[a-f0-9]{128}$/);
  assert.match(pin.skinsrestorer.url, /^https:\/\/cdn\.modrinth\.com\//);
  assert.ok(Number(pin.skinsrestorer.size) > 0);
});

test('skin application refuses an insecure URL and a non-Paper world', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-skin-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const manager = new SetupManager(new ConfigStore(dir), { platform: 'win32' });
  t.after(() => manager.close());
  await assert.rejects(manager.applySkin({ url: 'http://example.com/skin.png' }), /https/i);
  await assert.rejects(manager.applySkin({ url: 'https://example.com/skin.png' }), /Paper/i);
});
