import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { nodeCandidates, paths } from './paths.js';
export const exec = promisify(execFile);
export async function resolveNode(explicit) {
  for (const file of nodeCandidates(explicit)) {
    try { const { stdout } = await exec(file, ['-p', 'JSON.stringify({node:process.versions.node,electron:!!process.versions.electron})'], { timeout: 4000, windowsHide: true }); const v = JSON.parse(stdout.trim()); if (v.node && !v.electron && Number(v.node.split('.')[0]) >= 22) return file; } catch {}
  }
  throw new Error('Node 22+ not found. Set runtime.nodePath / 请配置真实 Node 路径');
}
export async function runTool(root, script, args = [], { timeout = 30000, env = {}, nodePath = '', signal } = {}) {
  const node = await resolveNode(nodePath); const p = paths(root);
  const { stdout, stderr } = await exec(node, [script, ...args.map(String)], { cwd: p.root, timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true, signal, env: { ...process.env, DSH_COMPANION_HOME: p.root, ...env } });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}
