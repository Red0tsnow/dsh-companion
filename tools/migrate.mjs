import { migrate } from '../lib/core/migration.js';
import { dataRoot } from '../lib/core/paths.js';
const args = process.argv.slice(2);
const usage = 'Usage: node tools/migrate.mjs [--source <legacy DSH root>] [--target <companion data root>] [--apply] [--credentials]\nWithout --apply, this command only previews files. Originals and existing destination files are preserved.\n--credentials explicitly includes selected account credentials; credential values are never printed.';
try {
  if (args.includes('--help') || args.includes('-h')) console.log(usage);
  else {
    const values = {}, flags = new Set();
    for (let i=0;i<args.length;i++) {
      const arg = args[i];
      if (['--source','--target'].includes(arg)) {
        if (Object.hasOwn(values,arg) || !args[i+1] || args[i+1].startsWith('--')) throw new Error(`Missing or duplicate value for ${arg}`);
        values[arg] = args[++i];
      } else if (['--apply','--credentials'].includes(arg)) flags.add(arg);
      else throw new Error(`Unknown option: ${arg}`);
    }
    console.log(JSON.stringify(await migrate({ source:values['--source'], target:values['--target'] || dataRoot(), apply:flags.has('--apply'), credentials:flags.has('--credentials') }), null, 2));
  }
}
catch (e) { console.error(e.message); process.exitCode = 1; }
