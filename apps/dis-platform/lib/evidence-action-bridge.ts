/**
 * DIS evidence-to-action bridge: a bounded, disease-agnostic research contract.
 *
 * Reuses the existing ResearchProgram, literature discovery, DIS workflow,
 * and human-selected RPLICE boundary. Never treats a bibliographic match,
 * geographic correlation, numerical difference or reported correction as
 * verified causation, institutional approval or a completed intervention.
 */
import type {ResearchProgram,ResearchIndicator} from "./research-program";
import type {IntelligenceRecord} from "./consultation-research";

export const BRIDGE_VERSION="dis-evidence-action-v1" as const;
export type Construct=
  "DISEASE_INCIDENCE"|"LATE_STAGE_INCIDENCE"|"LATE_STAGE_CASE_SHARE"|
  "LATE_STAGE_CASE_COUNT"|"SCREENING_COMPLETION"|"DIAGNOSTIC_FOLLOWUP"|
  "MORTALITY"|"OTHER";
export type MeasureBinding={
  indicatorId:string;
  condition:string;
  construct:Construct;
  /** A declared, source-specific denominator class; not an inferred conversion. */
  denominatorClass:string;
  populationFrame:string;
  methodVersion:string;
};
export type BoundMeasure={
  id:string;condition:string;construct:Construct;denominatorClass:string;
  populationFrame:string;methodVersion:string;
  indicator:ResearchIndicator;
  sourceLineage:string;
  provenance:"CURATED_PUBLIC_AGGREGATE_NOT_REEXTRACTED";
};
export type LinkReview={
  left:string;right:string;
  relationship:"RELATED_PHENOMENON_DIFFERENT_MEASURE"|"SAME_CONSTRUCT_NOT_YET_COMPARABLE";
  safeToPool:false;causalRelationshipEstablished:false;
  reasons:string[];
};
export type EvidenceGap={
  id:string;
  severity:"MEASUREMENT_BLOCK"|"RESEARCH_REQUIRED"|"IMPLEMENTATION_REQUIRED";
  problem:string;ownerRole:string;nextEvidence:string;
};
export type LiteratureLead={
  id:string;title:string;url:string;sourceIndex:string;
  sourceStatus:"DISCOVERY_ONLY";
  claimVerified:false;independentConfirmation:false;
};
export type HypothesisTest={
  id:string;hypothesis:string;alternative:string;discriminatingTest:string;
  proposedInstrument:string;ownerRole:string;
  locallyTested:false;
};
export type CorrectionProposal={
  id:string;strategy:string;basis:string;
  ownerRole:string;measureToVerify:string;potentialHarm:string;
  coreFunctionEvidence:"NOT_INDEPENDENTLY_VALIDATED_FOR_SITE";
  sourceUrl:string;state:"PROPOSED_NOT_AUTHORIZED";
};
export type EvidenceActionReview={
  schemaVersion:typeof BRIDGE_VERSION;
  caseId:string;
  measures:BoundMeasure[];links:LinkReview[];
  literature:LiteratureLead[];
  hypotheses:HypothesisTest[];
  corrections:CorrectionProposal[];
  gaps:EvidenceGap[];
  causalEffectEstablished:false;
  correctiveActionAuthorized:false;
  verifiedCorrections:0;
  specialistExecution:"HUMAN_SELECTION_REQUIRED_NOT_INVOKED";
  status:"RESEARCH_ONLY_INDEPENDENT_VALIDATION_REQUIRED";
};
const canon=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ");
const webUrl=(s:string)=>{try{const u=new URL(s);return u.protocol==="https:"&&Boolean(u.hostname);}catch{return false;}};
const sourceIdentity=(url:string)=>{
  try{
    const u=new URL(url);u.hash="";
    u.hostname=u.hostname.toLowerCase();
    u.pathname=u.pathname.replace(/\/$/,"");
    const doi=u.hostname==="doi.org"?u.pathname.toLowerCase():null;
    return doi?"doi:"+doi:u.toString();
  }catch{return url.trim().toLowerCase();}
};
/** Discovery is a *lead*, not full-text extraction or a second independent vote. */
export function boundDiscoveryLeads(records:readonly IntelligenceRecord[]):LiteratureLead[]{
  const seen=new Set<string>();
  const result:LiteratureLead[]=[];
  for(const record of records.slice(0,60)){
    if(record.kind!=="SCHOLARLY"||!webUrl(record.url)||!record.title.trim())continue;
    const identity=sourceIdentity(record.url);
    if(seen.has(identity))continue;
    seen.add(identity);
    result.push({id:record.id,title:record.title.slice(0,260),url:record.url,
      sourceIndex:record.source,sourceStatus:"DISCOVERY_ONLY",
      claimVerified:false,independentConfirmation:false});
  }
  return result;
}
function gap(id:string,severity:EvidenceGap["severity"],problem:string,ownerRole:string,nextEvidence:string):EvidenceGap{
  return{id,severity,problem,ownerRole,nextEvidence};
}
function linkMeasures(left:BoundMeasure,right:BoundMeasure):LinkReview{
  const same=left.construct===right.construct;
  const reasons:string[]=[];
  if(!same)reasons.push("Different constructs or numerators: one measure cannot stand in for another.");
  if(canon(left.indicator.unit)!==canon(right.indicator.unit))reasons.push("Units differ.");
  if(canon(left.indicator.denominatorDefinition)!==canon(right.indicator.denominatorDefinition)||
    left.denominatorClass!==right.denominatorClass)reasons.push("Denominator frames differ or require independent validation.");
  if(canon(left.indicator.period)!==canon(right.indicator.period))reasons.push("Observation windows differ.");
  if(canon(left.populationFrame)!==canon(right.populationFrame))reasons.push("Population and eligibility frames differ.");
  if(left.methodVersion!==right.methodVersion)reasons.push("Instrument and/or standardization versions differ.");
  if(left.sourceLineage===right.sourceLineage)reasons.push("Same source lineage: cannot claim independent corroboration.");
  if(left.indicator.geography!==right.indicator.geography)reasons.push("Different geographies: boundary and population comparability require review.");
  if(!reasons.length)reasons.push("Matched declarations do not prove instrument validity, independent replication or exchangeability.");
  return {left:left.id,right:right.id,
    relationship:same?"SAME_CONSTRUCT_NOT_YET_COMPARABLE":"RELATED_PHENOMENON_DIFFERENT_MEASURE",
    safeToPool:false,causalRelationshipEstablished:false,reasons};
}
export function reviewEvidenceToAction(
  program:ResearchProgram,bindings:readonly MeasureBinding[],
  discovery:readonly IntelligenceRecord[]=[]
):EvidenceActionReview{
  const gaps:EvidenceGap[]=program.issues.map(x=>gap("program:"+x.code,
    x.severity==="BLOCK_PROGRAM_CLAIM"?"MEASUREMENT_BLOCK":"RESEARCH_REQUIRED",
    x.finding,"Research and measurement owners",x.nextEvidence));
  const mapping=new Map<string,MeasureBinding>();
  for(const b of bindings){
    if(mapping.has(b.indicatorId))gaps.push(gap("duplicate:"+b.indicatorId,"MEASUREMENT_BLOCK",
      "An indicator has multiple incompatible construct bindings.","Measurement scientist",
      "Adjudicate one condition/construct/denominator mapping against the source methods."));
    else mapping.set(b.indicatorId,b);
  }
  const measures:BoundMeasure[]=[];
  for(const indicator of program.indicators){
    const b=mapping.get(indicator.id);
    if(!b||!b.condition.trim()||b.construct==="OTHER"||!b.denominatorClass.trim()||
       !b.populationFrame.trim()||!b.methodVersion.trim()||
       b.condition!==indicator.site || (program.site!=="general"&&b.condition!==program.site)){
      gaps.push(gap("unmapped:"+indicator.id,"MEASUREMENT_BLOCK",
        "The measurement has no accepted condition-specific construct and denominator mapping.",
        "Epidemiology and measurement lead",
        "Read original methods and explicitly bind the construct, population and instrument; no automatic disease transfer."));
      continue;
    }
    if(indicator.evidenceState!=="PUBLISHED_AGGREGATE"||indicator.value===null||!webUrl(indicator.sourceUrl)){
      gaps.push(gap("source:"+indicator.id,"MEASUREMENT_BLOCK",
        "This cell is not a traceable, observed published aggregate.",
        "Evidence provenance reviewer","Obtain the original release, resolve suppression and review the source method."));
      continue;
    }
    measures.push({id:indicator.id,condition:b.condition,construct:b.construct,
      denominatorClass:b.denominatorClass,populationFrame:b.populationFrame,
      methodVersion:b.methodVersion,indicator,sourceLineage:sourceIdentity(indicator.sourceUrl),
      provenance:"CURATED_PUBLIC_AGGREGATE_NOT_REEXTRACTED"});
  }
  for(const b of bindings)if(!program.indicators.some(i=>i.id===b.indicatorId))
    gaps.push(gap("orphan:"+b.indicatorId,"MEASUREMENT_BLOCK",
      "A crosswalk references an indicator absent from this study.","Measurement lead",
      "Check identifier and condition before admitting external measurements."));
  const links:LinkReview[]=[];
  for(let i=0;i<measures.length;i++)for(let j=i+1;j<measures.length;j++){
    if(measures[i].condition===measures[j].condition)links.push(linkMeasures(measures[i],measures[j]));
  }
  const hypotheses=program.drivers.map(d=>({
    id:d.id,hypothesis:d.hypothesis,alternative:d.competingExplanation,
    discriminatingTest:d.discriminatingTest,proposedInstrument:d.instrumentOrDataNeeded,
    ownerRole:d.responsibleReviewers,locallyTested:false as const
  }));
  const corrections=program.strategies.map(s=>({
    id:s.id,strategy:s.name,basis:s.basis,ownerRole:"Locally authorized implementation owner (not yet appointed)",
    measureToVerify:s.measureToVerify,potentialHarm:s.potentialHarm,sourceUrl:s.sourceUrl,
    coreFunctionEvidence:"NOT_INDEPENDENTLY_VALIDATED_FOR_SITE" as const,
    state:"PROPOSED_NOT_AUTHORIZED" as const
  }));
  if(!measures.some(x=>x.construct==="DISEASE_INCIDENCE"))
    gaps.push(gap("all-stage-incidence","RESEARCH_REQUIRED",
      "Underlying disease occurrence is not measured by late-stage incidence or stage share.",
      "Cancer registry and epidemiology partners",
      "Obtain same-site all-stage incidence, population denominator, observation window and stage completeness."));
  if(!measures.some(x=>x.construct==="SCREENING_COMPLETION"))
    gaps.push(gap("screening-denominator","RESEARCH_REQUIRED",
      "Eligibility-based screening completion is not locally measured.",
      "Clinic quality and public-health partners",
      "Secure authorized eligible-person and completion counts, dates and source-defined screening eligibility."));
  if(!measures.some(x=>x.construct==="DIAGNOSTIC_FOLLOWUP"))
    gaps.push(gap("diagnostic-resolution","RESEARCH_REQUIRED",
      "Abnormal-result diagnostic follow-up is not locally measured.",
      "Diagnostic pathway and navigator leads",
      "Measure abnormal findings, follow-up eligibility, referral and confirmed diagnostic resolution."));
  if(!discovery.length)gaps.push(gap("literature-not-retrieved","RESEARCH_REQUIRED",
    "No fresh scholarly retrieval attached to this case.","Research librarian",
    "Use existing source search, read original articles, and confirm population, outcome and design."));
  gaps.push(gap("counterfactual-unverified","RESEARCH_REQUIRED",
    "No treatment/control panel, documented intervention timing or parallel-trends investigation supplied.",
    "Independent causal inference reviewer",
    "Build a longitudinal comparison with source-stable measures, contemporaneous controls and competing changes."));
  gaps.push(gap("delivery-not-witnessed","IMPLEMENTATION_REQUIRED",
    "The case has no witnessed pilot, owners, capacity, fidelity denominator or independently observed outcome.",
    "Authorized implementation and evaluation owners",
    "Approve/rehearse a reversible protocol, then collect valid actual delivery and follow-up receipts."));
  return {schemaVersion:BRIDGE_VERSION,caseId:program.caseId,measures,links,
    literature:boundDiscoveryLeads(discovery),hypotheses,corrections,gaps,
    causalEffectEstablished:false,correctiveActionAuthorized:false,verifiedCorrections:0,
    specialistExecution:"HUMAN_SELECTION_REQUIRED_NOT_INVOKED",
    status:"RESEARCH_ONLY_INDEPENDENT_VALIDATION_REQUIRED"};
}

