/**
 * DIS Research-to-Implementation programme — public aggregate evidence only.
 *
 * A reusable research question → population → measurement → competing
 * hypotheses → proposed strategies → validation and implementation contract.
 * No patient data, clinical advice, diagnosis, experimental efficacy claim,
 * causal attribution, autonomous action, or population-level imputation.
 */
export type EvidenceState="PUBLISHED_AGGREGATE"|"MODELED_ESTIMATE"|"SOURCE_CATALOG_ONLY"|"NOT_OBSERVED";
export type SiteKey="colorectal"|"breast"|"general";
export type PopulationFrame={
  targetName:string;
  analysisUnit:string;
  proxyUnit:string;
  proxyFips:string|null;
  equivalence:"NOT_ESTABLISHED";
  notes:string;
};
export type ResearchIndicator={
  id:string;label:string;site:SiteKey;
  value:number|null;unit:string;
  numeratorDefinition:string;denominatorDefinition:string;
  period:string;sourceUrl:string;sourceOwner:string;
  geography:string;
  evidenceState:EvidenceState;
  confidenceInterval?:[number,number];
  sourceLimit:string;
};
export type DataSource={
  id:string;name:string;url:string;owner:string;granularity:string;
  kind:EvidenceState;
  observationWindow:string;
  legitimateUse:string;
  prohibitedUse:string;
  connection:"CURATED_REFERENCE_ONLY"|"AUTHORIZED_EXCHANGE_NOT_CONNECTED";
};
export type PopulationStratum={
  id:string;dimension:string;comparison:string;
  availability:"MEASURED_IN_CASE_BASELINE"|"BREAKDOWN_NOT_YET_VERIFIED"|"REQUIRES_AUTHORIZED_DATA";
  neededFor:string;interpretationRisk:string;
};
export type DriverQuestion={
  id:string;label:string;hypothesis:string;
  discriminatingTest:string;competingExplanation:string;
  instrumentOrDataNeeded:string;
  evidenceState:"NOT_LOCALLY_TESTED";
  responsibleReviewers:string;
};
export type StrategyCandidate={
  id:string;name:string;whereInJourney:string;basis:"EVIDENCE_FOR_SCREENING_UPTAKE"|"CANDIDATE_TO_EVALUATE";
  sourceUrl:string;studyTarget:string;localEffect:"NOT_ESTABLISHED";
  measureToVerify:string;potentialHarm:string;
};
export type ImplementationStep={
  order:number;window:string;mission:string;
  accountableRole:string;measure:string;
  closureRequirement:string;
};
export type ResearchProgramSpec={
  id:string;question:string;site:SiteKey;population:PopulationFrame;
  problemDefinition:string;lastSourceCheck:string;
  indicators:ResearchIndicator[];dataSources:DataSource[];
  strata:PopulationStratum[];drivers:DriverQuestion[];
  strategies:StrategyCandidate[];
};
export type ProgramIssue={
  code:string;severity:"BLOCK_PROGRAM_CLAIM"|"RESEARCH_GAP";
  finding:string;nextEvidence:string;
};
export type ResearchProgram={
  schema:"dis-research-implementation-v1";
  caseId:string;question:string;site:SiteKey;
  population:PopulationFrame;
  status:"RESEARCH_DESIGN_NOT_FIELD_VALIDATED";
  sourceReviewStatus:"CURATED_PUBLIC_REFERENCES_NOT_LIVE_DATA_PIPELINE";
  claimsOfCityData:false;
  localCausalEffectsEstablished:false;
  individualDataProcessed:false;
  interventionAuthorized:false;
  sourceCount:number;indicators:ResearchIndicator[];
  dataSources:DataSource[];
  strata:PopulationStratum[];drivers:DriverQuestion[];
  strategies:StrategyCandidate[];
  issues:ProgramIssue[];
  pathway:{stage:string;processMeasure:string;denominator:string;owner:string}[];
  successMeasures:{role:"PRIMARY_DISTAL"|"IMPLEMENTATION_PROXIMAL"|"SAFETY_BALANCE";name:string;definition:string;cadence:string}[];
  stages:ImplementationStep[];
  comparisonDesign:string;
  interpretationGuardrails:string[];
};

