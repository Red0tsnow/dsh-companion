import React from 'react';
import { Panel } from './panel.jsx';
export const inject = ['slots'];
export function apply(ctx) {
  const open = sessionId => {
    const workspace = ctx.get?.('uiWorkspace') || ctx.uiWorkspace;
    if (!workspace?.openSession) throw new Error('Open the character session in DSH / 请在 DSH 中打开角色会话');
    return workspace.openSession(sessionId);
  };
  ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-companion', order: 7, label: () => '鲸屋 / Whale House' }, ({ close }) => <Panel onOpenSession={async sessionId => { await open(sessionId); close?.(); }}/>), 'dsh-companion settings'), 'dsh-companion settings');
}
export { Panel };
