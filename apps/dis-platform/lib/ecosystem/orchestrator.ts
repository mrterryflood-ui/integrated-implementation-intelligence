import {randomUUID,createHash} from 'node:crypto';
import {getVercelOidcToken} from '@vercel/oidc';
import {invokeOwnedCapabilities} from '../owned-capability-fabric';
import {planEngagement} from './planner';
import {runPublicAdapter} from './public-adapters';
import {NetworkBudget,asRecord,boundedText,publicHttps,callMcpRead} from './transport';
import {ContractError,emptyReceipt,type Capability,type CapabilityReceipt,type EngagementInput,type EvidenceItem,type Plan,type ReceiptState} from './contracts';
export type ExecutionContext={kind:'PUBLIC_ONLY'}|{kind:'AUTHENTICATED_AGGREGATE';subjectId:string};
export type EngagementResult={schemaVersion:'dis-engagement-result-v1';id:string;plan:Plan;state:'NEEDS_CONTEXT'|'CONSENT_REQUIRED'|'PARTIAL_EVIDENCE'|'EVIDENCE_RETRIEVED_REVIEW_REQUIRED'|'NO_EVIDENCE_RETURNED';receipts:CapabilityReceipt[];items:EvidenceItem[];sourceCount:number;evidenceRecordCount:number;networkRequests:number;durationMs:number;startedAt:string;finishedAt:string;councilState:'NOT_RUN';implementationState:'NOT_EXECUTED';outcomeState:'NOT_MEASURED';receiptHash:string;};
export type RuntimeOptions={env?:Record<string,string|undefined>;fetcher?:typeof fetch;workloadToken?:()=>Promise<string>;};
const TRUSTED_ORIGINS:Record<string,readonly string[]>={community:['https://thrivingcommunitiesforall.com'],business:['https://govbizorchestrator.com'],funding:['https://fundingpathpro.net'],research:['https://www.bettersciencelab.com','https://bettersciencelab.com']};
type ServiceBinding={capabilityId:string;platformId:string;endpoint:string;sourceRevision:string;schemaVersion:'dis-evidence-v1'};
/** Reviewed non-secret binding records; never copied provider credentials or client-supplied URLs. */
export function serviceBindings(env:Record<string,string|undefined>):ServiceBinding[]{
 if(!env.DIS_ECOSYSTEM_SERVICE_BINDINGS)return [];
 let data:unknown;try{data=JSON.parse(env.DIS_ECOSYSTEM_SERVICE_BINDINGS)}catch{throw new ContractError('INVALID_SERVICE_BINDINGS','Service binding configuration is invalid.');}
 if(!Array.isArray(data)||data.length>32)throw new ContractError('INVALID_SERVICE_BINDINGS','Service binding configuration is invalid.');
 return data.map(raw=>{const b=asRecord(raw);if(Object.keys(b).some(k=>!['capabilityId','platformId','endpoint','sourceRevision','schemaVersion'].includes(k))||typeof b.capabilityId!=='string'||typeof b.platformId!=='string'||typeof b.endpoint!=='string'||typeof b.sourceRevision!=='string'||!/^[a-f0-9]{40}$/.test(b.sourceRevision)||b.schemaVersion!=='dis-evidence-v1')throw new ContractError('INVALID_SERVICE_BINDINGS','Service binding configuration is incomplete.');const u=new URL(b.endpoint);if(!TRUSTED_ORIGINS[b.platformId]?.includes(u.origin)||u.username||u.password||u.search||u.hash||!u.pathname.startsWith('/api/dis/'))throw new ContractError('INVALID_SERVICE_BINDINGS','Service endpoint has no reviewed owned-platform origin.');return b as ServiceBinding;});
}
function evidenceFromBridge(data:unknown,binding:ServiceBinding,requestId:string):EvidenceItem[]{
 const value=asRecord(data);
 if(value.schemaVersion!=='dis-evidence-v1'||value.capabilityId!==binding.capabilityId||value.requestId!==requestId||value.sourceRevision!==binding.sourceRevision||value.dataClass!=='PUBLIC_AGGREGATE')throw new ContractError('INVALID_SERVICE_RESPONSE','Service identity, revision, request or public-data contract did not match.');
 if(value.status!=='ok'||!Array.isArray(value.items)||value.items.length>20)throw new ContractError('INVALID_SERVICE_RESPONSE','The service did not return a successful bounded evidence envelope.');
 return value.items.map((raw,i)=>{const r=asRecord(raw),url=publicHttps(r.url);if(!url||typeof r.title!=='string'||typeof r.summary!=='string'||typeof r.retrievedAt!=='string'||!Number.isFinite(Date.parse(r.retrievedAt)))throw new ContractError('INVALID_SERVICE_RESPONSE','Evidence provenance is missing.');if(/(?:sk_live_|sk_test_|Bearer\s+[a-z0-9._-]{20}|-----BEGIN.*PRIVATE KEY)/i.test(r.summary))throw new ContractError('SENSITIVE_RESPONSE','A sensitive-looking response was withheld.');return {id:binding.platformId+'-'+String(r.id||i).slice(0,80),title:boundedText(r.title,240),summary:boundedText(r.summary,4000),url,source:boundedText(r.source,160)||binding.platformId,retrievedAt:r.retrievedAt,referencePeriod:typeof r.referencePeriod==='string'?r.referencePeriod.slice(0,80):null,geography:boundedText(r.geography,240)||'Source-reported coverage',status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',data:{serviceSourceRevision:binding.sourceRevision}} as EvidenceItem;});
}
async function invokeInternal(cap:Capability,input:EngagementInput,budget:NetworkBudget,binding:ServiceBinding,options:RuntimeOptions):Promise<CapabilityReceipt>{
 const env=options.env||process.env,result=emptyReceipt(cap,'NOT_CONNECTED','Runtime workload identity is not available for this approved integration.');
 if(env.VERCEL_ENV!=='production'||env.VERCEL_PROJECT_ID!=='prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT')return result;
 const token=await(options.workloadToken||getVercelOidcToken)().catch(()=>null);if(!token)return result;
 const requestId=randomUUID(),before=budget.requests;
 // Only typed public context is delegated. No question text, user identity, tenant or record is forwarded.
 const body={schemaVersion:'dis-read-request-v1',requestId,capabilityId:cap.id,purpose:'public-aggregate-decision-support',geography:input.geography,limit:12};
 const wire=await budget.request(binding.endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)},new URL(binding.endpoint).origin);
 if(wire.status!==200)return {...result,state:wire.status===401?'AUTHENTICATION_REQUIRED':wire.status===403?'SCOPE_DENIED':'UPSTREAM_ERROR',requestCount:budget.requests-before,httpStatus:wire.status,sourceUrl:binding.endpoint,responseSha256:wire.sha256,reason:'The owning service returned HTTP '+wire.status+'; no successful exchange is inferred.'};
 const items=evidenceFromBridge(wire.data,binding,requestId);return {...result,state:items.length?'RETURNED':'EMPTY_SOURCE_RESULT',finishedAt:new Date().toISOString(),requestCount:budget.requests-before,httpStatus:wire.status,sourceUrl:binding.endpoint,responseSha256:wire.sha256,items,reason:'Existing platform executed a bounded public/aggregate capability using its own provider integrations.',limitations:['Service transport was exercised; claim validity and user outcomes are not independently established.','Workload identity is not a grant to private client records and is not passed to downstream providers.']};
}
function stateFor(error:unknown):ReceiptState{if(!(error instanceof ContractError))return 'UPSTREAM_ERROR';if(error.code==='AUTHENTICATION_REQUIRED')return 'AUTHENTICATION_REQUIRED';if(error.code==='SCOPE_DENIED')return 'SCOPE_DENIED';if(error.code==='BUDGET_EXHAUSTED')return 'BUDGET_EXHAUSTED';if(/SCHEMA|JSON|RESPONSE|GEOGRAPHY_CONFLICT|CONTENT_TYPE|SESSION|PROTOCOL|SENSITIVE/.test(error.code))return 'INVALID_RESPONSE';return 'UPSTREAM_ERROR';}
async function invoke(cap:Capability,input:EngagementInput,budget:NetworkBudget,context:ExecutionContext,options:RuntimeOptions):Promise<CapabilityReceipt>{
 const start=new Date().toISOString(),before=budget.requests;
 try{
  if(cap.transport==='PUBLIC_JSON')return await runPublicAdapter(cap,input,budget);
  const binding=context.kind==='AUTHENTICATED_AGGREGATE'?serviceBindings(options.env||process.env).find(b=>b.capabilityId===cap.id&&b.platformId===cap.platformId):undefined;
  if(cap.transport==='NOT_BOUND'&&!binding)return emptyReceipt(cap,'NOT_CONNECTED','Integration is owner-approved. A reviewed serving capability binding is still required; no legacy or migration candidate is substituted.');
  if(context.kind==='PUBLIC_ONLY')return emptyReceipt(cap,'AUTHENTICATION_REQUIRED','This platform is approved for integration; only its public endpoint-free planning is available in this session. Signed-in, scoped service access is separate.');
  if(!context.subjectId)throw new ContractError('AUTHENTICATION_REQUIRED','Authenticated execution requires a verified subject.');
  if(binding)return await invokeInternal(cap,input,budget,binding,options);
  if(cap.transport==='EXISTING_READER'&&cap.legacyId){
   const allowed=new Set(['https://thrivingcommunitiesforall.com','https://www.bettersciencelab.com','https://bettersciencelab.com']);
   const fetcher:typeof fetch=async(url,init)=>{const value=typeof url==='string'?url:url instanceof URL?url.href:url.url;const origin=new URL(value).origin;if(!allowed.has(origin))throw new ContractError('ENDPOINT_DENIED','Reader origin is not approved.');const r=await budget.request(value,init,origin);return new Response(r.text,{status:r.status,headers:{'content-type':r.contentType}});};
   const results=await invokeOwnedCapabilities([cap.legacyId],options.env||process.env,fetcher);const source=results[0];
   if(!source||source.state!=='RETURNED_UNVERIFIED'||source.value===null)return {...emptyReceipt(cap,'NOT_CONNECTED',source?.reason||'The existing owning-platform reader has no established scoped connection.'),requestCount:budget.requests-before};
   const summary=JSON.stringify(source.value);if(summary.length>262144)throw new ContractError('RESPONSE_TOO_LARGE','The projected source response is too large.');
   return {...emptyReceipt(cap,'RETURNED','The existing bounded platform reader returned an unverified contribution.'),startedAt:start,finishedAt:new Date().toISOString(),requestCount:budget.requests-before,responseSha256:createHash('sha256').update(summary).digest('hex'),items:[{id:cap.id,title:cap.label,summary:summary.slice(0,6000),url:cap.platformId==='research'?'https://www.bettersciencelab.com/api/v1/public/frameworks':'https://thrivingcommunitiesforall.com',source:cap.platformId,retrievedAt:new Date().toISOString(),referencePeriod:null,geography:'Existing reader’s source-reported scope',status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',data:{projectionTruncated:summary.length>6000}}],limitations:['Existing reader scope and projection remain in force.','No raw user question, identity or client record was transferred.']};
  }
  if(cap.transport==='MCP_HTTP'&&cap.toolName){
   // Optional existing RESOURCE-specific service identity, never a provider key or browser-supplied token.
   const resourceToken=(options.env||process.env).DIS_BUSINESS_MCP_RESOURCE_TOKEN;
   if(!resourceToken)return emptyReceipt(cap,'NOT_CONNECTED','Native MCP transport is implemented; its resource-specific service identity or reviewed internal workload bridge is not bound. No new upstream provider key is required.');
   const response=await callMcpRead(cap.endpoint!,cap.toolName,{},budget,resourceToken);const content=asRecord(response.result.structuredContent);if(!Array.isArray(content.admitted)||content.admitted.length>24)throw new ContractError('INVALID_MCP_EVIDENCE','MCP output is missing its bounded evidence contract.');
   const items:EvidenceItem[]=content.admitted.map((raw,i)=>{const r=asRecord(raw),url=publicHttps(r.url);if(!url||typeof r.quote!=='string'||typeof r.retrievedOn!=='string')throw new ContractError('INVALID_MCP_EVIDENCE','MCP evidence provenance is missing.');return{id:'business-'+i,title:boundedText(r.title,240),summary:boundedText(r.quote,4000),url,source:'Business Orchestrator / '+boundedText(r.serverId,80),retrievedAt:r.retrievedOn,referencePeriod:null,geography:'As described by the source',status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',data:{tier:r.tier,limitations:boundedText(r.limit,1200)}};});
   return{...emptyReceipt(cap,items.length?'RETURNED':'EMPTY_SOURCE_RESULT','MCP initialize, tool discovery and the allowlisted read completed.'),startedAt:start,finishedAt:new Date().toISOString(),requestCount:budget.requests-before,httpStatus:response.wire.status,sourceUrl:cap.endpoint,responseSha256:response.wire.sha256,items,limitations:[boundedText(content.note,2000)||'No source note supplied.','MCP protocol exchange is not independent claim validation.']};
  }
  return emptyReceipt(cap,'NOT_CONNECTED','Owner integration approval is established; the deployed capability binding is not yet verified. No arbitrary endpoint, private credential or data is substituted.');
 }catch(error){return{...emptyReceipt(cap,stateFor(error),error instanceof ContractError?error.message:'The adapter failed; the failure is not an empty successful result.'),startedAt:start,finishedAt:new Date().toISOString(),requestCount:budget.requests-before};}
}
/** Execute distinct contributions concurrently, respecting one shared hard network budget. */
export async function executeEngagement(value:unknown,context:ExecutionContext={kind:'PUBLIC_ONLY'},options:RuntimeOptions={}):Promise<EngagementResult>{
 const start=Date.now(),plan=planEngagement(value),id=randomUUID(),startedAt=new Date(start).toISOString();
 const budget=new NetworkBudget(plan.budgets.maxNetworkRequests,plan.budgets.maxMilliseconds,plan.budgets.maxResponseBytes,options.fetcher||fetch,start);
 let receipts:CapabilityReceipt[]=[];
 if(plan.question)receipts=plan.selected.map(c=>emptyReceipt(c,'NEEDS_CONTEXT','Clarify the stated boundary once before data retrieval.'));
 else if(!plan.input.externalConsent)receipts=plan.selected.map(c=>emptyReceipt(c,'CONSENT_REQUIRED','Approve the described external public/aggregate queries before retrieval.'));
 else{
  const results=new Array<CapabilityReceipt>(plan.selected.length);let next=0;
  const worker=async()=>{for(;;){const index=next++;if(index>=plan.selected.length)return;results[index]=await invoke(plan.selected[index],plan.input,budget.scope(),context,options);}};
  await Promise.all(Array.from({length:Math.min(3,plan.selected.length)},worker));receipts=results;
 }
 const items=receipts.flatMap(r=>r.items),successful=receipts.filter(r=>r.state==='RETURNED').length;
 const state=plan.question?'NEEDS_CONTEXT':!plan.input.externalConsent?'CONSENT_REQUIRED':!successful?'NO_EVIDENCE_RETURNED':successful<receipts.length?'PARTIAL_EVIDENCE':'EVIDENCE_RETRIEVED_REVIEW_REQUIRED';
 const receiptHash=createHash('sha256').update(JSON.stringify(receipts)).digest('hex');
 return{schemaVersion:'dis-engagement-result-v1',id,plan,state,receipts,items,sourceCount:new Set(items.map(i=>i.url)).size,evidenceRecordCount:items.length,networkRequests:budget.requests,durationMs:Date.now()-start,startedAt,finishedAt:new Date().toISOString(),councilState:'NOT_RUN',implementationState:'NOT_EXECUTED',outcomeState:'NOT_MEASURED',receiptHash};
}
