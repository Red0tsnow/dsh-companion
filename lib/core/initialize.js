import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { paths } from './paths.js';
import { readJson, writeJson, atomicWrite, serialized } from './files.js';
import { WRITINGS } from './writings.js';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Stock bodies from earlier releases. If a body matches one of these it was never
// edited by the user, so replacing it with the new template is safe (we still back
// it up). Anything else counts as the user's own body and is left alone.
const STOCK_BODIES = new Set(['25225afb7ddd00b5a168b847358df08f693e5ad53f143dafa89c185194c261fb']);
export async function initialize(root) {
  const p = paths(root);
  const forwarder = script => `// Generated entrypoint. Character data and the editable body are separate.\nprocess.env.DSH_COMPANION_HOME = ${JSON.stringify(p.root)};\nawait import(${JSON.stringify(pathToFileURL(path.join(p.tools,script)).href)});\n`;
  for (const dir of [p.root, p.work, p.mc, p.schedules, p.media, p.bili, p.xhh]) await fs.mkdir(dir, { recursive: true });
  await serialized(p.secrets, async () => { const secrets = await readJson(p.secrets); if (!secrets.bodyToken) { secrets.bodyToken = randomBytes(32).toString('hex'); await writeJson(p.secrets, secrets); } });
  for (const file of Object.values(WRITINGS)) { try { await fs.writeFile(path.join(p.work, file), '', { flag: 'wx' }); } catch (e) { if (e.code !== 'EEXIST') throw e; } }
  await installBody(p, sha);
  // Dynamic import ensures a directly launched body also uses its own data root.
  await atomicWrite(path.join(p.mc, 'bridge.mjs'), `process.env.DSH_COMPANION_HOME = ${JSON.stringify(p.root)};\nexport const { require, ROOT, P, CONFIG, SECRETS } = await import(${JSON.stringify(pathToFileURL(path.join(p.tools,'runtime.mjs')).href)});\nexport {discoverLan} from ${JSON.stringify(pathToFileURL(path.join(p.tools,'../lib/core/lan.js')).href)};\nexport {createBodyCapabilities} from ${JSON.stringify(pathToFileURL(path.join(p.tools,'../lib/core/mc-body.js')).href)};\n`);
  for (const name of ['world.mjs','mc.mjs','body.mjs','journal.mjs','skills.mjs']) await atomicWrite(path.join(p.mc,name),forwarder(`mc/${name}`));
  for (const name of ['shouka.mjs','nightline.mjs','reachout.mjs','diary.mjs','reflect.mjs']) await atomicWrite(path.join(p.work,name),forwarder(`writings/${name}`));
  try { await fs.copyFile(path.join(p.templates, 'rules.template.md'), path.join(p.work, 'RULES.md'), fs.constants.COPYFILE_EXCL); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  // Stable local entrypoint: a character only needs the cwd, never an author's installation path.
  await atomicWrite(path.join(p.work, 'companion.mjs'),forwarder('companion.mjs'));
}
// 身体是可以被用户改的，所以升级不能直接覆盖。规则：
//   没装过 → 写入模板
//   和模板一样 → 什么都不做
//   是历史发行版的原样身体，或上次记录的就是当前内容 → 备份后升级
//   其它（用户改过）→ 一个字都不动，留一份 BODY-UPGRADE.md 说明怎么办
async function installBody(p, sha) {
  const template = await fs.readFile(path.join(p.templates, 'mc-daemon.mjs'));
  const shipped = sha(template);
  const file = path.join(p.mc, 'mc-daemon.mjs');
  const stampFile = path.join(p.mc, 'body-template.json');
  const stamp = await readJson(stampFile).catch(() => null);
  let current = null;
  try { current = await fs.readFile(file); } catch (e) { if (e.code !== 'ENOENT') throw e; }

  if (!current) {
    await fs.writeFile(file, template, { flag: 'wx' });
    await writeJson(stampFile, { hash: shipped, installedAt: new Date().toISOString() });
    return;
  }
  const have = sha(current);
  if (have === shipped) {
    if (!stamp || stamp.hash !== shipped) await writeJson(stampFile, { hash: shipped });
    return;
  }
  const untouched = STOCK_BODIES.has(have) || (stamp && stamp.hash === have);
  if (!untouched) {
    await writeJson(stampFile, { hash: have, pending: shipped });
    await fs.writeFile(path.join(p.mc, 'BODY-UPGRADE.md'),
      '# 身体没有自动升级\n\n这份身体被改过，新版本没有覆盖它。\n\n' +
      `- 当前模板 sha256：\`${shipped}\`\n- 你的身体 sha256：\`${have}\`\n\n` +
      '想用新版本：先 `body.mjs backups` 确认有备份，再把新模板里想要的部分合并进来；\n' +
      '或者删掉这份身体，让插件下次启动重新生成（存档、日记、记忆都不受影响）。\n');
    return;
  }
  const backups = path.join(p.mc, 'body-backups');
  await fs.mkdir(backups, { recursive: true });
  const backup = path.join(backups, `mc-daemon.${new Date().toISOString().replace(/[:.]/g, '-')}.bak.mjs`);
  await fs.copyFile(file, backup);
  await fs.writeFile(file, template);
  await writeJson(stampFile, { hash: shipped, upgradedFrom: have, upgradedAt: new Date().toISOString() });
  await fs.rm(path.join(p.mc, 'BODY-UPGRADE.md'), { force: true });
}