const STAGES:ImplementationStep[]=[
  {order:1,window:"Days 0–30",mission:"Confirm site-specific case definition and catchment boundaries; audit published and local data availability, eligibility and diagnosis pathways.",
    accountableRole:"Registry epidemiologist + community health research lead",
    measure:"Validated evidence register, numerator/denominator, geography, time, suppression and data rights",
    closureRequirement:"Owner-signed measurement protocol; disclose unavailable demographic cells and inherited sampling bias"},
  {order:2,window:"Days 31–90",mission:"Partner with clinical and community organizations; study patient journeys and identify which delays or missed opportunities are actually occurring.",
    accountableRole:"Clinician + patient navigator + community co-investigator",
    measure:"Process map with documented screening, abnormal result, referral, diagnostic resolution and encounter denominators",
    closureRequirement:"Independent qualitative/quantitative triangulation, equity review, authorized data sharing and ranked hypotheses with uncertainty"},
  {order:3,window:"Days 91–180",mission:"Co-design a bounded, reversible intervention with a credible current-practice comparator and separate safety/implementation monitoring.",
    accountableRole:"Program implementation lead + clinical owner",
    measure:"Appropriate screening and diagnostic follow-up completion, time-to-resolution, navigation fidelity, burden and harms",
    closureRequirement:"Predefined study design, ethics/privacy decision, resources, training, counterfactual and prospective stop criteria"},
  {order:4,window:"Months 6–24+",mission:"Compare the intervention with competent existing care; reassess subgroup reach, access, diagnostic timeliness, cost and unintended effects.",
    accountableRole:"Independent evaluator + data custodian + community oversight",
    measure:"Prespecified patient pathway metrics now, registry-based site-specific stage distribution only after reporting lag",
    closureRequirement:"Unfavorable findings retained, cost/benefit and transferability assessed, named sustainment owner and post-success re-evaluation"}
];
const PATHWAY=[
  {stage:"At-risk population correctly defined",processMeasure:"Current eligibility/recommendation determined",denominator:"Population at risk with appropriate age/risk and site-specific guidance",owner:"Clinical and registry method reviewers"},
  {stage:"Relevant screening offered when appropriate",processMeasure:"Evidence-based screening offer recorded",denominator:"Eligible patients with accessible encounter",owner:"Primary-care clinical lead"},
  {stage:"Screening completed",processMeasure:"Appropriate test completed within target window",denominator:"Eligible individuals due for recommended screening",owner:"Screening coordinator"},
  {stage:"Abnormal finding communicated",processMeasure:"Result delivered and recorded within locally specified interval",denominator:"Abnormal results requiring action",owner:"Ordering clinical team"},
  {stage:"Diagnostic assessment resolved",processMeasure:"Definitive clinical follow-up or documented appropriate disposition",denominator:"Abnormal results requiring definitive follow-up",owner:"Clinical referral owner"},
  {stage:"Cancer diagnosed and staged",processMeasure:"Correct site-specific registry stage and diagnosis date",denominator:"Incident invasive cancers with reportable stage",owner:"Cancer registry"},
  {stage:"Beneficiary outcome maintained",processMeasure:"Safe, equitable completion and continuity",denominator:"Defined risk/screening/diagnostic cohort",owner:"Health system + public health + affected communities"}
] as const;
const SUCCESS=[
 {role:"PRIMARY_DISTAL" as const,name:"Late-stage diagnosis burden by cancer site",definition:"Age-adjusted late-stage incidence per 100,000 and late-stage share of incident cases; separate measures and denominators. Use properly lagged registry series; report uncertainty and suppressed cells.",cadence:"Annual or available multi-year registry window"},
 {role:"IMPLEMENTATION_PROXIMAL" as const,name:"Appropriate screening completion",definition:"Completed guideline-concordant screening / people eligible and due under a documented site-specific recommendation.",cadence:"Monthly or quarterly cohort"},
 {role:"IMPLEMENTATION_PROXIMAL" as const,name:"Abnormal-result diagnostic resolution",definition:"Abnormal screenings resolved by documented clinical follow-up / actionable abnormal screenings; disaggregate timeliness without inferring late-stage cancer benefit.",cadence:"Monthly with site-specific targets approved by clinicians"},
 {role:"IMPLEMENTATION_PROXIMAL" as const,name:"Time from abnormal result to documented diagnostic resolution",definition:"Distribution (median, upper percentile and missingness) of elapsed time for applicable clinical pathways; define starts, censoring and exclusions.",cadence:"Monthly/quarterly"},
 {role:"SAFETY_BALANCE" as const,name:"Inequity, burden and inappropriate intervention",definition:"Difference in completion/missingness between eligible groups; false flags, unnecessary procedures, harm, navigator workload, patient preferences and financial/resource burden.",cadence:"Continuous safety review, quarterly aggregate"}
];


