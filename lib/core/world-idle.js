// 空世界看门狗：世界里没人超过 N 分钟就关掉
// 只处理"她自己开着"的世界；LAN 世界只断开身体，不停用户的客户端。
import { readJson, writeJson } from './files.js';
import { bodyStatus, worldAction, worldStatus } from './world.js';

/**
 * @param {object} o
 * @param {string} o.root     数据根
 * @param {object} o.cfg      cfg.mc
 * @param {string} o.stateFile 记录"从什么时候开始没人"
 * @param {number} [o.now]
 * @param {object} [o.deps]   测试时替换真实的世界探针
 * @returns {{action:'none'|'stopped', emptyForMs:number|null, reason?:string}}
 */
export async function checkEmptyWorld({ root, cfg, stateFile, now = Date.now(), deps = {} }) {
  const probeWorld = deps.worldStatus || worldStatus;
  const probeBody = deps.bodyStatus || bodyStatus;
  const stopWorld = deps.worldAction || worldAction;

  const minutes = Number(cfg?.autoStopEmptyMinutes ?? 0);
  if (!(minutes > 0)) return { action: 'none', emptyForMs: null };
  if (!cfg?.enabled) return { action: 'none', emptyForMs: null };

  const world = await probeWorld(root, cfg);
  if (world.state !== 'online') {
    // Nothing running: forget any accumulated empty time.
    const state = await readJson(stateFile, {});
    if (state.emptySince) await writeJson(stateFile, { ...state, emptySince: null });
    return { action: 'none', emptyForMs: null };
  }

  const body = await probeBody(root, cfg).catch(() => null);
  const humans = Number(body?.humansOnline) || 0;
  const busy = body?.task?.state === 'running';
  const state = await readJson(stateFile, {});

  // Somebody is here, or she is in the middle of something: reset.
  if (humans > 0 || busy) {
    if (state.emptySince) await writeJson(stateFile, { ...state, emptySince: null });
    return { action: 'none', emptyForMs: null };
  }

  const since = Number(state.emptySince) || now;
  const emptyForMs = now - since;
  if (!state.emptySince) await writeJson(stateFile, { ...state, emptySince: since, minutes });
  if (emptyForMs < minutes * 60000) return { action: 'none', emptyForMs };

  await stopWorld(root, cfg, 'down');
  const reason = `没人 ${minutes} 分钟，已自动关掉世界 / No players for ${minutes} minutes; world stopped`;
  await writeJson(stateFile, { emptySince: null, stoppedAt: now, minutes, reason: 'empty' });
  return { action: 'stopped', emptyForMs, reason };
}
