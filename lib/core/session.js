import { randomUUID } from 'node:crypto';
import { paths } from './paths.js';
import { readJson, writeJson, serialized } from './files.js';

export class CharacterSession {
  constructor(root, host) { this.root = root; this.host = host; this.file = paths(root).state; this.closed = false; this.pending = 0; this.lastActivityAt = 0; this.controller = new AbortController(); }
  ensure() {
    return serialized(`${this.file}:identity`, async () => {
      const state = await readJson(this.file);
      if (state.sessionId) {
        if (!(await this.host.exists(state.sessionId))) throw new Error('Saved character session is unavailable; restore it in DSH / 角色会话不可用，请在 DSH 恢复');
        await this.host.activate?.(state.sessionId);
        return state.sessionId;
      }
      const created = await this.host.create({ cwd: paths(this.root).work, sessionId: `companion-${randomUUID()}` });
      const sessionId = created.sessionId || created.id;
      if (!sessionId) throw new Error('Host returned no session identity');
      await writeJson(this.file, { ...state, sessionId }); await this.host.activate?.(sessionId); return sessionId;
    });
  }
  receive(input) {
    if (this.closed) return Promise.reject(new Error('Companion is stopped'));
    if (this.pending >= 32) return Promise.reject(new Error('Character queue is full'));
    this.pending++;
    return serialized(`${this.file}:turn`, async () => {
      if (this.closed) throw new Error('Companion is stopped');
      const persistentId = await this.ensure(); const state = await readJson(this.file);
      const key = `${input.channel}:${input.id}`;
      if (state.received?.includes(key)) return { duplicate: true };
      // Claim before delivery. Ambiguous failures are recorded, never auto-replayed to outside channels.
      this.lastActivityAt = Date.now();
      state.received = [...(state.received || []), key].slice(-2000); state.lastActivityAt = this.lastActivityAt; await writeJson(this.file, state);
      try {
        const mode = input.mode || 'resume';
        if (!['resume', 'fork', 'new'].includes(mode)) throw new Error('Invalid session target mode');
        const created = mode === 'fork' ? await this.host.fork(persistentId) : mode === 'new' ? await this.host.create({ cwd: paths(this.root).work }) : null;
        const sessionId = created ? created.sessionId || created.id : persistentId;
        if (!sessionId) throw new Error('Host returned no session target identity');
        const answer = await this.host.turn(sessionId, input, this.controller.signal);
        if (answer && this.send && input.channel !== 'dsh' && !this.closed) await this.send(input, answer);
        return { ok: true, text: answer || '', sessionId };
      } catch (e) { const latest = await readJson(this.file); await writeJson(this.file, { ...latest, lastFailure: { key, message: String(e.message), at: new Date().toISOString() } }); throw e; }
    }).finally(() => { this.pending--; this.lastActivityAt = Date.now(); });
  }
  close() { this.closed = true; this.controller.abort(); this.host.close?.(); }
}
