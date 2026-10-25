import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// 看自己账号的粉丝 / 关注列表（只读）。用法: node fans.mjs [fans|followings] [--n 20]
//
// 输出用「字段名 = 值」的形式，避免把昵称看成粉丝数、把签名看成昵称。
import fs from 'node:fs'
import path from 'node:path'

const argv = process.argv.slice(2)
const kind = argv[0] === 'followings' ? 'followings' : 'fans'
const nIdx = argv.indexOf('--n')
const N = nIdx >= 0 ? Number(argv[nIdx + 1] ?? 20) : 20

const HOME = COMPANION_ROOT
const cred = JSON.parse(fs.readFileSync(path.join(HOME, 'bili', 'credentials.json'), 'utf8'))
const cfg = JSON.parse(fs.readFileSync(path.join(HOME, 'compat', 'bili-whale.config.json'), 'utf8'))
const mid = String(cfg?.self?.mid ?? '').trim()
if (!mid) {
  console.error('✗ 配置里没有 self.mid')
  process.exit(2)
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const cookie = `SESSDATA=${cred.sessdata}; bili_jct=${cred.bili_jct}; buvid3=${cred.buvid3}`
const H = { 'user-agent': UA, referer: `https://space.bilibili.com/${mid}`, cookie }
const jget = async (u) => (await fetch(u, { headers: H })).json()

const url = `https://api.bilibili.com/x/relation/${kind}?vmid=${mid}&pn=1&ps=${N}&jsonp=jsonp`
const d = await jget(url)

if (d.code !== 0) {
  console.log(`✗ 查询失败 code=${d.code} ${d.message ?? ''}`)
  process.exit(0)
}

const data = d.data || {}
const list = data.list || []
const total = data.total ?? list.length
console.log(`【${kind === 'fans' ? '粉丝' : '关注'}】总数 ${total} 人，本页 ${list.length} 人。下面每条是一个人的三个字段，别混。`)
for (const [i, it] of list.entries()) {
  const sign = String(it.sign ?? '').replace(/\s+/g, ' ').slice(0, 60)
  console.log(`\n${i + 1}.`)
  console.log(`   昵称   = ${it.uname}`)
  console.log(`   UID    = ${it.mid}`)
  console.log(`   签名   = ${sign || '（空）'}`)
}
