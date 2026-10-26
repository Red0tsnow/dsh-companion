import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ConfigStore } from './config.js';
import { initialize } from './initialize.js';
import { readPersona, savePersona } from './persona.js';
import { writings } from './writings.js';
import { createAdapters, validText } from '../adapters/index.js';
import { CharacterSession } from './session.js';
import { syncPlatformFiles } from './platform-files.js';
import { dependencies } from './dependencies.js';
import { tickSchedules, loadSchedules, saveSchedule } from './scheduler.js';
import { listMedia, uploadMedia, readMedia, removeMedia } from './media.js';
import { readJson, writeJson } from './files.js';
import { SetupManager } from './setup.js';
import {worldStatus,bodyStatus,bodyRequest,delay} from './world.js';
import { checkEmptyWorld } from './world-idle.js';
import {VERSION} from './version.js';
import {LifeManager} from './life.js';
export class CompanionService {
  constructor(root, host) {
    this.store = new ConfigStore(root); this.root = this.store.paths.root; this.host = host; this.errors = [];
    this.character = host ? new CharacterSession(this.root, host) : null;
    this.life = new LifeManager(this.store,host,this.character);
    this.channels = createAdapters(this.store, input => { if (!this.character) throw new Error('DSH session service unavailable'); return this.character.receive(input); }, e => this.report(e));
    if (this.character) this.character.send = (route, text) => this.channels.send(route, text);
    this.setup = new SetupManager(this.store,{
      connected:async id=>{if(this.closed)return;await syncPlatformFiles(this.store);if(!this.closed)await this.channels.refresh({forceId:id});},
      startWorld:async signal=>{const result=await this.channels.adapters.mc.actions.up({signal});await this.channels.probe('mc');return result;},
      beforeSwitch:async target=>{
        const {mc}=await this.store.read();
        const sameDirectory=mc.serverDir&&target.directory&&path.resolve(mc.serverDir).toLowerCase()===path.resolve(target.directory).toLowerCase();
        const sameNetwork=mc.host===target.host&&mc.port===target.port;
        if(!sameDirectory&&!sameNetwork&&mc.source!=='lan'&&mc.serverDir){const current=await worldStatus(this.root,mc);if(current.owned&&['online','starting'].includes(current.state))throw new Error('请先关闭当前世界，再切换来源或版本；旧世界会保留。');}
        if(!sameDirectory&&!sameNetwork&&await bodyStatus(this.root,mc)){await bodyRequest(this.root,mc,'/shutdown',{});await delay(700);}
      },
    });
    this.hostModel={state:'unknown',available:null,message:'先确认 DSH 自己能正常聊天；插件不需要另外填 key。'};
  }
  report(e) { this.errors.push({ at: new Date().toISOString(), message: String(e.message || e).slice(0,300) }); this.errors = this.errors.slice(-10); }
  async init() {
    await initialize(this.root);
    try {await this.setup.init();}catch(e){this.report(e);}
    try { await syncPlatformFiles(this.store); } catch (e) { this.report(e); }
    if (this.host) {
      await this.channels.refresh().catch(e => this.report(e));
      await this.life.sync().catch(e=>this.report(e));
      this.timer = setInterval(() => this.tick().catch(e => this.report(e)), 3000); this.timer.unref();
    }
  }
  async tick() {
    if (this.busy || this.closed) return; this.busy = true;
    try {
      if (!this.lastProbeAt || Date.now() - this.lastProbeAt > 15000) {
        this.lastProbeAt = Date.now();
        const cfg = await this.store.read();
        await Promise.allSettled(Object.keys(this.channels.adapters).filter(id => cfg[id].enabled).map(id => this.channels.probe(id).catch(e => this.report(e))));
        if(this.channels.adapters.qq.status.ok&&this.setup.status().qq?.phase==='waiting-login')await this.setup.mark('qq',{phase:'complete'});
      }
      const scheduleResult = await tickSchedules(this.store, this.character, channel => channel === 'dsh' || this.channels.adapters[channel]?.status.ok);
      for (const error of scheduleResult?.errors || []) this.report(new Error(typeof error === 'string' ? error : error.error || error.message || 'Schedule failed'));
      await this.life.sync();
      const cfg = await this.store.read(); if (!cfg.mc.enabled) return;
      // 世界里没人太久就关掉，别让一个空世界一直占着内存。
      // 这属于正常行为，不写进「最近的问题」；原因记在 world-idle.json。
      try{ await checkEmptyWorld({ root: this.store.paths.root, cfg: cfg.mc, stateFile: path.join(this.store.paths.root,'world-idle.json') }); }
      catch(e){ this.report(e); }
      const p = this.store.paths, cursorFile = path.join(p.root, 'event-cursor.json');
      const cursor = await readJson(cursorFile, { offset: 0 }); const st = await fs.stat(p.events).catch(() => null); if (!st) return;
      if (cursor.offset > st.size) cursor.offset = 0;
      const handle = await fs.open(p.events, 'r'); const buf = Buffer.alloc(Math.min(128 * 1024, st.size - cursor.offset));
      try { await handle.read(buf, 0, buf.length, cursor.offset); } finally { await handle.close(); }
      const end = buf.lastIndexOf(10); if (end < 0) return;
      cursor.offset += end + 1; await writeJson(cursorFile, cursor);
      for (const line of buf.subarray(0,end).toString('utf8').split('\n').filter(Boolean)) {
        const event = JSON.parse(line); if (event.channel !== 'mc' || event.kind !== 'world' || Date.now() - event.at > 60000) continue;
        await this.character.receive({ ...event, text: validText(event.text) });
      }
    } finally { this.busy = false; }
  }
  async request(method, route, body = {}) {
    if(method==='GET'&&route==='/host-model')return this.checkHostModel();
    if(method==='GET'&&route==='/setup/mc/versions')return this.setup.versionCatalog();
    if(method==='GET'&&route==='/setup/qq/trust')return this.setup.qqTrust();
    if(method==='GET'&&route==='/setup/qq/login')return this.setup.qqLogin();
    if (method === 'GET' && route === '/setup') return this.setup.status();
    if (method === 'POST' && route === '/setup/mc') return this.setup.startMinecraft(body);
    if (method === 'POST' && route === '/setup/skin') return this.setup.applySkin(body);
    if (method === 'POST' && route === '/setup/qq') return this.setup.startQQ(body);
    if (method === 'POST' && route === '/setup/qq/open') return this.setup.openQQInstaller(body);
    if (method === 'POST' && route === '/setup/qq/launch') return this.setup.resumeQQ(body);
    if (method === 'POST' && route === '/setup/qq/check') {const result=await this.channels.probe('qq');if(result.ok)await this.setup.mark('qq',{phase:'complete'});return result;}
    if (method === 'POST' && route === '/setup/bili/start') return this.setup.startBili();
    if (method === 'POST' && route === '/setup/bili/poll') return this.setup.pollBili(body);
    if (method === 'POST' && route === '/setup/cancel') return this.setup.cancel(body);
    if (method === 'GET' && route === '/config') return this.store.public();
    if(method==='GET'&&route==='/life')return this.life.status();
    if(method==='POST'&&route==='/life'){
     // 兼容两种提交：整份 life 设置，或 { life, mc } 一起交上来。
     const patch=body&&typeof body==='object'&&body.life?{life:body.life,mc:body.mc}:{life:body};
     if(patch.mc)patch.mc={autoStopEmptyMinutes:patch.mc.autoStopEmptyMinutes};
     await this.store.save(patch);await this.life.sync();return this.life.status();
   }
    if (method === 'POST' && route === '/config') { const c = await this.store.save(body); await syncPlatformFiles(this.store); await this.channels.refresh(); return { ok: true, config: c }; }
    if (method === 'POST' && route === '/credentials') { const r = await this.store.saveSecrets(body.id, body.values); await syncPlatformFiles(this.store); await this.channels.refresh({ forceId: body.id }); return r; }
    if (method === 'GET' && route === '/persona') return readPersona(this.root);
    if (method === 'POST' && route === '/persona') return savePersona(this.root, body.text);
    if (method === 'GET' && route === '/templates') return Object.fromEntries(await Promise.all(['template','example'].map(async k => [k, await fs.readFile(path.join(this.store.paths.templates, `persona.${k}.md`), 'utf8')])));
    if (method === 'GET' && route === '/writings') return writings(this.root);
    if (route === '/schedules' && method === 'GET') return loadSchedules(this.root);
    if (route === '/schedules' && method === 'POST') return saveSchedule(this.root, body);
    if (route.startsWith('/media')) {
      if (!(await this.store.read()).media.enabled) throw new Error('Media is disabled / 请先启用媒体');
      if (route === '/media' && method === 'GET') return listMedia(this.root);
      if (route === '/media' && method === 'POST') return uploadMedia(this.root, body);
      if (route === '/media/file' && method === 'GET') return readMedia(this.root, body.id);
      if (route === '/media/remove' && method === 'POST') return removeMedia(this.root, body.id);
    }
    if (method === 'GET' && route === '/status') return { version: VERSION,hostModel:this.hostModel, channels: Object.fromEntries(Object.values(this.channels.adapters).map(a => [a.id, { ...a.status, label: a.label, schema: a.schema }])), errors: this.errors, hostAvailable: Boolean(this.host) };
    if (method === 'POST' && route === '/deps') return dependencies(await this.store.read());
    if (method === 'POST' && route === '/session') {
      if (!this.character) throw new Error('Open this plugin inside DSH / 请在 DSH 中打开插件');
      if (!(await readPersona(this.root)).text.trim()) throw new Error('Save a persona first / 请先保存人设');
      const readiness=await this.checkHostModel();if(readiness.state==='unconfigured')throw new Error(readiness.message);
      return { sessionId: await this.character.ensure() };
    }
    if (method === 'POST' && route === '/chat') {
      if (!this.character) throw new Error('DSH session service unavailable');
      if (!(await readPersona(this.root)).text.trim()) throw new Error('Save a persona first');
      const readiness=await this.checkHostModel();if(readiness.state==='unconfigured')throw new Error(readiness.message);
      const answer=await this.character.receive({ id: randomUUID(), channel: 'dsh', text: validText(body.text) });await this.checkHostModel();return answer;
    }
    const match = /^\/adapters\/(mc|qq|xhh|bili)\/(probe|actions\/([a-z]+))$/.exec(route);
    if (method === 'POST' && match) {
      const [, id, op, action] = match;
      if (op === 'probe') return this.channels.probe(id);
      const cfg = await this.store.read(); if (!cfg[id].enabled && action !== 'disconnect') throw new Error('Enable this channel first / 请先启用该通道');
      const actions = this.channels.adapters[id].actions; if (!Object.hasOwn(actions, action)) throw new Error('Unsupported action'); const fn = actions[action];
      return fn(body);
    }
    throw new Error('Unknown endpoint');
  }
  async checkHostModel(){
    const unknown={state:'unknown',available:null,message:'暂时无法确认宿主状态。先确认 DSH 自己能正常聊天；插件不需要另外填 key。',checkedAt:new Date().toISOString()};
    let timer;try{const result=await Promise.race([Promise.resolve().then(()=>this.host?.modelStatus?.()||unknown),new Promise(resolve=>{timer=setTimeout(()=>resolve(unknown),4000);})]);
      this.hostModel=['available','unconfigured','unknown'].includes(result?.state)?{...result,available:result.state==='available'?true:result.state==='unconfigured'?false:null}:unknown;
    }catch{this.hostModel=unknown;}finally{clearTimeout(timer);}return this.hostModel;
  }
  close() { this.closed = true; clearInterval(this.timer); this.setup.close(); this.channels.close(); return this.life.close().catch(e=>this.report(e)).finally(()=>this.character?.close()); }
}
