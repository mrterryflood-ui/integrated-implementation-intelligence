/**
 * DIS temporal stewardship: the day AFTER adoption, success, or failure.
 *
 * This module is a scenario-rehearsal contract. It does NOT observe actual
 * outcomes, measure effectiveness, validate cause, make clinical decisions,
 * implement a change or authorize scaling. The intervention's hypothesized
 * core function must survive a locally validated adaptation; success must
 * create a renewed ownership/maintenance obligation rather than auto-SCALE.
 */
import type {ResearchProgram} from "./research-program";

export type OutcomePath="NOT_TESTED"|"FAILURE"|"PARTIAL_SUCCESS"|"SUCCESS"|"UNINTENDED_HARM";
export type ScenarioRehearsal={
  path:OutcomePath;
  scenario:"HYPOTHETICAL_NOT_AN_OBSERVED_RESULT";
  leadingQuestions:string[];
  earlySignals:string[];
  alternativeExplanations:string[];
  responsesToTest:string[];
  evidenceRequired:string[];
  responsibleRoles:string[];
  automaticConclusion:false;
  automaticScale:false;
};
export type LongitudinalTrigger={
  id:string;timeHorizon:string;
  question:string;
  evidenceInstrument:string;
  actionIfConcern:string;
  ownerRole:string;
  observed:false;
};
export type CoreFidelityContract={
  candidateEbi:string;
  proposedCoreFunction:string;
  coreFunctionValidated:false;
  invariantHypotheses:string[];
  adaptableForms:string[];
  prohibitedInference:string;
  changeControl:{
    whatChanged:string;
    why:string;
    whoAuthorized:string;
    when:string;
    expectedMechanism:string;
    intendedAndUnintendedEffects:string[];
    evidenceBeforeAfter:string;
    nextRetest:string;
  };
  changeExecuted:false;
};
export type SustainmentAssurance={
  schemaVersion:"dis-dynamic-stewardship-v1";
  caseId:string;
  primaryOutcome:string;
  observationWindow:"NOT_AUTHORIZED_OR_VERIFIED";
  actualResult:"NOT_OBSERVED";
  cases:ScenarioRehearsal[];
  triggers:LongitudinalTrigger[];
  coreFidelity:CoreFidelityContract;
  systemIntersections:string[];
  ownerQuestions:string[];
  sourceIndependentOutcomeVerified:false;
  downstreamEffectsObserved:false;
  approvedSustainmentBudget:false;
  accountableSuccessorConfirmed:false;
  automaticRetirementAuthorized:false;
  scaleAuthorized:false;
  nextGate:"OWNER_REVIEW_AND_VALIDATED_MEASUREMENT";
  learningCycle:"ORIENT_AUDIT_MAP_GAP_ALIGN_ACT_TRACK_ADAPT_SHARE_REMAP";
};

