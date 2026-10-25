// Opt-in integration check against the isolated DSH test host created under .dev.
// Model outputs come from a clearly named local fixture provider, never an external account.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
const log = await fs.readFile('.dev/host.log', 'utf8');
const entry = log.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+/);
if (!entry) throw new Error('Start the isolated verification host first');
const origin = new URL(entry[0]).origin;
const auth = await fetch(entry[0], { redirect: 'manual' });
const cookie = auth.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
async function call(route, body, extra = {}) {
  const r = await fetch(origin + '/api/dsh-companion' + route, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json', ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error(`${route}: ${JSON.stringify(j)}`); return j;
}
const report = { kind: 'installed-DSH-host-with-local-fixture-model', checks: [] };
function check(name, value, detail) { report.checks.push({ name, pass: Boolean(value), ...(detail ? { detail } : {}) }); if (!value) throw new Error(name); }
const waitFor = async fn => { const deadline = Date.now() + 15000; while (Date.now() < deadline) { if (await fn()) return true; await new Promise(r => setTimeout(r, 150)); } return false; };
let ws, bodyServer;
try {
  const status = await call('/status'); check('four channels on actual DSH host', Object.keys(status.channels || {}).length === 4 && status.hostAvailable);
  await call('/config', { character: { name: 'River', relationship: 'friend', tone: 'brief' } });
  const marker = `persona-marker-${randomUUID()}`;
  await call('/persona', { text: `You are River, a quiet friend. ${marker}` });
  const session = await call('/session', {}); report.sessionId = session.sessionId; check('actual host-created identity', Boolean(session.sessionId));
  const answer = await call('/chat', { text: 'Verify this workspace.' }); check('native DSH Agent loop returned fixture output', answer.text.includes('Fixture response'));
  const model=await call('/host-model');check('public host model status recognizes a successful current fixture route',model.state==='available'&&model.available===true);
  check('session identity reused after prior restart', (await call('/session', {})).sessionId === session.sessionId);
  const requests = (await fs.readFile('.dev/isolated-home/fixture-calls.jsonl', 'utf8')).trim().split('\n').map(JSON.parse);
  check('saved persona reached the model request in the same session', JSON.stringify(requests.at(-1)).includes(marker));
  check('private HTTP API rejects missing host authentication', (await fetch(origin + '/api/dsh-companion/config')).status === 401);
  check('cross-origin API request rejected', (await fetch(origin + '/api/dsh-companion/config', { headers: { Cookie: cookie, Origin: 'https://untrusted.example' } })).status === 403);

  const replies = []; let connected;
  ws = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await new Promise(r => ws.once('listening', r));
  ws.on('connection', (socket, req) => {
    connected = socket; check('OneBot bearer authentication propagated', req.headers.authorization === 'Bearer fixture-only-token');
    socket.on('message', raw => {
      const m = JSON.parse(raw); let data = {};
      if (m.action === 'get_login_info') data = { user_id: 90001, nickname: 'Synthetic local bot' };
      if (m.action === 'get_status') data = { online: true, good: true };
      if (m.action === 'send_private_msg') { replies.push(m.params); data = { message_id: 21 }; }
      socket.send(JSON.stringify({ echo: m.echo, status: 'ok', retcode: 0, data }));
    });
  });
  await call('/credentials', { id: 'qq', values: { token: 'fixture-only-token' } });
  await call('/config', { owner: { id: '12345' }, qq: { enabled: true, wsUrl: `ws://127.0.0.1:${ws.address().port}`, selfId: '90001' } });
  check('OneBot probe through real host', (await call('/adapters/qq/probe', {})).ok);
  const event = { post_type: 'message', message_type: 'private', sub_type: 'friend', self_id: 90001, user_id: 12345, message_id: Date.now(), time: Math.floor(Date.now()/1000), raw_message: 'Synthetic local hello', message: [{ type: 'text', data: { text: 'Synthetic local hello' } }], sender: { user_id: 12345, nickname: 'Fixture owner' } };
  connected.send(JSON.stringify(event));
  check('OneBot inbound -> actual Agent -> original private target', await waitFor(() => replies.length === 1) && replies[0].user_id === 12345 && replies[0].message[0].data.text.includes('Fixture response'));
  connected.send(JSON.stringify(event)); await new Promise(r => setTimeout(r, 1200)); check('duplicate QQ message does not create another reply', replies.length === 1);

  const root = path.resolve('.dev/isolated-home/companion'), secrets = JSON.parse(await fs.readFile(path.join(root, 'secrets.json'), 'utf8')), gameReplies = [];
  bodyServer = http.createServer(async (req, res) => {
    if (req.headers.authorization !== `Bearer ${secrets.bodyToken}`) { res.writeHead(403); res.end(); return; }
    let text = ''; for await (const chunk of req) text += chunk;
    if (req.url === '/say') gameReplies.push(JSON.parse(text).text);
    res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ ok: true, online: true, companionRoot: root.replaceAll('\\','/').toLowerCase() }));
  });
  await new Promise(r => bodyServer.listen(0, '127.0.0.1', r));
  await call('/config', { mc: { enabled: true, commandPort: bodyServer.address().port } });
  const id = `fixture-world-${randomUUID()}`;
  await fs.appendFile(path.join(root, 'runtime', 'world-events.jsonl'), JSON.stringify({ id, channel: 'mc', kind: 'world', text: 'Synthetic rain observation', at: Date.now() }) + '\n');
  check('world event -> actual Agent -> original game channel', await waitFor(() => gameReplies.length === 1) && gameReplies[0].includes('Fixture response'));
  check('world reply was not sent to QQ', replies.length === 1);
  const calls = (await fs.readFile('.dev/isolated-home/fixture-calls.jsonl', 'utf8')).trim().split('\n').map(JSON.parse);
  check('world event keeps its explicit environment boundary', JSON.stringify(calls.at(-1)).includes('world_event source=\\"minecraft\\"'));
} catch (e) { report.error = e.message; }
finally {
  await call('/config', { qq: { enabled: false }, mc: { enabled: false } }).catch(() => {});
  if (ws) { for (const c of ws.clients) c.terminate(); await new Promise(r => ws.close(r)); }
  if (bodyServer) await new Promise(r => bodyServer.close(r));
  await fs.mkdir('artifacts', { recursive: true }); await fs.writeFile('artifacts/host-verification.json', JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
if (report.error || report.checks.some(x => !x.pass)) process.exitCode = 1;
