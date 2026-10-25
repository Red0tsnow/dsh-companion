export function result(state, message, detail = {}) {
  return { ok: state === 'online', state, level: state === 'online' ? 'success' : ['unconfigured', 'disabled'].includes(state) ? 'info' : 'warning', message, detail };
}
export async function safeProbe(fn, options = {}) {
  const timeoutMs = Number.isFinite(options?.timeoutMs) && options.timeoutMs > 0 ? Math.min(options.timeoutMs,120000) : 8000;
  let timer, onAbort; const controller = new AbortController(), parent = options?.signal;
  try {
    if (parent?.aborted) throw new Error('Probe cancelled / 检测已取消');
    const tasks = [Promise.resolve().then(() => fn(controller.signal)), new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Connection timed out / 检测超时')); }, timeoutMs); })];
    if (parent) tasks.push(new Promise((_,reject) => { onAbort = () => { controller.abort(); reject(new Error('Probe cancelled / 检测已取消')); }; parent.addEventListener('abort',onAbort,{once:true}); }));
    const value = await Promise.race(tasks);
    if (!value || typeof value.ok !== 'boolean' || typeof value.message !== 'string') throw new Error('Invalid adapter response');
    const normalized = result(value.state || (value.ok ? 'online' : 'error'),value.message,value.detail || {});
    return {...value,...normalized};
  } catch (e) { let message = 'Connection failed / 检测失败'; try { message = String(e?.message || message); } catch {} return result('error',message); }
  finally { clearTimeout(timer); if (onAbort) parent.removeEventListener('abort',onAbort); controller.abort(); }
}
function fingerprint(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value)) throw new Error('Circular adapter configuration'); seen.add(value);
  const out = Array.isArray(value) ? `[${value.map(v=>fingerprint(v,seen)).join(',')}]` : `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${fingerprint(value[k],seen)}`).join(',')}}`;
  seen.delete(value); return out;
}
export function makeAdapter({ id, label, schema, configured, check, actions = {}, enabled = true }) {
  let status = { ...result('unconfigured', '未接入 / Not configured'), checkedAt: null, lastSuccessAt: null };
  let identity, eligibility = 'unconfigured', revision = 0, probeSequence = 0, active, closed = false;
  function reset(cfg, {force = false} = {}) {
    if (closed) return {...status};
    let baseline, nextIdentity;
    try {
      const object = cfg && typeof cfg === 'object' && !Array.isArray(cfg);
      nextIdentity = fingerprint(cfg);
      baseline = !object || !configured(cfg) ? result('unconfigured','未接入 / Not configured') : enabled && !cfg.enabled ? result('disabled','已禁用 / Disabled') : result('offline','尚未检测 / Not checked');
    } catch (e) { nextIdentity = 'invalid'; baseline = result('error',String(e?.message || 'Invalid adapter configuration')); }
    if (!force && nextIdentity === identity && baseline.state === eligibility) return {...status};
    active?.abort(); active = null; revision++; probeSequence++; identity = nextIdentity; eligibility = baseline.state;
    status = {...baseline,checkedAt:null,lastSuccessAt:null}; return {...status};
  }
  return { id, label, schema, actions, get status() { return {...status}; }, reset,
    close() {
      closed = true; active?.abort(); active = null; revision++; probeSequence++;
      status = {...status,...result('disabled','已停止 / Stopped')};
    }, async probe(cfg) {
    if (closed) return {...status};
    reset(cfg);
    if (eligibility !== 'offline') return {...status};
    const previous = status.lastSuccessAt, version = revision, sequence = ++probeSequence;
    active?.abort(); const controller = active = new AbortController();
    status = {...result('checking','检测中 / Checking'),checkedAt:status.checkedAt,lastSuccessAt:previous};
    const next = await safeProbe(signal => check(cfg,signal),{signal:controller.signal});
    if (version !== revision || sequence !== probeSequence) return {...status};
    active = null;
    status = { ...next, checkedAt: new Date().toISOString(), lastSuccessAt: next.ok ? new Date().toISOString() : previous };
    return {...status};
  } };
}
