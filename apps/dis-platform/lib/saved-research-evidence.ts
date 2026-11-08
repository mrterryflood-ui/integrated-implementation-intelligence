/** Inspect saved bytes only. Never replace an old/invalid saved source with the
 * current bundled snapshot or infer scientific approval from a stored flag. */
import {validateCalibrationSupplement,matchesReproducedCalibrationReference,type CalibrationSupplement} from "./pilot-calibration-supplement";
import {validateCrcMarginals,matchesReproducedMarginalReference,type CrcMarginalSupplement} from "./crc-marginal-supplement";
import type {EvidenceSource} from "./evidence-integrity";
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const text=(x:unknown)=>typeof x==="string"?x:"";
export function inspectSavedResearchEvidence(report:unknown){
 const outer=object(report)?report:{};
 const r=object(outer.retainedResearch)?outer.retainedResearch:outer;
 const present=["decisionBrief","sourceIndicators","calibratedEvidence","crcMarginalEvidence"].some(k=>k in r);
 const decision=object(r.decisionBrief)?r.decisionBrief:{};
 let calibrated:CalibrationSupplement|undefined,marginals:CrcMarginalSupplement|undefined;
 const issues:string[]=[];
 if(r.calibratedEvidence!==undefined){
  try{validateCalibrationSupplement(r.calibratedEvidence as CalibrationSupplement);calibrated=structuredClone(r.calibratedEvidence as CalibrationSupplement);}
  catch{issues.push("The saved calibrated snapshot has an unsupported version or invalid source/measurement fields. Inspect the retained record; current data have not been substituted.");}
 }
 if(r.crcMarginalEvidence!==undefined){
  try{validateCrcMarginals(r.crcMarginalEvidence as CrcMarginalSupplement);marginals=structuredClone(r.crcMarginalEvidence as CrcMarginalSupplement);}
  catch{issues.push("The saved marginal snapshot needs source/scope review. Its recorded evidence remains in the full case record.");}
 }
 const indicators=Array.isArray(r.sourceIndicators)?r.sourceIndicators.filter(object).map(x=>({id:text(x.id),construct:text(x.construct),value:typeof x.value==="number"&&Number.isFinite(x.value)?x.value:null,unit:text(x.unit),period:text(x.period),sourceUrl:text(x.sourceUrl),denominator:text(x.denominator)})):[];
 const investigation=object(r.investigation)?r.investigation:{};
 const notes=Array.isArray(investigation.notes)?investigation.notes.filter(object).map(x=>({id:text(x.id),kind:text(x.kind),origin:text(x.origin),text:text(x.text),sourceUrl:text(x.sourceUrl)})):[];
 const calibrationMatchesReference=!!calibrated&&matchesReproducedCalibrationReference(calibrated);
 const marginalsMatchReference=!!marginals&&matchesReproducedMarginalReference(marginals);
 if(calibrated&&!calibrationMatchesReference)issues.push("Saved values do not match a registered reproduced reference. Their declarations are preserved; unchanged source hashes alone do not verify them.");
 if(marginals&&!marginalsMatchReference)issues.push("Saved marginal values do not match a registered reproduced reference. They remain unverified declarations.");
 return {present,decision:{version:text(decision.version),purpose:text(decision.purpose),decisionNow:text(decision.decisionNow),hypothesisRule:text(decision.hypothesisRule),baselineScope:text(decision.baselineScope)},indicators,notes,calibrated,marginals,calibrationMatchesReference,marginalsMatchReference,issues,
  state:issues.length?"SAVED_EVIDENCE_REQUIRES_REVIEW" as const:calibrated?"SAVED_MATCHES_REPRODUCED_REFERENCE" as const:"SAVED_LEGACY_REFERENCE" as const};
}
/** A preliminary council reassessment appends an interpretation; it must not
 * erase the prior research record or recursively nest every earlier council. */
export function retainResearchForReassessment(prior:unknown,next:Record<string,unknown>){
 const previous=object(prior)?prior:{};
 const source=object(previous.retainedResearch)?previous.retainedResearch:previous;
 const isResearch=["decisionBrief","sourceIndicators","calibratedEvidence","crcMarginalEvidence"].some(k=>Object.prototype.hasOwnProperty.call(source,k));
 if(!isResearch)return structuredClone(next);
 return {...structuredClone(next),retainedResearch:structuredClone(source),retainedResearchState:"PRIOR_RECORD_PRESERVED_NOT_REVALIDATED",interventionAuthorized:false,causalEffectEstablished:false,independentOutcomeVerified:false,externalCommunicationAuthorized:false};
}
/** Bounded public numerical context for the existing owner-initiated council.
 * Do not send arbitrary source notes, identifiers or URLs as verified facts. */
