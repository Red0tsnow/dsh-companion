// Acceptance is independent of a skill's exit code and its own success messages.
export function evaluateSkill(expect,before,after) {
  if(expect===null||expect===undefined)return {status:'unverified',ok:false,reason:'未验收 / No acceptance criteria'};
  const fail=reason=>({status:'failed',ok:false,reason});
  if(!expect||typeof expect!=='object'||Array.isArray(expect)||Object.keys(expect).some(k=>!['inventoryDelta','movedAtLeast','healthAtLeast'].includes(k)))return fail('验收条件无效 / Invalid acceptance criteria');
  const checks=[];
  if(Object.hasOwn(expect,'inventoryDelta')){
    const values=expect.inventoryDelta;if(!values||typeof values!=='object'||Array.isArray(values)||!Object.keys(values).length)return fail('背包验收条件为空 / Empty inventory criteria');
    for(const [name,amount] of Object.entries(values)){if(!/^[a-z0-9_]+$/.test(name)||!Number.isFinite(amount)||amount<=0)return fail('背包验收条件无效 / Invalid inventory criteria');checks.push({kind:'inventoryDelta',name,expected:amount,actual:(after?.inventory?.[name]||0)-(before?.inventory?.[name]||0)});}
  }
  if(Object.hasOwn(expect,'movedAtLeast')){if(!Number.isFinite(expect.movedAtLeast)||expect.movedAtLeast<=0)return fail('移动验收条件无效 / Invalid movement criteria');const same=before?.dimension===after?.dimension&&before?.position?.length===3&&after?.position?.length===3;checks.push({kind:'movedAtLeast',expected:expect.movedAtLeast,actual:same?Math.hypot(...after.position.map((v,i)=>v-before.position[i])):0});}
  if(Object.hasOwn(expect,'healthAtLeast')){if(!Number.isFinite(expect.healthAtLeast)||expect.healthAtLeast<0||expect.healthAtLeast>20)return fail('血量验收条件无效 / Invalid health criteria');checks.push({kind:'healthAtLeast',expected:expect.healthAtLeast,actual:after?.health??-1});}
  if(!checks.length)return fail('验收条件为空 / Empty acceptance criteria');
  if(!before?.online||!after?.online)return fail('验收时身体离线 / Body offline during acceptance');
  const ok=checks.every(c=>Number.isFinite(c.actual)&&c.actual>=c.expected);
  return {status:ok?'passed':'failed',ok,reason:ok?'验收通过 / Acceptance passed':'未达到验收条件 / Acceptance not met',checks};
}
