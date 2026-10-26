import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { exec, resolveNode } from './runner.js';
import { paths } from './paths.js';
import { readJson, writeJson } from './files.js';
import {pingMinecraft} from './lan.js';
import {bodySupportsVersion} from './mc-versions.js';
import {sendConsoleCommand,createConsoleChannel} from './world-commands.js';
export const delay = ms => new Promise(r => setTimeout(r, ms));
const canonical = file => path.resolve(file || '').replaceAll('\\', '/').toLowerCase();
export function reconcileWorld(target, facts, saved = {}) {
  const proc = facts.processes.find(p => p.pid === facts.listenerPid);
  if (!facts.open) {
    const starting = facts.processes.find(p => saved.owned === true && p.pid === saved.pid && p.startedAt === saved.startedAt && p.jar && canonical(p.jar) === canonical(saved.jar) && canonical(p.jar) === canonical(target.jar));
    if (starting) return { state: 'starting', owned: true, pid: starting.pid, startedAt: starting.startedAt, jar: starting.jar };
    return { state: 'offline', owned: false, pid: null, startedAt: null };
  }
  if (!proc?.jar || canonical(proc.jar) !== canonical(target.jar)) return { state: 'conflict', owned: false, pid: facts.listenerPid, startedAt: null };
  return { state: 'online', pid: proc.pid, startedAt: proc.startedAt, owned: saved.owned === true && saved.pid === proc.pid && saved.startedAt === proc.startedAt && canonical(saved.jar) === canonical(proc.jar), jar: proc.jar };
}
export async function withWorldLock(root, action) {
  await fs.mkdir(root, { recursive: true }); const lock = path.join(root, 'world.lock'); const deadline = Date.now() + 90000;
  while (true) {
    try { await fs.mkdir(lock); await writeJson(path.join(lock, 'owner.json'), { pid: process.pid, at: Date.now() }); break; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const st = await fs.stat(lock).catch(() => null), owner = await readJson(path.join(lock, 'owner.json')).catch(() => ({}));
      let alive = true; try { if (owner.pid) process.kill(owner.pid, 0); } catch { alive = false; }
      if ((!alive || !owner.pid) && st && Date.now() - st.mtimeMs > 10000) { await fs.rm(lock, { recursive: true, force: true }); continue; }
      if (Date.now() > deadline) throw new Error('World is busy / 世界操作尚未完成');
      await delay(80);
    }
  }
  try { return await action(); } finally { await fs.rm(lock, { recursive: true, force: true }); }
}
export function portOpen(host, port) {
  return new Promise(resolve => { const s = net.connect({ host, port }); const done = v => { s.destroy(); resolve(v); }; s.setTimeout(600); s.once('connect', () => done(true)); s.once('timeout', () => done(false)); s.once('error', () => done(false)); });
}
export async function processFacts(port) {
  if (process.platform !== 'win32') throw new Error('Managed worlds currently require Windows');
  const script = `$p = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('java.exe','javaw.exe','node.exe') } | ForEach-Object { @{pid=$_.ProcessId; command=$_.CommandLine; startedAt=([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds()} }); $l = @(Get-NetTCPConnection -State Listen -LocalPort $env:COMPANION_PROBE_PORT -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); @{processes=$p;listeners=$l} | ConvertTo-Json -Compress -Depth 5`;
  const { stdout } = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, timeout: 12000, env: { ...process.env, COMPANION_PROBE_PORT: String(port) } });
  const f = JSON.parse(stdout);
  return { listenerPid: f.listeners?.length === 1 ? Number(f.listeners[0]) : null, processes: (f.processes || []).map(p => { const match = /(?:^|\s)-jar\s+(?:"([^"]+)"|(\S+))/.exec(p.command || ''); const jar = match?.[1] || match?.[2]; return { ...p, jar: jar && path.isAbsolute(jar) ? jar : null }; }) };
}
export async function worldStatus(root, cfg) {
  if(cfg.source==='lan'){
    try{const response=await pingMinecraft(cfg.host,cfg.port);return {state:'online',owned:false,external:true,version:response.version||cfg.version,bodySupported:bodySupportsVersion(response.version||cfg.version)};}
    catch{return {state:'offline',owned:false,external:true,startedAt:null,message:'世界已关闭 / World closed'};}
  }
  const p = paths(root), saved = await readJson(p.world);
  if (!cfg.serverDir) return { state: 'unconfigured', owned: false, startedAt: null };
  const facts = await processFacts(cfg.port); facts.open = await portOpen('127.0.0.1', cfg.port);
  const current = reconcileWorld({ jar: path.resolve(cfg.serverDir, cfg.jar), port: cfg.port }, facts, saved);
  if (current.state === 'online') await writeJson(p.world, { ...saved, ...current });
  else if (current.state === 'offline' && saved.startedAt) await writeJson(p.world, { ...saved, owned: false, startedAt: null, state: 'offline' });
  return current;
}
export async function javaRuntime(explicit) {
  const file = explicit || 'java'; const { stdout, stderr } = await exec(file, ['-version'], { timeout: 6000, windowsHide: true });
  return { file, version: (stderr || stdout).trim().split('\n')[0] };
}
export async function bodyStatus(root, cfg, port = cfg.commandPort) {
  const secrets = await readJson(paths(root).secrets);
  try { const r = await fetch(`http://127.0.0.1:${port}/status`, { headers: { Authorization: `Bearer ${secrets.bodyToken || ''}` }, signal: AbortSignal.timeout(2000) }); if (!r.ok) return null; const s = await r.json(); return s.companionRoot === canonical(root) ? s : null; } catch { return null; }
}
export async function bodyRequest(root, cfg, route, body, port = cfg.commandPort) {
  const secrets = await readJson(paths(root).secrets);
  const r = await fetch(`http://127.0.0.1:${port}${route}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${secrets.bodyToken || ''}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const j = await r.json(); if (!r.ok || j.ok === false) throw new Error(j.error || 'Body action failed'); return j;
}
export async function startBody(root, config, { trial = false } = {}) {
  const cfg = config.mc, p = paths(root), port = trial ? cfg.testPort : cfg.commandPort;
  if(!bodySupportsVersion(cfg.version))return;
  if ((await bodyStatus(root, cfg, port))?.online) return;
  if (await portOpen('127.0.0.1', port)) throw new Error('Body port belongs to another process / 身体端口已被其他进程占用');
  const file = path.join(p.mc, trial ? 'mc-daemon-next.mjs' : 'mc-daemon.mjs'); await fs.access(file);
  const node = await resolveNode(config.runtime.nodePath);
  const child = spawn(node.file, [file], { detached: true, stdio: 'ignore', windowsHide: true, env: { ...process.env, ...node.env, DSH_COMPANION_HOME: root, COMPANION_PACKAGE_ROOT: p.tools, MC_CMD_PORT: String(port), MC_USER: trial ? `${cfg.username.slice(0,11)}_test` : cfg.username, MC_READONLY: trial || cfg.readOnly ? '1' : '0', COMPANION_TRIAL: trial ? '1' : '0' } });
  await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); }); child.unref();
  for (let i = 0; i < 30; i++) { if (await bodyStatus(root, cfg, port)) return; await delay(500); }
  throw new Error('Body did not start. Check runtime/mc/bot.log / 身体启动超时');
}
export async function worldAction(root, config, action) {
  const p = paths(root), cfg = config.mc;
  if (action === 'status') return { ...(await worldStatus(root, cfg)), body: await bodyStatus(root, cfg),bodySupported:bodySupportsVersion(cfg.version) };
  return withWorldLock(path.dirname(p.world), async () => {
    if(action==='leave'||(action==='down'&&cfg.source==='lan')){
      if(await bodyStatus(root,cfg))await bodyRequest(root,cfg,'/shutdown',{});
      return {...(await worldStatus(root,cfg)),body:null,disconnected:true};
    }
    if (action === 'up') {
      if(cfg.source==='lan'){
        const status=await worldStatus(root,cfg);if(status.state!=='online')throw new Error('世界已关闭。请在游戏里重新对局域网开放，再回来寻找世界。');
        await startBody(root,config);return {...status,body:await bodyStatus(root,cfg)};
      }
      if (!cfg.serverDir) throw new Error('Configure the Minecraft server directory first');
      if (!['127.0.0.1', 'localhost'].includes(cfg.host)) throw new Error('Managed world requires a local server');
      let status = await worldStatus(root, cfg);
      if (status.state === 'conflict') throw new Error('Port is occupied by an unrecognized service / 端口归属无法确认');
      if (status.state !== 'online') {
        let launchId;
        if (status.state === 'starting' && status.owned) {
          // A previous up may have timed out while this exact Java was still
          // preparing the world. Keep waiting instead of spawning a duplicate.
          launchId = (await readJson(p.world)).launchId;
        } else {
          await fs.access(path.resolve(cfg.serverDir, cfg.jar)); await javaRuntime(cfg.javaPath);
          const props = await fs.readFile(path.join(cfg.serverDir, 'server.properties'), 'utf8');
          const actualPort = Number(/^server-port=(\d+)/m.exec(props)?.[1] || 25565);
          if (actualPort !== cfg.port) throw new Error('Configured port differs from server.properties');
          const node = await resolveNode(config.runtime.nodePath);
          launchId = randomUUID();
          // A previous failure is historical. Only this launch may supply the
          // success/failure record observed below.
          await writeJson(p.world, { state: 'starting', launchId, owned: false, startedAt: null });
          const child = spawn(node.file, [path.join(p.tools, 'mc', 'world.mjs'), '_supervise'], { detached: true, stdio: 'ignore', windowsHide: true, env: { ...process.env, ...node.env, DSH_COMPANION_HOME: root, COMPANION_WORLD_LAUNCH: launchId } });
          try { await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); }); child.unref(); }
          catch (e) { await writeJson(p.world, { state: 'failed', launchId, owned: false, startedAt: null, error: 'World supervisor could not start' }); throw e; }
        }
        for (let i = 0; i < 60; i++) {
          await delay(1000);
          const saved = await readJson(p.world); if (saved.launchId === launchId && saved.state === 'failed') throw new Error(saved.error || 'Java exited during startup');
          if (await portOpen('127.0.0.1', cfg.port)) { status = await worldStatus(root, cfg); if (status.state === 'online') break; throw new Error('Port changed ownership while starting'); }
        }
        if (status.state !== 'online') throw new Error('World startup timed out; inspect runtime/world.log');
      }
      await startBody(root, config);
      return { ...status, body: await bodyStatus(root, cfg),bodySupported:bodySupportsVersion(cfg.version) };
    }
    if (action === 'down') {
      const status = await worldStatus(root, cfg);
      if (['online', 'starting'].includes(status.state) && !status.owned) throw new Error('External world: close it from its original console / 此世界由外部启动，请在原控制台关闭');
      if (status.state === 'conflict') throw new Error('Cannot stop an unidentified process');
      if (await bodyStatus(root, cfg)) await bodyRequest(root, cfg, '/shutdown', {});
      if (status.state === 'online' || status.state === 'starting') {
        const saved = await readJson(p.world);
        await writeJson(path.join(path.dirname(p.world), 'world-stop.json'), { instance: saved.instance, pid: status.pid, startedAt: status.startedAt });
        for (let i = 0; i < 60; i++) {
          await delay(500);
          const facts = await processFacts(cfg.port);
          const running = facts.processes.some(proc => proc.pid === status.pid && proc.startedAt === status.startedAt && proc.jar && canonical(proc.jar) === canonical(status.jar));
          if (!running) return { state: 'offline', owned: false };
        }
        throw new Error('Graceful stop timed out; no process was force-killed');
      }
      return status;
    }
    throw new Error('Unknown world action');
  });
}
export async function worldCommands(root,config,commands,options={}) {
  const p=paths(root);
  return withWorldLock(path.dirname(p.world),async()=>{
    const status=await worldStatus(root,config.mc),saved=await readJson(p.world);
    if(status.state!=='online'||!status.owned||!saved.instance||!saved.launchId)throw new Error('Open the plugin-managed world first / 请先开启由本插件管理的世界；外部启动的服务端不能接收控制命令。');
    const results=[];
    for(const command of commands)results.push(await sendConsoleCommand(path.dirname(p.world),saved,command,options));
    return {ok:true,results};
  });
}
export const worldCommand=(root,config,command,options)=>worldCommands(root,config,[command],options);
export async function supervise(root, config) {
  const p = paths(root), cfg = config.mc; const jar = path.resolve(cfg.serverDir, cfg.jar);
  const launchId = process.env.COMPANION_WORLD_LAUNCH || randomUUID(), instance = randomUUID();
  let child, timer, record,channel,log;
  async function writeCurrent(value) {
    const current = await readJson(p.world);
    if (current.launchId === launchId) await writeJson(p.world, value);
  }
  try {
    log=createWriteStream(path.join(path.dirname(p.world),'world.log'),{flags:'a'});
    log.on('error',()=>{});
    child = spawn(cfg.javaPath || 'java', [`-Xmx${cfg.memoryMb}M`, '-Xms512M', '-jar', jar, 'nogui'], { cwd: cfg.serverDir, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdout.on('data',chunk=>log.write(chunk));child.stderr.on('data',chunk=>log.write(chunk));
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    // Register immediately: a bad jar may exit while CIM facts are loading.
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.stdin.on('error', () => {});
    const facts = await processFacts(cfg.port); const proc = facts.processes.find(x => x.pid === child.pid);
    if (!proc || child.exitCode !== null) throw new Error('Java exited during startup. Check world.log and the configured jar.');
    record = { pid: child.pid, startedAt: proc.startedAt, jar, owned: true, instance, launchId, state: 'starting' };
    await writeCurrent(record);
    channel=createConsoleChannel(path.dirname(p.world),record,child);
    let stopping = false, busy = false;
    timer = setInterval(async () => {
      if (busy || stopping) return; busy = true;
      try { const req = await readJson(path.join(path.dirname(p.world), 'world-stop.json')); if (req.instance === instance && req.pid === child.pid && req.startedAt === record.startedAt) { stopping = true; await channel.close(); child.stdin.write('save-all flush\nstop\n'); } else await channel.poll(); } catch {} finally { busy = false; }
    }, 500);
    await exited;
    await writeCurrent({ ...record, owned: false, startedAt: null, state: stopping ? 'offline' : 'failed', error: stopping ? null : 'Java exited. Check world.log and EULA/server settings.' });
  } catch (e) {
    if (child && child.exitCode === null) child.stdin.end('stop\n');
    await writeCurrent({ ...record, launchId, owned: false, startedAt: null, state: 'failed', error: e.message });
    throw e;
  } finally { clearInterval(timer);await channel?.close();log?.end(); }
}
