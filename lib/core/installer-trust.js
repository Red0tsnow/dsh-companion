import fs from 'node:fs/promises';
import {exec} from './runner.js';
export class InstallerTrustError extends Error {
  constructor(message){super(message);this.manualRequired=true;this.code='INSTALLER_NOT_TRUSTED';}
}
export async function knownGood(){return JSON.parse(await fs.readFile(new URL('../../tools/known-good.json',import.meta.url),'utf8'));}
export function assertPinnedRelease(release,pin){
  const asset=release?.assets?.find(a=>a.name===pin.asset);
  if(release?.tag_name!==pin.version||!asset||asset.digest?.toLowerCase()!==`sha256:${pin.sha256.toLowerCase()}`)throw new InstallerTrustError('Upstream release changed; wait for a plugin update / 上游有新版本，请等待插件更新');
  return asset;
}
export function assertAuthenticode(signature,pin){
  if(signature?.status!=='Valid')throw new InstallerTrustError('Installer signature is not valid; install manually / 安装助手签名未通过，请使用手动安装说明');
  if(pin.automaticExecution!==true||!pin.publisherSubject||signature.subject!==pin.publisherSubject)throw new InstallerTrustError('Installer publisher is not verified; install manually / 安装助手发布者未通过核实，请使用手动安装说明');
}
export async function authenticode(file){
  const script='$s = Get-AuthenticodeSignature -LiteralPath $env:COMPANION_INSTALLER; @{status=$s.Status.ToString();subject=$s.SignerCertificate.Subject} | ConvertTo-Json -Compress';
  const {stdout}=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:15000,env:{...process.env,COMPANION_INSTALLER:file}});return JSON.parse(stdout);
}
