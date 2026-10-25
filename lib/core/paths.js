import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export function dataRoot(value) {
  return path.resolve(value || process.env.DSH_COMPANION_HOME || path.join(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), 'companion'));
}
export function paths(root = dataRoot()) {
  root = path.resolve(root);
  return {
    root, config: path.join(root, 'config.json'), secrets: path.join(root, 'secrets.json'),
    work: path.join(root, 'workspace'), persona: path.join(root, 'workspace', 'AGENTS.md'),
    mirror: path.join(root, 'persona.md'), mc: path.join(root, 'runtime', 'mc'),
    events: path.join(root, 'runtime', 'world-events.jsonl'), state: path.join(root, 'runtime', 'state.json'),
    world: path.join(root, 'runtime', 'world-state.json'), schedules: path.join(root, 'schedules'),
    media: path.join(root, 'workspace', 'media'), bili: path.join(root, 'bili'), xhh: path.join(root, 'xhh'),
    tools: path.join(PACKAGE_ROOT, 'tools'), templates: path.join(PACKAGE_ROOT, 'data'),
  };
}
export function inside(root, relative) {
  const p = path.resolve(root, relative); const rel = path.relative(path.resolve(root), p);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) throw new Error('Path escapes the data directory');
  return p;
}
export function nodeCandidates(explicit = '') {
  const base = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  const runtimes = path.join(base, 'dsh-runtimes');
  const bundled = [];
  // DSH provisions Node under dsh-runtimes/<runtime>/dependencies/node/bin.
  // The runtime directory name is not fixed, so look at every runtime instead of
  // guessing "dsh-primary-runtime" — a clean install may name it differently or
  // not have it at all.
  try {
    for (const entry of fs.readdirSync(runtimes, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const binary = path.join(runtimes, entry.name, 'dependencies', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
      if (fs.existsSync(binary)) bundled.push({ file: binary });
    }
  } catch {}
  return [
    ...(explicit ? [{ file: explicit }] : []),
    ...(process.env.DSH_NODE ? [{ file: process.env.DSH_NODE }] : []),
    ...bundled,
    // Electron already ships Node. On a clean install with no standalone Node and
    // no PATH entry this is the only candidate that exists — and it needs no setup
    // from the user. ELECTRON_RUN_AS_NODE makes the host binary behave like node.
    ...(process.versions.electron ? [{ file: process.execPath, env: { ELECTRON_RUN_AS_NODE: '1' }, electron: true }] : []),
    ...(!process.versions.electron ? [{ file: process.execPath }] : []),
    { file: 'node' },
  ];
}
export function legacyPaths(root = path.join(os.homedir(), '.dsh')) {
  return { root: path.resolve(root), work: path.join(root, 'whale-work'), mc: path.join(root, 'mc'), biliCredentials: path.join(path.dirname(root), '.bili-ai', 'credentials.json') };
}
