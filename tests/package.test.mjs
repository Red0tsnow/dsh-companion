import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const checker = await import('../scripts/check.mjs').catch(() => ({}));

test('release audit rejects machine-specific paths and a bundled platform signing module', async t => {
  assert.equal(typeof checker.auditFiles, 'function');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-audit-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'machine.js');
  await fs.writeFile(file, `const p = ${JSON.stringify(['C:', 'Users', 'developer', 'private'].join('\\'))};\n`);
  let errors = await checker.auditFiles([file]); assert.ok(errors.some(e => e.rule === 'private-path'));
  const signature = path.join(dir, 'xhh', 'sign.mjs'); await fs.mkdir(path.dirname(signature)); await fs.writeFile(signature, 'export const value = 1;');
  errors = await checker.auditFiles([signature]); assert.ok(errors.some(e => e.rule === 'excluded-signing'));

  assert.equal(typeof checker.auditProvenance, 'function');
  const entry = { source:'bili-tools/lib/sample.mjs', target:'sample.mjs', sha256:'a'.repeat(64) };
  await fs.writeFile(path.join(dir,entry.target),'export {};');
  assert.deepEqual(checker.auditProvenance([entry],{rootDir:dir}),[]);
  errors = checker.auditProvenance([{...entry,target:'missing.mjs'}],{rootDir:dir});
  assert.ok(errors.some(e=>e.rule==='provenance-target'&&e.index===0));
  for (const [field,value] of [
    ['source','xhh/lib/sign.mjs'],['target','tools\\xhh\\lib\\format.mjs'],
    ['source','../Documents/persona.md'],['target','..\\outside.mjs'],
    ['source','plugins/local/tools/sample.mjs'],['source','bili-tools/lib/sign.mjs'],
  ]) {
    errors = checker.auditProvenance([{...entry,[field]:value}],{rootDir:dir});
    assert.ok(errors.some(e=>e.rule==='provenance-reference'&&e.index===0),`${field}: ${value}`);
  }
  const excluded = path.join(dir,'tools','xhh'); await fs.mkdir(excluded,{recursive:true});
  assert.ok(checker.auditProvenance([entry],{rootDir:dir}).some(e=>e.rule==='excluded-directory'));
  await fs.writeFile(path.join(excluded,'reintroduced.mjs'),'export {};');
  assert.ok(checker.auditProvenance([entry],{rootDir:dir}).some(e=>e.rule==='excluded-directory'));
});

test('release audit catches a broken relative import before packaging', async t => {
  assert.equal(typeof checker.auditFiles, 'function');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-import-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'missing.mjs'); await fs.writeFile(file, "import './missing-local.mjs';\n");
  const errors = await checker.auditFiles([file]); assert.ok(errors.some(e => e.rule === 'missing-import'));
});

test('npm archive includes host and client entries and excludes private/development data', async () => {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['pack', '--dry-run', '--json', '--ignore-scripts', '--cache', '.dev/npm-cache'];
  const { stdout } = process.platform === 'win32'
    ? await exec(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `${npm} ${args.join(' ')}`], { timeout: 30000, windowsHide: true, maxBuffer: 1024 * 1024 })
    : await exec(npm, args, { timeout: 30000, maxBuffer: 1024 * 1024 });
  const files = JSON.parse(stdout)[0].files.map(f => f.path);
  for (const required of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'data/persona.template.md', 'LICENSE', 'NOTICE', 'README.md']) assert.ok(files.includes(required), `${required} must ship`);
  for (const file of files) assert.equal(/(^|\/)(?:\.dev|tests|node_modules|artifacts|secrets\.json|config\.json|world-state\.json)(\/|$)/.test(file), false, `${file} must not ship`);
  assert.equal(files.some(f => f.startsWith('tools/xhh/')), false);
});
