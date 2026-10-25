// Development-only reader; never imported by the plugin.
import fs from 'node:fs';
const [archive, pattern, mode = 'read'] = process.argv.slice(2);
const fd = fs.openSync(archive, 'r');
const h = Buffer.alloc(16); fs.readSync(fd, h, 0, 16, 0);
const raw = Buffer.alloc(h.readUInt32LE(12)); fs.readSync(fd, raw, 0, raw.length, 16);
const tree = JSON.parse(raw.toString()); const base = 8 + h.readUInt32LE(4);
const re = new RegExp(pattern);
function walk(node, prefix = '') {
  for (const [key, item] of Object.entries(node.files || {})) {
    const p = prefix ? `${prefix}/${key}` : key;
    if (item.files) walk(item, p);
    else if (re.test(p)) {
      if (mode === 'list') console.log(p);
      else if (!item.unpacked && item.offset !== undefined) {
        const b = Buffer.alloc(item.size); fs.readSync(fd, b, 0, b.length, base + Number(item.offset));
        console.log(JSON.stringify({ path: p, text: b.toString() }));
      }
    }
  }
}
walk(tree); fs.closeSync(fd);
