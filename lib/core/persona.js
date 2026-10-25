import fs from 'node:fs/promises';
import { paths } from './paths.js';
import { atomicWrite, serialized } from './files.js';

// DSH's legacy 4000 slicing boundary uses JS UTF-16 units. Normalize CRLF before counting.
export const normalizePersona = text => String(text).replace(/\r\n?/g, '\n');
export async function readPersona(root) {
  let text = ''; try { text = await fs.readFile(paths(root).persona, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  text = normalizePersona(text); return { text, count: text.length, limit: 4000 };
}
export function savePersona(root, value) {
  const text = normalizePersona(value); const p = paths(root);
  if (!text.trim()) return Promise.reject(new Error('Persona cannot be empty / 人设不能为空'));
  if (text.length > 4000) return Promise.reject(new Error('Persona exceeds 4000 / 人设超过 4000 上限'));
  return serialized(p.persona, async () => {
    await atomicWrite(p.persona, text);
    try { await atomicWrite(p.mirror, text); return { ok: true, count: text.length, mirrored: true }; }
    catch { return { ok: true, count: text.length, mirrored: false, warning: 'Persona saved; mirror could not be updated / 人设已保存，镜像同步失败' }; }
  });
}
