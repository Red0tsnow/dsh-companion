import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
// The client bundle escapes non-ASCII; compare in that form.
const esc = (s) =>
  [...s].map((ch) => (ch.codePointAt(0) < 0x80 ? ch : '\\u' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'))).join('').toUpperCase();

test('the panel exposes reflection settings', () => {
  const ui = read('ui/life.jsx');
  for (const key of ['reflectTitle', 'memory', 'persona', 'rules', 'reflectOn']) {
    assert.ok(ui.includes(key), 'ui/life.jsx lost ' + key);
  }
  // It has to be a real control bound to the config, not just copy.
  assert.match(ui, /value\.reflect\.enabled/);
  assert.match(ui, /reflect:\{\.\.\.c\.reflect/);
});

test('the built client carries the reflection copy', () => {
  const client = read('lib/client.js');
  const upper = client.toUpperCase();
  for (const text of ['回头看自己', '月度：整理长期记忆', '每周：人设回顾', '月度：规则检查', 'Looking back at itself']) {
    assert.ok(upper.includes(esc(text)), 'built client is stale: ' + text);
  }
});

test('reflection copy says skipping is allowed and that it is opt-in', () => {
  const ui = read('ui/life.jsx');
  assert.match(ui, /默认关闭/);
  assert.match(ui, /跳过/);
  assert.match(ui, /至少|最多改一条|一个月最多改一条/);
});
