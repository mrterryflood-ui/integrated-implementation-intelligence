/**
 * Private DIS capability fabric, bounded phase 1.
 * NOT the public MCP registry or a list of promoted third-party apps.
 * The owned platforms remain independent. DIS selects read-only intelligence
 * capabilities and records which claims are actually supported.
 *
 * No user question/identity/tenant content is sent to a partner.
 * No shared credentials, cross-tenant writes or automatic knowledge promotion.
 */
export type CapabilityState="SOURCE_INSPECTED"|"CONTRACT_VERIFIED"|"RUNTIME_AUTHORIZED"|"E2E_ACCEPTED";
export type CandidateState="CONTRACT_ONLY"|"CREDENTIAL_PRESENT_UNVERIFIED"|"UNAVAILABLE"|"RETURNED_UNVERIFIED";
export type IntelligenceDomain="community"|"implementation"|"benefits"|"civic"|"business"|"veterans"|"health"|"hazards"|"security";
export type Capability = {
 id:string;owner:string;domain:IntelligenceDomain;intentTerms:readonly string[];
 operation:string;method:"GET"|"POST";path:string;scope:string;
 state:CapabilityState;execution:"THRIVEUP_READ_V1"|"NOT_AUTHORIZED";
 evidence:string;dataClass:"PUBLIC_AGGREGATE"|"PROTECTED_REQUIRES_AUTH";
};
const confirmed="Existing repository contract inspected 2026-10-30; runtime key, upstream response and partner scope NOT independently verified.";
export const CAPABILITIES: readonly Capability[]=[
 {id:"community-impact",owner:"ThriveUp",domain:"community",intentTerms:["impact","outcome","employment","report","evaluation","program","workforce","community"],operation:"Retrieve approved aggregate outcome summaries",method:"GET",path:"/api/partner/v1/impact?limit=15",scope:"impact:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"community-system-context",owner:"ThriveUp",domain:"community",intentTerms:["community","services","partner","network","local","ecosystem","impact"],operation:"Read publicly visible ecosystem aggregate",method:"GET",path:"/api/partner/v1/community",scope:"community:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"intervention-evidence",owner:"ThriveUp",domain:"implementation",intentTerms:["intervention","implementation","evidence","strategy","evaluate","roi","impact","program"],operation:"Read published Chainweb evidence-coefficient metadata",method:"GET",path:"/api/partner/v1/chainweb/coefficients",scope:"chainweb:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"benefits-program-catalog",owner:"ThriveUp",domain:"benefits",intentTerms:["benefits","assistance","insurance","resources","support","healthcare","veterans"],operation:"Read bounded public program catalog",method:"GET",path:"/api/partner/v1/benefits?limit=12",scope:"benefits:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"local-civic-context",owner:"Civic Signal",domain:"civic",intentTerms:["civic","policy","city","county","public","governance","community"],operation:"Signed bounded civic-context lookup",method:"POST",path:"/api/partner-exchange/v1/civic-context",scope:"civic-context:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",evidence:"Signed HMAC contract inspected; no DIS-specific partner key or verified tenant-safe round trip.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"funding-qualification",owner:"GrantPathPro",domain:"business",intentTerms:["funding","grant","procurement","business","contract","rfi","rfp"],operation:"Owner-scoped opportunity decision intelligence",method:"GET",path:"/api/opportunity-desk",scope:"owner:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",evidence:"Canonical Grants2 opportunity API inspected; no DIS-to-GrantPath delegated identity or partner grant.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"implementation-methodology",owner:"RPLICE",domain:"implementation",intentTerms:["research","evidence","cfir","implementation","fidelity","strategy","science"],operation:"Versioned implementation-methodology comparison",method:"GET",path:"/api/v1/public/frameworks",scope:"research:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",evidence:"RPLICE public methodology and MCP contract inspected; dedicated DIS partner credential unavailable.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"veteran-transition",owner:"M2C",domain:"veterans",intentTerms:["veteran","transition","military","employment","caregiver"],operation:"Veteran transition and resource intelligence",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",evidence:"Veteran-transition repository inspected; no approved scoped DIS service contract.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"health-implementation",owner:"HerHealth / Whole Person",domain:"health",intentTerms:["health","clinical","care","community","prevention"],operation:"Permitted aggregate health implementation evidence",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",evidence:"Healthcare repository inspected; no patient data or PHI access authorized.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"hazard-signals",owner:"HazardAware",domain:"hazards",intentTerms:["hazard","weather","flood","disaster","wildfire","environment"],operation:"Official-source hazard signal query",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",evidence:"HazardAware source inspected; no DIS integration or release-specific contract accepted.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"agent-assurance",owner:"TATTLETALE",domain:"security",intentTerms:["agent","security","risk","threat","audit","policy"],operation:"Agent identity and invocation assurance",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",evidence:"Security project source inspected; do not treat as deployed authorizer.",dataClass:"PROTECTED_REQUIRES_AUTH"}
] as const;
export type CapPlan={problemSummary:string;selected:Array<{id:string;domain:IntelligenceDomain;operation:string;scope:string;state:CapabilityState;execution:"CANDIDATE"|"NOT_CONNECTED";reason:string}>;notSelected:Array<{id:string;reason:string}>;limits:string[]};
const normalize=(text:string)=>" "+text.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()+" ";
export function planOwnedCapabilities(problem:string,options:{max?:number;allowedDomains?:readonly IntelligenceDomain[]}={}):CapPlan{
 const query=normalize(problem.slice(0,1200));const terms=new Set(query.trim().split(/\s+/));
 const max=Math.max(1,Math.min(options.max??4,4));
 const matches=CAPABILITIES.map((cap,i)=>{
  const matched=cap.intentTerms.filter(t=>t.split(" ").every(x=>terms.has(x)));
  const eligible=!options.allowedDomains||options.allowedDomains.includes(cap.domain);
  const weight=(matched.length?matched.length:0)+(matched.includes("impact")?1:0);
  return {cap,i,eligible,matched,weight};
 }).filter(x=>x.eligible&&x.weight>0).sort((a,b)=>b.weight-a.weight||a.i-b.i);
 const selected=matches.slice(0,max).map(x=>({id:x.cap.id,domain:x.cap.domain,operation:x.cap.operation,scope:x.cap.scope,state:x.cap.state,execution:x.cap.execution==="THRIVEUP_READ_V1"?"CANDIDATE" as const:"NOT_CONNECTED" as const,reason:"Matched the question to "+x.matched.slice(0,3).join(", ")+". Selection is not proof of data availability."}));
 return {problemSummary:"Specialist capabilities selected from declared domains; user question is NOT transmitted to upstream services.",
  selected,notSelected:matches.slice(max).map(x=>({id:x.cap.id,reason:"Relevant but excluded by bounded invocation budget."})),
  limits:["No public app switching or external product advertising.","Selection is deterministic and descriptive, not a validated measure of subject-matter fit.","Platform data, credentials, client identity and lessons are never pooled automatically.","A contract or server-side credential is not proof of a successful remote call."]};
}
export type CapabilityReceipt={id:string;state:CandidateState;source:string;scope:string;sourceTimestamp:string|null;
 evidenceClass:"PARTNER_REPORTED_UNVERIFIED"|"NONE";value:unknown|null;reason:string};
