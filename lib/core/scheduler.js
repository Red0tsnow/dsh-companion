import fs from 'node:fs/promises';
import path from 'node:path';
import { readJson, writeJson, serialized } from './files.js';
import { paths } from './paths.js';

const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const BOUNDS = [[0,59],[0,23],[1,31],[1,12],[0,7]];
function fieldMatcher(expression, index) {
  const [min,max] = BOUNDS[index], allowed = new Set();
  for (const part of expression.split(',')) {
    const match = /^(\*|\d+|\d+-\d+)(?:\/(\d+))?$/.exec(part); if (!match) throw new Error('Unsupported cron field');
    const step = match[2] === undefined ? 1 : Number(match[2]); if (step < 1 || step > max-min+1) throw new Error('Invalid cron step');
    const base = match[1], range = base === '*' ? [min,max] : base.includes('-') ? base.split('-').map(Number) : [Number(base), match[2] ? max : Number(base)];
    if (range[0] < min || range[1] > max || range[0] > range[1]) throw new Error('Cron value outside range');
    for (let n = range[0]; n <= range[1]; n += step) allowed.add(index === 4 && n === 7 ? 0 : n);
  }
  return allowed;
}
export function parseCron(expression) {
  if (typeof expression !== 'string') throw new Error('Cron must be a string');
  const fields = expression.trim().split(/\s+/); if (fields.length !== 5) throw new Error('Cron requires five fields');
  return { fields, allowed: fields.map(fieldMatcher) };
}
function localTime(now, zone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', weekday:'short', hourCycle:'h23' }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type,p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, clock: `${parts.hour}:${parts.minute}`, values: [Number(parts.minute),Number(parts.hour),Number(parts.day),Number(parts.month),WEEKDAY[parts.weekday]] };
}
function matchesCron(cron, local) {
  if (![0,1,3].every(i => cron.allowed[i].has(local.values[i]))) return false;
  const day = cron.allowed[2].has(local.values[2]), week = cron.allowed[4].has(local.values[4]);
  return cron.fields[2] !== '*' && cron.fields[4] !== '*' ? day || week : day && week;
}
function quietNow(quiet, clock) {
  if (!quiet) return false;
  if (!/^\d{2}:\d{2}$/.test(quiet.start || '') || !/^\d{2}:\d{2}$/.test(quiet.end || '')) throw new Error('Invalid quiet hours');
  return quiet.start <= quiet.end ? clock >= quiet.start && clock < quiet.end : clock >= quiet.start || clock < quiet.end;
}
function validateTarget(target) {
  if (target === undefined) return;
  if (!target || typeof target !== 'object' || Array.isArray(target)) throw new Error('Invalid schedule target');
  if (target.mode !== undefined && !['resume','fork','new'].includes(target.mode)) throw new Error('Invalid target mode');
  if (target.channel !== undefined && !['dsh','mc','qq'].includes(target.channel)) throw new Error('Invalid target channel');
  if (target.id !== undefined && (typeof target.id !== 'string' || target.id.length > 100)) throw new Error('Invalid target ID');
  if (target.group !== undefined && typeof target.group !== 'boolean') throw new Error('Invalid group flag');
}
export function validateSchedule(document) {
  if (!document || typeof document !== 'object' || document.version !== 1 || !Array.isArray(document.entries) || document.entries.length > 100) throw new Error('Schedule requires version 1 and an entries array (maximum 100 entries)');
  if (Object.hasOwn(document,'prompt')) throw new Error('Schedule prompt belongs inside an entry');
  validateTarget(document.target);
  if (document.enabled !== undefined && typeof document.enabled !== 'boolean') throw new Error('Invalid schedule enabled flag');
  if (document.time_zone) localTime(new Date(), document.time_zone);
  if (document.quiet_hours) quietNow(document.quiet_hours,'00:00');
  const ids = new Set();
  for (const e of document.entries) {
    if (!e || typeof e !== 'object' || typeof e.id !== 'string' || !e.id || e.id.length > 100 || ids.has(e.id)) throw new Error('Entry IDs must be unique nonempty strings'); ids.add(e.id);
    if (typeof e.prompt !== 'string' || !e.prompt.trim() || e.prompt.length > 8000) throw new Error('Entry prompt must contain 1–8000 characters');
    if (Boolean(e.cron) === Boolean(e.at)) throw new Error('Entry requires exactly one of cron or at');
    if (e.cron) parseCron(e.cron); else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.at)) throw new Error('Invalid entry time');
    if (e.time_zone) localTime(new Date(),e.time_zone);
    if (e.enabled !== undefined && typeof e.enabled !== 'boolean') throw new Error('Invalid entry enabled flag');
    if (e.respect_quiet_hours !== undefined && typeof e.respect_quiet_hours !== 'boolean') throw new Error('Invalid quiet-hours flag');
    if (e.min_idle_seconds !== undefined && (!Number.isFinite(e.min_idle_seconds) || e.min_idle_seconds < 0 || e.min_idle_seconds > 86400)) throw new Error('Invalid minimum idle interval');
    validateTarget(e.target);
  }
  return document;
}
async function scheduleFile(root, name) {
  if (typeof name !== 'string' || name.length > 120 || !name.endsWith('.schedule.json') || /[\\/\x00-\x1f<>:"|?*]/.test(name) || name.startsWith('.')) throw new Error('Invalid schedule filename');
  const p = paths(root);
  for (const file of [p.root,p.schedules,path.join(p.schedules,name)]) {
    const st = await fs.lstat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (st?.isSymbolicLink()) throw new Error('Linked schedule path is not allowed');
  }
  return path.join(p.schedules,name);
}
export async function loadSchedules(root) {
  const p = paths(root), files = [];
  for (const name of (await fs.readdir(p.schedules).catch(e => { if (e.code === 'ENOENT') return []; throw e; })).filter(x => x.endsWith('.schedule.json')).sort()) {
    try { const file = await scheduleFile(root,name), st = await fs.stat(file); if (st.size > 128*1024) throw new Error('Schedule is too large'); const document = await readJson(file); validateSchedule(document); files.push({name,document,error:null}); }
    catch (e) { files.push({name,document:null,error:e.message}); }
  }
  return {files};
}
export async function saveSchedule(root, {name,document} = {}) {
  const file = await scheduleFile(root,name); validateSchedule(document);
  if (Buffer.byteLength(JSON.stringify(document),'utf8') > 128*1024) throw new Error('Schedule is too large');
  await serialized(file,async () => { await scheduleFile(root,name); await writeJson(file,document); });
  return {ok:true,name};
}
export async function tickSchedules(store, character, ready, now = new Date()) {
  const report = { delivered: 0, skipped: 0, errors: [] }, cfg = await store.read();
  if (!cfg.schedule.enabled) return report;
  const p = store.paths, stateFile = path.join(p.root, 'schedule-state.json');
  return serialized(stateFile, async () => {
    const stateStat = await fs.lstat(stateFile).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (stateStat?.isSymbolicLink()) throw new Error('Linked schedule state is not allowed');
    const state = await readJson(stateFile);
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Invalid schedule state');
    const files = (await fs.readdir(p.schedules).catch(e => { if (e.code === 'ENOENT') return []; throw e; })).filter(name => name.endsWith('.schedule.json')).sort();
    for (const name of files) {
      let schedule;
      try { const file = await scheduleFile(p.root,name), st = await fs.lstat(file); if (!st.isFile() || st.isSymbolicLink() || st.size > 128 * 1024) throw new Error('Unsafe or oversized schedule'); schedule = await readJson(file); if (schedule.version !== 1 || !Array.isArray(schedule.entries)) throw new Error('Unsupported schedule format'); }
      catch (e) { report.errors.push({ file:name, message:e.message }); continue; }
      if (schedule.enabled === false) continue;
      const ids = new Set();
      for (const entry of schedule.entries) {
        try {
          if (!entry || typeof entry !== 'object') throw new Error('Invalid schedule entry');
          if (entry.enabled !== true) continue;
          if (typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)) throw new Error('Schedule IDs must be unique nonempty strings'); ids.add(entry.id);
          if (typeof entry.prompt !== 'string' || !entry.prompt.trim() || entry.prompt.length > 8000) throw new Error('Schedule prompt is empty or too long');
          const local = localTime(now, entry.time_zone || schedule.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone);
          if (entry.cron ? !matchesCron(parseCron(entry.cron), local) : !/^([01]\d|2[0-3]):[0-5]\d$/.test(entry.at || '') || entry.at !== local.clock) continue;
          const key = `${name}:${entry.id}:${local.date}:${local.clock}`;
          if (Object.hasOwn(state,key)) continue;
          const target = { ...(schedule.target || {}), ...(entry.target || {}) }, channel = target.channel || 'dsh', mode = target.mode || 'resume';
          if (!['dsh','mc','qq'].includes(channel) || !['resume','fork','new'].includes(mode)) throw new Error('Unsupported schedule target');
          const minIdle = entry.min_idle_seconds ?? 0;
          if (!Number.isFinite(minIdle) || minIdle < 0 || minIdle > 86400) throw new Error('Invalid minimum idle interval');
          const unavailable = !await ready(channel);
          const quiet = entry.respect_quiet_hours !== false && quietNow(schedule.quiet_hours, local.clock);
          const lastActivity = Number(character.lastActivityAt || 0);
          const busy = Boolean(character.pending) || minIdle > 0 && lastActivity > 0 && now.getTime() - lastActivity < minIdle * 1000;
          const status = unavailable ? 'skipped-offline' : quiet ? 'skipped-quiet' : busy ? 'skipped-busy' : 'claimed';
          // Commit the claim before any external effect. Ambiguous delivery failures are never retried automatically.
          state[key] = { status, at:now.toISOString() }; await writeJson(stateFile,state);
          if (status !== 'claimed') { report.skipped++; continue; }
          try {
            await character.receive({ id:key, channel, target:String(target.id || cfg.owner.id || ''), group:target.group === true, mode, kind:'schedule', text:entry.prompt });
            state[key].status = 'done'; report.delivered++;
          } catch (e) { state[key] = { status:'failed', message:String(e.message).slice(0,300), at:now.toISOString() }; report.errors.push({ file:name, entry:entry.id, message:e.message }); }
          await writeJson(stateFile,state);
        } catch (e) { report.errors.push({ file:name, entry:entry?.id, message:e.message }); }
      }
    }
    const cutoff = now.getTime() - 35 * 86400000;
    let pruned = false;
    for (const [key,value] of Object.entries(state)) if (Date.parse(value.at) < cutoff) { delete state[key]; pruned = true; }
    if (pruned) await writeJson(stateFile,state);
    return report;
  });
}
