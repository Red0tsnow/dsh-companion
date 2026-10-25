// 角色在 Minecraft 里的身体。
//
//   node mc-daemon.mjs          后台常驻，连上服务器，开一个本地命令口 19772
//   node mc.mjs status          看看她在哪、血多少、背包有什么
//
// 设计取舍：机器人要一直连着才有"在场感"，所以做成常驻进程 + 一个 HTTP 口，
// 而不是每次命令都重新连（重连一次要几秒，而且会把她传回出生点）。
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

import { require, ROOT, P, CONFIG, SECRETS, discoverLan } from './bridge.mjs'
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { plugin: collectBlock } = require('mineflayer-collectblock')

const HOME = ROOT
const DIR = P.mc
const PORT = Number(process.env.MC_CMD_PORT || CONFIG.mc.commandPort)  // 试用新身体时换个端口，别跟正式的抢
const HOST = '127.0.0.1'
const MC_HOST = process.env.MC_HOST || CONFIG.mc.host
const MC_PORT = Number(process.env.MC_PORT || CONFIG.mc.port)
const MC_USER = process.env.MC_USER || CONFIG.mc.username
// 版本不写死：mineflayer 连上之前会先 ping 一次，自己认对方版本。
// 写死 1.21.4 的后果是连不上主人的 1.21.8 存档（协议对不上，报 version mismatch）。
const MC_VERSION = process.env.MC_VERSION || CONFIG.mc.version || false
const LOG = path.join(DIR, 'bot.log')

