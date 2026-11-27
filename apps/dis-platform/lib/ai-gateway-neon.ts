import {NetworkBudget} from './ecosystem/transport';

/** Owner-reviewed DIS main-branch gateway. Configuration cannot select another host. */
export const NEON_AI_GATEWAY_ORIGIN='https://br-restless-fire-b8qxk6ah-api.ai.c-14.us-east-1.aws.neon.tech';
export const NEON_AI_RECIPIENT='Neon AI Gateway / Databricks';
export const NEON_CATALOG_MAX_AGE_MS=60000;
const MODEL_ID=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}$/;
export type NeonModelOwner='openai'|'google'|'anthropic';
export type NeonCatalogModel={id:string;owner:NeonModelOwner;enabled:boolean;unavailableReason:string|null};
export type NeonModelCatalog={state:'OBSERVED'|'UNAVAILABLE'|'NOT_CONFIGURED';observedAt:string|null;endpoint:string;models:NeonCatalogModel[];reason:string|null};
export type NeonModelSelection=NeonCatalogModel&{identity:string};
type Environment=Record<string,string|undefined>;
export class NeonGatewayError extends Error {
 constructor(readonly code:string,message:string,readonly status=503){super(message);}
}
const publicReasons=new Set(['credits_required','paid_plan_required','insufficient_credits','account_restricted','model_restricted','model_unavailable','requires_claim','authentication_required','scope_denied','rate_limited','gateway_unavailable','catalog_unavailable','catalog_invalid','catalog_stale','model_not_listed','model_owner_mismatch','model_disabled','model_not_selected','not_configured','availability_not_checked','response_model_unverified']);
function reason(value:unknown,fallback:string){return typeof value==='string'&&publicReasons.has(value)?value:fallback;}
export function neonAvailabilityMessage(code:string){
 if(code==='credits_required'||code==='paid_plan_required'||code==='insufficient_credits')return `Neon AI Gateway reports ${code}. This model cannot run until an administrator resolves gateway billing or credits.`;
 if(code==='availability_not_checked')return 'Neon AI Gateway is configured; model availability has not been checked.';
 if(code==='not_configured')return 'An administrator must configure the reviewed Neon AI Gateway before use.';
 return `Neon AI Gateway is unavailable (${reason(code,'gateway_unavailable')}). No alternative provider was called.`;
}
export function neonGatewayConfiguration(env:Environment=process.env){
 const base=env.NEON_AI_GATEWAY_BASE_URL,token=env.NEON_AI_GATEWAY_TOKEN;
 if(env.DIS_AI_TRANSPORT!=='neon'||(base!==NEON_AI_GATEWAY_ORIGIN&&base!==NEON_AI_GATEWAY_ORIGIN+'/')||!token||token.length<16||token.length>4096||!/^[\x21-\x7e]+$/.test(token))throw new NeonGatewayError('not_configured',neonAvailabilityMessage('not_configured'));
 return{origin:NEON_AI_GATEWAY_ORIGIN,token};
}
export function neonGatewayConfigured(env:Environment=process.env){try{neonGatewayConfiguration(env);return true;}catch{return false;}}
function errorReason(status:number,data:any){
 return reason(data?.unavailable_reason??data?.error?.unavailable_reason,status===401?'authentication_required':status===403?'scope_denied':status===429?'rate_limited':'gateway_unavailable');
}
function parseCatalog(data:any):NeonCatalogModel[]{
 if(!data||!Array.isArray(data.data)||data.data.length>1024)throw new NeonGatewayError('catalog_invalid',neonAvailabilityMessage('catalog_invalid'));
 const seen=new Set<string>(),models:NeonCatalogModel[]=[];
 for(const row of data.data){
  if(!row||typeof row.id!=='string'||!MODEL_ID.test(row.id)||seen.has(row.id))throw new NeonGatewayError('catalog_invalid',neonAvailabilityMessage('catalog_invalid'));
  seen.add(row.id);
  if(!['openai','google','anthropic'].includes(row.owned_by))continue;
  const unavailableReason=row.unavailable_reason?reason(row.unavailable_reason,'model_unavailable'):row.enabled===true?null:'model_disabled';
  models.push({id:row.id,owner:row.owned_by,enabled:row.enabled===true&&!unavailableReason,unavailableReason});
 }
 return models;
}
/** Catalog GET only: callers must run this outside organization transactions. */
export async function readNeonModelCatalog(env:Environment=process.env,budget=new NetworkBudget(1,7000,524288)):Promise<NeonModelCatalog>{
 const endpoint=NEON_AI_GATEWAY_ORIGIN+'/v1/models';
 let config:ReturnType<typeof neonGatewayConfiguration>;
 try{config=neonGatewayConfiguration(env);}catch{return{state:'NOT_CONFIGURED',observedAt:null,endpoint,models:[],reason:'not_configured'};}
 try{
  const response=await budget.request(endpoint,{method:'GET',headers:{Accept:'application/json',Authorization:'Bearer '+config.token}},config.origin);
  if(response.status!==200)return{state:'UNAVAILABLE',observedAt:new Date().toISOString(),endpoint,models:[],reason:errorReason(response.status,response.data)};
  return{state:'OBSERVED',observedAt:new Date().toISOString(),endpoint,models:parseCatalog(response.data),reason:null};
 }catch(error){return{state:'UNAVAILABLE',observedAt:new Date().toISOString(),endpoint,models:[],reason:error instanceof NeonGatewayError?error.code:'catalog_unavailable'};}
}
export function neonModelAvailability(requested:string,catalog?:NeonModelCatalog,expectedOwner?:NeonModelOwner):{model:NeonModelSelection|null;available:boolean|null;reason:string|null}{
 const parts=requested.split('/'),id=parts.at(-1)||'',prefix=parts.length===2?parts[0]:null;
 if(parts.length>2||!MODEL_ID.test(id)||(prefix&&!['openai','google','anthropic'].includes(prefix)))return{model:null,available:false,reason:'model_not_selected'};
 if(!catalog)return{model:null,available:null,reason:'availability_not_checked'};
 if(catalog.state!=='OBSERVED')return{model:null,available:false,reason:reason(catalog.reason,'catalog_unavailable')};
 const observed=catalog.observedAt?Date.parse(catalog.observedAt):NaN;
 if(catalog.endpoint!==NEON_AI_GATEWAY_ORIGIN+'/v1/models'||!Number.isFinite(observed)||Date.now()-observed>NEON_CATALOG_MAX_AGE_MS||observed>Date.now()+1000)return{model:null,available:false,reason:'catalog_stale'};
 const matches=catalog.models.filter(row=>row.id===id);
 if(matches.length!==1)return{model:null,available:false,reason:matches.length?'catalog_invalid':'model_not_listed'};
 const row=matches[0];
 if((expectedOwner&&row.owner!==expectedOwner)||(prefix&&row.owner!==prefix)||!['openai','google','anthropic'].includes(row.owner))return{model:null,available:false,reason:'model_owner_mismatch'};
 const model={...row,identity:row.owner+'/'+row.id};
 return{model,available:row.enabled===true&&!row.unavailableReason,reason:row.enabled===true&&!row.unavailableReason?null:reason(row.unavailableReason,'model_disabled')};
}
export function requireNeonModel(requested:string,catalog:NeonModelCatalog,owner?:NeonModelOwner):NeonModelSelection{
 const observed=neonModelAvailability(requested,catalog,owner);
 if(!observed.model||observed.available!==true)throw new NeonGatewayError(observed.reason||'model_unavailable',neonAvailabilityMessage(observed.reason||'model_unavailable'));
 return observed.model;
}
export function neonInferenceEndpoint(dialect:'chat'|'responses'|'gemini',model:string){
 if(!MODEL_ID.test(model))throw new NeonGatewayError('model_not_selected',neonAvailabilityMessage('model_not_selected'));
 return NEON_AI_GATEWAY_ORIGIN+(dialect==='chat'?'/v1/chat/completions':dialect==='responses'?'/openai/v1/responses':'/gemini/v1beta/models/'+model+':generateContent');
}
/** One fresh catalog check and at most one inference. No retry or provider fallback. */
export async function requestNeonInference(dialect:'chat'|'responses'|'gemini',requested:string,body:Record<string,unknown>,env:Environment=process.env,budget=new NetworkBudget(2,19000,524288)){
 const config=neonGatewayConfiguration(env),catalog=await readNeonModelCatalog(env,budget);
 const selected=requireNeonModel(requested,catalog,dialect==='responses'?'openai':dialect==='gemini'?'google':undefined);
 const endpoint=neonInferenceEndpoint(dialect,selected.id),payload={...body,...(dialect==='gemini'?{}:{model:selected.id})};
 const serialized=JSON.stringify(payload);
 if(Buffer.byteLength(serialized)>262144)throw new NeonGatewayError('request_too_large','The inference request exceeds the bounded gateway transfer size.',413);
 let response;
 try{response=await budget.request(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token},body:serialized},config.origin);}
 catch{throw new NeonGatewayError('gateway_unavailable',neonAvailabilityMessage('gateway_unavailable'));}
 if(response.status!==200){const code=errorReason(response.status,response.data);throw new NeonGatewayError(code,neonAvailabilityMessage(code));}
 const data=response.data as any,returned=dialect==='gemini'?data?.modelVersion:data?.model;
 // A requested model is not proof of which model answered. Accept only the exact
 // catalog identity; unexpected aliases need review rather than guessed mapping.
 if(typeof returned!=='string'||returned!==selected.id)throw new NeonGatewayError('response_model_unverified',neonAvailabilityMessage('response_model_unverified'));
 const actual=requireNeonModel(returned,catalog,selected.owner);
 return{data,model:actual.id,modelIdentity:actual.identity,modelOwner:actual.owner,transport:'neon' as const,recipient:NEON_AI_RECIPIENT,endpoint,observedAt:catalog.observedAt};
}
