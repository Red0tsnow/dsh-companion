import { createRequire } from 'node:module';
import { resolveNode, exec } from './runner.js';
import { javaRuntime } from './world.js';
const require = createRequire(import.meta.url);
export async function dependencies(config) {
  const checks = [
    ['node', async () => resolveNode(config.runtime.nodePath)],
    ['java', async () => (await javaRuntime(config.mc.javaPath)).version],
    ['mineflayer', async () => require('mineflayer/package.json').version],
    ['python', async () => { const { stdout } = await exec(config.runtime.pythonPath || 'python', ['-c', 'import sys; print(sys.version.split()[0])'], { timeout: 5000, windowsHide: true }); return stdout.trim(); }],
    ['pillow', async () => { const { stdout } = await exec(config.runtime.pythonPath || 'python', ['-c', 'import PIL; print(PIL.__version__)'], { timeout: 5000, windowsHide: true }); return stdout.trim(); }],
  ];
  return Promise.all(checks.map(async ([id, fn]) => { try { return { id, ok: true, detail: await fn() }; } catch { return { id, ok: false, detail: 'Not detected / 未检测到', optional: id !== 'node' }; } }));
}
