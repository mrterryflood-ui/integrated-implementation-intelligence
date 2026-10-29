import {getVercelOidcToken} from "@vercel/oidc";
import {selectCouncil,DEFAULT_RED} from "./council";
import type {CouncilMember} from "./council";
type Source={id:string,title:string,doi:string|null,url:string,year:number|null,abstract:string|null};
function compact(value:unknown,n=1000){return typeof value==="string"?value.slice(0,n):""}
export function reconstruct(index:Record<string,number[]>|null):string|null{
 if(!index||typeof index!=="object")return null;
 const arr:string[]=[];
 for(const [word,locations] of Object.entries(index))if(Array.isArray(locations))for(const p of locations)if(Number.isInteger(p)&&p>=0&&p<1800)arr[p]=word;
 return arr.filter(Boolean).join(" ").slice(0,3500)||null;
}
export async function research(query:string,fetcher=fetch):Promise<{sources:Source[],status:string,error?:string}>{
 const url="https://api.openalex.org/works?search="+encodeURIComponent(query.slice(0,230))+"&per-page=6&select=id,title,doi,publication_year,abstract_inverted_index";
 try{
  const response=await fetcher(url,{signal:AbortSignal.timeout(6500),headers:{Accept:"application/json"},cache:"no-store"});
  if(!response.ok)return {sources:[],status:"UNAVAILABLE",error:"Research provider HTTP "+response.status};
  const body:any=await response.json();
  const raw:Record<string,unknown>[]=Array.isArray(body.results)?body.results:[];
  const sources=raw.filter((x:Record<string,unknown>)=>typeof x.title==="string"&&typeof x.id==="string").map((x:Record<string,unknown>,i:number)=>({
   id:"S"+(i+1),title:String(x.title),doi:typeof x.doi==="string"?x.doi:null,url:typeof x.doi==="string"?x.doi:String(x.id),year:typeof x.publication_year==="number"&&Number.isInteger(x.publication_year)?x.publication_year:null,abstract:reconstruct(x.abstract_inverted_index as Record<string,number[]>|null)
  }));
  return {sources,status:sources.length?"ABSTRACT_AND_METADATA":"NO_RESULTS"};
 }catch(e){return {sources:[],status:"UNAVAILABLE",error:"Source lookup unavailable"}}
}
const instructions="You are an analysis role in DIS, a multidisciplinary research and implementation platform. The named thinkers are conceptual lenses derived from documented work; do not imitate their speech, invent quotes, or claim their participation. Treat retrieved source metadata and abstracts as limited evidence only. Cite relevant records as [S1] etc only when an abstract supports the precise claim. Otherwise explicitly call the assertion a hypothesis or unknown. Deliberately ask what is missing; consider stakeholders, ethics, feasible action, decision rights, falsification and sustainable outcomes. Never claim an action or test was executed if it was not.";
function sourceContext(sources:Source[]){return sources.map(s=>`[${s.id}] ${s.title} (${s.year??"unknown year"}) ${s.url}\nAbstract: ${s.abstract||"NOT AVAILABLE"}`).join("\n\n").slice(0,17500)}
function model(){return process.env.AI_GATEWAY_MODEL||"openai/gpt-5.4-mini"}
export async function infer(system:string,prompt:string,modelOverride?:string,fetcher=fetch):Promise<{ok:boolean,text:string,error?:string,model?:string,fallbackUsed?:boolean}>{
 const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||await getVercelOidcToken().catch(()=>null);
 if(!token)return {ok:false,text:"",error:"AI Gateway authentication not configured"};
 const primary=modelOverride||model(),fallback=model();
 const attempts=[primary,...(primary!==fallback?[fallback]:[])];
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),19000);
 try{
  for(let i=0;i<attempts.length;i++){
   const selected=attempts[i];
   const res=await fetcher("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",signal:controller.signal,headers:{"content-type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({model:selected,max_completion_tokens:2400,reasoning:{effort:"none"},messages:[{role:"system",content:instructions+"\n"+system},{role:"user",content:prompt}]})});
   if(!res.ok){
    const detail:any=await res.json().catch(()=>({}));
    const value=detail?.error?.code||detail?.code||detail?.error?.type||"unknown";
    const code=typeof value==="string"?value.slice(0,80):"unknown";
    if(i===0&&attempts.length>1&&[402,403,429,503].includes(res.status))continue;
    return {ok:false,text:"",error:"Gateway HTTP "+res.status+" ("+code+")"};
   }
   const json=await res.json();
   const content=compact(json.choices?.[0]?.message?.content,5000);
   return content?{ok:true,text:content,model:typeof json.model==="string"?json.model:undefined,fallbackUsed:i>0}:{ok:false,text:"",error:"Gateway returned no text (finish="+String(json.choices?.[0]?.finish_reason||"unknown").slice(0,30)+",output="+String(json.usage?.completion_tokens||"unknown")+")"};
  }
  return {ok:false,text:"",error:"No allowed model accepted the request"};
 }catch{return {ok:false,text:"",error:"Inference unavailable or timed out"}}finally{clearTimeout(timer)}
}
export function citationAudit(text:string,sources:Source[]){
 const cited=[...new Set((text.match(/\[S\d+\]/g)||[]).map(x=>x.slice(1,-1)))];
 const unknown=cited.filter(id=>!sources.some(s=>s.id===id));
 return {citedIds:cited,unknownIds:unknown,checked:"IDENTIFIER_EXISTENCE_ONLY",claimSupport:"NOT INDEPENDENTLY VERIFIED"};
}
export function parseActionPlan(raw:string){
 try{
  const cleaned=raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"");
  const a=JSON.parse(cleaned) as Record<string,unknown>;
  if(!a||!Array.isArray(a.tasks)||!Array.isArray(a.metrics))return null;
  const tasks=a.tasks.slice(0,6).filter((t:unknown)=>t&&typeof t==="object"&&typeof (t as {title?:unknown}).title==="string"&&typeof (t as {success?:unknown}).success==="string").map((t:{title:string,why?:string,success:string})=>({title:t.title.slice(0,180),why:String(t.why||"Verify applicability before implementation").slice(0,350),success:t.success.slice(0,350)}));
  const metrics=a.metrics.slice(0,5).filter((m:unknown)=>m&&typeof m==="object"&&typeof (m as {label?:unknown}).label==="string").map((m:{label:string,baseline?:string,target?:string,unit?:string})=>({label:m.label.slice(0,150),baseline:String(m.baseline||"Not measured").slice(0,90),target:String(m.target||"To be agreed").slice(0,90),unit:String(m.unit||"Defined by user").slice(0,60)}));
  return tasks.length>=2&&metrics.length>=1?{tasks,metrics,status:"MODEL_PROPOSED_UNVERIFIED"}:null;
 }catch{return null}
}
export async function convene(input:{prompt:string,count:number,redCount:number,selected:string[],redSelected:string[],depth:string,challengeEnabled?:boolean,primaryMembers?:CouncilMember[],redMembers?:CouncilMember[]},deps={research,infer}){
 const prompt=input.prompt.trim();
 const primary=input.primaryMembers??selectCouncil(prompt,input.count,input.selected,false);
 const red=input.challengeEnabled===false?[]:(input.redMembers??selectCouncil(prompt,input.redCount,input.redSelected.length?input.redSelected:DEFAULT_RED,true));
 const found=await deps.research(prompt);
 const ctx=sourceContext(found.sources);
 if(primary.length===1&&red.length===0){
  const member=primary[0];
  const answer=await deps.infer("One-on-one educational analytical lens: "+member.name+". Use documented ideas in "+member.domain+" and "+member.lens+". Do not imitate their voice, claim to be them or invent opinions, quotes or endorsements. Engage conversationally and ask a useful follow-up.", "Question: "+prompt+"\n\nRetrieved abstract-level evidence:\n"+ctx,process.env.AI_GATEWAY_PRIMARY_A_MODEL||model());
  if(!answer.ok)return {state:"INCOMPLETE",primary:[{id:member.id,name:member.name,perspective:member.lens,question:"Explore this approach"}],red:[],sources:found.sources,retrieval:found.status,error:answer.error||"One-on-one model unavailable",citations:{checked:"NOT_RUN",claimSupport:"NOT_VERIFIED"}};
  return {state:"PRELIMINARY_DELIBERATION",primary:[{id:member.id,name:member.name,perspective:member.lens,question:"Explore this approach"}],red:[],sources:found.sources,retrieval:found.status,deliberation:{primaryA:answer.text,primaryB:"",challenge:"",synthesis:answer.text},citations:citationAudit(answer.text,found.sources),modelProvenance:{models:[(answer as {model?:string}).model||null],verifiedProviderCount:(answer as {model?:string}).model?1:0,independentSystemsVerified:false},limitations:"One-on-one educational lens. This is not the actual person, their endorsement, or a consultation. Evidence is abstract-level and unverified."};
 }

 // Free-model beta: one actual inference, with conceptual council lenses only.
 // Never label this as independently executed multi-provider deliberation.
 if(model().endsWith("-free")&&!process.env.AI_GATEWAY_FORCE_MULTIPROVIDER){
  const primaryLens=primary.map(m=>m.domain+" — "+m.lens).join("; ").slice(0,2600);
  const challengeLens=red.map(m=>m.domain+" — "+m.lens).join("; ").slice(0,1400);
  const promptText="Question: "+prompt+"\n\nPrimary analysis lenses: "+primaryLens+"\n\nAdversarial challenge lenses: "+(challengeLens||"No secondary council requested")+
   "\n\nEvidence (abstracts only):\n"+ctx+
   "\n\nWrite a structured consultation with: problem clarification; 5Ws/H; at least two competing hypotheses; primary views; skeptic challenge including action, reaction and counteraction; evidence versus assumptions using [S#] identifiers only where supported by the quoted abstract; what would falsify each option; a practical pilot with owner and measurable outcomes; adoption and sustainability; explicit uncertainty. All generated views arise from ONE model and are NOT independent council executions.";
  const output=await deps.infer("One-model experimental DIS council simulation. All names and perspectives are educational analytical lenses, not real people. Do not fabricate consensus, research validation, or completed implementation.",promptText,model());
  const primaryViews=primary.map(m=>({id:m.id,name:m.name,perspective:m.lens,question:"Evaluate this question through "+m.domain+" methods"}));
  const redViews=red.map(m=>({id:m.id,name:m.name,challenge:"What assumption fails under "+m.domain+" scrutiny?"}));
  if(!output.ok)return {state:"INCOMPLETE",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,error:output.error||"AI council unavailable",citations:{citedIds:[],unknownIds:[],checked:"NOT_RUN",claimSupport:"NOT_VERIFIED"}};
  const audit=citationAudit(output.text,found.sources);
  return {state:audit.unknownIds.length?"CITATION_IDS_INVALID":"SINGLE_MODEL_BETA_UNVERIFIED",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,actionPlan:null,deliberation:{primaryA:"See integrated synthesis. There was one underlying model call.",primaryB:"Not independently executed.",challenge:"Adversarial lens was requested within the same model response. This is not an independent red-team execution.",synthesis:output.text},citations:audit,modelProvenance:{models:[output.model||null],verifiedProviderCount:output.model?1:0,independentSystemsVerified:false},callStatuses:[{ok:true,model:output.model||null}],limitations:"Free-model beta used one real model inference to simulate diverse methodological perspectives. No independent model-vendor deliberation, human consultation, full-text claim verification or completed implementation occurred. This provider may retain prompts for product improvement; do not submit confidential or sensitive content."};
 }
 const p1=primary.slice(0,Math.max(1,Math.ceil(primary.length/2))).map(x=>x.name+" — "+x.lens).join("; ");
 const p2=primary.slice(Math.ceil(primary.length/2)).map(x=>x.name+" — "+x.lens).join("; ");
 const challenge=red.map(x=>x.name+" — "+x.lens).join("; ");
 const shared=`Question: ${prompt}\nRequested depth: ${input.depth}\nSources (abstract-level only):\n${ctx||"NO VERIFIED SOURCES RETRIEVED"}`;
 const [first,second,critic]=await Promise.all([
  deps.infer("Primary council strand A. Analyze problem, propose alternative hypotheses. Intellectual lenses: "+p1,shared,process.env.AI_GATEWAY_PRIMARY_A_MODEL||model()),
  deps.infer("Primary council strand B. Independently explore stakeholder needs, feasibility, and counterarguments. Lenses: "+p2,shared,process.env.AI_GATEWAY_PRIMARY_B_MODEL||"google/gemini-3.5-flash-lite"),
  input.challengeEnabled===false?Promise.resolve({ok:true,text:"Challenge council disabled by user choice.",error:undefined as string|undefined}):deps.infer("Independent challenge strand. Perform adversarial analysis with no presumption of agreement. Lenses: "+challenge,shared,process.env.AI_GATEWAY_RED_MODEL||"deepseek/deepseek-v4.1-flash-fast")
 ]);
 const calls=[first,second,critic];
 const primaryViews=primary.map(m=>({id:m.id,name:m.name,perspective:m.lens,question:`From the ${m.domain.toLowerCase()} perspective, what evidence could prove or disprove our approach?`}));
 const redViews=red.map(m=>({id:m.id,name:m.name,challenge:`What important failure, unknown, or unintended consequence might this ${m.domain.toLowerCase()} lens reveal?`}));
 if(calls.some(c=>!c.ok))return {state:"INCOMPLETE",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,callStatuses:calls.map(x=>({ok:x.ok,error:x.error||null})),error:"Multi-agent deliberation incomplete. No simulated consensus.",citations:{citedIds:[],unknownIds:[],checked:"NOT_RUN",claimSupport:"NOT_VERIFIED"}};
 const joined="PRIMARY A:\n"+first.text+"\nPRIMARY B:\n"+second.text+"\nRED TEAM:\n"+critic.text;
 const synthesis=await deps.infer("Synthesis and independent assurance strand. Give: (1) direct answer, (2) strongest opposing hypothesis, (3) tested versus untested evidence, (4) what we are not asking, (5) actionable pilot plan with measurements, owners and safeguards, (6) remaining dissent and uncertainty. Do not claim verified consensus or experimentally tested results. Do not invent references; use cited source identifiers only if supported by given abstracts.",shared+"\n\nSeparate deliberation outputs:\n"+joined.slice(0,10000),process.env.AI_GATEWAY_SYNTHESIS_MODEL||model());
 if(!synthesis.ok)return {state:"INCOMPLETE",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,callStatuses:[...calls,{ok:false,error:synthesis.error}],error:"Synthesis did not complete",citations:{checked:"NOT_RUN"}};
 const planner=await deps.infer("Produce a concise tailored decision implementation workplan. Return ONLY a JSON object with tasks (3 to 5 objects with title,why,success) and metrics (3 to 4 objects with label,baseline,target,unit). Make tasks actionable for the precise question and intended stakeholders. All targets are proposals, not observed facts; use 'Not measured' if baseline unknown. Include a stop/go validation checkpoint and an adoption/sustainability measure. Do not invent outcomes or mark work complete.",shared+"\n\nCouncil synthesis and dissent:\n"+synthesis.text.slice(0,4300)+"\n\nAdversarial review:\n"+critic.text.slice(0,1800),process.env.AI_GATEWAY_PLAN_MODEL||model());
 const actionPlan=planner.ok?parseActionPlan(planner.text):null;
 const identities=[first,second,critic].map(x=>(x as {model?:string}).model||null);
 const providerSet=new Set(identities.filter((x):x is string=>Boolean(x)).map(x=>x.split("/")[0]));
 const independentSystemsVerified=identities.every(Boolean)&&providerSet.size>=3;
 const audit=citationAudit(synthesis.text,found.sources);
 return {state:audit.unknownIds.length?"CITATION_IDS_INVALID":"PRELIMINARY_DELIBERATION",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,actionPlan,deliberation:{primaryA:first.text,primaryB:second.text,challenge:critic.text,synthesis:synthesis.text},citations:audit,modelProvenance:{models:identities,verifiedProviderCount:providerSet.size,independentSystemsVerified},callStatuses:[...calls,synthesis].map(x=>({ok:x.ok,model:(x as {model?:string}).model||null,fallbackUsed:(x as {fallbackUsed?:boolean}).fallbackUsed||false})),limitations:"Up to five model inference requests were made, not separate human experts or necessarily distinct model providers. Evidence was evaluated from scholarly abstracts/metadata, not full articles. All implementation proposals remain unexecuted."};
}
