import { ROOT, P, CONFIG, SECRETS } from '../runtime.mjs'
import { worldAction } from '../../lib/core/world.js'
// 角色用这个跟 Minecraft 里的自己说话。
//
//   node mc.mjs status
//   node mc.mjs say "我来了"
//   node mc.mjs goto 120 64 88
//   node mc.mjs mine oak_log 3
//   node mc.mjs craft oak_planks 4
//   node mc.mjs eat
//   node mc.mjs blocks          # 附近有什么方块
//   node mc.mjs follow 主人
//   node mc.mjs come 主人
//   node mc.mjs stop
//   node mc.mjs map             # 字符地形图（她的眼睛）
//   node mc.mjs lan             # 听局域网房间（对方要先「对局域网开放」）
//   node mc.mjs join 127.0.0.1 51234
//   node mc.mjs jump            跳一下
//   node mc.mjs attack          打最近的敌对生物
//   node mc.mjs skills list     我自己加的技能
//   node mc.mjs around          # 周围长什么样（她没有屏幕，这是她的眼睛）
//   node mc.mjs chat            # 最近别人在说什么
//
// 背后是常驻的 mc-daemon.mjs（127.0.0.1:19772）。没连上就先跑 `node mc.mjs up`。
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://127.0.0.1:' + CONFIG.mc.commandPort
const [cmd, ...rest] = process.argv.slice(2)

const get = async (p) => {
  const r = await fetch(BASE + p, { headers: { Authorization: 'Bearer ' + SECRETS.bodyToken }, signal: AbortSignal.timeout(30_000) })
  return r.json()
}
const post = async (p, body) => {
  const r = await fetch(BASE + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + SECRETS.bodyToken },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(120_000),
  })
  return r.json()
}

const alive = async () => {
  try { await get('/status'); return true } catch { return false }
}

if (cmd === 'up' || cmd === 'down') { console.log(JSON.stringify(await worldAction(ROOT, CONFIG, cmd))); process.exit(0) }

if (!(await alive())) {
  console.error('她不在线（守护进程没跑）。先 `node mc.mjs up`')
  process.exit(1)
}

let out
if (cmd === 'snapshot') {
  const s=await get('/snapshot');console.log(rest.includes('--json')?JSON.stringify(s):JSON.stringify(s,null,2));process.exit(s.ok?0:1)
}
if (cmd === 'do') {
  if(rest[0]==='status'){console.log(JSON.stringify(await get('/do/status')));process.exit(0)}
  const [intent,...args]=rest
  const params=intent==='goto'?{x:Number(args[0]),y:Number(args[1]),z:Number(args[2])}:intent==='follow'?{player:args[0],seconds:Number(args[1]??30)}:intent==='mine'?{block:args[0],count:Number(args[1]??1)}:intent==='hunt'?{maxHits:Number(args[0]??40)}:{seconds:Number(args[0]??30)}
  const wi=rest.indexOf('--wait');const result=await post('/do',{intent,...params,...(wi>=0?{waitSec:Number(rest[wi+1])}:{})});console.log(JSON.stringify(result));process.exit(result.state==='failed'?1:0)
}
if(cmd==='go'){const r=await post('/go',{name:rest[0]});console.log(JSON.stringify(r));process.exit(r.state==='failed'?1:0)}
if(cmd==='places'){
  const [action='list',name,x,y,z]=rest
  const r=action==='list'?await get('/places'):await post('/places',{action,name,...(action==='add'?{x:Number(x),y:Number(y),z:Number(z)}:{})})
  console.log(JSON.stringify(r,null,2));process.exit(r.ok?0:1)
}
if (!cmd || cmd === 'status') {
  const s = await get('/status')
  if (!s.ok) { console.log('不在线：' + (s.error || '未知')); process.exit(1) }
  console.log(`名字：${s.username}　位置：${s.position?.join(', ')}　维度：${s.dimension}`)
  console.log(`血：${s.health}　饿：${s.food}　${s.isDay ? '白天' : '夜里'}`)
  console.log(`在线的人：${s.players?.length ? s.players.join('、') : '只有我'}`)
  const inv = Object.entries(s.inventory || {})
  console.log(`背包：${inv.length ? inv.map(([k, v]) => `${k}×${v}`).join('  ') : '空的'}`)
  process.exit(0)
}

