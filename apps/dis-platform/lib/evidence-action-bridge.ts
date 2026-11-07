/** Compatibility facade: reuse the tested engine, isolate condition assumptions. */
export * from "./evidence-action-bridge-core";
import {reviewEvidenceToAction as coreReview,reviewCounterfactual as coreCounterfactual,boundDiscoveryLeads,type MeasureBinding,type EvidenceActionReview,type CounterfactualRequest,type CounterfactualAudit} from "./evidence-action-bridge-core";
import type {ResearchProgram} from "./research-program";
import type {IntelligenceRecord} from "./consultation-research";
const medicalGaps=new Set(["all-stage-incidence","screening-denominator","diagnostic-resolution"]);
/** The explicit colorectal case selection authorizes only colorectal requirements. */
export function reviewEvidenceToAction(program:ResearchProgram,bindings:readonly MeasureBinding[],discovery:readonly IntelligenceRecord[]=[]):EvidenceActionReview{
 const out=coreReview(program,bindings,discovery);
 if(program.site!=="colorectal")out.gaps=out.gaps.filter(g=>!medicalGaps.has(g.id));
 const counts=new Map<string,number>();for(const b of bindings)counts.set(b.indicatorId,(counts.get(b.indicatorId)||0)+1);
 const invalid=out.measures.filter(m=>(counts.get(m.id)||0)>1||!Number.isFinite(m.indicator.value)||m.indicator.value! < 0||(m.indicator.unit==="percent"&&m.indicator.value! > 100));
 const removed=new Set(invalid.map(m=>m.id));out.measures=out.measures.filter(m=>!removed.has(m.id));out.links=out.links.filter(l=>!removed.has(l.left)&&!removed.has(l.right));
 for(const id of removed)out.gaps.push({id:"quarantined:"+id,severity:"MEASUREMENT_BLOCK",problem:"Ambiguous binding or inadmissible numeric measurement quarantined.",ownerRole:"Measurement reviewer",nextEvidence:"Resolve the original definition and source value; no first-binding-wins or impossible values."});
 out.literature=boundDiscoveryLeads(discovery);
 if(!out.literature.length&&!out.gaps.some(g=>g.id==="literature-not-retrieved"))out.gaps.push({id:"literature-not-retrieved",severity:"RESEARCH_REQUIRED",problem:"No admissible scholarly discovery leads remain.",ownerRole:"Research librarian",nextEvidence:"Retrieve and verify an actual scholarly source; rejected records do not close this gap."});
 return out;
}
/** Text fields are declarations, never independent scientific proof. */
export function reviewCounterfactual(x:CounterfactualRequest):CounterfactualAudit{
 const fail=(reason:string):CounterfactualAudit=>({gate:"INSUFFICIENT_FOR_CAUSAL_ESTIMATE",gaps:[reason],matchedPreYears:[],matchedPostYears:[],rawDifferenceInDifferences:null,interpretation:"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL",causalEffectEstablished:false});
 if(!x||typeof x!=="object")return fail("A defined aggregate panel is required.");
 for(const arm of [x.treated,x.comparator]){
  if(!arm||typeof arm.site!=="string"||typeof arm.populationFrame!=="string"||!Array.isArray(arm.observations))return fail("Malformed site, population or observation structure.");
  for(const p of arm.observations){if(p&&typeof p.value==="number"&&(p.value<0||((x.unit==="percent"||x.unit==="%")&&p.value>100)))return fail("Values fall outside the stated measurement scale.");}
 }
 return coreCounterfactual(x);
}