const r=(path:OutcomePath,leadingQuestions:string[],earlySignals:string[],alternativeExplanations:string[],
  responsesToTest:string[],evidenceRequired:string[],responsibleRoles:string[]):ScenarioRehearsal=>({
  path,scenario:"HYPOTHETICAL_NOT_AN_OBSERVED_RESULT",leadingQuestions,earlySignals,alternativeExplanations,
  responsesToTest,evidenceRequired,responsibleRoles,automaticConclusion:false,automaticScale:false
});
const t=(id:string,timeHorizon:string,question:string,evidenceInstrument:string,actionIfConcern:string,ownerRole:string):LongitudinalTrigger=>({
  id,timeHorizon,question,evidenceInstrument,actionIfConcern,ownerRole,observed:false
});
export function buildLongitudinalAssurance(program:ResearchProgram):SustainmentAssurance{
  const candidate=program.strategies[0];
  const outcome=program.successMeasures.find(x=>x.role==="PRIMARY_DISTAL")?.name||"Undeclared beneficiary outcome";
  const isCancer=program.caseId.startsWith("jackson-ms-late-stage-");
  const core:CoreFidelityContract={
    candidateEbi:candidate?.name||"No intervention chosen",
    proposedCoreFunction:candidate?.studyTarget||"Core mechanism has not been articulated",
    coreFunctionValidated:false,
    invariantHypotheses:[
      "The intervention reaches the appropriately defined beneficiaries without excluding those with high need.",
      "The mechanism linking delivery to the intended beneficiary outcome remains theoretically and empirically supported.",
      "Clinical, policy, human decision rights, consent and safety remain within the authorized local system.",
      "Relevant fidelity, source validity, adverse effects and inequity are measured before deciding to continue or expand."
    ],
    adaptableForms:[
      "Language, communication channel, schedule, location, staff workflow and partner interface, if local evidence permits.",
      "Resourcing, delivery dose, training and handoff may change only with recorded reason, risk and tests.",
      "The program's goal and core function may need revising when the original phenomenon, population or values change."
    ],
    prohibitedInference:"A successful process metric, source report, cross-site pilot, or declared adherence never proves the invariant core function or beneficiary benefit.",
    changeControl:{
      whatChanged:"NOT_RECORDED",why:"NOT_RECORDED",whoAuthorized:"NOT_RECORDED",
      when:"NOT_RECORDED",expectedMechanism:"NOT_ESTABLISHED",
      intendedAndUnintendedEffects:[],evidenceBeforeAfter:"NOT_OBSERVED",nextRetest:"NOT_SCHEDULED"
    },
    changeExecuted:false
  };
  const cases:ScenarioRehearsal[]=[
    r("NOT_TESTED",
      ["Is the question, population and counterfactual valid before implementation?","What results would count as success, failure, harm or acceptable uncertainty?"],
      ["Missing site-level baseline, unclear source identity, absent outcome denominator or unconfirmed implementation authority"],
      ["No instrument, wrong time horizon, invalid hypothesis, wrong intervention, missing stakeholder or partner"],
      ["Protect established care/service; confirm STELLAR 1 and context; preregister bounded pilot and review authority"],
      ["Source and metric registry","Stakeholder and governance review","Core-mechanism and comparator protocol"],
      ["Mission sponsor","Community co-investigator","Independent methods reviewer"]),
    r("FAILURE",
      ["Did the intervention fail to reach people, fail to activate the mechanism, or fail to affect the actual outcome?",
       "Was the comparison valid and did the instrument measure what we meant?"],
      ["Observed outcome below a prespecified decision threshold","Fidelity or reach deteriorates","Costs and burdens exceed approved constraints"],
      ["Implementation error","EBI-site mismatch","Wrong causal model","External event or secular trend","Data coding change"],
      ["Preserve essential services; trace failures in reach, implementation and outcomes separately",
       "Compare remedial adaptation with reversing, deimplementing or stopping the tested form",
       "Revisit the mission if observed problems or beneficiary priorities changed"],
      ["Valid comparator and actual measured outcome","Dose/fidelity/process evidence","Qualitative community/worker evidence",
       "Costs, harms and alternate explanation tests"],
      ["Implementation owner","Affected people","Independent evaluator","Clinical or domain owner"]),
    r("PARTIAL_SUCCESS",
      ["Who benefited and who was excluded or harmed?","Which subgroups, facilities, times or processes did not improve?",
       "Were apparent gains due to different denominators, selection or changed surveillance?"],
      ["Overall average improved but subgroup gaps persist","Some process outcomes improve without distal beneficiary outcome",
       "Inconsistent fidelity across delivery locations"],
      ["Heterogeneous exposure","Unmeasured context","Proxy/denominator artifact","Subgroup overlap and sampling noise"],
      ["Investigate differential mechanisms with legitimate denominators and privacy controls",
       "Adapt only the locally failing delivery form and preserve plausible core function",
       "Reevaluate reach, equity, acceptability, burden and cost before expansion"],
      ["Subgroup effect and uncertainty","Site case mix and instrument validity","Documented adaptations, effect-modifier tests",
       "Independent patient or user experience"],
      ["Community stakeholders","Site implementation lead","Statistician/epidemiologist"]),
    r("SUCCESS",
      ["What happens tomorrow when demand, staffing, funding or institutional incentives change?",
       "Can the mechanism and actual benefit endure beyond the initial pilot and champion?",
       "Would scale-up change the original system and alter its measurements or benefits?"],
      ["Increased demand strains capacity","Champions leave or funding ends","Different cases and service sites enter the denominator",
       "Early process metrics stabilize while harms or long-term outcomes remain unknown"],
      ["Temporary novelty or special pilot staffing","Selection or regression to mean","Changed case definitions",
       "Demand saturation","Unrecognized downstream resource dependencies"],
      ["Secure successor owner, capacity and sustainable funding before declaring the program institutionalized",
       "Rehearse surge, turnover and partner-loss scenarios; maintain core function and safeguards",
       "Recalibrate instruments as the delivery ecosystem changes; test against ongoing capable practice",
       "Approve new-site scaling only after separate context, mechanism, cost, equity and harm review"],
      ["Independent effect and long-term outcome estimates","Funding, succession, staffing and continuity evidence",
       "Change logs, distribution of gains and harms","Destination-specific transportability tests"],
      ["Executive sponsor and successor","Community oversight","Implementation and evaluation leads","Finance and operations"]),
    r("UNINTENDED_HARM",
      ["Did the intervention cause or amplify harm, exclusion, delay or displacement of other services?",
       "What must be preserved while we prevent additional exposure?"],
      ["Safety/quality signals exceed agreed limits","Some groups face new access barriers",
       "Staff or facilities divert critical capacity","Privacy, trust or data-quality harms emerge"],
      ["Confounding source/system event","Implementation drift","Bad metric","Mechanism-mediated harm",
       "Vulnerable population not included in the original design"],
      ["Follow the authorized safety/incident protocol immediately; a research hold is not permission to delay protective action",
       "Stop, reverse or contain the risky intervention through the responsible authority",
       "Reassess causes, affected populations, safe alternatives and longitudinal harms before restarting"],
      ["Independent adverse-event verification","Source timestamps and comparator","Human incident review",
       "Revised clinical/operational and community oversight acceptance"],
      ["Safety authority","Affected participants","Institutional owner","Independent reviewer"])
  ];
  const triggers=[
    t("NEXT_DAY","The day after apparent achievement",
      "Who owns the service now, what demand changes, and what protection is lost if the champion disappears?",
      "Owner handoff, staffing, budget, actual delivered service and user impact receipts",
      "Do not equate pilot completion with sustainability; assign accountable successor and continuity actions.",
      "Institutional sponsor and successor"),
    t("SHORT_TERM","Early operational periods (locally determined)",
      "Did the change actually reach the eligible population, work as designed, and avoid displaced service or added harm?",
      "Valid reach/uptake, fidelity, incident review and unintended effects",
      "Test corrective action or reverse unsafe delivery under authorized governance.",
      "Local implementation and quality owners"),
    t("MID_TERM","Repeated review across months / service cycles",
      "Do implementation outcomes persist after initial attention or external project funding ends?",
      "Comparable post-pilot cohorts, reliability and staff turnover, cost and source drift",
      "Reassess budgets, mechanisms, adaptations and continuation criteria.",
      "Finance/program and independent evaluation owners"),
    t("LONG_TERM","Outcome-relevant annual or multi-year window",
      "Did the downstream beneficiary outcome actually improve without bias, overdiagnosis or inequity?",
      isCancer?"Lagged cancer registry population-based late-stage incidence and mortality; matched clinical outcomes":
        "Mission-specific validated beneficiary outcomes, comparison and harms",
      "Revise the goal, discontinue ineffective components or expand only with genuine comparative evidence.",
      "Independent outcome evaluator and beneficiaries"),
    t("SUCCESSOR_FUTURE","Successor and next-ten-year horizon",
      "If conditions and institutions change, does the original mission still solve the right problem?",
      "New stakeholder values, technology/instrument change, population, cost, service ecosystem and policy",
      "Run STELLAR 1 again; adapt core and forms only on mechanism/authority evidence, then revalidate.",
      "Accountable successor and independent community governance")
  ];
  return {
    schemaVersion:"dis-dynamic-stewardship-v1",caseId:program.caseId,primaryOutcome:outcome,
    observationWindow:"NOT_AUTHORIZED_OR_VERIFIED",actualResult:"NOT_OBSERVED",
    cases,triggers,coreFidelity:core,
    systemIntersections:[
      "A change in reach or demand may move bottlenecks downstream into diagnosis, staffing, equipment or other services.",
      "Payment, policy and reporting incentives may change which indicators are documented and how actors behave.",
      "Partner systems may share data, staff or original measurements; multiple dashboards are not independent confirmation.",
      "Success may change demographics or exposure, making the original comparator, instrument or threshold invalid.",
      "Parallel services may compete for capacity even without an observed direct causal relationship."
    ],
    ownerQuestions:[
      "Which role can legally approve, stop, reverse or retire the intervention?",
      "Who must maintain fidelity, quality, privacy, follow-up and reporting after the original delivery team leaves?",
      "Which funding, staffing, training, source interfaces and referral capacity persist without extraordinary pilot support?",
      "What changes in stakeholder needs, technology, population, context or policy require redesign rather than optimization?",
      "What evidence would disconfirm that the initial success remains meaningful and worth sustaining?"
    ],
    sourceIndependentOutcomeVerified:false,downstreamEffectsObserved:false,
    approvedSustainmentBudget:false,accountableSuccessorConfirmed:false,
    automaticRetirementAuthorized:false,scaleAuthorized:false,
    nextGate:"OWNER_REVIEW_AND_VALIDATED_MEASUREMENT",
    learningCycle:"ORIENT_AUDIT_MAP_GAP_ALIGN_ACT_TRACK_ADAPT_SHARE_REMAP"
  };
}