fs.mkdirSync(DIR, { recursive: true })
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`
  fs.appendFileSync(LOG, line + '\n')
  console.log(line)
}

// Environment events are local plugin events, never forged QQ messages.
let lastInjectAt = 0
function injectWorld(text) {
  if (process.env.COMPANION_TRIAL === '1') return
  const now = Date.now()
  if (now - lastInjectAt < 8000) return
  lastInjectAt = now
  fs.mkdirSync(path.dirname(P.events), { recursive: true })
  fs.appendFileSync(P.events, JSON.stringify({ id: 'world-' + now, channel: 'mc', kind: 'world', text, at: now }) + '\n', 'utf8')
}
// 只读：进主人的存档时打开，禁掉一切会改变世界或拿走东西的动作
const READONLY = process.env.MC_READONLY === '1'
const state = {
  bot: null,
  online: false,
  chats: [],
  home: null,
  lastError: null,
  joinedAt: null,
}

function makeBot(host = MC_HOST, port = MC_PORT) {
  const bot = mineflayer.createBot({
    host,
    port,
    username: MC_USER,
    version: MC_VERSION,
    auth: CONFIG.mc.auth,
    hideErrors: false,
  })
  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  // 饿了自己吃（2026-10-25 开难度前加的）：饿到 16 以下、背包里有吃的就吃。
  // 这不叫"闲时动作"——饿死是实打实的死法，和挨打一个级别。
  bot.autoEatBusy = false
  const autoEat = async () => {
    if (bot.autoEatBusy || !state.online) return
    if (bot.food >= 16) return
    const mcData2 = require('minecraft-data')(bot.version)
    const food = bot.inventory.items().find((i) => {
      const it = mcData2.itemsByName[i.name]
      return it && it.foodPoints > 0
    })
    if (!food) return
    bot.autoEatBusy = true
    try {
      await bot.equip(food, 'hand')
      await bot.consume()
      log(`饿了，吃了一个 ${food.name}`)
    } catch (e) {
      log('吃东西失败：' + String(e.message).slice(0, 80))
    } finally {
      bot.autoEatBusy = false
    }
  }
  setInterval(() => { autoEat().catch(() => {}) }, 6000)

  state.bot = bot

  bot.once('spawn', () => {
    state.online = true
    state.joinedAt = new Date().toISOString()
    state.lastError = null
    log(`上线了 @ ${bot.entity.position.toString()}`)
    const mcData = require('minecraft-data')(bot.version)
    const moves = new Movements(bot, mcData)
    moves.canDig = false
    moves.allow1by1towers = false
    // 2026-10-25：门是关的，我就进不了自己家。允许走路时推门。
    moves.canOpenDoors = true
    bot.pathfinder.setMovements(moves)
  })

  bot.on('playerJoined', (player) => {
    if (!player.username || player.username === bot.username) return
    injectWorld(`【世界】${player.username} 进了世界，就站在你附近。想打招呼就用 mc.mjs say 在游戏里说一句，别发 QQ。`)
  })

  bot.on('playerLeft', (player) => {
    if (!player.username || player.username === bot.username) return
    injectWorld(`【世界】${player.username} 离开了世界。`)
  })
  bot.on('chat', (username, message) => {
    if (username === bot.username) return
    state.chats.push({ at: Date.now(), username, message })
    if (state.chats.length > 100) state.chats.shift()
    log(`<${username}> ${message}`)
    injectWorld(`【世界】${username} 在游戏里对你说：${message}\n（这是游戏内的对话，用 mc.mjs say "..." 在游戏里回她，不要发 QQ。）`)
  })

  bot.on('end', (reason) => {
    state.online = false
    state.target = { host, port }
    log(`掉线：${reason}，5 秒后重连（${host}:${port}）`)
    // 重连回**上次连的那个服**，不是默认那个：她可能刚被 join 到局域网房间里
    setTimeout(() => { if (!state.online) makeBot(host, port) }, 5000)
  })

  bot.on('error', (e) => {
    state.lastError = String(e.message || e)
    log(`错误：${state.lastError}`)
  })

  bot.on('kicked', (r) => log(`被踢：${typeof r === 'string' ? r : JSON.stringify(r)}`))

  // 2026-10-25：光顾着砌墙，被打到 3 点血都没知觉，最后死了一次。
  // 血往下掉的时候要有人喊我一声，不然我永远在忙手上的事。
  let lowHealthWarned = false
  bot.on('health', () => {
    const hp = Math.round(bot.health ?? 20)
    if (hp <= 6 && !lowHealthWarned) {
      lowHealthWarned = true
      const where = bot.entity?.position ? `（${bot.entity.position.floored()}）` : ''
      injectWorld(`【世界】你只剩 ${hp} 点血，正被人打着${where}。先跑，或者先打，别再砌墙了。`)
    }
    if (hp >= 14) lowHealthWarned = false
  })
}

const pos = (v) => v ? [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10, Math.round(v.z * 10) / 10] : null

function status() {
  const b = state.bot
  if (!b || !state.online) return { ok: false, online: false, error: state.lastError || '没连上' }
  const inv = {}
  for (const item of b.inventory.items()) inv[item.name] = (inv[item.name] || 0) + item.count
  return {
    ok: true,
    online: true,
    username: b.username,
    position: pos(b.entity.position),
    dimension: b.game?.dimension ?? null,
    health: Math.round(b.health),
    food: Math.round(b.food ?? 20),
    timeOfDay: b.time?.timeOfDay ?? null,
    isDay: b.time?.isDay ?? null,
    players: Object.keys(b.players).filter((n) => n !== b.username),
    inventory: inv,
    heldItem: b.heldItem?.name ?? null,
    joinedAt: state.joinedAt,
  }
}

const json = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(obj))
}

async function readBody(req) {
  let body = ''
  for await (const c of req) { body += c; if (body.length > 65536) throw new Error('Request too large') }
  try { return JSON.parse(body || '{}') } catch { return {} }
}

const handleRequest = async (req, res) => {
  if (req.headers.authorization !== 'Bearer ' + SECRETS.bodyToken || req.headers.origin) { json(res, 403, { ok: false, error: 'Unauthorized' }); return }
  const url = new URL(req.url, `http://${HOST}:${PORT}`)
  const b = state.bot
  if (req.method === 'POST' && url.pathname === '/shutdown') { json(res, 200, { ok: true }); try { b?.quit() } catch {} setTimeout(() => process.exit(0), 300); return }

  if (req.method === 'GET' && url.pathname === '/status') { json(res, 200, { ...status(), companionRoot: ROOT.replaceAll('\\', '/').toLowerCase(), pid: process.pid }); return }

  if (req.method === 'GET' && url.pathname === '/chat') {
    const n = Number(url.searchParams.get('n') || 20)
    json(res, 200, { ok: true, chats: state.chats.slice(-n) })
    return
  }

  // —— 她在世界里"看"的方式：字符地图 ——
  // 不是图像，是俯视的字符网格。对她来说这比一段描述准得多：
  // 哪里有墙、哪里是水、哪里是两格高的坎，一眼就看得出来方向。
  // —— 找局域网房间 ——
  // 原版「对局域网开放」会在 224.0.2.60:4445 上广播自己的端口（1.5 秒一次）。
  // 只听这一个公告，不扫端口：所以几秒内一定返回，不会卡住。
  if (req.method === 'GET' && url.pathname === '/lan') {
    const secs = Math.min(15, Math.max(1, Number(url.searchParams.get('secs') || 4)))
    json(res, 200, await discoverLan({ timeoutMs: secs * 1000 }))
    return
  }

  const data = req.method === 'POST' ? await readBody(req) : {}
  if (req.method === 'POST' && url.pathname === '/connect') {
    const host = String(data.host || '127.0.0.1')
    const port = Number(data.port || CONFIG.mc.port)
    try { b?.quit() } catch {}
    state.online = false
    setTimeout(() => makeBot(host, port), 1200)
    json(res, 200, { ok: true, connecting: host + ':' + port })
    return
  }

  if (req.method === 'GET' && url.pathname === '/map') {
    const bot = state.bot
    if (!bot || !state.online) { json(res, 503, { ok: false, error: '不在线' }); return }
    const size = Math.min(31, Math.max(9, Number(url.searchParams.get('size') || 21)))
    const half = Math.floor(size / 2)
    const p0 = bot.entity.position.floored()
    const mcData = require('minecraft-data')(bot.version)

    const SYM = {
      air: ' ', cave_air: ' ', grass_block: '"', dirt: '.', coarse_dirt: '.', farmland: '=',
      stone: '#', cobblestone: '#', deepslate: '#', gravel: '%', sand: ':',
      oak_log: 'T', dark_oak_log: 'T', birch_log: 'T', spruce_log: 'T', jungle_log: 'T',
      oak_leaves: '*', dark_oak_leaves: '*', birch_leaves: '*', spruce_leaves: '*', leaves: '*',
      water: '~', flowing_water: '~', lava: '!', flowing_lava: '!',
      crafting_table: 'C', furnace: 'F', chest: 'B', torch: 'i', wall_torch: 'i',
      snow: 's', ice: 'x', sandstone: ':', clay: 'c', moss_block: 'm',
    }
    const sym = (name) => SYM[name] ?? (name.includes('log') ? 'T' : name.includes('leaves') ? '*' : '?')

    // 她面朝哪
    const yawDeg = ((bot.entity.yaw * 180 / Math.PI) % 360 + 360) % 360
    const dirs = [['南', 0], ['西', 90], ['北', 180], ['东', 270]]
    const facing = dirs.reduce((best, d) => {
      const diff = Math.min(Math.abs(d[1] - yawDeg), 360 - Math.abs(d[1] - yawDeg))
      return diff < best.diff ? { name: d[0], diff } : best
    }, { name: '南', diff: 999 }).name

    const players = Object.values(bot.players)
      .filter((pl) => pl.username !== bot.username && pl.entity)
      .map((pl) => ({ name: pl.username, pos: pl.entity.position }))

    // 平面：北在上
    const rows = []
    for (let dz = -half; dz <= half; dz++) {
      let row = ''
      for (let dx = -half; dx <= half; dx++) {
        if (dx === 0 && dz === 0) { row += '▲'; continue }
        const who = players.find((pl) => Math.abs(pl.pos.x - (p0.x + dx)) < 1 && Math.abs(pl.pos.z - (p0.z + dz)) < 1
          && Math.abs(pl.pos.y - p0.y) < 3)
        if (who) { row += '@'; continue }
        const b = bot.blockAt(p0.offset(dx, 0, dz))
        row += b ? sym(b.name) : '?'
      }
      rows.push(row)
    }

    // 高度：地面比她脚下高还是低
    const hrows = []
    for (let dz = -half; dz <= half; dz++) {
      let row = ''
      for (let dx = -half; dx <= half; dx++) {
        if (dx === 0 && dz === 0) { row += '▲'; continue }
        let h = null
        for (let dy = 3; dy >= -8; dy--) {
          const b = bot.blockAt(p0.offset(dx, dy, dz))
          if (b && b.boundingBox === 'block') { h = dy; break }
        }
        if (h === null) row += ' '
        else if (h === 0) row += '='
        else if (h > 0) row += h >= 3 ? 'A' : String(h)
        else row += h <= -3 ? 'v' : '-'
      }
      hrows.push(row)
    }

    const legend = '空格=空 · "=草 · .=土 · #=石 · T=树干 · *=树叶 · ~=水 · !=岩浆 · C=工作台 · @=人 · ▲=我'
    const text = [
      `我在 ${p0.x}, ${p0.y}, ${p0.z}，面朝${facing}，${bot.time?.isDay ? '白天' : '夜里'}。`,
      '',
      `【俯视 ${size}×${size}，北在上】脚下这一层：`,
      ...rows.map((r) => '  ' + r),
      '',
      `【高度】比我们脚下高(+)低(-)：`,
      ...hrows.map((r) => '  ' + r),
      '',
      `${legend}`,
      players.length ? `附近的人：${players.map((pl) => `${pl.name}(${Math.round(pl.pos.distanceTo(p0))}格)`).join('、')}` : '附近没有别人。',
    ].join('\n')

    json(res, 200, { ok: true, text, facing, size })
    return
  }
  if (req.method === 'GET' && url.pathname === '/blocks') {
    const mcData2 = require('minecraft-data')(b.version)
    const counts = {}
    const p0 = b.entity.position.floored()
    for (let dx = -6; dx <= 6; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dz = -6; dz <= 6; dz++) {
          const blk = b.blockAt(p0.offset(dx, dy, dz))
          if (!blk || ['air', 'cave_air', 'water'].includes(blk.name)) continue
          counts[blk.name] = (counts[blk.name] || 0) + 1
        }
      }
    }
    json(res, 200, { ok: true, blocks: Object.entries(counts).sort((a, b2) => b2[1] - a[1]).slice(0, 12) })
    return
  }
  // 她没有屏幕，但有"身体感"：把周围看成一段话。别给她坐标清单，给她"这是什么地方"。
  if (req.method === 'GET' && url.pathname === '/around') {
    const bot = state.bot
    if (!bot || !state.online) { json(res, 503, { ok: false, error: '不在线' }); return }
    const p0 = bot.entity.position.floored()
    const yaw = ((bot.entity.yaw * 180 / Math.PI) % 360 + 360) % 360
    const dirs = [
      { name: '南', yaw: 0 }, { name: '西', yaw: 90 },
      { name: '北', yaw: 180 }, { name: '东', yaw: 270 },
    ]
    const facing = dirs.reduce((best, d) => {
      const diff = Math.min(Math.abs(d.yaw - yaw), 360 - Math.abs(d.yaw - yaw))
      return diff < best.diff ? { name: d.name, diff } : best
    }, { name: '南', diff: 999 }).name

    const name2 = (pos) => { const b = bot.blockAt(pos); return b ? b.name : 'air' }
    const nice = (n) => n === 'air' ? '空' : n === 'cave_air' ? '洞里的空' : n.replace(/_/g, ' ')

    const under = name2(p0.offset(0, -1, 0))
    const at = name2(p0)
    const head = name2(p0.offset(0, 1, 0))

    const arms = []
    for (const [dx, dz, label] of [[0, -1, '前'], [0, 1, '后'], [-1, 0, '左'], [1, 0, '右']]) {
      let hit = null
      for (let d = 1; d <= 6; d++) {
        const b = bot.blockAt(p0.offset(dx * d, 0, dz * d))
        if (b && b.name !== 'air' && b.name !== 'cave_air' && b.boundingBox === 'block') { hit = { d, name: b.name }; break }
      }
      arms.push(hit ? `${label}边 ${hit.d} 格是${nice(hit.name)}` : `${label}边 6 格内空的`)
    }

    const solidCount = (dy) => {
      let n = 0
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        const b = bot.blockAt(p0.offset(dx, dy, dz))
        if (b && b.boundingBox === 'block') n++
      }
      return n
    }

    // 附近值得注意的东西
    const mcData = require('minecraft-data')(bot.version)
    const interesting = []
    for (const n of ['oak_log', 'birch_log', 'spruce_log', 'water', 'lava', 'chest', 'crafting_table', 'furnace', 'coal_ore', 'iron_ore']) {
      const bt = mcData.blocksByName[n]
      if (!bt) continue
      const found = bot.findBlocks({ matching: bt.id, maxDistance: 10, count: 1 })
      if (found.length) interesting.push(`${n.replace(/_/g, ' ')} ${Math.round(found[0].distanceTo(p0))} 格`)
    }

    const ents = Object.values(bot.entities)
      .filter((e) => e !== bot.entity && e.position.distanceTo(p0) < 16 && e.name)
      .map((e) => `${e.name} ${Math.round(e.position.distanceTo(p0))} 格`)
    const drops = Object.values(bot.entities)
      .filter((e) => e.name === 'item' && e.position.distanceTo(p0) < 8)
      .length

    const sky = bot.time?.isDay ? '白天' : '夜里'
    const rain = bot.isRaining ? '，在下雨' : ''

    const lines = [
      `你在 ${p0.x}, ${p0.y}, ${p0.z}，面朝${facing}。现在是${sky}${rain}。`,
      `脚下是${nice(under)}，站着的地方是${nice(at)}，头顶是${nice(head)}。`,
      arms.join('；') + '。',
      `四周两格内实心方块：脚下那层 ${solidCount(-1)} 个，你这层 ${solidCount(0)} 个，头顶那层 ${solidCount(1)} 个。`,
      interesting.length ? `附近看得见：${interesting.join('，')}。` : '附近没什么特别的东西。',
      ents.length ? `附近有：${ents.slice(0, 5).join('，')}。` : '附近没有别的生物。',
      drops ? `脚边有 ${drops} 个掉地上没捡的东西。` : '',
      `背包：${Object.entries(status().inventory).map(([k, v]) => `${k}×${v}`).join(' ') || '空的'}。`,
    ].filter(Boolean)

    json(res, 200, { ok: true, text: lines.join('\n') })
    return
  }
  if (url.pathname === '/rejoin') {
    try { b?.quit() } catch {}
    state.online = false
    setTimeout(makeBot, 1500)
    json(res, 200, { ok: true, message: '重连中' })
    return
  }

  if (req.method !== 'POST') { json(res, 404, { ok: false, error: 'not found' }); return }
  if (!state.online) { json(res, 503, { ok: false, error: '不在线' }); return }


  if (READONLY && ['/mine', '/place', '/craft', '/eat', '/toss', '/attack', '/hunt', '/dig', '/activate', '/use', '/equip'].includes(url.pathname)) {
    json(res, 403, { ok: false, error: '只读模式：这一趟只能走、看、说话，不动世界里的东西' })
    return
  }

  if (url.pathname === '/say') {
    const text = String(data.text ?? '').slice(0, 240)
    if (!text) { json(res, 400, { ok: false, error: '说什么' }); return }
    b.chat(text)
    json(res, 200, { ok: true, said: text })
    return
  }

  if (url.pathname === '/goto') {
    const { x, y, z } = data
    if ([x, y, z].some((v) => typeof v !== 'number')) { json(res, 400, { ok: false, error: '要 x y z' }); return }
    b.pathfinder.setGoal(new goals.GoalBlock(Math.floor(x), Math.floor(y), Math.floor(z)))
    json(res, 200, { ok: true, goal: [x, y, z] })
    return
  }

  if (url.pathname === '/come') {
    const name = String(data.player ?? '')
    const target = b.players[name]?.entity
    if (!target) { json(res, 404, { ok: false, error: `看不到 ${name}` }); return }
    b.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
    json(res, 200, { ok: true, following: name })
    return
  }

  if (url.pathname === '/follow') {
    const name = String(data.player ?? '')
    const target = b.players[name]?.entity
    if (!target) { json(res, 404, { ok: false, error: `看不到 ${name}` }); return }
    b.pathfinder.setGoal(new goals.GoalFollow(target, Number(data.distance ?? 3)), true)
    json(res, 200, { ok: true, following: name })
    return
  }

  if (url.pathname === '/mine') {
    const blockName = String(data.block ?? '')
    const count = Math.max(1, Math.min(64, Number(data.count ?? 1)))
    const mcData = require('minecraft-data')(b.version)
    const bt = mcData.blocksByName[blockName]
    if (!bt) { json(res, 400, { ok: false, error: `没有这种方块：${blockName}` }); return }
    const found = b.findBlocks({ matching: bt.id, maxDistance: 32, count })
    if (!found.length) { json(res, 404, { ok: false, error: `周围 32 格没有 ${blockName}` }); return }
    let dug = 0
    const failed = []
    for (const p of found) {
      const target = b.blockAt(p)
      if (!target) continue
      try {
        // dig 只会把方块打掉，掉落物还躺在地上；collect 会顺手走过去捡起来
        await b.collectBlock.collect(target, { ignoreNoPath: true })
        dug++
      } catch (e) {
        failed.push(String(e.message || e).slice(0, 60))
      }
    }
    json(res, 200, { ok: true, block: blockName, dug, total: found.length, failed: failed.slice(0, 3) })
    return
  }

  if (url.pathname === '/place') {
    const blockName = String(data.block ?? '')
    const item = b.inventory.items().find((i) => i.name === blockName)
    if (!item) { json(res, 404, { ok: false, error: `背包里没有 ${blockName}` }); return }
    const Vec3 = require('vec3')
    const p0 = b.entity.position.floored()

    // 2026-10-24：原来直接往脚边 offset(1,0,0) 放，服务器回 invalid_player_movement 把她踢了。
    // 原因是那个位置可能不是空的 / 参考方块挑错。现在先找一个真正的空气格，参考它下面的方块，
    // 蹲下再放，放完站起来。
    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]
    let target = null
    for (const [dx, dz] of dirs) {
      const cand = p0.offset(dx, 0, dz)
      const here = b.blockAt(cand)
      const below = b.blockAt(cand.offset(0, -1, 0))
      if (here && below && here.name === 'air' && below.boundingBox === 'block') { target = cand; break }
    }
    if (!target) { json(res, 409, { ok: false, error: '四周没有能放东西的空地（脚下要实心）' }); return }

    try {
      await b.equip(item, 'hand')
      const ref = b.blockAt(target.offset(0, -1, 0))
      b.setControlState('sneak', true)
      await b.placeBlock(ref, new Vec3(0, 1, 0))
      b.setControlState('sneak', false)
      const placed = b.blockAt(target)
      json(res, 200, { ok: true, placed: placed ? placed.name : blockName, at: [target.x, target.y, target.z] })
    } catch (e) {
      b.setControlState('sneak', false)
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }
  if (url.pathname === '/use') {
    // 2026-10-25：门关着我就进不了自己的屋子。开门的动作一直没有，
    // 顺手把箱子、按钮、拉杆也一起解决了——都是"按一下"。
    const Vec3 = require('vec3')
    const x = Number(data.x), y = Number(data.y), z = Number(data.z)
    if (![x, y, z].every(Number.isFinite)) { json(res, 400, { ok: false, error: '要给 x y z' }); return }
    const target = new Vec3(Math.floor(x), Math.floor(y), Math.floor(z))
    const block = b.blockAt(target)
    if (!block) { json(res, 404, { ok: false, error: '那儿什么都看不见' }); return }
    const eye = b.entity.position.offset(0, b.entity.height ?? 1.6, 0)
    const d = block.position.offset(0.5, 0.5, 0.5).distanceTo(eye)
    if (d > 4.6) { json(res, 409, { ok: false, error: `够不着，差 ${d.toFixed(1)} 格` }); return }
    try {
      await b.activateBlock(block)
      await new Promise((r) => setTimeout(r, 250))
      json(res, 200, { ok: true, used: block.name, at: [target.x, target.y, target.z] })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/digat') {
    // 2026-10-25：想换地板，可 /mine 只会"找最近的某种方块"，
    // 挖不到指定的那一格。挖自己脚底下这块需要一个按坐标挖的手。
    const Vec3 = require('vec3')
    const x = Number(data.x), y = Number(data.y), z = Number(data.z)
    if (![x, y, z].every(Number.isFinite)) { json(res, 400, { ok: false, error: '要给 x y z' }); return }
    const target = new Vec3(Math.floor(x), Math.floor(y), Math.floor(z))
    const block = b.blockAt(target)
    if (!block || block.name === 'air' || block.name === 'cave_air') {
      json(res, 404, { ok: false, error: '那块本来就是空的' }); return
    }
    const eye = b.entity.position.offset(0, b.entity.height ?? 1.6, 0)
    const d = block.position.offset(0.5, 0.5, 0.5).distanceTo(eye)
    if (d > 4.6) { json(res, 409, { ok: false, error: `够不着，差 ${d.toFixed(1)} 格` }); return }
    try {
      await b.dig(block, true)
      await new Promise((r) => setTimeout(r, 200))
      const now = b.blockAt(target)
      json(res, 200, { ok: true, dug: block.name, now: now ? now.name : null, at: [target.x, target.y, target.z] })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/placeat') {
    // 2026-10-25：只会往脚边一格放，所以盖房永远只有一层。
    // 这个端点让人指定坐标：找一格贴着它的实心面，看着那里放。
    // 叠高就不用跳了——只要站在旁边，能看见下面那块的顶面就行。
    const blockName = String(data.block ?? '')
    const item = b.inventory.items().find((i) => i.name === blockName)
    if (!item) { json(res, 404, { ok: false, error: `背包里没有 ${blockName}` }); return }
    const Vec3 = require('vec3')
    const x = Number(data.x), y = Number(data.y), z = Number(data.z)
    if (![x, y, z].every(Number.isFinite)) { json(res, 400, { ok: false, error: '要给 x y z' }); return }
    const target = new Vec3(Math.floor(x), Math.floor(y), Math.floor(z))
    // 2026-10-25：雪地里那一格常常是薄薄一层雪 / 草，游戏里是能把方块直接放进去的。
    const REPLACEABLE = new Set(['air', 'cave_air', 'void_air', 'snow', 'short_grass', 'grass', 'tall_grass', 'fern', 'large_fern', 'dead_bush', 'snow_layer'])
    const here = b.blockAt(target)
    if (here && !REPLACEABLE.has(here.name)) {
      json(res, 409, { ok: false, error: `那儿已经有 ${here.name} 了` }); return
    }
    const eye = b.entity.position.offset(0, b.entity.height ?? 1.6, 0)
    const options = [
      { ref: new Vec3(0, -1, 0), face: new Vec3(0, 1, 0) },   // 踩在下面那块顶上
      { ref: new Vec3(0, 1, 0), face: new Vec3(0, -1, 0) },
      { ref: new Vec3(1, 0, 0), face: new Vec3(-1, 0, 0) },
      { ref: new Vec3(-1, 0, 0), face: new Vec3(1, 0, 0) },
      { ref: new Vec3(0, 0, 1), face: new Vec3(0, 0, -1) },
      { ref: new Vec3(0, 0, -1), face: new Vec3(0, 0, 1) },
    ]
    let chosen = null
    for (const o of options) {
      const refBlock = b.blockAt(target.plus(o.ref))
      if (!refBlock) continue
      if (!REPLACEABLE.has(refBlock.name) && refBlock.boundingBox === 'empty') continue
      if (REPLACEABLE.has(refBlock.name)) continue
      const d = refBlock.position.offset(0.5, 0.5, 0.5).distanceTo(eye)
      if (d > 4.6) continue
      chosen = { refBlock, face: o.face }
      break
    }
    if (!chosen) { json(res, 409, { ok: false, error: '那块附近没有能借力的实心面，或者够不着' }); return }
    try {
      await b.equip(item, 'hand')
      b.setControlState('sneak', true)
      await b.placeBlock(chosen.refBlock, chosen.face)
      // 等半拍，让它真的落地
      await new Promise((r) => setTimeout(r, 250))
      b.setControlState('sneak', false)
      const now = b.blockAt(target)
      json(res, 200, { ok: true, placed: now ? now.name : blockName, at: [target.x, target.y, target.z] })
    } catch (e) {
      b.setControlState('sneak', false)
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/craft') {
    const itemName = String(data.item ?? '')
    const count = Math.max(1, Math.min(64, Number(data.count ?? 1)))
    const mcData = require('minecraft-data')(b.version)
    const item = mcData.itemsByName[itemName]
    if (!item) { json(res, 400, { ok: false, error: `没有这种东西：${itemName}` }); return }
    let table = null
    let recipes = b.recipesFor(item.id, null, 1, null)
    if (!recipes.length) {
      const tableBlock = mcData.blocksByName['crafting_table']
      if (tableBlock) {
        const found = b.findBlocks({ matching: tableBlock.id, maxDistance: 8, count: 1 })
        if (found.length) { table = b.blockAt(found[0]); recipes = b.recipesFor(item.id, null, 1, table) }
      }
    }
    if (!recipes.length) { json(res, 404, { ok: false, error: `做不了 ${itemName}：材料不够，或者需要工作台` }); return }
    try {
      await b.craft(recipes[0], count, table, null)
      const have = b.inventory.items().filter((i) => i.name === itemName).reduce((n, i) => n + i.count, 0)
      json(res, 200, { ok: true, crafted: itemName, count, have })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/toss') {
    const itemName = String(data.item ?? '')
    const count = Math.max(1, Number(data.count ?? 1))
    const item = b.inventory.items().find((i) => i.name === itemName)
    if (!item) { json(res, 404, { ok: false, error: `背包里没有 ${itemName}` }); return }
    try {
      const n = Math.min(count, item.count)
      await b.toss(item.type, null, n)
      json(res, 200, { ok: true, tossed: itemName, count: n })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/eat') {
    const mcData = require('minecraft-data')(b.version)
    const food = b.inventory.items().find((i) => { const it = mcData.itemsByName[i.name]; return it && it.foodPoints > 0 })
    if (!food) { json(res, 404, { ok: false, error: '背包里没有能吃的' }); return }
    try { await b.equip(food, 'hand'); await b.consume(); json(res, 200, { ok: true, ate: food.name }) }
    catch (e) { json(res, 500, { ok: false, error: String(e.message).slice(0, 200) }) }
    return
  }
  if (url.pathname === '/walk') {
    // 2026-10-25：门能按开，可 pathfinder 不认门洞那条路，我进不了自己家。
    // 那就自己迈步：先前看哪儿，再按住往前走这么久。一步一格，笨但准。
    const ms = Math.max(80, Math.min(4000, Number(data.ms ?? 600)))
    const dir = String(data.dir ?? 'forward')
    const ok = ['forward', 'back', 'left', 'right'].includes(dir) ? dir : 'forward'
    try {
      b.setControlState(ok, true)
      await new Promise((r) => setTimeout(r, ms))
      b.setControlState(ok, false)
      await new Promise((r) => setTimeout(r, 150))
      const p = b.entity.position
      json(res, 200, { ok: true, at: [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10] })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 160) })
    }
    return
  }

  if (url.pathname === '/jump') {
    // 2026-10-24：她没有跳的能力。跳很朴素：按住 1 格的时间松开。
    try {
      b.setControlState('jump', true)
      await new Promise((r) => setTimeout(r, 220))
      b.setControlState('jump', false)
      await new Promise((r) => setTimeout(r, 220))
      json(res, 200, { ok: true, jumped: true, y: Math.round(b.entity.position.y * 10) / 10 })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 160) })
    }
    return
  }
  if (url.pathname === '/hunt') {
    // 2026-10-25：她打一架要来回十几次（找怪→走过去→打→再看），一轮就是几分钟。
    // 把这套循环放进身体里，一次调用干完，只回一个结果。省的是她的思考次数，不是代码。
    const mcData3 = require('minecraft-data')(b.version)
    const hostileOf = (e) => {
      if (!e || e === b.entity || !e.position) return false
      const info = mcData3.entitiesByName[e.name]
      return Boolean(info) && (info.type === 'hostile' || info.category === 'Hostile mobs')
    }
    const distTo = (e) => e.position.distanceTo(b.entity.position)
    const nearest = () => Object.values(b.entities).filter(hostileOf).sort((x, y) => distTo(x) - distTo(y))[0]
    const reach = Number(data.reach ?? 24)
    const maxHit = Math.max(1, Math.min(120, Number(data.hits ?? 40)))

    let target = nearest()
    if (!target || distTo(target) > reach) {
      // 没怪就原地等十几秒（站在暗处会刷），不消耗她的回合
      const waitMs = Math.min(30000, Math.max(0, Number(data.waitSec ?? 0) * 1000))
      if (waitMs > 0) {
        const until = Date.now() + waitMs
        while (Date.now() < until && !target) {
          await new Promise((r) => setTimeout(r, 1000))
          target = nearest()
          if (target && distTo(target) <= reach) break
        }
      }
    }
    if (!target) { json(res, 404, { ok: true, found: false, health: Math.round(b.health), message: '附近没有敌对生物' }); return }

    const name = target.name
    let hits = 0
    let fled = false
    try {
      for (let i = 0; i < maxHit; i++) {
        const mob = b.entities[target.id]
        if (!mob || !mob.isValid) break
        if (b.health <= 8) { fled = true; break }
        const d = distTo(mob)
        if (d > 3) {
          // 走近：给寻路 15 秒，别每 300ms 重设一次目标（那样永远走不到）
          b.pathfinder.setGoal(new goals.GoalNear(mob.position.x, mob.position.y, mob.position.z, 2))
          const until = Date.now() + 15000
          let arrived = false
          while (Date.now() < until) {
            await new Promise((r) => setTimeout(r, 400))
            const m2 = b.entities[target.id]
            if (!m2 || !m2.isValid) break
            if (distTo(m2) <= 3) { arrived = true; break }
          }
          b.pathfinder.setGoal(null)
          if (!arrived) continue
        }
        b.pathfinder.setGoal(null)
        try { await b.lookAt(mob.position.offset(0, (mob.height ?? 1.8) * 0.6, 0), true) } catch {}
        await b.attack(mob)
        hits++
        await new Promise((r) => setTimeout(r, 600))
      }
      const killed = !(b.entities[target.id] && b.entities[target.id].isValid)
      if (fled) {
        // 血少就真跑：往反方向走 8 格，不是站着不动
        const away = b.entity.position.offset(mobDirAway(target), 0, 0)
        try { b.pathfinder.setGoal(new goals.GoalNear(b.entity.position.x + 8, b.entity.position.y, b.entity.position.z + 8, 2)) } catch {}
      }
      json(res, 200, { ok: true, found: true, target: name, hits, killed, fled, health: Math.round(b.health), food: Math.round(b.food) })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message || e).slice(0, 200) })
    }
    return
  }
  if (url.pathname === '/attack') {
    // 2026-10-25：和平模式用不上，可一旦她开难度，我总得能还手。
    // 逻辑照 /mine 来：先找目标，再靠近，最后一下一下打。
    // 2026-10-25 深夜改了：被末影人打死过一次，木剑和一身家当全掉了。
    // 有些东西不该是我随手挑的目标，要么它一下就能把我打死，要么它会把地形炸掉。
    // 想打它们得她自己开口，我不自作主张。
    const NOT_MY_TARGET = new Set(['enderman', 'creeper', 'warden', 'wither', 'wither_skeleton', 'blaze', 'ghast'])
    const mcData = require('minecraft-data')(b.version)
    const hostile = (e) => {
      if (!e || e === b.entity || !e.position) return false
      if (NOT_MY_TARGET.has(e.name)) return false
      const info = mcData.entitiesByName[e.name]
      if (!info) return false
      return info.type === 'hostile' || info.category === 'Hostile mobs'
    }
    const dist = (e) => e.position.distanceTo(b.entity.position)
    const near = Object.values(b.entities)
      .filter(hostile)
      .filter((e) => dist(e) <= 16)
      .sort((a, c) => dist(a) - dist(c))
    if (!near.length) { json(res, 404, { ok: false, error: '附近 16 格没有敌对生物' }); return }

    const target = near[0]
    let hits = 0
    try {
      for (let i = 0; i < 40; i++) {
        const mob = b.entities[target.id]
        if (!mob || !mob.isValid) break
        const d = dist(mob)
        if (d > 3) {
          b.pathfinder.setGoal(new goals.GoalNear(mob.position.x, mob.position.y, mob.position.z, 2))
          await new Promise((r) => setTimeout(r, 350))
          continue
        }
        b.pathfinder.setGoal(null)
        try { await b.lookAt(mob.position.offset(0, (mob.height ?? 1.8) * 0.6, 0), true) } catch {}
        await b.attack(mob)
        hits++
        await new Promise((r) => setTimeout(r, 600))
        if (b.health <= 8) break
        if (dist(mob) > 4) break
      }
      json(res, 200, {
        ok: true,
        target: target.name,
        hits,
        killed: !b.entities[target.id],
        health: Math.round(b.health),
      })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message || e).slice(0, 200) })
    }
    return
  }

  if (url.pathname === '/hold') {
    // 2026-10-25：手上的东西不会自己换，看上去就像没做剑。让她能看见我拿了什么。
    const itemName = String(data.item ?? '')
    const item = b.inventory.items().find((i) => i.name === itemName)
    if (!item) { json(res, 404, { ok: false, error: `背包里没有 ${itemName}` }); return }
    try {
      await b.equip(item, 'hand')
      json(res, 200, { ok: true, holding: itemName })
    } catch (e) {
      json(res, 500, { ok: false, error: String(e.message).slice(0, 160) })
    }
    return
  }

  if (url.pathname === '/stop') {
    b.pathfinder.setGoal(null)
    b.clearControlStates()
    json(res, 200, { ok: true })
    return
  }

  if (url.pathname === '/look') {
    const name = String(data.player ?? '')
    const target = name ? b.players[name]?.entity : null
    if (target) { await b.lookAt(target.position.offset(0, 1.6, 0)); json(res, 200, { ok: true, looking: name }); return }
    if (data.x !== undefined) {
      await b.lookAt(new (require('vec3'))(data.x, data.y, data.z), true)
      json(res, 200, { ok: true })
      return
    }
    json(res, 400, { ok: false, error: '给 player 或者 x/y/z' })
    return
  }

  json(res, 404, { ok: false, error: 'not found' })
}
const server = http.createServer((req, res) => handleRequest(req, res).catch(() => { if (!res.headersSent) json(res, 500, { ok: false, error: 'Body action failed' }); else res.end(); }))

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log('Command port already occupied: ' + PORT); process.exit(1) }
  throw e
})

makeBot()
server.listen(PORT, HOST, () => {
  log(`命令口 http://${HOST}:${PORT}  ·  目标服务器 ${MC_HOST}:${MC_PORT}  ·  名字 ${MC_USER}`)
})
