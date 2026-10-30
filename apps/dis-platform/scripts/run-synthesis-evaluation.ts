import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {convene,infer,research} from '../lib/council-engine';

/** Owner-directed preview evaluation; no public execution endpoint or production auth bypass. */
export const EVALUATION_MODEL='nvidia/nemotron-3.5-lightning-free';
const PROJECT='prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT';
type Config={sha:string;count:number;concurrency:number;deadline:number};
export function evaluationConfig(env:Record<string,string|undefined>,now=Date.now()):Config|null {
 if(env.DIS_EVAL_ENABLE!=='owner-approved-preview'||env.VERCEL_ENV!=='preview')return null;
 const sha=env.DIS_EVAL_APPROVED_SHA||'';
 if(!/^[a-f0-9]{40}$/.test(sha)||sha!==env.VERCEL_GIT_COMMIT_SHA||env.VERCEL_PROJECT_ID!==PROJECT)return null;
 const count=Number(env.DIS_EVAL_MAX_RUNS),concurrency=Number(env.DIS_EVAL_CONCURRENCY||'2');
 const deadline=Date.parse(env.DIS_EVAL_DEADLINE||'');
 if(!Number.isInteger(count)||count<1||count>1000||!Number.isInteger(concurrency)||concurrency<1||concurrency>4)return null;
 if(!Number.isFinite(deadline)||deadline<=now||deadline>now+3600000)return null;
 return {sha,count,concurrency,deadline:Math.min(deadline,now+900000)};
}
export function sourceStopReason(status:number):string|null {
 return [401,402,403,429].includes(status)?'SOURCE_AUTH_QUOTA_OR_BUDGET_HTTP_'+status:null;
}
export function evidenceReady(found:{sources:unknown[];status:string}):boolean {
 return found.status==='ABSTRACT_AND_METADATA'&&found.sources.length>0;
}
export function structuralScores(text:string,sourceIds:readonly string[]) {
 const cited=[...new Set((text.match(/\[S\d+\]/g)||[]).map(s=>s.slice(1,-1)))];
 return {hasSubstantiveText:text.trim().length>=250,citedIds:cited,unknownCitationIds:cited.filter(s=>!sourceIds.includes(s)),uncertainty:/unknown|uncertain|hypothes|not establish|insufficient|unverified/i.test(text),alternatives:/alternative|option|competing|no.change|status quo/i.test(text),measurement:/baseline|denominator|measure|threshold/i.test(text),fidelity:/fidelity|core component|adherence|adaptation/i.test(text),accountability:/owner|responsib|human approval|authorization/i.test(text),claimEntailment:'NOT_INDEPENDENTLY_SCORED'};
}
const domains=[
 ['household-learning','household learning self regulation education'],
 ['caregiver-support','family caregiver support coordination burden'],
 ['public-transport','public transport accessibility service reliability'],
 ['water','municipal water conservation demand management'],
 ['university-teaching','university teaching active learning evaluation'],
 ['culture','museum accessibility cultural participation'],
 ['agriculture','agricultural irrigation water efficiency adoption'],
 ['manufacturing','manufacturing quality process improvement fidelity'],
 ['emergency','emergency preparedness warning response evaluation'],
 ['workforce','workforce training employment retention evaluation'],
 ['housing','housing social care navigation referral completion'],
 ['digital-access','digital accessibility public service usability'],
 ['community-safety','community violence prevention program evaluation'],
 ['energy','residential energy efficiency behavior adoption'],
 ['environment','ecosystem restoration community monitoring outcomes'],
 ['public-administration','public administration service delivery evaluation'],
 ['nonprofit','nonprofit collaboration implementation capacity'],
 ['school','school attendance engagement implementation'],
 ['sports','youth sports coaching learning feedback'],
 ['heritage','cultural heritage community participation stewardship'],
 ['research','implementation science audit feedback fidelity'],
 ['organizational-learning','organizational learning psychological safety improvement'],
 ['software','software reliability incident learning engineering'],
 ['health-services','health services access implementation equity'],
 ['emerging-domain','uncertainty decision making unfamiliar complex systems']
] as const;
const stakeholders=['an individual','a family','a community association','a local government','a university','a small business','a nonprofit','a cross-sector partnership'];
const contexts=[
 'Baseline observations are missing. Identify what must be measured before recommending action.',
 'Resources are constrained. Compare a reversible small pilot with retaining the present approach.',
 'Stakeholders disagree about success. Preserve dissent and identify a fair decision process.',
 'Implementation differs across settings. Separate core functions from locally adaptable delivery.',
 'New information challenges the original plan. Specify reassessment triggers and safe learning.'
];
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function runEvaluation(config:Config):Promise<void>{
 const directory='public/dis-evaluation';mkdirSync(directory,{recursive:true});
 const startedAt=new Date().toISOString();
 const outputs:any[]=[];const snapshots:any[]=[];let stop:string|null=null,priceVerified=false;
 const summary=(state:string)=>({schema:'dis-evaluation-receipt-v1',state,sourceSha:config.sha,environment:'preview-build',startedAt,finishedAt:new Date().toISOString(),requested:config.count,attempted:outputs.length,modelResponsesWithText:outputs.filter(x=>x.responseText).length,completedSyntheses:outputs.filter(x=>x.completed).length,sourceGroundedCompletions:outputs.filter(x=>x.completed&&x.sourceIds.length>0).length,structuralChecksOnly:true,independentlyVerifiedClaims:0,livePartnerRoundTrips:0,requestedModel:EVALUATION_MODEL,observedResponseModels:[...new Set(outputs.map(x=>x.responseModel).filter(Boolean))],realWorldOutcomesMeasured:0,stopReason:stop,inputTokens:outputs.reduce((n,x)=>n+(x.usage?.prompt_tokens||0),0),outputTokens:outputs.reduce((n,x)=>n+(x.usage?.completion_tokens||0),0),priceCheck:priceVerified?'LIVE_CATALOG_INPUT_AND_OUTPUT_ZERO; final billing not independently reconciled':'NOT_VERIFIED',corpus:'25 domains x 8 stakeholder roles x 5 contexts; synthetic problems, not independent studies',evaluationLimits:['A completed generation is not a correct or useful decision','Citation identifiers do not establish claim support','Independent blinded expert evaluation and comparator runs remain required','No output is promoted into training, accepted knowledge or production policy'],outputLedgerSha256:hash(outputs.map(x=>JSON.stringify(x)).join('\n')+'\n')});
 const save=(state:string)=>{writeFileSync(directory+'/summary.json',JSON.stringify(summary(state),null,2));writeFileSync(directory+'/sources.json',JSON.stringify(snapshots));writeFileSync(directory+'/runs.jsonl',outputs.map(x=>JSON.stringify(x)).join('\n')+'\n');};
 if(!process.env.VERCEL_OIDC_TOKEN){stop='OIDC_UNAVAILABLE';save('BLOCKED');return;}
 try{
  const response=await fetch('https://ai-gateway.vercel.sh/v1/models',{signal:AbortSignal.timeout(10000),redirect:'error'});
  if(!response.ok)throw Error('MODEL_CATALOG_UNAVAILABLE');
  const catalog=await response.json();const entry=catalog.data?.find((x:any)=>x.id===EVALUATION_MODEL);
  if(!entry||entry.type!=='language'||entry.pricing?.input===undefined||entry.pricing?.output===undefined||Number(entry.pricing.input)!==0||Number(entry.pricing.output)!==0)throw Error('ZERO_PRICE_LANGUAGE_MODEL_NOT_VERIFIED');
  priceVerified=true;
 }catch{stop='MODEL_PRICE_OR_CATALOG_GATE';save('BLOCKED');return;}
 // Mutate this isolated child process only. Never use an unrelated API key or paid fallback.
 delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 process.env.AI_GATEWAY_MODEL=EVALUATION_MODEL;
 const sourceFetch:typeof fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(url.origin!=='https://api.openalex.org'||url.pathname!=='/works'||stop)throw Error('SOURCE_SCOPE_OR_CIRCUIT');
  const r=await fetch(input,{...init,redirect:'error'});stop=sourceStopReason(r.status);return r;
 };
 const needed=Math.min(domains.length,config.count);
 for(let d=0;d<needed;d++){
  if(stop||Date.now()>=config.deadline){stop=stop||'WALL_TIME_LIMIT';break;}
  const found=await research(domains[d][1],sourceFetch);
  snapshots.push({domain:domains[d][0],query:domains[d][1],at:new Date().toISOString(),...found,sources:found.sources.slice(0,2)});
  if(stop||!evidenceReady(found)){stop=stop||'SOURCE_EVIDENCE_UNAVAILABLE';break;}
  await sleep(300);
 }
 if(stop){save('STOPPED');console.log('DIS_EVAL_RECEIPT '+JSON.stringify(summary('STOPPED')));return;}
 let next=0;
 const worker=async()=>{while(!stop){const index=next++;if(index>=config.count)return;if(Date.now()>=config.deadline){stop='WALL_TIME_LIMIT';return;}
  const domainIndex=index%25,stakeholderIndex=Math.floor(index/25)%8,contextIndex=Math.floor(index/200)%5;
  const source=snapshots[domainIndex];
  if(!source||!evidenceReady(source)){stop='SOURCE_EVIDENCE_UNAVAILABLE';return;}
  const sources=source.sources.map((s:any)=>({...s,abstract:s.abstract?.slice(0,900)||null}));
  const prompt=`Synthetic evaluation only. No real person or organization is represented. Help ${stakeholders[stakeholderIndex]} reason about ${domains[domainIndex][1]}. ${contexts[contextIndex]} In at most 450 words provide: problem/context; competing options; evidence versus assumptions; safe implementation with owner and fidelity; outcome measures; review triggers and human approval. Do not invent observed outcomes, stakeholder testimony or authority. Source discovery is not claim verification.`;
  let status:number|null=null,finishReason:string|null=null,usage:any=null,requestId:string|null=null,responseModel:string|null=null;
  const gatewayFetch:typeof fetch=async(input,init)=>{
   const target=String(input);if(target!=='https://ai-gateway.vercel.sh/v1/chat/completions'||stop)throw Error('EVALUATION_GATE');
   const body=JSON.parse(String(init?.body||'{}'));if(body.model!==EVALUATION_MODEL)throw Error('PAID_MODEL_NOT_ALLOWED');
   body.max_completion_tokens=900;
   const r=await fetch(input,{...init,body:JSON.stringify(body),redirect:'error'});status=r.status;requestId=r.headers.get('x-request-id')||r.headers.get('x-vercel-id');
   if([401,402,403,429].includes(r.status))stop='GATEWAY_AUTH_QUOTA_OR_BUDGET_HTTP_'+r.status;
   const parsed=await r.clone().json().catch(()=>null);finishReason=parsed?.choices?.[0]?.finish_reason||null;responseModel=typeof parsed?.model==='string'?parsed.model:null;
   if(parsed?.usage)usage={prompt_tokens:Number(parsed.usage.prompt_tokens)||0,completion_tokens:Number(parsed.usage.completion_tokens)||0,total_tokens:Number(parsed.usage.total_tokens)||0};
   return r;
  };
  const at=Date.now();
  const report=await convene({prompt,count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'}, {research:async()=>({sources,status:source.status}),infer:(system,p,model)=>infer(system,p,model,gatewayFetch)});
  const responseText=report.deliberation?.synthesis||'';
  const completed=status===200&&finishReason==='stop'&&Boolean(responseText);
  outputs.push({id:'S'+String(index+1).padStart(4,'0'),domain:domains[domainIndex][0],stakeholder:stakeholders[stakeholderIndex],context:contexts[contextIndex],syntheticProblem:true,prompt,inputHash:hash(prompt),sourceIds:sources.map((s:any)=>s.id),sourceSnapshot:domainIndex,startedAt:new Date(at).toISOString(),elapsedMs:Date.now()-at,httpStatus:status,finishReason,requestId,responseModel,usage,completed,state:report.state,responseText,responseHash:hash(responseText),structural:structuralScores(responseText,sources.map((s:any)=>s.id)),error:report.error||null});
  if(outputs.length%10===0){save('RUNNING');console.log('DIS_EVAL_PROGRESS '+JSON.stringify({attempted:outputs.length,completed:outputs.filter(x=>x.completed).length,stop}));}
  await sleep(150);
 }};
 try{await Promise.all(Array.from({length:config.concurrency},worker));}catch{stop=stop||'EVALUATOR_EXCEPTION';}
 outputs.sort((a,b)=>a.id.localeCompare(b.id));save(stop?'STOPPED':'COMPLETED');console.log('DIS_EVAL_RECEIPT '+JSON.stringify(summary(stop?'STOPPED':'COMPLETED')));
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){const cfg=evaluationConfig(process.env);if(cfg)runEvaluation(cfg).catch(()=>{console.error('DIS_EVAL_BLOCKED_UNEXPECTED_ERROR');process.exitCode=1;});else console.log('DIS_EVAL_INACTIVE: no exact-head preview evaluation authorization.');}
