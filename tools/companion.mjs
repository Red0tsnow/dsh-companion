import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { P, CONFIG } from './runtime.mjs';
const entries = { world: 'mc/world.mjs', mc: 'mc/mc.mjs', body: 'mc/body.mjs', journal: 'mc/journal.mjs', skills: 'mc/skills.mjs', shouka: 'writings/shouka.mjs', nightline: 'writings/nightline.mjs', reachout:'writings/reachout.mjs',diary:'writings/diary.mjs',reflect:'writings/reflect.mjs',life:'writings/life.mjs', xhh: 'xhh/xhh.mjs', bili: 'bili/bili.mjs' };
const tool = process.argv[2];
if (!Object.hasOwn(entries, tool)) { console.log('Tools: ' + Object.keys(entries).join(', ')); process.exitCode = 2; }
else { process.argv.splice(2, 1); const file = tool === 'xhh' ? CONFIG.xhh.toolPath : path.join(P.tools, entries[tool]); if (!file) throw new Error('Provide your own Heybox CLI path in settings'); await import(pathToFileURL(file).href); }
