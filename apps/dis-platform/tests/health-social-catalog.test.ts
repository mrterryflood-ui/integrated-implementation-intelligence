import test from "node:test";
import assert from "node:assert/strict";
import {readHealthSocialCatalog} from "../lib/health-social-catalog-reader";
import {CAPABILITIES,planOwnedCapabilities,invokeOwnedCapabilities} from "../lib/owned-capability-fabric";

const healthId="health-ms-public-organizations";
const socialId="social-benefits-programs";
const healthKey="test-unique-health-metadata-key-2026";
const socialKey="test-unique-social-catalog-key-2026";
const approved={
 DIS_HEALTH_META_READ_APPROVED:"true",DIS_THRIVEUP_HEALTH_META_KEY:healthKey,
 DIS_SOCIAL_CATALOG_READ_APPROVED:"true",DIS_THRIVEUP_SOCIAL_CATALOG_KEY:socialKey
};
const healthPayload={
 sourceStatus:"live_catalog_read",generatedAt:"2026-10-30T18:00:00Z",
 platforms:[
  {name:"Public MS organizational resource",visibility:"public",domain:"health",role:"information",healthFreshness:"recent",email:"PRIVATE EMAIL",token:"PRIVATE TOKEN"},
  {name:"PRIVATE INTERNAL HEALTH PROVIDER",visibility:"internal_ecosystem",email:"PRIVATE PATIENT",secret:"PRIVATE SECRET"}
 ],providerSearch:{providers:[{name:"PRIVATE SEARCH RESULT"}]},
 rplice:{token:"PRIVATE PARTNER KEY"},patientHistory:{notes:"PRIVATE DIAGNOSIS"}
};
const socialPayload={count:2,exportedAt:"2026-10-30T17:30:00Z",programs:[
 {title:"Housing resource information",status:"published",geographicFocus:"Texas",id:341,
  beneficiary:{name:"PRIVATE BENEFICIARY"},targetPopulation:"PRIVATE CASE",email:"PRIVATE"},
 {title:"Food navigation directory",status:"review needed",geographicFocus:"US",participant:"PRIVATE"}
 ],referrals:[{name:"PRIVATE REFERRAL"}]};

test("health and social health contracts select only relevant read-only sources",()=>{
 const caps=CAPABILITIES.filter(c=>[healthId,socialId].includes(c.id));
 assert.equal(caps.length,2);
 assert.ok(caps.every(c=>c.execution==="HEALTH_SOCIAL_CATALOG_V1"&&c.method==="GET"&&c.state==="CONTRACT_VERIFIED"));
 const clinical=planOwnedCapabilities("Which multiple sclerosis health care organizations are in the source catalog?");
 const social=planOwnedCapabilities("How can community housing food and transportation resources help social health?");
 assert.ok(clinical.selected.some(x=>x.id===healthId));
 assert.ok(social.selected.some(x=>x.id===socialId));
 const unrelated=planOwnedCapabilities("A patient asks for medical records and clinical screening results");
 assert.ok(!unrelated.selected.some(x=>[healthId,socialId].includes(x.id)));
 const excluded=planOwnedCapabilities("multiple sclerosis health care", {allowedDomains:["business"]});
 assert.ok(!excluded.selected.some(x=>x.id===healthId));
});
test("dedicated scope and explicit owner approval BOTH required; no credential copying",async()=>{
 let requests=0;
 const mock=(async()=>{requests++;throw Error("must not request")}) as typeof fetch;
 for(const lane of ["health-ms-public-organizations","social-benefits-programs"] as const){
  for(const env of [{},{DIS_THRIVEUP_HEALTH_META_KEY:healthKey,DIS_THRIVEUP_SOCIAL_CATALOG_KEY:socialKey},
   {DIS_HEALTH_META_READ_APPROVED:"true",DIS_SOCIAL_CATALOG_READ_APPROVED:"true"},
   {DIS_HEALTH_META_READ_APPROVED:"true",DIS_THRIVEUP_HEALTH_META_KEY:"bad"}]){
   const result=await readHealthSocialCatalog(lane,env,mock);
   assert.equal(result.ok,false);
   assert.equal(result.data,null);
  }
 }
 assert.equal(requests,0);
 const result=await invokeOwnedCapabilities([healthId,socialId],{},mock);
 assert.ok(result.every(r=>r.state==="CONTRACT_ONLY"));
 assert.equal(requests,0);
});
test("authorized fixed-origin GET transfers no question or identity; strips all protected and unrelated fields",async()=>{
 const requests:Array<{url:string;init:RequestInit}>=[];
 const mock=(async (url:RequestInfo|URL,init?:RequestInit)=>{
  requests.push({url:String(url),init:init||{}});
  return new Response(JSON.stringify(String(url).includes("ms/intelligence")?healthPayload:socialPayload),{status:200});
 }) as typeof fetch;
 const result=await invokeOwnedCapabilities([healthId,socialId],approved,mock);
 assert.equal(requests.length,2);
 assert.deepEqual(requests.map(x=>x.url),[
  "https://thrivingcommunitiesforall.com/api/partner/v1/ms/intelligence",
  "https://thrivingcommunitiesforall.com/api/partner/v1/benefits?limit=12"
 ]);
 assert.ok(requests.every(x=>x.init.method==="GET"&&x.init.redirect==="error"&&x.init.cache==="no-store"));
 assert.ok(result.every(r=>r.state==="RETURNED_UNVERIFIED"&&r.evidenceClass==="PARTNER_REPORTED_UNVERIFIED"));
 assert.equal((result[0].value as any).publicOrganizations.length,1);
 assert.equal((result[1].value as any).programs.length,2);
 const serialized=JSON.stringify(result);
 assert.ok(!serialized.includes("PRIVATE"),"source provider records, clients, users, tokens and referral details must not escape");
 assert.ok(!serialized.includes("341"),"program record id must be discarded");
});
test("upstream errors and unexpected health/social schemas fail closed without fabricated evidence",async()=>{
 for(const mock of [
  (async()=>new Response(JSON.stringify({error:"Forbidden"}),{status:403})) as typeof fetch,
  (async()=>new Response("not-json",{status:200})) as typeof fetch,
  (async()=>new Response("x".repeat(64001),{status:200})) as typeof fetch,
  (async()=>{throw Error("connection failed")}) as typeof fetch
 ]){
  for(const lane of ["health-ms-public-organizations","social-benefits-programs"] as const){
   const x=await readHealthSocialCatalog(lane,approved,mock);
   assert.equal(x.ok,false);assert.equal(x.data,null);
  }
 }
 assert.equal((await readHealthSocialCatalog("health-ms-public-organizations",approved,
  (async()=>new Response(JSON.stringify({sourceStatus:"live_catalog_read",platforms:[{name:"Private",visibility:"internal_ecosystem"}]}),{status:200})) as typeof fetch)).ok,false);
 assert.equal((await readHealthSocialCatalog("social-benefits-programs",approved,
  (async()=>new Response(JSON.stringify({count:1,programs:[{participant:"PRIVATE"}]}),{status:200})) as typeof fetch)).ok,false);
});
test("no sensitive social-health cohort or individual-health connector becomes callable through this lane",async()=>{
 let requests=0;
 const mock=(async()=>{requests++;return new Response("{}")}) as typeof fetch;
 const results=await invokeOwnedCapabilities(["patient-records-continuity","behavioral-health-safety",
  "social-care-navigation","community-safety-social-health"],approved,mock);
 assert.equal(requests,0);
 assert.ok(results.every(r=>r.state==="CONTRACT_ONLY"&&r.value===null));
});
