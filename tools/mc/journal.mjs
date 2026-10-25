import { ROOT, P, CONFIG, SECRETS } from '../runtime.mjs'
// 她在 Minecraft 里的"想干什么"。清单是她自己的，不是主人发的任务表。
//
//   node journal.mjs list
//   node journal.mjs want "想盖个能睡觉的地方" --why "天黑了站在外面很烦" --first "先攒 3 张羊毛"
//   node journal.mjs done "盖个能睡觉的地方"
//   node journal.mjs note "挖石头挖到脚下一空，掉进洞里了"
//
// 文件是 ~/.dsh/mc/goal.md。为什么要有它：没有"想要"的机器人只会等着被指挥；
// 想要一件事、拆成第一步、做完记一笔 —— 这才叫在过自己的日子。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const FILE = path.join(P.mc, 'goal.md')
const HEAD = `# 我在 Minecraft 里干什么

这不是任务表。这是**我自己想做的事**——主人不布置，我自己挑。

## 我自己想要的

`

const arg = (name) => {
  const i = process.argv.indexOf(name)
  if (i < 0) return ''
  return String(process.argv[i + 1] ?? '').trim()
}
const val = (arr, key) => {
  const i = arr.indexOf(key)
  return i < 0 ? '' : String(arr[i + 1] ?? '').trim()
}

const read = () => {
  try { return fs.readFileSync(FILE, 'utf8') } catch { return HEAD + '## 手上的清单\n\n## 每天记一笔\n\n' }
}

const ensure = (text) => {
  let t = text
  if (!t.includes('## 我自己想要的')) t += '\n## 我自己想要的\n\n'
  if (!t.includes('## 手上的清单')) t += '\n## 手上的清单\n\n'
  if (!t.includes('## 每天记一笔')) t += '\n## 每天记一笔\n\n'
  return t
}

const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 往某个二级标题的小节末尾插一行
const insertUnder = (text, heading, line) => {
  const start = text.indexOf(heading)
  if (start < 0) return text.replace(/\s*$/, '') + `\n${heading}\n${line}\n`
  const next = text.indexOf('\n## ', start + heading.length)
  const end = next < 0 ? text.length : next
  const head = text.slice(0, end).replace(/\s*$/, '')
  const tail = text.slice(end)
  return `${head}\n${line}\n${tail}`
}

const [cmd, ...rest] = process.argv.slice(2)
const text = ensure(read())

if (!cmd || cmd === 'list') {
  const open = text.split('\n').filter((l) => /^\s*- \[ \]/.test(l))
  const done = text.split('\n').filter((l) => /^\s*- \[x\]/i.test(l))
  console.log(`清单：${open.length} 件没做完，${done.length} 件做完了`)
  for (const l of open) console.log('  ' + l.trim())
  if (!open.length) console.log('  （空了。该用 `journal.mjs want "..." --why "..." --first "..."` 给自己定一件新的了。）')
  process.exit(0)
}

if (cmd === 'state') {
  const notes = text.split('\n').filter((l) => /^-\s\d{2}-\d{2}\s\d{2}:\d{2}\s｜/.test(l.trim()))
  const open = text.split('\n').filter((l) => /^\s*- \[ \]/.test(l))
  const last = notes.length ? notes[notes.length - 1].trim() : null
  let gap = null
  if (last) {
    const m = last.match(/(\d{2})-(\d{2})\s(\d{2}):(\d{2})/)
    if (m) {
      const now = new Date()
      const then = new Date(now.getFullYear(), Number(m[1]) - 1, Number(m[2]), Number(m[3]), Number(m[4]))
      gap = Math.round((now - then) / 60000)
    }
  }
  console.log(`没做完：${open.length} 件`)
  console.log(`记过的笔数：${notes.length}`)
  console.log(gap === null ? '还没记过任何一笔。' : `距上次记一笔：${gap} 分钟${gap > 360 ? '（隔太久了，这一班先补上）' : ''}`)
  if (last) console.log(`最后一条：${last}`)
  process.exit(0)
}
if (cmd === 'want') {
  const title = rest.filter((a) => !a.startsWith('--') && a !== val(rest, '--why') && a !== val(rest, '--first')).join(' ').trim()
  if (!title) { console.error('想要什么？写一句。'); process.exit(2) }
  const why = val(rest, '--why')
  const first = val(rest, '--first')
  if (!why) { console.error('给个理由（--why）：为什么想要这个。没理由的目标撑不过三天。'); process.exit(2) }
  let t = text
  t = insertUnder(t, '## 我自己想要的', `- ${stamp()} ｜ **${title}**\n  - 为什么：${why}${first ? `\n  - 第一步：${first}` : ''}`)
  t = insertUnder(t, '## 手上的清单', `- [ ] ${title}`)
  fs.writeFileSync(FILE, t, 'utf8')
  console.log(`✓ 记下了：${title}\n  为什么：${why}${first ? `\n  第一步：${first}` : ''}`)
  process.exit(0)
}

if (cmd === 'done') {
  const key = rest.join(' ').trim()
  if (!key) { console.error('做完哪件？给个关键词。'); process.exit(2) }
  const lines = text.split('\n')
  let hit = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*- \[ \]/.test(lines[i]) && lines[i].includes(key)) { hit = i; break }
  }
  if (hit < 0) { console.error(`清单里没有包含「${key}」的未完成项`); process.exit(2) }
  lines[hit] = lines[hit].replace('[ ]', '[x]')
  fs.writeFileSync(FILE, lines.join('\n'), 'utf8')
  console.log(`✓ 打勾：${lines[hit].trim()}`)
  process.exit(0)
}

if (cmd === 'note') {
  const line = rest.filter((a) => !a.startsWith('--')).join(' ').trim()
  if (!line) { console.error('记什么？'); process.exit(2) }
  const t = insertUnder(text, '## 每天记一笔', `- ${stamp()} ｜ ${line}`)
  fs.writeFileSync(FILE, t, 'utf8')
  console.log(`✓ 记了一笔`)
  process.exit(0)
}

console.error(`不认识的命令：${cmd}`)
process.exit(2)
