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
