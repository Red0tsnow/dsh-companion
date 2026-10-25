import React, { useEffect, useRef, useState } from 'react';

const copy={
  zh:{
    mcStart:'开始一起玩',qqStart:'连接 QQ',biliStart:'扫码连接 B站',xhhStart:'查看接入方式',guide:'连接向导',
    mcTitle:'一起进入世界',mcIntro:'你已经有世界了吗？选择适合你的方式。',
    managed:'没有，帮我准备一个（推荐）',lan:'我自己开一个，对局域网开放',existing:'我已经有服务端目录',
    version:'你选择的版本',supported:'身体支持，可以一起玩',serverOnly:'只可建世界，身体暂不支持',unavailable:'不可选',versionsLoading:'正在读取官方版本清单…',
    mcVersion:'准备你选择的版本，下载和首次开世界可能需要几分钟。换版本将新建世界，旧世界保留在原目录。',
    serverOnlyConfirm:'我知道该版本身体暂不支持，只创建世界',lanHelp:'先在游戏里：进入单人世界 → Esc → 对局域网开放 → 再回来点重试。',
    modWarning:'装了模组的客户端，她的身体可能因注册表不一致被踢；建议用原版客户端。',findLan:'查找并进入世界',directory:'已有服务端目录',java:'Java 路径（留空自动检测）',inspect:'检查并进入世界',
    'discovering-lan':'正在查找局域网世界（最多 4 秒）…','checking-existing':'正在逐项检查已有服务端…','server-only-ready':'世界已开启；该版本身体暂不支持。',
    manual:'请自行安装 NapCat，然后在下方高级设置填写连接地址。',manualLink:'打开 NapCat 手动安装说明',trust:'安装助手版本 / SHA-256 前 8 位',
    portableConsent:'将运行 NapCat 便携版（非官方 QQ 客户端）',portablePrepare:'准备并启动 QQ 连接',portableScan:'只需用角色 QQ 扫码，并在手机上确认登录。插件会自动检查连接。',portableQr:'QQ 登录二维码',
    'extracting-portable':'正在解压并校验 NapCat 便携版…','starting-portable':'正在启动便携版并获取登录二维码…',
    unsigned:'当前安装助手没有可验证的发布者签名，已关闭自动执行。请按手动说明安装。',execution:'我已核对显示的版本号与哈希，确认执行', 'manual-required':'自动安装已停止，请按手动说明继续。',
    consent:'允许从官方来源下载所需组件',eula:'我已阅读并同意 Minecraft 使用协议',prepare:'准备并开启世界',
    serverType:'服务端类型',vanilla:'原版（最快，无皮肤）',paper:'Paper（支持自定义皮肤）',
    skin:'给她一张皮肤',skinUrl:'皮肤图片的 https 地址',skinApply:'应用皮肤',skinNote:'应用时会短暂启动一次服务端，约一分钟；请先关闭世界。',skinDone:'皮肤已应用',
    qqTitle:'让角色来到 QQ',qqIntro:'为角色使用一个独立 QQ 账号。按这里提示的方式准备连接，并用手机扫码确认登录。',
    owner:'你的 QQ 号',self:'角色使用的 QQ 号',different:'请使用两个不同的 QQ 账号。私聊只接收你的账号；群聊可稍后设置。',
    qqPrepare:'下载连接助手',openHelper:'打开安装助手',helperInstall:'在打开的助手中完成安装，然后回到这里继续。',
    launchHelper:'安装好了，继续登录',helperLogin:'在连接助手窗口中扫码登录角色 QQ。完成后检查连接。',check:'我已登录，检查连接',
    biliTitle:'用 B站 App 扫码',biliIntro:'请使用你希望角色使用的账号扫码，并在手机上确认。登录成功后会自动保存。',
    scan:'等待扫码',confirm:'请在手机上确认登录',expired:'二维码已过期，请重新获取。',newCode:'重新获取二维码',
    complete:'已准备好，可以开始使用了。',connected:'账号已连接。',address:'在 Minecraft 多人游戏中添加这个地址',copy:'复制地址',copied:'地址已复制',
    xhhTitle:'小黑盒需要额外工具',xhhIntro:'当前版本还没有适合新手的一键登录。需要已有的兼容工具，才能在高级设置中接入。其他功能可以照常使用。',
    xhhDetail:'已有工具的用户可在高级设置中填写工具位置并测试连接。插件不提供小黑盒签名实现。',
    retry:'重新准备',cancel:'取消准备',close:'收起',preparing:'正在检查准备条件…',
    'downloading-java':'正在下载运行环境…','extracting-java':'正在准备运行环境…','downloading-world':'正在下载世界组件…',
    'preparing-world':'正在创建你的独立世界…','starting-world':'正在开启世界，等待角色进入…','downloading-helper':'正在下载 QQ 连接助手…',
    'helper-ready':'连接助手已下载。','install-helper':'等待你完成助手安装。','waiting-login':'等待角色登录 QQ。',
    error:'准备未完成，可以重试。',cancelled:'已取消准备。',interrupted:'上次准备已中断，可以重新开始。',
    qrAlt:'B站登录二维码',fetching:'正在获取登录二维码…',notConnected:'还没有连上。请确认助手中的角色 QQ 已登录，再重试。',
  },
  en:{
    mcStart:'Play together',qqStart:'Connect QQ',biliStart:'Connect Bilibili',xhhStart:'Connection requirements',guide:'Connection guide',
    mcTitle:'Enter a world together',mcIntro:'Do you already have a world? Choose how to connect.',
    managed:'Prepare a new world (recommended)',lan:'Open my singleplayer world to LAN',existing:'Use an existing server folder',
    version:'Your selected version',supported:'Character supported',serverOnly:'World only; character unsupported',unavailable:'Unavailable',versionsLoading:'Loading official versions…',
    mcVersion:'Prepare your selected version. Initial setup may take a few minutes. Changing versions creates a separate world; the old world stays in its original folder.',
    serverOnlyConfirm:'I understand the character cannot join this version',lanHelp:'In Minecraft: enter a singleplayer world → Esc → Open to LAN → return here and retry.',
    modWarning:'Modded clients may kick the character due to registry differences. A vanilla client is recommended.',findLan:'Find and join world',directory:'Existing server folder',java:'Java path (optional; auto-detect)',inspect:'Check and enter world',
    'discovering-lan':'Discovering LAN worlds (up to 4 seconds)…','checking-existing':'Checking the existing server…','server-only-ready':'World is open; this version cannot host the character yet.',
    manual:'Install NapCat yourself, then enter its connection address in advanced settings below.',manualLink:'NapCat manual installation guide',trust:'Installer version / first 8 SHA-256 characters',
    portableConsent:'Run NapCat portable (an unofficial QQ client)',portablePrepare:'Prepare and start QQ connection',portableScan:'Scan using the character QQ and confirm on your phone. The connection is checked automatically.',portableQr:'QQ login QR code',
    'extracting-portable':'Extracting and verifying NapCat portable…','starting-portable':'Starting portable runtime and requesting a login code…',
    unsigned:'This installer has no verified publisher signature. Automatic execution is disabled. Please use the manual guide.',execution:'I checked the displayed version and hash and confirm execution','manual-required':'Automatic installation stopped. Please follow the manual guide.',
    consent:'Allow required components to download from official sources',eula:'I have read and accept the Minecraft usage agreement',prepare:'Prepare and open world',
    serverType:'Server type',vanilla:'Vanilla (fastest, no skins)',paper:'Paper (supports custom skins)',
    skin:'Give her a skin',skinUrl:'Skin image https URL',skinApply:'Apply skin',skinNote:'This briefly starts the server for about a minute. Close the world first.',skinDone:'Skin applied',
    qqTitle:'Bring your character to QQ',qqIntro:'Use a separate QQ account for the character. Follow the preparation steps here and confirm login on your phone.',
    owner:'Your QQ number',self:'Character QQ number',different:'Use two different accounts. Only your private messages are accepted; groups can be set up later.',
    qqPrepare:'Download connection helper',openHelper:'Open installer',helperInstall:'Finish installation in the helper window, then return here.',
    launchHelper:'Installed, continue to login',helperLogin:'Scan the code in the helper window to log in the character, then check the connection.',check:'Logged in, check connection',
    biliTitle:'Scan with the Bilibili app',biliIntro:'Use the account you want the character to use and confirm on your phone. The confirmed login is saved automatically.',
    scan:'Waiting for scan',confirm:'Confirm login on your phone',expired:'This code expired. Request a new one.',newCode:'Get a new code',
    complete:'Ready to use.',connected:'Account connected.',address:'Add this address in Minecraft multiplayer',copy:'Copy address',copied:'Address copied',
    xhhTitle:'Heybox needs an additional tool',xhhIntro:'A beginner login flow is not available yet. A compatible external tool is required in advanced settings. Other features work independently.',
    xhhDetail:'If you already have a compatible tool, set its location in advanced settings. No Heybox signing implementation is provided.',
    retry:'Try setup again',cancel:'Cancel setup',close:'Close guide',preparing:'Checking requirements…',
    'downloading-java':'Downloading the runtime…','extracting-java':'Preparing the runtime…','downloading-world':'Downloading world components…',
    'preparing-world':'Creating your separate world…','starting-world':'Opening the world and connecting the character…','downloading-helper':'Downloading the QQ helper…',
    'helper-ready':'Connection helper downloaded.','install-helper':'Waiting for helper installation.','waiting-login':'Waiting for character login.',
    error:'Setup did not finish. You can retry.',cancelled:'Setup cancelled.',interrupted:'The previous setup was interrupted. You can restart it.',
    qrAlt:'Bilibili login QR code',fetching:'Getting a login code…',notConnected:'Not connected yet. Finish the character login in the helper and retry.',
  },
};
const friendly=(message,lang)=>lang==='zh'?String(message).split(' / ').at(-1):String(message);
export function SetupFlow({id,lang,request,onComplete,ownerId='',selfId='',online=false,configured=false,world={}}) {
  const t=copy[lang]||copy.zh;
  const [open,setOpen]=useState(false),[consent,setConsent]=useState(false),[eula,setEula]=useState(false),[owner,setOwner]=useState(ownerId),[self,setSelf]=useState(selfId);
  const [state,setState]=useState(null),[login,setLogin]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [qqLogin,setQqLogin]=useState(null);
  const [source,setSource]=useState('managed'),[catalog,setCatalog]=useState(null),[version,setVersion]=useState(''),[serverOnly,setServerOnly]=useState(false),[directory,setDirectory]=useState(''),[javaPath,setJavaPath]=useState(''),[trust,setTrust]=useState(null),[execution,setExecution]=useState(false);
  const [serverType,setServerType]=useState('vanilla'),[skinUrl,setSkinUrl]=useState(''),[skinResult,setSkinResult]=useState(null);
  const completed=useRef(null),mounted=useRef(true),completeRef=useRef(onComplete);completeRef.current=onComplete;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{if(!open){setOwner(ownerId);setSelf(selfId);}},[ownerId,selfId,open]);
  useEffect(()=>{if(!open&&id==='mc'){setSource(world.source||'managed');setDirectory(world.serverDir||'');setJavaPath(world.javaPath||'');if(world.version)setVersion(world.version);}},[open,id,world.source,world.serverDir,world.javaPath,world.version]);
  const perform=async fn=>{setBusy(true);setError('');setNotice('');try{await fn();}catch(e){if(mounted.current)setError(friendly(e.message,lang));}finally{if(mounted.current)setBusy(false);}};
  useEffect(()=>{if(!open||!['mc','qq'].includes(id)||(id==='mc'&&source!=='managed'))return;let active=true;request(id==='mc'?'/setup/mc/versions':'/setup/qq/trust').then(data=>{if(!active)return;if(id==='mc'){setCatalog(data);setVersion(v=>v||data.defaultVersion||'');}else setTrust(data);}).catch(e=>{if(active)setError(friendly(e.message,lang));});return()=>{active=false;};},[open,id,request,lang,source]);
  useEffect(()=>{
    if(!open||!['mc','qq'].includes(id))return;
    let active=true;
    const read=async()=>{if(document.hidden)return;try{const all=await request('/setup');if(!active)return;const next=all[id];if(next){setState(next);if(['complete','server-only-ready'].includes(next.phase)&&completed.current!==next.id){completed.current=next.id;await completeRef.current(id);}}}catch(e){if(active)setError(friendly(e.message,lang));}};
    read();const timer=setInterval(read,1000);return()=>{active=false;clearInterval(timer);};
  },[open,id,request,lang]);
  useEffect(()=>{
    if(!login?.id||['complete','expired'].includes(login.phase))return;
    let active=true,pending=false;
    const poll=async()=>{if(pending||document.hidden)return;pending=true;try{const result=await request('/setup/bili/poll',{id:login.id});if(!active)return;setLogin(v=>({...v,...result}));if(result.phase==='complete')await completeRef.current('bili');}catch(e){if(active){setError(friendly(e.message,lang));setLogin(v=>({...v,phase:'expired'}));}}finally{pending=false;}};
    const timer=setInterval(poll,2500);return()=>{active=false;clearInterval(timer);};
  },[login?.id,login?.phase,request,lang]);
  const newCode=()=>perform(async()=>setLogin(await request('/setup/bili/start',{})));
  useEffect(()=>{if(!open||id!=='qq'||state?.phase!=='waiting-login'||online)return;let active=true,pending=false;const read=async()=>{if(pending||document.hidden)return;pending=true;try{const data=await request('/setup/qq/login');if(active)setQqLogin(data);}catch(e){if(active)setError(friendly(e.message,lang));}finally{pending=false;}};read();const timer=setInterval(read,2000);return()=>{active=false;clearInterval(timer);};},[open,id,state?.phase,online,request,lang]);
  const begin=()=>{setOpen(true);if(id==='bili'&&!login)newCode();};
  const title=t[`${id}Title`],progress=state?.total>0?Math.min(100,Math.round(state.bytes/state.total*100)):null;
  return <div className="dsc-setup">
    {!open?<button className={`${configured?'':'primary '}dsc-start`} onClick={begin}>{configured?t.guide:t[`${id}Start`]}</button>:<>
      <div className="dsc-guide-head"><h4>{title}</h4><button className="small" onClick={()=>setOpen(false)}>{t.close}</button></div>
      {id!=='mc'&&<p className="dsc-guide-copy">{t[`${id}Intro`]}</p>}
      {id==='mc'&&<>
        <fieldset className="dsc-world-source" disabled={busy||state?.running}><legend>{t.mcIntro}</legend>{['managed','lan','existing'].map(item=><label className="dsc-check" key={item}><input type="radio" name="world-source" value={item} checked={source===item} onChange={()=>{setSource(item);setState(null);setError('');}}/>{t[item]}</label>)}</fieldset>
        {source==='managed'&&<>
          <label className="field"><span>{t.version}</span><select aria-label={t.version} value={version} onChange={e=>{setVersion(e.target.value);setServerOnly(false);}} disabled={!catalog||busy||state?.running}>
            {!catalog&&<option value="">{t.versionsLoading}</option>}{['supported','server-only','unavailable'].map(group=><optgroup key={group} label={t[group==='server-only'?'serverOnly':group]}>{catalog?.versions.filter(v=>v.state===group).map(v=><option key={v.id} value={v.id} disabled={group==='unavailable'}>{v.id}</option>)}</optgroup>)}
          </select></label><p className="dsc-note">{t.mcVersion}</p>
          <label className="field"><span>{t.serverType}</span><select aria-label={t.serverType} value={serverType} onChange={e=>setServerType(e.target.value)} disabled={busy||state?.running}><option value="vanilla">{t.vanilla}</option><option value="paper">{t.paper}</option></select></label>
          {catalog?.versions.find(v=>v.id===version)?.state==='server-only'&&<label className="dsc-check"><input type="checkbox" checked={serverOnly} onChange={e=>setServerOnly(e.target.checked)}/>{t.serverOnlyConfirm}</label>}
        </>}
        {source==='lan'&&<><p className="dsc-note">{t.lanHelp}</p><p className="dsc-warning">{t.modWarning}</p></>}
        {source==='existing'&&<><label className="field"><span>{t.directory}</span><input value={directory} onChange={e=>setDirectory(e.target.value)}/></label><label className="field"><span>{t.java}</span><input value={javaPath} onChange={e=>setJavaPath(e.target.value)}/></label></>}
        {!state?.running&&<>
          {source==='managed'&&<>
          <label className="dsc-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>{t.consent}</label>
          <label className="dsc-check"><input type="checkbox" checked={eula} onChange={e=>setEula(e.target.checked)}/><span>{t.eula} · <a href="https://www.minecraft.net/eula" target="_blank" rel="noreferrer">{lang==='zh'?'阅读协议':'Read agreement'}</a></span></label>
          </>}
          <button className="primary" disabled={busy||(source==='managed'?(!version||!consent||!eula||(catalog?.versions.find(v=>v.id===version)?.state==='server-only'&&!serverOnly)):source==='existing'?!directory.trim():false)} onClick={()=>perform(async()=>setState(await request('/setup/mc',source==='managed'?{source,version,serverType,downloadConsent:consent,eulaAccepted:eula,acknowledgeServerOnly:serverOnly}:source==='lan'?{source}:{source,directory,javaPath})))}>{source==='managed'?t.prepare:source==='lan'?t.findLan:t.inspect}</button>
        </>}
        {state?.checks&&<ul className="dsc-checks">{state.checks.map((check,i)=><li key={i} data-ok={check.ok}>{check.ok?'✓':'✕'} {friendly(check.message,lang)}</li>)}</ul>}
        {['complete','server-only-ready'].includes(state?.phase)&&state.address&&<div className="dsc-join"><p>{t.address}</p><strong>{state.address}</strong><button className="small" onClick={()=>perform(async()=>{await navigator.clipboard.writeText(state.address);setNotice(t.copied);})}>{t.copy}</button></div>}
        {serverType==='paper'&&['complete','server-only-ready'].includes(state?.phase)&&<div className="dsc-skin">
          <h5>{t.skin}</h5>
          <label className="field"><span>{t.skinUrl}</span><input value={skinUrl} onChange={e=>{setSkinUrl(e.target.value);setSkinResult(null);}} placeholder="https://…png" inputMode="url" autoComplete="off"/></label>
          <button className="small" disabled={busy||!skinUrl.trim()} onClick={()=>perform(async()=>setSkinResult(await request('/setup/skin',{url:skinUrl.trim()})))}>{t.skinApply}</button>
          <p className="dsc-note">{t.skinNote}</p>
          {skinResult?.ok&&<p className="dsc-message">{t.skinDone}</p>}
          {skinResult&&!skinResult.ok&&<p className="dsc-warning">{(skinResult.reply||[]).slice(-2).join(' ')}</p>}
        </div>}
      </>}
      {id==='qq'&&<>
        {trust&&<p className="dsc-trust">{t.trust}<br/><strong>{trust.version} · {trust.hashPrefix}</strong></p>}
        {(trust?.automaticExecution===false||state?.phase==='manual-required'||error)&&<div className="dsc-manual"><p>{trust?.automaticExecution===false?t.unsigned:t.manual}</p><a href={trust?.manualUrl||'https://napneko.github.io/guide/boot/Shell'} target="_blank" rel="noreferrer">{t.manualLink}</a></div>}
        {trust?.automaticExecution===true&&!error&&!state?.running&&!['helper-ready','install-helper','waiting-login','complete','manual-required'].includes(state?.phase)&&<>
          <label className="field"><span>{t.owner}</span><input inputMode="numeric" value={owner} onChange={e=>setOwner(e.target.value)} autoComplete="off"/></label>
          <label className="field"><span>{t.self}</span><input inputMode="numeric" value={self} onChange={e=>setSelf(e.target.value)} autoComplete="off"/></label>
          <p className="dsc-note">{t.different}</p>
          <label className="dsc-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>{t.consent}</label>
          {trust.mode==='portable'&&<label className="dsc-check"><input type="checkbox" checked={execution} onChange={e=>setExecution(e.target.checked)}/>{t.portableConsent}</label>}
          <button className="primary" disabled={!consent||(trust.mode==='portable'&&!execution)||!/^\d{5,12}$/.test(owner)||!/^\d{5,12}$/.test(self)||owner===self||busy} onClick={()=>perform(async()=>setState(await request('/setup/qq',{downloadConsent:consent,ownerId:owner,selfId:self,...(trust.mode==='portable'?{confirmExecution:execution,version:trust.version,sha256:trust.sha256}:{})})))}>{trust.mode==='portable'?t.portablePrepare:t.qqPrepare}</button>
        </>}
        {trust?.automaticExecution===true&&!error&&['helper-ready','install-helper'].includes(state?.phase)&&<><label className="dsc-check"><input type="checkbox" checked={execution} onChange={e=>setExecution(e.target.checked)}/>{t.execution}</label><div className="dsc-toolbar"><button className={state.phase==='helper-ready'?'primary':''} disabled={busy||!execution} onClick={()=>perform(async()=>setState(await request('/setup/qq/open',{confirmExecution:execution,version:trust.version,sha256:trust.sha256})))}>{t.openHelper}</button><p className="dsc-note">{t.helperInstall}</p>{state.phase==='install-helper'&&<button disabled={busy} onClick={()=>perform(async()=>{setState(await request('/setup/qq/launch',{}));await completeRef.current('qq');})}>{t.launchHelper}</button>}</div></>}
        {state?.phase==='waiting-login'&&!online&&<><p className="dsc-note">{trust?.mode==='portable'?t.portableScan:t.helperLogin}</p>{qqLogin?.image&&<figure className="dsc-qr"><img src={qqLogin.image} alt={t.portableQr} width="220" height="220"/></figure>}<button disabled={busy} onClick={()=>perform(async()=>{const result=await request('/setup/qq/check',{});if(!result.ok)throw new Error(t.notConnected);setState(v=>({...v,phase:'complete'}));await completeRef.current('qq');})}>{t.check}</button></>}
        {online&&<p className="dsc-message">{t.connected}</p>}
      </>}
      {id==='bili'&&<>
        {busy&&!login&&<p role="status">{t.fetching}</p>}
        {login&&!['expired','complete'].includes(login.phase)&&<figure className="dsc-qr"><img src={login.image} alt={t.qrAlt} width="220" height="220"/><figcaption aria-live="polite">{login.phase==='confirm-on-phone'?t.confirm:t.scan}</figcaption></figure>}
        {login?.phase==='complete'&&<p className="dsc-message" role="status">{t.connected}</p>}
        {login?.phase==='expired'&&<p className="dsc-note">{t.expired}</p>}
        {login?.phase!=='complete'&&<button disabled={busy} onClick={newCode}>{t.newCode}</button>}
      </>}
      {id==='xhh'&&<p className="dsc-note">{t.xhhDetail}</p>}
      {state&&<div className="dsc-setup-progress" aria-live="polite"><p>{t[state.phase]||t.preparing}</p>{progress!==null&&state.running&&<><progress value={progress} max="100" aria-label={t[state.phase]||t.preparing}/><span>{progress}%</span></>}{state.running&&state.phase!=='starting-world'&&<button className="small" onClick={()=>perform(()=>request('/setup/cancel',{id}))}>{t.cancel}</button>}{state.error&&['error','manual-required'].includes(state.phase)&&<p className="dsc-error" role="alert">{friendly(state.error,lang)}</p>}</div>}
    </>}
    {error&&<p className="dsc-error" role="alert">{error}</p>}{notice&&<p className="dsc-message" role="status">{notice}</p>}
  </div>;
}
