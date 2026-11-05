/**
 * DIS decision assurance — research-stage, deterministic evidence preflight.
 * This is NOT a diagnostic instrument, prediction model, causal estimator,
 * clinical/safety decision system, or permission to act.
 *
 * The checks flag *declared* incompatibilities and missing evidence; they
 * cannot prove source independence, measurement validity, or current truth.
 */
export type ObservationKind = "MEASURED" | "SOURCE_REPORTED" | "SCENARIO" | "PERSONA";
export type EvidenceObservation = {
  id: string;
  label: string;
  origin: string;
  construct: string;
  unit: string;
  scope: string;
  observedAt: string;
  receivedAt: string;
  kind: ObservationKind;
  validated?: boolean;
  maxAgeMinutes?: number;
};
export type Comparison = {
  ids: string[];
  intent: "CORROBORATE" | "POOL" | "TRANSFER" | "LATEST_CLAIM";
  claimedIndependent?: boolean;
  claimedScope?: string;
};
export type DecisionPacket = {
  id: string;
  title: string;
  question: string;
  goal: string;
  asOf: string;
  observations: EvidenceObservation[];
  comparison?: Comparison;
  decision?: { implementationHours: number; warningHoursMin: number; warningHoursMax: number };
  outcome?: {
    processMetricAsOutcome?: boolean;
    interventionChangedIndicator?: boolean;
    physicalOutcomeVerified?: boolean;
    denominatorDefinitionChanged?: boolean;
    coreFunctionRemoved?: boolean;
    beneficiaryOutcomeMeasured?: boolean;
    metricTargetIncentive?: boolean;
    codingRulesChanged?: boolean;
  };
  stewardship?: {
    milestoneReached?: boolean;
    accountableOwner?: string;
    sustainedResources?: boolean;
    fidelityPlan?: boolean;
  };
  objective?: {
    contextChanged?: boolean;
    stakeholderPreferencesChanged?: boolean;
    reviewed?: boolean;
  };
  informationValue?: {
    claimedNumber?: number;
    alternativesSpecified?: boolean;
    utilitiesSpecified?: boolean;
    uncertaintySpecified?: boolean;
    studyDesignSpecified?: boolean;
    delayCostSpecified?: boolean;
  };
};
export type Finding = {
  code: string;
  severity: "HOLD" | "REVIEW";
  title: string;
  explanation: string;
  nextStep: string;
};
export type Lens = {
  id: string;
  label: string;
  question: string;
  evidenceState: "ANALYTICAL_PROMPT_NOT_TESTIMONY";
};
export type ObservationReview = {
  id: string;
  ageMinutes: number | null;
  freshness: "WITHIN_DECLARED_WINDOW" | "EXCEEDS_DECLARED_WINDOW" | "NOT_ASSESSED";
  kind: ObservationKind;
};
export type DecisionAudit = {
  schemaVersion: "dis-decision-assurance-research-v1";
  state: "HOLD_UNSUPPORTED_CLAIM" | "HUMAN_REVIEW_REQUIRED";
  findings: Finding[];
  observations: ObservationReview[];
  distinctDeclaredOrigins: number;
  lenses: Lens[];
  temporalReview: string[];
  actionAuthorized: false;
  scientificValidation: "NOT_ESTABLISHED";
};

