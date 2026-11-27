/** Synthetic transports only. These tests never contact Neon or a model vendor. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {NEON_AI_GATEWAY_ORIGIN as origin,NEON_AI_RECIPIENT,NEON_CATALOG_MAX_AGE_MS,NeonGatewayError,neonGatewayConfiguration,neonModelAvailability,readNeonModelCatalog,requestNeonInference,type NeonModelCatalog} from '../lib/ai-gateway-neon';
import {NetworkBudget} from '../lib/ecosystem/transport';
import {askKnowledgeProvider,knowledgeProviderStatus,observedKnowledgeProviders,type KnowledgeProvider} from '../lib/organizations/knowledge-provider';
import {recordPassages} from '../lib/organizations/knowledge-passages';
import {infer,convene} from '../lib/council-runtime';

const env={
 DIS_AI_TRANSPORT:'neon',NEON_AI_GATEWAY_BASE_URL:origin,NEON_AI_GATEWAY_TOKEN:'fixture-neon-invoke-token-not-real',
 DIS_ORG_ASK_ENABLED:'true',DIS_ORG_ASK_OPENAI_MODEL:'gpt-5-4-mini',DIS_ORG_ASK_GEMINI_MODEL:'gemini-3-5-flash-lite',
 DIS_ORG_ASK_OPENAI_API_KEY:'fixture-direct-openai-never-forward',DIS_ORG_ASK_GEMINI_API_KEY:'fixture-direct-gemini-never-forward',
 AI_GATEWAY_API_KEY:'fixture-legacy-vercel-never-forward',VERCEL_OIDC_TOKEN:'fixture-oidc-never-forward',
 AI_GATEWAY_MODEL:'openai/gpt-5-4-mini',AI_GATEWAY_PRIMARY_A_MODEL:'openai/gpt-5-4-mini',
 AI_GATEWAY_PRIMARY_B_MODEL:'google/gemini-3-5-flash-lite',AI_GATEWAY_RED_MODEL:'anthropic/claude-haiku-4-5',
 AI_GATEWAY_SYNTHESIS_MODEL:'openai/gpt-5-4-mini',AI_GATEWAY_PLAN_MODEL:'openai/gpt-5-4-mini',
};
const rows=()=>[
 {id:'gpt-5-4-mini',owned_by:'openai',enabled:true},
 {id:'gpt-another',owned_by:'openai',enabled:true},
 {id:'gemini-3-5-flash-lite',owned_by:'google',enabled:true},
 {id:'claude-haiku-4-5',owned_by:'anthropic',enabled:true},
];
const catalog=(enabled=true)=>({object:'list',data:rows().map(row=>({...row,enabled,...(enabled?{}:{unavailable_reason:'credits_required'})}))});
const observed=():NeonModelCatalog=>({state:'OBSERVED',observedAt:new Date().toISOString(),endpoint:origin+'/v1/models',reason:null,models:rows().map(row=>({id:row.id,owner:row.owned_by as 'openai'|'google'|'anthropic',enabled:true,unavailableReason:null}))});
const wire=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
type Call={url:string;init:RequestInit};
function transport(replies:Array<()=>Response>,maxBytes=524288){
 const calls:Call[]=[];
 const fetcher=(async(input:RequestInfo|URL,init:RequestInit={})=>{
  calls.push({url:String(input),init});
  const reply=replies[calls.length-1];assert.ok(reply,'No hidden retry or fallback is allowed');return reply();
 }) as typeof fetch;
 return{calls,fetcher,budget:new NetworkBudget(2,3000,maxBytes,fetcher)};
}
function safe(error:unknown,code?:string){
 assert.ok(error instanceof NeonGatewayError);
 if(code)assert.equal(error.code,code);
 for(const secret of [env.NEON_AI_GATEWAY_TOKEN,env.DIS_ORG_ASK_OPENAI_API_KEY,env.DIS_ORG_ASK_GEMINI_API_KEY,env.AI_GATEWAY_API_KEY,env.VERCEL_OIDC_TOKEN])assert.equal(String(error).includes(secret),false);
 return true;
}
const passages=recordPassages({id:'00000000-0000-4000-8000-000000000001',version:1,digest:'a'.repeat(64),title:'Synthetic retained source',kind:'evidence',body:{bundle:{records:[{title:'Synthetic capacity note',summary:'The proposed digital skills pilot requires available instructors and local access.'}]}}});
const rawAnswer=()=>({claims:[{text:'The supplied note describes proposed delivery requirements.',citations:[{id:passages[0].id,quote:passages[0].text}]}],questions:['Who should verify delivery capacity?'],unknowns:['Actual capacity has not been established.']});
function answer(provider:KnowledgeProvider,raw:unknown=rawAnswer()){
 return provider==='gpt'
  ?{model:env.DIS_ORG_ASK_OPENAI_MODEL,status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(raw)}]}]}
  :{modelVersion:env.DIS_ORG_ASK_GEMINI_MODEL,candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(raw)}]}}]};
}
async function withEnvironment<T>(values:Record<string,string|undefined>,work:()=>Promise<T>){
 const old=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
 try{for(const [key,value]of Object.entries(values))if(value===undefined)delete process.env[key];else process.env[key]=value;return await work();}
 finally{for(const[key,value]of Object.entries(old))if(value===undefined)delete process.env[key];else process.env[key]=value;}
}

test('Neon configuration pins the reviewed HTTPS origin and rejects unsafe or incomplete configuration without network',async()=>{
 assert.equal(neonGatewayConfiguration(env).origin,origin);
 assert.equal(neonGatewayConfiguration({...env,NEON_AI_GATEWAY_BASE_URL:origin+'/'}).origin,origin);
 const forbidden=[
  {...env,DIS_AI_TRANSPORT:undefined},{...env,NEON_AI_GATEWAY_TOKEN:undefined},
  {...env,NEON_AI_GATEWAY_TOKEN:'short'},{...env,NEON_AI_GATEWAY_TOKEN:'token with whitespace'},
  ...['http://'+new URL(origin).host,origin+'.untrusted.test',origin+'/v1',origin+'?token=secret','https://user:secret@'+new URL(origin).host,'https://untrusted.test',origin+':443'].map(base=>({...env,NEON_AI_GATEWAY_BASE_URL:base})),
 ];
 for(const bad of forbidden){
  assert.throws(()=>neonGatewayConfiguration(bad),e=>safe(e,'not_configured'));
  const t=transport([]);
  const status=await readNeonModelCatalog(bad,t.budget);
  assert.equal(status.state,'NOT_CONFIGURED');assert.equal(t.calls.length,0);
  await assert.rejects(requestNeonInference('chat','gpt-5-4-mini',{},bad,t.budget),e=>safe(e,'not_configured'));
 }
});

test('catalog-only status separates configured credentials from observed credits-required availability',async()=>{
 const t=transport([()=>wire(catalog(false))]);
 const status=await observedKnowledgeProviders(env,t.budget);
 assert.equal(t.calls.length,1);assert.equal(t.calls[0].url,origin+'/v1/models');
 assert.equal(t.calls[0].init.method,'GET');assert.equal(t.calls[0].init.body,undefined);
 assert.equal(new Headers(t.calls[0].init.headers).get('authorization'),'Bearer '+env.NEON_AI_GATEWAY_TOKEN);
 for(const provider of status.providers){
  assert.equal(provider.configured,true);assert.equal(provider.available,false);assert.equal(provider.canExecute,false);
  assert.equal(provider.availability,'UNAVAILABLE');assert.equal(provider.unavailableReason,'credits_required');
  assert.equal(provider.transport,'neon');assert.equal(provider.recipient,NEON_AI_RECIPIENT);assert.match(provider.message,/credits_required/);
  assert.ok(provider.modelIdentity?.startsWith(provider.provider==='gpt'?'openai/':'google/'));
 }
 assert.equal(JSON.stringify(status).includes(env.NEON_AI_GATEWAY_TOKEN),false);
 const unchecked=knowledgeProviderStatus('gpt',env);
 assert.equal(unchecked.configured,true);assert.equal(unchecked.available,null);assert.equal(unchecked.canExecute,false);
 assert.equal(unchecked.availability,'NOT_CHECKED');
});

test('catalog provenance and freshness reject absent, duplicate, wrong-owner and stale model identities',async()=>{
 const valid=observed();
 assert.equal(neonModelAvailability('openai/gpt-5-4-mini',valid).model?.identity,'openai/gpt-5-4-mini');
 for(const [requested,current,owner,code]of [
  ['gpt-absent',valid,undefined,'model_not_listed'],
  ['google/gpt-5-4-mini',valid,undefined,'model_owner_mismatch'],
  ['gpt-5-4-mini',valid,'google','model_owner_mismatch'],
  ['openai/../../model',valid,undefined,'model_not_selected'],
  ['gpt-5-4-mini',{...valid,models:[...valid.models,valid.models[0]]},undefined,'catalog_invalid'],
  ['gpt-5-4-mini',{...valid,observedAt:new Date(Date.now()-NEON_CATALOG_MAX_AGE_MS-1000).toISOString()},undefined,'catalog_stale'],
  ['gpt-5-4-mini',{...valid,observedAt:new Date(Date.now()+60000).toISOString()},undefined,'catalog_stale'],
  ['gpt-5-4-mini',{...valid,endpoint:'https://untrusted.test/v1/models'},undefined,'catalog_stale'],
 ] as Array<[string,NeonModelCatalog,'google'|undefined,string]>){
  const result=neonModelAvailability(requested,current,owner);assert.equal(result.available,false);assert.equal(result.reason,code);
 }
 for(const data of [{data:[...rows(),rows()[0]]},{data:[{id:'../../arbitrary',owned_by:'openai',enabled:true}]},{models:rows()},{data:null}]){
  const t=transport([()=>wire(data)]),status=await readNeonModelCatalog(env,t.budget);
  assert.equal(status.state,'UNAVAILABLE');assert.equal(status.reason,'catalog_invalid');assert.deepEqual(status.models,[]);
 }
 const unknown=transport([()=>wire({data:[{id:'gpt-5-4-mini',owned_by:'untrusted',enabled:true}]})]);
 assert.equal(neonModelAvailability('gpt-5-4-mini',await readNeonModelCatalog(env,unknown.budget)).reason,'model_not_listed');
});

test('catalog failures, malicious reasons and redirect bodies are safe and never become model availability',async()=>{
 const redirect=()=>{const response=wire(catalog());Object.defineProperty(response,'redirected',{value:true});return response;};
 const fixtures:Array<{reply:()=>Response;reason:string}>=[
  {reply:()=>wire({error:{message:env.NEON_AI_GATEWAY_TOKEN}},401),reason:'authentication_required'},
  {reply:()=>wire({error:{message:env.NEON_AI_GATEWAY_TOKEN}},403),reason:'scope_denied'},
  {reply:()=>wire({},429),reason:'rate_limited'},
  {reply:()=>wire({unavailable_reason:'credits_required',recovery_url:'https://untrusted.test/'+env.NEON_AI_GATEWAY_TOKEN},402),reason:'credits_required'},
  {reply:()=>wire({unavailable_reason:env.NEON_AI_GATEWAY_TOKEN},500),reason:'gateway_unavailable'},
  {reply:()=>new Response('{broken',{headers:{'Content-Type':'application/json'}}),reason:'catalog_unavailable'},
  {reply:redirect,reason:'catalog_unavailable'},
  {reply:()=>new Response('x'.repeat(524289),{headers:{'Content-Type':'application/json'}}),reason:'catalog_unavailable'},
 ];
 for(const fixture of fixtures){
  const t=transport([fixture.reply]),result=await readNeonModelCatalog(env,t.budget);
  assert.equal(result.state,'UNAVAILABLE');assert.equal(result.reason,fixture.reason);assert.deepEqual(result.models,[]);
  assert.equal(JSON.stringify(result).includes(env.NEON_AI_GATEWAY_TOKEN),false);assert.equal(t.calls.length,1);
 }
 const malicious=transport([()=>wire({data:[{...rows()[0],unavailable_reason:env.NEON_AI_GATEWAY_TOKEN}]})]);
 const status=knowledgeProviderStatus('gpt',env,await readNeonModelCatalog(env,malicious.budget));
 assert.equal(status.canExecute,false);assert.equal(status.unavailableReason,'model_unavailable');
 assert.equal(JSON.stringify(status).includes(env.NEON_AI_GATEWAY_TOKEN),false);
});

test('GPT and Gemini use only the selected Neon dialect and bearer credential, with exact cited source outputs',async()=>{
 for(const provider of ['gpt','gemini'] as const){
  const t=transport([()=>wire(catalog()),()=>wire(answer(provider))]);
  const result=await askKnowledgeProvider(provider,'{"question":"Which delivery capacity should be confirmed?"}',passages,env,t.budget);
  assert.equal(result.state,'DRAFT_WITH_CITATIONS');assert.equal(result.approvalGranted,false);assert.equal(t.calls.length,2);
  const post=t.calls[1],body=JSON.parse(String(post.init.body)),headers=new Headers(post.init.headers);
  assert.equal(post.url,origin+(provider==='gpt'?'/openai/v1/responses':'/gemini/v1beta/models/gemini-3-5-flash-lite:generateContent'));
  assert.equal(post.init.method,'POST');assert.equal(post.init.redirect,'error');assert.equal(post.init.cache,'no-store');
  assert.equal(headers.get('authorization'),'Bearer '+env.NEON_AI_GATEWAY_TOKEN);assert.equal(headers.get('x-goog-api-key'),null);
  if(provider==='gpt'){assert.equal(body.model,'gpt-5-4-mini');assert.equal(body.store,false);}
  else{assert.equal(body.model,undefined);assert.equal(body.generationConfig.candidateCount,1);}
  for(const secret of [env.DIS_ORG_ASK_OPENAI_API_KEY,env.DIS_ORG_ASK_GEMINI_API_KEY,env.AI_GATEWAY_API_KEY,env.VERCEL_OIDC_TOKEN]){
   assert.equal(JSON.stringify(t.calls).includes(secret),false);assert.equal(JSON.stringify(result).includes(secret),false);
  }
  assert.equal(String(post.init.body).includes(env.NEON_AI_GATEWAY_TOKEN),false);
 }
});

test('disabled, absent or owner-mismatched models stop before any inference despite configured legacy keys',async()=>{
 for(const data of [catalog(false),{data:[]},{data:[{...rows()[0],owned_by:'google'}]},{data:[{...rows()[0],enabled:undefined}]}]){
  const t=transport([()=>wire(data)]);
  await assert.rejects(askKnowledgeProvider('gpt','{}',passages,env,t.budget),e=>safe(e));
  assert.equal(t.calls.length,1);assert.equal(t.calls[0].init.method,'GET');
 }
 const t=transport([()=>wire(catalog(false))]);
 await assert.rejects(requestNeonInference('chat','openai/gpt-5-4-mini',{messages:[]},env,t.budget),e=>safe(e,'credits_required'));
 assert.equal(t.calls.length,1);
});

test('inference rechecks availability and preserves safe credits/rate reasons without fallback or raw upstream errors',async()=>{
 // A prior enabled snapshot does not authorize a call after credits disappear.
 assert.equal(knowledgeProviderStatus('gpt',env,observed()).canExecute,true);
 const disabled=transport([()=>wire(catalog(false))]);
 await assert.rejects(askKnowledgeProvider('gpt','{}',passages,env,disabled.budget),e=>safe(e,'credits_required'));
 assert.equal(disabled.calls.length,1);
 for(const [status,reason]of [[402,'credits_required'],[401,'authentication_required'],[403,'scope_denied'],[429,'rate_limited'],[500,'gateway_unavailable']] as const){
  const t=transport([()=>wire(catalog()),()=>wire({unavailable_reason:status===402?'credits_required':undefined,error:{message:env.NEON_AI_GATEWAY_TOKEN},recovery_url:'https://untrusted.test'},status)]);
  await assert.rejects(requestNeonInference('responses','gpt-5-4-mini',{},env,t.budget),e=>safe(e,reason));
  assert.equal(t.calls.length,2);
 }
});

test('actual returned model must match an enabled catalog identity; no requested-name or alias inference is accepted',async()=>{
 for(const model of [undefined,'gpt-5.4-mini-alias','gpt-another','google/gpt-5-4-mini',env.NEON_AI_GATEWAY_TOKEN]){
  const t=transport([()=>wire(catalog()),()=>wire({...answer('gpt'),model})]);
  await assert.rejects(askKnowledgeProvider('gpt','{}',passages,env,t.budget),e=>safe(e,'response_model_unverified'));
  assert.equal(t.calls.length,2);
 }
 const t=transport([()=>wire(catalog()),()=>wire({...answer('gemini'),modelVersion:'gemini-alias'})]);
 await assert.rejects(askKnowledgeProvider('gemini','{}',passages,env,t.budget),e=>safe(e,'response_model_unverified'));
 const good=transport([()=>wire(catalog()),()=>wire({model:'claude-haiku-4-5',choices:[]})]);
 const result=await requestNeonInference('chat','anthropic/claude-haiku-4-5',{},env,good.budget);
 assert.equal(result.modelIdentity,'anthropic/claude-haiku-4-5');assert.equal(result.modelOwner,'anthropic');
});

test('Neon responses retain completeness, exact quotation and bounded transfer gates with no automatic retry',async()=>{
 const invalidCitation={...rawAnswer(),claims:[{text:'Unsupported claim',citations:[{id:passages[0].id,quote:'This quotation was never supplied in the source.'}]}]};
 const responses:Array<[KnowledgeProvider,()=>Response]>=[
  ['gpt',()=>wire({...answer('gpt'),status:'incomplete'})],
  ['gpt',()=>wire(answer('gpt',invalidCitation))],
  ['gpt',()=>wire({...answer('gpt'),output:[{type:'message',content:[{type:'output_text',text:'not JSON'}]}]})],
  ['gemini',()=>wire({...answer('gemini'),candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(rawAnswer())}]}}]})],
  ['gemini',()=>wire({...answer('gemini'),promptFeedback:{blockReason:'SAFETY'}})],
  ['gemini',()=>wire({...answer('gemini'),candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(rawAnswer()),thought:true}]}}]})],
  ['gpt',()=>new Response('x'.repeat(524289),{headers:{'Content-Type':'application/json'}})],
 ];
 for(const [provider,response]of responses){
  const t=transport([()=>wire(catalog()),response]);
  await assert.rejects(askKnowledgeProvider(provider,'{}',passages,env,t.budget),error=>{
   assert.equal(String(error).includes(env.NEON_AI_GATEWAY_TOKEN),false);return true;
  });assert.equal(t.calls.length,2);
 }
 const noCalls=transport([]);
 assert.equal((await askKnowledgeProvider('gpt','{}',[],env,noCalls.budget)).state,'ABSTAIN');
 await assert.rejects(askKnowledgeProvider('gpt','x'.repeat(40001),passages,env,noCalls.budget),/transfer boundary/);
 assert.equal(noCalls.calls.length,0);
});

test('Council Neon inference binds actual owner/id and never enters legacy fallback or OIDC routes',async()=>{
 await withEnvironment(env,async()=>{
  const t=transport([()=>wire(catalog()),()=>wire({model:'gpt-5-4-mini',choices:[{finish_reason:'stop',message:{content:'A cautious synthetic analysis with a proposed validation step.'}}]})]);
  const result=await infer('Synthetic analysis role','Synthetic question','openai/gpt-5-4-mini',t.fetcher);
  assert.equal(result.ok,true);assert.equal(result.model,'openai/gpt-5-4-mini');assert.equal(result.modelOwner,'openai');
  assert.equal(result.modelVerified,true);assert.equal(result.transport,'neon');assert.equal(result.recipient,NEON_AI_RECIPIENT);assert.equal(result.fallbackUsed,false);
  assert.equal(t.calls[1].url,origin+'/v1/chat/completions');
  const body=JSON.parse(String(t.calls[1].init.body));assert.equal(body.model,'gpt-5-4-mini');assert.equal(body.max_tokens,2400);
  assert.match(body.messages[0].content,/do not imitate/i);assert.equal(body.tools,undefined);
  for(const secret of [env.AI_GATEWAY_API_KEY,env.VERCEL_OIDC_TOKEN])assert.equal(JSON.stringify(t.calls).includes(secret),false);
  const disabled=transport([()=>wire(catalog(false))]);
  const failed=await infer('Synthetic role','Synthetic prompt',undefined,disabled.fetcher);
  assert.equal(failed.ok,false);assert.equal(failed.unavailableReason,'credits_required');assert.match(failed.error||'',/credits_required/);
  assert.equal(failed.fallbackUsed,false);assert.equal(disabled.calls.length,1);
 });
});

test('Council distinguishes model variety from independently identified providers',async()=>{
 await withEnvironment({...env,AI_GATEWAY_FORCE_MULTIPROVIDER:'true'},async()=>{
  const input={prompt:'How should a synthetic service validate delivery?',count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'};
  for(const [identities,expected]of [
   [['openai/gpt-5-4-mini','openai/gpt-another','openai/gpt-third'],1],
   [['gpt-5-4-mini','gemini-3-5-flash-lite','claude-haiku-4-5'],0],
   [['openai/gpt-5-4-mini','google/gemini-3-5-flash-lite','anthropic/claude-haiku-4-5'],3],
  ] as Array<[string[],number]>){
   let calls=0;
   const result=await convene(input,{
    research:async()=>({sources:[],status:'NO_RESULTS'}),
    infer:async()=>({ok:true,text:'Proposed validation requires local testing; outcomes are unknown.',model:identities[calls++]||identities[0]}),
   });
   assert.equal(result.modelProvenance?.verifiedProviderCount,expected);
   assert.equal(result.modelProvenance?.independentSystemsVerified,expected===3);assert.equal(calls,5);
  }
 });
});
