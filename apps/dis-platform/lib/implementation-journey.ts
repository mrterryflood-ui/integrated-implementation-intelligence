/**
 * DIS Research → Implementation → Learning orchestration (bounded local engine).
 * Stage gates are REQUIRED EVIDENCE/OWNERSHIP CONDITIONS, not an invented
 * execution or human approval event. All displayed completion remains
 * NOT_VERIFIED until separately witnessed and approved.
 *
 * A published EBI is neither a proven causal explanation for a site's
 * problem nor automatically portable to a second geography.
 */
import type {ResearchProgram,StrategyCandidate} from "./research-program";

export type WorkflowPhase=
  "ORIENT"|"EVIDENCE"|"POPULATION"|"CAUSES"|"COMMUNITY"|"SALP"|
  "EBI_FIT"|"LOGIC"|"GOVERNANCE"|"PLAN"|"PILOT"|"IMPLEMENT"|
  "MONITOR"|"EVALUATE"|"ADAPT"|"COMMUNICATE"|"TRANSLATE"|
  "SCALE"|"SUSTAIN";
export type EvidenceGate={
  id:string;question:string;artifact:string;ownerRole:string;
  acceptance:string;reviewerRole:string;verifiedOutsideSystem:false;
};
export type WorkflowNode={
  id:WorkflowPhase;title:string;intent:string;why:string;
  outputs:string[];gates:EvidenceGate[];
  status:"NOT_EXECUTED_EVIDENCE_REQUIRED";
  claimOfCompletion:false;actionAuthorized:false;
};
export type SALPModel={
  method:"SYSTEMIC_ANCHORS_AND_LEVERAGE_POINTS";
  establishedInterpretation:"Systemic Anchors and Leverage Points (SALP)";
  rPliceSequence:readonly ["Recognize","Position","Leverage","Integrate","Consolidate"];
  identifiedAnchors:string[];leverageQuestions:string[];
  powerAndIncentiveQuestions:string[];fidelityMeasures:string[];
  forecastAnalytics:"PROPOSED_NOT_VALIDATED";
  mechanismsVerified:false;authorityRequired:true;
};
export type SmartObjective={
  id:string;
  specific:string;measurable:string;achievable:"REQUIRES_LOCAL_RESOURCE_AND_BASELINE_CHECK";
  relevant:string;timeBound:"TO_BE_SET_AFTER_MEASUREMENT_AND_STAKEHOLDER_AGREEMENT";
  baseline:"NOT_VERIFIED_FOR_TARGET_SITE";
  target:"NOT_PRESET";
  sourceAndDenominator:string;ownerRole:string;
  balancingMeasure:string;
};
export type LogicModel={
  assumptions:string[];inputs:string[];activities:string[];
  outputs:string[];shortTerm:string[];intermediate:string[];
  longTerm:string[];unintendedEffects:string[];
  smartObjectives:SmartObjective[];
};
export type SiteTransferCheck={
  dimension:string;jacksonEvidence:string;destinationEvidence:string;
  state:"UNVERIFIED_IN_DESTINATION";requiredComparison:string;
};
export type TransportabilityReview={
  sourceSite:string;destinationSite:string;
  candidateEbi:string;originalCoreFunction:string;
  adaptableDeliveryForms:string[];
  tests:SiteTransferCheck[];
  decision:"HOLD_PENDING_LOCAL_ADAPTATION_AND_VALIDATION";
  automaticReplicationAuthorized:false;
  exactCopiedInterventionIsEvidenceBasedForDestination:false;
  localEffectsKnown:false;
  reviewerSignoffObtained:false;
  recommendation:string;
};
export type FullImplementationFlow={
  schemaVersion:"dis-implementation-journey-v1";
  caseId:string;question:string;site:string;
  researchState:"DRAFT_DESIGN_WITH_GAPS";
  currentRecommendedPhase:WorkflowPhase;
  nodes:WorkflowNode[];
  systemicModel:SALPModel;logicModel:LogicModel;
  crossSiteTransport:TransportabilityReview;
  communicationTracks:{audience:string;purpose:string;feedback:string;approval:"NOT_OBTAINED"}[];
  collaborationRoles:{role:string;responsibility:string;participationState:"NOT_CONFIRMED"}[];
  learningLoop:string[];
  acceptance:{
    stagesActuallyCompleted:0;independentOutcomeVerified:false;
    localCausalEffectsEstablished:false;realPilotExecuted:false;
    partnersCommitted:false;patientDataProcessed:false;
    externalCommunicationAuthorized:false;scaleAuthorized:false
  };
  nextActions:{action:string;ownerRole:string;proofNeeded:string}[];
};
const g=(id:string,question:string,artifact:string,ownerRole:string,acceptance:string,reviewerRole:string):EvidenceGate=>({
  id,question,artifact,ownerRole,acceptance,reviewerRole,verifiedOutsideSystem:false
});
const step=(id:WorkflowPhase,title:string,intent:string,why:string,outputs:string[],gates:EvidenceGate[]):WorkflowNode=>({
  id,title,intent,why,outputs,gates,status:"NOT_EXECUTED_EVIDENCE_REQUIRED",claimOfCompletion:false,actionAuthorized:false
});
export const PHASE_TITLES:Record<WorkflowPhase,string>={
 ORIENT:"Problem, mission and end state",EVIDENCE:"Research and critical evidence",
 POPULATION:"Population, context and equity map",CAUSES:"Competing causes and measurement",
 COMMUNITY:"Co-design, participation and engagement",SALP:"SALP systems anchors and leverage",
 EBI_FIT:"EBI relevance, mechanisms and local fit",LOGIC:"SMART logic model and theory of change",
 GOVERNANCE:"Ethics, authority, safety and data rights",PLAN:"Implementation, resources and rehearsal",
 PILOT:"Pilot design and baseline comparison",IMPLEMENT:"Supervised pilot execution",
 MONITOR:"Fidelity, reach, burden and safety monitoring",EVALUATE:"Outcomes, counterfactual and learning",
 ADAPT:"Adapt delivery while checking core function",COMMUNICATE:"Communications and coordination",
 TRANSLATE:"Knowledge translation and usable practice",SCALE:"Cross-site replication and transportability",
 SUSTAIN:"Sustain, hand off and re-map"
};
const requirements:Record<WorkflowPhase,EvidenceGate[]>={
 ORIENT:[g("MISSION","What decision, problem, place, users and unintended risks matter?","Problem charter and observed baseline","Mission sponsor","Verified scope, beneficiary and outcome plus documented alternatives","Community and evaluation leads")],
 EVIDENCE:[g("APPRAISAL","Which original studies, contrary findings and source limitations apply?","Critical evidence register with risk of bias","Evidence reviewer","Original source methods inspected; not just search counts or vendor abstracts","Independent methodology reviewer")],
 POPULATION:[g("STRATA","Who is in the actual population and which denominators are appropriate?","Geospatial and subgroup availability map","Epidemiologist","Case definitions, suppression, inclusion, geography, demographic gaps documented","Registry and community representatives")],
 CAUSES:[g("FALSIFIERS","Which alternative causes and unobserved mechanisms could explain the problem?","DAG/hypotheses and discriminating tests","Research scientist","Testable contrasts, instruments, source lineage, unknowns and falsification conditions","Independent causal and measurement reviewer")],
 COMMUNITY:[g("PARTICIPATION","Who is affected, who decides, and what do people actually experience?","Stakeholder and power map, engagement/consent plan","Community co-investigator","Affected community feedback, accessibility, authority and lived-experience discrepancies reviewed","Community advisory representatives")],
 SALP:[g("ANCHORS","Which structures resist change and which leverage point can alter the relevant pathway?","SALP anchor/leverage/power map and RPLICE sequence","Systems analyst","Anchor evidence, power/incentive effects, minimal intervention and drift/fidelity measures defined","Community and implementation reviewers")],
 EBI_FIT:[g("MECHANISM","Does the EBI address a measured determinant here, not just an eligible disease?","EBI mechanism, fit and adaptation matrix","Implementation scientist","Population fit, mechanism, core function, competing strategies and local capacity tested","Clinical/implementation co-review")],
 LOGIC:[g("LOGIC","How do resources and activities plausibly yield specific outcomes?","SMART logic model with denominators and adverse indicators","Evaluation lead","Testable theory of change, baseline, feasible target, measurement interval and unknowns explicit","Independent evaluator")],
 GOVERNANCE:[g("GOVERN","Do ethics, permissions, safety, data rights and consent permit this intervention?","IRB/quality and privacy determination with authorized owner","Institutional owner","Applicable approvals actually obtained; no inferred PHI/data rights","Institutional privacy/clinical authority")],
 PLAN:[g("RESOURCE","Who will deliver, at what cost, with what training, referral capacity and fallback?","Implementation plan, RACI, costs, rehearsal and stop conditions","Program director","Delivery capacity, budget and responsibilities documented, alternative and contingency rehearsed","Local delivery partners")],
 PILOT:[g("PROTOCOL","What comparable controls and prospective targets will test improvement?","Pilot protocol and preregistered analysis plan as applicable","Evaluation scientist","Comparator, assignment, sample/precision, adjudicator, harm and missing-data rules locked","Independent evaluation panel")],
 IMPLEMENT:[g("EXECUTE","Did the real site actually deliver intervention within authorization and fidelity?","Actual pilot launch and implementation receipts","Local implementation owner","Site, actual participants (with lawful access), delivery dates, consent, authorization and test receipts","Operational/site sponsor")],
 MONITOR:[g("MEASURE","How are actual exposure, reach, fidelity and harms changing?","Versioned measurement register and alert/response ledger","Quality improvement lead","Valid denominators, source times, adverse effects, subgroup and missing-data review","Safety and data-quality oversight")],
 EVALUATE:[g("RESULTS","What real benefit, harm and uncertainty were observed versus competent care?","Independent analysis and signed outcome report","Independent evaluator","Effect estimates/qualitative results with bias, equity, cost and limits; null findings retained","Qualified independent evaluator")],
 ADAPT:[g("ADAPTATION","Did adaptation preserve the causal core and acceptable risk?","Core-function/form change log and local re-test","Implementation adaptation owner","Reason, actor, change type, fidelity, unanticipated effects and explicit approval","Method and community reviewers")],
 COMMUNICATE:[g("COMMUNICATION","Who must receive what information, when, in what language, and acknowledge it?","Stakeholder communications and feedback plan","Communications lead","Authorized messages, comprehension/accessibility, correct audience and receipt distinction","Community and institutional communications")],
 TRANSLATE:[g("TRANSLATION","Can evidence and lessons become implementable practice across roles?","Practice guide, training and teach-back results","Knowledge translation lead","Audience comprehension, training fidelity, practice uptake and local limits reviewed","Frontline implementers")],
 SCALE:[g("TRANSPORT","Why would this EBI work in Houston or another site with different conditions?","Site transport/adaptation matrix and independent replication plan","Cross-site evaluator","Population, drivers, services, risks and core mechanism independently assessed; local pilots authorized","Destination community, clinical and research owners")],
 SUSTAIN:[g("STEWARDSHIP","Who owns post-success capability and what triggers retirement or change?","Stewardship, funding, maintenance and re-map decision","Sustainment sponsor","Resources, succession, monitoring, long-term harms and feedback checkpoints accepted","Affected parties and successor owner")]
};
const descriptions:Record<WorkflowPhase,string>={
 ORIENT:"Diagnose the mission before looking for a favored solution.",
 EVIDENCE:"Triangulate original research and contrary evidence, not repeated headlines.",
 POPULATION:"Avoid county-to-city inference and invented group-specific outcomes.",
 CAUSES:"Retain unknown, confounding, biology, process failures and alternative models.",
 COMMUNITY:"Place people, institutions, incentives and power alongside the data.",
 SALP:"Select effective leverage points, identify systemic anchors and understand institutional resistance.",
 EBI_FIT:"Select the right mechanism for this place; do not copy an intervention because it has an EBI label.",
 LOGIC:"Connect inputs, activity, mechanisms, outputs, outcomes and balancing measures.",
 GOVERNANCE:"Owner approval and lawful data access are real gates, not checkboxes.",
 PLAN:"Rehearse resources, coordination and reversal before exposure.",
 PILOT:"Predefine a fair comparison and valid instrument before examining results.",
 IMPLEMENT:"Collect actual execution receipts rather than equating a plan with delivery.",
 MONITOR:"Know whether delivery, exposure, fidelity and harm measurements are valid.",
 EVALUATE:"Assess counterfactual benefit, uncertainty, workload and distribution.",
 ADAPT:"Distinguish adaptable form from invariant core function.",
 COMMUNICATE:"Translate evidence clearly while preserving sender, uncertainty and rights.",
 TRANSLATE:"Convert findings into usable instructions, education and institutional practice.",
 SCALE:"Revalidate context, delivery and causal effect across destinations.",
 SUSTAIN:"Plan the day after success, successor and revision across a ten-year horizon."
};
const purposes:Record<WorkflowPhase,string[]>={
 ORIENT:["Mission statement","Designed, operational and experienced realities"],
 EVIDENCE:["Evidence crosswalk","Null and contradictory evidence register"],
 POPULATION:["Population strata and case-mix map","Missing/suppressed cells log"],
 CAUSES:["Open-world explanation register","Instrument/test fit assessment"],
 COMMUNITY:["Collaborative stakeholder roster","Engagement and shared-decision protocol"],
 SALP:["Systemic anchor/constraint register","Leverage point and power topology"],
 EBI_FIT:["EBI selection and core-function matrix","Cost/fit/barrier assessment"],
 LOGIC:["SMART outcomes with valid denominator","Logic model and causal pathway"],
 GOVERNANCE:["Ethics/data access decision","Authority and safety gate"],
 PLAN:["RACI and resource commitments","Rehearsal/fallback checklist"],
 PILOT:["Pilot protocol and comparator","Sample plan and predefined stopping rule"],
 IMPLEMENT:["Site execution and fidelity record","Actual activity receipts"],
 MONITOR:["Time-stamped valid outcome instrument","Balancing and equity monitoring"],
 EVALUATE:["Predefined observed outcomes and uncertainty","Independent critique"],
 ADAPT:["Adaptation reasoning and core fidelity","Local re-test protocol"],
 COMMUNICATE:["Stakeholder briefing and approved dissemination","Feedback and receipt tracking"],
 TRANSLATE:["Practice translation and training","Teach-back/understanding verification"],
 SCALE:["Destination fit and adaptation audit","Local replication evidence"],
 SUSTAIN:["Resource and successor handoff","Continuous remapping and stop/restart decisions"]
};