export type PanelObservation={year:number;value:number|null;denominator:number|null};
export type PanelArm={site:string;populationFrame:string;observations:PanelObservation[]};
export type CounterfactualRequest={
  condition:string;construct:Construct;unit:string;
  interventionYear:number|null;
  treated:PanelArm;comparator:PanelArm;
  commonMeasurementVersion:string;
  comparisonRationale:string;
  parallelTrendsEvidence:string;
  competingChangesEvidence:string;
  spilloverAssessment:string;
  independentReviewer:string;
};
export type CounterfactualAudit={
  gate:"INSUFFICIENT_FOR_CAUSAL_ESTIMATE"|"CANDIDATE_FOR_INDEPENDENT_DESIGN_REVIEW";
  gaps:string[];
  matchedPreYears:number[];matchedPostYears:number[];
  rawDifferenceInDifferences:number|null;
  interpretation:"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL";
  causalEffectEstablished:false;
};
export function reviewCounterfactual(x:CounterfactualRequest):CounterfactualAudit{
  const gaps:string[]=[];
  const validYear=(n:number)=>Number.isInteger(n)&&n>=1900&&n<=2200;
  const validArm=(arm:PanelArm,label:string)=>{
    const seen=new Set<number>();
    if(!arm.site?.trim()||!arm.populationFrame?.trim())gaps.push(label+": site and population frame required.");
    if(!Array.isArray(arm.observations)){gaps.push(label+": observations missing.");return new Map<number,number>();}
    const values=new Map<number,number>();
    for(const p of arm.observations.slice(0,200)){
      if(!validYear(p.year)||seen.has(p.year)||!Number.isFinite(p.value)||p.value===null||
         !Number.isFinite(p.denominator)||p.denominator===null||p.denominator<=0){
        gaps.push(label+": duplicate year, invalid value or missing/zero eligible denominator.");
        continue;
      }
      seen.add(p.year);values.set(p.year,p.value);
    }
    if(arm.observations.length>200)gaps.push(label+": series exceeds bounded input.");
    return values;
  };
  if(!x.condition?.trim()||!x.unit?.trim()||x.construct==="OTHER")
    gaps.push("Condition, exact outcome construct and unit are required.");
  if(!validYear(x.interventionYear as number))gaps.push("A dated intervention year is required.");
  if(x.treated?.site&&x.comparator?.site&&canon(x.treated.site)===canon(x.comparator.site))
    gaps.push("Treated and comparison must be distinct units.");
  if(x.treated?.populationFrame&&x.comparator?.populationFrame&&canon(x.treated.populationFrame)!==canon(x.comparator.populationFrame))
    gaps.push("Population/eligibility frames differ.");
  for(const [value,label] of [
    [x.commonMeasurementVersion,"Common measurement/version"],[x.comparisonRationale,"Comparison rationale"],
    [x.parallelTrendsEvidence,"Independent parallel-trends investigation"],
    [x.competingChangesEvidence,"Competing policy, ascertainment and cointervention changes"],
    [x.spilloverAssessment,"Spillover assessment"],[x.independentReviewer,"Independent reviewer"]
  ])if(typeof value!=="string"||value.trim().length<20)gaps.push(label+" must be documented, not merely checked.");
  const treated=validArm(x.treated||{site:"",populationFrame:"",observations:[]},"Treated");
  const control=validArm(x.comparator||{site:"",populationFrame:"",observations:[]},"Comparison");
  const common=[...treated.keys()].filter(y=>control.has(y)).sort((a,b)=>a-b);
  const pre=common.filter(y=>x.interventionYear!==null&&y<x.interventionYear);
  const post=common.filter(y=>x.interventionYear!==null&&y>=x.interventionYear);
  if(pre.length<3)gaps.push("At least three common pre-intervention observations are required for this conservative design screen.");
  if(post.length<2)gaps.push("At least two common post-intervention observations are required for this design screen.");
  if(pre.length&&post.length&&pre[pre.length-1]>=post[0])gaps.push("Intervention timing overlaps panel windows.");
  if(gaps.length)return {gate:"INSUFFICIENT_FOR_CAUSAL_ESTIMATE",gaps,
    matchedPreYears:pre,matchedPostYears:post,rawDifferenceInDifferences:null,
    interpretation:"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL",causalEffectEstablished:false};
  const mean=(years:number[],source:Map<number,number>)=>years.reduce((s,y)=>s+source.get(y)!,0)/years.length;
  const raw=(mean(post,treated)-mean(pre,treated))-(mean(post,control)-mean(pre,control));
  return {gate:"CANDIDATE_FOR_INDEPENDENT_DESIGN_REVIEW",gaps:[],
    matchedPreYears:pre,matchedPostYears:post,rawDifferenceInDifferences:raw,
    interpretation:"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL",causalEffectEstablished:false};
}
export type CorrectionReceipt={
  proposedActionId:string;
  deliveryRecordedAt:string;
  sourceUrl:string;
  eligibleDenominator:number|null;
  completedNumerator:number|null;
  coreFunctionChecked:boolean;
  balancingHarmsReviewed:boolean;
  comparisonRecorded:boolean;
  reviewerIdentity:string;
};
export function reviewCorrectionReceipt(action:CorrectionProposal,receipt:CorrectionReceipt){
  const gaps:string[]=[];
  if(receipt.proposedActionId!==action.id)gaps.push("Action identifier does not match proposal.");
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(receipt.deliveryRecordedAt)||
    !Number.isFinite(Date.parse(receipt.deliveryRecordedAt)))gaps.push("Dated delivery receipt missing.");
  if(!webUrl(receipt.sourceUrl))gaps.push("Source reference missing.");
  if(receipt.eligibleDenominator===null||!Number.isInteger(receipt.eligibleDenominator)||
    receipt.eligibleDenominator<=0||receipt.completedNumerator===null||
    !Number.isInteger(receipt.completedNumerator)||receipt.completedNumerator<0||
    receipt.completedNumerator>receipt.eligibleDenominator)
    gaps.push("Valid completed and eligible denominators required.");
  if(!receipt.coreFunctionChecked)gaps.push("Core intervention function not checked.");
  if(!receipt.balancingHarmsReviewed)gaps.push("Adverse events, exclusion and burden not assessed.");
  if(!receipt.comparisonRecorded)gaps.push("Credible comparison not recorded.");
  if(!receipt.reviewerIdentity?.trim())gaps.push("Independent reviewer not identified.");
  return {actionId:action.id,provisionalCompleteness:gaps.length===0,
    problems:gaps,closure:"INDEPENDENT_EXTERNAL_VERIFICATION_REQUIRED" as const,
    claimedOutcomeVerified:false as const,actionAuthorized:false as const};
}


