/**
 * DIS INQUIRE v0.1 — method validation, not answer selection.
 *
 * Purpose: teach a reproducible way to investigate claims, select appropriate
 * measurements, challenge causal interpretations, and decide whether an
 * intervention evaluation is supportable. Never prescribes a lab, diagnosis,
 * treatment, policy action, or investigation result.
 *
 * No personal records, network operations, AI calls or data storage. All
 * inputs are source-reported declarations; "validated" is not inferred from a
 * user claim. The output NEVER certifies a clinical or research conclusion.
 */
export type EvidenceKind =
  "MEASUREMENT"|"STUDY_REPORT"|"MODEL_OUTPUT"|"EXPERIENCE"|"SCENARIO"|"PERSONA_PROMPT";
export type ClaimKind =
  "DESCRIPTIVE"|"MECHANISTIC"|"ASSOCIATIONAL"|"PREDICTIVE"|"CAUSAL"|"INTERVENTION_EFFECT";
export type Hypothesis = {
  id:string;
  explanation:string;
  predictedObservations:string[];
  disconfirmingObservations:string[];
  alternativesConsidered:string[];
};
export type InstrumentRecord = {
  id:string;name:string;construct:string;unit:string;
  intendedScope:string;limitation:string;
  sourceId:string;originalLineage:string;kind:EvidenceKind;
  observedAt:string|null;retrievedAt:string|null;
  validationEvidence:string|null;
  fitForUseJustification:string|null;
};
export type StudyEvidence = {
  id:string;claim:string;kind:ClaimKind;
  instrumentIds:string[];
  targetOutcome:string;
  referencePopulation:string;
  comparison?:string|null;
  causalIdentification?:string|null;
  targetBenefitMeasured?:boolean;
  uncertaintyReported?:boolean;
  externalValidation?:string|null;
};
export type Inquiry = {
  id:string;decisionAsOf:string;question:string;
  intendedUse:string;decisionOwner:string;
  targetPopulation:string;targetOutcome:string;
  systemContext:string;
  hypotheses:Hypothesis[];
  instruments:InstrumentRecord[];
  evidence:StudyEvidence[];
  proposedDecision?:{
    action:string;options:string[];
    currentPracticeComparator:string|null;
    potentialHarms:string[];
    measureOfSuccess:string|null;
    futureOwner:string|null;
    reviewOrStopTrigger:string|null;
  };
};
export type MethodDomain =
  "QUESTION"|"EXPLANATIONS"|"INSTRUMENTS"|"PROVENANCE"|
  "CAUSALITY"|"DECISION"|"SUSTAINMENT"|"GENERALIZABILITY";
export type MethodFinding = {
  id:string;
  domain:MethodDomain;
  level:"HOLD_INFERENCE"|"INVESTIGATE";
  relatedIds:string[];
  finding:string;
  nextQuestion:string;
};
export type MethodAssessment = {
  version:"dis-inquire-method-v0.1";
  state:"NOT_READY_FOR_CLAIM"|"METHOD_REVIEW_REQUIRED";
  findings:MethodFinding[];
  lenses:readonly string[];
  methodologicalQuestions:readonly string[];
  evidenceLevels:{
    sourceReportsAreUnverified:true;
    mechanismsAreNotClinicalEffects:true;
    documentChecksAreNotIndependentValidation:true;
    noUniversalConfidenceScore:true;
    actionAuthorized:false;
    clinicalRecommendationAuthorized:false;
    studyEffectEstablished:false;
  };
};