const scopes:Record<string,string>={
 "impact:read":"DIS_THRIVEUP_IMPACT_KEY","community:read":"DIS_THRIVEUP_COMMUNITY_KEY",
 "chainweb:read":"DIS_THRIVEUP_CHAINWEB_KEY","benefits:read":"DIS_THRIVEUP_BENEFITS_KEY"
};
const base="https://thrivingcommunitiesforall.com";
const finite=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?v:null;
const safeText=(v:unknown,max=140)=>typeof v==="string"?v.slice(0,max):null;
const record=(v:unknown)=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
function summarize(id:string,body:unknown):unknown{
 const x=record(body);
 if(id==="community-impact"){
  if(finite(x.count)===null||!x.totals||typeof x.totals!=="object")return null;
  const totals=record(x.totals);
  return {count:finite(x.count),participantsServed:finite(totals.participantsServed),
   enteredEmployment:finite(totals.enteredEmployment),credentialsAttained:finite(totals.credentialsAttained),
   medianEarnings:finite(x.medianEarnings),notice:"Approved partner-reported outcomes, bounded to returned records; not causal effects or whole-population totals."};
 }
 if(id==="community-system-context"){
  if(!x.summary||typeof x.summary!=="object")return null;
  const s=record(x.summary);
  if(finite(s.totalPlatforms)===null)return null;
  return {totalPublicPlatforms:finite(s.totalPlatforms),onlineReported:finite(s.platformsOnline),
   supportedLanguages:finite(s.languagesSupported),notice:"Public ecosystem capacity counts, NOT neighborhood-level community conditions."};
 }
 if(id==="intervention-evidence"){
  if(!x.coefficients||typeof x.coefficients!=="object"||Array.isArray(x.coefficients))return null;
  const coeff=record(x.coefficients);
  return {coefficientFamilies:Object.keys(coeff).slice(0,15),count:Object.keys(coeff).length,
   notice:"Coefficient metadata only; individual coefficients and causal claims must be verified against primary studies."};
 }
 if(id==="benefits-program-catalog"){
  if(!Array.isArray(x.programs)||finite(x.count)===null)return null;
  return {count:finite(x.count),programs:Array.isArray(x.programs)?x.programs.slice(0,12).map(p=>{
   const item=record(p);return {title:safeText(item.title),status:safeText(item.status),geography:safeText(item.geographicFocus)};
  }):[],notice:"Catalog only; individual program eligibility and current enrollment require official verification."};
 }
 return null;
}
export async function invokeOwnedCapabilities(selectedIds:readonly string[],env:Record<string,string|undefined>,
 fetcher:typeof fetch=fetch):Promise<CapabilityReceipt[]>{
 const unique=[...new Set(selectedIds)].slice(0,4);
 return Promise.all(unique.map(async id=>{
  const cap=CAPABILITIES.find(c=>c.id===id);
  if(!cap)return {id,state:"UNAVAILABLE",source:"unknown",scope:"none",sourceTimestamp:null,evidenceClass:"NONE",value:null,reason:"Unregistered capability."} as CapabilityReceipt;
  const receipt=(state:CandidateState,reason:string,value:unknown=null,ts:string|null=null):CapabilityReceipt=>({
   id,state,source:cap.owner,scope:cap.scope,sourceTimestamp:ts,evidenceClass:state==="RETURNED_UNVERIFIED"?"PARTNER_REPORTED_UNVERIFIED":"NONE",value,reason});
  if(cap.execution!=="THRIVEUP_READ_V1"||cap.method!=="GET")return receipt("CONTRACT_ONLY","No approved DIS-specific exchange credential or adapter.");
  const key=env[scopes[cap.scope]];
  if(!key||key.trim().length<20)return receipt("CONTRACT_ONLY","No approved server-side scoped credential; no upstream request made.");
  try{
   const response=await fetcher(base+cap.path,{method:"GET",headers:{"x-partner-key":key,"Accept":"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6500)});
   if(!response.ok)return receipt("UNAVAILABLE","Remote service declined or failed; no data accepted.");
   const bodyText=await response.text();
   if(bodyText.length>128000)return receipt("UNAVAILABLE","Response exceeded bounded evidence budget.");
   const parsed=JSON.parse(bodyText);
   const payload=summarize(id,parsed);
   if(payload===null)return receipt("UNAVAILABLE","Partner response lacked required source data; rejected without importing.");
   const timestamp=safeText(record(parsed).exportedAt,40)||safeText(record(parsed).timestamp,40);
   return receipt("RETURNED_UNVERIFIED","Received bounded partner-reported aggregate; verify source method, coverage, and freshness before use.",payload,timestamp);
  }catch{return receipt("UNAVAILABLE","Timed out, malformed, or unreachable; no substitute data invented.");}
 }));
}