/**
 * Evidence-aware checkpoint interrogation. A submitted observation is a
 * DECLARATION until independently verified by the owning institution.
 * This routine never concludes the intervention caused a benefit or harm,
 * and never issues public, clinical or operational instructions.
 */
export type CheckpointMeasure={
  id:string;
  role:"BENEFICIARY_OUTCOME"|"IMPLEMENTATION_FIDELITY"|"REACH"|"BALANCING_HARM"|"COST"|"OTHER";
  construct:string;unit:string;population:string;
  baseline:number|null;observed:number|null;
  denominator:number|null;
  /** Balancing-measure direction must be independently specified, not inferred from the number. */
  higherMeansWorse?:boolean;
  sourceId:string;originalLineage:string;
  observedAt:string;receivedAt:string;
  comparator:string|null;
  definitionVersion:string;
  limitations:string[];
};
export type CheckpointEvidence={
  caseId:string;asOf:string;
  reportedPath:OutcomePath;
  measures:CheckpointMeasure[];
  proposedAdaptation?:{
    coreFunctionAffected:boolean;
    whatChanges:string;
    reason:string;
    owner:string;
    reviewAfter:string;
  };
  ownerConfirmed:boolean;
  successorConfirmed:boolean;
  resourcingConfirmed:boolean;
  stakeholderParticipationConfirmed:boolean;
  outcomeIndependentReviewConfirmed:boolean;
  adverseEffectsReviewed:boolean;
  environmentChanged:boolean;
  destinationTransferRequested:boolean;
};
export type CheckpointResult={
  schemaVersion:"dis-longitudinal-checkpoint-v1";
  caseId:string;
  reportedPath:OutcomePath;
  finding:"SAFETY_REVIEW_URGENT"|"EVIDENCE_INSUFFICIENT"|"HUMAN_ADJUDICATION_REQUIRED";
  evidenceStatus:"DECLARATIONS_NOT_INDEPENDENTLY_VERIFIED";
  causalBenefitEstablished:false;
  realPilotValidated:false;
  scaleAuthorized:false;
  adaptationExecuted:false;
  clinicalActionAuthorized:false;
  reviewIssues:{code:string;explanation:string;requiredProof:string}[];
  scenarioActions:string[];
  recommendedNextReview:"OWNER_MUST_SET_EVIDENCE_VALID_WINDOW";
  comparisonWithPriorCheckpoint:"NOT_AVAILABLE_WITHOUT_SIGNED_PREVIOUS_SNAPSHOT";
};
const checkedTime=(s:string)=>/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/i.test(s)
  ?Date.parse(s):NaN;
