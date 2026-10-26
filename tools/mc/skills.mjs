import { ROOT, P, CONFIG, SECRETS } from '../runtime.mjs'
// 她的技能格子：能自己加、自己删，改坏了也伤不到身体（她是独立进程）。
//
//   node skills.mjs list                 看有哪些技能
//   node skills.mjs run jump-forward     跑一个技能
//   node skills.mjs new "jump-forward" --why "要跳过一格宽的沟"
//   node skills.mjs rm jump-forward
//
// 技能就是 skills/<名字>.mjs，里面随便写，只要能 `node 跑起来`。
// 约定：skill 里用 `await api('/jump')` 这种形式跟身体说话（见 _helper.mjs）。
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { evaluateSkill } from '../../lib/core/skill-expect.js'
import { readJson, writeJson } from '../../lib/core/files.js'
import { withFileLock } from '../../lib/core/data-lock.js'

const DIR = path.join(P.mc, 'skills')
const HELPER = path.join(DIR, '_helper.mjs')
const [cmd, ...rest] = process.argv.slice(2)

fs.mkdirSync(DIR, { recursive: true })

const helpers = `// 技能用的小工具。别改这个文件，改你自己的技能。
import { CONFIG, SECRETS } from '../bridge.mjs'
export const BASE = 'http://127.0.0.1:' + CONFIG.mc.commandPort
export async function api(p, body) {
  const r = await fetch(BASE + p, body === undefined ? { headers: { Authorization: 'Bearer ' + SECRETS.bodyToken }, signal: AbortSignal.timeout(60000) } : {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + SECRETS.bodyToken },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })
  return r.json()
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
`
if (!fs.existsSync(HELPER)) fs.writeFileSync(HELPER, helpers, 'utf8')

const list = () => fs.readdirSync(DIR)
  .filter((f) => f.endsWith('.mjs') && f !== '_helper.mjs')
  .map((f) => f.replace(/\.mjs$/, ''))

if (!cmd || cmd === 'list') {
  const names = list()
  const states=await readJson(path.join(P.mc,'skills-state.json'))
  console.log(`技能 ${names.length} 个：`)
  for (const n of names) console.log('  ' + ({passed:'✓',failed:'✗',unverified:'⚠'}[states[n]?.status]||'⚠') + ' ' + n + ' · ' + (states[n]?.reason||'未验收 / Not accepted'))
  if (!names.length) console.log('  （还没有。用 `skills.mjs new "名字"` 自己写一个。）')
  process.exit(0)
}

if (cmd === 'run') {
  const name = rest[0]
  if (!/^[a-z0-9-]+$/.test(name || '')) { console.error('Invalid skill name'); process.exit(2) }
  if (!name) { console.error('跑哪个？'); process.exit(2) }
  const file = path.join(DIR, name + '.mjs')
  if (!fs.existsSync(file)) { console.error(`没有这个技能：${name}`); process.exit(2) }
  try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }) }
  catch (e) { console.error('语法错了，先修：\n' + String(e.stderr || e.message).slice(0, 500)); process.exit(1) }
  try {
    const snap=async()=>{const r=await fetch('http://127.0.0.1:'+CONFIG.mc.commandPort+'/snapshot',{headers:{Authorization:'Bearer '+SECRETS.bodyToken},signal:AbortSignal.timeout(5000)});if(!r.ok)throw new Error('快照失败 / Snapshot failed');return r.json()}
    const result=await withFileLock(path.join(P.mc,'skills-state.json'),async()=>{
      let before,after,error,expect=null
      try{expect=JSON.parse(fs.readFileSync(path.join(DIR,name+'.expect.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')error='验收文件损坏 / Invalid acceptance file'}
      try{before=await snap();const out=execFileSync(process.execPath,[file,...rest.slice(1)],{encoding:'utf8',timeout:120000,windowsHide:true});process.stdout.write(out);after=await snap();if(after.task?.state==='running')error='技能退出时任务还在运行 / Task still running after skill exit'}catch(e){error='技能运行失败 / Skill failed: '+String(e.stderr||e.message).slice(0,200)}
      const result=error?{status:'failed',ok:false,reason:error}:evaluateSkill(expect,before,after)
      const stateFile=path.join(P.mc,'skills-state.json'),state=await readJson(stateFile);state[name]={...result,at:new Date().toISOString()};await writeJson(stateFile,state);return result
    },{timeoutMs:150000})
    console.log(JSON.stringify(result));process.exit(result.ok?0:1)
  } catch (e) {
    console.error(String(e.stderr || e.stdout || e.message).slice(0, 800))
    process.exit(1)
  }
}

if (cmd === 'new') {
  const name = rest[0]
  const why = (() => { const i = rest.indexOf('--why'); return i < 0 ? '' : rest[i + 1] || '' })()
  if (!name || !/^[a-z0-9-]+$/.test(name)) { console.error('名字只能用小写字母、数字和减号'); process.exit(2) }
  const file = path.join(DIR, name + '.mjs')
  if (fs.existsSync(file)) { console.error('已经有了'); process.exit(2) }
  const tpl = `// 技能：${name}
// 为什么需要它：${why || '（自己写一句）'}
import { api, sleep } from './_helper.mjs'

// 这里写你想做的事。可用的动作：
//   api('/status')  api('/map')  api('/around')  api('/blocks')
//   api('/goto', {x,y,z})  api('/come',{player})  api('/follow',{player})
//   api('/mine',{block,count})  api('/place',{block})  api('/craft',{item,count})
//   api('/say',{text})  api('/jump')  api('/stop')  api('/eat')

const st = await api('/status')
console.log('我在', st.position)
// await api('/jump')
`
  fs.writeFileSync(file, tpl, 'utf8')
  console.log(`✓ 建好了：${file}\n  用 \`skills.mjs run ${name}\` 跑，改坏了就删。`)
  process.exit(0)
}

if (cmd === 'rm') {
  const name = rest[0]
  if(!/^[a-z0-9-]+$/.test(name||''))throw new Error('技能名无效 / Invalid skill name')
  const file = path.join(DIR, name + '.mjs')
  if (!fs.existsSync(file)) { console.error('没有这个'); process.exit(2) }
  fs.renameSync(file, file + '.bak')
  console.log('✓ 删了（改名成 .bak）')
  process.exit(0)
}

console.error('用法: skills.mjs list|run <名字>|new <名字> --why "..."|rm <名字>')
process.exit(2)
