import fs from 'node:fs/promises';
import path from 'node:path';
import {exec} from './runner.js';
import {javaRuntime,portOpen,processFacts} from './world.js';
export function javaMajor(version){return Number(/(?:version\s+\"?)?(\d+)/.exec(version||'')?.[1])||0;}
export async function inspectJar(file){const {stdout}=await exec('tar',['-xOf',file,'version.json'],{windowsHide:true,timeout:6000,maxBuffer:128*1024});return JSON.parse(stdout);}
export async function inspectExistingWorld(directory,options={}){
  const checks=[],result={ok:false,checks,directory:path.resolve(directory||'.')};
  const add=(id,ok,message)=>checks.push({id,ok,message});
  let properties='',metadata;
  const folder=await fs.stat(result.directory).catch(()=>null);add('directory',Boolean(folder?.isDirectory()),folder?.isDirectory()?'目录可读':'请选择已有服务端所在的文件夹');
  const file=path.join(result.directory,'server.jar'),jar=await fs.stat(file).catch(()=>null);add('jar',Boolean(jar?.isFile()),jar?.isFile()?'找到 server.jar':'目录里缺少 server.jar');
  try{properties=await fs.readFile(path.join(result.directory,'server.properties'),'utf8');const configured=/^\s*server-port\s*=\s*(.*?)\s*$/m.exec(properties);result.port=configured?Number(configured[1]):25565;const valid=Number.isInteger(result.port)&&result.port>0&&result.port<65536;add('properties',valid,valid?`已读取游戏端口 ${result.port}`:'server.properties 的游戏端口无效，请在原文件中修正');}catch{add('properties',false,'目录里缺少可读取的 server.properties');}
  try{const text=await fs.readFile(path.join(result.directory,'eula.txt'),'utf8');add('eula',/^eula=true\s*$/m.test(text),'需要由你在原服务端完成 Minecraft 协议确认，插件不会代写');}catch{add('eula',false,'服务端尚未完成 Minecraft 协议确认，插件不会代写 eula.txt');}
  if(jar?.isFile())try{metadata=await(options.inspectJar||inspectJar)(file);result.version=metadata.id;result.javaMajor=metadata.java_version;add('version',Boolean(result.version&&Number.isInteger(result.javaMajor)),'已读取服务端版本与 Java 要求');}catch{add('version',false,'无法识别 jar 版本，请在高级设置中配置该服务端');}
  try{const runtime=await(options.java||javaRuntime)(options.javaPath);result.javaPath=runtime.file;add('java',Boolean(result.javaMajor&&javaMajor(runtime.version)>=result.javaMajor),result.javaMajor?`此世界需要 Java ${result.javaMajor}，当前为 Java ${javaMajor(runtime.version)}`:'先确认服务端版本后再检查 Java');}catch{add('java',false,'没有找到可用的 Java，请在高级设置中指定或安装对应版本');}
  if(result.port){const open=await(options.portOpen||portOpen)('127.0.0.1',result.port);let recognized=!open;if(open)try{const facts=await(options.processFacts||processFacts)(result.port);recognized=facts.processes.some(p=>p.pid===facts.listenerPid&&p.jar&&path.resolve(p.jar).toLowerCase()===file.toLowerCase());}catch{}
    add('port',recognized,open?(recognized?'已识别正在运行的同一服务端，不会接管其停止权限':'游戏端口被其他进程占用，请关闭占用或修改原服务端端口'):'游戏端口可用');}
  result.ok=checks.every(c=>c.ok);return result;
}
