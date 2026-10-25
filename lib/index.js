import { CompanionService } from './core/service.js';
import { dataRoot } from './core/paths.js';
import { hostBridge } from './core/host.js';

export const API_PATHS = ['/config', '/credentials', '/persona', '/templates', '/writings', '/status', '/deps', '/session', '/chat', '/media', '/media/remove', '/media/file', '/schedules', '/host-model','/setup/mc/versions','/setup/qq/trust','/setup/qq/login', '/setup', '/setup/mc', '/setup/skin', '/setup/qq', '/setup/qq/open', '/setup/qq/launch', '/setup/qq/check', '/setup/bili/start', '/setup/bili/poll', '/setup/cancel', ...['mc','qq','xhh','bili'].map(id => `/adapters/${id}/probe`), ...['up','down','leave','around','map','say'].map(a => `/adapters/mc/actions/${a}`), ...['connect','disconnect','say'].map(a => `/adapters/qq/actions/${a}`)];
export default {
  name: 'dsh-companion',
  inject: ['connection', 'sessionController', 'agents'],
  async apply(ctx, config = {}) {
    const root = dataRoot(config.dataDir);
    let service;
    const bridge = hostBridge(ctx, root, async () => (await service.store.read()).character.name);
    service = new CompanionService(root, bridge); await service.init();
    ctx.effect(() => () => service.close());
    for (const route of API_PATHS) {
      ctx.connection.fetch.register({ path: `/api/dsh-companion${route}`, methods: ['GET', 'POST'], requestBody: 'buffered', fetch: async request => {
        try {
          const text = request.method === 'POST' ? await request.text() : '';
          if (text.length > (route === '/media' ? 12 * 1024 * 1024 : 65536)) return Response.json({ error: 'Request too large' }, { status: 413 });
          const result = await service.request(request.method, route, text ? JSON.parse(text) : Object.fromEntries(new URL(request.url).searchParams));
          if (route === '/media/file') return new Response(result.data, { headers: { 'Content-Type': result.mime, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
          return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
        } catch (e) { return Response.json({ error: safeError(e) }, { status: 400 }); }
      } });
    }
    // Browser compatibility alias. Desktop IPC uses the exact Fetch routes above.
    ctx.inject(['webServer'], webCtx => webCtx.effect(() => webCtx.webServer.register({ kind: 'prefix', path: '/dsh-companion/api/', handler: async (req, res) => {
      const rejection = ctx.connection.requestRejection(req); if (rejection != null) { res.writeHead(rejection); res.end(); return; }
      try {
        const route = new URL(req.url, 'http://localhost').pathname.slice('/dsh-companion/api'.length);
        let text = ''; for await (const chunk of req) { text += chunk; if (text.length > (route === '/media' ? 12 * 1024 * 1024 : 65536)) throw new Error('Request too large'); }
        const result = await service.request(req.method, route, text ? JSON.parse(text) : Object.fromEntries(new URL(req.url, 'http://localhost').searchParams));
        if (route === '/media/file') { res.writeHead(200, { 'Content-Type': result.mime, 'X-Content-Type-Options': 'nosniff' }); res.end(result.data); return; }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(result));
      } catch (e) { res.writeHead(400, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: safeError(e) })); }
    } })));
  },
};
function safeError(e) {
  // ChildProcess errors embed entire arguments/stdout; only expose an actionable generic result.
  return e?.cmd ? 'Tool failed or timed out. Check dependency diagnostics / 工具执行失败或超时，请检查依赖' : String(e?.message || 'Operation failed').slice(0, 500);
}
