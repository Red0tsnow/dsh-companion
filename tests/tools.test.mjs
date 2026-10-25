import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {ConfigStore} from '../lib/core/config.js';
const exec = promisify(execFile);
const init = await import('../lib/core/initialize.js').catch(() => ({}));

test('initialization creates writable body and writings without overwriting a modified body', async t => {
  assert.equal(typeof init.initialize, 'function');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-tools-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await init.initialize(root);
  const body = path.join(root, 'runtime', 'mc', 'mc-daemon.mjs');
  await fs.appendFile(body, '\n// user-owned modification\n');
  await init.initialize(root);
  assert.match(await fs.readFile(body, 'utf8'), /user-owned modification/);
  const env = { ...process.env, DSH_COMPANION_HOME: root };
  await exec(process.execPath, ['tools/mc/journal.mjs', 'want', 'Build a shelter', '--why', 'Rain'], { env });
  assert.match(await fs.readFile(path.join(root, 'runtime', 'mc', 'goal.md'), 'utf8'), /Build a shelter/);
  await exec(process.execPath, ['tools/writings/shouka.mjs', 'add', 'Today the rain finally stopped.'], { env });
  assert.match(await fs.readFile(path.join(root, 'workspace', '手札.md'), 'utf8'), /rain finally stopped/);
});

test('stable runtime tool entrypoints override inherited data roots and refresh after an upgrade', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'companion-wrapper-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  await init.initialize(root);
  const wrapper = path.join(root, 'runtime', 'mc', 'journal.mjs'), body = path.join(root, 'runtime', 'mc', 'mc-daemon.mjs');
  const originalBody = await fs.readFile(body, 'utf8');
  await exec(process.execPath, [wrapper, 'want', 'A stable first goal', '--why', 'Persistence'], { env: { ...process.env, DSH_COMPANION_HOME: path.join(root,'incorrect-inherited-root') } });
  assert.match(await fs.readFile(path.join(root, 'runtime', 'mc', 'goal.md'),'utf8'),/A stable first goal/);
  await fs.writeFile(wrapper, "throw new Error('stale package version');\n");
  await fs.appendFile(body,'\n// retained user edit\n');
  await init.initialize(root);
  await exec(process.execPath,[wrapper,'want','A second goal after upgrade','--why','Upgrade'], { env:{...process.env,DSH_COMPANION_HOME:path.join(root,'another-incorrect-root')} });
  assert.match(await fs.readFile(path.join(root,'runtime','mc','goal.md'),'utf8'),/A second goal after upgrade/);
  assert.equal(await fs.readFile(body,'utf8'),originalBody+'\n// retained user edit\n');
});

test('body trial checks candidate syntax with the resolved Node file before launching a body',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'companion-body-syntax-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await init.initialize(root);await new ConfigStore(root).save({runtime:{nodePath:process.execPath}});
 await fs.writeFile(path.join(root,'runtime','mc','mc-daemon-next.mjs'),'const = ;');
 await assert.rejects(exec(process.execPath,['tools/mc/body.mjs','test'],{env:{...process.env,DSH_COMPANION_HOME:root},windowsHide:true}),error=>/SyntaxError/.test(error.stderr)&&!/file.*argument.*Object/.test(error.stderr));
});
