/**
 * Colorectal evidence-to-action pilot: existing Hinds County curated data.
 * Values and source limitations remain in jackson-cancer-case.ts.
 * Do not invent Harris County, Colorado, city-level or longitudinal values.
 * No cross-disease mapping is inherited from this study.
 */
import {jacksonCancerCase} from "./jackson-cancer-case";
import {buildResearchProgram,type ResearchProgram} from "./research-program";
import {reviewEvidenceToAction,type MeasureBinding,type EvidenceActionReview} from "./evidence-action-bridge";
import type {IntelligenceRecord} from "./consultation-research";
import {getCalibrationSupplement} from "./pilot-calibration-supplement";
import {getCrcMarginals} from "./crc-marginal-supplement";

export const COLORECTAL_CROSSWALK:readonly MeasureBinding[]=[
  {indicatorId:"CRC-LATE-INC",condition:"colorectal",
   construct:"LATE_STAGE_INCIDENCE",denominatorClass:"AGE_STANDARDIZED_RESIDENT_POPULATION",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 county rate"},
  {indicatorId:"CRC-LATE-SHARE",condition:"colorectal",
   construct:"LATE_STAGE_CASE_SHARE",denominatorClass:"PROVIDER_DEFINED_INCIDENT_COLORECTAL_CASES_UNKNOWN_STAGE_HANDLING_UNRESOLVED",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 published late-stage case percentage"},
  {indicatorId:"CRC-LATE-COUNT",condition:"colorectal",
   construct:"LATE_STAGE_CASE_COUNT",denominatorClass:"AVERAGE_ANNUAL_LATE_STAGE_CASES",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 annual case count"}
] as const;
export const COLORECTAL_COMPARISON_SITES=[
  {site:"Hinds County, Mississippi",state:"CURATED_HISTORICAL_COUNTY_BASELINE"},
  {site:"Harris County, Texas",state:"2019_2023_SOURCE_REPRODUCED_LEGACY_ALIGNMENT_AND_LONGITUDINAL_DESIGN_REQUIRED"},
  {site:"Colorado county or state",state:"TARGET_GEOGRAPHY_AND_MATCHED_DATA_REQUIRED"}
] as const;

/** Decision and value contract for this historical case, shared by UI and case save.
 * Retained 2019–2023 comparisons are a separate research snapshot, not silently
 * substituted for this workbench's 2018–2022 curated Hinds-only measurements.
 */
export function buildColorectalDecisionBrief(program:ResearchProgram,review:EvidenceActionReview){
  if(program.site!=="colorectal"||program.caseId!==review.caseId)
    throw Error("Colorectal decision brief requires its own research case identity.");
  const reference=jacksonCancerCase("colorectal");
  if(program.caseId!==reference.id||program.population.proxyUnit!==reference.population.proxyUnit||
    review.measures.some(m=>{
      const expected=reference.indicators.find(i=>i.id===m.id);
      const binding=COLORECTAL_CROSSWALK.find(b=>b.indicatorId===m.id);
      return !expected||!binding||m.condition!=="colorectal"||m.indicator.id!==m.id||
        m.construct!==binding.construct||m.denominatorClass!==binding.denominatorClass||
        m.populationFrame!==binding.populationFrame||m.methodVersion!==binding.methodVersion||
        ["period","geography","site","unit","value","sourceUrl","numeratorDefinition","denominatorDefinition"].some(key=>
          m.indicator[key as keyof typeof m.indicator]!==expected[key as keyof typeof expected]);
    }))throw Error("Historical decision scope mismatch: reconcile period, geography, construct and original source before using this brief.");
  return {
    version:"dis-colorectal-decision-v2" as const,
    state:"RESEARCH_IN_CALIBRATION" as const,
    caseId:program.caseId,
    purpose:"Discover what is missed before avoidable progression, identify interacting causes, and evaluate changes that improve people's outcomes.",
    decisionNow:"Choose the next discriminating study, not a presumed cause or intervention.",
    hypothesisRule:"Age is one candidate explanation. Recognition, prevention, access, follow-through, capacity, biology and measurement may coexist or interact; retain evidence against each explanation.",
    baselineScope:review.measures.length?"Historical 2018–2022 curated Hinds County baseline. The separately versioned 2019–2023 calibration supplement adds matched Hinds/Harris rates; it does not supply individual age/risk or clinical pathway histories.":"No accepted measurements in the historical 2018–2022 Hinds baseline. The separate calibration supplement does not repair an invalid legacy measurement or supply clinical pathway histories.",
    measurementQuestions:[
      {construct:"LATE_STAGE_INCIDENCE",question:"What is the population burden of late-stage disease?"},
      {construct:"LATE_STAGE_CASE_SHARE",question:"What is the published stage distribution among the provider-defined diagnosed cases? Unknown-stage handling needs verification."},
      {construct:"LATE_STAGE_CASE_COUNT",question:"How many late-stage cases are recorded annually, for workload context?"}
    ],
    unknownDeltasScope:"The geographic null concerns the legacy baseline; the separately versioned supplement supplies its own observed 2019–2023 contrast. Pathway and effect unknowns remain open.",
    unknownDeltas:{legacyMatchedGeographicDifference:null,pathwayCompletionGap:null,preventableBurden:null,interventionEffect:null,incrementalPlatformBenefit:null},
    missingnessRule:"Unknown is not zero. A valid number can answer the wrong decision question; no one measure substitutes for the others.",
    pathways:[
      {id:"average-risk",label:"Asymptomatic average-risk screening",question:"Who was eligible, offered an appropriate test and completed the indicated process?"},
      {id:"higher-risk",label:"Higher-risk screening or surveillance",question:"Was risk known early enough and was the applicable clinician-defined pathway followed?"},
      {id:"diagnostic",label:"Symptoms or abnormal-result evaluation",question:"Were concerning findings recognized and resolved appropriately, independent of routine screening age?"}
    ],
    workPackages:review.hypotheses.map(h=>({hypothesisId:h.id,proposedOwnerRole:h.ownerRole,assignmentState:"PROPOSED_UNASSIGNED" as const,
      exitEvidence:"Retain the discriminating test, contrary evidence, uncertainty and interaction assessment; record supported, contradicted or unresolved with independent review."})),
    openGapIds:review.gaps.map(g=>g.id),
    implementationCondition:"Evidence supporting a testable pathway gap or credible remediable mechanism can justify a comparative exploratory test, with uncertainty preserved and qualified oversight. Set resources, accepted ownership, eligible population, fidelity, stop rules and maintenance; do not treat permission to study as proof for routine rollout.",
    comparison:"Compare with competent current care. Select a suitable randomized or defensible quasi-experimental design; DiD or DDD requires its own identification assumptions, not only arithmetic.",
    benefitEvidence:"Appropriate resolution, patient health/function and burden, all-stage and late-stage incidence with suitable lag; harms, equity, capacity and incremental costs. Earlier diagnosis, more diagnoses or a stage shift alone cannot establish benefit because lead-time, length and stage-migration effects remain possible.",
    signalValidation:"Candidate earlier signals must precede the outcome without information leakage; qualify the instrument, validate externally for intended use and assess incremental net benefit before clinical deployment.",
    value:{
      users:"Clinical quality, registry, navigation and implementation teams",
      potentialBuyer:"Health-system or FQHC program owner; budget authority, demand and procurement unverified",
      beneficiaries:"People with missed prevention or delayed appropriate diagnosis",
      job:"Find the actual bottleneck, choose a justified change and test whether it improves this setting",
      currentOffering:"Research calibration and implementation-evaluation support; clinical operating benefit not established",
      proof:"Added benefit over the existing workflow relative to false positives, burden, staff time, inequity and incremental cost; willingness to pay and sustainable ownership still need testing"
    },
    interventionAuthorized:false as const,causalEffectEstablished:false as const,actualAssignmentsAccepted:false as const
  };
}

export function colorectalEvidenceAction(leads:readonly IntelligenceRecord[]=[]){
  const program=buildResearchProgram(jacksonCancerCase("colorectal"));
  const bridge=reviewEvidenceToAction(program,COLORECTAL_CROSSWALK,leads);
  const allStageGap=bridge.gaps.find(g=>g.id==="all-stage-incidence");
  if(allStageGap){
    allStageGap.problem="The legacy2018–2022 baseline has no accepted all-stage indicator. Source-matched2019–2023 all-stage rates are available in the calibrated supplement; an implementation-cohort baseline is not measured.";
    allStageGap.nextEvidence="Use the distinct2019–2023 source comparison and marginal strata without mixing vintages; obtain finer joint strata and time-aligned clinical/prevention histories for the mechanism and implementation question.";
  }
  // This curated case has no age/risk cohort or pre-outcome signal instrument.
  // Keep those obligations in the existing editable gap/task projection too.
  bridge.gaps.push(
    {id:"age-risk-pathways",severity:"RESEARCH_REQUIRED",
      problem:"Age-specific missed opportunities and interacting pathway mechanisms are not measured in this case.",
      ownerRole:"Registry scientist, clinical pathway lead and patient partners",
      nextEvidence:"Reconstruct age, stage, risk, eligibility and care history in separate screening, higher-risk and diagnostic cohorts; test age alongside interacting alternatives without presuming the answer."},
    {id:"early-signal-validation",severity:"RESEARCH_REQUIRED",
      problem:"No earlier signal or instrument has demonstrated incremental patient benefit for this intended use.",
      ownerRole:"Measurement scientist, clinical reviewer and implementation evaluator",
      nextEvidence:"Qualify pre-outcome measurement, avoid leakage, externally validate and compare benefit, harms, equity, workload and cost with competent current care before clinical implementation."}
  );
  return {program,bridge,decisionBrief:buildColorectalDecisionBrief(program,bridge),calibratedEvidence:getCalibrationSupplement(),crcMarginalEvidence:getCrcMarginals(),
    comparisonSites:COLORECTAL_COMPARISON_SITES};
}
