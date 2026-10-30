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
export type IntelligenceDomain="community"|"implementation"|"benefits"|"civic"|"business"|"veterans"|"health"|"hazards"|"security"|"academic_research";
export type UseClearance="GENERAL_PURPOSE_CANDIDATE"|"NOT_CLEARED_FOR_DIS";
export type DataBoundary="TCAF_PARTNER_AGGREGATE"|"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY";
export type Capability = {
 id:string;owner:string;domain:IntelligenceDomain;intentTerms:readonly string[];
 useClearance:UseClearance;dataBoundary:DataBoundary;
 operation:string;method:"GET"|"POST";path:string;scope:string;
 state:CapabilityState;execution:"THRIVEUP_READ_V1"|"NOT_AUTHORIZED";
 evidence:string;dataClass:"PUBLIC_AGGREGATE"|"PROTECTED_REQUIRES_AUTH";
};
const confirmed="Existing repository contract inspected 2026-10-30; runtime key, upstream response and partner scope NOT independently verified.";
export const CAPABILITIES: readonly Capability[]=[
 {id:"community-impact",owner:"ThriveUp",domain:"community",intentTerms:["impact","outcome","employment","report","evaluation","program","workforce","community"],operation:"Retrieve approved aggregate outcome summaries",method:"GET",path:"/api/partner/v1/impact?limit=15",scope:"impact:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",useClearance:"GENERAL_PURPOSE_CANDIDATE",dataBoundary:"TCAF_PARTNER_AGGREGATE",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"community-system-context",owner:"ThriveUp",domain:"community",intentTerms:["community","services","partner","network","local","ecosystem","impact"],operation:"Read publicly visible ecosystem aggregate",method:"GET",path:"/api/partner/v1/community",scope:"community:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"intervention-evidence",owner:"ThriveUp",domain:"implementation",intentTerms:["intervention","implementation","evidence","strategy","evaluate","roi","impact","program"],operation:"Read published Chainweb evidence-coefficient metadata",method:"GET",path:"/api/partner/v1/chainweb/coefficients",scope:"chainweb:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",useClearance:"GENERAL_PURPOSE_CANDIDATE",dataBoundary:"TCAF_PARTNER_AGGREGATE",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"benefits-program-catalog",owner:"ThriveUp",domain:"benefits",intentTerms:["benefits","assistance","insurance","resources","support","healthcare","veterans"],operation:"Read bounded public program catalog",method:"GET",path:"/api/partner/v1/benefits?limit=12",scope:"benefits:read",state:"CONTRACT_VERIFIED",execution:"THRIVEUP_READ_V1",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:confirmed,dataClass:"PUBLIC_AGGREGATE"},
 {id:"local-civic-context",owner:"Civic Signal",domain:"civic",intentTerms:["civic","policy","city","county","public","governance","community"],operation:"Signed bounded civic-context lookup",method:"POST",path:"/api/partner-exchange/v1/civic-context",scope:"civic-context:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"Signed HMAC contract inspected; no DIS-specific partner key or verified tenant-safe round trip.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"funding-qualification",owner:"GrantPathPro",domain:"business",intentTerms:["funding","grant","procurement","business","contract","rfi","rfp"],operation:"Owner-scoped opportunity decision intelligence",method:"GET",path:"/api/opportunity-desk",scope:"owner:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"Canonical Grants2 opportunity API inspected; no DIS-to-GrantPath delegated identity or partner grant.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"implementation-methodology",owner:"RPLICE",domain:"implementation",intentTerms:["research","evidence","cfir","implementation","fidelity","strategy","science"],operation:"Versioned implementation-methodology comparison",method:"GET",path:"/api/v1/public/frameworks",scope:"research:read",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"RPLICE public methodology and MCP contract inspected; dedicated DIS partner credential unavailable.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"veteran-transition",owner:"M2C",domain:"veterans",intentTerms:["veteran","transition","military","employment","caregiver"],operation:"Veteran transition and resource intelligence",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"Veteran-transition repository inspected; no approved scoped DIS service contract.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"health-implementation",owner:"HerHealth / Whole Person",domain:"health",intentTerms:["health","clinical","care","community","prevention"],operation:"Permitted aggregate health implementation evidence",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"Healthcare repository inspected; no patient data or PHI access authorized.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"hazard-signals",owner:"HazardAware",domain:"hazards",intentTerms:["hazard","weather","flood","disaster","wildfire","environment"],operation:"Official-source hazard signal query",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"HazardAware source inspected; no DIS integration or release-specific contract accepted.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"university-research-discovery",owner:"Public scholarly metadata sources",domain:"academic_research",intentTerms:["university","research","scientific","scholarly","study","literature","publication","methodology","professor","faculty","laboratory","evaluation"],operation:"Identify authoritative studies, public researcher/institution metadata and contested evidence",method:"GET",path:"",scope:"public-metadata-only",state:"CONTRACT_VERIFIED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"OpenAlex public works/authors/institutions and NIH RePORTER project metadata inspected; source discovery is not proof of collaborator agreement, data access or study quality.",dataClass:"PUBLIC_AGGREGATE"},
 {id:"university-implementation-collaboration",owner:"Independent university research partners",domain:"academic_research",intentTerms:["university","partnership","research","implementation","ctsa","translational","collaborate","study","trial"],operation:"Assess possible methodological and institutional collaboration, including IRB/IP/data-governance requirements",method:"GET",path:"",scope:"partner-agreement-required",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"NIH CTSA and NSF convergence research models provide discovery criteria, not an agreement or permission to access any university systems.",dataClass:"PROTECTED_REQUIRES_AUTH"},
 {id:"agent-assurance",owner:"TATTLETALE",domain:"security",intentTerms:["agent","security","risk","threat","audit","policy"],operation:"Agent identity and invocation assurance",method:"GET",path:"",scope:"not-defined",state:"SOURCE_INSPECTED",execution:"NOT_AUTHORIZED",useClearance:"NOT_CLEARED_FOR_DIS",dataBoundary:"UNVERIFIED_OWNER_OR_CLIENT_BOUNDARY",evidence:"Security project source inspected; do not treat as deployed authorizer.",dataClass:"PROTECTED_REQUIRES_AUTH"}
] as const;
export type CapPlan={
 problemSummary:string;
 selected:Array<{id:string;domain:IntelligenceDomain;operation:string;scope:string;state:CapabilityState;execution:"CANDIDATE"|"NOT_CONNECTED";reason:string}>;
 notSelected:Array<{id:string;reason:string}>;
 deferredDomains:IntelligenceDomain[];
 limits:string[];
};
const normalize=(value:string)=>" "+value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim()+" ";
const includesAny=(terms:Set<string>,values:readonly string[])=>values.some(t=>t.split(" ").every(w=>terms.has(w)));

/**
 * The specialist catalog is NOT a global asset pool. Source inspection does
 * not confer ownership, consent, client licensing or a right to invoke.
 * A capability must be cleared FOR DIS and fit the specific question before
 * the planner even considers it. Sensitive/client-specific tools remain dark.
 */
function fitForQuestion(cap:Capability,terms:Set<string>):{ok:boolean;matched:string[]} {
 const matched=cap.intentTerms.filter(t=>t.split(" ").every(w=>terms.has(w)));
 if(!matched.length)return {ok:false,matched};
 const community=includesAny(terms,["community","nonprofit","organization","program","services","workforce","local","county","population","public"]);
 const impact=includesAny(terms,["impact","outcome","outcomes","evaluation","measure","report","employment","results"]);
 const intervention=includesAny(terms,["implementation","intervention","evidence","program","roi","evaluation"]);
 const benefit=includesAny(terms,["benefits","assistance","eligibility","coverage","medicaid","snap"]);
 let ok=false;
 switch(cap.id){
  case "community-impact":ok=community&&impact;break;
  case "community-system-context":ok=community&&includesAny(terms,["community","local","network","partner","partners","services","ecosystem"]);break;
  case "intervention-evidence":ok=community&&intervention;break;
  case "benefits-program-catalog":ok=benefit;break;
  default:ok=false;
 }
 return {ok,matched};
}
export function planOwnedCapabilities(problem:string,options:{max?:number;allowedDomains?:readonly IntelligenceDomain[]}={}):CapPlan{
 const terms=new Set(normalize(problem.slice(0,1200)).trim().split(/\s+/).filter(Boolean));
 const max=Math.max(1,Math.min(options.max??4,4));
 const candidates=CAPABILITIES.flatMap((cap,i)=>{
  if(cap.useClearance!=="GENERAL_PURPOSE_CANDIDATE"||cap.dataBoundary!=="TCAF_PARTNER_AGGREGATE")return [];
  if(options.allowedDomains&&!options.allowedDomains.includes(cap.domain))return [];
  const fit=fitForQuestion(cap,terms);if(!fit.ok)return [];
  return [{cap,i,matched:fit.matched,score:fit.matched.length}];
 }).sort((a,b)=>b.score-a.score||a.i-b.i);
 const selected=candidates.slice(0,max).map(x=>({
  id:x.cap.id,domain:x.cap.domain,operation:x.cap.operation,scope:x.cap.scope,state:x.cap.state,
  execution:x.cap.execution==="THRIVEUP_READ_V1"?"CANDIDATE" as const:"NOT_CONNECTED" as const,
  reason:"Eligible general-purpose aggregate matched "+x.matched.slice(0,3).join(", ")+". A matching partner grant is still required."
 }));
 const deferredDomains=[...new Set(CAPABILITIES.filter(cap=>
  cap.useClearance==="NOT_CLEARED_FOR_DIS" &&
  (!options.allowedDomains||options.allowedDomains.includes(cap.domain)) &&
  cap.intentTerms.some(t=>t.split(" ").every(w=>terms.has(w)))
 ).map(c=>c.domain))];
 return {
  problemSummary:"DIS considered only purpose-cleared aggregate capabilities. Other repositories, including client-specific products, are not a default tool pool.",
  selected,
  notSelected:candidates.slice(max).map(x=>({id:x.cap.id,reason:"Potentially relevant, but excluded by the bounded invocation budget."})),
  deferredDomains,
  limits:[
   "A repository's existence or similar domain does not grant DIS a right to access it.",
   "Client-specific, protected, unverified-owner and restricted-purpose systems are never automatically selected or invoked.",
   "TCAF partner aggregates are candidates only; each live request still needs a separately granted service scope and current user consent.",
   "No external platform marketing, catalog, user identity sharing or raw case text is sent to specialist services.",
   "No matched/authorized capability means DIS uses only its independent intelligence and reports the relevant knowledge gap."
  ]
 };
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
  const count=finite(x.count);
  // No small-cell inference: five approved source records is only a modest
  // privacy floor, not evidence of statistical validity or local relevance.
  if(count===null||count<5||!x.totals||typeof x.totals!=="object")return null;
  const totals=record(x.totals);
  const suppress=(v:unknown)=>{const n=finite(v);return n===null||n<5?null:n;};
  return {count,participantsServed:suppress(totals.participantsServed),
   enteredEmployment:suppress(totals.enteredEmployment),credentialsAttained:suppress(totals.credentialsAttained),
   medianEarnings:suppress(x.medianEarnings),notice:"Approved partner-reported cohort aggregates; small counts suppressed. NO geography match, whole-population estimate, independent source verification or causal effect established."};
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
  if(cap.useClearance!=="GENERAL_PURPOSE_CANDIDATE"||cap.dataBoundary!=="TCAF_PARTNER_AGGREGATE"||cap.execution!=="THRIVEUP_READ_V1"||cap.method!=="GET")return receipt("CONTRACT_ONLY","Specialist is not cleared for DIS use; source ownership and client-specific restrictions are not bypassed.");
  const key=env[scopes[cap.scope]];
  if(!key||key.trim().length<20)return receipt("CONTRACT_ONLY","No approved server-side scoped credential; no upstream request made.");
  try{
   const response=await fetcher(base+cap.path,{method:"GET",headers:{"x-partner-key":key,"Accept":"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(6500)});
   if(!response.ok)return receipt("UNAVAILABLE","Remote service declined or failed; no data accepted.");
   const bodyText=await response.text();
   if(bodyText.length>128000)return receipt("UNAVAILABLE","Response exceeded bounded evidence budget.");
   const parsed=JSON.parse(bodyText);
   const payload=summarize(id,parsed);
   if(payload===null)return receipt("UNAVAILABLE","Partner data absent, malformed or below privacy suppression floor; rejected without importing.");
   const timestamp=safeText(record(parsed).exportedAt,40)||safeText(record(parsed).timestamp,40);
   return receipt("RETURNED_UNVERIFIED","Received bounded partner-reported aggregate; verify source method, coverage, and freshness before use.",payload,timestamp);
  }catch{return receipt("UNAVAILABLE","Timed out, malformed, or unreachable; no substitute data invented.");}
 }));
}
