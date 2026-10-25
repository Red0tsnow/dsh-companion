import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// 看主人的主页有没有新投稿（WBI 签名 + cookie）。只读，不产生任何对外动作。
//
// 用法: node owner-videos.mjs [--n 10] [--mark]
//   --n N    看最近 N 条（默认 10）
//   --mark   把这次看到的记进 whale-owner-seen.json，下次只报新的
//
// 输出: 先一行 "NEW=n"（上次之后的新投稿数），然后逐条列出。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i] ?? true
}
const N = Number(opt.n ?? 10)
const MARK = Boolean(opt.mark)

const HOME = COMPANION_ROOT
const credPath = path.join(HOME, 'bili', 'credentials.json')
const cfgPath = path.join(HOME, 'compat', 'bili-whale.config.json')
const seenPath = path.join(HOME, 'compat', 'whale-owner-seen.json')

const cred = JSON.parse(fs.readFileSync(credPath, 'utf8'))
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const mid = String(cfg?.owner?.mid ?? '').trim()
if (!mid) {
  console.error('✗ 配置里没有 owner.mid —— 先在设置页填主人的 mid')
  process.exit(2)
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const cookie = `SESSDATA=${cred.sessdata}; bili_jct=${cred.bili_jct}; buvid3=${cred.buvid3}`
const H = { 'user-agent': UA, referer: `https://space.bilibili.com/${mid}`, cookie }
const jget = async (u) => (await fetch(u, { headers: H })).json()

const MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
const keyOf = (u) => u.slice(u.lastIndexOf('/') + 1, u.lastIndexOf('.'))
const nav = await jget('https://api.bilibili.com/x/web-interface/nav')
const rawKeys = keyOf(nav.data?.wbi_img?.img_url ?? '') + keyOf(nav.data?.wbi_img?.sub_url ?? '')
const mixin = MIXIN_TAB.map((i) => rawKeys[i]).join('').slice(0, 32)
const clean = (v) => String(v).replace(/[!'()*]/g, '')
function wbi(params) {
  const wts = Math.round(Date.now() / 1000)
  const q = Object.keys({ ...params, wts }).sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(clean(k === 'wts' ? wts : params[k]))}`).join('&')
  return `${q}&w_rid=${crypto.createHash('md5').update(q + mixin).digest('hex')}`
}

const qs = wbi({ mid, ps: N, pn: 1, order: 'pubdate' })
const d = await jget(`https://api.bilibili.com/x/space/wbi/arc/search?${qs}`)
if (d.code !== 0) {
  console.log(`NEW=0`)
  console.log(`✗ 查主页失败 code=${d.code} ${d.message ?? ''}`)
  console.log(JSON.stringify(d).slice(0, 300))
  process.exit(0)
}

const vlist = d.data?.list?.vlist ?? []
const total = d.data?.page?.count ?? vlist.length

let seen = []
try {
  seen = JSON.parse(fs.readFileSync(seenPath, 'utf8')).bvid ?? []
} catch {}
const seenSet = new Set(seen)
const fresh = vlist.filter((v) => !seenSet.has(v.bvid))

console.log(`NEW=${fresh.length}`)
console.log(`主人「${cfg?.owner?.name || mid}」共 ${total} 个投稿，本次看最近 ${vlist.length} 条`)
for (const v of vlist) {
  const isNew = !seenSet.has(v.bvid)
  const date = new Date((v.created ?? 0) * 1000).toLocaleString('zh-CN', { hour12: false })
  console.log(`\n${isNew ? '★ ' : '  '}${v.title}`)
  console.log(`    BV=${v.bvid}  ${date}  时长=${v.length}  播放=${v.play}  弹幕=${v.video_review ?? '-'}  评论=${v.comment ?? '-'}`)
  if (v.description) console.log(`    简介: ${String(v.description).replace(/\s+/g, ' ').slice(0, 100)}`)
}

if (MARK) {
  const merged = [...new Set([...vlist.map((v) => v.bvid), ...seen])].slice(0, 200)
  fs.writeFileSync(seenPath, JSON.stringify({ updatedAt: new Date().toISOString(), bvid: merged }, null, 2), 'utf8')
  console.log(`\n（已记下 ${vlist.length} 条，下次只报新的）`)
}
