import {searchFederal} from "./federal-sources";
import type {Intake} from "./consultation";
import {research as openAlexResearch} from "./council-engine";
export type IntelligenceRecord={id:string,kind:"SCHOLARLY"|"OPEN_GRANT"|"PAST_AWARD"|"LANDSCAPE_LEAD"|"TECHNICAL_REPORT"|"REGULATION",title:string,summary:string,source:string,url:string,retrievedAt:string,sourceStatus:"OFFICIAL_RECORD"|"DISCOVERY_ONLY",opportunityStatus?:string,closeDate?:string,awardAmount?:number|null,eligibilityStatus?:"UNVERIFIED"};
export type IntelligenceBundle={query:string,retrievedAt:string,records:IntelligenceRecord[],errors:string[],coverage:Record<string,string>,researchStandard:string};
const stopWords=new Set("that this what with about from your their where when how which want need have does they there would could should into through more best help build better proposal founder funding system platform business idea startup grant grants".split(" "));
export function keywords(value:string){
 const words=value.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g)||[];
 return [...new Set(words.filter(w=>!stopWords.has(w)))].slice(0,6).join(" ")||value.trim().slice(0,100);
}
function safeText(v:unknown,n=360){return typeof v==="string"?v.slice(0,n).trim():""}
async function jsonRequest(url:string,options:RequestInit,fetcher:typeof fetch){
 const c=new AbortController();const time=setTimeout(()=>c.abort(),9500);
 try{const r=await fetcher(url,{...options,signal:c.signal,cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(time)}
}
function publicLink(id:unknown){const n=Number(id);return Number.isInteger(n)&&n>0?"https://www.grants.gov/search-results-detail/"+n:"https://www.grants.gov/search-grants";}
export async function investigate(intake:Intake,fetcher:typeof fetch=fetch,at=new Date()):Promise<IntelligenceBundle>{
 const q=keywords(intake.mission+" "+intake.audience);
 const retrievedAt=at.toISOString(),records:IntelligenceRecord[]=[],errors:string[]=[];
 const coverage={scholarly:"UNAVAILABLE",grants:"UNAVAILABLE",pastAwards:"UNAVAILABLE",landscape:"UNAVAILABLE"};
 const tasks=[
  (async()=>{try{const found=await openAlexResearch(q,fetcher);coverage.scholarly=found.status;for(const x of found.sources.slice(0,6))records.push({id:"W"+(records.length+1),kind:"SCHOLARLY",title:x.title,summary:safeText(x.abstract,600)||"Abstract not available; evaluate full text before citing claims.",source:"OpenAlex bibliographic index",url:x.url,retrievedAt,sourceStatus:"DISCOVERY_ONLY"});if(found.error)errors.push("OpenAlex: "+found.error)}catch{errors.push("OpenAlex unavailable")}})(),
  (async()=>{try{
   const found=await jsonRequest("https://api.grants.gov/v1/api/search2",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({keyword:q.slice(0,100),rows:10,oppStatuses:"posted|forecasted",startRecordNum:0})},fetcher);
   if(found.errorcode!==0||!Array.isArray(found.data?.oppHits))throw Error("Invalid Grants.gov response");
   coverage.grants="OFFICIAL_INDEX";
   for(const x of found.data.oppHits.slice(0,8))records.push({id:"G"+String(x.id||records.length+1),kind:"OPEN_GRANT",title:safeText(x.title,230),summary:[safeText(x.agencyName,140),safeText(x.number,90),x.oppStatus==="forecasted"?"Forecasted opportunity":"Posted opportunity"].filter(Boolean).join(" · "),source:"Grants.gov",url:publicLink(x.id),retrievedAt,sourceStatus:"OFFICIAL_RECORD",opportunityStatus:safeText(x.oppStatus,40),closeDate:safeText(x.closeDate,40),eligibilityStatus:"UNVERIFIED"});
  }catch(e){errors.push("Grants.gov: "+String(e instanceof Error?e.message:e).slice(0,120))}})(),
  (async()=>{try{
   const found=await jsonRequest("https://api.reporter.nih.gov/v2/projects/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({criteria:{advanced_text_search:{operator:"or",search_field:"projecttitle,abstracttext",search_text:q.slice(0,120)}},limit:5,offset:0})},fetcher);
   coverage.pastAwards=Array.isArray(found.results)?"OFFICIAL_AWARD_INDEX":"NO_RESULTS";
   for(const x of (Array.isArray(found.results)?found.results:[]).slice(0,5)){
    const id=Number(x.appl_id);
    records.push({id:"N"+String(id||records.length+1),kind:"PAST_AWARD",title:safeText(x.project_title,230),summary:[safeText(x.organization?.org_name,100),safeText(x.agency_ic_admin?.name,70),x.fiscal_year?"FY "+x.fiscal_year:"",x.award_amount?"Historical award: $"+Number(x.award_amount).toLocaleString("en-US"):""].filter(Boolean).join(" · "),source:"NIH RePORTER past awards",url:id?"https://reporter.nih.gov/project-details/"+id:"https://reporter.nih.gov/",retrievedAt,sourceStatus:"OFFICIAL_RECORD",awardAmount:typeof x.award_amount==="number"?x.award_amount:null});
   }
  }catch(e){errors.push("NIH RePORTER: "+String(e instanceof Error?e.message:e).slice(0,120))}})(),
  (async()=>{try{
   const federal=await searchFederal(intake.mission+" "+intake.audience+" "+intake.geography,fetcher,at);
   for(const rec of federal.records)records.push(rec);
   Object.assign(coverage,federal.coverage);
   errors.push(...federal.errors);
  }catch{errors.push("Federal source routing unavailable")}})(),
  (async()=>{try{
   const names=intake.alternatives.trim()||q;
   const url="https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&formatversion=2&srlimit=6&srsearch="+encodeURIComponent(names.slice(0,120));
   const found=await jsonRequest(url,{headers:{Accept:"application/json"}},fetcher);
   coverage.landscape=Array.isArray(found.query?.search)?"DISCOVERY_ONLY":"NO_RESULTS";
   for(const x of (Array.isArray(found.query?.search)?found.query.search:[]).slice(0,6)){const title=safeText(x.title,200);if(!title)continue;records.push({id:"L"+String(x.pageid||records.length+1),kind:"LANDSCAPE_LEAD",title,summary:"General reference discovery only. Not a verified competitor, pricing source, or substitute.",source:"Wikipedia search index",url:"https://en.wikipedia.org/wiki/"+encodeURIComponent(title.replace(/ /g,"_")),retrievedAt,sourceStatus:"DISCOVERY_ONLY"});}
  }catch(e){errors.push("Market landscape discovery: "+String(e instanceof Error?e.message:e).slice(0,120))}})()
 ];
 await Promise.all(tasks);
 // Stable IDs, source-bound and deduplicated; no claims are promoted to verified competitive fit.
 const seen=new Set<string>();
 const deduped=records.filter(x=>{if(!x.url||seen.has(x.kind+x.url))return false;seen.add(x.kind+x.url);return true}).map((x,i)=>({...x,id:"E"+(i+1)}));
 return {query:q,retrievedAt,records:deduped,errors,coverage,researchStandard:"OFFICIAL_RECORD means an official index returned this item, not independently verified eligibility, accuracy, legal advice, investor interest, nor claim-level passage support. OPEN_GRANT has a provider status that still requires direct solicitation review. PAST_AWARD is historical and not an active funding opportunity. LANDSCAPE_LEAD is not a verified competitor. Regulations require review of the official published document and effective dates."};
}
