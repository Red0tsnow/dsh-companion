// Opt-in: only uses the extracted host and isolated profile under this checkout.
// Never reads or changes the user's active DSH installation/profile.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

const exec = promisify(execFile), root = path.resolve(import.meta.dirname, '..');
const home = path.join(root, '.dev/isolated-home'), profile = path.join(home, 'profiles/web');
const version = JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version;
const installed = path.join(root, `.dev/install-${version.replaceAll('.','-')}/node_modules/dsh-companion`);
const link = path.join(profile, 'node_modules/dsh-companion');
const bin = path.join(root, '.dev/host/node_modules/@deepseek-ai/dsh/lib/bin.js');
const manifestFile = path.join(profile, 'package.json'), logFile = path.join(root, '.dev/host.log');
const stateFile = path.join(home, 'companion/runtime/state.json');
const personaFile = path.join(home, 'companion/workspace/AGENTS.md');
const json = async f => JSON.parse(await fs.readFile(f, 'utf8'));
const hash = async f => createHash('sha256').update(await fs.readFile(f)).digest('hex');
const pause = ms => new Promise(r => setTimeout(r, ms));
const report = { kind: 'installed-tarball-isolated-DSH-lifecycle-with-fixture-model', packageVersion:version, checks: [] };
let child, cookie, origin;
const check = (name, value) => { assert.ok(value, name); report.checks.push({ name, pass: true }); console.log(name); };
const manifest = await json(manifestFile);
const priorId = (await json(stateFile)).sessionId;

async function configure(enabled) {
  assert.equal(child, undefined, 'Stop isolated host before changing its profile');
  const stat = await fs.lstat(link).catch(e => { if (e.code !== 'ENOENT') throw e; });
  if (stat) { assert.equal(stat.isSymbolicLink(), true, 'Only an isolated junction may be replaced'); await fs.unlink(link); }
  const next = structuredClone(manifest);
  next.dsh.profile.bundles = next.dsh.profile.bundles.filter(x => x !== 'dsh-companion');
  delete next.dependencies['dsh-companion'];
  if (enabled) {
    await fs.symlink(installed, link, 'junction');
    next.dependencies['dsh-companion'] = `link:${installed.replaceAll('\\', '/')}`;
    next.dsh.profile.bundles.push('dsh-companion');
  }
  await fs.writeFile(manifestFile, JSON.stringify(next, null, 2) + '\n');
}
async function start() {
  const log = await fs.open(logFile, 'w');
  child = spawn(process.execPath, [bin, 'web', '--no-open', '--port', '0'], {
    windowsHide: true, cwd: root, stdio: ['ignore', log.fd, log.fd],
    env: { ...process.env, DSH_HOME: home, DSH_AGENTS_HOME: path.join(root, '.dev/isolated-agents'), DSH_COMPANION_HOME: path.join(home, 'companion') },
  });
  await log.close();
  await fs.writeFile(path.join(root, '.dev/host-pid.json'), JSON.stringify({ pid: child.pid }));
  let spawnError; child.once('error', e => { spawnError = e; });
  for (let i = 0; i < 120; i++) {
    if (spawnError) throw spawnError;
    if (child.exitCode !== null) throw new Error('Isolated DSH exited; inspect .dev/host.log locally');
    const text = await fs.readFile(logFile, 'utf8');
    const tokenUrl = text.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+/)?.[0];
    if (tokenUrl) {
      try {
        const response = await fetch(tokenUrl, { redirect: 'manual', signal: AbortSignal.timeout(2000) });
        cookie = response.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
        origin = new URL(tokenUrl).origin;
        if (cookie) return;
      } catch {}
    }
    await pause(500);
  }
  throw new Error('Isolated DSH startup timed out');
}
async function stop() {
  if (!child) return;
  const current = child;
  if (current.exitCode === null) {
    // This ChildProcess object was created above, never discovered by a broad PID/name search.
    const exit = new Promise(r => current.once('exit', r)); current.kill();
    await Promise.race([exit, pause(10000)]);
    assert.ok(current.exitCode !== null || current.signalCode !== null, 'Isolated host did not stop');
  }
  child = undefined;
}
const call = async (route, body) => {
  const response = await fetch(origin + '/api/dsh-companion' + route, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.ok(response.ok, `${route} returned ${response.status}`); return response.json();
};
async function run(script) {
  const { stdout } = await exec(process.execPath, [script], { cwd: root, windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
  // Child scripts only print structured checks, never the host authentication URL.
  console.log(stdout.trim());
}
try {
  assert.equal((await json(path.join(installed, 'package.json'))).name, 'dsh-companion');
  check('production dependencies resolve from clean archive installation', (await fs.stat(path.join(installed, '../ws/index.js'))).isFile());
  await configure(true); await start();
  check('actual DSH loads package from isolated archive installation', (await fs.realpath(link)) === (await fs.realpath(installed)) && (await call('/status')).hostAvailable);
  check('archive install restores original character identity', (await call('/session', {})).sessionId === priorId);
  await run('scripts/verify-host.mjs');
  check('installed archive passes real host API and routing verification', true);
  await run('tests/browser-host.mjs');
  check('installed archive passes native host browser verification', true);
  const before = await hash(personaFile);
  await stop(); await configure(false); await start();
  check('host remains available after removing companion bundle', (await fetch(origin, { headers: { Cookie: cookie } })).ok);
  for (const route of ['/api/dsh-companion/status', '/dsh-companion/api/status']) {
    const r = await fetch(origin + route, { headers: { Cookie: cookie } });
    check(`uninstalled plugin route is absent: ${route}`, r.status === 404);
  }
  check('uninstall retains persona and persistent identity', (await hash(personaFile)) === before && (await json(stateFile)).sessionId === priorId);
  await stop(); await configure(true); await start();
  check('reinstall restores same character identity and persona', (await call('/session', {})).sessionId === priorId && (await hash(personaFile)) === before);
  check('reinstalled session completes real Agent loop with fixture model', (await call('/chat', { text: 'Verify reinstall continuity.' })).text.includes('Fixture response'));
  report.sessionId = priorId; report.result = 'passed';
} catch (e) {
  report.result = 'failed'; report.error = String(e.message).replace(/token=[^\s]+/g, 'token=[redacted]'); process.exitCode = 1;
} finally {
  await stop(); await configure(true);
  await fs.mkdir(path.join(root, 'artifacts'), { recursive: true });
  await fs.writeFile(path.join(root, 'artifacts/lifecycle-verification.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
