import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// Post ONE bilibili comment on the user's behalf. Explicitly single-shot.
//
//   node bili-comment.mjs --oid <aid> --bvid <BV...> --message "@昵称 正文" --dry
//   node bili-comment.mjs --oid <aid> --bvid <BV...> --message "@昵称 正文" --go
//
// Credentials live in a file outside the workspace and are never printed:
//   %USERPROFILE%\.bili-ai\credentials.json  -> { sessdata, bili_jct, buvid3 }
//
// --dry  : identifies the account behind the cookie (nav), builds and prints the
//          exact request, prints nothing postable. No write to bilibili.
// --go   : the same, then POSTs exactly once and prints the API result.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { config } from '../lib/config.mjs'
import { validateShare } from '../lib/share-policy.mjs'
import { NODE_EXE } from '../lib/nodebin.mjs'   // 2026-10-21：别用 process.execPath（Electron 里它是主程序 ✗）

// ── 限额闸（B 档「限额自主」的代码强制部分，2026-10-14 主人选 B 档）────────────────
// 语义：闸门**只管自主发言**（带 --auto，即"她自己决定说的"）；主人当场授权的发言不拦 ✓
// 这一层存在的理由：主人明确要求"限频写进代码，不是写进你的自觉里"。
// --share（2026-10-17 加）：分享型 —— "把看到的好东西 @ 主人"。它**不看白名单**，
//   但受**每日合计 ≤3**、**同一视频 7 天内一次**两条硬限制（由 quota.mjs 强制）。
const AUTO = process.argv.includes('--auto')
const SHARE = process.argv.includes('--share')
// --once-per-person（2026-10-17 加）：同一个人 30 天内最多只回一条（只对"回复某人"生效）。
// 2026-10-18 接线：不传旗标时按配置决定（config.listen.oncePerPerson ✓ 设置页那个开关）
//   —— 只在"回复某人"（带 --parent）时生效；分享/顶层评论不受影响 ✓
const ONCE = process.argv.includes('--once-per-person')
  || (process.argv.includes('--parent') && config().listen?.oncePerPerson === true)
const ONCE_DAYS = 30
const REPLIED = path.join(COMPANION_ROOT, 'bili', 'replied.json')
const loadReplied = () => { try { return JSON.parse(fs.readFileSync(REPLIED, 'utf8')) } catch { return { byUid: {} } } }
const saveReplied = (o) => { try { fs.mkdirSync(path.dirname(REPLIED), { recursive: true }); fs.writeFileSync(REPLIED, JSON.stringify(o, null, 2) + '\n') } catch {} }
// 查出"被回复的那个人"是谁（reply/reply 里 rpid === parent 的那条的作者）
async function parentAuthor(aid, rootRpid, parentRpid) {
  for (let pn = 1; pn <= 4; pn += 1) {
    const j = await (await fetch(`https://api.bilibili.com/x/v2/reply/reply?type=1&oid=${aid}&root=${rootRpid}&pn=${pn}&ps=20`, {
      headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://www.bilibili.com/' },
    })).json()
    const list = j.data?.replies ?? []
    const hit = list.find((r) => String(r.rpid) === String(parentRpid))
    if (hit) return { mid: String(hit.mid ?? hit.member?.mid ?? ''), name: hit.member?.uname ?? '' }
    if (!list.length) break
  }
  return null
}
const quota = (args) => {
  try {
    return { code: 0, out: execFileSync(NODE_EXE,
      [path.join(path.dirname(fileURLToPath(import.meta.url)), 'quota.mjs'), ...args], { encoding: 'utf8' }).trim() }
  } catch (e) { return { code: e.status ?? 1, out: String(e.stdout ?? e.message).trim() } }
}

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i]
  if (a.startsWith('--')) args.set(a.slice(2), process.argv[i + 1]?.startsWith('--') ? true : process.argv[++i] ?? true)
}
const oid = args.get('oid')
const bvid = args.get('bvid')
let message = args.get('message')
const root = args.get('root')     // 线程根评论 rpid（二级回复用）
const parent = args.get('parent') // 要回复的那条评论 rpid
// type=1 视频（默认）；type=11 动态/图文。⚠️ 动态的 oid 必须用
// polymer/web-dynamic/v1/detail 给的 basic.comment_id_str，**不是** dyn_id 本身
// （拿 dyn_id 当 oid 一律 -404，2026-10-13 实测踩过）。
const type = String(args.get('type') ?? '1')
// 动态评论的 referer 要指到 opus 页；给了它就可以不给 --bvid。
const refererArg = args.get('referer') ? String(args.get('referer')) : ''
const dry = args.get('dry') === true || args.has('dry')
const go = args.get('go') === true || args.has('go')

