// Pure survival decisions: no bot, filesystem, timers, or model dependencies.
export const HOSTILES = new Set(['creeper','zombie','husk','drowned','skeleton','stray','bogged','spider','cave_spider','witch','slime','magma_cube','phantom','pillager','vindicator','evoker','ravager','silverfish','endermite','guardian','elder_guardian','blaze','ghast','wither_skeleton','wither','warden','piglin_brute','zoglin','breeze']);
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function awayFrom(position, threat, blocks) {
  const dx=position.x-threat.x, dz=position.z-threat.z, length=Math.hypot(dx,dz);
  return {x:position.x+(length?dx/length:1)*blocks,y:position.y,z:position.z+(length?dz/length:0)*blocks};
}
export function decideReflex({position,health,entities=[],now=Date.now(),lastAt=null}) {
  if (!position || (lastAt!==null && now-lastAt<4000)) return null;
  const near=entities.filter(e=>e.position&&HOSTILES.has(e.name)).map(e=>({...e,distance:distance(position,e.position)})).sort((a,b)=>a.distance-b.distance);
  const creeper=near.find(e=>e.name==='creeper'&&e.distance<=4);
  const threat=creeper || (health<=6 ? near.find(e=>e.distance<=10) : null);
  if (!threat) return null;
  const reason=creeper?'creeper':'low_health', blocks=creeper?7:8;
  return {reason,threat:threat.name,at:now,target:awayFrom(position,threat.position,blocks)};
}
