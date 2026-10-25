import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { nodeCandidates, paths } from './paths.js';
export const exec = promisify(execFile);

export class NodeRuntimeError extends Error {
  constructor(tried) {
    super([
      'Node 22+ not found / 找不到可用的 Node（需要 22 及以上）',
      'Tried / 试过：',
      ...tried.map(line => `  ${line}`),
      'Fix / 解法（任选一个）：',
      '  1. Settings → Companion → Advanced → Node path: point it at node.exe',
      '     面板「高级设置 → Node 路径」填一个真实的 node.exe',
      '  2. Install Node 22+ from nodejs.org (keep "Add to PATH"), then restart DSH',
      '     或安装 Node 22+（勾上 Add to PATH）后重启 DSH',
    ].join('\n'));
    this.name = 'NodeRuntimeError';
    this.tried = tried;
  }
}

/**
 * A probe result is usable when it is Node 22+ and, if it is an Electron binary,
 * we are going to run it with ELECTRON_RUN_AS_NODE=1 (Electron keeps
 * process.versions.electron set even in that mode, so the flag itself is not a
 * rejection reason — launching the app instead of node would be).
 */
export function isUsableNode(probe, candidate = {}) {
  if (!probe || !probe.node) return false;
  if (probe.electron && candidate.env?.ELECTRON_RUN_AS_NODE !== '1') return false;
  return Number(String(probe.node).split('.')[0]) >= 22;
}

/**
 * Resolve a runnable Node 22+ and the environment it needs.
 * Returns { file, env? } — callers must spawn `file` with `env` merged, because the
 * Electron fallback only behaves like node when ELECTRON_RUN_AS_NODE=1 is set.
 */
export async function resolveNode(explicit) {
  const tried = [];
  for (const candidate of nodeCandidates(explicit)) {
    const file = candidate.file;
    try {
      const { stdout } = await exec(file, ['-p', 'JSON.stringify({node:process.versions.node,electron:!!process.versions.electron})'], { timeout: 4000, windowsHide: true, env: { ...process.env, ...candidate.env } });
      const v = JSON.parse(stdout.trim());
      if (isUsableNode(v, candidate)) return candidate;
      tried.push(`${file} (node ${v.node}${v.electron ? ', electron' : ''})`);
    } catch { tried.push(`${file} (not found / 未找到)`); }
  }
  throw new NodeRuntimeError(tried);
}

export async function runTool(root, script, args = [], { timeout = 30000, env = {}, nodePath = '', signal } = {}) {
  const node = await resolveNode(nodePath); const p = paths(root);
  const { stdout, stderr } = await exec(node.file, [script, ...args.map(String)], { cwd: p.root, timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true, signal, env: { ...process.env, ...node.env, DSH_COMPANION_HOME: p.root, ...env } });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}
