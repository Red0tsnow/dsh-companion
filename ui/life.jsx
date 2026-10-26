import React,{useEffect,useState} from 'react';
const copy={
  zh:{title:'陪伴日常',hint:'三个开关各自独立，默认关闭。需要额外安装并启用 dsh-proactive 0.3.1 文件表闹钟；模型额度和安静时段在它的面板设置。',selfplay:'会自己接着做',selfplayHint:'只在 Minecraft 身体在线、没有任务时继续一小步；连续最多十次。世界里没人时不会唤醒。',reachout:'会主动找你',reachoutHint:'和 Minecraft 无关。每天在随机窗口里想起你，最多一句，也可以安静跳过。',diary:'会写自己的日记',diaryHint:'每天最多一段，工具自动新起日期；没有值得写的就如实记录。',time:'窗口起点',window:'随机窗口（小时）',diaryTime:'写日记的时间',zone:'时区（留空跟随系统）',save:'保存陪伴设置',saving:'保存中…',check:'查看连接状态',saved:'设置已保存；请查看下方实际接入状态。',unavailable:'尚未接入唤醒插件。开关保存后仍需完成接入。',armed:'已接入',pending:'等待同步',paused:'等待身体上线',disabled:'已关闭',idle:'无人指令后（秒）',after:'做完后（秒）',advanced:'调整自主节奏',stopWorld:'没人多久后关掉世界（分钟，0 不关）',stopWorldHint:'世界里没有别人这么久，就自动关掉，免得空世界一直占内存。',quota:'这些功能会调用宿主模型。请按自己的额度启用。',
    reflectTitle:'回头看自己',reflectHint:'三件事节奏不同，默认关闭。和上面三项独立，需要 dsh-proactive。',
    reflectOn:'启用回顾',memory:'月度：整理长期记忆',memoryHint:'把日记里 30 天前的段落压成三行写进长期记忆，原文归档。一个月一次。',
    persona:'每周：人设回顾',personaHint:'这周有没有哪句话让你觉得「我不是这样想的」。想不清楚可以跳过。',
    rules:'月度：规则检查',rulesHint:'规则有没有跟实际冲突、过时。一个月最多改一条。',
    day:'每月几号',weekday:'每周几',personaTime:'回顾时间'},
  en:{title:'Daily companionship',hint:'Three independent switches, all off by default. Install and enable the optional dsh-proactive 0.3.1 schedule-file provider; set its model budget and quiet hours in its own panel.',selfplay:'Keep going independently',selfplayHint:'Take one small step only while the Minecraft body is online and idle, up to ten consecutive wakes. Nothing wakes it while the world is empty.',reachout:'Think of you',reachoutHint:'Independent of Minecraft. At most one line in a random daily window; staying silent is allowed.',diary:'Write a personal diary',diaryHint:'At most one entry per day, with a new date heading. Record only what really happened.',time:'Window starts at',window:'Random window (hours)',diaryTime:'Diary time',zone:'Time zone (system when empty)',save:'Save companionship settings',saving:'Saving…',check:'Check provider connection',saved:'Settings saved. Review the actual provider status below.',unavailable:'Wake provider not connected. Saving a switch does not confirm activation.',armed:'Connected',pending:'Awaiting sync',paused:'Waiting for body',disabled:'Off',idle:'Idle before waking (seconds)',after:'After task (seconds)',advanced:'Adjust self-play timing',stopWorld:'Close the world after this long with nobody (minutes, 0 = never)',stopWorldHint:'With no other player for this long the world is shut down, so an empty world does not keep holding memory.',quota:'These features use the host model. Enable them to suit your budget.',
    reflectTitle:'Looking back at itself',reflectHint:'Three different rhythms, off by default. Independent of the three above; needs dsh-proactive.',
    reflectOn:'Enable reflection',memory:'Monthly: consolidate long-term memory',memoryHint:'Compress diary entries older than 30 days into three lines, archive the originals. Once a month.',
    persona:'Weekly: review the persona',personaHint:'Anything this week that made it think "that is not how I would put it"? Skipping is allowed.',
    rules:'Monthly: review the rules',rulesHint:'Rules that conflict with reality or went stale. At most one change a month.',
    day:'Day of month',weekday:'Weekday',personaTime:'Review time'},
};
export function LifeSettings({lang,request,settings,onSaved}){
  const t=copy[lang==='en'?'en':'zh'],[value,setValue]=useState(settings),[stopMinutes,setStopMinutes]=useState(15),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  useEffect(()=>{if(settings)setValue(settings);},[settings]);
  useEffect(()=>{let live=true;request('/life').then(r=>{if(live){setResult(r);if(Number.isFinite(r?.mc?.autoStopEmptyMinutes))setStopMinutes(r.mc.autoStopEmptyMinutes);}}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[request]);
  if(!value)return null;
  const set=(feature,key,v)=>setValue(c=>({...c,[feature]:{...c[feature],[key]:v}}));
  const act=async save=>{setBusy(true);setError('');setNotice('');try{const r=await request('/life',save?{life:value,mc:{autoStopEmptyMinutes:Number(stopMinutes)}}:undefined);setResult(r);if(save){setValue(r.settings);onSaved?.(r.settings);setNotice(t.saved);}}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <section className="dsc-section" aria-labelledby="life-heading"><div className="dsc-section-head"><div><h2 id="life-heading">{t.title}</h2><p className="dsc-hint">{t.hint}</p></div></div><div className="dsc-runtime">
    {['selfplay','reachout','diary'].map(feature=><div className="dsc-life-setting" key={feature}>
      <label className="dsc-check"><input type="checkbox" checked={value[feature].enabled} onChange={e=>set(feature,'enabled',e.target.checked)}/>{t[feature]}</label><p className="dsc-note">{t[feature+'Hint']}</p>
      {feature==='reachout'&&value.reachout.enabled&&<div className="dsc-persona-grid"><label className="field"><span>{t.time}</span><input type="time" value={value.reachout.time} onChange={e=>set(feature,'time',e.target.value)}/></label><label className="field"><span>{t.window}</span><input type="number" min="1" max="23" value={value.reachout.windowHours} onChange={e=>set(feature,'windowHours',Number(e.target.value))}/></label></div>}
      {feature==='diary'&&value.diary.enabled&&<label className="field"><span>{t.diaryTime}</span><input type="time" value={value.diary.time} onChange={e=>set(feature,'time',e.target.value)}/></label>}
      {feature==='selfplay'&&value.selfplay.enabled&&<details className="dsc-advanced"><summary>{t.advanced}</summary><label className="field"><span>{t.stopWorld}</span><input type="number" min="0" max="1440" value={stopMinutes} onChange={e=>setStopMinutes(Number(e.target.value))}/></label><p className="dsc-note">{t.stopWorldHint}</p>{[['idleSeconds',t.idle],['afterTaskSeconds',t.after]].map(([key,label])=><label className="field" key={key}><span>{label}</span><input type="number" min={key==='idleSeconds'?60:1} max="86400" value={value.selfplay[key]} onChange={e=>set(feature,key,Number(e.target.value))}/></label>)}</details>}
      {result?.features?.[feature]&&<p className="dsc-status-detail">{t[result.features[feature].state]||result.features[feature].message}</p>}
    </div>)}
    <div className="dsc-life-setting">
      <label className="dsc-check"><input type="checkbox" checked={value.reflect.enabled} onChange={e=>setValue(c=>({...c,reflect:{...c.reflect,enabled:e.target.checked}}))}/>{t.reflectTitle}</label>
      <p className="dsc-note">{t.reflectHint}</p>
      {value.reflect.enabled&&<div className="dsc-persona-grid">
        <label className="field"><span>{t.memory}</span><input type="number" min="1" max="28" value={value.reflect.memoryDay} onChange={e=>setValue(c=>({...c,reflect:{...c.reflect,memoryDay:Number(e.target.value)}}))}/></label>
        <label className="field"><span>{t.personaTime}</span><input type="time" value={value.reflect.personaTime} onChange={e=>setValue(c=>({...c,reflect:{...c.reflect,personaTime:e.target.value}}))}/></label>
        <label className="field"><span>{t.rules}</span><input type="number" min="1" max="28" value={value.reflect.rulesDay} onChange={e=>setValue(c=>({...c,reflect:{...c.reflect,rulesDay:Number(e.target.value)}}))}/></label>
      </div>}
      <p className="dsc-note">{t.memoryHint}</p>
      <p className="dsc-note">{t.personaHint}</p>
    </div>
    <details className="dsc-advanced"><summary>{t.zone}</summary><label className="field"><span>{t.zone}</span><input value={value.timeZone} placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone} onChange={e=>setValue(c=>({...c,timeZone:e.target.value}))}/></label></details>
    <p className="dsc-note">{t.quota}</p><div className="dsc-toolbar"><button disabled={busy} onClick={()=>act(true)}>{busy?t.saving:t.save}</button><button disabled={busy} onClick={()=>act(false)}>{t.check}</button></div>
    {error&&<div className="dsc-error" role="alert">{error}</div>}{notice&&<p className="dsc-message" role="status">{notice}</p>}{result?.message&&<p className={result.available?'dsc-note':'dsc-error'} role="status">{result.message}</p>}{result?.diary?.warning&&value.diary.enabled&&<p className="dsc-message" role="status">{result.diary.warning}</p>}
  </div></section>;
}
