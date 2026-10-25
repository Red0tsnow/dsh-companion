import path from 'node:path';
import { writeJson } from './files.js';
export async function syncPlatformFiles(store) {
  const cfg = await store.read(), secrets = await store.secrets(), p = store.paths;
  await writeJson(path.join(p.bili, 'credentials.json'), secrets.bili || {});
  await writeJson(path.join(p.bili, 'config.json'), { persona: { name: cfg.character.name, ownerTitle: cfg.owner.callName }, owner: { mid: '', name: cfg.owner.callName }, notify: { type: 'none' }, share: { enabled: false } });
  await writeJson(path.join(p.xhh, 'xhh-cookie.json'), { ...(secrets.xhh || {}), tokenid: secrets.xhh?.x_xhh_tokenid, cookies: secrets.xhh?.pkey ? { pkey: secrets.xhh.pkey, user_pkey: secrets.xhh.pkey, x_xhh_tokenid: secrets.xhh.x_xhh_tokenid || '' } : {} });
}
