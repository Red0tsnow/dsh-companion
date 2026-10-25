import { build } from 'esbuild';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildClient({ dev = false } = {}) {
  const result = await build({ absWorkingDir: root, entryPoints: ['ui/client.jsx'], bundle: true, write: false, format: 'cjs', platform: 'browser', target: 'es2022', external: ['react'], loader: { '.css': 'text' }, jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', minify: false, legalComments: 'none' });
  await fs.mkdir(new URL('../lib/', import.meta.url), { recursive: true });
  await fs.writeFile(new URL('../lib/client.js', import.meta.url), `window.__ModuleLoader__.load({id:"dsh-companion",factory:(require)=>{const module={exports:{}};const exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});\n`);
  if (dev) {
    await fs.mkdir(new URL('../.dev/web/', import.meta.url), { recursive: true });
    await build({ absWorkingDir: root, entryPoints: ['ui/dev.jsx'], outfile: '.dev/web/app.js', bundle: true, format: 'iife', platform: 'browser', target: 'es2022', loader: { '.css': 'text' }, jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', define: { 'process.env.NODE_ENV': '"development"' }, legalComments: 'none' });
  }
}
if (process.argv[1] && new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).href === import.meta.url) { await buildClient({ dev: process.argv.includes('--dev') }); console.log('Built DSH client' + (process.argv.includes('--dev') ? ' and standalone preview' : '')); }
