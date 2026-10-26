import {ROOT,CONFIG} from '../runtime.mjs';
import {lifeGate} from '../../lib/core/life.js';
const [cmd,feature]=process.argv.slice(2);
try{if(cmd!=='gate')throw new Error('life gate selfplay|reachout|diary');console.log(JSON.stringify(await lifeGate(ROOT,feature,CONFIG)));}catch(e){console.error(e.message);process.exitCode=1;}
