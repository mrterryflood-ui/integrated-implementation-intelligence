import {lensFit} from './collaboration-policy';
import {MEMBERS,DEFAULT_RED} from "./council";
export type Member=typeof MEMBERS[number];
export type SelectionMode="auto"|"manual"|"solo";
export type AssemblyInput={prompt:string,primaryMode?:SelectionMode,redMode?:"auto"|"manual",count?:number,redCount?:number,selected?:string[],redSelected?:string[]};
export const COUNCIL_LIMIT=12;
const uniqueMembers=new Map(MEMBERS.map(m=>[m.id,m]));
const anchorIds=["socrates","hypatia"];
export function getMember(id:string){return uniqueMembers.get(id)}
export function explainChoice(m:Member,prompt:string){
 const words=prompt.toLowerCase();
 const category=(m.group||m.domain).toLowerCase();
 const relevant=category==="engineering"&&/code|build|system|engineering|technology|platform/.test(words)||
 category==="business"&&/business|company|grant|revenue|funding|market|contract/.test(words)||
 category==="science"&&/research|evidence|health|study|science|data/.test(words)||
 category==="civic"&&/community|policy|government|equity|vote/.test(words)||
 category==="strategy"&&/risk|strategy|conflict|international|scenario/.test(words)||
 category==="design"&&/brand|user|ux|product|design/.test(words);
 return (relevant?"Topic relevance: ":"Complementary discipline: ")+m.lens+". This is an educational analytic method, not their personal opinion.";
}
function score(m:Member,prompt:string,red:boolean){return lensFit(m,prompt)+(red&&m.id==='angie-jones'?1:0);}
function order(candidates:Member[],prompt:string,red:boolean){return candidates.sort((a,b)=>score(b,prompt,red)-score(a,prompt,red)||a.name.localeCompare(b.name))}
function unique(ids:string[]){return [...new Set(ids)].filter(x=>uniqueMembers.has(x))}
export function assemble(input:AssemblyInput){
 const requestedPrimary=Number.isFinite(input.count)?Math.max(2,Math.min(COUNCIL_LIMIT,Math.floor(input.count!))):6;
 const requestedRed=Number.isFinite(input.redCount)?Math.max(2,Math.min(COUNCIL_LIMIT,Math.floor(input.redCount!))):4;
 const primaryMode=input.primaryMode||"auto",redMode=input.redMode||"auto";
 const chosen=unique(input.selected||[]),redChosen=unique(input.redSelected||[]);
 const errors:string[]=[];
 if(chosen.length>COUNCIL_LIMIT||redChosen.length>COUNCIL_LIMIT)errors.push("Each council supports at most 12 selected people.");
 if(primaryMode==="solo"){
  const only=uniqueMembers.get(chosen[0]||"");
  if(!only||chosen.length!==1)errors.push("One-on-one mode requires exactly one chosen perspective.");
  const member=only?[only]:[];
  return {primary:member,red:[],primaryMode,redMode,errors,reasons:Object.fromEntries(member.map(m=>[m.id,explainChoice(m,input.prompt)])),ancientPair:"SOLO_EXCEPTION",independentProviderCount:0};
 }
 const anchors=anchorIds.map(id=>uniqueMembers.get(id)).filter((m):m is Member=>!!m);
 if(anchors.length!==2)errors.push("Required ancient perspectives are unavailable.");
 // The two ancient historical figures have documented male and female identities.
 const explicitlyChosen=chosen.map(id=>uniqueMembers.get(id)!).filter(m=>m&&!anchors.some(a=>a.id===m.id));
 const primary:Member[]=[...anchors];
 if(primaryMode==="manual"){
  for(const m of explicitlyChosen)if(primary.length<COUNCIL_LIMIT)primary.push(m);
 }else{
  const n=Math.max(requestedPrimary,anchors.length);
  const pool=order([...uniqueMembers.values()].filter(m=>!primary.some(x=>x.id===m.id)),input.prompt,false);
  primary.push(...pool.slice(0,n-primary.length));
 }
 const primaryIds=new Set(primary.map(m=>m.id));
 if(redChosen.some(id=>primaryIds.has(id)))errors.push("The challenge council cannot contain anyone on the primary council.");
 let red:Member[]=[];
 if(redMode==="manual"){
  red=redChosen.filter(id=>!primaryIds.has(id)).map(id=>uniqueMembers.get(id)!).slice(0,COUNCIL_LIMIT);
 }else{
  const pool=order([...uniqueMembers.values()].filter(m=>!primaryIds.has(m.id)),input.prompt,true);
  red=pool.slice(0,requestedRed);
 }
 if(!red.length)errors.push("Choose at least one challenge perspective, or switch red-team selection to Auto.");
 if(primaryMode==="manual"&&primary.length===anchors.length&&chosen.length===0)errors.push("Choose people or switch primary selection to Auto.");
 const reasons=Object.fromEntries([...primary,...red].map(m=>[m.id,explainChoice(m,input.prompt)]));
 return {primary,red,primaryMode,redMode,errors,reasons,ancientPair:"Hypatia and Socrates are included by default to provide ancient female and male analytical perspectives.",independentProviderCount:0};
}