export function researchContextForReassessment(report:unknown):string{
 const saved=inspectSavedResearchEvidence(report);if(!saved.present)return "";
 const c=saved.calibrationMatchesReference?saved.calibrated:undefined,m=saved.marginalsMatchReference?saved.marginals:undefined;
 return JSON.stringify({state:"RETAINED_DESCRIPTIVE_CONTEXT_NOT_CAUSAL_OR_CLINICAL_VALIDATION",reviewIssues:saved.issues,
  county:c?{period:c.county.period,rows:c.county.rows.map(r=>({county:r.name,fips:r.fips,allStageRate:r.all.rate_per_100k,lateStageRate:r.late.rate_per_100k,lateRateSourceCi:r.late.ci95,publishedLateCaseShare:r.late.late_share_percent}))}:null,
  ecological:c?{period:c.national.period,nStates:c.national.states,sexScope:c.national.scope,coefficients:c.national.correlations.map(x=>({construct:x.construct,pair:x.pair,pearson:x.pearson})),uncertainty:"IID/exchangeability sensitivities do not solve spatial dependence or registry uncertainty"}:null,
  survey:c?{period:c.survey.period,literalDomainN:c.survey.literalInterview20to49N,eligibilitySensitivityN:c.survey.eligibilityAge50SensitivityN,reportedDiagnosis:c.survey.conditions.map(x=>({condition:x.code,percent:x.publishedPercent})),interpretation:"Reported ever diagnosis, not biological prevalence or observed diagnostic delay"}:null,
  marginal:m?{period:m.period,separateMarginals:m.strata.map(x=>({dimension:x.dimension,label:x.label,lateRateDifference:x.lateRateDifference,lateShareDifferencePp:x.lateShareDifferencePp})),jointAgeRace:false,under45Supported:false}:null,
  unknowns:["clinical pathway completion and timing","preventable burden","mechanism identification","intervention effect","incremental platform benefit"],
  task:"Challenge interacting explanations and measurement fit. Distinguish source observations, interpretations and proposed next tests; no age-threshold recommendation or outcome approval follows from these aggregates."});
}
/** Supply separately scoped, hash-bound platform excerpts to the EXISTING
 * council evidence mesh. Computed correlations are not mislabeled papers. */
export function researchSourcesForReassessment(report:unknown):EvidenceSource[]{
 const saved=inspectSavedResearchEvidence(report),c=saved.calibrationMatchesReference?saved.calibrated:undefined,m=saved.marginalsMatchReference?saved.marginals:undefined;
 if(!c)return [];
 const common={doi:null,year:null,abstractTruncated:false,evidenceKind:"PLATFORM_PUBLIC_EXCERPT" as const,retrievedAt:c.sourceCaptureCompletedAt,source:"Platform retained-source reproduction; scientific and clinical validity remain separate"};
 const sources:EvidenceSource[]=[
  {...common,id:"E901",title:"Source-bound NCI county comparison,2019–2023",url:"https://statecancerprofiles.cancer.gov/",referencePeriod:c.county.period,geography:"Hinds County MS and Harris County TX",receiptHash:c.artifacts.analysisSha256,
   abstract:JSON.stringify({kind:"PLATFORM_REPRODUCED_PUBLIC_AGGREGATES",scope:c.county.scope,rows:c.county.rows.map(x=>({county:x.name,fips:x.fips,allStage:x.all,lateStage:x.late})),interpretation:c.county.meaning,caseShare:c.county.stageShareDefinition,causalEffectEstablished:false})},
  {...common,id:"E902",title:"Computed50-state construct-sensitivity analysis",url:"https://statecancerprofiles.cancer.gov/",referencePeriod:c.national.period,geography:"Named50states; excludes US/DC/Puerto Rico",receiptHash:c.artifacts.reviewFollowupSha256,
   abstract:JSON.stringify({kind:"PLATFORM_DERIVED_ECOLOGICAL_CALCULATION_NOT_A_PUBLISHED_CORRELATION_FINDING",scope:c.national.scope,rows:c.national.correlations,limits:c.national.uncertaintyLimit,causalEffectEstablished:false})},
  {...common,id:"E903",title:"NSFG reported-diagnosis reproduction,2022–2023",url:c.sources.find(x=>x.id==="nsfg_published")!.url,referencePeriod:c.survey.period,geography:"United States",receiptHash:c.artifacts.analysisSha256,
   abstract:JSON.stringify({kind:"PLATFORM_REPRODUCTION_OF_NCHS_PUBLISHED_POINTS",conditions:c.survey.conditions.map(x=>({condition:x.code,publishedPercent:x.publishedPercent,reproducedEligibilitySensitivityPercent:x.eligibilitySensitivity.percent})),literalN:c.survey.literalInterview20to49N,eligibilitySensitivityN:c.survey.eligibilityAge50SensitivityN,scope:"Reported ever diagnosis, not biological prevalence, diagnostic delay or proof of an access mechanism"})}
 ];
 if(m)sources.push({...common,id:"E904",title:"Source-bound CRC age and race marginal estimates",url:"https://statecancerprofiles.cancer.gov/",referencePeriod:m.period,geography:"Hinds County MS and Harris County TX",receiptHash:m.sourceReceiptSha256,
  abstract:JSON.stringify({kind:"PLATFORM_RAW_HTML_REEXTRACTION_OF_SEPARATE_MARGINALS",strata:m.strata,limits:m.limits,causalEffectEstablished:false,under45InferenceSupported:false,jointAgeRaceAnalysis:false})});
 return sources;
}
