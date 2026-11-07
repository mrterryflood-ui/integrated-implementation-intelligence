/** Compatibility facade: reuse the engine; validate public aggregate inputs before interpreting them. */
export * from "./evidence-action-bridge-core";
import {
 reviewEvidenceToAction as coreReview,reviewCounterfactual as coreCounterfactual,
 reviewCrossStudyMeasurements as coreCrossStudy,reviewCorrectionReceipt as coreReceipt,
 boundDiscoveryLeads,type MeasureBinding,type EvidenceActionReview,type CounterfactualRequest,
 type CounterfactualAudit,type BoundMeasure,type CrossStudyReview,type CorrectionProposal,type CorrectionReceipt
} from "./evidence-action-bridge-core";
import type {ResearchProgram} from "./research-program";
import type {IntelligenceRecord} from "./consultation-research";
import {PUBLIC_MEASUREMENT_KEYS,CORRECTION_RECEIPT_KEYS,objectRecord,credentialFreeHttps,
 scaleViolation,strictTimestamp,hasOnlyKeys} from "./evidence-action-input-integrity";
const colorectalRequirements=[
 {id:"all-stage-incidence",construct:"DISEASE_INCIDENCE",problem:"Source-matched all-stage colorectal incidence is not available among accepted measurements."},
 {id:"screening-denominator",construct:"SCREENING_COMPLETION",problem:"Eligibility-based screening completion is not available among accepted measurements."},
 {id:"diagnostic-resolution",construct:"DIAGNOSTIC_FOLLOWUP",problem:"Abnormal-result diagnostic follow-up is not available among accepted measurements."}
] as const;
const medicalGaps=new Set<string>(colorectalRequirements.map(x=>x.id));
/** Colorectal requirements are recomputed after quarantine, never from rejected measurements. */
export function reviewEvidenceToAction(program:ResearchProgram,bindings:readonly MeasureBinding[],discovery:readonly IntelligenceRecord[]=[]):EvidenceActionReview{
 const out=coreReview(program,bindings,discovery);
 if(program.site!=="colorectal")out.gaps=out.gaps.filter(g=>!medicalGaps.has(g.id));
 const counts=new Map<string,number>();for(const b of bindings)counts.set(b.indicatorId,(counts.get(b.indicatorId)||0)+1);
 const invalid=out.measures.filter(m=>(counts.get(m.id)||0)>1||scaleViolation(m.indicator.value,m.indicator.unit)!==null);
 const removed=new Set(invalid.map(m=>m.id));out.measures=out.measures.filter(m=>!removed.has(m.id));out.links=out.links.filter(l=>!removed.has(l.left)&&!removed.has(l.right));
 for(const id of removed)out.gaps.push({id:"quarantined:"+id,severity:"MEASUREMENT_BLOCK",problem:"Ambiguous binding or inadmissible numeric measurement quarantined.",ownerRole:"Measurement reviewer",nextEvidence:"Resolve the original definition and source value; no first-binding-wins or impossible values."});
 if(program.site==="colorectal")for(const requirement of colorectalRequirements){
  if(!out.measures.some(m=>m.construct===requirement.construct)&&!out.gaps.some(g=>g.id===requirement.id))
   out.gaps.push({id:requirement.id,severity:"RESEARCH_REQUIRED",problem:requirement.problem,
    ownerRole:"Research and measurement owners",nextEvidence:"Obtain a source-verified measure with the appropriate population, denominator and period. Rejected evidence cannot close this obligation."});
 }
 out.literature=boundDiscoveryLeads(discovery);
 if(!out.literature.length&&!out.gaps.some(g=>g.id==="literature-not-retrieved"))out.gaps.push({id:"literature-not-retrieved",severity:"RESEARCH_REQUIRED",problem:"No admissible scholarly discovery leads remain.",ownerRole:"Research librarian",nextEvidence:"Retrieve and verify an actual scholarly source; rejected records do not close this gap."});
 return out;
}
/** Text fields remain declarations, not independent scientific proof. */
export function reviewCounterfactual(x:CounterfactualRequest):CounterfactualAudit{
 const fail=(reason:string):CounterfactualAudit=>({gate:"INSUFFICIENT_FOR_CAUSAL_ESTIMATE",gaps:[reason],matchedPreYears:[],matchedPostYears:[],rawDifferenceInDifferences:null,interpretation:"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL",causalEffectEstablished:false});
 if(!objectRecord(x))return fail("A defined aggregate panel is required.");
 for(const arm of [x.treated,x.comparator]){
  if(!arm||typeof arm.site!=="string"||typeof arm.populationFrame!=="string"||!Array.isArray(arm.observations))return fail("Malformed site, population or observation structure.");
  if(arm.observations.length>200)return fail("Series exceeds bounded input.");
  for(const p of arm.observations){if(p&&scaleViolation(p.value,x.unit))return fail("Values fall outside the stated measurement scale.");}
 }
 const out=coreCounterfactual(x);
 if(out.gate==="CANDIDATE_FOR_INDEPENDENT_DESIGN_REVIEW"&&
    (out.rawDifferenceInDifferences===null||!Number.isFinite(out.rawDifferenceInDifferences)))
  return {...out,gate:"INSUFFICIENT_FOR_CAUSAL_ESTIMATE",rawDifferenceInDifferences:null,
   gaps:[...out.gaps,"Arithmetic overflow or non-finite result: investigate scale before interpreting this panel."]};
 return out;
}
/** Strict public-schema projection; conflicting IDs are quarantined, identical repeats count once. */
export function reviewCrossStudyMeasurements(input:unknown,base:readonly BoundMeasure[]):CrossStudyReview{
 if(!Array.isArray(input)||input.length>30)return coreCrossStudy(input,base);
 const fingerprints=new Map<string,Set<string>>();
 for(const raw of input){const row=objectRecord(raw);if(row&&typeof row.id==="string"){
  const key=row.id.trim(),variants=fingerprints.get(key)||new Set<string>();
  // Fixed field order; bounded primitive descriptors avoid circular-object serialization.
  const fingerprint=JSON.stringify(PUBLIC_MEASUREMENT_KEYS.map(name=>{
   const value=row[name];return [name,typeof value,value===null||["string","number","boolean"].includes(typeof value)?value:null];
  }));
  variants.add(fingerprint);fingerprints.set(key,variants);
 }}
 const candidates:Record<string,unknown>[]=[],rejected:CrossStudyReview["rejected"]=[];
 input.forEach((raw,index)=>{
  const row=objectRecord(raw),reasons:string[]=[];
  const id=row&&typeof row.id==="string"?row.id.trim():"";
  if(!row){rejected.push({id:"INVALID_ROW_"+(index+1),reasons:["Expected a public aggregate record object."]});return;}
  if(!id||id.length>100||row.id!==id)reasons.push("A nonblank, explicit, trimmed measurement identifier is required; do not invent one.");
  if(id&&(fingerprints.get(id)?.size||0)>1)reasons.push("Duplicate conflicting measurement identifier: all conflicting records are quarantined pending source adjudication.");
  if(!hasOnlyKeys(row,PUBLIC_MEASUREMENT_KEYS))reasons.push("Unexpected fields are prohibited in the public aggregate schema; no private fields or supplied verification flags.");
  if(!credentialFreeHttps(row.sourceUrl))reasons.push("Source must be an HTTPS reference without embedded credentials.");
  const scale=scaleViolation(row.value,row.unit);if(scale)reasons.push(scale);
  if(reasons.length){rejected.push({id:id||"INVALID_ROW_"+(index+1),reasons});return;}
  // Copy declared primitives. Later caller mutations cannot rewrite this reviewed snapshot.
  candidates.push(Object.fromEntries(PUBLIC_MEASUREMENT_KEYS.map(key=>[key,row[key]])));
 });
 const out=coreCrossStudy(candidates,base);
 return {...out,rejected:[...rejected,...out.rejected]};
}
/** Provisional metadata only. A valid clock/source/count still never authenticates delivery. */
export function reviewCorrectionReceipt(action:CorrectionProposal,receipt:CorrectionReceipt,asOf:string|Date=new Date()){
 const record=objectRecord(receipt),proposal=objectRecord(action);
 const invalid=(problems:string[])=>({actionId:typeof proposal?.id==="string"?proposal.id:"UNBOUND_ACTION",
  provisionalCompleteness:false,problems,closure:"INDEPENDENT_EXTERNAL_VERIFICATION_REQUIRED" as const,
  claimedOutcomeVerified:false as const,actionAuthorized:false as const});
 if(!record||!proposal||typeof proposal.id!=="string"||!proposal.id.trim())return invalid(["A bound proposal and structured delivery receipt are required."]);
 if(!hasOnlyKeys(record,CORRECTION_RECEIPT_KEYS))return invalid(["Unexpected fields are prohibited in the aggregate receipt schema."]);
 const requiredText=["proposedActionId","deliveryRecordedAt","sourceUrl","reviewerIdentity"];
 if(requiredText.some(key=>typeof record[key]!=="string"||(record[key] as string).length>700))
  return invalid(["Receipt identifiers, timestamp, source and reviewer must be bounded text fields."]);
 const out=coreReceipt(action,receipt),problems=[...out.problems];
 const delivered=strictTimestamp(receipt.deliveryRecordedAt);
 const reviewTime=asOf instanceof Date?(Number.isFinite(asOf.getTime())?asOf.getTime():null):strictTimestamp(asOf);
 if(delivered===null)problems.push("Delivery time requires a real calendar date and explicit timezone; normalized or ambiguous dates are invalid.");
 if(reviewTime===null)problems.push("A valid review-as-of clock is required.");
 if(delivered!==null&&reviewTime!==null&&delivered>reviewTime)problems.push("Future delivery cannot count as completed at the review-as-of time.");
 if(!credentialFreeHttps(receipt.sourceUrl))problems.push("Source reference must not contain embedded credentials.");
 if(!Number.isSafeInteger(receipt.eligibleDenominator)||!Number.isSafeInteger(receipt.completedNumerator))
  problems.push("Completed and eligible counts must be exactly representable safe integers.");
 return {...out,problems:[...new Set(problems)],provisionalCompleteness:problems.length===0};
}
