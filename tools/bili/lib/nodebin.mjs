import { ROOT as COMPANION_ROOT, P as COMPANION_PATHS } from '../../runtime.mjs'
// 工具链侧的 node 运行时解析（2026-10-21）
//
// 为什么需要它：tools/ 里有 11 处用 `process.execPath` 去 spawn 子脚本 ✗
//   · 用户直接在终端跑 `node bili.mjs …` 时，process.execPath 是 node ✓ 没问题
//   · 但插件（Electron）里调、或者任何从 Electron 进程里派生的脚本，
//     process.execPath 是 **DeepSeek Harness.exe** ✗ → spawn 它不会执行脚本
//     → 退出码 0 + 空输出，或者直接 "Command failed"（就是用户看到的那个）
//
// 解析顺序（和 lib/index.js 的 resolveNodeRuntime 保持一致）：
//   $DSH_NODE → $DSH_HOME/dsh-runtimes/*/dependencies/node/bin/node(.exe)
//   → ~/.dsh/dsh-runtimes/... → $PATH 里的 node → 最后才退回 process.execPath
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const NODE_BIN = process.platform === 'win32' ? 'node.exe' : 'node'

function candidates() {
  const out = []
  if (process.env.DSH_NODE) out.push(process.env.DSH_NODE)
  const home = process.env.DSH_HOME || path.join(COMPANION_ROOT, 'compat')
  const roots = [path.join(home, 'dsh-runtimes'), path.join(COMPANION_ROOT, 'compat', 'dsh-runtimes')]
  for (const r of roots) {
    let dirs = []
    try { dirs = fs.readdirSync(r) } catch { continue }
    for (const d of dirs) out.push(path.join(r, d, 'dependencies', 'node', 'bin', NODE_BIN))
  }
  // PATH 里找
  for (const p of String(process.env.PATH ?? '').split(path.delimiter)) {
    if (p) out.push(path.join(p, NODE_BIN))
  }
  return out
}

function resolve() {
  for (const c of candidates()) {
    try { if (c && fs.existsSync(c)) return c } catch {}
  }
  return process.execPath   // 最后的兜底（在纯 node 环境里这就是 node ✓）
}

/** 可执行 node 的绝对路径（优先真实 node，避免 Electron 陷阱） */
export const NODE_EXE = resolve()

/** 这个路径是不是真的 node（不是 Electron 主程序） */
export function isRealNode(p = NODE_EXE) {
  return path.basename(String(p)).toLowerCase().startsWith('node')
}
