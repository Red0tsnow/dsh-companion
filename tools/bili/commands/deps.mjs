import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// 依赖体检（2026-10-17 加）：装完之后让 agent 自己跑一次，确认"能不能用"
//
// 用法：
//   node deps.mjs            人读版（每项 ✓/✗ + 怎么修）
//   node deps.mjs --json     机器读版（agent 判断用）
//
// 退出码：0 = 全可用；3 = 有缺的（缺的那项会写明补救办法）
import fs from 'node:fs'
import path from 'node:path'
import { ffmpegInfo } from '../lib/ffmpeg.mjs'

const HOME = COMPANION_ROOT
const cred = path.join(HOME, 'bili', 'credentials.json')
const asJson = process.argv.includes('--json')

const items = []

// ① 凭据（cookie）：**真去请求一次 nav** —— 只查"字段齐不齐"是不够的（cookie 会过期 ✗）
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
let credOk = false, credNote = ''
try {
  const c = JSON.parse(fs.readFileSync(cred, 'utf8'))
  const miss = ['sessdata', 'bili_jct'].filter((k) => !c[k] || !String(c[k]).trim())
  if (miss.length) { credNote = `缺字段：${miss.join(', ')}` }
  else {
    const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: { 'user-agent': UA, referer: 'https://www.bilibili.com/', cookie: `SESSDATA=${c.sessdata}; bili_jct=${c.bili_jct}; buvid3=${c.buvid3}` },
    })).json()
    credOk = nav.code === 0 && !!nav.data?.isLogin
    credNote = credOk
      ? `已登录：${nav.data.uname}（mid ${nav.data.mid}）`
      : `cookie 无效：code=${nav.code} ${nav.message ?? ''} —— 重新复制一次（选"长期/记住我"）`
  }
} catch { credNote = `没有或读不了凭据文件（${cred}）` }
items.push({
  name: 'B站 cookie',
  ok: credOk,
  detail: credNote,
  fix: '在设置里重新填 SESSDATA / bili_jct（buvid3 可留空）；注意 cookie 会过期，写操作前先跑一次本命令',
})

// ② ffmpeg（抽帧看画面）
const ff = ffmpegInfo()
items.push({
  name: 'ffmpeg（抽帧看画面）',
  ok: ff.ok,
  detail: ff.ok ? `${ff.version}\n  路径：${ff.path}` : (ff.path ? `找到了但跑不起来：${ff.version ?? ff.error}` : '没找到'),
  fix: '① winget install ffmpeg  ② 或设环境变量 FFMPEG=路径  ③ 或放进 <仓库>/bin/ 或 ~/.dsh/bili-whale/bin/',
})

// ③ Node 版本（要 18+ 才有稳定 fetch）
const major = Number(process.versions.node.split('.')[0])
items.push({
  name: 'Node.js',
  ok: major >= 18,
  detail: `v${process.versions.node}`,
  fix: '升级到 Node 18 或更高（fetch / Blob 之类要用）',
})

// ④ 可写的家目录（放 cookie/配额/日记）
let dirOk = false
try {
  const d = path.join(HOME, 'bili')
  fs.mkdirSync(d, { recursive: true })
  const probe = path.join(d, '.write-probe')
  fs.writeFileSync(probe, 'ok'); fs.unlinkSync(probe)
  dirOk = true
} catch {}
// 2026-10-21 加（Issue #8-3）：没有 node 运行时 → 生物钟/监听/直播间全部停用，
//   但以前体检不报这一项 ✗ 表面全绿、其实永远不会醒 ✗
try {
  const { NODE_EXE, isRealNode } = await import('../lib/nodebin.mjs')
  const real = isRealNode()
  items.push({
    name: 'node 运行时',
    ok: real,
    detail: real ? NODE_EXE : ('这个不是 node：' + NODE_EXE + '（会静默返回空输出）'),
    fix: '设置环境变量 DSH_NODE 指向 node 可执行文件的绝对路径，然后重启 DSH',
  })
} catch (e) {
  items.push({ name: 'node 运行时', ok: false, detail: '检查失败：' + String(e?.message ?? e).slice(0, 80), fix: '设置 DSH_NODE' })
}

items.push({ name: '数据目录可写', ok: dirOk, detail: path.join(HOME, 'bili'), fix: '检查该目录权限' })

const bad = items.filter((i) => !i.ok)

if (asJson) {
  console.log(JSON.stringify({ ok: bad.length === 0, node: process.versions.node, items }, null, 2))
} else {
  console.log('== 依赖体检 ==')
  for (const i of items) {
    console.log(`${i.ok ? '✓' : '✗'} ${i.name}  ${i.detail ? '— ' + i.detail : ''}`)
    if (!i.ok) console.log(`    修：${i.fix}`)
  }
  console.log(bad.length ? `\n✗ ${bad.length} 项不可用 —— 先用上面的"修"处理，再重跑一次。` : '\n✓ 全部可用')
}
process.exit(bad.length ? 3 : 0)
