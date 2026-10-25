import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium, expect } from '@playwright/test';

const home = path.resolve('.dev/isolated-home'), artifact = path.resolve('artifacts');
const log = await fs.readFile('.dev/host.log','utf8');
const tokenUrl = log.match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[^\s]+/)?.[0];
if(!tokenUrl)throw new Error('Isolated host endpoint not available');
const origin = new URL(tokenUrl).origin;
const report={kind:'real-installed-DSH-browser-with-local-fixture-model',origin,checks:[]};
let browser;
try {
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(tokenUrl);
  // DSH maintains background connections, so network-idle need not settle. Readiness is the rendered shell.
  await page.waitForLoadState('networkidle',{timeout:5000}).catch(()=>{});
  const continueButton=page.getByRole('button',{name:'继续',exact:true});if(await continueButton.count())await continueButton.click();
  await page.getByRole('button',{name:'账号菜单',exact:true}).click();await page.getByText('设置',{exact:true}).click();
  await page.getByText('同居者 / Companion',{exact:true}).click();
  const panel=page.locator('.dsc');await expect(panel).toBeVisible();await expect(panel.getByLabel('完整人设',{exact:true})).not.toHaveValue('');
  report.checks.push({name:'real DSH settings section renders',pass:true});
  await page.screenshot({path:path.join(artifact,'host-panel-settings.png'),fullPage:true});
  const stateBefore=JSON.parse(await fs.readFile(path.join(home,'companion','runtime','state.json'),'utf8'));
  const marker=`ui-persona-${randomUUID()}`;
  await panel.getByLabel('完整人设',{exact:true}).fill(`You are River, a quiet friend. Include this current persona marker in your context: ${marker}.`);
  await panel.getByRole('button',{name:'保存人设',exact:true}).click();
  await expect(panel.getByRole('status').filter({hasText:'已保存'})).toBeVisible();
  await expect(panel.locator('.dsc-host-model')).toContainText('宿主模型：可用');
  assert.ok((await fs.readFile(path.join(home,'companion','workspace','AGENTS.md'),'utf8')).includes(marker));
  report.checks.push({name:'persona edit saves through real host API',pass:true});
  await panel.getByRole('button',{name:'打开角色对话',exact:true}).click();
  await expect(panel).toHaveCount(0);
  report.checks.push({name:'native conversation opens and settings dismisses',pass:true});
  await page.screenshot({path:path.join(artifact,'host-panel-conversation.png'),fullPage:true});
  const candidates=await page.locator('textarea,[contenteditable=true],[role=textbox]').evaluateAll(nodes=>nodes.map(n=>({tag:n.tagName,role:n.getAttribute('role'),label:n.getAttribute('aria-label'),placeholder:n.getAttribute('placeholder'),editable:n.getAttribute('contenteditable')})));
  await fs.writeFile(path.join(artifact,'host-panel-inputs.json'),JSON.stringify(candidates,null,2));
  const editable=page.locator('[contenteditable=true]').first();
  if(await editable.count()) await editable.fill('Verify the current persona and reply briefly.');
  else await page.locator('textarea').last().fill('Verify the current persona and reply briefly.');
  const callsFile=path.join(home,'fixture-calls.jsonl');const beforeLines=(await fs.readFile(callsFile,'utf8')).trim().split('\n').length;
  await page.getByRole('button',{name:'发送消息',exact:true}).click();
  await expect.poll(async()=>{const lines=(await fs.readFile(callsFile,'utf8')).trim().split('\n');return lines.length>beforeLines;},{timeout:20000}).toBe(true);
  const lines=(await fs.readFile(callsFile,'utf8')).trim().split('\n'),last=JSON.parse(lines.at(-1));
  assert.ok(JSON.stringify(last).includes(marker));
  const stateAfter=JSON.parse(await fs.readFile(path.join(home,'companion','runtime','state.json'),'utf8'));
  assert.equal(stateAfter.sessionId,stateBefore.sessionId);
  report.sessionId=stateAfter.sessionId;report.checks.push({name:'native DSH composer invokes real loop with fixture provider',pass:true});
  report.checks.push({name:'saved persona reaches same existing native session',pass:true});
  await expect(page.getByText('Fixture response: persona and workspace reached the real DSH loop.',{exact:false}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:'发送消息',exact:true})).toBeVisible({timeout:20000});
  await page.screenshot({path:path.join(artifact,'host-panel-native-reply.png'),fullPage:true});
  report.pageErrors=errors;assert.deepEqual(errors,[]);
} catch(e) {report.error=String(e.message).replace(/token=[^\s]+/g,'token=[redacted]');process.exitCode=1;}
finally {await browser?.close();await fs.mkdir(artifact,{recursive:true});await fs.writeFile(path.join(artifact,'host-panel-browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
