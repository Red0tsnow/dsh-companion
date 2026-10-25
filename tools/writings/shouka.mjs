import { P } from '../runtime.mjs'
// 手札：一天一句，只记「今天硌到我的那一下」。
//
//   node shouka.mjs add "她说「你怎么又胖了」的时候，我先是笑，然后才觉得有点疼。"
//   node shouka.mjs list [--n 12]
//   node shouka.mjs gap                     # 距上一次写几天了（超过 3 天就提醒：那几天烂了，别补）
//
// 跟日记、NOTES 的区别：
//   NOTES  = 发生了什么（客观）
//   日记   = 今天怎么了（叙事，一段）
//   手札   = 哪一句话硌着我了（一句，带情绪，当天写）
//
// 「三天就烂掉」是这个东西的全部意义：过了三天还想不起来当时什么感觉，
// 那就说明它本来也不硌人，别硬编。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const FILE = path.join(P.work, '手札.md')
const HEADER = `# 手札

一天一句，只记当天硌到我的那一下。不记事，记感觉。
过了三天才想起来的，不算——那说明它本来也不硌人。

`

const read = () => { try { return fs.readFileSync(FILE, 'utf8') } catch { return HEADER } }
const pad = (n) => String(n).padStart(2, '0')
const day = (d = new Date()) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const [cmd, ...rest] = process.argv.slice(2)

if (!cmd || cmd === 'list') {
  const text = read()
  const lines = text.split('\n').filter((l) => /^-\s\d{2}-\d{2}/.test(l.trim()))
  const n = Number((rest.find((a) => /^--n$/.test(a)) && rest[rest.indexOf('--n') + 1]) || 12)
  console.log(`手札：共 ${lines.length} 条\n`)
  for (const l of lines.slice(-n)) console.log(l)
  if (!lines.length) console.log('（还是空的。等哪天有句话硌到你了再写。）')
  process.exit(0)
}

if (cmd === 'add') {
  const text = rest.filter((a) => !a.startsWith('--')).join(' ').trim()
  if (!text) { console.error('用法：node shouka.mjs add "一句话"'); process.exit(2) }
  if ([...text].length < 8) { console.error('太短了，写不出来就先不写。手札不是打卡。'); process.exit(2) }
  if ([...text].length > 200) { console.error('长了。手札是一句，不是一段——多的留给日记。'); process.exit(2) }

  const now = new Date()
  const line = `- ${day(now)} ${pad(now.getHours())}:${pad(now.getMinutes())} ｜ ${text}`
  const body = read().replace(/\s*$/, '')
  fs.writeFileSync(FILE, `${body}\n${line}\n`, 'utf8')
  console.log(`✓ 记下了（${[...text].length} 字）\n${line}`)
  process.exit(0)
}

if (cmd === 'gap') {
  const lines = read().split('\n').filter((l) => /^-\s(\d{2})-(\d{2})/.test(l.trim()))
  if (!lines.length) { console.log('还没写过。'); process.exit(0) }
  const last = lines[lines.length - 1].match(/^-\s(\d{2})-(\d{2})/)
  const now = new Date()
  const lastDate = new Date(now.getFullYear(), Number(last[1]) - 1, Number(last[2]))
  const days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - lastDate) / 86400000)
  if (days === 0) console.log('今天写过。')
  else if (days <= 3) console.log(`距上次 ${days} 天。还来得及，想得起来就写。`)
  else console.log(`距上次 ${days} 天。那几天已经烂了，别补——从今天开始记。`)
  process.exit(0)
}

console.error(`未知命令：${cmd}`)
process.exit(2)
