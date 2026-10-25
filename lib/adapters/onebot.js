// Independently implemented from the public OneBot v11 protocol. No other QQ plugin code.
import WebSocket from 'ws';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
export class OneBot extends EventEmitter {
  constructor({ url, token = '', reconnect = true }) { super(); this.url = url; this.token = token; this.reconnect = reconnect; this.pending = new Map(); this.closed = false; this.attempt = 0; this.generation = 0; }
  connect() {
    if (this.closed) return Promise.reject(new Error('QQ connection is stopped / QQ 连接已停止'));
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connecting) return this.connecting;
    clearTimeout(this.timer); this.timer = null;
    let resolve, reject;
    const promise = new Promise((yes,no) => { resolve = yes; reject = no; });
    const connection = { generation:++this.generation, resolve, reject, promise, settled:false, ws:null };
    this.active = connection; this.connecting = promise;
    let ws;
    try { ws = connection.ws = this.socket = new WebSocket(this.url, { headers:this.token ? {Authorization:`Bearer ${this.token}`} : {}, handshakeTimeout:5000, maxPayload:512*1024 }); }
    catch { this.finish(connection,new Error('Invalid QQ connection address / QQ 连接地址无效'),false); return promise; }
    ws.once('open', () => {
      if (this.active !== connection || this.closed) { ws.terminate(); return; }
      this.attempt = 0; this.settleConnection(connection); this.emit('state','online');
    });
    ws.on('error', () => this.finish(connection,new Error('QQ connection failed / QQ 连接失败')));
    ws.on('close', () => this.finish(connection,new Error('QQ disconnected / QQ 已断开')));
    ws.on('message', raw => {
      if (this.active !== connection || this.closed) return;
      let message; try { message = JSON.parse(raw); } catch { return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return;
      if (typeof message.echo === 'string' && this.pending.has(message.echo)) {
        const pending = this.pending.get(message.echo); this.pending.delete(message.echo); clearTimeout(pending.timer);
        if (message.status === 'ok' && message.retcode === 0) pending.resolve(message.data);
        else pending.reject(new Error(`OneBot action failed (${Number.isFinite(message.retcode) ? message.retcode : 'invalid response'})`));
      } else if (typeof message.post_type === 'string') this.emit('event',message);
    });
    return promise;
  }
  settleConnection(connection,error) {
    if (connection.settled) return;
    connection.settled = true;
    if (this.connecting === connection.promise) this.connecting = null;
    if (error) connection.reject(error); else connection.resolve();
  }
  rejectPending(error) {
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
    this.pending.clear();
  }
  finish(connection,error,retry = true) {
    if (this.active !== connection) return;
    this.active = null; this.socket = null;
    this.settleConnection(connection,error); this.rejectPending(error);
    connection.ws?.terminate(); this.emit('state','offline');
    if (retry && this.reconnect && !this.closed) {
      const generation = this.generation;
      this.timer = setTimeout(() => {
        this.timer = null;
        if (!this.closed && this.generation === generation && !this.active) this.connect().catch(() => {});
      },Math.min(30000,1000*2**Math.min(this.attempt++,5)));
      this.timer.unref();
    }
  }
  async call(action, params = {}, timeoutMs = 6000) {
    if (typeof action !== 'string' || !/^[a-zA-Z0-9_]+$/.test(action)) throw new Error('Invalid OneBot action');
    await this.connect();
    const socket = this.socket;
    if (this.closed || !socket || socket.readyState !== WebSocket.OPEN) throw new Error('QQ disconnected');
    const echo = randomUUID(), timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs,120000) : 6000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(echo); reject(new Error('OneBot request timed out')); }, timeout);
      this.pending.set(echo, { resolve, reject, timer });
      const fail = () => { clearTimeout(timer); this.pending.delete(echo); reject(new Error('QQ send failed')); };
      try { socket.send(JSON.stringify({action,params,echo}),err => { if (err) fail(); }); } catch { fail(); }
    });
  }
  close() {
    if (this.closed) return;
    this.closed = true; clearTimeout(this.timer); this.timer = null; this.generation++;
    const connection = this.active; this.active = null; this.socket = null;
    const error = new Error('QQ connection is stopped / QQ 连接已停止');
    if (connection) this.settleConnection(connection,error);
    this.rejectPending(error); connection?.ws?.terminate(); this.emit('state','offline');
  }
}
