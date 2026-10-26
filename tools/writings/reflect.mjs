import {ROOT,CONFIG} from '../runtime.mjs';
import {reflectStatus,markReflect} from '../../lib/core/reflect.js';
const [cmd='status',kind,...rest]=process.argv.slice(2);
const zone=CONFIG.life.timeZone;
try{
  if(cmd==='status'||cmd==='show'){
    const features=kind?[kind]:['memory','persona','rules'];
    for(const f of features){
      const s=await reflectStatus(ROOT,f,zone);
      console.log(JSON.stringify(s,null,2));
    }
  }else if(cmd==='mark'){
    if(!kind)throw new Error('reflect mark memory|persona|rules "text" [--skip]');
    const skip=rest.includes('--skip');
    console.log(JSON.stringify(await markReflect(ROOT,kind,{text:rest.filter(x=>x!=='--skip').join(' '),skip,zone})));
  }else if(cmd==='gate'){
    if(!kind)throw new Error('reflect gate memory|persona|rules');
    const {lifeGate}=await import('../../lib/core/life.js');
    console.log(JSON.stringify(await lifeGate(ROOT,kind,CONFIG)));
  }else throw new Error('reflect status|show [feature] | mark <feature> "text" [--skip] | gate <feature>');
}catch(e){console.error(e.message);process.exitCode=e.code==='DAILY_DUPLICATE'?3:1;}
