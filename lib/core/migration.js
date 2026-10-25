import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { legacyPaths, paths, inside } from './paths.js';
import { readJson, writeJson } from './files.js';

function contained(root, file) {
  const rel = path.relative(path.resolve(root), path.resolve(file));
  return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}
// Reject links at every existing component, including the chosen root itself.
// This also keeps junctions from redirecting writes after a lexical containment check.
async function safePath(root, relative) {
  const file = inside(root, relative), rel = path.relative(root, file), parts = rel ? rel.split(path.sep) : [];
  let current = path.resolve(root);
  for (const part of ['', ...parts]) {
    if (part) current = path.join(current, part);
    const st = await fs.lstat(current).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (st?.isSymbolicLink()) throw new Error('Linked migration path is not allowed');
  }
  return file;
}
function rewritePaths(text, old, p) {
  const toolFiles = ['world.mjs','mc.mjs','body.mjs','skills.mjs','journal.mjs'].map(name => [path.join(old.mc,name),path.join(p.mc,name)]);
  const writingFiles = ['shouka.mjs','nightline.mjs'].map(name => [path.join(old.work,name),path.join(p.work,name)]);
  for (const [from, to] of [...toolFiles,...writingFiles,[old.work, p.work], [old.mc, p.mc]]) {
    // Handle both plain prose and JavaScript/JSON string literals with escaped backslashes.
    for (const [a, b] of [[from.replaceAll('\\', '\\\\'), to.replaceAll('\\', '\\\\')], [from, to], [from.replaceAll('\\', '/'), to.replaceAll('\\', '/')]]) text = text.replaceAll(a, b);
  }
  return text;
}
function rewriteTarget(target) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) return { mode: 'resume', channel: 'dsh' };
  return { mode: ['resume', 'fork', 'new'].includes(target.mode) ? target.mode : 'resume', channel: 'dsh' };
}

export async function migrate({ source, target, apply = false, credentials = false }) {
  const old = legacyPaths(source), p = paths(target), entries = [];
  // The normal target is <DSH_HOME>/companion, inside the legacy root. Enumeration
  // is an exact allowlist, so this cannot recursively copy the newly created target.
  if (contained(p.root, old.root)) throw new Error('Destination must differ from and must not contain the source');
  await safePath(old.root, ''); await safePath(p.root, '');
  const mapping = { 'whale-work/AGENTS.md': 'workspace/AGENTS.md', 'whale-work/RULES.md': 'workspace/legacy-rules.md', 'whale-work/NOTES.md': 'workspace/NOTES.md', 'whale-work/MEMORY.md': 'workspace/MEMORY.md', 'whale-work/IMPRESSION.md': 'workspace/IMPRESSION.md', 'whale-work/手札.md': 'workspace/手札.md', 'whale-work/睡前一句.jsonl': 'workspace/睡前一句.jsonl', 'whale-diary.md': 'workspace/diary.md', 'whale-diary-private.md': 'workspace/diary-private.md', 'mc/goal.md': 'runtime/mc/goal.md' };
  for (const dir of ['mc/skills', 'whale-work']) {
    try { await safePath(old.root, dir); } catch { entries.push({ file: dir, status: 'skipped-link' }); continue; }
    for (const file of await fs.readdir(inside(old.root, dir), { withFileTypes: true }).catch(() => [])) {
      if (file.isFile() && (dir === 'mc/skills' ? file.name.endsWith('.mjs') && file.name !== '_helper.mjs' : file.name.endsWith('.schedule.json'))) mapping[`${dir}/${file.name}`] = dir === 'mc/skills' ? `runtime/mc/skills/${file.name}` : `schedules/${file.name}`;
    }
  }
  for (const [from, to] of Object.entries(mapping)) {
    let src, dest;
    try { src = await safePath(old.root, from); } catch { entries.push({ file: from, status: 'skipped-link' }); continue; }
    try { dest = await safePath(p.root, to); } catch { entries.push({ file: from, target: to, status: 'unsafe-target' }); continue; }
    const st = await fs.lstat(src).catch(() => null); if (!st?.isFile() || st.isSymbolicLink()) continue;
    const resolved = await fs.realpath(src); if (!contained(await fs.realpath(old.root), resolved)) { entries.push({ file: from, status: 'skipped-link' }); continue; }
    if (st.size > 16 * 1024 * 1024) { entries.push({ file: from, status: 'too-large' }); continue; }
    let data = await fs.readFile(src); const hash = createHash('sha256').update(data).digest('hex');
    if (to.endsWith('.mjs') || to === 'workspace/legacy-rules.md') data = Buffer.from(rewritePaths(data.toString('utf8'), old, p));
    if (to.startsWith('schedules/')) {
      try {
        const j = JSON.parse(data.toString('utf8')); if (j.version !== 1 || !Array.isArray(j.entries)) throw new Error('Unsupported schedule format');
        if (j.target) j.target = rewriteTarget(j.target);
        for (const e of j.entries) {
          if (!e || typeof e !== 'object') throw new Error('Schedule entry must be an object');
          e.enabled = false;
          e.migrationNote = 'Imported disabled. Review timing and targets before enabling.';
          if (typeof e.prompt === 'string') e.prompt = rewritePaths(e.prompt, old, p);
          if (e.target) e.target = rewriteTarget(e.target);
        }
        data = Buffer.from(JSON.stringify(j, null, 2) + '\n');
      } catch (e) { entries.push({ file: from, status: 'invalid', error: e.message }); continue; }
    }
    const exists = await fs.lstat(dest).then(() => true, () => false);
    if (exists) { entries.push({ file: from, target: to, status: 'kept-existing', sha256: hash }); continue; }
    if (apply) { await fs.mkdir(path.dirname(dest), { recursive: true }); await safePath(p.root, to); try { await fs.writeFile(dest, data, { flag: 'wx', mode: 0o600 }); await fs.utimes(dest,st.atime,st.mtime); } catch (e) { if (e.code !== 'EEXIST') throw e; entries.push({ file: from, status: 'kept-existing' }); continue; } }
    entries.push({ file: from, target: to, status: apply ? 'copied' : 'would-copy', sha256: hash });
  }
  if (credentials) {
    await safePath(p.root, 'secrets.json'); const all = await readJson(p.secrets);
    for (const [id, file, keys] of [['bili', old.biliCredentials, ['sessdata', 'bili_jct', 'buvid3']], ['xhh', path.join(old.root, 'xhh-cookie.json'), ['pkey', 'x_xhh_tokenid']]]) {
      if (all[id]) { entries.push({ file: `${id} credentials`, status: 'kept-existing' }); continue; }
      try { await safePath(path.dirname(file), path.basename(file)); } catch { entries.push({ file: `${id} credentials`, status: 'skipped-link' }); continue; }
      const c = await readJson(file).catch(() => ({})); if (!Object.keys(c).length) continue;
      all[id] = Object.fromEntries(keys.map(k => [k, String(c[k] || c.cookies?.[k] || (k === 'x_xhh_tokenid' ? c.tokenid : '') || '')]));
      entries.push({ file: `${id} credentials`, status: apply ? 'copied' : 'would-copy' });
    }
    if (apply) await writeJson(p.secrets, all);
  }
  const report = { version: 1, applied: apply, at: new Date().toISOString(), entries };
  if (apply) { await safePath(p.root, 'migration-report.json'); await writeJson(path.join(p.root, 'migration-report.json'), report); }
  return report;
}
