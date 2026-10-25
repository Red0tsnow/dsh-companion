import fs from 'node:fs/promises';
import path from 'node:path';
import { paths } from './paths.js';
export const WRITINGS = { diary: 'diary.md', private: 'diary-private.md', journal: '手札.md', memory: 'MEMORY.md', impression: 'IMPRESSION.md', notes: 'NOTES.md', bedtime: '睡前一句.jsonl' };
export async function writings(root) {
  const work = paths(root).work;
  return Object.fromEntries(await Promise.all(Object.entries(WRITINGS).map(async ([id, name]) => {
    try {
      const file = path.join(work, name), st = await fs.stat(file);
      // Read recent content for growing logs, keeping each refresh bounded.
      const handle = await fs.open(file, 'r'); let text;
      try { const size = Math.min(st.size, 256 * 1024), b = Buffer.alloc(size); await handle.read(b, 0, size, st.size - size); text = b.toString('utf8'); if (st.size > size) text = text.slice(text.indexOf('\n') + 1); }
      finally { await handle.close(); }
      return [id, { text, mtime: st.mtime.toISOString(), truncated: st.size > 256 * 1024 }];
    } catch (e) { return [id, { text: '', mtime: null, error: e.code === 'ENOENT' ? null : 'Cannot read / 无法读取' }]; }
  })));
}
