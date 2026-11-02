import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {convene,infer} from '../lib/council-engine';
import {integratedCouncilResearch} from '../lib/integrated-research';
const MODEL='nvidia/nemotron-3.5-lightning-free';
export function planningReviewAuthorized(env:Record<string,string|undefined>,now=Date.now()):boolean{
 const sha=env.VERCEL_GIT_COMMIT_SHA||'',deadline=Number(env.DIS_PLAN_REVIEW_DEADLINE);
 return Number.isSafeInteger(now)&&Number.isSafeInteger(deadline)&&deadline>now&&deadline<=now+900000&&env.VERCEL_ENV==='preview'&&env.VERCEL_PROJECT_ID==='prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT'&&env.DIS_PLAN_REVIEW_ENABLE==='owner-approved-preview'&&env.DIS_PLAN_REVIEW_SHA===sha&&/^[a-f0-9]{40}$/.test(sha);
}
/** Owner-authorized public-source review of this build. No personal records, email or production writes. */
export async function runPlanningReview(){
 const sha=process.env.VERCEL_GIT_COMMIT_SHA||'',deadline=Number(process.env.DIS_PLAN_REVIEW_DEADLINE||0),dir='public/dis-evaluation/planning';
 if(!planningReviewAuthorized(process.env)){console.log('DIS_PLAN_REVIEW_NOT_AUTHORIZED');return;}
 mkdirSync(dir,{recursive:true});const startedAt=new Date().toISOString(),calls:any[]=[],sources:any[]=[];let stop='';
 const save=(result:unknown)=>{const receipt={sha,startedAt,finishedAt:new Date().toISOString(),mode:'LIVE_PROVIDER_ATTEMPT_PUBLIC_INPUT_ONLY',calls,sources,stop,result,independentHumanReview:false,productionUploadTested:false,emailSent:false};writeFileSync(dir+'/receipt.json',JSON.stringify(receipt,null,2));console.log('DIS_PLAN_REVIEW_RECEIPT '+JSON.stringify({sha,calls:calls.length,normalCompletions:calls.filter(x=>x.status===200&&x.finish==='stop').length,stop,state:(result as any)?.state||'NOT_RUN'}));};
 try{
  const models=await fetch('https://ai-gateway.vercel.sh/v1/models',{signal:AbortSignal.timeout(10000),redirect:'error'}).then(r=>r.ok?r.json():null);
  const m=models?.data?.find((x:any)=>x.id===MODEL);if(!m||m.pricing?.input===undefined||m.pricing?.output===undefined||Number(m.pricing.input)!==0||Number(m.pricing.output)!==0){stop='FREE_MODEL_PRICE_GATE';save(null);return;}
  process.env.AI_GATEWAY_MODEL=MODEL;delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
  const contract=readFileSync('lib/planning-contract.ts','utf8');
  const question='Review this Texas Austin nonprofit organizational-planning remediation for needs, gaps, alternatives and implementation. Chapter decision body and quorum must be confirmed; a portal administrator has no automatic strategy or budget approval power. Editable DOCX/CSV/JSON and direct entry share section identifiers. Private drafts and ordinary chat are excluded from automatic reconciliation. Original files need direct private object storage, quota reservation and actual database constraints; larger policy constants alone are not implementation. External primary sources must join the same evidence and council workflow as relevant owned capabilities, with no vendor preference. Assess Texas workforce funding: a new youth and caregiver pilot has no independently validated placement history, no committed eligible training lead, no employer letters and no confirmed match. Identify suitable partner routes and evidence requirements; distinguish grade-school exposure from eligible adult employment training. Do not claim current grant openings or available funds without evidence. No email is authorized. Provide an integrated recommended next sequence and the unresolved human decisions. Source-code fact: governance approval checks exact plan digests and unique authorized ballots; application-wide enforcement remains to be tested. Contract SHA256='+createHash('sha256').update(contract).digest('hex');
  const result=await convene({prompt:question,count:6,redCount:4,selected:[],redSelected:[],depth:'Deep',challengeEnabled:true},{research:async(q)=>{const found=await integratedCouncilResearch(q);sources.push(...found.sources);return found;},infer:async(system,prompt,model)=>{
   if(stop||calls.length>=3||Date.now()+20000>=deadline)return{ok:false,text:'',error:'Bounded review stopped'};
   return infer(system,prompt,MODEL,async(url,init)=>{if(String(url)!=='https://ai-gateway.vercel.sh/v1/chat/completions')throw Error('Unexpected provider');const body=JSON.parse(String(init?.body));if(body.model!==MODEL)throw Error('Paid fallback denied');const r=await fetch(url,{...init,redirect:'error'});const j=await r.clone().json().catch(()=>null);calls.push({status:r.status,finish:j?.choices?.[0]?.finish_reason||null,model:j?.model||null,usage:j?.usage?{input:j.usage.prompt_tokens,output:j.usage.completion_tokens}:null,requestId:r.headers.get('x-vercel-id')||r.headers.get('x-request-id'),at:new Date().toISOString()});if([401,402,403,429].includes(r.status))stop='GATEWAY_HTTP_'+r.status;return r;});
  }});save(result);
 }catch(e){stop='REVIEW_ERROR';save({error:e instanceof Error?e.message:'Unknown review failure'});}
}
