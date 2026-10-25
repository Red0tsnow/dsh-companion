import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const migration = await import('../lib/core/migration.js').catch(() => ({}));
test('migration preview does not write, apply copies only allowlisted files and never overwrites', async t => {
  assert.equal(typeof migration.migrate, 'function');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-migration-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'), next = path.join(root, 'new'); await fs.mkdir(path.join(old, 'whale-work'), { recursive: true });
  await fs.writeFile(path.join(old, 'whale-work', 'MEMORY.md'), 'Remember rain');
  await fs.writeFile(path.join(old, 'whale-work', 'secret.txt'), 'not for migration');
  await migration.migrate({ source: old, target: next }); await assert.rejects(fs.stat(next));
  await migration.migrate({ source: old, target: next, apply: true });
  assert.equal(await fs.readFile(path.join(next, 'workspace', 'MEMORY.md'), 'utf8'), 'Remember rain');
  await fs.writeFile(path.join(next, 'workspace', 'MEMORY.md'), 'New memory');
  await migration.migrate({ source: old, target: next, apply: true });
  assert.equal(await fs.readFile(path.join(next, 'workspace', 'MEMORY.md'), 'utf8'), 'New memory');
  assert.equal(await fs.readFile(path.join(old, 'whale-work', 'MEMORY.md'), 'utf8'), 'Remember rain');
  await assert.rejects(fs.stat(path.join(next, 'workspace', 'secret.txt')));
});

test('migration refuses a destination directory link that would write outside its target', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-migration-link-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'), next = path.join(root, 'new'), outside = path.join(root, 'outside');
  await fs.mkdir(path.join(old, 'whale-work'), { recursive: true }); await fs.mkdir(next); await fs.mkdir(outside);
  await fs.writeFile(path.join(old, 'whale-work', 'MEMORY.md'), 'Private memory');
  await fs.symlink(outside, path.join(next, 'workspace'), process.platform === 'win32' ? 'junction' : 'dir');
  const report = await migration.migrate({ source: old, target: next, apply: true });
  assert.equal((await fs.readdir(outside)).length, 0);
  assert.equal(report.entries.find(x => x.file.endsWith('MEMORY.md')).status, 'unsafe-target');
});

test('migration rewrites owned script paths and imports cron schedules disabled with remapped targets', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-migration-paths-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'), next = path.join(root, 'new');
  await fs.mkdir(path.join(old, 'whale-work'), { recursive: true }); await fs.mkdir(path.join(old, 'mc', 'skills'), { recursive: true });
  await fs.writeFile(path.join(old, 'mc', 'skills', 'rain.mjs'), `const tool = ${JSON.stringify(path.join(old, 'mc', 'mc.mjs'))};`);
  await fs.writeFile(path.join(old, 'whale-work', 'daily.schedule.json'), JSON.stringify({ version: 1, target: { mode: 'fork', sessionId: 'old-session', channel: 'qq', id: '123' }, entries: [{ id: 'night', cron: '0 22 * * *', time_zone: 'Asia/Shanghai', prompt: `Read ${path.join(old, 'whale-work', 'MEMORY.md')}` }] }));
  await migration.migrate({ source: old, target: next, apply: true });
  const skill = await fs.readFile(path.join(next, 'runtime', 'mc', 'skills', 'rain.mjs'), 'utf8');
  assert.equal(skill.includes(JSON.stringify(path.join(next, 'runtime', 'mc', 'mc.mjs'))), true);
  const alarm = JSON.parse(await fs.readFile(path.join(next, 'schedules', 'daily.schedule.json'), 'utf8'));
  assert.equal(alarm.entries[0].enabled, false); assert.equal(alarm.entries[0].cron, '0 22 * * *');
  assert.equal(alarm.target.mode, 'fork'); assert.equal(alarm.target.sessionId, undefined); assert.equal(alarm.target.channel, 'dsh');
  assert.equal(alarm.entries[0].prompt, `Read ${path.join(next, 'workspace', 'MEMORY.md')}`);
});

test('the default nested companion destination is allowed without recursively migrating itself', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-migration-nested-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'whale-work')); await fs.writeFile(path.join(root, 'whale-work', 'MEMORY.md'), 'Nested destination memory');
  const report = await migration.migrate({ source: root, target: path.join(root, 'companion'), apply: true });
  assert.equal(report.entries.find(e => e.file === 'whale-work/MEMORY.md').status, 'copied');
  assert.equal(await fs.readFile(path.join(root, 'companion', 'workspace', 'MEMORY.md'),'utf8'),'Nested destination memory');
});

test('credentials require explicit migration and never overwrite existing account values', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-migration-secrets-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const old = path.join(root, 'old'), next = path.join(root, 'new'); await fs.mkdir(old); await fs.mkdir(path.join(root, '.bili-ai'));
  await fs.writeFile(path.join(root, '.bili-ai', 'credentials.json'), JSON.stringify({ sessdata: 'source-cookie', bili_jct: 'source-jct' }));
  await migration.migrate({ source: old, target: next, apply: true }); await assert.rejects(fs.stat(path.join(next, 'secrets.json')));
  await migration.migrate({ source: old, target: next, apply: true, credentials: true });
  const first = JSON.parse(await fs.readFile(path.join(next, 'secrets.json'), 'utf8')); assert.equal(first.bili.sessdata, 'source-cookie');
  await fs.writeFile(path.join(next, 'secrets.json'), JSON.stringify({ bodyToken: 'keep-token', bili: { sessdata: 'new-cookie' } }));
  await migration.migrate({ source: old, target: next, apply: true, credentials: true });
  const second = JSON.parse(await fs.readFile(path.join(next, 'secrets.json'), 'utf8')); assert.equal(second.bili.sessdata, 'new-cookie'); assert.equal(second.bodyToken, 'keep-token');
});
