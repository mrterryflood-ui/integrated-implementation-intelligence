/** Preserve the whole declared investigation in existing authenticated DIS casework.
 * All narrative, source and completion states remain unverified. No new datastore.
 */
import type {ResearchProgram} from "./research-program";
import type {EvidenceActionReview,EvidenceGap} from "./evidence-action-bridge";
import {buildColorectalDecisionBrief} from "./evidence-action-colorectal";
import {getCalibrationSupplement} from "./pilot-calibration-supplement";
import {getCrcMarginals} from "./crc-marginal-supplement";
import {serializeCaseReport} from "./case-payload-capacity";
export const EVIDENCE_ACTION_HANDOFF_VERSION="dis-evidence-action-case-v1" as const;
export type InvestigationNote={id:string;kind:"SOURCE"|"HYPOTHESIS"|"COUNTERFACTUAL"|"CORRECTION"|"OUTCOME"|"REOPEN";text:string;sourceUrl:string;gapIds:string[];origin:"PUBLIC_SOURCE_TRANSCRIPTION"|"SYNTHETIC"};
export type InvestigationSupplement={publicAggregateConfirmed:boolean;additionalGaps:EvidenceGap[];notes:InvestigationNote[]};
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const bounded=(x:unknown,n:number)=>typeof x==="string"&&x.trim().length>0&&x.length<=n;
function checkKeys(x:Record<string,unknown>,keys:string[]){if(Object.keys(x).some(k=>!keys.includes(k)))throw Error("Unexpected investigation field; no identifiers, inferred approval or private records are accepted.");}
export function validateInvestigationSupplement(x:unknown,existingIds:readonly string[]):InvestigationSupplement{
 if(!object(x)||x.publicAggregateConfirmed!==true)throw Error("Explicit public-aggregate confirmation is required for supplementary notes.");
 checkKeys(x,["publicAggregateConfirmed","additionalGaps","notes"]);
 if(!Array.isArray(x.additionalGaps)||x.additionalGaps.length>50||!Array.isArray(x.notes)||x.notes.length>40)throw Error("Bounded additional gaps and notes arrays required.");
 const ids=new Set(existingIds),noteIds=new Set<string>();
 for(const g of x.additionalGaps){
  if(!object(g))throw Error("Invalid additional gap.");checkKeys(g,["id","severity","problem","ownerRole","nextEvidence"]);
  if(!bounded(g.id,100)||ids.has(String(g.id))||!bounded(g.problem,1200)||!bounded(g.ownerRole,150)||!bounded(g.nextEvidence,1800)||!["MEASUREMENT_BLOCK","RESEARCH_REQUIRED","IMPLEMENTATION_REQUIRED"].includes(String(g.severity)))throw Error("Additional gap requires unique identity, owner role, test and allowed severity.");
  ids.add(String(g.id));
 }
 for(const n of x.notes){
  if(!object(n))throw Error("Invalid note.");checkKeys(n,["id","kind","text","sourceUrl","gapIds","origin"]);
  if(!bounded(n.id,100)||noteIds.has(String(n.id))||!bounded(n.text,5000)||!Array.isArray(n.gapIds)||n.gapIds.length>20||!n.gapIds.every(id=>typeof id==="string"&&ids.has(id))||!["SOURCE","HYPOTHESIS","COUNTERFACTUAL","CORRECTION","OUTCOME","REOPEN"].includes(String(n.kind))||!["PUBLIC_SOURCE_TRANSCRIPTION","SYNTHETIC"].includes(String(n.origin)))throw Error("Note identity, origin, content or gap reference is invalid.");
  noteIds.add(String(n.id));
  try{const u=new URL(String(n.sourceUrl));if(u.protocol!=="https:"||u.username||u.password)throw Error();}catch{throw Error("Every note needs a public HTTPS source or explicitly synthetic reference.");}
 }
 if(JSON.stringify(x).length>24000)throw Error("Supplement exceeds 24 KB; nothing was silently truncated.");
 return JSON.parse(JSON.stringify(x)) as InvestigationSupplement;
}
export function buildEvidenceActionCaseHandoff(program:ResearchProgram,review:EvidenceActionReview,supplement?:unknown){
 if(program.caseId!==review.caseId||review.schemaVersion!=="dis-evidence-action-v1")throw Error("Research bridge identity/version mismatch; refuse case seed.");
 if(review.measures.some(x=>x.indicator.evidenceState!=="PUBLISHED_AGGREGATE"||x.provenance!=="CURATED_PUBLIC_AGGREGATE_NOT_REEXTRACTED"))throw Error("Only curated public aggregate baseline records can seed this case.");
 if(program.individualDataProcessed||program.interventionAuthorized||review.causalEffectEstablished||review.verifiedCorrections!==0)throw Error("A case seed cannot upgrade authorization or independently verified outcome claims.");
 if(new Set(review.gaps.map(g=>g.id)).size!==review.gaps.length)throw Error("Duplicate gap identities must be reconciled.");
 const extra=supplement===undefined?undefined:validateInvestigationSupplement(supplement,review.gaps.map(g=>g.id));
 const gaps=[...review.gaps,...(extra?.additionalGaps||[])];
 // Existing playbooks accept 35 tasks including seven general tasks. Preserve all
 // gaps in the full report even when only 28 fit in the editable task projection.
 const tasks=gaps.slice(0,28).map(g=>({title:("Investigate: "+g.problem).slice(0,175),why:("Evidence gap "+g.id+". Proposed review owner: "+g.ownerRole+".").slice(0,340),success:g.nextEvidence.slice(0,340)}));
 const clinical=program.site==="colorectal"?[
  {label:"All-stage invasive disease incidence",baseline:"Implementation cohort not measured; separately retained2019–2023 registry context available",target:"Site-specific, source-aligned and lag-aware",unit:"cases per 100,000"},
  {label:"Screening uptake in eligible population",baseline:"Not measured locally",target:"Site-defined before pilot",unit:"%"},
  {label:"Abnormal-result diagnostic resolution",baseline:"Not measured locally",target:"Site-defined before pilot",unit:"%"}
 ]:[];
 const metrics=[...clinical,
  {label:"Beneficiary outcome by prespecified subgroup",baseline:"Not established",target:"Define valid benefit and comparator",unit:"condition-specific"},
  {label:"Adverse outcomes and burdens by subgroup",baseline:"Not established",target:"Prespecified stop/review rule",unit:"condition-specific"},
  {label:"Absolute and relative benefit gaps between groups",baseline:"Not established",target:"Report uncertainty and composition",unit:"endpoint-specific"},
  {label:"Sustained benefit, fidelity and resource burden",baseline:"No field outcome verified",target:"Context-specific follow-up and successor",unit:"review periods"},
  {label:"Source-supported competing mechanisms",baseline:"Not adjudicated locally",target:"Disconfirming evidence and independent review",unit:"count"}
 ];
 const title=(program.site+" evidence-to-action | "+program.population.targetName).slice(0,150);
 const question=(program.question+" [Internal evidence-to-action study; comparisons not yet validated]").slice(0,3000);
 const report={state:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",schemaVersion:EVIDENCE_ACTION_HANDOFF_VERSION,revision:"2026-11-08-calibrated-and-marginal-evidence",sourceState:program.site==="colorectal"?"CURATED_LEGACY_BASELINE_AND_SEPARATE_RAW_REPLAYED_PUBLIC_SUPPLEMENTS":"CURATED_PUBLIC_REFERENCE_NOT_INDEPENDENTLY_REEXTRACTED",caseId:review.caseId,geography:program.population.proxyUnit,condition:program.site,
  ...(program.site==="colorectal"?{decisionBrief:buildColorectalDecisionBrief(program,{...review,gaps}),calibratedEvidence:getCalibrationSupplement(),crcMarginalEvidence:getCrcMarginals()}:{}),
  sourceIndicators:review.measures.map(x=>({id:x.id,construct:x.construct,value:x.indicator.value,unit:x.indicator.unit,period:x.indicator.period,sourceUrl:x.indicator.sourceUrl,denominator:x.indicator.denominatorDefinition})),
  gapIDs:gaps.map(g=>g.id),gapLedger:gaps,taskProjection:{editableCount:tasks.length,totalGapCount:gaps.length,unmaterializedGapIDs:gaps.slice(28).map(g=>g.id),rule:"All gap definitions are retained; edit projection is bounded, not silently complete."},
  investigation:{measures:review.measures,links:review.links,literature:review.literature,hypotheses:review.hypotheses,corrections:review.corrections,notes:extra?.notes||[],status:"DECLARED_RECORD_NOT_AUTHENTICATED",privacyStatus:extra?"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED":"CURATED_PUBLIC_BASELINE",reopenRule:"A changed source version, denominator, population, hypothesis or adverse signal requires a new review; preserve prior baseline and dissent."},
  actionPlan:{status:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",tasks,metrics},independentOutcomeVerified:false,causalEffectEstablished:false,interventionAuthorized:false,externalCommunicationAuthorized:false,noPatientData:extra?null:true};
 serializeCaseReport(report);
 return structuredClone({title,question,report});
}
