/**
 * DIS × RPLICE ChainWeb research-claim preflight v1.
 *
 * Shared, deterministic, stateless logic. This is NOT a publisher check,
 * independent adjudication, causal analysis, clinical decision or human approval.
 * Source URLs are pinned to a curated literature casebook, not proof of
 * extracted results. Unknown cases can be researched but cannot inherit proof.
 */
export const CHAINWEB_CLAIM_CONTRACT_VERSION="2026-11-06.1" as const;
export const CASE_SOURCE_REGISTRY=[
 {id:"NC24",source:"https://doi.org/10.1001/jamanetworkopen.2024.46693",design:"RANDOMIZED",endpoints:["SCREENING_COMPLETION","DIAGNOSTIC_COMPLETION"]},
 {id:"US23",source:"https://doi.org/10.1001/jama.2023.18755",design:"RANDOMIZED",endpoints:["DIAGNOSTIC_COMPLETION"]},
 {id:"WA25",source:"https://doi.org/10.7326/ANNALS-24-01885",design:"RANDOMIZED",endpoints:["DIAGNOSTIC_COMPLETION"]},
 {id:"OR25",source:"https://doi.org/10.1001/jamanetworkopen.2025.0928",design:"RANDOMIZED",endpoints:["SCREENING_COMPLETION"]},
 {id:"CA26",source:"https://doi.org/10.1001/jamanetworkopen.2026.39013",design:"RANDOMIZED",endpoints:["SCREENING_COMPLETION"]},
 {id:"ALTA25",source:"https://doi.org/10.1002/cncr.70031",design:"OBSERVATIONAL",endpoints:["SCREENING_COMPLETION"]},
 {id:"PCOS24",source:"https://pubmed.ncbi.nlm.nih.gov/39394785/",design:"OBSERVATIONAL",endpoints:["REPORTED_DIAGNOSIS"]},
 {id:"FRAME26",source:"https://doi.org/10.1177/26334895251407338",design:"METHODS",endpoints:["METHOD_ADAPTATION"]},
] as const;
/** Frozen selected-paper numerical comparisons. Matching is NOT publisher verification. */
export const CURATED_CASE_CONTRASTS=[
 {caseId:"NC24",endpoint:"SCREENING_COMPLETION",difference:20.29,ci95:[17.85,22.73]},
 {caseId:"NC24",endpoint:"DIAGNOSTIC_COMPLETION",difference:24.3,ci95:[-2.13,50.74]},
 {caseId:"US23",endpoint:"DIAGNOSTIC_COMPLETION",difference:8.5,ci95:[4.8,12]},
 {caseId:"US23",endpoint:"DIAGNOSTIC_COMPLETION",difference:0.4,ci95:[-3.6,4.2]},
 {caseId:"WA25",endpoint:"DIAGNOSTIC_COMPLETION",difference:13,ci95:[6.5,19.4]},
 {caseId:"OR25",endpoint:"SCREENING_COMPLETION",difference:7.3,ci95:[5.3,9.2]},
 {caseId:"CA26",endpoint:"SCREENING_COMPLETION",difference:10.8,ci95:[4.9,16.7]},
 {caseId:"CA26",endpoint:"SCREENING_COMPLETION",difference:2.9,ci95:[-3.2,9.0]},
 {caseId:"ALTA25",endpoint:"SCREENING_COMPLETION",difference:14.4,ci95:null},
] as const;
export type ResearchEndpoint="SCREENING_COMPLETION"|"DIAGNOSTIC_COMPLETION"|"MORTALITY"|"DISEASE_INCIDENCE"|"REPORTED_DIAGNOSIS"|"METHOD_ADAPTATION";
export type ResearchClaimKind="DESCRIPTIVE_ENDPOINT"|"BENEFICIAL_INTERVENTION_EFFECT"|"NO_EFFECT"|"EQUIVALENT_EFFECT"|"MORTALITY_BENEFIT"|"CAUSAL_MECHANISM"|"CROSS_CONDITION_TRANSFER"|"INDEPENDENT_VALIDATION";
export type ResearchClaimInput={
 claimId:string;
 caseId:string;
 sourceUrl:string;
 observedEndpoint:ResearchEndpoint;
 claimedEndpoint:ResearchEndpoint;
 kind:ResearchClaimKind;
 difference?:number;
 ci95?:[number,number];
 comparator?:string;
 reviewerId?:string;
 claimedIndependent?:boolean;
};
export type ClaimReview={
 claimId:string;
 caseId:string;
 status:"PROVISIONAL_REVIEW_CANDIDATE"|"REJECTED_UNSUPPORTED";
 reasons:string[];
 sourceState:"PINNED_CITATION_NOT_PUBLISHER_VERIFIED";
};
export type ClaimReviewReport={
 schemaVersion:typeof CHAINWEB_CLAIM_CONTRACT_VERSION;
 status:"REQUIRES_CORRECTION"|"PROVISIONAL_REVIEW_CANDIDATES"|"NO_CLAIMS";
 casesRegistered:number;
 claims:ClaimReview[];
 claimCount:number;
 rejectedCount:number;
 independentOriginalSourceVerification:false;
 independentHumanReviewVerified:false;
 causalValidityEstablished:false;
 methodSuperiorityEstablished:false;
 notes:string[];
};
const allowedKinds:readonly ResearchClaimKind[]=[
 "DESCRIPTIVE_ENDPOINT","BENEFICIAL_INTERVENTION_EFFECT","NO_EFFECT","EQUIVALENT_EFFECT",
 "MORTALITY_BENEFIT","CAUSAL_MECHANISM","CROSS_CONDITION_TRANSFER","INDEPENDENT_VALIDATION"
];
const allowedEndpoints:readonly ResearchEndpoint[]=[
 "SCREENING_COMPLETION","DIAGNOSTIC_COMPLETION","MORTALITY","DISEASE_INCIDENCE","REPORTED_DIAGNOSIS","METHOD_ADAPTATION"
];
const hasOwn=(x:Record<string,unknown>,key:string)=>Object.prototype.hasOwnProperty.call(x,key);
const sensitiveKeys=new Set(["patientid","patientname","personid","medicalrecordnumber","ssn","dob","dateofbirth","email","address"]);
const allowedKeys=new Set(["claimId","caseId","sourceUrl","observedEndpoint","claimedEndpoint","kind","difference","ci95","comparator","reviewerId","claimedIndependent"]);
const normalized=(value:string)=>value.toLowerCase().replace(/[^a-z]/g,"");
const isObj=(x:unknown):x is Record<string,unknown>=>typeof x==="object"&&x!==null&&!Array.isArray(x);
const validText=(v:unknown)=>typeof v==="string"&&v.trim().length>0&&v.length<=700;
export function preflightChainwebResearchClaims(input:unknown):ClaimReviewReport{
 const notes=[
  "Local, deterministic consistency checks against curated citations only; original study text and row-level outcomes are not independently re-extracted.",
  "An entered reviewer ID, signature string, quote, or source URL is NOT verification of reviewer independence or publisher authenticity.",
  "A supported trial result in one population is not a ChainWeb effect, a mortality benefit, or evidence of transfer to every condition."
 ];
 const inputRows=Array.isArray(input)?input:null;
 if(inputRows===null||inputRows.length>40)return {
  schemaVersion:CHAINWEB_CLAIM_CONTRACT_VERSION,status:"REQUIRES_CORRECTION",casesRegistered:CASE_SOURCE_REGISTRY.length,claims:[],
  claimCount:0,rejectedCount:0,independentOriginalSourceVerification:false,independentHumanReviewVerified:false,
  causalValidityEstablished:false,methodSuperiorityEstablished:false,
  notes:[...notes,"Input must be an array containing at most 40 bounded aggregate research claims."]
 };
 if(!inputRows.length)return {
  schemaVersion:CHAINWEB_CLAIM_CONTRACT_VERSION,status:"NO_CLAIMS",casesRegistered:CASE_SOURCE_REGISTRY.length,claims:[],
  claimCount:0,rejectedCount:0,independentOriginalSourceVerification:false,independentHumanReviewVerified:false,
  causalValidityEstablished:false,methodSuperiorityEstablished:false,notes
 };
 const seen=new Set<string>();
 const claims:ClaimReview[]=inputRows.map((raw,index)=>{
  const reasons:string[]=[];
  if(!isObj(raw))return {claimId:"invalid-"+index,caseId:"UNKNOWN",
   status:"REJECTED_UNSUPPORTED" as const,reasons:["INVALID_CLAIM_SHAPE"],sourceState:"PINNED_CITATION_NOT_PUBLISHER_VERIFIED" as const};
  for(const key of Object.keys(raw)){
   if(sensitiveKeys.has(normalized(key)))reasons.push("PERSON_LEVEL_FIELD_PROHIBITED");
   if(!allowedKeys.has(key))reasons.push("UNKNOWN_OR_UNSAFE_EVIDENCE_FIELD");
  }
  const id=validText(raw.claimId)?String(raw.claimId).trim():"invalid-"+index;
  const caseId=validText(raw.caseId)?String(raw.caseId).trim():"UNKNOWN";
  const composite=caseId+"|"+id;
  if(seen.has(composite))reasons.push("DUPLICATE_CLAIM_ID");
  seen.add(composite);
  if(!validText(raw.claimId)||!validText(raw.caseId)||!validText(raw.sourceUrl))reasons.push("MISSING_CLAIM_ID_CASE_OR_SOURCE");
  const caseInfo=CASE_SOURCE_REGISTRY.find(c=>c.id===caseId);
  if(!caseInfo)reasons.push("UNREGISTERED_CASE_NO_AUTOMATIC_EVIDENCE_TRANSFER");
  else if(raw.sourceUrl!==caseInfo.source)reasons.push("SOURCE_DOES_NOT_MATCH_CURATED_REFERENCE");
  if(!allowedEndpoints.includes(raw.observedEndpoint as ResearchEndpoint)||!allowedEndpoints.includes(raw.claimedEndpoint as ResearchEndpoint))
   reasons.push("UNKNOWN_OUTCOME");
  if(!allowedKinds.includes(raw.kind as ResearchClaimKind))reasons.push("UNKNOWN_CLAIM_TYPE");
  if(caseInfo&&!(caseInfo.endpoints as readonly string[]).includes(String(raw.observedEndpoint)))
   reasons.push("OBSERVED_ENDPOINT_NOT_IN_REGISTERED_STUDY");
  if(raw.observedEndpoint!==raw.claimedEndpoint)reasons.push("CLAIMED_ENDPOINT_NOT_MEASURED");
  if(hasOwn(raw,"reviewerId")||hasOwn(raw,"claimedIndependent")||
     hasOwn(raw,"verified")||hasOwn(raw,"independentVerified")||hasOwn(raw,"signoff"))
   reasons.push("SELF_DECLARED_REVIEW_IS_NOT_INDEPENDENT_ADJUDICATION");
  if(raw.kind==="EQUIVALENT_EFFECT"||raw.kind==="NO_EFFECT")
   reasons.push("NON_SIGNIFICANCE_NOT_EQUIVALENCE_OR_ZERO_EFFECT");
  if(raw.kind==="MORTALITY_BENEFIT"||raw.kind==="CAUSAL_MECHANISM"||
     raw.kind==="CROSS_CONDITION_TRANSFER"||raw.kind==="INDEPENDENT_VALIDATION")
   reasons.push("CLAIM_REQUIRES_SEPARATE_CAUSAL_OR_EXTERNAL_VALIDATION");
  if(raw.kind==="BENEFICIAL_INTERVENTION_EFFECT"){
   if(caseInfo?.design!=="RANDOMIZED")reasons.push("OBSERVATIONAL_EVIDENCE_NOT_RANDOMIZED_EFFECT");
   const ci=raw.ci95;
   if(!Array.isArray(ci)||ci.length!==2||ci.some(v=>typeof v!=="number"||!Number.isFinite(v))||
      typeof raw.difference!=="number"||!Number.isFinite(raw.difference)||
      (Array.isArray(ci)&&ci.length===2&&!(ci[0]<=raw.difference&&raw.difference<=ci[1])))
     reasons.push("INVALID_OR_MISSING_EFFECT_INTERVAL");
   else if(ci[0]<=0)reasons.push("EFFECT_INTERVAL_INCLUDES_NULL");
   if(!validText(raw.comparator))reasons.push("COMPARATOR_NOT_DECLARED");
   const pinnedContrast=CURATED_CASE_CONTRASTS.some(entry=>
     entry.caseId===caseId&&entry.endpoint===raw.observedEndpoint&&
     typeof raw.difference==="number"&&Math.abs(raw.difference-entry.difference)<=0.02&&
     Array.isArray(raw.ci95)&&entry.ci95!==null&&
     Math.abs(Number(raw.ci95[0])-entry.ci95[0])<=0.02&&
     Math.abs(Number(raw.ci95[1])-entry.ci95[1])<=0.02);
   if(!pinnedContrast)reasons.push("NUMERICAL_RESULT_NOT_IN_CURATED_REFERENCE");

  }
  return {claimId:id,caseId,status:reasons.length?"REJECTED_UNSUPPORTED":"PROVISIONAL_REVIEW_CANDIDATE",
    reasons:[...new Set(reasons)],sourceState:"PINNED_CITATION_NOT_PUBLISHER_VERIFIED"};
 });
 const rejectedCount=claims.filter(x=>x.status==="REJECTED_UNSUPPORTED").length;
 return {schemaVersion:CHAINWEB_CLAIM_CONTRACT_VERSION,
  status:rejectedCount?"REQUIRES_CORRECTION":"PROVISIONAL_REVIEW_CANDIDATES",
  casesRegistered:CASE_SOURCE_REGISTRY.length,claims,claimCount:claims.length,rejectedCount,
  independentOriginalSourceVerification:false,independentHumanReviewVerified:false,
  causalValidityEstablished:false,methodSuperiorityEstablished:false,notes};
}