const GENERIC_PATHWAY=[
  {stage:"Problem and affected stakeholders identified",processMeasure:"Problem observed, source and scope recorded",denominator:"Specified service/users/system population",owner:"Problem owner and affected representatives"},
  {stage:"Baseline process measured",processMeasure:"Valid process and outcome measures established",denominator:"Eligible observations under stated definition",owner:"Measurement and process owners"},
  {stage:"Competing causes examined",processMeasure:"Testable explanations and disconfirming observations recorded",denominator:"Defined cases, sites and relevant comparison observations",owner:"Independent method reviewer"},
  {stage:"Change co-designed and piloted",processMeasure:"Permitted intervention delivered with fidelity",denominator:"Approved pilot sites/users or operational units",owner:"Implementer and accountable stakeholder"},
  {stage:"Beneficiary outcome compared",processMeasure:"Actual result and balancing measures compared with competent baseline",denominator:"Predefined target population, observation window and comparator",owner:"Independent evaluator"},
  {stage:"Sustainment and adaptation",processMeasure:"Handoff, resourcing, monitoring and review recorded",denominator:"Applicable supported services/sites under actual authority",owner:"Long-term owner and successor"}
] as const;
const GENERIC_SUCCESS=[
  {role:"PRIMARY_DISTAL" as const,name:"Relevant beneficiary or system outcome",
    definition:"Choose a real, domain-specific end-state with a measured baseline, a valid outcome, a denominator and an appropriate comparator; not outputs or activity volume.",cadence:"Set based on process dynamics"},
  {role:"IMPLEMENTATION_PROXIMAL" as const,name:"Actual workflow completion and fidelity",
    definition:"Correct end-to-end task completion / eligible tasks; independently verify inputs, permissions, user experience, source and process version.",cadence:"Per meaningful operational period"},
  {role:"SAFETY_BALANCE" as const,name:"Distribution of harms, burdens and costs",
    definition:"Log adverse effects, exclusions, cost, added staff burden, reliability and equity with correctly matched populations and observation windows.",cadence:"Continuous monitoring and specified review"}
];
const GENERIC_STAGES:ImplementationStep[]=[
  {order:1,window:"Period set by discovery, not fixed",mission:"Define real outcome, affected people, current systems and original-source baseline.",accountableRole:"Mission and measurement owners",measure:"Source-verified problem and target population",closureRequirement:"Document authority, unknowns, source/measure fit, and discriminating tests"},
  {order:2,window:"After initial diagnosis",mission:"Invite affected stakeholders, examine macro/micro context and test plausible mechanisms.",accountableRole:"Research lead and independent reviewers",measure:"Observed causal hypotheses, context and alternatives",closureRequirement:"Preserve null evidence, source dependencies and contested explanations"},
  {order:3,window:"After fit and authority gates",mission:"Co-design a reversible, resourced pilot against competent current practice.",accountableRole:"Implementation owner",measure:"Operational fidelity, feasible comparator, human rights and safety",closureRequirement:"Rehearsed protocol, support, monitoring and stop triggers"},
  {order:4,window:"Outcome-relevant follow-up window",mission:"Measure, communicate, transfer and adapt with stakeholder oversight.",accountableRole:"Evaluation and successor owners",measure:"Actual user outcomes, unintended impacts, costs and sustainability",closureRequirement:"Evidence receipts, independent assessment and adaptation decision"}
];
const GENERIC_GUARDRAILS=[
  "A convenient metric or feature count is not automatically the actual beneficiary or system outcome.",
  "Macro, meso and micro indicators cannot be attributed to an individual, customer or team without appropriate unit-linked evidence.",
  "Time, place, cohort, population, instrument and system version must be compatible before comparison.",
  "Do not infer causal effect from correlated economic conditions, policy events or spatially neighboring measurements.",
  "Different contexts require re-examining mechanisms and outcomes before copying a previously successful intervention.",
  "A successful build, test pass or API response does not establish user benefit, authorization, sustained implementation or scientific validity.",
  "Public or aggregated sources, modeled data and lived experience have different evidence and consent requirements.",
  "Do not automatically assign stakeholders obligations, data access or procurement commitments; preserve the accountable human owner."
];