if (cmd === 'map') {
  const m = await get('/map')
  console.log(m.text || m.error)
  process.exit(m.ok ? 0 : 1)
}

if (cmd === 'lan') {
  const secs = Number(rest[0] || 4)
  console.log('听 ' + secs + ' 秒局域网公告…')
  const r = await get('/lan?secs=' + secs)
  if (r.found) {
    console.log('听见了：' + r.host + ':' + r.port + (r.motd ? '  「' + r.motd + '」' : ''))
    console.log('进服：node mc.mjs join ' + r.host + ' ' + r.port)
  } else {
    console.log(r.message || r.error || '没听见')
  }
  process.exit(r.found ? 0 : 1)
}

if (cmd === 'join') {
  const host = rest[0] || '127.0.0.1'
  const port = Number(rest[1] || 25565)
  const r = await post('/connect', { host, port })
  console.log(JSON.stringify(r))
  process.exit(r.ok ? 0 : 1)
}

else if (cmd === 'skills') {
  const { execFileSync: ex } = await import('node:child_process')
  const pth = await import('node:path')
  const r = ex(process.execPath, [pth.join(P.tools, 'mc', 'skills.mjs'), ...rest], { encoding: 'utf8' })
  process.stdout.write(r)
  process.exit(0)
}

if (cmd === 'around') {
  const a = await get('/around')
  console.log(a.text || a.error)
  process.exit(a.ok ? 0 : 1)
}

if (cmd === 'say') out = await post('/say', { text: rest.join(' ') })
else if (cmd === 'jump') out = await post('/jump')
else if (cmd === 'hunt') out = await post('/hunt', { waitSec: Number(rest[0] ?? 0), reach: Number(rest[1] ?? 24) })
else if (cmd === 'attack') out = await post('/attack')
else if (cmd === 'goto') out = await post('/goto', { x: Number(rest[0]), y: Number(rest[1]), z: Number(rest[2]) })
else if (cmd === 'mine') out = await post('/mine', { block: rest[0], count: Number(rest[1] ?? 1) })
else if (cmd === 'craft') out = await post('/craft', { item: rest[0], count: Number(rest[1] ?? 1) })
else if (cmd === 'eat') out = await post('/eat')
else if (cmd === 'blocks') {
  const r = await get('/blocks')
  console.log((r.blocks || []).map(([n, c]) => `${n}×${c}`).join('  '))
  process.exit(0)
}
else if (cmd === 'place') out = await post('/place', { block: rest[0] })
else if (cmd === 'placeat') out = await post('/placeat', { block: rest[0], x: Number(rest[1]), y: Number(rest[2]), z: Number(rest[3]) })
else if (cmd === 'digat') out = await post('/digat', { x: Number(rest[0]), y: Number(rest[1]), z: Number(rest[2]) })
else if (cmd === 'use') out = await post('/use', { x: Number(rest[0]), y: Number(rest[1]), z: Number(rest[2]) })
else if (cmd === 'walk') out = await post('/walk', { ms: Number(rest[0] ?? 600), dir: rest[1] })
else if (cmd === 'toss') out = await post('/toss', { item: rest[0], count: Number(rest[1] ?? 1) })
else if (cmd === 'hold') out = await post('/hold', { item: rest[0] })
else if (cmd === 'follow') out = await post('/follow', { player: rest[0] })
else if (cmd === 'come') out = await post('/come', { player: rest[0] })
else if (cmd === 'stop') out = await post('/stop')
else if (cmd === 'look') out = await post('/look', rest[0] ? { player: rest[0] } : { x: Number(rest[0]), y: Number(rest[1]), z: Number(rest[2]) })
else if (cmd === 'chat') {
  const c = await get('/chat?n=20')
  for (const m of c.chats ?? []) console.log(`${m.username}: ${m.message}`)
  process.exit(0)
} else {
  console.error(`不认识的命令：${cmd}`)
  process.exit(2)
}

console.log(JSON.stringify(out))
process.exit(out.ok ? 0 : 1)
