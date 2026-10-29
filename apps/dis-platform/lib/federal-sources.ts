import type {IntelligenceRecord} from "./consultation-research";
type QueryGroup="science"|"aerospace"|"grants"|"procurement"|"regulation"|"general";
export const FEDERAL_REGISTRY=[
 {id:"grants",name:"Grants.gov",topic:"Current and forecast federal assistance",access:"NO_API_KEY",classification:"OPEN_GRANT"},
 {id:"nih",name:"NIH RePORTER",topic:"Historical biomedical research awards",access:"NO_API_KEY",classification:"PAST_AWARD"},
 {id:"nsf",name:"NSF Award Search",topic:"Historically funded science and technology research",access:"NO_API_KEY",classification:"PAST_AWARD"},
 {id:"nasa",name:"NASA Technical Reports Server",topic:"Aerospace scientific and technical publications",access:"NO_API_KEY",classification:"TECHNICAL_REPORT"},
 {id:"federalregister",name:"Federal Register",topic:"Proposed and final federal regulations and notices",access:"NO_API_KEY",classification:"REGULATION"},
 {id:"usaspending",name:"USAspending",topic:"Federal contract and assistance award history",access:"NO_API_KEY",classification:"PAST_AWARD"}
] as const;
export type FederalKind="TECHNICAL_REPORT"|"REGULATION"|"PAST_AWARD";
export type FederalRecord=Omit<IntelligenceRecord,"kind"> & {kind:FederalKind};
export type FederalSearch={records:FederalRecord[],errors:string[],coverage:Record<string,string>,selected:string[]};
const clean=(x:unknown,n=320)=>typeof x==="string"?x.trim().slice(0,n):"";
export function chooseFederalSources(query:string,requested:string[]=[]):string[]{
 if(requested.length)return [...new Set(requested)].filter(x=>FEDERAL_REGISTRY.some(f=>f.id===x)&&!["grants","nih"].includes(x)).slice(0,4);
 const q=query.toLowerCase(),ids:string[]=[];
 if(/aerospace|space|orbit|satellite|nasa|aviation|rocket|weather|geospatial/.test(q))ids.push("nasa","nsf");
 if(/research|health|clinical|medicine|technology|engineering|science|grant|education|university|innovation/.test(q))ids.push("nsf");
 if(/company|contract|supplier|procurement|government|federal|funding|grant|business|commercial/.test(q))ids.push("usaspending");
 if(/regulat|policy|law|compliance|fda|environment|safety|labor|rule/.test(q))ids.push("federalregister");
 if(!ids.length)ids.push("federalregister","usaspending");
 return [...new Set(ids)].slice(0,3);
}
function urlNtrs(id:unknown){const v=clean(id,100);return /^[0-9]{4,18}$/.test(v)?"https://ntrs.nasa.gov/citations/"+v:"https://ntrs.nasa.gov/search";}
async function fetchJson(fetcher:typeof fetch,url:string,options:RequestInit={}){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),8500);
 try{const r=await fetcher(url,{...options,signal:ac.signal,cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}
}
export async function searchFederal(query:string,fetcher:typeof fetch=fetch,at=new Date(),requested:string[]=[]):Promise<FederalSearch>{
 const q=query.trim().slice(0,130),selected=chooseFederalSources(q,requested);
 const retrievedAt=at.toISOString(),records:FederalRecord[]=[],errors:string[]=[],coverage:Record<string,string>={};
 const run=async(id:string,fn:()=>Promise<FederalRecord[]>)=>{try{const found=await fn();records.push(...found);coverage[id]=found.length?"OFFICIAL_INDEX_RECORDS":"NO_MATCHES"}catch(e){coverage[id]="UNAVAILABLE";errors.push(id+": "+String(e instanceof Error?e.message:e).slice(0,115))}};
 await Promise.all(selected.map(id=>run(id,async()=>{
 if(id==="nsf"){
  const j=await fetchJson(fetcher,"https://api.nsf.gov/services/v1/awards.json?keyword="+encodeURIComponent(q)+"&rpp=6");
  const list=j.response?.award||[];
  return (Array.isArray(list)?list:[list]).filter(Boolean).slice(0,6).map((x:any)=>({id:"F-NSF-"+String(x.id||""),kind:"PAST_AWARD" as const,title:clean(x.title,250),summary:[clean(x.fundProgramName),clean(x.awardeeName),x.fundsObligatedAmt?"Obligated amount: $"+x.fundsObligatedAmt:""].filter(Boolean).join(" · "),source:"NSF Award Search",url:/^\d+$/.test(String(x.id))?"https://www.nsf.gov/awardsearch/showAward?AWD_ID="+x.id:"https://www.nsf.gov/awardsearch/",retrievedAt,sourceStatus:"OFFICIAL_RECORD" as const}));
 }
 if(id==="nasa"){
  const j=await fetchJson(fetcher,"https://ntrs.nasa.gov/api/citations/search?keyword="+encodeURIComponent(q)+"&page.size=6");
  const list=Array.isArray(j.results)?j.results:Array.isArray(j.citations)?j.citations:[];
  return list.slice(0,6).map((x:any)=>({id:"F-NASA-"+String(x.id||""),kind:"TECHNICAL_REPORT" as const,title:clean(x.title,250),summary:clean(x.abstract,500)||"Technical report metadata; inspect original record before citing.",source:"NASA NTRS",url:urlNtrs(x.id),retrievedAt,sourceStatus:"OFFICIAL_RECORD" as const}));
 }
 if(id==="federalregister"){
  const j=await fetchJson(fetcher,"https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D="+encodeURIComponent(q)+"&per_page=6&order=newest");
  const list=Array.isArray(j.results)?j.results:[];
  return list.slice(0,6).map((x:any)=>({id:"F-FR-"+String(x.document_number||""),kind:"REGULATION" as const,title:clean(x.title,250),summary:[clean(x.type,65),clean(x.abstract,450),clean(x.publication_date,35)].filter(Boolean).join(" · "),source:"Federal Register",url:clean(x.html_url,450)||"https://www.federalregister.gov/",retrievedAt,sourceStatus:"OFFICIAL_RECORD" as const}));
 }
 if(id==="usaspending"){
  const j=await fetchJson(fetcher,"https://api.usaspending.gov/api/v2/search/spending_by_award/",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({filters:{keywords:[q],award_type_codes:["A","B","C","D"]},fields:["Award ID","Recipient Name","Award Amount","Awarding Agency"],page:1,limit:6,sort:"Award Amount",order:"desc",subawards:false})});
  const list=Array.isArray(j.results)?j.results:[];
  return list.slice(0,6).map((x:any)=>({id:"F-USA-"+String(x.generated_internal_id||x["Award ID"]||""),kind:"PAST_AWARD" as const,title:clean(x.Description,250)||("Contract "+clean(x["Award ID"],200)),summary:[clean(x["Recipient Name"],120),clean(x["Awarding Agency"],100),Number.isFinite(Number(x["Award Amount"]))?"Award: $"+Number(x["Award Amount"]).toLocaleString("en-US"):""].filter(Boolean).join(" · "),source:"USAspending historical awards",url:"https://www.usaspending.gov/search?keywords="+encodeURIComponent(q),retrievedAt,sourceStatus:"OFFICIAL_RECORD" as const}));
 }
 return [];
 })));
 return {records:records.filter(x=>x.title&&x.url),errors,coverage,selected};
}
