import { paths } from './paths.js';
import { readJson, writeJson, serialized } from './files.js';

export const DEFAULTS = {
  version: 1, character: { name: '', relationship: '', tone: '' }, owner: { id: '', callName: '' },
  ui: { language: 'zh', theme: 'system' }, runtime: { nodePath: '', pythonPath: '' },
  mc: { enabled: false, source:'managed', serverType:'vanilla', serverDir: '', jar: 'server.jar', javaPath: '', host: '127.0.0.1', port: 25565, commandPort: 19772, testPort: 19773, username: 'Companion', version: '', auth: 'offline', readOnly: false, memoryMb: 2048 },
  qq: { enabled: false, wsUrl: '', selfId: '', allowedGroups: [] },
  xhh: { enabled: false, toolPath: '' }, bili: { enabled: false },
  media: { enabled: false }, schedule: { enabled: false },
  life: {
    selfplay: {enabled:false,idleSeconds:180,afterTaskSeconds:60,cooldownSeconds:120,maxConsecutive:10},
    reachout: {enabled:false,time:'10:00',windowHours:13,enoughMessages:12},
    diary: {enabled:false,time:'21:00'},
    timeZone:'',
  },
};
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, patch, prefix = '') {
  if (!plain(patch)) throw new Error('Configuration must be an object');
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(patch)) {
    if (!Object.hasOwn(base, k) || ['__proto__', 'constructor', 'prototype'].includes(k)) throw new Error(`Unknown setting: ${prefix}${k}`);
    if (plain(base[k])) out[k] = merge(base[k], v, `${prefix}${k}.`);
    else {
      if (Array.isArray(base[k]) ? !Array.isArray(v) : typeof v !== typeof base[k]) throw new Error(`Invalid setting: ${prefix}${k}`);
      out[k] = v;
    }
  }
  return out;
}
export function validateConfig(value) {
  const c = merge(DEFAULTS, value);
  if (c.version !== 1) throw new Error('Unsupported configuration version');
  for (const key of ['port', 'commandPort', 'testPort']) if (!Number.isInteger(c.mc[key]) || c.mc[key] < 1 || c.mc[key] > 65535) throw new Error(`Invalid port: mc.${key}`);
  if (new Set([c.mc.port, c.mc.commandPort, c.mc.testPort]).size !== 3) throw new Error('Minecraft ports must be different');
  if (!Number.isInteger(c.mc.memoryMb) || c.mc.memoryMb < 512 || c.mc.memoryMb > 65536) throw new Error('Invalid Java memory limit');
  if (!/^[A-Za-z0-9_]{1,16}$/.test(c.mc.username)) throw new Error('Minecraft username requires 1–16 letters, numbers or underscores');
  if (!['offline', 'microsoft'].includes(c.mc.auth)) throw new Error('Invalid Minecraft authentication');
  if(!['managed','lan','existing'].includes(c.mc.source))throw new Error('Invalid Minecraft world source');
  if(!['vanilla','paper'].includes(c.mc.serverType))throw new Error('Invalid Minecraft server type');
  if (c.qq.wsUrl) { const u = new URL(c.qq.wsUrl); if (!['ws:', 'wss:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) throw new Error('Use a ws/wss address without embedded credentials'); }
  for (const id of [c.owner.id, c.qq.selfId, ...c.qq.allowedGroups]) if (id !== '' && !/^\d+$/.test(String(id))) throw new Error('Account and group IDs must be digits');
  if (!['zh', 'en'].includes(c.ui.language) || !['system', 'light', 'dark'].includes(c.ui.theme)) throw new Error('Invalid display setting');
  for (const s of Object.values(c.character)) if (s.length > 300) throw new Error('Character field is too long');
  if(c.life.timeZone)try{new Intl.DateTimeFormat('en',{timeZone:c.life.timeZone});}catch{throw new Error('时区无效 / Invalid time zone');}
  for(const k of ['reachout','diary'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.life[k].time))throw new Error('时间无效 / Invalid time');
  for(const [key,min,max] of [['idleSeconds',60,86400],['afterTaskSeconds',1,86400],['cooldownSeconds',60,86400],['maxConsecutive',1,10]])if(!Number.isInteger(c.life.selfplay[key])||c.life.selfplay[key]<min||c.life.selfplay[key]>max)throw new Error('自主循环参数无效 / Invalid self-play setting');
  if(!Number.isInteger(c.life.reachout.windowHours)||c.life.reachout.windowHours<1||c.life.reachout.windowHours>23||Number(c.life.reachout.time.slice(0,2))+c.life.reachout.windowHours>24)throw new Error('随机窗口必须在当天内 / Random window must stay within the same day');
  if(!Number.isInteger(c.life.reachout.enoughMessages)||c.life.reachout.enoughMessages<1||c.life.reachout.enoughMessages>1000)throw new Error('聊天阈值无效 / Invalid conversation threshold');
  return c;
}
export class ConfigStore {
  constructor(root) { this.paths = paths(root); }
  read() { return readJson(this.paths.config, DEFAULTS).then(validateConfig); }
  save(patch) { return serialized(this.paths.config, async () => { const next = validateConfig(merge(await this.read(), patch)); await writeJson(this.paths.config, next); return next; }); }
  async secrets(id) { const all = await readJson(this.paths.secrets, {}); return id ? all[id] || {} : all; }
  saveSecrets(id, values) {
    const keys = { qq: ['token'], xhh: ['pkey', 'x_xhh_tokenid'], bili: ['sessdata', 'bili_jct', 'buvid3'] }[id];
    if (!keys || !plain(values)) return Promise.reject(new Error('Invalid credentials'));
    return serialized(this.paths.secrets, async () => {
      const all = await this.secrets(); all[id] ||= {};
      for (const [k, v] of Object.entries(values)) { if (!keys.includes(k) || typeof v !== 'string' || v.length > 16384 || /[\r\n]/.test(v)) throw new Error('Invalid credentials'); all[id][k] = v; }
      await writeJson(this.paths.secrets, all); return { saved: true };
    });
  }
  async public() { const config = await this.read(); const secrets = await this.secrets(); return { config, credentials: Object.fromEntries(['qq', 'bili', 'xhh'].map(id => [id, Object.fromEntries(Object.entries(secrets[id] || {}).map(([k, v]) => [k, Boolean(v)]))])) }; }
}
