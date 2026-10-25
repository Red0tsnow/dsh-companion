import { ROOT, P } from '../../runtime.mjs';
import path from 'node:path';
export const HOME = ROOT;
export const DSH_HOME = P.bili;
export const configPath = path.join(P.bili, 'config.json');
export const credentialsPath = path.join(P.bili, 'credentials.json');
export function dshPath(...parts) {
  const mapping = { 'whale-diary.md': 'diary.md', 'whale-diary-private.md': 'diary-private.md' };
  if (mapping[parts[0]]) return path.join(P.work, mapping[parts[0]], ...parts.slice(1));
  if (parts[0] === 'whale-work') return path.join(P.work, ...parts.slice(1));
  if (parts[0] === 'bili-whale.config.json') return configPath;
  return path.join(P.bili, ...parts);
}
export const homePath = (...parts) => parts[0] === '.bili-ai' || parts[0] === 'bili' ? path.join(P.bili, ...parts.slice(1)) : path.join(ROOT, ...parts);