export function compareEBIAcrossSites(
  strategy:StrategyCandidate|undefined,
  sourceSite:string,
  destinationSite:string,
):TransportabilityReview{
  const label=strategy?.name||"No evidence-based intervention selected";
  const test=(dimension:string,jacksonEvidence:string,requiredComparison:string):SiteTransferCheck=>({
    dimension,jacksonEvidence,destinationEvidence:"NOT OBSERVED — no approved destination-specific source",
    state:"UNVERIFIED_IN_DESTINATION",requiredComparison
  });
  return {
    sourceSite,destinationSite,candidateEbi:label,
    originalCoreFunction:strategy?.studyTarget||"Core causal function has not been established for an intervention.",
    adaptableDeliveryForms:[
      "Delivery channel, venue, timing and language may vary when function and fidelity remain justified.",
      "Navigator/reminder logistics must be based on community choice and real service capacity.",
      "No adaptation is automatically endorsed or implemented by this report."
    ],
    tests:[
      test("Phenomenon and target population","County-level Jackson/Hinds historical cancer-stage proxy, not city rates",
        "Re-establish diagnosis stage, incidence period, disease/site, age and risk eligibility for the destination."),
      test("Socioeconomic and geographic access","Jackson barriers have been proposed but not locally proven",
        "Measure local transport, affordability, hours, referral capacity and accessibility without ecological assumptions."),
      test("Culture, trust and engagement","No local lived-experience partnership or uptake studies completed",
        "Conduct legitimate community co-design and document preferences, accessibility, language and governance."),
      test("Provider and referral capacity","No approved operational facility/care-path capacity data",
        "Validate clinic, screening, endoscopy/imaging, pathology, referral and navigation work capacity."),
      test("Original instruments and shared lineage","Public historical registry plus modeled/contextual source catalog",
        "Validate methods, reference frame, denominators, data rights, shared providers, currentness and missing data."),
      test("EBI mechanism and core function","Evidence category supports screening uptake in some settings, not proven local stage shift",
        "Identify which core function produces which outcome, and distinguish context-dependent form from mechanism."),
      test("Policy, authority and resources","No site-specific IRB, partner, consent or confirmed budget",
        "Obtain actual destination authority, sustainability and data-sharing decisions, staffing and resource plan."),
      test("Harm, equity and counterfactual","No independent local pilot, measured harm or subgroup causal effect",
        "Define fair comparator, risks, outcome measures and independent site-level adjudication before claims.")
    ],
    decision:"HOLD_PENDING_LOCAL_ADAPTATION_AND_VALIDATION",
    automaticReplicationAuthorized:false,
    exactCopiedInterventionIsEvidenceBasedForDestination:false,
    localEffectsKnown:false,reviewerSignoffObtained:false,
    recommendation:"Do not copy implementation form from the original site into the destination. Run a new DIS ORIENT→MAP→GAP→SALP→EBI_FIT cycle, preserving tested core mechanisms only where justified and prospectively evaluating adaptation."
  };
}
function compareGenericAcrossSites(sourceSite:string,destinationSite:string,question:string):TransportabilityReview{
 const test=(dimension:string,requiredComparison:string):SiteTransferCheck=>({
   dimension,jacksonEvidence:"No source-site implementation outcome is independently verified; original problem: "+question.slice(0,180),
   destinationEvidence:"NOT OBSERVED — no authorized destination source",
   state:"UNVERIFIED_IN_DESTINATION",requiredComparison
 });
 return{
   sourceSite,destinationSite,candidateEbi:"No evaluated transferable intervention specified",
   originalCoreFunction:"The original action mechanism and invariant core function have not been established.",
   adaptableDeliveryForms:[
     "User journey, interface, language, logistics and staffing may differ when a core mechanism is validated.",
     "No copied implementation is approved solely on the basis of another organization's results."
   ],
   tests:[
     test("Original problem and intended beneficiary","Re-evaluate decision, meaningful outcome and end user at destination."),
     test("Macro policy and resources","Compare policy obligations, capacity, local costs, labor and incentives."),
     test("Local context and stakeholder needs","Independently measure site context and affected user experience."),
     test("Technology and system interfaces","Audit identity, data rights, upstream APIs, dependencies, failures and access."),
     test("Mechanism and core function","Verify mechanism, what must stay invariant, and what may adapt."),
     test("Evidence quality and comparator","Define independent source lineage, baseline, control and harmful effects."),
     test("Authority, safety and sustainment","Confirm local approvals, owners, staffing, budgets and rollback.")
   ],
   decision:"HOLD_PENDING_LOCAL_ADAPTATION_AND_VALIDATION",
   automaticReplicationAuthorized:false,exactCopiedInterventionIsEvidenceBasedForDestination:false,
   localEffectsKnown:false,reviewerSignoffObtained:false,
   recommendation:"New destination must independently map evidence, users, instrument fit, systems, mechanisms, resources and governance; compare with competent current practice before adopting."
 };
}

