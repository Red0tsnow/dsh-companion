// Isolated verification only. Installed host files are read, never changed or redistributed.
import fs from 'node:fs';
import path from 'node:path';
const [archive, output] = process.argv.slice(2), dest = path.resolve(output);
if (!dest.includes(`${path.sep}.dev${path.sep}`)) throw new Error('Extraction must stay in .dev');
const fd = fs.openSync(archive, 'r'), h = Buffer.alloc(16); fs.readSync(fd, h, 0, 16, 0);
const raw = Buffer.alloc(h.readUInt32LE(12)); fs.readSync(fd, raw, 0, raw.length, 16);
const tree = JSON.parse(raw.toString()), base = 8 + h.readUInt32LE(4); let count = 0, bytes = 0;
function walk(node, prefix = '') {
  for (const [key, f] of Object.entries(node.files || {})) {
    const rel = prefix ? `${prefix}/${key}` : key, target = path.resolve(dest, rel);
    if (!target.startsWith(dest + path.sep)) throw new Error('Invalid archive path');
    if (f.files) { fs.mkdirSync(target, { recursive: true }); walk(f, rel); }
    else if (f.link) { /* no archive links are needed for the selected host */ }
    else { if (f.unpacked) fs.copyFileSync(path.join(archive + '.unpacked', 'dsh', rel), target); else { const b = Buffer.alloc(f.size); fs.readSync(fd,b,0,b.length,base + Number(f.offset)); fs.writeFileSync(target,b); } count++; bytes += f.size || 0; }
  }
}
fs.mkdirSync(dest, { recursive: true }); walk(tree.files.dsh); fs.closeSync(fd); console.log(JSON.stringify({ files: count, bytes }));
