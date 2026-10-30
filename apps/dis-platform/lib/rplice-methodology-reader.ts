/**
 * DIS -> RPLICE source-first, read-only framework metadata.
 * This adapter NEVER sends a DIS question, person, tenant, case or project.
 * No stateful MCP capability, real-person approval or scientific conclusions.
 */
export type RpliceMethodologyReceipt={ok:boolean;data:unknown|null;observedAt:string|null;reason:string};
const text=(v:unknown,max=120)=>typeof v==="string"?v.slice(0,max):null;
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
export async function readRpliceMethodology(key:unknown,fetcher:typeof fetch=fetch):Promise<RpliceMethodologyReceipt>{
 const fail=(reason:string):RpliceMethodologyReceipt=>({ok:false,data:null,observedAt:null,reason});
 // RPLICE generates partner keys as rplice_ + >=32 hex characters.
 if(typeof key!=="string"||!/^rplice_[0-9a-f]{32,}$/i.test(key.trim()))
  return fail("Dedicated RPLICE key absent or invalid; zero upstream requests.");
 try{
  const response=await fetcher("https://www.bettersciencelab.com/api/v1/public/frameworks",{
   method:"GET",headers:{"Authorization":"Bearer "+key.trim(),"Accept":"application/json"},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6500)});
  if(!response.ok)return fail("RPLICE declined the authorized read-only request.");
  const raw=await response.text();
  if(raw.length>128000)return fail("Methodology response exceeded the bounded payload size.");
  const parsed:unknown=JSON.parse(raw);
  const envelope=record(parsed),value=record(envelope.result),prov=record(envelope.provenance);
  if(!Array.isArray(value.frameworks)||!Number.isSafeInteger(value.count)||
   Number(value.count)<1||!Array.isArray(prov.citations)||
   typeof prov.generated_at!=="string"||!["remote","embedded"].includes(String(prov.runtime))||
   !["live","sandbox"].includes(String(prov.mode)))return fail("Methodology response lacked required source provenance or framework fields.");
  const frameworks=value.frameworks.filter((v:unknown)=>{
   const x=record(v);return typeof x.id==="string"&&typeof x.name==="string";
  }).slice(0,12).map((v:unknown)=>{
   const x=record(v);return {id:text(x.id,80),name:text(x.name,140),family:text(x.family,65),citation:text(x.citation,320)};
  });
  if(frameworks.length===0)return fail("No usable named frameworks were provided.");
  return {ok:true,observedAt:text(prov.generated_at,40),
   reason:"Read-only partner-reported methodology metadata received; source/citation quality and applicability are unverified.",
   data:{reportedFrameworkCount:value.count,frameworks,model:text(prov.model,65),mode:prov.mode,
    citations:prov.citations.filter((v:unknown)=>typeof v==="string").slice(0,6).map((v:string)=>v.slice(0,160)),
    note:"This is a bounded implementation-science framework catalog, NOT a research synthesis, chosen method, evidence of effectiveness, university partnership or causal conclusion."}};
 }catch{return fail("RPLICE unavailable or response malformed; no substitute evidence created.");}
}
