import { P } from '../runtime.mjs'
// 睡前一句：一天固定一次，她主动找主人。
//
//   node nightline.mjs status   # 今天发了吗？手札里有能用的句子吗？
//   node nightline.mjs mark     # 发完记一笔（防止一晚上说两次）
//   node nightline.mjs show     # 最近 7 条
//
// 为什么单做一条通道：别的主动消息受「一天三条」管，这条是固定的、每天一次的，
// 所以它不算额度，但也不能拿它当日常汇报——一天只有这一条。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const HOME = P.work
const LOG = path.join(HOME, '睡前一句.jsonl')
const SHOUKA = path.join(HOME, '手札.md')

const today = () => new Date().toLocaleDateString('sv-SE')
const readJsonl = (p) => {
  try { return fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) } catch { return [] }
}
const pad = (n) => String(n).padStart(2, '0')

function shoukaToday() {
  let text = ''
  try { text = fs.readFileSync(SHOUKA, 'utf8') } catch { return null }
  const d = new Date()
  const stamp = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const lines = text.split('\n').filter((l) => l.trim().startsWith(`- ${stamp}`))
  return lines.length ? lines[lines.length - 1].trim() : null
}

const [cmd] = process.argv.slice(2)

if (!cmd || cmd === 'status') {
  const log = readJsonl(LOG)
  const todayStr = today()
  const sent = log.find((e) => e.date === todayStr && e.kind !== 'skipped')
  const skipped = log.find((e) => e.date === todayStr && e.kind === 'skipped')
  const last = log.length ? log[log.length - 1] : null
  console.log(`今天：${todayStr}`)
  console.log(`状态：${sent ? '已经说过了' : skipped ? '今天决定不说' : '还没说'}`)
  const line = shoukaToday()
  console.log(`今天的手札：${line ? line : '（没写）'}`)
  if (last) console.log(`上次：${last.date} ${last.kind === 'skipped' ? '（跳过）' : '「' + String(last.text || '').slice(0, 40) + '」'}`)
  process.exit(0)
}

if (cmd === 'mark') {
  const text = process.argv.slice(3).filter((a) => !a.startsWith('--')).join(' ').trim()
  const kind = process.argv.includes('--skip') ? 'skipped' : 'sent'
  const log = readJsonl(LOG)
  log.push({ date: today(), at: new Date().toISOString(), kind, text })
  fs.writeFileSync(LOG, log.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8')
  console.log(`✓ 记下了（${kind}）`)
  process.exit(0)
}

if (cmd === 'show') {
  const log = readJsonl(LOG).slice(-7)
  if (!log.length) { console.log('（还没有记录）'); process.exit(0) }
  for (const e of log) console.log(`${e.date}  ${e.kind === 'skipped' ? '（跳过）' : '「' + String(e.text || '').slice(0, 60) + '」'}`)
  process.exit(0)
}

console.error(`未知命令：${cmd}`)
process.exit(2)
