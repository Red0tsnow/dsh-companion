// 回顾类功能（memory/persona/rules）用「窗口配额」，不是「当天配额」
import fs from 'node:fs/promises';
import path from 'node:path';
import { paths } from './paths.js';
import { atomicWrite, readJson } from './files.js';
import { withFileLock } from './data-lock.js';
import { dayKey } from './daily.js';

/** Reflection features and the window each one resets on. */
export const REFLECT = {
  memory: { window: 'month', once: true },
  persona: { window: 'week', once: false },
  rules: { window: 'month', once: true },
};
export const isReflect = (feature) => Object.hasOwn(REFLECT, feature);
const file = (root) => path.join(paths(root).work, 'reflect.jsonl');

/** Week bucket, Monday-based, in the configured zone. */
function weekKey(zone) {
  const key = dayKey(new Date(), zone || undefined);
  const d = new Date(key + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const sameWindow = (row, feature, zone) => {
  if (REFLECT[feature].window === 'month') return String(row.date).slice(0, 7) === dayKey(new Date(), zone || undefined).slice(0, 7);
  return weekKey(zone) === (() => { const d = new Date(String(row.date) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
};

export async function reflectStatus(root, feature, zone) {
  if (!isReflect(feature)) throw new Error('未知回顾功能 / Unknown reflection feature');
  let rows = [];
  try { rows = (await fs.readFile(file(root), 'utf8')).split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  catch (e) { if (e.code !== 'ENOENT') throw new Error('回顾账本损坏，请恢复备份 / Reflection ledger is unreadable; restore a backup'); }
  const mine = rows.filter((r) => r.kind === feature);
  const current = mine.filter((r) => sameWindow(r, feature, zone));
  return { feature, window: REFLECT[feature].window, date: dayKey(new Date(), zone || undefined), done: current.length > 0, current, recent: mine.slice(-6) };
}

export async function markReflect(root, feature, { text = '', skip = false, zone } = {}) {
  if (!isReflect(feature)) throw new Error('未知回顾功能 / Unknown reflection feature');
  const target = file(root);
  return withFileLock(target, async () => {
    const status = await reflectStatus(root, feature, zone);
    if (REFLECT[feature].once && status.done) {
      const e = new Error('这个窗口已经记过了 / Already recorded in this window');
      e.code = 'DAILY_DUPLICATE';
      throw e;
    }
    if (!skip && !String(text).trim()) throw new Error('写一句做了什么；不想做就加 --skip / Say what you did, or pass --skip');
    let rows = [];
    try { rows = (await fs.readFile(target, 'utf8')).split('\n').filter(Boolean); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    const row = { kind: feature, date: status.date, at: new Date().toISOString(), skip: Boolean(skip), text: skip ? '' : String(text).trim().slice(0, 300) };
    await atomicWrite(target, [...rows, JSON.stringify(row)].join('\n') + '\n');
    return { ok: true, ...row };
  });
}

/** Gate used by the scheduled prompts: allowed only when the window is still open. */
export async function reflectGate(root, feature, cfg) {
  if (!isReflect(feature)) throw new Error('未知回顾功能 / Unknown reflection feature');
  if (!cfg.life.reflect.enabled) return { allowed: false, reason: '回顾已关闭 / Reflection disabled' };
  const status = await reflectStatus(root, feature, cfg.life.timeZone);
  if (status.done) return { allowed: false, reason: '这个窗口已经做过了 / Already done in this window' };
  return { allowed: true, reason: '还没做，允许安静跳过 / Not done yet; skipping is still allowed' };
}