export const LENSES: readonly Lens[] = [
  {id:"measurement",label:"Measurement scientist",question:"Are the construct, instrument, unit, reference frame and calibration appropriate for this exact question?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"history",label:"Historical investigator",question:"What was known at the time, which definitions changed, and which conclusions would be hindsight bias?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"causal",label:"Causal inference reviewer",question:"Could source dependence, confounding, selection or altered measurement explain the reported pattern?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"systems",label:"Systems and feedback analyst",question:"How might observing or acting on this measure change the behavior and data of the system?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"implementation",label:"Implementation scientist",question:"Can this action actually be delivered with enough lead time, fidelity, resources and accountability?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"economics",label:"Decision economist",question:"What are the costs of action, delay, further information, reversibility and missed consequences?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"stakeholder",label:"Affected-community reviewer",question:"Whose goals, observations, risks, perspectives or unequal burdens have been excluded?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
  {id:"stewardship",label:"Future steward",question:"What changes after success, who inherits the obligations, and when should the original objective be retired?",evidenceState:"ANALYTICAL_PROMPT_NOT_TESTIMONY"},
];

const validTime = (v: string): number | null => {
  if (!v || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i.test(v)) return null;
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : null;
};
const normalized = (s: string): string => s.trim().toLowerCase();

export function auditDecisionPacket(p: DecisionPacket): DecisionAudit {
  const findings: Finding[] = [];
  const added = new Set<string>();
  const add = (code: string,severity: Finding["severity"],title: string,explanation: string,nextStep: string) => {
    if (added.has(code)) return;
    added.add(code);findings.push({code,severity,title,explanation,nextStep});
  };
  const now = validTime(p.asOf);
  if (now === null) add("DECISION_TIME_UNVERIFIED","HOLD","Decision time cannot be verified","Supply a complete timestamp with an explicit offset or Z.","Record decision-as-of time and time zone before making temporal claims.");
  const identifiers = new Set<string>();
  const reviews: ObservationReview[] = [];
  for (const o of p.observations) {
    if (!o.id || identifiers.has(o.id)) add("OBSERVATION_ID_INVALID","HOLD","Observation identity ambiguous","Every observation must have a distinct, nonblank identifier.","Correct identities before associating or comparing data.");
    identifiers.add(o.id);
    if (![o.origin,o.construct,o.unit,o.scope].every(value=>typeof value==="string" && value.trim().length>0))
      add("EVIDENCE_METADATA_MISSING","HOLD","Essential evidence metadata absent","Origin, construct, unit and scope are required to interpret a comparison.","Describe the phenomenon and its source before drawing conclusions.");
    const observed = validTime(o.observedAt), received = validTime(o.receivedAt);
    if (observed === null || received === null) add("OBSERVATION_TIME_UNVERIFIED","HOLD","Observation times need verification","An observation or receipt time is missing or invalid.","Record when measured and when received with compatible clocks.");
    if (observed !== null && received !== null && observed > received) add("TIMESTAMP_ORDER_INVALID","HOLD","Timestamps conflict","Receipt precedes the claimed observation time.","Check clock synchronization and source timestamps.");
    if (now !== null && observed !== null && observed > now) add("FUTURE_OBSERVATION","HOLD","Observation postdates decision","Information acquired after decision time cannot be contemporaneous evidence.","Correct the time or exclude the observation from the original decision.");
    if (now !== null && received !== null && received > now) add("NOT_AVAILABLE_AT_DECISION","HOLD","Evidence arrived after the decision","Later evidence cannot justify an earlier decision retrospectively.","Preserve the decision's original evidence state.");
    const ageMinutes=now !== null && observed !== null && observed <= now ? (now-observed)/60000 : null;
    const window=typeof o.maxAgeMinutes==="number" && Number.isFinite(o.maxAgeMinutes) && o.maxAgeMinutes>=0?o.maxAgeMinutes:null;
    const freshness: ObservationReview["freshness"]=ageMinutes===null||window===null?"NOT_ASSESSED":ageMinutes>window?"EXCEEDS_DECLARED_WINDOW":"WITHIN_DECLARED_WINDOW";
    if (freshness==="EXCEEDS_DECLARED_WINDOW") add("STALE_FOR_DECISION","HOLD","Evidence exceeds its declared validity window","An observation is older than its explicitly defined fit-for-purpose limit.","Seek an updated observation or justify a new window with domain evidence.");
    reviews.push({id:o.id,ageMinutes,freshness,kind:o.kind});
  }
  const byId=new Map<string,EvidenceObservation>(p.observations.map(x=>[x.id,x] as const));
  const observations = p.comparison ? p.comparison.ids.map(id=>byId.get(id)).filter((v):v is EvidenceObservation=>v!==undefined):[];
  if (p.comparison) {
    if (p.comparison.intent!=="LATEST_CLAIM" && observations.length<2) add("INSUFFICIENT_COMPARISON","HOLD","Not enough compatible inputs","A comparison or corroboration claim requires at least two observations.","Acquire an appropriate additional source or present one source without corroboration.");
    if (observations.length !== p.comparison.ids.length || observations.length === 0) add("COMPARISON_INPUT_MISSING","HOLD","Comparison inputs incomplete","Some requested observation identifiers are missing.","Reconcile the source records before any derived comparison.");
    const constructs = new Set(observations.map(o=>normalized(o.construct)));
    const units = new Set(observations.map(o=>normalized(o.unit)));
    const scopes = new Set(observations.map(o=>normalized(o.scope)));
    const origins = new Set(observations.map(o=>normalized(o.origin)));
    if (observations.some(o=>o.kind==="PERSONA" || o.kind==="SCENARIO"))
      add("PERSPECTIVE_NOT_OBSERVATION","HOLD","Scenarios and personas are not measurements","Hypothetical lenses cannot independently verify an observed condition.","Keep hypotheses and real observations in separate evidence classes.");
    if (p.comparison.intent==="POOL") {
      if (constructs.size>1) add("INCOMPATIBLE_CONSTRUCTS","HOLD","Different constructs cannot be averaged","A numerical combination of unlike phenomena has no validated interpretation.","Keep constructs separate or document and validate a new measurement model.");
      if (units.size>1) add("INCOMPATIBLE_UNITS","HOLD","Units cannot be pooled as stated","Different units cannot be arithmetically averaged without a justified transformation.","Select a fit-for-purpose transformation or report each measure separately.");
    }
    if (p.comparison.intent==="POOL" || p.comparison.intent==="CORROBORATE" || p.comparison.intent==="TRANSFER") {
      if (scopes.size>1) add("SCOPE_ALIGNMENT_UNVERIFIED","HOLD","Geographic or population scopes differ","The records do not establish that observations describe the same place or population.","Validate entity association and coordinate or population alignment.");
      if (origins.size<observations.length) {
        const severity: Finding["severity"]=p.comparison.claimedIndependent?"HOLD":"REVIEW";
        add("SHARED_PROVENANCE",severity,"Sources are not independent confirmations","Several displays reuse a declared source origin; counting displays overstates corroboration.","Trace independent measurements and identify shared sensor, data or calibration lineage.");
      }
      if (observations.some(o=>o.validated!==true)) add("MEASUREMENT_VALIDITY_UNVERIFIED","REVIEW","Instrument validation is unverified","At least one input lacks a fit-for-use validation record.","Check calibration, study design, measurement uncertainty and intended scope.");
    }
    if (p.comparison.intent==="LATEST_CLAIM" && !p.comparison.claimedScope?.trim())
      add("CLAIM_SCOPE_UNSPECIFIED","REVIEW","Current-state location not established","A latest-state claim has no declared target scope.","Identify the actual location or population of the claim.");
    if (p.comparison.intent==="LATEST_CLAIM" && p.comparison.claimedScope &&
        observations.some(o=>normalized(o.scope)!==normalized(p.comparison!.claimedScope!)))
      add("SCOPE_MISATTRIBUTION","HOLD","Observation assigned to the wrong scope","A report relabels an observation from another place or population as current local evidence.","Separate measurement location from the destination display or narrative.");
    if (p.comparison.intent==="LATEST_CLAIM" &&
        observations.some(o=>o.observedAt!==o.receivedAt))
      add("ARRIVAL_IS_NOT_MEASUREMENT_TIME","REVIEW","Receipt time is not observation time","The latest delivered message is not necessarily the latest measured condition.","Compare observation-generation times and sources, not delivery order alone.");
  }
  if (p.decision) {
    const a=p.decision;
    if (![a.implementationHours,a.warningHoursMin,a.warningHoursMax].every(x=>Number.isFinite(x)&&x>=0)||a.warningHoursMin>a.warningHoursMax)
      add("LEAD_TIME_INPUT_INVALID","HOLD","Action timing inconsistent","Implementation and warning intervals require nonnegative coherent quantities.","Check the planning assumptions before a trigger decision.");
    else if (a.warningHoursMax<a.implementationHours)
      add("TRIGGER_TOO_LATE","HOLD","Warning cannot support the planned action","Even the longest modeled warning is shorter than the required implementation time.","Reassess earlier signposts, faster options, or authorized contingencies; test against scenarios.");
    else if (a.warningHoursMin<a.implementationHours)
      add("TRIGGER_LEAD_TIME_UNCERTAIN","REVIEW","Trigger may not leave enough time","Part of the possible warning interval is shorter than implementation lead time.","Test false alarms, missed events and implementability over plausible scenarios.");
  }
  if (p.outcome) {
    const o=p.outcome;
    if (o.denominatorDefinitionChanged) add("DENOMINATOR_BREAK","HOLD","Longitudinal denominators differ","A revised eligibility or coding definition prevents an unqualified like-for-like outcome claim.","Bridge or restate the series using comparable definitions and groups.");
    if (o.interventionChangedIndicator) add("MEASUREMENT_REACTIVITY","REVIEW","The intervention may change the indicator","A decision can change behavior or reporting independently of the target physical or social outcome.","Measure the intended outcome separately and examine feedback and selection effects.");
    if (o.processMetricAsOutcome && !o.beneficiaryOutcomeMeasured)
      add("PROXY_NOT_OUTCOME","HOLD","Activity is not demonstrated outcome","An activity, attendance, referral or volume count does not establish benefit.","Separate reach/process indicators from verified outcomes and possible harms.");
    if (o.coreFunctionRemoved && !o.beneficiaryOutcomeMeasured)
      add("CORE_FUNCTION_UNTESTED","HOLD","Core mechanism changed without outcome evidence","Improved uptake cannot establish benefit when a core function was removed.","Evaluate fidelity, causal pathway and unintended consequences before claiming improvement.");
    if (o.metricTargetIncentive || o.codingRulesChanged)
      add("METRIC_INCENTIVE_SHIFT","REVIEW","Measurement incentives or definitions changed","Reward and coding changes may modify reporting or behavior independently of beneficiary outcomes.","Audit source definitions, incentives, independent outcomes and potential gaming.");
    if (o.interventionChangedIndicator && !o.physicalOutcomeVerified)
      add("PHYSICAL_OUTCOME_UNVERIFIED","REVIEW","Observed proxy movement is not target change","The relevant independent condition was not demonstrated to improve.","Obtain fit-for-purpose direct measurement of the target condition.");
  }
  if (p.stewardship?.milestoneReached &&
      (!p.stewardship.accountableOwner || !p.stewardship.sustainedResources || !p.stewardship.fidelityPlan))
    add("SUCCESS_NOT_SUSTAINMENT","HOLD","Milestone is not sustained impact","Achievement lacks confirmed ownership, future resources or fidelity monitoring.","Assign accountable owner, renewal capacity, follow-up assessment and an exit/transition path.");
  if (p.objective && (p.objective.contextChanged || p.objective.stakeholderPreferencesChanged) && !p.objective.reviewed)
    add("REOPEN_OBJECTIVE","HOLD","Original objective needs explicit reconsideration","Changed circumstances or stakeholder priorities may invalidate the original success metric.","Conduct an authorized goal and values review before optimizing the old target.");
  if (p.informationValue && p.informationValue.claimedNumber!==undefined) {
    const v=p.informationValue;
    if (![v.alternativesSpecified,v.utilitiesSpecified,v.uncertaintySpecified,v.studyDesignSpecified,v.delayCostSpecified].every(Boolean))
      add("UNSUPPORTED_INFORMATION_VALUE","HOLD","Value-of-information claim is unsupported","A numeric expected research value requires stated options, consequences, probability model, study design and relevant costs of delay.","Treat the value as unverified and compare study, pilot, delay and reversal options.");
  }
  if (p.observations.length===0)
    add("NO_OBSERVED_EVIDENCE","HOLD","No observational evidence supplied","The request may be a useful hypothesis, but it has no current measured source.","Define the decision question and acquire suitable authorized evidence.");
  const independentPrompts=LENSES.map(x=>({...x}));
  return {
    schemaVersion:"dis-decision-assurance-research-v1",
    state:findings.some(f=>f.severity==="HOLD")?"HOLD_UNSUPPORTED_CLAIM":"HUMAN_REVIEW_REQUIRED",
    findings, observations:reviews,
    distinctDeclaredOrigins:new Set(p.observations.filter(o=>o.kind==="MEASURED"||o.kind==="SOURCE_REPORTED").map(o=>normalized(o.origin))).size,
    lenses:independentPrompts,
    temporalReview:[
      "Ten years ago: what evidence, assumptions or unresolved obligations created this condition?",
      "Today: is the phenomenon correctly described, measured and within the instrument's valid operating context?",
      "The day after success: what new risks, capabilities, resources, owners and exit paths exist?",
      "Ten years forward: what could successors challenge, and what observations would require revising the objective?"
    ],
    actionAuthorized:false,
    scientificValidation:"NOT_ESTABLISHED"
  };
}