export function buildResearchProgram(spec:ResearchProgramSpec):ResearchProgram{
  const isCancerCase=spec.id.startsWith("jackson-ms-late-stage-");
  const issues:ProgramIssue[]=[];
  const add=(code:string,severity:ProgramIssue["severity"],finding:string,nextEvidence:string)=>{
    if(!issues.some(i=>i.code===code))issues.push({code,severity,finding,nextEvidence});
  };
  if(!spec.question.trim()||!spec.problemDefinition.trim())add("QUESTION_UNSPECIFIED","BLOCK_PROGRAM_CLAIM","A usable research question and intended phenomenon are not defined.","Clarify decision, population, beneficiary outcome, timeframe and legitimate owner.");
  if(spec.population.equivalence!=="NOT_ESTABLISHED")throw Error("The case must not silently equate a city with a county proxy.");
  if(spec.population.targetName!==spec.population.proxyUnit)
    add("GEOGRAPHY_PROXY_NOT_CITY","BLOCK_PROGRAM_CLAIM","The published county proxy is not a validated estimate for the target municipality or individual neighborhoods.","Establish exact target geography, residence-based registry boundaries and population denominator before any city-level statistic.");
  if(isCancerCase&&spec.site==="general")
    add("NO_UNIVERSAL_STAGE_RATE","BLOCK_PROGRAM_CLAIM","Cancer sites differ in stage definitions, screening pathways and population denominators.","Choose site-specific cancer outcomes and compare stage measures only within compatible case definitions.");
  if(!spec.indicators.length)add("NO_MEASURED_BASELINE","BLOCK_PROGRAM_CLAIM","No sourced population baseline is supplied.","Obtain official incidence/stage values for the exact site, geography, time and age/risk population, including suppression.");
  for(const metric of spec.indicators){
    if(metric.geography!==spec.population.proxyUnit)
      add("UNMATCHED_INDICATOR_GEOGRAPHY","BLOCK_PROGRAM_CLAIM","An indicator is labeled with a geography different from its declared analysis proxy.","Correct boundary, case residence and denominator before reporting it.");
    if(!metric.sourceUrl.startsWith("https://"))
      add("SOURCE_NOT_TRACEABLE","BLOCK_PROGRAM_CLAIM","An indicator lacks a public HTTPS source reference.","Inspect an authoritative original publication, data version and methods.");
    if(metric.value!==null&&(!Number.isFinite(metric.value)||metric.value<0))
      add("INVALID_MEASUREMENT","BLOCK_PROGRAM_CLAIM","An indicator contains an invalid numeric value.","Recheck the source and original numerator/denominator.");
    if(metric.unit==="percent"&&metric.value!==null&&metric.value>100)
      add("INVALID_PERCENT","BLOCK_PROGRAM_CLAIM","A percentage is outside its admissible measurement range.","Review case definition and source data.");
    if(!metric.period.trim()||!metric.numeratorDefinition.trim()||!metric.denominatorDefinition.trim())
      add("INCOMPLETE_MEASUREMENT_CONTRACT","BLOCK_PROGRAM_CLAIM","Indicator period, numerator or denominator is unspecified.","Inspect registry definitions and reference time.");
    if(metric.value===null)add("SUPPRESSED_OR_UNKNOWN_CELL","RESEARCH_GAP","At least one value has not been observed or is suppressed; missing does not mean zero.","Maintain suppression and seek appropriately authorized aggregate release rather than inventing population values.");
  }
  if(spec.strata.some(x=>x.availability!=="MEASURED_IN_CASE_BASELINE"))
    add("SUBGROUP_RATES_UNVERIFIED","RESEARCH_GAP","Some requested population breakdowns lack measured local rates and valid denominators.","Obtain appropriate aggregate stratification or approved data access, respecting small-cell suppression and ecological inference.");
  if(spec.drivers.length) add("DRIVERS_ARE_HYPOTHESES","RESEARCH_GAP",isCancerCase?"The listed contributors are hypotheses to investigate, not measured causes of late diagnosis in the named population.":"The listed contributors are untested explanations for the current local problem.","Run discriminating tests, assess counterexamples and mechanisms, and preserve competing explanations.");
  if(isCancerCase&&spec.strategies.length)add("SCREENING_EVIDENCE_NOT_STAGE_EFFECT","RESEARCH_GAP","General evidence for improving screening access does not by itself establish a reduction in local late-stage diagnoses.","Use a causal comparator for near-term care completion and lagged registry stage outcomes; monitor harms.");
  if(!spec.dataSources.some(x=>x.kind==="PUBLISHED_AGGREGATE"))add("OFFICIAL_SOURCE_MISSING","BLOCK_PROGRAM_CLAIM","No official measured population source is included.","Locate disease registry/statistics and verify classification, period and scope.");
  if(isCancerCase)add("NO_AUTHORIZED_PATIENT_DATA","RESEARCH_GAP","This public design has no patient-level EHR, clinical registry, follow-up, payer or navigator records.","Obtain explicit lawful approval and minimum necessary aggregate/secure query access before investigating specific patient pathways.");
  return {
    schema:"dis-research-implementation-v1",caseId:spec.id,question:spec.question,site:spec.site,
    population:spec.population,status:"RESEARCH_DESIGN_NOT_FIELD_VALIDATED",
    sourceReviewStatus:"CURATED_PUBLIC_REFERENCES_NOT_LIVE_DATA_PIPELINE",
    claimsOfCityData:false,localCausalEffectsEstablished:false,individualDataProcessed:false,interventionAuthorized:false,
    sourceCount:spec.dataSources.length,
    indicators:spec.indicators,dataSources:spec.dataSources,
    strata:spec.strata,drivers:spec.drivers,strategies:spec.strategies,issues,
    pathway:(isCancerCase?PATHWAY:GENERIC_PATHWAY).map(x=>({...x})),successMeasures:(isCancerCase?SUCCESS:GENERIC_SUCCESS).map(x=>({...x})),
    stages:(isCancerCase?STAGES:GENERIC_STAGES).map(x=>({...x})),
    comparisonDesign:isCancerCase?"Predefine cohort and outcome, then assess a feasible contemporaneous matched comparison, staggered pragmatic rollout, or authorized cluster assignment; address time trends, case mix, missingness, contamination, power, subgroup effects and cost. Descriptive pre/post is not causal proof.":"Define an outcome, baseline and estimand, choose an ethical matched, randomized, interrupted-time-series or other justified design; evaluate uncertainty, selection, incentives, context changes and unintended effects. Simple pre/post is not proof.",
    interpretationGuardrails:isCancerCase?[
      "City, county, metropolitan, ZIP and census-tract estimates must be mapped to original boundaries; do not relabel a Hinds County number as Jackson city.",
      "Every cancer site needs its own stage definition, eligibility frame, original source methods, and separately validated clinical outcome; a site-specific effect must not be inferred from another cancer.",
      "Late-stage incidence and percentage of incident cancers diagnosed late are not interchangeable denominators.",
      "Breast, colorectal, cervical, prostate and lung cancers differ in screening eligibility, diagnostic pathways and stage definitions; never pool by convenience.",
      "A modeled PLACES screening estimate is not a directly observed screening count and is not suitable for detecting the effect of a local intervention.",
      "Published small-cell suppression cannot be reversed by disaggregating or reconstructing identifiable records.",
      "Clinical eligibility and diagnostic action remain with authorized professionals; this system provides no patient-specific recommendations.",
      "Potential determinants (access, transportation, insurance, symptoms, clinician timing, biology, test quality) are hypotheses until independently assessed.",
      "No intervention is declared locally effective solely because it appears in a recommended evidence-based strategy list.",
      "A stage shift may lag intervention and be affected by screening intensity, lead-time, overdiagnosis, case mix, survival/registry completeness and secular trends.",
      "Do not claim improved health outcomes until appropriate comparative data and independent review exist."
    ]:GENERIC_GUARDRAILS
  };
}
