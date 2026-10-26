// Product version of the owned edit -> test -> backup -> apply -> rollback workflow.
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, P, CONFIG } from '../runtime.mjs';
import { exec, resolveNode } from '../../lib/core/runner.js';
import { startBody, bodyStatus, bodyRequest, delay, withWorldLock } from '../../lib/core/world.js';
const body = path.join(P.mc, 'mc-daemon.mjs'), next = path.join(P.mc, 'mc-daemon-next.mjs'), backups = path.join(P.mc, 'body-backups');
const cmd = process.argv[2];
await fs.mkdir(backups, { recursive: true });
const check = async file => {
  const node=await resolveNode(CONFIG.runtime.nodePath);
  return exec(node.file, ['--check', file], { timeout: 10000, windowsHide: true,env:{...process.env,...node.env} });
};
const stop = async port => { if (await bodyStatus(ROOT, CONFIG.mc, port)) { await bodyRequest(ROOT, CONFIG.mc, '/shutdown', {}, port); await delay(600); } };
async function trial() {
  await check(next);
  try { await startBody(ROOT, CONFIG, { trial: true }); for (let i = 0; i < 30; i++) { if ((await bodyStatus(ROOT, CONFIG.mc, CONFIG.mc.testPort))?.online) return; await delay(1000); } throw new Error('Trial body did not join the world'); }
  finally { await stop(CONFIG.mc.testPort); }
}
try {
  if (cmd === 'prepare-update') { await fs.copyFile(path.join(P.templates,'mc-daemon.mjs'),next,fs.constants.COPYFILE_EXCL); console.log('新版身体已准备，请检查差异后应用 / New body prepared; review body diff before body apply'); }
  else if (cmd === 'edit') { await fs.copyFile(body, next, fs.constants.COPYFILE_EXCL).catch(e => { if (e.code !== 'EEXIST') throw e; }); console.log(next); }
  else if (cmd === 'diff') { const [a, b] = await Promise.all([fs.readFile(body, 'utf8'), fs.readFile(next, 'utf8')]); const aa = a.split('\n'), bb = b.split('\n'); for (let i = 0; i < Math.max(aa.length, bb.length); i++) if (aa[i] !== bb[i]) console.log(`${i + 1}: - ${aa[i] || ''}\n${i + 1}: + ${bb[i] || ''}`); }
  else if (cmd === 'test') { await trial(); console.log('Trial passed'); }
  else if (cmd === 'backups') console.log((await fs.readdir(backups)).join('\n'));
  else if (cmd === 'apply' || cmd === 'rollback') await withWorldLock(path.dirname(P.world), async () => {
    const list = (await fs.readdir(backups)).filter(f => f.endsWith('.mjs')).sort();
    if (cmd === 'rollback' && !list.length) throw new Error('No backups');
    if (cmd === 'apply') await trial();
    const previous = path.join(backups, `${Date.now()}.mjs`); await fs.copyFile(body, previous);
    const selected = cmd === 'apply' ? next : path.join(backups, list.at(-1)); await check(selected);
    const wasRunning = Boolean(await bodyStatus(ROOT, CONFIG.mc)); await stop(CONFIG.mc.commandPort);
    await fs.copyFile(selected, body);
    try { if (wasRunning) { await startBody(ROOT, CONFIG); let online = false; for (let i = 0; i < 20; i++) { if ((await bodyStatus(ROOT, CONFIG.mc))?.online) { online = true; break; } await delay(500); } if (!online) throw new Error('Applied body failed to join'); } }
    catch (e) { await stop(CONFIG.mc.commandPort); await fs.copyFile(previous, body); if (wasRunning) await startBody(ROOT, CONFIG); throw new Error('Restored previous body: ' + e.message); }
    console.log('Body ' + cmd + ' complete; backup: ' + path.basename(previous));
  });
  else console.log('body prepare-update|edit|diff|test|apply|rollback|backups');
} catch (e) { console.error(e.message); process.exitCode = 1; }