export function reviewLongitudinalCheckpoint(program:ResearchProgram,input:CheckpointEvidence):CheckpointResult{
  const issues:CheckpointResult["reviewIssues"]=[];
  const add=(code:string,explanation:string,requiredProof:string)=>{
    if(!issues.some(x=>x.code===code))issues.push({code,explanation,requiredProof});
  };
  if(input.caseId!==program.caseId)add("CASE_MISMATCH","Checkpoint references another research case.","Match the source case ID, population and baseline protocol.");
  const asOf=checkedTime(input.asOf);
  if(!Number.isFinite(asOf))add("DECISION_TIME_INVALID","Decision time is invalid or missing timezone.","Use original recorded as-of time with explicit timezone.");
  if(input.measures.length===0)add("NO_ACTUAL_MEASURES","No numeric outcome or implementation observations were supplied.","Identify the correct original measurement instruments, population, denominator and validation.");
  if(input.measures.length>40)add("MEASUREMENT_CAP_EXCEEDED","Only a bounded subset may be inspected per checkpoint.","Split the period into versioned, owner-reviewed evidence batches.");
  const lineage=new Map<string,string[]>();
  const ids=new Set<string>();
  for(const m of input.measures.slice(0,40)){
    if(!m.id||ids.has(m.id))add("MEASURE_ID_DUPLICATED","Measurement identifiers are missing or duplicated.","Assign distinct source-bound observation IDs.");
    ids.add(m.id);
    const original=m.originalLineage.trim();
    if(!original||!m.sourceId.trim())add("PROVENANCE_MISSING","Instrument or original source lineage is not defined.","Identify original owner, instrument, independent error sources and rights.");
    else lineage.set(original,[...(lineage.get(original)||[]),m.id]);
    if(!m.construct.trim()||!m.unit.trim()||!m.population.trim()||!m.definitionVersion.trim())
      add("INSTRUMENT_UNSPECIFIED","Construct, unit, population or definition version is not specified.","Verify original measurement and definition changes before comparison.");
    if(m.baseline===null||m.observed===null||!Number.isFinite(m.baseline)||!Number.isFinite(m.observed))
      add("OUTCOME_NOT_MEASURED","Baseline and observed results are absent or invalid.","Report real observed and baseline values with uncertainty, never treat missing as zero.");
    if(m.denominator!==null&&(!Number.isFinite(m.denominator)||m.denominator<=0))
      add("DENOMINATOR_INVALID","Denominator is zero or invalid.","Confirm actual eligible or relevant observation population.");
    if(m.limitations.length===0)add("LIMITATIONS_NOT_APPRAISED","Instrument limitations or errors have not been declared.","Review validity, range, error and missingness with the instrument owner.");
    const event=checkedTime(m.observedAt),receipt=checkedTime(m.receivedAt);
    if(!Number.isFinite(event)||!Number.isFinite(receipt)||!Number.isFinite(asOf))
      add("TIMESTAMP_UNVERIFIED","Measurement/receipt times are missing or invalid.","Check event, receipt, as-of time and source clock separately.");
    else if(event>receipt||receipt>asOf)
      add("TIME_ORDER_INVALID","A future observation, retroactive receipt or clock conflict was detected.","Reconstruct what was knowable when the decision was made.");
    if(m.role==="BALANCING_HARM"&&m.higherMeansWorse===undefined)
      add("BALANCING_DIRECTION_UNSPECIFIED","Harm metric direction has not been defined; no direction of benefit or harm may be inferred.","Prespecify construct, harmful direction, clinical/operational threshold and measurement range.");
    if((m.role==="BENEFICIARY_OUTCOME"||m.role==="BALANCING_HARM")&&!m.comparator?.trim())
      add("NO_COUNTERFACTUAL","A declared beneficiary result lacks a comparison or counterfactual.","Use a defensible comparator and causal design; pre/post alone does not establish effect.");
  }
  if([...lineage.values()].some(x=>x.length>1))
    add("SHARED_SOURCE_LINEAGE","Some records share an original source; they are not independent confirmations.","Trace original publishers, instruments, cohorts and correlated errors.");
  if(!input.measures.some(m=>m.role==="BENEFICIARY_OUTCOME"))
    add("BENEFICIARY_OUTCOME_ABSENT","Only process or surrogate indicators were supplied.","Measure the actual intended beneficiary outcome using a valid population/period.");
  if(!input.measures.some(m=>m.role==="IMPLEMENTATION_FIDELITY"))
    add("FIDELITY_UNMEASURED","Core function and delivery fidelity were not measured.","Evaluate whether the intervention mechanism was delivered, at what dose and quality.");
  if(!input.adverseEffectsReviewed)
    add("HARMS_UNREVIEWED","Adverse or displaced downstream effects were not evaluated.","Independent safety, community, equity and burden review is required.");
  if(!input.ownerConfirmed||!input.successorConfirmed||!input.resourcingConfirmed)
    add("SUCCESS_STEWARDSHIP_UNCONFIRMED","Original and successor accountability or ongoing capacity is not confirmed.","Name and obtain acceptance from successor, budget owner and operational steward.");
  if(!input.stakeholderParticipationConfirmed)
    add("EXPERIENCED_REALITY_MISSING","Actual affected-user participation has not been documented.","Document consented stakeholder engagement, differences and dissent.");
  if(!input.outcomeIndependentReviewConfirmed)
    add("RESULT_NOT_INDEPENDENTLY_REVIEWED","A declared result was not independently adjudicated.","Obtain study-specific independent evaluation; report negative and unintended effects.");
  if(input.environmentChanged)
    add("ENVIRONMENT_CHANGED","Conditions changed since the original program frame.","Re-run STELLAR 1, MAP-GAP, instrument fit and stakeholder/authority review.");
  if(input.destinationTransferRequested)
    add("TRANSFER_REASSESSMENT_REQUIRED","Destination replication requested; source-site effects do not transfer automatically.","Evaluate local population, mechanism, resources, data, harms, clinical authority and suitable pilot.");
  if(input.proposedAdaptation){
    const a=input.proposedAdaptation;
    if(!a.whatChanges.trim()||!a.reason.trim()||!a.owner.trim()||!a.reviewAfter.trim())
      add("ADAPTATION_CONTRACT_INCOMPLETE","Proposed change has no sufficient owner, mechanism, reason or retest trigger.","Record what changed, why, who approved, fidelity risks and next measurement.");
    if(a.coreFunctionAffected)
      add("CORE_FUNCTION_REVALIDATION","A proposed change affects the hypothesized intervention core function.","Stop automatic adoption and seek independent causal/mechanism and safety reassessment.");
  }
  const safety=input.reportedPath==="UNINTENDED_HARM"||input.measures.some(m=>m.role==="BALANCING_HARM"&&m.higherMeansWorse===true&&m.observed!==null&&m.baseline!==null&&m.observed>m.baseline);
  if(safety)add("SAFETY_SIGNAL_REQUIRES_HUMAN","A potential harm is reported; the model cannot diagnose causality or delay existing response.","Escalate immediately to appropriate authorized clinical, agency or operational safety personnel.");
  const scenario=buildLongitudinalAssurance(program).cases.find(x=>x.path===input.reportedPath);
  return{
    schemaVersion:"dis-longitudinal-checkpoint-v1",caseId:program.caseId,
    reportedPath:input.reportedPath,
    finding:safety?"SAFETY_REVIEW_URGENT":issues.length?"EVIDENCE_INSUFFICIENT":"HUMAN_ADJUDICATION_REQUIRED",
    evidenceStatus:"DECLARATIONS_NOT_INDEPENDENTLY_VERIFIED",
    causalBenefitEstablished:false,realPilotValidated:false,scaleAuthorized:false,
    adaptationExecuted:false,clinicalActionAuthorized:false,
    reviewIssues:issues,
    scenarioActions:scenario?.responsesToTest||[],
    recommendedNextReview:"OWNER_MUST_SET_EVIDENCE_VALID_WINDOW",
    comparisonWithPriorCheckpoint:"NOT_AVAILABLE_WITHOUT_SIGNED_PREVIOUS_SNAPSHOT"
  };
}
