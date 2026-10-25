// Manual integration verification. Never run as part of the dependency-free unit suite.
// Supply an already obtained local server jar and the user's accepted EULA file.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { ConfigStore } from '../lib/core/config.js';
import { initialize } from '../lib/core/initialize.js';
import { paths } from '../lib/core/paths.js';
import { readJson, writeJson } from '../lib/core/files.js';
import { worldStatus, bodyStatus, bodyRequest, portOpen, processFacts, delay } from '../lib/core/world.js';
const exec = promisify(execFile);
const args = process.argv.slice(2), opt = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const sourceJar = opt('--server-jar'), java = opt('--java'), sourceEula = opt('--eula');
if (!sourceJar || !java || !sourceEula) throw new Error('Usage: node scripts/verify-world.mjs --server-jar <local jar> --java <java.exe> --eula <accepted eula.txt>');
const project = path.resolve(import.meta.dirname, '..'), server = path.join(project, '.dev', 'test-world'), root = path.join(project, '.dev', 'world-validation');
const reportFile = path.join(project, 'artifacts', 'world-verification.json');
const port = Number(opt('--port') || 25686), commandPort = Number(opt('--command-port') || 19882), testPort = Number(opt('--test-port') || 19883);
for (const p of [port, commandPort, testPort]) { assert.ok(Number.isInteger(p) && p > 1024 && p < 65536); if (await portOpen('127.0.0.1', p)) throw new Error(`Port ${p} is already in use; select another isolated port`); }
const eula = await fs.readFile(sourceEula, 'utf8'); if (!/^eula=true\s*$/m.test(eula)) throw new Error('Existing user EULA acceptance not found; no acceptance will be created');
const sourceBytes = await fs.readFile(sourceJar), originalHash = createHash('sha256').update(sourceBytes).digest('hex');
await fs.mkdir(server, { recursive: true }); await fs.writeFile(path.join(server, 'server.jar'), sourceBytes); await fs.writeFile(path.join(server, 'eula.txt'), eula);
await fs.writeFile(path.join(server, 'server.properties'), [
  'server-ip=127.0.0.1', `server-port=${port}`, 'online-mode=false', 'enforce-secure-profile=false', 'motd=Companion isolated verification', 'max-players=2',
  'level-name=validation-world', 'level-type=minecraft:flat', 'generate-structures=false', 'spawn-animals=false', 'spawn-monsters=false', 'spawn-npcs=false',
  'difficulty=peaceful', 'view-distance=2', 'simulation-distance=2', 'enable-rcon=false', 'enable-query=false', 'spawn-protection=0', 'sync-chunk-writes=true',
].join('\n') + '\n');
await initialize(root); const store = new ConfigStore(root);
await store.save({ runtime: { nodePath: process.execPath }, mc: { enabled: true, serverDir: server, javaPath: java, port, commandPort, testPort, username: 'CompanionTest', auth: 'offline', memoryMb: 1024 } });
const cfg = await store.read(), p = paths(root), report = { at: new Date().toISOString(), sourceHash: originalHash, checks: [], ownedPids: [], bodyPids: [], result: 'running' };
const baselineProcessIds = new Set((await processFacts(port)).processes.map(x => x.pid));
const mark = (name, detail = {}) => { report.checks.push({ name, ...detail }); console.log(JSON.stringify({ check: name, ...detail })); };
async function world(cmd) {
  const { stdout } = await exec(process.execPath, [path.join(p.tools, 'mc', 'world.mjs'), cmd], { env: { ...process.env, DSH_COMPANION_HOME: root }, windowsHide: true, timeout: 150000, maxBuffer: 1024 * 1024 });
  return JSON.parse(stdout.trim());
}
async function waitBody() {
  for (let i = 0; i < 60; i++) { const body = await bodyStatus(root, cfg.mc); if (body?.online) return body; await delay(500); }
  throw new Error('Body did not join isolated world');
}
async function bodyTool(cmd) {
  return exec(process.execPath, [path.join(p.tools, 'mc', 'body.mjs'), cmd], { env: { ...process.env, DSH_COMPANION_HOME: root }, windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
}
async function stopIfOwned() {
  for (let i = 0; i < 15; i++) {
    const saved = await readJson(p.world); const status = await worldStatus(root, cfg.mc);
    if (status.state === 'online' && status.owned) { await world('down'); return; }
    if (status.state === 'offline' && saved.state !== 'starting') { if (await bodyStatus(root, cfg.mc)) await bodyRequest(root, cfg.mc, '/shutdown', {}); return; }
    await delay(500);
  }
  throw new Error('Could not confirm ownership for final graceful cleanup');
}
let ownedRecord;
try {
  const up = await world('up'); assert.equal(up.state, 'online'); assert.equal(up.owned, true); ownedRecord = await readJson(p.world); report.ownedPids.push(up.pid);
  mark('world-started-through-cli', { pid: up.pid, startedAt: up.startedAt });
  const body = await waitBody(); assert.equal(body.username, 'CompanionTest'); mark('body-joined', { pid: body.pid, position: body.position }); report.bodyPids.push(body.pid);
  const around = await bodyRequest(root, cfg.mc, '/around'); assert.equal(around.ok, true); mark('body-around', { keys: Object.keys(around) });
  await bodyRequest(root, cfg.mc, '/say', { text: 'Isolated companion lifecycle verification.' }); mark('body-local-say');
  const again = await world('up'); assert.equal(again.pid, up.pid); mark('repeated-up-is-idempotent');
  if (args.includes('--body-workflow')) {
    const bodyFile = path.join(p.mc, 'mc-daemon.mjs'), nextFile = path.join(p.mc, 'mc-daemon-next.mjs');
    const originalBody = await fs.readFile(bodyFile, 'utf8');
    await bodyTool('edit'); await fs.writeFile(nextFile, originalBody + '\n// isolated body edit verification\n');
    assert.match((await bodyTool('diff')).stdout, /isolated body edit verification/); mark('body-edit-and-diff');
    await bodyTool('test'); assert.equal(await portOpen('127.0.0.1', testPort), false); mark('body-trial-joined-and-stopped');
    await bodyTool('apply'); const applied = await waitBody(); report.bodyPids.push(applied.pid);
    assert.match(await fs.readFile(bodyFile, 'utf8'), /isolated body edit verification/);
    const backupFiles = await fs.readdir(path.join(p.mc, 'body-backups'));
    assert.ok(backupFiles.length > 0); mark('body-apply-and-backup', { pid: applied.pid });
    await bodyTool('rollback'); const rolledBack = await waitBody(); report.bodyPids.push(rolledBack.pid);
    assert.equal(await fs.readFile(bodyFile, 'utf8'), originalBody); mark('body-rollback-restored-original', { pid: rolledBack.pid });
    // The candidate deliberately behaves differently outside its read-only trial.
    // This proves the application failure branch restores an executable original.
    await fs.writeFile(nextFile, originalBody + '\nif (process.env.COMPANION_TRIAL !== "1") throw new Error("isolated application failure");\n');
    await assert.rejects(bodyTool('apply'), /Restored previous body/);
    assert.equal(await fs.readFile(bodyFile, 'utf8'), originalBody);
    const recovered = await waitBody(); report.bodyPids.push(recovered.pid);
    mark('failed-body-application-automatically-restores-original', { pid: recovered.pid });
  }
  await writeJson(p.world, { ...ownedRecord, startedAt: 1 });
  const corrected = await worldStatus(root, cfg.mc); assert.equal(corrected.startedAt, up.startedAt); assert.equal(corrected.owned, false); mark('stale-timestamp-corrected-from-process');
  await writeJson(p.world, { ...ownedRecord, pid: ownedRecord.pid + 1 });
  const mismatch = await worldStatus(root, cfg.mc); assert.equal(mismatch.owned, false); assert.equal(mismatch.pid, up.pid); mark('mismatched-pid-not-owned');
  // Restore only the exact recorded instance created by this test, after confirming its live identity.
  assert.equal(mismatch.startedAt, ownedRecord.startedAt); await writeJson(p.world, ownedRecord);
  const down = await world('down'); assert.equal(down.state, 'offline'); mark('graceful-save-stop');
  await delay(1000); assert.equal(await portOpen('127.0.0.1', port), false); assert.equal(await bodyStatus(root, cfg.mc), null); mark('first-shutdown-no-listeners');
  const log = await fs.readFile(path.join(root, 'runtime', 'world.log'), 'utf8'); assert.match(log, /Saving|Saved|保存/i); mark('server-save-observed');
  // Reproduce the stale-failed-state startup edge: a previous failure must not abort a new launch.
  await writeJson(p.world, { state: 'failed', error: 'previous run failed', startedAt: null, owned: false });
  const restart = await world('up'); assert.equal(restart.state, 'online'); assert.equal(restart.owned, true); ownedRecord = await readJson(p.world); report.ownedPids.push(restart.pid); mark('restart-after-stale-failure');
  report.bodyPids.push((await waitBody()).pid); await world('down'); mark('second-graceful-stop');
  await fs.writeFile(path.join(server, 'invalid.jar'), 'Invalid isolated verification jar');
  await store.save({ mc: { jar: 'invalid.jar' } });
  const failedAt = Date.now();
  await assert.rejects(world('up'), /Java exited during startup/);
  assert.ok(Date.now() - failedAt < 20000, 'startup failure is reported without a full timeout');
  mark('invalid-jar-failure-reported', { elapsedMs: Date.now() - failedAt });
  await store.save({ mc: { jar: 'server.jar' } });
  report.result = 'passed';
} catch (e) { report.result = 'failed'; report.error = { message: e.message, stdout: e.stdout, stderr: e.stderr }; console.error(e.message); process.exitCode = 1; }
finally {
  // Never use broad process-name termination. Graceful cleanup checks the exact test instance.
  try { await delay(2500); await stopIfOwned(); } catch (e) { report.cleanupError = e.message; process.exitCode = 1; }
  await delay(1200);
  report.remainingListeners = [];
  for (const portNumber of [port, commandPort, testPort]) if (await portOpen('127.0.0.1', portNumber)) report.remainingListeners.push(portNumber);
  report.sourceUnchanged = originalHash === createHash('sha256').update(await fs.readFile(sourceJar)).digest('hex');
  const facts = await processFacts(port); report.remainingOwnedPids = facts.processes.filter(x => report.ownedPids.includes(x.pid)).map(x => x.pid);
  report.remainingBodyPids = facts.processes.filter(x => report.bodyPids.includes(x.pid)).map(x => x.pid);
  report.remainingNewSupervisors = facts.processes.filter(x => !baselineProcessIds.has(x.pid) && /world\.mjs"?\s+_supervise/.test(x.command || '')).map(x => x.pid);
  if (report.remainingListeners.length || report.remainingOwnedPids.length || report.remainingBodyPids.length || report.remainingNewSupervisors.length || !report.sourceUnchanged) process.exitCode = 1;
  await fs.mkdir(path.dirname(reportFile), { recursive: true }); await writeJson(reportFile, report); console.log(JSON.stringify({ result: report.result, remainingListeners: report.remainingListeners, remainingOwnedPids: report.remainingOwnedPids, remainingBodyPids: report.remainingBodyPids, remainingNewSupervisors: report.remainingNewSupervisors, sourceUnchanged: report.sourceUnchanged }));
}
