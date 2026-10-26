import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import { paths } from './paths.js';
import { readJson, writeJson, atomicWrite, serialized } from './files.js';
import { WRITINGS } from './writings.js';
export async function initialize(root) {
  const p = paths(root);
  const forwarder = script => `// Generated entrypoint. Character data and the editable body are separate.\nprocess.env.DSH_COMPANION_HOME = ${JSON.stringify(p.root)};\nawait import(${JSON.stringify(pathToFileURL(path.join(p.tools,script)).href)});\n`;
  for (const dir of [p.root, p.work, p.mc, p.schedules, p.media, p.bili, p.xhh]) await fs.mkdir(dir, { recursive: true });
  await serialized(p.secrets, async () => { const secrets = await readJson(p.secrets); if (!secrets.bodyToken) { secrets.bodyToken = randomBytes(32).toString('hex'); await writeJson(p.secrets, secrets); } });
  for (const file of Object.values(WRITINGS)) { try { await fs.writeFile(path.join(p.work, file), '', { flag: 'wx' }); } catch (e) { if (e.code !== 'EEXIST') throw e; } }
  try { await fs.copyFile(path.join(p.templates, 'mc-daemon.mjs'), path.join(p.mc, 'mc-daemon.mjs'), fs.constants.COPYFILE_EXCL); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  // Dynamic import ensures a directly launched body also uses its own data root.
  await atomicWrite(path.join(p.mc, 'bridge.mjs'), `process.env.DSH_COMPANION_HOME = ${JSON.stringify(p.root)};\nexport const { require, ROOT, P, CONFIG, SECRETS } = await import(${JSON.stringify(pathToFileURL(path.join(p.tools,'runtime.mjs')).href)});\nexport {discoverLan} from ${JSON.stringify(pathToFileURL(path.join(p.tools,'../lib/core/lan.js')).href)};\nexport {createBodyCapabilities} from ${JSON.stringify(pathToFileURL(path.join(p.tools,'../lib/core/mc-body.js')).href)};\n`);
  for (const name of ['world.mjs','mc.mjs','body.mjs','journal.mjs','skills.mjs']) await atomicWrite(path.join(p.mc,name),forwarder(`mc/${name}`));
  for (const name of ['shouka.mjs','nightline.mjs','reachout.mjs','diary.mjs']) await atomicWrite(path.join(p.work,name),forwarder(`writings/${name}`));
  try { await fs.copyFile(path.join(p.templates, 'rules.template.md'), path.join(p.work, 'RULES.md'), fs.constants.COPYFILE_EXCL); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  // Stable local entrypoint: a character only needs the cwd, never an author's installation path.
  await atomicWrite(path.join(p.work, 'companion.mjs'),forwarder('companion.mjs'));
}
