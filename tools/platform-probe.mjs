import { SECRETS } from './runtime.mjs';
const id = process.argv[2];
try {
  if (id === 'bili') {
    const c = SECRETS.bili || {};
    if (!c.sessdata) console.log(JSON.stringify({ state: 'unconfigured' }));
    else {
      const r = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://www.bilibili.com/', cookie: `SESSDATA=${c.sessdata}; bili_jct=${c.bili_jct || ''}; buvid3=${c.buvid3 || ''}` }, signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      console.log(JSON.stringify(j.code === 0 && j.data?.isLogin ? { state: 'online', account: j.data.uname, id: String(j.data.mid) } : { state: j.code === -101 || j.data?.isLogin === false ? 'expired' : 'error', code: j.code }));
    }
  } else throw new Error('Unknown channel');
} catch { console.log(JSON.stringify({ state: 'offline' })); }