if (!oid || (!bvid && !refererArg) || !message) {
  console.error('usage: --oid <aid|comment_id_str> [--bvid <BV...> | --referer <url>] --message "<text>" [--type 1|11] [--root <rpid> --parent <rpid>] [--dry | --go]')
  process.exit(2)
}
if (dry && go) { console.error('pick either --dry or --go, not both'); process.exit(2) }
if (!dry && !go) { console.error('refusing to run without an explicit --dry or --go'); process.exit(2) }

// --share（分享型）：正文里必须 @ 主人 —— 没写 @ 就自动补上。
// 昵称取配置的 owner.name（space/wbi/acc/info 可能被风控，不实时查）；
// 昵称改过的话，发完用 `thread` 看 `@到:` 就能发现（没解析出来就说明名字旧了）。
// --share（分享型）—— 2026-10-17 严格化（Kimi 评审指出两个洞）：
//   ① 必须与 --auto 同传：不然它就是"第三条自我声明车道"，绕开了自主发言那套判据
//   ② 正文**必须以 @<配置里的主人昵称> 开头**：以前"含个 @"就算数 → 一条 "@任何人 快来买" 也能过闸 ✗
if (SHARE) {
  // 2026-10-18 接线：设置页「分享评论」的总开关（关掉 = 只看不说 ✓）
  if (config().share?.enabled === false) {
    console.error('分享已在设置里关闭（share.enabled = false）→ 这次不发（筛/深读/日记照常 ✓）')
    process.exit(3)
  }
  if (!AUTO) { console.error('--share 必须与 --auto 同传（分享型也是"她自己决定说的"）'); process.exit(2) }
  const ow = config().owner ?? {}
  if (!ow.name) { console.error('--share 需要先配置 owner.name（要 @ 谁）'); process.exit(2) }
  try { validateShare(config(), { reason: args.get('reason'), score: args.get('score'), rank: args.get('rank') ?? 1 }) }
  catch (e) { console.error(e.message); process.exit(2) }

  const want = `@${ow.name}`
  const body = String(message ?? '').trimStart()
  if (!body.startsWith(want)) {
    if (body.includes('@')) { console.error(`--share 的正文必须以 "${want}" 开头（里面那个 @ 不是主人）→ 拒绝发送`); process.exit(2) }
    message = `${want} ${message}`
    console.log(`[分享型] 正文没 @，已自动补：${want}`)
  }
}

// "同一个人只回一条"（可选 · 2026-10-17 加）：只在二级回复（--root + --parent）时生效。
// 用在"只回直接回她的人"那条流程里 → 同一个人 30 天内不会被回第二次（防拉锯、防被当聊天机器人）。
// 放在入口处（--dry 也会跑），这样"能不能回"在发之前就能知道。
if (ONCE) {
  if (!parent || !root) {
    console.log('  [once] 没有 --root/--parent —— 这个开关只对"回复某人"生效，已忽略')
  } else {
    const who = await parentAuthor(oid, root, parent)
    if (!who?.mid) {
      // fail-closed（2026-10-17，Kimi 评审指出）：判重系统状态未知时，默认动作是**这次不回**
      console.error('  [once] 没查到被回复者的 uid → 判重状态未知，**这次不回**（fail-closed）')
      console.error('  （确认要回就别传 --once-per-person，或者先手工确认这个人没被回过）')
      process.exit(2)
    } else {
      const led = loadReplied()
      const hist = (led.byUid?.[who.mid] ?? []).filter((x) => Date.now() - new Date(x.at).getTime() < ONCE_DAYS * 86_400_000)
      if (hist.length) {
        console.error(`  [once] ${ONCE_DAYS} 天内已经回过 ${who.name || who.mid}（${hist[0].at} · ${hist[0].target}）→ 这次不回`)
        console.error('  （不想要这个开关，就别传 --once-per-person）')
        process.exit(2)
      }
      console.log(`  [once] ${who.name || who.mid} 在 ${ONCE_DAYS} 天内没被回过 ✓ 可以回`)
    }
  }
}

