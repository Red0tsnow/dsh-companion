import { ConfigStore } from '../../lib/core/config.js';
import { dataRoot } from '../../lib/core/paths.js';
import { worldAction, supervise } from '../../lib/core/world.js';
const root = dataRoot();
try {
  const cfg = await new ConfigStore(root).read(); const cmd = process.argv[2] || 'status';
  if (cmd === '_supervise') await supervise(root, cfg);
  else console.log(JSON.stringify(await worldAction(root, cfg, cmd)));
} catch (e) { console.error(JSON.stringify({ ok: false, error: e.message })); process.exitCode = 1; }
