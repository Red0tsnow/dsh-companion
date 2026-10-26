// docs/first-run.md 里引用的每一个界面文字，都必须真实存在于 UI 源码中
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const ui = ['ui/messages.js', 'ui/panel.jsx', 'ui/setup.jsx', 'ui/life.jsx'].map(read).join('\n');
const guide = read('docs/first-run.md');

test('every label quoted in the first-run guide exists in the UI', () => {
  const labels = [
    '保存人设', '打开角色对话', '重新检查', '载入空白模板', '载入示例',
    '开始一起玩', '连接 QQ', '扫码连接 B站', '准备并开启世界',
    '她可以去的地方', '宿主模型', '陪伴日常', '没有，帮我准备一个',
  ];
  for (const label of labels) {
    assert.ok(guide.includes(label), 'the guide no longer mentions: ' + label);
    assert.ok(ui.includes(label), 'the guide quotes a label the UI does not have: ' + label);
  }
});

test('the first-run guide keeps its warnings and hard numbers', () => {
  // A beginner guide that drops the risks is worse than none.
  assert.match(guide, /不是 App/);
  assert.match(guide, /4000 字上限/);
  assert.match(guide, /不推荐用主号/);
  assert.match(guide, /默认全关/);
  assert.match(guide, /不会删你的日记/);
  // It must not promise an easy install path that does not exist.
  assert.doesNotMatch(guide, /一键安装|下载即用/);
});

test('the guide is linked from the README', () => {
  assert.match(read('README.md'), /first-run\.md/);
});
