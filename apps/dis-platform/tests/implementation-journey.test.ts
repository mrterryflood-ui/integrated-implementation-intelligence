import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../lib/jackson-cancer-case";
import {buildImplementationJourney,compareEBIAcrossSites,PHASE_TITLES,type WorkflowPhase} from "../lib/implementation-journey";

const design=()=>buildImplementationJourney(buildResearchProgram(jacksonCancerCase("colorectal")));
const ids:WorkflowPhase[]=[
  "ORIENT","EVIDENCE","POPULATION","CAUSES","COMMUNITY","SALP",
  "EBI_FIT","LOGIC","GOVERNANCE","PLAN","PILOT","IMPLEMENT",
  "MONITOR","EVALUATE","ADAPT","COMMUNICATE","TRANSLATE","SCALE","SUSTAIN"
];

test("research-to-implementation covers all phases with no invented implementation or approval",()=>{
  const w=design();
  assert.equal(w.schemaVersion,"dis-implementation-journey-v1");
  assert.deepEqual(w.nodes.map(x=>x.id),ids);
  assert.equal(w.nodes.length,19);
  assert.deepEqual(w.acceptance,{
    stagesActuallyCompleted:0,independentOutcomeVerified:false,localCausalEffectsEstablished:false,
    realPilotExecuted:false,partnersCommitted:false,patientDataProcessed:false,
    externalCommunicationAuthorized:false,scaleAuthorized:false
  });
  for(const n of w.nodes){
    assert.equal(n.title,PHASE_TITLES[n.id]);
    assert.equal(n.status,"NOT_EXECUTED_EVIDENCE_REQUIRED");
    assert.equal(n.claimOfCompletion,false);
    assert.equal(n.actionAuthorized,false);
    assert.ok(n.gates.length>0,"gate missing "+n.id);
    assert.ok(n.outputs.length>0,"outputs missing "+n.id);
    for(const g of n.gates){
      assert.equal(g.verifiedOutsideSystem,false);
      assert.ok(g.artifact.length>10&&g.acceptance.length>20&&g.ownerRole.length>7&&g.reviewerRole.length>7);
    }
  }
  assert.equal(w.currentRecommendedPhase,"ORIENT");
});

test("SALP maps systemic anchors and leverage, power and implementation fidelity without claiming causality",()=>{
  const w=design();
  const salp=w.systemicModel;
  assert.equal(salp.method,"SYSTEMIC_ANCHORS_AND_LEVERAGE_POINTS");
  assert.match(salp.establishedInterpretation,/Systemic Anchors and Leverage Points/);
  assert.deepEqual(salp.rPliceSequence,["Recognize","Position","Leverage","Integrate","Consolidate"]);
  assert.ok(salp.leverageQuestions.some(x=>/smallest feasible change/i.test(x)));
  assert.ok(salp.powerAndIncentiveQuestions.some(x=>/controls resources/i.test(x)));
  assert.ok(salp.fidelityMeasures.some(x=>/dose/i.test(x)));
  assert.deepEqual(salp.identifiedAnchors,[]);
  assert.equal(salp.mechanismsVerified,false);
  assert.equal(salp.forecastAnalytics,"PROPOSED_NOT_VALIDATED");
  assert.equal(salp.authorityRequired,true);
});

test("SMART objectives require legitimate site baseline, target feasibility and time rather than fake numeric promises",()=>{
  const w=design();
  assert.ok(w.logicModel.smartObjectives.length>=5);
  for(const obj of w.logicModel.smartObjectives){
    assert.equal(obj.baseline,"NOT_VERIFIED_FOR_TARGET_SITE");
    assert.equal(obj.target,"NOT_PRESET");
    assert.equal(obj.timeBound,"TO_BE_SET_AFTER_MEASUREMENT_AND_STAKEHOLDER_AGREEMENT");
    assert.ok(obj.measurable.length>30);
    assert.ok(obj.balancingMeasure.includes("harm")||obj.balancingMeasure.includes("Harm")||obj.balancingMeasure.includes("Inappropriate"));
    assert.ok(obj.ownerRole.length>10);
  }
  assert.ok(w.logicModel.activities.some(x=>/community/i.test(x)));
  assert.ok(w.logicModel.unintendedEffects.some(x=>/Privacy leakage/i.test(x)));
  assert.ok(w.logicModel.longTerm.some(x=>/late-stage/i.test(x)));
  assert.equal(w.acceptance.independentOutcomeVerified,false);
});