const credPath = path.join((COMPANION_ROOT), 'bili', 'credentials.json')
if (!fs.existsSync(credPath)) {
  console.error(`credentials file missing: ${credPath}`)
  console.error('create it with {"sessdata":"...","bili_jct":"...","buvid3":"..."}')
  process.exit(3)
}
const cred = JSON.parse(fs.readFileSync(credPath, 'utf8'))
// 2026-10-21 修：buvid3 不该是必填 ✗ —— 没有它的用户会被这里直接 exit 3，评论永远发不出去
//   （B站 大部分写接口不需要 buvid3；缺了只影响个别接口）
const missing = ['sessdata', 'bili_jct'].filter((k) => !cred[k] || String(cred[k]).trim() === '')
if (missing.length) {
  console.error(`credentials file is missing values for: ${missing.join(', ')}`)
  process.exit(3)
}
if (!cred.buvid3 || String(cred.buvid3).trim() === '') {
  console.error('⚠️ 没有 buvid3（不影响评论；个别接口可能被风控）—— 想补就在 F12 → Cookies 里复制 buvid3')
}
const cookieHeader = `SESSDATA=${cred.sessdata}; bili_jct=${cred.bili_jct}; buvid3=${cred.buvid3}`
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const referer = refererArg !== '' ? refererArg : `https://www.bilibili.com/video/${bvid}/`

