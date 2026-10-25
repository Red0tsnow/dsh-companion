import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// 私信监听（只回主人）—— 2026-10-19 主人提议：私信比评论区更安静、风险更小
//   只在【主人那个会话】有新消息时命中；其他会话（系统通知 / 陌生人）一律忽略 ✗
//   用法:
//     node dm-await.mjs --baseline          把当前状态记为"已读"，从现在起只认新消息
//     node dm-await.mjs --once [--json]     轮询一次（命中打印 DM_HIT）
//     node dm-await.mjs --interval 20       持续轮询（插件里用 --once 自带循环 ✗）
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../lib/config.mjs'

const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) opt[argv[i].slice(2)] = true
    else { opt[argv[i].slice(2)] = v; i += 1 }
  }
}
const BASE = !!opt.baseline
const ONCE = !!opt.once || BASE
const JSONOUT = !!opt.json

const U = COMPANION_ROOT
const STATE = path.join(U, 'bili', 'dm-await-state.json')
const c = JSON.parse(fs.readFileSync(path.join(U, 'bili', 'credentials.json'), 'utf8'))
const cfg = config()
const OWNER = String(cfg.owner?.mid ?? '').trim()
const OWNER_NAME = String(cfg.owner?.name ?? '主人')
if (!OWNER) { console.error('✗ 配置里 owner.mid 为空'); process.exit(2) }

const H = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  referer: 'https://www.bilibili.com/',
  cookie: `SESSDATA=${c.sessdata}; bili_jct=${c.bili_jct}; buvid3=${c.buvid3}`,
}
const loadState = () => { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')) } catch { return {} } }
const saveState = (o) => { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify(o, null, 2) + '\n') }
const parsed = (content) => {
  // 私信内容可能是 {"content":"…"} 或纯文本
  try { const j = JSON.parse(String(content)); return String(j.content ?? j.text ?? content) } catch { return String(content ?? '') }
}

async function poll() {
  const u = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions?session_type=1&group_id=0&count=20&mobi_app=web'
  const r = await fetch(u, { headers: H })
  const j = await r.json().catch(() => ({}))
  if (j.code !== 0) return { ok: false, why: `get_sessions code=${j.code} ${j.message ?? ''}` }
  const list = j.data?.session_list ?? []
  const mine = list.find((s) => String(s.talker_id) === OWNER)
  if (!mine) return { ok: true, hit: false, why: '没找到主人的会话' }
  const last = mine.last_msg ?? {}
  const ts = Number(last.timestamp ?? 0)
  const text = parsed(last.content)
  const sender = Number(last.sender_uid ?? 0)
  const fromOwner = String(sender) === OWNER      // 只有主人发的才算
  return { ok: true, ts, text, fromOwner, unread: Number(mine.unread_count ?? 0) }
}

if (BASE) {
  const r = await poll()
  if (!r.ok) { console.error(`✗ ${r.why}`); process.exit(3) }
  saveState({ lastSeen: r.ts || 0, at: new Date().toISOString() })
  console.log(`已把当前私信状态标记为已读（lastSeen=${r.ts}）✓ 从现在起只认新消息`)
  process.exit(0)
}

const st = loadState()
const r = await poll()
if (!r.ok) { console.error(`✗ ${r.why}`); process.exit(3) }
const lastSeen = Number(st.lastSeen ?? 0)
const hit = r.ts > lastSeen && r.fromOwner
if (hit) {
  saveState({ lastSeen: r.ts, at: new Date().toISOString() })
  if (JSONOUT) console.log(JSON.stringify({ hit: true, mid: OWNER, name: OWNER_NAME, text: r.text, ts: r.ts }))
  else console.log(`DM_HIT mid=${OWNER} name=${OWNER_NAME} ts=${r.ts} text=${r.text.replace(/\n/g, ' ').slice(0, 200)}`)
  process.exit(0)
}
// 没命中：把 lastSeen 往前推（避免旧消息反复触发；但只在对方是主人时推）
if (r.ts > lastSeen) saveState({ lastSeen: r.ts, at: new Date().toISOString() })
if (JSONOUT) console.log(JSON.stringify({ hit: false }))
else if (!ONCE) console.log('无新私信')
process.exit(1)