const isTime=(s:string|null):number|null=>{
  if(!s||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(s))return null;
  const v=Date.parse(s);return Number.isFinite(v)?v:null;
};
const norm=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ");
export const METHOD_QUESTIONS=Object.freeze([
  "What exact decision and beneficiary outcome are at stake, and what would change if the answer were different?",
  "Which explanations could produce the same observation, including measurement error, selection, confounding, reporting incentives, or system feedback?",
  "For each candidate explanation, what distinct observation would support it—and what would refute it?",
  "What does each instrument truly measure? What important parts of the phenomenon does it leave unmeasured?",
  "Are the samples, population, units, time window and reference standard fit for the intended use?",
  "Do observations share a publisher, original instrument, study cohort, or model? Where are uncertainties correlated?",
  "Does the evidence show a mechanism, an association, a prediction, a causal effect, or a patient/beneficiary outcome?",
  "What comparator, study design, uncertainty analysis and independent replication are necessary before claiming improvement?",
  "Who could be harmed or excluded, how would the system respond to the intervention, and when must the conclusion be re-examined?",
  "What must be owned, resourced, verified, maintained, adapted, or stopped the day after the initial objective is achieved?"
] as const);
export const DIS_METHOD_LENSES=Object.freeze([
  "Construct validity and metrology (fit-for-purpose measurement)",
  "Causal inference and counterfactual alternatives",
  "Study design, bias, uncertainty, replication, and external validity",
  "System feedback, incentives and measurement reactivity",
  "Stakeholders, equity, context and lived experience",
  "Human implementation authority and temporal stewardship"
] as const);