test("Houston never receives copied Jackson EBI, city rate or inferred intervention effect",()=>{
  const w=design(),r=w.crossSiteTransport;
  assert.equal(r.sourceSite,"Jackson, Mississippi");
  assert.equal(r.destinationSite,"Houston, Texas");
  assert.equal(r.decision,"HOLD_PENDING_LOCAL_ADAPTATION_AND_VALIDATION");
  assert.equal(r.automaticReplicationAuthorized,false);
  assert.equal(r.exactCopiedInterventionIsEvidenceBasedForDestination,false);
  assert.equal(r.localEffectsKnown,false);
  assert.equal(r.reviewerSignoffObtained,false);
  assert.ok(r.tests.length>=8);
  for(const test of r.tests){
    assert.equal(test.state,"UNVERIFIED_IN_DESTINATION");
    assert.equal(test.destinationEvidence,"NOT OBSERVED — no approved destination-specific source");
    assert.ok(test.requiredComparison.length>35);
  }
  assert.ok(r.tests.some(x=>/provider and referral capacity/i.test(x.dimension)));
  assert.ok(r.tests.some(x=>/cultur|trust|engagement/i.test(x.dimension)));
  assert.ok(r.tests.some(x=>/core function/i.test(x.dimension)));
  assert.match(r.recommendation,/Do not copy implementation form/);
});

test("changing destination does not silently transfer geography, outcome, or fit to another site",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  for(const place of ["Houston, Texas","Atlanta, Georgia","Rural Mississippi community"]){
    const r=compareEBIAcrossSites(p.strategies[0],p.population.targetName,place);
    assert.equal(r.destinationSite,place);
    assert.equal(r.automaticReplicationAuthorized,false);
    assert.equal(r.localEffectsKnown,false);
    assert.equal(r.tests.length,8);
    assert.ok(r.tests.every(x=>x.state==="UNVERIFIED_IN_DESTINATION"));
  }
});

test("candidate EBI scientific status does not become validated causal stage shift after entering scale stage",()=>{
  const p=buildResearchProgram(jacksonCancerCase("breast"));
  const w=buildImplementationJourney(p);
  assert.equal(w.nodes.find(x=>x.id==="SCALE")?.status,"NOT_EXECUTED_EVIDENCE_REQUIRED");
  assert.equal(w.acceptance.scaleAuthorized,false);
  assert.equal(p.strategies[0].localEffect,"NOT_ESTABLISHED");
  assert.ok(w.nodes.find(x=>x.id==="EVALUATE")?.gates.some(x=>x.acceptance.includes("null findings")));
});

test("participation, collaboration, communications and evidence translation have accountable but unconfirmed roles",()=>{
  const w=design();
  assert.ok(w.collaborationRoles.length>=6);
  assert.ok(w.collaborationRoles.some(x=>x.role.includes("Community")));
  assert.ok(w.collaborationRoles.some(x=>x.role.includes("Independent evaluator")));
  assert.ok(w.collaborationRoles.every(x=>x.participationState==="NOT_CONFIRMED"));
  assert.ok(w.communicationTracks.length>=4);
  assert.ok(w.communicationTracks.every(x=>x.approval==="NOT_OBTAINED"));
  assert.ok(w.nodes.find(x=>x.id==="TRANSLATE")?.gates.some(x=>/comprehension/.test(x.acceptance)));
  assert.ok(w.nodes.find(x=>x.id==="COMMUNICATE")?.gates.some(x=>/receipt/.test(x.acceptance)));
});

test("ordered next actions are feasible investigative assignments, not authorized implementation",()=>{
  const w=design();
  assert.equal(w.nextActions.length,5);
  assert.equal(w.nextActions[0].action,"Problem, mission and end state");
  assert.ok(w.nextActions.every(x=>x.ownerRole&&x.proofNeeded));
  assert.equal(w.acceptance.realPilotExecuted,false);
  assert.equal(w.acceptance.externalCommunicationAuthorized,false);
  assert.ok(w.learningLoop.some(x=>x.includes("RE-MAP")));
});

test("no city-specific numbers, EBI transfer, or partner commitments are implied for custom problem",()=>{
  const p=buildResearchProgram(unsourcedResearchCase("How can we improve access to disability services?","Houston, Texas"));
  const w=buildImplementationJourney(p,"Jackson, Mississippi");
  assert.equal(w.nodes.length,19);
  assert.equal(w.acceptance.stagesActuallyCompleted,0);
  assert.equal(w.crossSiteTransport.automaticReplicationAuthorized,false);
  assert.equal(w.crossSiteTransport.localEffectsKnown,false);
  assert.equal(w.crossSiteTransport.originalCoreFunction,"Core causal function has not been established for an intervention.");
  assert.ok(w.logicModel.smartObjectives.every(x=>x.target==="NOT_PRESET"));
});

test("the actual research UI consumes workflow, SALP and Houston context gate without network calls",()=>{
  const page=readFileSync("app/research-program/page.tsx","utf8");
  const css=readFileSync("app/research-program/research-program.css","utf8");
  assert.match(page,/buildImplementationJourney\(program,destination\)/);
  assert.match(page,/Full DIS lifecycle/);
  assert.match(page,/Transfer to Houston/);
  assert.match(page,/Systemic Anchors and Leverage Points/);
  assert.match(page,/No externally verified proof/);
  assert.match(page,/journey\.crossSiteTransport\.tests/);
  assert.match(page,/journey\.logicModel\.smartObjectives/);
  assert.match(css,/\.rp-stage-grid/);
  assert.doesNotMatch(page,/\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|navigator\.sendBeacon/);
});