/**
 * Cross-study evidence harmonization is deliberately *manual and transparent*.
 * Search metadata supplies candidates. An analyst must transcribe the original
 * study's definitions before this assessment can identify measurement gaps.
 * This module never pretends that a pasted publication or value was verified.
 */
export type ExternalStudyMeasure={
  id:string;title:string;sourceUrl:string;condition:string;construct:Construct;
  geography:string;populationFrame:string;period:string;
  numeratorDefinition:string;denominatorDefinition:string;
  unit:string;methodVersion:string;
  value:number|null;
};
export type CrossStudyLink={
  studyId:string;baselineId:string;
  relation:"SAME_PHENOMENON_DIFFERENT_MEASURE"|"SAME_CONSTRUCT_ALIGNMENT_UNVERIFIED";
  issues:string[];
  safeToPool:false;sourceIndependenceEstablished:false;causalityEstablished:false;
};
export type CrossStudyReview={
  status:"SOURCE_REPORTED_CANDIDATES_NOT_INDEPENDENTLY_VERIFIED";
  admitted:ExternalStudyMeasure[];
  links:CrossStudyLink[];
  rejected:{id:string;reasons:string[]}[];
  originalMethodsVerified:false;
  pooledEstimate:null;
};
const validConstructs:readonly Construct[]=[
  "DISEASE_INCIDENCE","LATE_STAGE_INCIDENCE","LATE_STAGE_CASE_SHARE",
  "LATE_STAGE_CASE_COUNT","SCREENING_COMPLETION","DIAGNOSTIC_FOLLOWUP","MORTALITY","OTHER"
];
export function reviewCrossStudyMeasurements(input:unknown,base:readonly BoundMeasure[]):CrossStudyReview{
  if(!Array.isArray(input)||input.length>30)
    return {status:"SOURCE_REPORTED_CANDIDATES_NOT_INDEPENDENTLY_VERIFIED",
      admitted:[],links:[],rejected:[{id:"INPUT",reasons:["Expected an array of no more than 30 public, aggregate source records."]}],
      originalMethodsVerified:false,pooledEstimate:null};
  const admitted:ExternalStudyMeasure[]=[],links:CrossStudyLink[]=[],rejected:CrossStudyReview["rejected"]=[];
  const ids=new Set<string>();
  for(const [i,unknownItem] of input.entries()){
    const item=unknownItem&&typeof unknownItem==="object"&&!Array.isArray(unknownItem)?unknownItem as Record<string,unknown>:{};
    const id=typeof item.id==="string"?item.id:"row-"+(i+1);
    const reasons:string[]=[];
    if(!id.trim()||id.length>100||ids.has(id))reasons.push("Duplicate, missing or oversized indicator identifier.");
    ids.add(id);
    const mandatory=["title","sourceUrl","condition","geography","populationFrame","period","numeratorDefinition","denominatorDefinition","unit","methodVersion"] as const;
    for(const name of mandatory)if(typeof item[name]!=="string"||!(item[name] as string).trim()||(item[name] as string).length>700)
      reasons.push(name+" is missing or invalid.");
    if(typeof item.sourceUrl!=="string"||!webUrl(item.sourceUrl))reasons.push("An actual HTTPS source location is required.");
    if(typeof item.construct!=="string"||!validConstructs.includes(item.construct as Construct)||item.construct==="OTHER")
      reasons.push("The original study construct must be explicitly classified.");
    if(item.value!==null&&(typeof item.value!=="number"||!Number.isFinite(item.value)||item.value<0))
      reasons.push("Value must be a nonnegative published aggregate or null when unknown.");
    if(item.unit==="percent"&&typeof item.value==="number"&&item.value>100)
      reasons.push("Percent cannot exceed 100.");
    if(reasons.length){rejected.push({id,reasons});continue;}
    const accepted=item as ExternalStudyMeasure;
    admitted.push(accepted);
    for(const m of base){
      if(canon(accepted.condition)!==canon(m.condition))continue;
      const issues:string[]=[];
      if(accepted.construct!==m.construct)issues.push("Different outcome construct or ascertainment point.");
      if(canon(accepted.unit)!==canon(m.indicator.unit))issues.push("Unit/standardization mismatch.");
      if(canon(accepted.denominatorDefinition)!==canon(m.indicator.denominatorDefinition))
        issues.push("Denominator/eligibility mismatch.");
      if(canon(accepted.numeratorDefinition)!==canon(m.indicator.numeratorDefinition))
        issues.push("Numerator or case definition mismatch.");
      if(canon(accepted.geography)!==canon(m.indicator.geography))issues.push("Geographic boundary mismatch.");
      if(canon(accepted.period)!==canon(m.indicator.period))issues.push("Reporting window mismatch.");
      if(canon(accepted.methodVersion)!==canon(m.methodVersion))issues.push("Method and version not reconciled.");
      if(canon(accepted.populationFrame)!==canon(m.populationFrame))issues.push("Population frame not reconciled.");
      if(sourceIdentity(accepted.sourceUrl)===m.sourceLineage)
        issues.push("Shared original-source lineage; not independent corroboration.");
      if(!issues.length)issues.push("Matching declarations cannot authenticate a source or validate exchangeability.");
      links.push({studyId:accepted.id,baselineId:m.id,
        relation:accepted.construct===m.construct?
          "SAME_CONSTRUCT_ALIGNMENT_UNVERIFIED":"SAME_PHENOMENON_DIFFERENT_MEASURE",
        issues,safeToPool:false,sourceIndependenceEstablished:false,causalityEstablished:false});
    }
  }
  return {status:"SOURCE_REPORTED_CANDIDATES_NOT_INDEPENDENTLY_VERIFIED",
    admitted,links,rejected,originalMethodsVerified:false,pooledEstimate:null};
}