export function investigateMethod(input:Inquiry):MethodAssessment{
  const findings:MethodFinding[]=[];
  const push=(id:string,domain:MethodDomain,level:MethodFinding["level"],relatedIds:string[],finding:string,nextQuestion:string)=>{
    if(!findings.some(f=>f.id===id))findings.push({id,domain,level,relatedIds:[...new Set(relatedIds)],finding,nextQuestion});
  };
  const decisionTime=isTime(input.decisionAsOf);
  if(decisionTime===null)push("AS_OF_INVALID","PROVENANCE","HOLD_INFERENCE",[],
    "The decision's as-of time is absent, invalid or missing an explicit time-zone offset.",
    "At what exact moment must the evidence have been knowable?");
  for(const [id,value] of [
    ["QUESTION_UNCLEAR",input.question],["PURPOSE_UNCLEAR",input.intendedUse],
    ["OWNER_UNCLEAR",input.decisionOwner],["TARGET_POPULATION_UNCLEAR",input.targetPopulation],
    ["OUTCOME_UNCLEAR",input.targetOutcome],["CONTEXT_UNCLEAR",input.systemContext]
  ] as const)if(!value?.trim())push(id,"QUESTION","INVESTIGATE",[],
    "An essential part of the inquiry's intended use, context, decision ownership or measured end state is unspecified.",
    "Who needs this answer, for what decision, under what conditions, and what outcome would matter?");
  if(!input.hypotheses.length)push("NO_ALTERNATIVE_EXPLANATIONS","EXPLANATIONS","INVESTIGATE",[],
    "The inquiry does not enumerate plausible competing explanations.",
    "What else—including bias, measurement change and natural variation—could generate these observations?");
  for(const h of input.hypotheses){
    if(!h.explanation.trim()||!h.predictedObservations.length)
      push("HYPOTHESIS_NOT_TESTABLE","EXPLANATIONS","INVESTIGATE",[h.id],
        "An explanation lacks an explicit, observable prediction.",
        "If this explanation were true, what would an independent observer expect to find?");
    if(!h.disconfirmingObservations.length)push("NO_FALSIFIER","EXPLANATIONS","INVESTIGATE",[h.id],
      "No observation that could seriously challenge the favored explanation is recorded.",
      "What finding would make us revise or abandon this explanation?");
    if(!h.alternativesConsidered.length)push("ONE_STORY_ONLY","EXPLANATIONS","INVESTIGATE",[h.id],
      "Only one explanatory story is being assessed without competing models.",
      "What other account is compatible with the observed data?");
  }
  if(input.instruments.length===0)push("INSTRUMENT_SELECTION_NOT_EXPLAINED","INSTRUMENTS","INVESTIGATE",[],
    "No instrument or evidence source has been specified.",
    "Which phenomena need measuring, and which available instruments can validly measure each?");
  const instruments=new Map<string,InstrumentRecord>();
  const lineage=new Map<string,string[]>();
  const constructs=new Map<string,string[]>();
  for(const i of input.instruments){
    if(!i.id||instruments.has(i.id))push("INSTRUMENT_ID_CONFLICT","PROVENANCE","HOLD_INFERENCE",[i.id],
      "Instrument record IDs are missing or repeated.",
      "Which primary record is each claim actually based on?");
    instruments.set(i.id,i);
    if(!i.construct.trim()||!i.unit.trim()||!i.intendedScope.trim())
      push("CONSTRUCT_SCOPE_UNKNOWN","INSTRUMENTS","INVESTIGATE",[i.id],
        "A measurement construct, unit or intended population is unspecified.",
        "What phenomenon, units and setting does the instrument actually measure?");
    if(!i.limitation.trim()||!i.fitForUseJustification?.trim()||!i.validationEvidence?.trim())
      push("INSTRUMENT_FIT_UNSUPPORTED","INSTRUMENTS","INVESTIGATE",[i.id],
        "A declared instrument has no adequate description of limitations, validation or fitness for this question.",
        "What independent calibration/validation evidence shows that this instrument is suitable for this particular question?");
    if(!i.sourceId.trim()||!i.originalLineage.trim())
      push("ORIGIN_UNVERIFIED","PROVENANCE","INVESTIGATE",[i.id],
        "The original measurement/publisher lineage is not identifiable.",
        "Which original instrument, dataset or study cohort produced the observation?");
    if(i.originalLineage.trim()){
      const key=norm(i.originalLineage);lineage.set(key,[...(lineage.get(key)||[]),i.id]);
    }
    if(i.construct.trim()){
      const key=norm(i.construct);constructs.set(key,[...(constructs.get(key)||[]),i.id]);
    }
    const at=isTime(i.observedAt),retrieved=isTime(i.retrievedAt);
    if(at===null||retrieved===null)
      push("TIME_LINEAGE_UNRESOLVED","PROVENANCE","INVESTIGATE",[i.id],
        "Observation and retrieval times cannot both be checked with explicit time zones.",
        "When did the event actually occur, when was it published, and when was it first available to this decision?");
    if(at!==null&&retrieved!==null&&at>retrieved)
      push("TIME_SEQUENCE_CONTRADICTS","PROVENANCE","HOLD_INFERENCE",[i.id],
        "The claimed event time is later than retrieval, requiring reconciliation.",
        "Are publisher clocks, time zones or data labels inconsistent?");
    if(decisionTime!==null&&retrieved!==null&&retrieved>decisionTime)
      push("NOT_KNOWN_AT_DECISION","PROVENANCE","HOLD_INFERENCE",[i.id],
        "This record arrived after the decision-as-of time.",
        "Would this conclusion have been supportable without using future information?");
  }
  for(const ids of lineage.values())if(ids.length>1)push("REUSED_ORIGINAL_LINEAGE","PROVENANCE","HOLD_INFERENCE",ids,
    "Multiple records share declared original lineage; they cannot be counted as independent corroboration.",
    "Which readings or study cohorts are genuinely independent, and what shared errors remain?");
  if(constructs.size>1)push("MULTIPLE_CONSTRUCTS","INSTRUMENTS","INVESTIGATE",input.instruments.map(x=>x.id),
    "The evidence describes distinct constructs, not automatically interchangeable readings of one phenomenon.",
    "How are the constructs related theoretically, and why would each change the decision?");
  const ids=new Set(input.instruments.map(i=>i.id));
  for(const evidence of input.evidence){
    if(!evidence.instrumentIds.length||evidence.instrumentIds.some(id=>!ids.has(id)))
      push("EVIDENCE_LINK_MISSING","PROVENANCE","HOLD_INFERENCE",[evidence.id],
        "A claim is not traceable to the included instrument/source records.",
        "Which original record and method support the precise proposition?");
    if(!evidence.targetOutcome.trim()||!evidence.referencePopulation.trim())
      push("OUTCOME_OR_POPULATION_UNSPECIFIED","GENERALIZABILITY","INVESTIGATE",[evidence.id],
        "The study's endpoint or population is not sufficiently identified.",
        "Who was studied, for what actual endpoint, and does it transfer to the intended users?");
    const isEffect=evidence.kind==="CAUSAL"||evidence.kind==="INTERVENTION_EFFECT";
    if(isEffect&&(!evidence.comparison?.trim()||!evidence.causalIdentification?.trim()))
      push("CAUSAL_CLAIM_NO_COUNTERFACTUAL","CAUSALITY","HOLD_INFERENCE",[evidence.id],
        "A causal claim lacks a defensible comparison and explanation of identification assumptions.",
        "Compared with what? What design makes other explanations less plausible, and how are confounding and selection addressed?");
    if(evidence.kind==="MECHANISTIC"&&evidence.targetBenefitMeasured===true)
      push("MECHANISM_VERSUS_OUTCOME","CAUSALITY","INVESTIGATE",[evidence.id],
        "The claim labels mechanistic evidence as a measured beneficial outcome; these require separate adjudication.",
        "Was the intended real-world outcome directly measured in an appropriate comparison, or only an intermediate pathway?");
    if(evidence.kind==="INTERVENTION_EFFECT"&&evidence.targetBenefitMeasured!==true)
      push("BENEFIT_NOT_MEASURED","CAUSALITY","HOLD_INFERENCE",[evidence.id],
        "An effect on a proxy, mechanism or laboratory indicator is not evidence of the intended beneficiary benefit.",
        "What independently assessed, meaningful beneficiary outcome was measured, with what comparator and time horizon?");
    if(evidence.kind==="PREDICTIVE"&&!evidence.externalValidation?.trim())
      push("TRANSPORT_UNVERIFIED","GENERALIZABILITY","INVESTIGATE",[evidence.id],
        "A prediction claim lacks documented external validation in the target setting.",
        "How was performance calibrated and checked outside development data and across affected populations?");
    if(evidence.uncertaintyReported!==true)
      push("UNCERTAINTY_NOT_REPORTED","CAUSALITY","INVESTIGATE",[evidence.id],
        "No uncertainty appraisal accompanies this evidence claim.",
        "What assumptions, measurement error, confidence/credible intervals, or qualitative limitations bound this finding?");
  }
  if(input.proposedDecision){
    const d=input.proposedDecision;
    if(!d.options?.length||!d.currentPracticeComparator?.trim())
      push("DECISION_ALTERNATIVES_MISSING","DECISION","INVESTIGATE",[],
        "A proposed action has no explicit current-practice comparator or alternative actions.",
        "What would competent existing practice do, and what is the reversible/no-action alternative?");
    if(!d.potentialHarms?.length||!d.measureOfSuccess?.trim())
      push("DOWNSTREAM_EFFECTS_UNBOUNDED","DECISION","INVESTIGATE",[],
        "The intended benefit, tradeoffs or potential harms are not defined.",
        "Who could be worse off, and what observable outcome would distinguish improvement from apparent progress?");
    if(!d.futureOwner?.trim()||!d.reviewOrStopTrigger?.trim())
      push("DAY_AFTER_SUCCESS_UNPLANNED","SUSTAINMENT","INVESTIGATE",[],
        "A post-success accountable owner or review/retirement trigger is not named.",
        "Who owns upkeep, recalibration and adverse effects after the initial target is achieved—and when should the goal change?");
  }else push("NO_DECISION_CONTRACT","DECISION","INVESTIGATE",[],
    "The question is not yet linked to a concrete decision and comparator.",
    "What would we actually do differently if evidence changed, compared with competent current practice?");
  const fatal=findings.some(x=>x.level==="HOLD_INFERENCE");
  return {
    version:"dis-inquire-method-v0.1",
    state:fatal?"NOT_READY_FOR_CLAIM":"METHOD_REVIEW_REQUIRED",
    findings,lenses:DIS_METHOD_LENSES,methodologicalQuestions:METHOD_QUESTIONS,
    evidenceLevels:{
      sourceReportsAreUnverified:true,mechanismsAreNotClinicalEffects:true,
      documentChecksAreNotIndependentValidation:true,noUniversalConfidenceScore:true,
      actionAuthorized:false,clinicalRecommendationAuthorized:false,studyEffectEstablished:false
    }
  };
}
