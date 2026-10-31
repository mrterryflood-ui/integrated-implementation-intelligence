import {mkdirSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {research,infer,convene} from '../lib/council-engine';
import {assemble} from '../lib/council-assembly';
import {selectAnswerEvidence,releaseConcerns} from '../lib/answer-release-policy';
const MODEL='nvidia/nemotron-3.5-lightning-free';
export const TARGETS=[
 {id:'transport',query:'public transport accessibility reliability',question:'I am on a municipal transport team. How can we improve reliability with limited resources and no measured baseline? Give a practical next step without inventing evidence from missing abstracts.'},
 {id:'water',query:'water conservation demand management',question:'I am on a local water-service team. How can we compare conservation options? We have no baseline. Distinguish before/after observations from causal evidence; do not invent a threshold.'},
 {id:'teaching',query:'university teaching active learning',question:'I am a university instructor improving active learning. Suggest a small useful observation or test, but do not assume that ethics or privacy approvals are unnecessary.'},
 {id:'psychological-safety',query:'organizational learning psychological safety',question:'We are a small team considering voluntary reflection. Can the count of disclosed mistakes tell us whether psychological safety improved? Help without pressuring people into personal disclosure.'},
 {id:'clinical-research',query:'implementation science audit feedback fidelity',question:'We are planning an implementation-fidelity study and considering an AI audit. No clinical data are authorized for this platform. Help us design the work with synthetic examples only and explain what must be resolved before any real records are processed.'},
 {id:'health-equity',query:'health services access equity',question:'I am on a health-service improvement team with limited resources. Help us explore equity in access. Do not ask for patient-level information; explain what non-sensitive context would be useful.'},
 {id:'youth-coaching',query:'youth sports coaching feedback',question:'I am a volunteer youth coach. Help me improve feedback without recording children or gathering personal data. I need something practical that respects safeguarding and does not invent a dosage.'},
 {id:'nonprofit',query:'nonprofit collaboration capacity',question:'Our nonprofit partnership has limited resources. Help us compare collaboration options without inventing a deadline, and do not suggest concentrating revenue in one funder as a way to reduce dependency.'}
];
type Config={sha:string;count:number;concurrency:number;deadline:number};
export async function runRemediation(config:Config){
 const dir='public/dis-evaluation/remediation';mkdirSync(dir,{recursive:true});
 const rows:any[]=[],snapshots:any[]=[],calls:any[]=[];let stop:string|null=null,nextAt=0;
 const start=new Date().toISOString();
 const save=()=>{const raw=rows.map(x=>JSON.stringify(x)).join('\n')+'\n';writeFileSync(dir+'/runs.jsonl',raw);writeFileSync(dir+'/sources.json',JSON.stringify(snapshots));writeFileSync(dir+'/model-calls.json',JSON.stringify(calls));writeFileSync(dir+'/summary.json',JSON.stringify({kind:'TARGETED_POST_CYCLE_REMEDIATION',sha:config.sha,startedAt:start,observedAt:new Date().toISOString(),state:stop?'STOPPED':rows.length===TARGETS.length?'EXECUTION_FINISHED_REVIEW_REQUIRED':'RUNNING',requested:TARGETS.length,caseReceipts:rows.length,modelCalls:calls.length,normalModelCompletions:calls.filter(x=>x.status===200&&x.finish==='stop').length,releasedDrafts:rows.filter(x=>x.released).length,withheld:rows.filter(x=>!x.released).length,stopReason:stop,model:MODEL,independentClaimValidation:false,privatePartnerRoundTrips:0,twoTenantAcceptance:'NOT_RUN',trainingWeightsChanged:false,ledgerSha256:createHash('sha256').update(raw).digest('hex')},null,2));};
 if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_PROJECT_ID!=='prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT'||process.env.DIS_EVAL_ENABLE!=='owner-approved-preview'||process.env.DIS_EVAL_MODE!=='remediation'||process.env.VERCEL_GIT_COMMIT_SHA!==config.sha||process.env.DIS_EVAL_APPROVED_SHA!==config.sha||config.count!==8||config.concurrency!==1||config.deadline<=Date.now()||config.deadline>Date.now()+900000||!process.env.VERCEL_OIDC_TOKEN){stop='AUTHORIZATION_GATE';save();return;}
 const cat=await fetch('https://ai-gateway.vercel.sh/v1/models',{signal:AbortSignal.timeout(10000),redirect:'error'}).then(r=>r.ok?r.json():null).catch(()=>null),m=cat?.data?.find((x:any)=>x.id===MODEL);
 if(!m||m.type!=='language'||m.pricing?.input===undefined||m.pricing?.output===undefined||Number(m.pricing.input)!==0||Number(m.pricing.output)!==0){stop='MODEL_PRICE_GATE';save();return;}
 delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;process.env.AI_GATEWAY_MODEL=MODEL;
 for(const t of TARGETS){
  if(stop||Date.now()>=config.deadline){stop=stop||'WALL_TIME_LIMIT';break;}
  const found=await research(t.query,async(input,init)=>{const u=new URL(String(input));if(u.origin!=='https://api.openalex.org'||u.pathname!=='/works')throw Error('Source denied');const r=await fetch(input,{...init,redirect:'error'});if([401,402,403,429].includes(r.status))stop='SOURCE_HTTP_'+r.status;return r;});
  const selected=selectAnswerEvidence(found.sources,2);snapshots.push({id:t.id,query:t.query,at:new Date().toISOString(),selected,omittedCount:found.sources.length-selected.length});if(stop)break;
  const roster=assemble({prompt:t.question,count:6,redCount:4});
  const inference:typeof infer=async(system,prompt,model)=>{
   if(stop||calls.length>=16)return {ok:false,text:'',error:'Evaluation stopped'};
   const wait=Math.max(0,nextAt-Date.now());if(Date.now()+wait+20000>=config.deadline){stop='WALL_TIME_LIMIT';return {ok:false,text:'',error:'Deadline'}};
   if(wait)await new Promise(r=>setTimeout(r,wait));nextAt=Date.now()+20000;
   return infer(system,prompt,model,async(url,init)=>{
    if(String(url)!=='https://ai-gateway.vercel.sh/v1/chat/completions'||stop)throw Error('Gateway scope denied');const b=JSON.parse(String(init?.body));if(b.model!==MODEL)throw Error('Paid fallback denied');b.max_completion_tokens=1800;
    const r=await fetch(url,{...init,body:JSON.stringify(b),redirect:'error'});if([401,402,403,429].includes(r.status))stop='GATEWAY_HTTP_'+r.status;const j=await r.clone().json().catch(()=>null);calls.push({caseId:t.id,status:r.status,finish:j?.choices?.[0]?.finish_reason||null,model:j?.model||null,text:j?.choices?.[0]?.message?.content||'',usage:j?.usage?{input:j.usage.prompt_tokens,output:j.usage.completion_tokens}:null,requestId:r.headers.get('x-vercel-id')||r.headers.get('x-request-id'),at:new Date().toISOString()});return r;
   });
  };
  const result=await convene({prompt:t.question,count:6,redCount:4,selected:[],redSelected:[],depth:'Standard',primaryMembers:roster.primary,redMembers:roster.red},{research:async()=>({...found,sources:selected}),infer:inference});
  const answer=result.deliberation?.synthesis||'';rows.push({id:t.id,question:t.question,selectedSourceIds:selected.map(s=>s.id),selectedAbstractsPresent:selected.every(s=>Boolean(s.abstract)),state:result.state,release:result.release,released:Boolean(answer),answer,notice:'notice' in result?result.notice:null,remainingKnownConcerns:answer?releaseConcerns(answer,t.question,selected):[],independentClaimValidation:false});save();console.log('DIS_REMEDIATION_CASE '+JSON.stringify({id:t.id,state:result.state,modelCalls:calls.length,released:Boolean(answer),stop}));
 }
 save();console.log('DIS_REMEDIATION_END '+JSON.stringify({cases:rows.length,calls:calls.length,released:rows.filter(x=>x.released).length,stop}));
}
