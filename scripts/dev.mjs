import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompanionService } from '../lib/core/service.js';
import { buildClient } from './build.mjs';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || process.argv[2] || 19881);
const root = path.resolve(process.env.DSH_COMPANION_HOME || path.join(workspace, '.dev', 'companion-preview'));
if (!root.startsWith(path.join(workspace,'.dev') + path.sep)) throw new Error('Preview data must stay under the workspace .dev directory');
await buildClient({ dev: true });
const service = new CompanionService(root); await service.init();
const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  try {
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}` || req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(403); res.end(); return; }
    if (url.pathname.startsWith('/api/dsh-companion/')) {
      const route = url.pathname.slice('/api/dsh-companion'.length);
      let text = ''; for await (const chunk of req) { text += chunk; if (text.length > (route === '/media' ? 12 * 1024 * 1024 : 65536)) throw new Error('Request too large'); }
      const result = await service.request(req.method, route, text ? JSON.parse(text) : Object.fromEntries(url.searchParams));
      if (route === '/media/file') {res.writeHead(200,{'Content-Type':result.mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(result.data);return;}
      res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(result));return;
    }
    if (url.pathname === '/app.js') { res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});res.end(await fs.readFile(path.join(workspace,'.dev','web','app.js')));return; }
    if (url.pathname !== '/') { res.writeHead(404);res.end();return; }
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Companion preview</title><style>body{margin:0;padding:24px;background:#e9eef5} @media(max-width:700px){body{padding:0}}</style></head><body><div id="app"></div><script src="/app.js"></script></body></html>');
  } catch(e) {res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:e.cmd ? 'Tool failed; inspect dependency checks' : e.message}));}
});
server.listen(port,'127.0.0.1',()=>console.log(`Companion preview: http://127.0.0.1:${server.address().port} (data: ${root})`));
const close=()=>{service.close();server.close(()=>process.exit(0));};process.on('SIGINT',close);process.on('SIGTERM',close);