// ---- WBI signing (harmless if the endpoint does not ask for it) -------------
const MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
const keyOf = (u) => u.slice(u.lastIndexOf('/') + 1, u.lastIndexOf('.'))
async function wbiSign(params) {
  const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav', {
    headers: { 'user-agent': UA, referer: 'https://www.bilibili.com/', cookie: cookieHeader },
  })).json()
  const img = nav?.data?.wbi_img?.img_url
  const sub = nav?.data?.wbi_img?.sub_url
  if (!img || !sub) return null
  const raw = keyOf(img) + keyOf(sub)
  const mixin = MIXIN_TAB.map((i) => raw[i]).join('').slice(0, 32)
  const wts = Math.round(Date.now() / 1000)
  const clean = (v) => String(v).replace(/[!'()*]/g, '')
  const query = Object.keys({ ...params, wts })
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(clean(k === 'wts' ? wts : params[k]))}`)
    .join('&')
  const w_rid = crypto.createHash('md5').update(query + mixin).digest('hex')
  return { w_rid, wts, mixin }
}

// ---- who is behind this cookie? --------------------------------------------
const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav', {
  headers: { 'user-agent': UA, referer: 'https://www.bilibili.com/', cookie: cookieHeader },
})).json()
console.log('=== 登录态校验（只读） ===')
if (nav.code !== 0) {
  console.log(`  nav code=${nav.code} message=${nav.message}`)
  console.log('  → cookie 无效或已过期，先别发，重新复制一次')
  process.exit(4)
}
console.log(`  账号: ${nav.data.uname}   (mid ${nav.data.mid})`)
console.log(`  手机绑定: ${nav.data.mobile_verified ? '是' : '否'}   硬币 ${nav.data.money}`)
console.log('  ⚠️ 请确认这就是你的小号；若是主号，停手、换 cookie')

const params = { type, oid: String(oid), message, plat: '1', csrf: String(cred.bili_jct) }
if (root) params.root = String(root)
if (parent) params.parent = String(parent)
const signed = await wbiSign(params)
const body = new URLSearchParams(params).toString()
const url = signed
  ? `https://api.bilibili.com/x/v2/reply/add?w_rid=${signed.w_rid}&wts=${signed.wts}`
  : 'https://api.bilibili.com/x/v2/reply/add'

console.log('\n=== 将要发出的请求 ===')
console.log(`  POST  ${url}`)
console.log('  content-type: application/x-www-form-urlencoded')
console.log('  headers: UA(Chrome 131) + referer=' + referer)
console.log('  cookie : SESSDATA=***; bili_jct=***; buvid3=***   (已脱敏)')
console.log('  body   : ' + body.replace(encodeURIComponent(String(cred.bili_jct)), '***csrf***'))
console.log(`  正文长度 ${message.length} 字符（上限 1000）；oid=${oid}；emoji/表情需转义符，本脚本只发纯文本`)

if (dry) {
  console.log('\n[dry] 未发送。确认文案与账号后，把 --dry 换成 --go 再跑一次。')
  process.exit(0)
}

// 闸门：自主发言（--auto）或分享型（--share）才拦；主人授权的发言只显示额度
{
  const target = bvid ? `BV:${bvid}` : `oid:${oid}`
  const chk = quota(['check', '--type', 'comment', '--target', target, ...(SHARE ? ['--share'] : AUTO ? ['--auto'] : [])])
  console.log(`\n[限额闸] ${chk.out}`)
  if (chk.code !== 0) {
    console.error('  → 拒绝发送。这是硬约束第 4 条的代码实现，不要绕过（要发请主人当场授权，或改白名单/额度）。')
    process.exit(2)
  }
}

// 判重（--once-per-person）已在入口处检查，这里直接发
console.log('\n[go] 发送中…')
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'user-agent': UA,
    referer,
    origin: 'https://www.bilibili.com',
    'content-type': 'application/x-www-form-urlencoded',
    cookie: cookieHeader,
  },
  body,
})
const out = await res.json().catch(async () => ({ raw: await res.text() }))
console.log(`  HTTP ${res.status}`)
console.log(`  code=${out.code} message=${out.message ?? ''}`)
if (out.code === 0) {
  const rpid = out.data?.rpid_str ?? out.data?.rpid
  console.log(`  ✅ 已发布，评论 rpid=${rpid}`)
  // once-per-person：记一笔"回过谁"，下次判重用
  if (ONCE && parent && root) {
    try {
      const who = await parentAuthor(oid, root, parent)
      if (who?.mid) {
        const led = loadReplied()
        led.byUid ??= {}
        led.byUid[who.mid] ??= []
        led.byUid[who.mid].push({ at: new Date().toISOString(), target: bvid ? `BV:${bvid}` : `oid:${oid}`, rpid, name: who.name })
        // 只留 30 天内的记录，别把文件养大
        for (const k of Object.keys(led.byUid)) {
          led.byUid[k] = led.byUid[k].filter((x) => Date.now() - new Date(x.at).getTime() < ONCE_DAYS * 86_400_000)
          if (!led.byUid[k].length) delete led.byUid[k]
        }
        saveReplied(led)
        console.log(`  [once] 已记账：${who.name || who.mid}（30 天内不再回他）`)
      }
    } catch (e) { console.log(`  [once] 记账失败（不影响已发出的评论）：${String(e.message).slice(0, 80)}`) }
  }
  // 记账（发出去才算数）
  const rec = quota(['record', '--type', 'comment', '--target', bvid ? `BV:${bvid}` : `oid:${oid}`,
    '--note', message.replace(/\s+/g, ' ').slice(0, 40), ...(SHARE ? ['--share'] : AUTO ? ['--auto'] : [])])
  console.log(`  [限额闸] ${rec.out}`)
  // 自主 / 分享型 → **自动报备**（把 AGENTS 里的"约定"落到代码里；后端由 config.notify 决定）
  if (AUTO || SHARE) {
    try {
      const msg = `[${SHARE ? '分享型·@主人' : '自主发言'}] 评论已发出 rpid=${rpid}\n目标：${bvid ? 'BV:' + bvid : 'oid:' + oid}\n内容：${message.slice(0, 80)}`
      execFileSync(NODE_EXE,
        [path.join(path.dirname(fileURLToPath(import.meta.url)), 'notify.mjs'), msg, '--title', SHARE ? '分享评论报备' : '自主发言报备'],
        { stdio: 'inherit' })
    } catch (e) {
      console.log(`  [通知] 发出去了但报备失败：${String(e.message).slice(0, 120)}——请手动告诉使用者`)
    }
  }
  console.log(bvid
    ? `  https://www.bilibili.com/video/${bvid}/#reply${rpid}`
    : `  ${referer.replace(/\/$/, '')}#reply${rpid}`)
  process.exit(0) // P0-6：成功
} else {
  const hints = {
    '-101': '账号未登录：cookie 失效',
    '-102': '账号被封停',
    '-111': 'csrf 校验失败：bili_jct 不对或与 SESSDATA 不是同一个号',
    '-509': '请求过于频繁',
    12015: '需要评论验证码（说明被风控盯上了，停手）',
    12016: '内容含敏感信息',
    12035: '被 UP 主列入评论黑名单',
    12051: '重复评论被判刷屏',
    12002: '评论区已关闭',
  }
  if (hints[String(out.code)]) console.log(`  提示：${hints[String(out.code)]}`)
}

// P0-6（Kimi 评审 #6）：走到这里 = 没发成功。给非 0 退出码，
// 否则 agent 会把「被风控拒了」当成「发成功了」，绕过了「撞风控立刻停手」的红线 ✗
process.exit(6)
