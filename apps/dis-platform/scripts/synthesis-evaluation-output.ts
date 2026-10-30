export function configureEvaluationRequest(body:Record<string,any>,model:string){
 if(body.model!==model)throw Error('PAID_MODEL_NOT_ALLOWED');
 const messages=Array.isArray(body.messages)?body.messages:[];
 const concise='EVALUATION RESPONSE CONTRACT: give a concise decision brief of at most 350 words total. Compress every requested section into that limit. Include context, competing options, source-supported evidence versus assumptions, a falsification check, owner, core-component fidelity, baseline and outcome measures, review trigger, and human approval. Do not repeat the full question, narrate each council persona, invent numeric thresholds, or claim a named study instrument is validated unless the supplied evidence establishes it.';
 return {...body,max_completion_tokens:1600,messages:messages.map((m:any)=>m.role==='system'?{...m,content:String(m.content||'')+'\n'+concise}:m)};
}
export function completedEvaluation(status:number|null,finish:string|null,raw:string,retained:string):boolean{
 return status===200&&finish==='stop'&&Boolean(retained.trim())&&raw===retained;
}
export function evaluationBatchState(stop:string|null,attempted:number,completed:number,requested:number):string{
 if(stop)return 'STOPPED';
 return attempted===requested&&completed===requested?'COMPLETED':'COMPLETED_WITH_FAILURES';
}
