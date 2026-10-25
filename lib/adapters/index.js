import path from 'node:path';
import { makeAdapter, result } from '../core/probe.js';
import { bodyRequest, bodyStatus } from '../core/world.js';
import { runTool } from '../core/runner.js';
import { OneBot } from './onebot.js';
const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
export function createAdapters(store, receive, report = () => {}) {
  const root = store.paths.root; let qqClient, signature, closed=false;
  async function connection() {
    const cfg = await store.read(), secrets = await store.secrets('qq');
    if(closed)throw new Error('Companion is stopped');
    if (!cfg.qq.enabled || !cfg.qq.wsUrl) throw new Error('QQ is not enabled');
    const current = JSON.stringify([cfg.qq.wsUrl, secrets.token]);
    if (!qqClient || qqClient.closed || current !== signature) {
      qqClient?.close(); signature = current;
      qqClient = new OneBot({ url: cfg.qq.wsUrl, token: secrets.token });
      qqClient.on('event', async event => {
        try {
          const c = await store.read();
          if (!c.qq.enabled || event.post_type !== 'message' || String(event.user_id) === String(event.self_id)) return;
          const group = event.message_type === 'group';
          if (group ? !c.qq.allowedGroups.map(String).includes(String(event.group_id)) : !c.owner.id || String(event.user_id) !== c.owner.id) return;
          const parts = Array.isArray(event.message) ? event.message : [{ type: 'text', data: { text: String(event.raw_message || event.message || '') } }];
          if (group && !parts.some(x => x.type === 'at' && String(x.data?.qq) === String(event.self_id))) return;
          const text = parts.filter(x => x.type === 'text').map(x => x.data?.text || '').join('').slice(0, 8000);
          if (text.trim()) await receive({ id: `${event.self_id}:${event.message_type}:${event.message_id}`, channel: 'qq', target: String(group ? event.group_id : event.user_id), group, text });
        } catch (e) { report(e); }
      });
    }
    await qqClient.connect(); return qqClient;
  }
  const mc = makeAdapter({ id: 'mc', label: 'Minecraft', configured: c => Boolean(c.serverDir) || c.source === 'lan', schema: [field('serverDir', ['服务端目录', 'Server directory'], 'path'), field('javaPath', ['Java 路径（留空自动检测）', 'Java path (auto when empty)'], 'path'), field('port', ['游戏端口', 'Game port'], 'number'), field('commandPort', ['身体端口', 'Body port'], 'number'), field('username', ['游戏名字', 'Player name']), field('jar', ['服务端 jar', 'Server jar']), field('auth', ['登录方式', 'Authentication'], 'select', { options: ['offline', 'microsoft'] })],
    check: async (_, signal) => {
      const config = await store.read(); const { stdout } = await runTool(root, path.join(store.paths.tools, 'mc/world.mjs'), ['status'], { timeout: 18000, signal, nodePath: config.runtime.nodePath });
      const s = JSON.parse(stdout); return result(s.state === 'conflict' ? 'error' : s.state, s.message || (s.state === 'online' ? (s.bodySupported === false ? '世界在线，该版本身体暂不支持 / World online, body version unsupported' : s.body?.online ? '世界在线，角色已进入 / In the world' : '世界在线，角色不在 / World online, body offline') : '世界离线 / World offline'), s);
    }, actions: Object.fromEntries(['up', 'down'].map(cmd => [cmd, async (options={}) => { const c = await store.read(); const out = await runTool(root, path.join(store.paths.tools, 'mc/world.mjs'), [cmd], { timeout: 120000, nodePath: c.runtime.nodePath, signal:options.signal instanceof AbortSignal?options.signal:undefined }); return JSON.parse(out.stdout); }])) });
  async function bodyAction(route, body) {
    const cfg = (await store.read()).mc;
    const status = await bodyStatus(root, cfg);
    if (!status?.online) return result('offline','角色不在世界中 / Body is offline', { processPresent: Boolean(status), enteredWorld: false });
    return bodyRequest(root, cfg, route, body);
  }
  mc.actions.leave = async () => { const c=await store.read();const out=await runTool(root,path.join(store.paths.tools,'mc/world.mjs'),['leave'],{timeout:30000,nodePath:c.runtime.nodePath});return JSON.parse(out.stdout); };
  mc.actions.around = async () => bodyAction('/around');
  mc.actions.map = async () => bodyAction('/map');
  mc.actions.say = async arg => bodyAction('/say', { text: validText(arg.text) });
  const qq = makeAdapter({ id: 'qq', label: 'QQ', configured: c => Boolean(c.wsUrl), schema: [field('wsUrl', ['NapCat WebSocket 地址', 'NapCat WebSocket URL']), field('selfId', ['角色 QQ（可自动识别）', 'Character QQ (auto-detect)']), field('allowedGroups', ['允许的群（逗号分隔，群内需 @）', 'Allowed groups (comma separated, mention required)'], 'list')], check: async c => {
    const client = await connection(), info = await client.call('get_login_info');
    if (c.selfId && c.selfId !== String(info.user_id)) return result('error', '账号不匹配 / Account mismatch');
    const status = await client.call('get_status'); return result(status.online && status.good !== false ? 'online' : 'offline', status.online ? '已连接 / Connected' : 'QQ 未登录 / QQ offline', { id: String(info.user_id), account: info.nickname });
  }, actions: { connect: async () => qq.probe((await store.read()).qq), disconnect: async () => { await store.save({ qq: { enabled: false } }); qqClient?.close(); qq.reset((await store.read()).qq); return { ok: true }; }, say: async arg => {
    const c = await store.read(); if (!c.owner.id) throw new Error('Configure owner QQ first');
    return (await connection()).call('send_private_msg', { user_id: Number(c.owner.id), message: [{ type: 'text', data: { text: validText(arg.text) } }] });
  } } });
  const platforms = ['xhh', 'bili'].map(id => makeAdapter({ id, label: id === 'xhh' ? '小黑盒 / Heybox' : 'B站 / Bilibili', schema: id === 'xhh' ? [field('toolPath', ['自备小黑盒 CLI 路径', 'Your own Heybox CLI path'], 'path')] : [], configured: c => id === 'xhh' ? Boolean(c.toolPath) : Boolean(c.credentialPresent), check: async (_, signal) => {
    const c = await store.read();
    const { stdout } = id === 'xhh' ? await runTool(root, c.xhh.toolPath, ['whoami', '--json'], { timeout: 6500, signal, nodePath: c.runtime.nodePath, env: { DSH_COMPANION_CREDENTIALS: path.join(store.paths.xhh, 'xhh-cookie.json') } }) : await runTool(root, path.join(store.paths.tools, 'platform-probe.mjs'), [id], { timeout: 6500, signal, nodePath: c.runtime.nodePath });
    let s; try { s = JSON.parse(stdout); } catch { s = { state: /服务端：✓ 已登录/.test(stdout) ? 'online' : /过期了|登录态无效/.test(stdout) ? 'expired' : 'error' }; }
    if (!['online', 'expired', 'offline', 'error', 'unconfigured'].includes(s.state)) s = { state: 'error' };
    return result(s.state, ({ online: '已登录 / Signed in', expired: '登录已过期 / Cookie expired', offline: '网络不可达 / Network unavailable', error: '平台未通过验证 / Platform rejected request' })[s.state] || '未接入 / Not configured', s);
  } }));
  const adapters = Object.fromEntries([mc, qq, ...platforms].map(a => [a.id, a]));
  return { adapters, async probe(id) { const cfg = await store.read(), secrets = await store.secrets(id); return adapters[id].probe({ ...cfg[id], credentialPresent: Boolean(id === 'bili' ? secrets.sessdata : secrets.pkey) }); },
    async send(route, text) {
      const cfg = await store.read();
      if (route.channel === 'mc') { if (!cfg.mc.enabled) throw new Error('Minecraft disabled'); return bodyRequest(root, cfg.mc, '/say', { text }); }
      if (route.channel === 'qq') {
        if (route.group ? !cfg.qq.allowedGroups.map(String).includes(route.target) : cfg.owner.id !== route.target) throw new Error('Reply target is no longer allowed');
        return (await connection()).call(route.group ? 'send_group_msg' : 'send_private_msg', { [route.group ? 'group_id' : 'user_id']: Number(route.target), message: [{ type: 'text', data: { text: text.slice(0, 10000) } }] });
      }
    }, async refresh({ forceId } = {}) {
      if(closed)return;
      const c = await store.read();
      if(closed)return;
      for (const [id, adapter] of Object.entries(adapters)) {
        const secret = await store.secrets(id);
        adapter.reset({ ...c[id], credentialPresent: Boolean(id === 'bili' ? secret.sessdata : secret.pkey) }, { force: id === forceId });
      }
      if (c.qq.enabled && c.qq.wsUrl) await connection().catch(report); else qqClient?.close();
    }, close() { closed=true;for (const adapter of Object.values(adapters)) adapter.close(); qqClient?.close(); } };
}
export function validText(value) { if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new Error('Invalid message / 消息不能为空或过长'); return value; }
