// 隐私与协议提示必须在包里，而且必须中英双语
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the privacy document covers data location, outbound hosts and deletion', () => {
  const doc = read('docs/privacy.md');
  for (const needle of ['数据存在哪', '会不会传出去', 'secrets.json', '删除数据', 'piston-data.mojang.com', 'cdn.modrinth.com', '不上传任何数据']) {
    assert.ok(doc.includes(needle), 'privacy.md is missing: ' + needle);
  }
  // The allowlist in the doc must match the code, not be a stale copy.
  const code = read('lib/core/downloads.js');
  for (const host of ['piston-meta.mojang.com', 'piston-data.mojang.com', 'api.adoptium.net', 'fill-data.papermc.io', 'cdn.modrinth.com']) {
    assert.ok(code.includes(host), 'downloads.js lost an allowlisted host: ' + host);
    assert.ok(doc.includes(host), 'privacy.md does not document: ' + host);
  }
});

test('platform terms risk is stated in both languages on every surface', () => {
  const readme = read('README.md');
  assert.match(readme, /平台协议风险/);
  assert.match(readme, /Platform terms/);
  const onboarding = read('docs/onboarding.md');
  assert.match(onboarding, /协议风险：/);
  assert.match(onboarding, /Terms:/);
  assert.match(onboarding, /违反 QQ 用户协议/);
  assert.match(onboarding, /violate Bilibili's terms of service/);
});

test('the panel shows the terms and privacy note for QQ and Bilibili only', () => {
  const ui = read('ui/setup.jsx');
  assert.match(ui, /termsRisk:'/, 'missing Chinese terms string');
  assert.match(ui, /termsRisk:'Using third-party clients/, 'missing English terms string');
  assert.match(ui, /privacyNote:'/, 'missing Chinese privacy string');
  assert.match(ui, /privacyNote:'The plugin uploads nothing/, 'missing English privacy string');
  const aside = ui.split('\n').find((line) => line.includes('accountRiskTitle}') && line.includes('<aside'));
  assert.ok(aside, 'the risk aside is gone');
  assert.ok(aside.includes("['qq','bili'].includes(id)"), 'the aside must stay limited to QQ and Bilibili');
  assert.ok(aside.includes('t.termsRisk') && aside.includes('t.privacyNote'), 'the aside must render both notes');
  // Copy must be present in the built client too.
  const client = read('lib/client.js');
  for (const key of ['termsRisk', 'privacyNote']) assert.ok(client.includes(key), 'built client is stale: ' + key);
});

test('NOTICE is current and carries the privacy statement', () => {
  const notice = read('NOTICE');
  const pkg = JSON.parse(read('package.json'));
  assert.ok(notice.includes('dsh-companion ' + pkg.version), 'NOTICE version does not match package.json');
  assert.match(notice, /Privacy\n/);
  assert.doesNotMatch(notice, /remain gated until client-visible acceptance/, 'stale gating sentence');
});