function smart(program:ResearchProgram):SmartObjective[]{
  const cancerCase=program.caseId.startsWith("jackson-ms-late-stage-");
  return program.successMeasures.map((s,i)=>({
    id:"SMART-"+(i+1),specific:s.name,
    measurable:s.definition,
    achievable:"REQUIRES_LOCAL_RESOURCE_AND_BASELINE_CHECK",
    relevant:cancerCase?"Reduce preventable delay and inequity without substituting proxy measures for patient benefit.":"Improve the stated real-world outcome without substituting a convenient proxy or unmeasured assumption.",
    timeBound:"TO_BE_SET_AFTER_MEASUREMENT_AND_STAKEHOLDER_AGREEMENT",
    baseline:"NOT_VERIFIED_FOR_TARGET_SITE",target:"NOT_PRESET",
    sourceAndDenominator:s.definition,ownerRole:i===0?(cancerCase?"Cancer registry/independent epidemiologist":"Independent measurement owner"):"Local implementation and evaluation owners",
    balancingMeasure:cancerCase?"Unintended harms, unequal reach, added workload, inappropriate screening, unnecessary procedures and cost":"Unintended harms, unequal access, additional operational burden, privacy/security, hidden costs and ecosystem changes"
  }));
}
export function buildImplementationJourney(program:ResearchProgram,destinationSite="Houston, Texas"):FullImplementationFlow{
  const cancerCase=program.caseId.startsWith("jackson-ms-late-stage-");
  const nodes=(Object.keys(PHASE_TITLES) as WorkflowPhase[]).map(id=>step(
    id,PHASE_TITLES[id],
    purposes[id].join(" · "),descriptions[id],purposes[id],requirements[id]
  ));
  const systemicModel:SALPModel={
    method:"SYSTEMIC_ANCHORS_AND_LEVERAGE_POINTS",
    establishedInterpretation:"Systemic Anchors and Leverage Points (SALP)",
    rPliceSequence:["Recognize","Position","Leverage","Integrate","Consolidate"],
    identifiedAnchors:[],
    leverageQuestions:[
      "Which durable policies, reimbursement incentives, workforce limitations, relationships or referral practices anchor existing outcomes?",
      "Where does the human, organizational or clinical pathway demonstrate an independently measured avoidable failure?",
      "Which smallest feasible change alters the mechanism without destabilizing safe care?",
      "What new feedback, incentives, burden or inequity may the intervention create?",
      "What observation distinguishes leverage-point success from gaming or measurement artifact?"
    ],
    powerAndIncentiveQuestions:[
      "Who controls resources, data, workflow priorities and approvals?",
      "Whose lived experience and community priorities differ from the designed program?",
      "Which organizations could benefit, be harmed or resist change?",
      "Are incentives aligned with verified end-state outcomes rather than activity volume or a convenient proxy?"
    ],
    fidelityMeasures:["Reach and eligibility","Delivered dose and intended core function","Implementation quality and deviation logs",
      "Stakeholder engagement","Undesired effects and structural drift","Observed functional outcomes against comparator"],
    forecastAnalytics:"PROPOSED_NOT_VALIDATED",mechanismsVerified:false,authorityRequired:true
  };
  const logicModel:LogicModel=cancerCase?{
    assumptions:[
      "The stated problem is measurable in its correctly defined population, with valid source geography.",
      "The EBI's theoretical mechanism matches a locally demonstrated determinant; this is NOT yet established.",
      "Screening uptake, diagnostic closure, cancer-stage shift and morbidity are separate outcome classes.",
      "Clinical authorization, ethical data access and community participation are obtained before intervention."
    ],
    inputs:["Participating clinical and community teams (not yet committed)","Valid site registry and appropriately authorized service data",
      "Clinical and navigation workforce, transport/capacity assessment","Time, budget, ethics review and a measurement/evaluation plan"],
    activities:["Independent needs assessment","Community-informed selection/adaptation of EBI",
      "Training and test execution","Guideline-concordant screening and appropriate diagnostic follow-up support",
      "Fidelity and experience review with continuous adaptation"],
    outputs:["Documented partners and participation","Valid eligible cohorts","Delivered intervention dose and fidelity",
      "Completed appropriate screenings and diagnostic resolutions","Preserved decision and implementation receipts"],
    shortTerm:["Accurate eligibility and access characterization","Improved appropriate contact, appointment, engagement and navigation feasibility"],
    intermediate:["Better verified screening completion and abnormal-result closure where the intervention works",
      "Improved equity, costs and provider workflow without offsetting harms"],
    longTerm:["Reduced late-stage diagnoses where registry trends and causal research eventually support that claim",
      "Maintained, transferable, safe, community-acceptable implementation"],
    unintendedEffects:["Over-screening","Inappropriate or delayed referrals","False reassurance","Privacy leakage",
      "Excess navigator workload","Inequitable access","Mistaken ecological attribution"],
    smartObjectives:smart(program)
  }:{
    assumptions:[
      "The actual phenomenon and user outcome are independently measurable.",
      "Macro policy, regional context, local organization and individual experience are neither interchangeable nor automatically causal.",
      "The intended mechanism and core functions must be validated in this specific system.",
      "Stakeholder authority, data rights, budget and adverse-effect monitoring must be established before execution."
    ],
    inputs:["Actual system and source inventory","Authorized stakeholders and affected users",
      "Measured baseline, alternative explanation and independent reviewer","Budget, capacity, permissions and operating owner"],
    activities:["Whole-system macro-to-micro map","Competing explanation and source/measurement audit",
      "Stakeholder co-design and reversible test","Independent comparison and monitoring","Explicit adaptation and learning"],
    outputs:["Documented legitimate sources and constraints","Defined eligible user/workflow population",
      "Versioned design and implemented change receipts","Completed real user tasks and acknowledged effects"],
    shortTerm:["Valid problem and source characterization","Fewer unverified assumptions and better instrument selection"],
    intermediate:["Improved workflow fidelity, task completion and access with no disproportionate harms"],
    longTerm:["Meaningful, independently verified and sustainable user/system benefit","Adaptation to other contexts only after new fit assessment"],
    unintendedEffects:["Increased cost and workload","Lost privacy, trust, data rights or accessibility",
      "False confidence from dashboards or synthetic tests","Duplicated infrastructure, vendor lock-in and fragile dependencies"],
    smartObjectives:smart(program)
  };
  const source=program.population.targetName;
  const crossSiteTransport=cancerCase?compareEBIAcrossSites(program.strategies[0],source,destinationSite):compareGenericAcrossSites(source,destinationSite,program.question);
  const nextActions=nodes.slice(0,5).map(x=>({
    action:x.title,ownerRole:x.gates[0].ownerRole,proofNeeded:x.gates[0].artifact+" — "+x.gates[0].acceptance
  }));
  return {
    schemaVersion:"dis-implementation-journey-v1",
    caseId:program.caseId,question:program.question,site:source,
    researchState:"DRAFT_DESIGN_WITH_GAPS",currentRecommendedPhase:"ORIENT",
    nodes,systemicModel,logicModel,crossSiteTransport,
    communicationTracks:cancerCase?[
      {audience:"Affected communities and patient representatives",purpose:"Co-create problem framing, accessible information and decisions",feedback:"Consent-based listening sessions, comprehension and dissent",approval:"NOT_OBTAINED"},
      {audience:"Clinic/health system and navigators",purpose:"Align clinical pathways, safe care and operational workload",feedback:"Workflow and capacity review with clinical oversight",approval:"NOT_OBTAINED"},
      {audience:"Registry/data and academic reviewers",purpose:"Clarify original sources, study validity, outcomes and uncertainty",feedback:"Independent methods critique and correction log",approval:"NOT_OBTAINED"},
      {audience:"Funders/public health and policymakers",purpose:"Explain defensible outcomes, cost and limits without vendor claims",feedback:"Approved briefing, actual receipt and follow-up",approval:"NOT_OBTAINED"}
    ]:[
      {audience:"Affected users and organizations",purpose:"Co-define desired outcome and burden",feedback:"Consent-based accessible dialogue, independent challenge and corrections",approval:"NOT_OBTAINED"},
      {audience:"System owners and delivery staff",purpose:"Align interfaces, support capacity and implementation",feedback:"Owner-reviewed requirements, integration rehearsal and incident response",approval:"NOT_OBTAINED"},
      {audience:"Funders, governance and reviewers",purpose:"Explain evidence, costs, limits and outcome measurement",feedback:"Authorized report, real receipt and open questions",approval:"NOT_OBTAINED"}
    ],
    collaborationRoles:cancerCase?[
      {role:"Community co-investigator",responsibility:"Represent experienced reality, consent, priorities and unintended harms",participationState:"NOT_CONFIRMED"},
      {role:"Clinical pathway owner",responsibility:"Confirm appropriate eligibility, diagnostic safety, referral and clinical scope",participationState:"NOT_CONFIRMED"},
      {role:"Registry epidemiologist",responsibility:"Verify incidence/stage numerator, denominator, geography, suppression and period",participationState:"NOT_CONFIRMED"},
      {role:"Implementation scientist",responsibility:"CFIR context, EBI selection, SALP leverage and adaptation fidelity",participationState:"NOT_CONFIRMED"},
      {role:"Data/privacy custodian",responsibility:"Approve lawful data use, tenant/participant protection and provenance",participationState:"NOT_CONFIRMED"},
      {role:"Independent evaluator",responsibility:"Design comparator, measures, adjudication and interpretation",participationState:"NOT_CONFIRMED"},
      {role:"Program sponsor and steward",responsibility:"Authorize resources, implementation, monitoring, handoff, scale and retirement",participationState:"NOT_CONFIRMED"}
    ]:[
      {role:"Affected user representatives",responsibility:"Define experienced reality, consequences and meaningful improvements",participationState:"NOT_CONFIRMED"},
      {role:"System and source owners",responsibility:"Validate interfaces, permissions, reliability and original data provenance",participationState:"NOT_CONFIRMED"},
      {role:"Implementation lead",responsibility:"Coordinate dependencies, budget, training, rollout and reversibility",participationState:"NOT_CONFIRMED"},
      {role:"Independent evaluator",responsibility:"Test alternative causes, outcome instrument validity and comparison",participationState:"NOT_CONFIRMED"},
      {role:"Policy, privacy and security owner",responsibility:"Authorize data use, risk boundaries, consent and security",participationState:"NOT_CONFIRMED"},
      {role:"Successor/steward",responsibility:"Monitor benefits, drift, maintenance, adaptation and retirement",participationState:"NOT_CONFIRMED"}
    ],
    learningLoop:[
      "ORIENT: reopen the phenomenon, mission and stakeholder outcomes whenever evidence conflicts with design.",
      "MAP–GAP: reassess people, policy, funding, measurements, service pathways and system interfaces.",
      "ACT: implement only with named authority and valid pilot/predeclared safety controls.",
      "TRACK: update actual observations, source time, comparator, fidelity, outcomes and data limitations.",
      "ADAPT: re-evaluate core function, delivery form, unintended effects and contextual transfer after each cycle.",
      "SHARE and RE-MAP: communicate validated evidence, archive contested findings, transfer responsibility and reevaluate future needs."
    ],
    acceptance:{stagesActuallyCompleted:0,independentOutcomeVerified:false,localCausalEffectsEstablished:false,
      realPilotExecuted:false,partnersCommitted:false,patientDataProcessed:false,externalCommunicationAuthorized:false,scaleAuthorized:false},
    nextActions
  };
}
