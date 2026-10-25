import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { paths } from './paths.js';
import { readJson, writeJson, serialized } from './files.js';

const TYPES = {
  '.png': ['image/png', 'image'], '.jpg': ['image/jpeg', 'image'], '.jpeg': ['image/jpeg', 'image'], '.gif': ['image/gif', 'image'], '.webp': ['image/webp', 'image'],
  '.mp3': ['audio/mpeg', 'audio'], '.ogg': ['audio/ogg', 'audio'], '.wav': ['audio/wav', 'audio'], '.m4a': ['audio/mp4', 'audio'],
};
const MAX_BYTES = 8 * 1024 * 1024;
function validName(name) { return typeof name === 'string' && name.length <= 120 && !/[\\/\x00-\x1f<>:"|?*]/.test(name) && name !== '.' && name !== '..' && !name.endsWith('.') && !name.endsWith(' '); }
function checkContent(data, ext) {
  if (ext === '.png') return data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (ext === '.jpg' || ext === '.jpeg') return data[0] === 255 && data[1] === 216 && data[2] === 255;
  if (ext === '.gif') return /^GIF8[79]a$/.test(data.subarray(0,6).toString());
  if (ext === '.webp') return data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP';
  if (ext === '.wav') return data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WAVE';
  if (ext === '.ogg') return data.subarray(0,4).toString() === 'OggS';
  if (ext === '.m4a') return data.subarray(4,8).toString() === 'ftyp';
  if (ext === '.mp3') return data.subarray(0,3).toString() === 'ID3' || (data[0] === 255 && (data[1] & 0xe0) === 0xe0);
  return false;
}
async function safeFile(root, id, { create = false } = {}) {
  if (!validName(id) || !TYPES[path.extname(id).toLowerCase()]) throw new Error('Invalid media file');
  const dir = paths(root).media;
  let current = path.resolve(root);
  for (const part of ['', 'workspace', 'media']) {
    if (part) current = path.join(current, part);
    const st = await fs.lstat(current).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (st?.isSymbolicLink()) throw new Error('Linked media directory is not allowed');
  }
  if (create) await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, id), st = await fs.lstat(file).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
  if (st?.isSymbolicLink() || st && !st.isFile()) throw new Error('Linked media file is not allowed');
  return { dir, file, st };
}
function metadata(id, stat, name = id) {
  const [mime, type] = TYPES[path.extname(id).toLowerCase()];
  return { id, name, type, mime, bytes: stat.size, mtime: stat.mtime.toISOString(), url: `/api/dsh-companion/media/file?id=${encodeURIComponent(id)}` };
}
export async function listMedia(root) {
  const p = paths(root), index = await readJson(path.join(p.root, 'media-index.json'));
  const out = [];
  for (const id of await fs.readdir(p.media).catch(e => { if (e.code === 'ENOENT') return []; throw e; })) {
    try { const { st } = await safeFile(root, id); if (st && st.size <= MAX_BYTES) out.push(metadata(id, st, index[id]?.name || id)); } catch {}
  }
  return out.sort((a,b) => b.mtime.localeCompare(a.mtime));
}
export async function uploadMedia(root, { name, data, kind } = {}) {
  if (!validName(name)) throw new Error('Invalid media filename');
  const ext = path.extname(name).toLowerCase(), type = TYPES[ext];
  if (!type || kind !== type[1]) throw new Error('Unsupported media type');
  if (typeof data !== 'string' || data.length > Math.ceil(MAX_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) throw new Error('Invalid or oversized base64 media');
  const content = Buffer.from(data, 'base64'); if (!content.length || content.length > MAX_BYTES || !checkContent(content, ext)) throw new Error('Media content does not match its extension');
  const id = `${randomUUID()}${ext}`, p = paths(root), { file } = await safeFile(root, id, { create: true });
  await fs.writeFile(file, content, { flag: 'wx', mode: 0o600 });
  await serialized(path.join(p.root, 'media-index.json'), async () => { const index = await readJson(path.join(p.root, 'media-index.json')); index[id] = { name }; await writeJson(path.join(p.root, 'media-index.json'), index); });
  return metadata(id, await fs.stat(file), name);
}
export async function readMedia(root, id) {
  const { file, st } = await safeFile(root, id); if (!st || st.size > MAX_BYTES) throw new Error('Media unavailable');
  const data = await fs.readFile(file), ext = path.extname(id).toLowerCase(); if (!checkContent(data, ext)) throw new Error('Invalid media content');
  return { data, mime: TYPES[ext][0], name: id };
}
export async function removeMedia(root, id) {
  const { file } = await safeFile(root, id); await fs.rm(file, { force: true }); const p = paths(root);
  await serialized(path.join(p.root, 'media-index.json'), async () => { const index = await readJson(path.join(p.root, 'media-index.json')); delete index[id]; await writeJson(path.join(p.root, 'media-index.json'), index); });
  return { ok: true };
}
