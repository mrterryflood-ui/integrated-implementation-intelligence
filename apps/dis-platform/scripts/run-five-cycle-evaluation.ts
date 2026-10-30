import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {convene,infer,research} from '../lib/council-engine';
import {assemble} from '../lib/council-assembly';
import {MEMBERS} from '../lib/council';
import {reviewAnswer,learningRecord} from '../lib/answer-quality';
import {sanitizeIntake} from '../lib/consultation';
import {buildPackage} from '../lib/consultation-package';
import {exportDocx,exportPptx} from '../lib/consultation-export';
import {buildPlaybook} from '../lib/decision-playbook';
import {buildLearningCheckpoint} from '../lib/longitudinal-learning';
import {planOwnedCapabilities,invokeOwnedCapabilities} from '../lib/owned-capability-fabric';
import {DISCIPLINES} from '../lib/enterprise-mission';
import {completedEvaluation} from './synthesis-evaluation-output';
const MODEL='nvidia/nemotron-3.5-lightning-free';
export const CASES=[
 ['household learning self regulation','an individual parent'],['caregiver support coordination','a family caregiver'],['public transport accessibility reliability','a municipal transport team'],['water conservation demand management','a local government'],['university teaching active learning','a university teaching team'],
 ['museum accessibility cultural participation','a community nonprofit'],['agriculture irrigation adoption','a small farm business'],['manufacturing quality improvement','a manufacturing team'],['emergency warning preparedness','a public emergency planning team'],['workforce training retention','a workforce nonprofit'],
 ['housing navigation access','an individual resident'],['digital service accessibility','a university technology team'],['community violence prevention implementation','a community coalition'],['residential energy efficiency adoption','a household'],['ecosystem restoration monitoring','an environmental organization'],
 ['public administration service delivery','a government department'],['nonprofit collaboration capacity','a nonprofit partnership'],['school attendance engagement','a school team'],['youth sports coaching feedback','a volunteer coach'],['cultural heritage stewardship participation','a community organization'],
 ['implementation science audit feedback fidelity','a university research team'],['organizational learning psychological safety','a small business team'],['software reliability incident learning','a software team'],['health services access equity','a health service improvement team'],['decision making uncertainty unfamiliar systems','an individual exploring an unfamiliar domain']
] as const;
type Config={sha:string;count:number;concurrency:number;deadline:number};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function runFiveCycles(config:Config){
 const dir='public/dis-evaluation/five-cycles';mkdirSync(dir,{recursive:true});
 const outputs:any[]=[],cycles:any[]=[],sources:any[]=[];const startedAt=new Date().toISOString();let stop:string|null=null,lessons:string[]=[],nextAt=0,priceVerified=false;
 const save=()=>{const ledger=outputs.map(x=>JSON.stringify(x)).join('\n')+'\n';const summary={kind:'FIVE_SEQUENTIAL_MODEL_LEARNING_CYCLES',sha:config.sha,startedAt,observedAt:new Date().toISOString(),state:stop?'STOPPED':cycles.length===5?'EXECUTION_FINISHED_REVIEW_REQUIRED':'RUNNING',requestedCases:25,attempted:outputs.length,completeResponses:outputs.filter(x=>x.completed).length,cyclesExecuted:cycles.length,requestedModel:MODEL,priceVerified,stopReason:stop,registeredPerspectives:MEMBERS.length,registeredMethodDomains:new Set(MEMBERS.map(x=>x.domain)).size,governingDisciplines:DISCIPLINES.length,livePartnerRoundTrips:0,tenantAcceptance:'NOT_RUN',claimValidation:'NOT_INDEPENDENTLY_VALIDATED',modelWeightsChanged:false,knowledgePromoted:false,comparator:'NO_BLINDED_BASELINE; different cases across cycles cannot establish causal improvement',ledgerSha256:hash(ledger),cycles};writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2));writeFileSync(dir+'/runs.jsonl',ledger);writeFileSync(dir+'/sources.json',JSON.stringify(sources));};
 // Entry authorization is repeated here to prevent direct imports bypassing the build guard.
 if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_PROJECT_ID!=='prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT'||process.env.DIS_EVAL_ENABLE!=='owner-approved-preview'||process.env.DIS_EVAL_MODE!=='five-cycles'||process.env.VERCEL_GIT_COMMIT_SHA!==config.sha||process.env.DIS_EVAL_APPROVED_SHA!==config.sha||config.count!==25||config.concurrency!==1||config.deadline<=Date.now()||config.deadline>Date.now()+900000){stop='EVALUATION_AUTHORIZATION_GATE';save();return;}
 if(!process.env.VERCEL_OIDC_TOKEN){stop='OIDC_UNAVAILABLE';save();return;}
 const catalog=await fetch('https://ai-gateway.vercel.sh/v1/models',{signal:AbortSignal.timeout(10000),redirect:'error'}).then(r=>r.ok?r.json():null).catch(()=>null);
 const entry=catalog?.data?.find((m:any)=>m.id===MODEL);
 if(!entry||entry.type!=='language'||entry.pricing?.input===undefined||entry.pricing?.output===undefined||Number(entry.pricing.input)!==0||Number(entry.pricing.output)!==0){stop='MODEL_PRICE_GATE';save();return;}priceVerified=true;
 delete process.env.AI_GATEWAY_API_KEY;delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;process.env.AI_GATEWAY_MODEL=MODEL;
 for(let cycle=1;cycle<=5&&!stop;cycle++){
  const previous=cycles.at(-1);const inputLessons=[...lessons];const group:any[]=[];
  for(let item=0;item<5&&!stop;item++){
   const index=(cycle-1)*5+item,[topic,role]=CASES[index];
   if(Date.now()>=config.deadline){stop='WALL_TIME_LIMIT';break;}
   const fetched=await research(topic,async(input,init)=>{const u=new URL(String(input));if(u.origin!=='https://api.openalex.org'||u.pathname!=='/works')throw Error('Source origin denied');const r=await fetch(input,{...init,redirect:'error'});if([401,402,403,429].includes(r.status))stop='SOURCE_HTTP_'+r.status;return r;});
   sources.push({case:index+1,topic,retrievedAt:new Date().toISOString(),...fetched,sources:fetched.sources.slice(0,2)});
   if(stop)break;
   if(!fetched.sources.length){outputs.push({cycle,case:index+1,topic,completed:false,modelAttempted:false,error:'NO_USABLE_SOURCE_EVIDENCE'});save();continue;}
   const prompt=`Synthetic evaluation only; no real person or organization is represented. I am ${role}. Help me understand and improve ${topic}. We have limited resources and no measured baseline. Give a useful next step I can actually take, competing options, evidence limitations, fidelity, measures and a respectful invitation to refine. Do not assign me authority I do not have.`;
   const roster=assemble({prompt,count:6,redCount:4});
   const capabilityPlan=planOwnedCapabilities(prompt);let privateCalls=0;
   const partnerReceipts=await invokeOwnedCapabilities(capabilityPlan.selected.map(x=>x.id),{},async()=>{privateCalls++;throw Error('Partner authorization absent')});
   let status:number|null=null,finish:string|null=null,raw='',usage:any=null,requestId:string|null=null,observedModel:string|null=null;
   const wait=Math.max(0,nextAt-Date.now());if(Date.now()+wait>=config.deadline){stop='WALL_TIME_LIMIT';break;}if(wait)await pause(wait);nextAt=Date.now()+20000;
   const gatewayFetch:typeof fetch=async(input,init)=>{
    if(String(input)!=='https://ai-gateway.vercel.sh/v1/chat/completions'||stop)throw Error('Gateway scope denied');
    const body=JSON.parse(String(init?.body||'{}'));if(body.model!==MODEL)throw Error('Paid fallback denied');body.max_completion_tokens=1800;
    body.messages=body.messages.map((m:any)=>m.role==='system'?{...m,content:m.content+'\nPreviously observed quality defects to avoid (not new factual evidence):\n'+inputLessons.join('\n')}:m);
    const r=await fetch(input,{...init,body:JSON.stringify(body),redirect:'error'});status=r.status;requestId=r.headers.get('x-request-id')||r.headers.get('x-vercel-id');if([401,402,403,429].includes(status))stop='GATEWAY_HTTP_'+status;
    const json=await r.clone().json().catch(()=>null);finish=json?.choices?.[0]?.finish_reason||null;raw=typeof json?.choices?.[0]?.message?.content==='string'?json.choices[0].message.content:'';observedModel=typeof json?.model==='string'?json.model:null;usage=json?.usage?{input:Number(json.usage.prompt_tokens)||0,output:Number(json.usage.completion_tokens)||0}:null;return r;
   };
   const report=await convene({prompt,count:6,redCount:4,selected:[],redSelected:[],depth:'Standard',primaryMembers:roster.primary,redMembers:roster.red},{research:async()=>({...fetched,sources:fetched.sources.slice(0,2)}),infer:(s,p,m)=>infer(s,p,m,gatewayFetch)});
   const text=report.deliberation?.synthesis||'',completed=completedEvaluation(status,finish,raw,text);const quality=reviewAnswer(text,prompt,fetched.sources.slice(0,2));
   const pkg=buildPackage(sanitizeIntake({mission:prompt,organization:'Synthetic evaluation',audience:role,resources:'Limited, no authorized expenditure',desiredOutcome:'Agree local measures of benefit, fidelity, adoption and burden'}),'general',null,report);
   const playbook=buildPlaybook(prompt,report),checkpoint=buildLearningCheckpoint(playbook,cycle,new Date().toISOString());
   const row={cycle,case:index+1,topic,role,prompt,modelAttempted:true,httpStatus:status,finishReason:finish,requestId,observedModel,usage,completed,response:text,rawResponse:raw,responseSha256:hash(raw),sourceIds:fetched.sources.slice(0,2).map(s=>s.id),quality,selectedPerspectives:[...roster.primary,...roster.red].map(m=>({id:m.id,domain:m.domain})),partnerReceipts:partnerReceipts.map(r=>({id:r.id,state:r.state,reason:r.reason})),privateCalls,documentCount:pkg.documents.length,slideCount:pkg.slides.length,learningCheckpoint:checkpoint,lessonsApplied:inputLessons};outputs.push(row);group.push(row);
   if(item===0){writeFileSync(dir+`/cycle-${cycle}.docx`,await exportDocx(pkg));writeFileSync(dir+`/cycle-${cycle}.pptx`,await exportPptx(pkg));}
   save();console.log('DIS_FIVE_CYCLE_CASE '+JSON.stringify({cycle,case:index+1,completed,httpStatus:status,qualityIssues:quality.issues}));
  }
  if(group.length){const learning=learningRecord(cycle,group.filter(x=>x.completed).map(x=>x.quality),lessons);lessons=learning.lessonsForNextCycle;cycles.push({...learning,attempted:group.length,complete:group.filter(x=>x.completed).length,predecessorReceipt:previous?hash(JSON.stringify(previous)):null,inputLessons,privateCalls:group.reduce((n,x)=>n+x.privateCalls,0)});save();console.log('DIS_FIVE_CYCLE_LEARNING '+JSON.stringify(cycles.at(-1)));}
 }
 save();console.log('DIS_FIVE_CYCLES_FINISHED '+JSON.stringify({cycles:cycles.length,attempted:outputs.length,complete:outputs.filter(x=>x.completed).length,stop}));
}
