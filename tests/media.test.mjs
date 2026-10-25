import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const media = await import('../lib/core/media.js').catch(() => ({}));
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
async function temp(t) { const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-media-')); t.after(() => fs.rm(root, { recursive: true, force: true })); return root; }
test('uploaded image is listed, served with correct type and removed without touching other files', async t => {
  assert.equal(typeof media.uploadMedia, 'function'); const root = await temp(t);
  const item = await media.uploadMedia(root, { name: 'rain.png', kind: 'image', data: PNG });
  assert.equal(item.mime, 'image/png'); assert.equal((await media.listMedia(root)).length, 1);
  const read = await media.readMedia(root, item.id); assert.equal(read.data.toString('base64'), PNG); assert.equal(read.mime, 'image/png');
  await media.removeMedia(root, item.id); assert.equal((await media.listMedia(root)).length, 0);
});
test('media rejects traversal, unsupported content and links outside its media root', async t => {
  assert.equal(typeof media.uploadMedia, 'function'); const root = await temp(t);
  await assert.rejects(media.uploadMedia(root, { name: '../escape.png', kind: 'image', data: PNG }));
  await assert.rejects(media.uploadMedia(root, { name: 'script.png', kind: 'image', data: Buffer.from('<script>bad()</script>').toString('base64') }));
  await assert.rejects(media.readMedia(root, '../config.json'));
  const mediaDir = path.join(root, 'workspace', 'media'), outside = path.join(root, 'outside'); await fs.mkdir(path.dirname(mediaDir), { recursive: true }); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'secret.png'), Buffer.from(PNG, 'base64'));
  await fs.symlink(outside, mediaDir, process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal((await media.listMedia(root)).length, 0); await assert.rejects(media.readMedia(root, 'secret.png'));
});
