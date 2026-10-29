import {getVercelOidcToken} from "@vercel/oidc";
import {selectCouncil,DEFAULT_RED} from "./council";
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
export async function infer(system:string,prompt:string,fetcher=fetch):Promise<{ok:boolean,text:string,error?:string}>{
 const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||await getVercelOidcToken().catch(()=>null);
 if(!token)return {ok:false,text:"",error:"AI Gateway authentication not configured"};
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18500);
 try{
  const res=await fetcher("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",signal:controller.signal,headers:{"content-type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({model:model(),max_completion_tokens:1100,messages:[{role:"system",content:instructions+"\n"+system},{role:"user",content:prompt}]})});
  if(!res.ok)return {ok:false,text:"",error:"Gateway rejected request (HTTP "+res.status+")"};
  const json=await res.json();
  const text=compact(json.choices?.[0]?.message?.content,5000);
  return text?{ok:true,text}:{ok:false,text:"",error:"Gateway returned no text"};
 }catch{return {ok:false,text:"",error:"Inference unavailable or timed out"}}finally{clearTimeout(timer)}
}
export function citationAudit(text:string,sources:Source[]){
 const cited=[...new Set((text.match(/\[S\d+\]/g)||[]).map(x=>x.slice(1,-1)))];
 const unknown=cited.filter(id=>!sources.some(s=>s.id===id));
 return {citedIds:cited,unknownIds:unknown,checked:"IDENTIFIER_EXISTENCE_ONLY",claimSupport:"NOT INDEPENDENTLY VERIFIED"};
}
export async function convene(input:{prompt:string,count:number,redCount:number,selected:string[],redSelected:string[],depth:string},deps={research,infer}){
 const prompt=input.prompt.trim();
 const primary=selectCouncil(prompt,input.count,input.selected,false);
 const red=selectCouncil(prompt,input.redCount,input.redSelected.length?input.redSelected:DEFAULT_RED,true);
 const found=await deps.research(prompt);
 const ctx=sourceContext(found.sources);
 const p1=primary.slice(0,Math.max(1,Math.ceil(primary.length/2))).map(x=>x.name+" — "+x.lens).join("; ");
 const p2=primary.slice(Math.ceil(primary.length/2)).map(x=>x.name+" — "+x.lens).join("; ");
 const challenge=red.map(x=>x.name+" — "+x.lens).join("; ");
 const shared=`Question: ${prompt}\nRequested depth: ${input.depth}\nSources (abstract-level only):\n${ctx||"NO VERIFIED SOURCES RETRIEVED"}`;
 const [first,second,critic]=await Promise.all([
  deps.infer("Primary council strand A. Analyze problem, propose alternative hypotheses. Intellectual lenses: "+p1,shared),
  deps.infer("Primary council strand B. Independently explore stakeholder needs, feasibility, and counterarguments. Lenses: "+p2,shared),
  deps.infer("Independent challenge strand. Perform adversarial analysis with no presumption of agreement. Lenses: "+challenge,shared)
 ]);
 const calls=[first,second,critic];
 const primaryViews=primary.map(m=>({id:m.id,name:m.name,perspective:m.lens,question:`From the ${m.domain.toLowerCase()} perspective, what evidence could prove or disprove our approach?`}));
 const redViews=red.map(m=>({id:m.id,name:m.name,challenge:`What important failure, unknown, or unintended consequence might this ${m.domain.toLowerCase()} lens reveal?`}));
 if(calls.some(c=>!c.ok))return {state:"INCOMPLETE",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,callStatuses:calls.map(x=>({ok:x.ok,error:x.error||null})),error:"Multi-agent deliberation incomplete. No simulated consensus.",citations:{citedIds:[],unknownIds:[],checked:"NOT_RUN",claimSupport:"NOT_VERIFIED"}};
 const joined="PRIMARY A:\n"+first.text+"\nPRIMARY B:\n"+second.text+"\nRED TEAM:\n"+critic.text;
 const synthesis=await deps.infer("Synthesis and independent assurance strand. Give: (1) direct answer, (2) strongest opposing hypothesis, (3) tested versus untested evidence, (4) what we are not asking, (5) actionable pilot plan with measurements, owners and safeguards, (6) remaining dissent and uncertainty. Do not claim verified consensus or experimentally tested results. Do not invent references; use cited source identifiers only if supported by given abstracts.",shared+"\n\nSeparate deliberation outputs:\n"+joined.slice(0,10000));
 if(!synthesis.ok)return {state:"INCOMPLETE",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,callStatuses:[...calls,{ok:false,error:synthesis.error}],error:"Synthesis did not complete",citations:{checked:"NOT_RUN"}};
 const audit=citationAudit(synthesis.text,found.sources);
 return {state:audit.unknownIds.length?"CITATION_IDS_INVALID":"PRELIMINARY_DELIBERATION",primary:primaryViews,red:redViews,sources:found.sources,retrieval:found.status,deliberation:{primaryA:first.text,primaryB:second.text,challenge:critic.text,synthesis:synthesis.text},citations:audit,callStatuses:[...calls,synthesis].map(x=>({ok:x.ok})),limitations:"Four separate model inference requests were made, not separate human experts or necessarily distinct model providers. Evidence was evaluated from scholarly abstracts/metadata, not full articles. All implementation proposals remain unexecuted."};
}
