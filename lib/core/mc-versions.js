import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const data=require('minecraft-data');
export const minimumWorldVersion='1.21.8';
const parts=id=>/^\d+(?:\.\d+){1,2}$/.test(id)?id.split('.').map(Number):null;
export function compareVersions(a,b){const aa=parts(a)||[],bb=parts(b)||[];for(let i=0;i<Math.max(aa.length,bb.length);i++){const delta=(aa[i]||0)-(bb[i]||0);if(delta)return delta;}return 0;}
export function bodySupportsVersion(id){return !id||data.supportedVersions.pc.includes(id);}
export function buildVersionCatalog(manifest,supported=data.supportedVersions.pc){
  const body=new Set(supported),versions=(manifest?.versions||[]).filter(v=>{const numeric=/^\d+(?:\.\d+){1,2}/.exec(v.id||'')?.[0];return numeric&&compareVersions(numeric,minimumWorldVersion)>=0;}).map(v=>({id:v.id,type:v.type,releaseTime:v.releaseTime||null,state:v.type==='release'&&parts(v.id)?body.has(v.id)?'supported':'server-only':'unavailable'}));
  versions.sort((a,b)=>{const at=Date.parse(a.releaseTime),bt=Date.parse(b.releaseTime);return Number.isFinite(at)&&Number.isFinite(bt)&&at!==bt?bt-at:compareVersions(b.id.split('-')[0],a.id.split('-')[0]);});
  return {defaultVersion:versions.find(v=>v.state==='supported')?.id||null,minimumVersion:minimumWorldVersion,versions};
}
