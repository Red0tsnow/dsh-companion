import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {chromium,expect} from '@playwright/test';
import {ConfigStore} from '../lib/core/config.js';
const root=path.resolve('.dev','skin-browser-'+randomUUID()),store=new ConfigStore(root);
await store.save({mc:{serverType:'paper',version:'1.21.8',serverDir:root}});
const child=spawn(process.execPath,['scripts/dev.mjs'],{windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:'0',DSH_COMPANION_HOME:root}});
let errors='',browser;child.stderr.on('data',b=>errors+=b);
const report={packageVersion:JSON.parse(await fs.readFile('package.json','utf8')).version,kind:'skin-browser-with-explicit-channel-fixture',checks:[]};
const mark=name=>report.checks.push({name,pass:true});
try{
  const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(errors||'Preview timed out')),20000);child.stdout.on('data',b=>{out+=b;const url=out.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];if(url){clearTimeout(timer);resolve(url);}});child.once('error',reject);});
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1240,height:1100}}),pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  let available=false,rejectSkin=false,payload;
  await page.route('**/api/dsh-companion/setup/mc/versions',route=>route.fulfill({json:{defaultVersion:'26.1',paper:{available,message:'验收尚未完成',versions:available?['1.21.8']:[]},versions:[{id:'26.1',state:'supported'},{id:'1.21.8',state:'supported'}]}}));
  await page.route('**/api/dsh-companion/setup/skin',route=>{payload=route.request().postDataJSON();return route.fulfill({status:rejectSkin?400:200,json:rejectSkin?{error:'Minecraft 无法获取皮肤图片'}:{ok:true}});});
  await page.goto(base);const card=page.locator('[data-channel=mc]');await card.getByRole('button',{name:'连接向导',exact:true}).click();
  await expect(card.locator('option[value=paper]')).toHaveJSProperty('disabled',true);await expect(card.getByLabel('皮肤图片的 https 地址',{exact:true})).toHaveCount(0);mark('unverified components hide the skin form and disable Paper');
  available=true;await card.getByRole('button',{name:'收起',exact:true}).click();await card.getByRole('button',{name:'连接向导',exact:true}).click();
  const input=card.getByLabel('皮肤图片的 https 地址',{exact:true}),apply=card.getByRole('button',{name:'应用皮肤',exact:true});await expect(input).toBeVisible();await expect(apply).toBeDisabled();await expect(card.getByText('无需关闭世界',{exact:false})).toBeVisible();mark('verified Paper exposes an online skin form without asking users to close the world');
  await input.fill('https://example.com/skin.png');await apply.click();await expect(card.getByRole('status')).toContainText('皮肤已应用');assert.deepEqual(payload,{url:'https://example.com/skin.png'});mark('skin action submits the supplied image and waits for success');
  rejectSkin=true;await apply.click();await expect(card.getByRole('alert')).toContainText('Minecraft 无法获取');await expect(input).toHaveValue('https://example.com/skin.png');await expect(card.getByText('皮肤已应用',{exact:true})).toHaveCount(0);mark('server failure retains the image URL and clears success');
  await card.getByLabel('服务端类型',{exact:true}).selectOption('paper');await card.getByLabel('你选择的版本',{exact:true}).selectOption('26.1');await expect(card.getByLabel('服务端类型',{exact:true})).toHaveValue('vanilla');await expect(card.locator('option[value=paper]')).toHaveJSProperty('disabled',true);mark('changing to an unverified version resets Paper selection');
  await page.getByLabel('外观',{exact:true}).selectOption('dark');await card.screenshot({path:'artifacts/skin-panel-dark.png'});await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await card.screenshot({path:'artifacts/skin-panel-mobile.png'});assert.deepEqual(pageErrors,[]);mark('skin form remains usable in dark mode and on narrow screens');
  report.ok=true;
}catch(e){report.ok=false;report.error=e.message;process.exitCode=1;}
finally{await browser?.close();child.kill();await fs.writeFile('artifacts/browser-skin.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
