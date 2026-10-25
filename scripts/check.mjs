import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const privateNames = ['\u9178\u9178', '\u751c\u751c'];
const privateIds = ['30328' + '48179', '34017' + '84956', '3632319' + '158028579', '7544' + '7388'];
const sourceExtensions = new Set(['.js', '.mjs', '.json', '.md', '.yml', '.yaml']);

export const forbiddenProvenanceReference = /(^|[/\\])xhh([/\\]|$)|sign\.mjs|^\.\.[/\\]/i;
export function auditReleaseGuards(pin,source) {
  const errors=[],add=(rule,detail)=>errors.push({file:'lib/core/setup.js',rule,detail});
  if(!pin||!/^\b[0-9a-f]{64}\b$/i.test(pin.sha256||'')||typeof pin.version!=='string'||!pin.version.trim()||typeof pin.asset!=='string'||!pin.asset.trim())errors.push({file:'tools/known-good.json',rule:'trust-anchor',detail:'A nonempty version/asset and 64 hex SHA-256 are required'});
  if(/\bMC_VERSION\b/.test(source))add('literal-minecraft-version','Versions must come from configuration and the supported release intersection');
  const prepare=source.slice(source.indexOf('async startQQ('),source.indexOf('async openQQInstaller('));
  const open=source.slice(source.indexOf('async openQQInstaller('),source.indexOf('async launchQQ('));
  const pinAt=prepare.indexOf('assertPinnedRelease(release,pin)'),downloadAt=prepare.indexOf('await downloadVerified(');
  if(!prepare.includes('await knownGood()')||pinAt<0||downloadAt<0||pinAt>downloadAt||!prepare.includes('sha256:checksum')||/\bspawn\s*\(/.test(prepare))add('pinned-download','QQ downloads must pass the packaged anchor before downloading; no execution during preparation');
  const signatureAt=open.indexOf('authenticode)(state.installer)'),guardAt=open.indexOf('assertAuthenticode(signature,pin)'),spawnAt=open.indexOf('spawn(state.installer');
  if(signatureAt<0||guardAt<signatureAt||spawnAt<guardAt||!open.includes('body.confirmExecution!==true')||!open.includes('body.sha256!==pin.sha256'))add('signed-execution','Installer execution requires explicit matching confirmation and Authenticode publisher validation');
  return errors;
}
export function auditProvenance(records, { rootDir = root } = {}) {
  const errors = [], file = 'data/provenance.json';
  if (!Array.isArray(records)) errors.push({file,rule:'provenance-format',detail:'Expected an array'});
  else records.forEach((entry,index) => {
    if (!entry || typeof entry.source !== 'string' || typeof entry.target !== 'string' || !entry.source || !entry.target) {
      errors.push({file,rule:'provenance-format',index,detail:'Each record requires source and target'}); return;
    }
    const {source,target} = entry;
    if (forbiddenProvenanceReference.test(source) || forbiddenProvenanceReference.test(target) || /xhh|sign|\.\.|plugins[/\\]/i.test(source)) {
      errors.push({file,rule:'provenance-reference',index,source,target,detail:'Excluded or local source reference'});
    }
    const resolved = path.resolve(rootDir,target.replaceAll('\\','/')), relative = path.relative(path.resolve(rootDir),resolved);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !existsSync(resolved)) {
      errors.push({file,rule:'provenance-target',index,source,target,detail:'Target must exist inside the repository'});
    }
  });
  if (existsSync(path.join(rootDir,'tools','xhh'))) errors.push({file:'tools/xhh',rule:'excluded-directory',detail:'Excluded directory must be absent, even when empty'});
  return errors;
}

export async function shippedSources() {
  const found = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) found.push(file);
    }
  }
  for (const dir of ['lib', 'tools', 'data', 'docs']) {
    try { await walk(path.join(root, dir)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  for (const name of ['README.md', 'NOTICE', 'LICENSE', 'cordis.patch.yml', 'package.json']) {
    const file = path.join(root, name); if (await fs.stat(file).catch(() => false)) found.push(file);
  }
  return found;
}

export async function auditFiles(files) {
  const errors = [];
  const add = (file, rule, detail) => errors.push({ file: path.relative(root, file).replaceAll('\\', '/'), rule, detail });
  for (const file of files) {
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const source = await fs.readFile(file, 'utf8');
    if (/[A-Z]:\\+Users\\+|\bA:\\+|\bguohmokl\b/i.test(source) && rel !== 'lib/core/paths.js') add(file, 'private-path', 'Machine-specific deployment path');
    if (privateNames.some(n => source.includes(n)) || privateIds.some(n => source.includes(n))) add(file, 'private-identity', 'Private character/account identity');
    if (/(?:from\s*|import\s*\(|require\s*\()\s*['"][^'"]*dsh-onebot-qq/.test(source)) add(file, 'foreign-qq-implementation', 'QQ must use the public OneBot protocol');
    if (/(?:^|\/)xhh\/(?:lib\/)?(?:sign|rsa|encbody)\.mjs$/.test(file.replaceAll('\\', '/')) || /\bHMAC_KEY\s*=|\bmakeWebSignature\s*\(/.test(source)) add(file, 'excluded-signing', 'Heybox signing implementation must not ship');
    if (/\.(?:mjs|js)$/.test(file)) {
      // Generated runtime helper templates contain imports relative to their
      // destination. Check executable imports here, not template source text.
      const executable = source.replace(/`(?:\\[\s\S]|[^`])*`/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const imports = executable.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.{1,2}\/[^'"]+)['"]/g);
      for (const [, specifier] of imports) {
        if (rel === 'data/mc-daemon.mjs' && specifier === './bridge.mjs') continue; // generated into the writable body directory
        const target = path.resolve(path.dirname(file), specifier);
        if (!(await fs.stat(target).catch(() => null))) add(file, 'missing-import', specifier);
      }
    }
  }
  return errors;
}

async function main() {
  const files = await shippedSources(), errors = await auditFiles(files);
  let provenance;
  try { provenance = JSON.parse(await fs.readFile(path.join(root,'data/provenance.json'),'utf8')); errors.push(...auditProvenance(provenance)); }
  catch (e) { errors.push({file:'data/provenance.json',rule:'provenance-format',detail:e.message}); }
  if(provenance?.length!==54)errors.push({file:'data/provenance.json',rule:'provenance-count',detail:'Expected the reviewed 54 entries'});
  try {errors.push(...auditReleaseGuards(JSON.parse(await fs.readFile(path.join(root,'tools/known-good.json'),'utf8')),await fs.readFile(path.join(root,'lib/core/setup.js'),'utf8')));}
  catch(e){errors.push({file:'tools/known-good.json',rule:'trust-anchor',detail:e.message});}
  for (const file of files.filter(f => /\.(?:js|mjs)$/.test(f))) {
    try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe', windowsHide: true, timeout: 10000 }); }
    catch (e) { errors.push({ file: path.relative(root, file), rule: 'syntax', detail: String(e.stderr || e.message).trim() }); }
  }
  if (errors.length) { console.error(JSON.stringify({ ok: false, errors }, null, 2)); process.exitCode = 1; }
  else console.log(JSON.stringify({ ok: true, checkedFiles: files.length, syntax: true, privateData: false, excludedSigning: false,
    provenance:{entries:provenance.length,targetsExist:true,forbiddenReferences:0,excludedDirectoryAbsent:true} }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
