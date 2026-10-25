const status=(state,message,route)=>({state,available:state==='available'?true:state==='unconfigured'?false:null,message,checkedAt:new Date().toISOString(),...(route?.provider?{provider:route.provider,model:route.model}: {})});
export async function hostModelStatus(ctx,{lastSuccess}={}){
  const get=name=>ctx?.get?.(name);let selection;
  try{
    const defaults=get('agentDefaultModel');if(!defaults?.currentSelection)return status('unknown','先确认 DSH 自己能正常聊天。插件使用宿主已有的模型，不需要另外填 key。');
    selection=await defaults.currentSelection();
    if(!selection?.provider||!selection.model)return status('unconfigured','DSH 还没有选择可用模型，请先在设置里登录并选择已有模型。');
    const llm=get('llm');if(!llm?.listProviders)return status('unknown','暂时无法确认宿主模型状态。先在 DSH 发一句话，确认有回复。',selection);
    const providers=await llm.listProviders();if(!providers.some(p=>p.id===selection.provider))return status('unconfigured','DSH 还没有接通所选模型，请先在设置里登录或选择已有模型。',selection);
    if(selection.provider==='deepseek-account'){
      const account=await get('deepseekAccount')?.getState?.();if(account?.status==='signed-out')return status('unconfigured','DSH 还没登录，先去设置里登录。',selection);
    }
    const directory=await llm.listConfigurableProviders?.(),entry=directory?.find(p=>p.provider===selection.provider),credentials=get('credentials');
    if(entry?.nativeAuth?.oauth&&credentials?.describeRecord){
      const record=await credentials.describeRecord(`llm-pi-ai/${selection.provider}`),envs=Array.isArray(entry.nativeAuth.env)?entry.nativeAuth.env:typeof entry.nativeAuth.env==='string'?[entry.nativeAuth.env]:[];
      let ambient=false,known=true;for(const ref of envs){if(!credentials.describe){known=false;break;}ambient||=Boolean((await credentials.describe(ref)).configured);}
      if(!record.configured&&!ambient&&known)return status('unconfigured','DSH 还没登录，先去设置里登录。',selection);
    }
    if(lastSuccess?.provider===selection.provider&&lastSuccess.model===selection.model&&Date.now()-lastSuccess.at<10*60*1000)return status('available','宿主模型最近已正常回复，角色会复用它。',selection);
    for(const agent of (ctx?.agents?.list?.()||get('agents')?.list?.()||[]).slice(-16)){
      const header=agent.session?.requestHeader?.()?.config;if(header?.provider!==selection.provider||header.model!==selection.model)continue;
      const events=agent.session.snapshotEvents().slice(-100),end=events.findLast(e=>e.type==='turn/end'),at=typeof end?.time==='number'?end.time:Date.parse(end?.time||end?.at||'');
      if(!end||Date.now()-at>10*60*1000||!Number.isFinite(at))continue;
      if(end.data?.reason?.kind==='error')continue;
      if(events.some(e=>e.type==='assistant/message'&&e.data?.turn===end.data.turn))return status('available','宿主模型最近已正常回复，角色会复用它。',selection);
    }
    return status('unknown','暂时无法确认登录是否有效。先确认 DSH 自己能正常聊天；插件不需要另外填 key。',selection);
  }catch(error){
    if(['MISSING_CREDENTIAL','ACCOUNT_SIGN_IN_REQUIRED','ACCOUNT_TOKEN_INVALID','NO_PROVIDER','NO_MODEL'].includes(error?.code))return status('unconfigured','DSH 还没准备好聊天，请先去设置里登录并选择已有模型。',selection);
    return status('unknown','暂时无法确认宿主状态。先在 DSH 发一句话，确认有回复。',selection);
  }
}
