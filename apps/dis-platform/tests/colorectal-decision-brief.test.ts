import test from "node:test";
import assert from "node:assert/strict";
import {colorectalEvidenceAction,buildColorectalDecisionBrief} from "../lib/evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";

test("the decision brief preserves historical scope and unknown effects rather than filling them with zero or another snapshot",()=>{
  const {program,bridge,decisionBrief:b}=colorectalEvidenceAction();
  assert.deepEqual(bridge.measures.map(m=>m.indicator.value),[30.4,63.3,76]);
  assert.match(b.baselineScope,/2018–2022.*Hinds/);
  assert.match(b.baselineScope,/separately versioned 2019–2023.*matched Hinds\/Harris/);
  assert.match(b.unknownDeltasScope,/legacy baseline/);
  assert.deepEqual(Object.values(b.unknownDeltas),[null,null,null,null,null]);
  assert.equal(b.interventionAuthorized,false);
  assert.equal(b.actualAssignmentsAccepted,false);
  assert.equal(b.causalEffectEstablished,false);
  assert.throws(()=>buildColorectalDecisionBrief(program,{...bridge,caseId:"another"}),/identity/);
  for(const patch of [{period:"2019–2023"},{geography:"Harris County, TX"},{unit:"percent"},{value:29.9}]){
    const changed=structuredClone(bridge);Object.assign(changed.measures[0].indicator,patch);
    assert.throws(()=>buildColorectalDecisionBrief(program,changed),/scope mismatch/);
  }
  assert.match(buildColorectalDecisionBrief(program,{...bridge,measures:[]}).baselineScope,/No accepted measurements/);
  const wrongConstruct=structuredClone(bridge);wrongConstruct.measures[0].construct="SCREENING_COMPLETION";
  assert.throws(()=>buildColorectalDecisionBrief(program,wrongConstruct),/scope mismatch/);
});
test("age and prevention are testable candidates retained with rivals and independent care pathways",()=>{
  const {bridge,decisionBrief:b}=colorectalEvidenceAction();
  const early=bridge.hypotheses.find(h=>h.id==="H-EARLY");
  assert.ok(early);
  assert.match(early.hypothesis,/age is one candidate, not an established cause/);
  assert.match(early.discriminatingTest,/interactions/);
  assert.match(early.alternative,/separately or together/);
  assert.ok(bridge.hypotheses.some(h=>h.id==="H-PREVENT"));
  assert.deepEqual(b.pathways.map(p=>p.id),["average-risk","higher-risk","diagnostic"]);
  assert.equal(b.workPackages.length,bridge.hypotheses.length);
  assert.ok(b.workPackages.every(w=>w.assignmentState==="PROPOSED_UNASSIGNED"&&bridge.hypotheses.some(h=>h.id===w.hypothesisId)));
  assert.deepEqual(b.openGapIds,bridge.gaps.map(g=>g.id));
  assert.match(b.signalValidation,/without information leakage/);
  assert.match(b.benefitEvidence,/stage shift alone cannot establish benefit/);
  assert.match(b.comparison,/competent current care/);
});
test("the actual saved investigation retains the same decision and value contract shown to the user",()=>{
  const {program,bridge,decisionBrief}=colorectalEvidenceAction();
  const record=buildEvidenceActionCaseHandoff(program,bridge);
  assert.deepEqual(record.report.decisionBrief,decisionBrief);
  assert.ok(record.report.investigation.hypotheses.some(h=>h.id==="H-EARLY"));
  assert.ok(record.report.gapIDs.includes("age-risk-pathways"));
  assert.ok(record.report.actionPlan.tasks.some(t=>t.why.includes("early-signal-validation")));
  assert.match(record.report.decisionBrief!.value.potentialBuyer,/demand and procurement unverified/);
  assert.match(record.report.decisionBrief!.value.proof,/willingness to pay/);
  assert.ok(JSON.stringify(record.report).length<64000);
  const withNewGap=buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:[{
    id:"partner-capacity",severity:"IMPLEMENTATION_REQUIRED",problem:"Actual capacity is not measured.",ownerRole:"Partner operations owner, unassigned",nextEvidence:"Measure available appointments and staff workload."
  }],notes:[]});
  assert.deepEqual(withNewGap.report.decisionBrief!.openGapIds,withNewGap.report.gapIDs);
  assert.ok(withNewGap.report.decisionBrief!.openGapIds.includes("partner-capacity"));
});
test("historical stage percentages do not claim an unsupported known-stage-only denominator",()=>{
  const {bridge}=colorectalEvidenceAction();
  const share=bridge.measures.find(m=>m.id==="CRC-LATE-SHARE")!;
  assert.match(share.denominatorClass,/UNKNOWN_STAGE_HANDLING_UNRESOLVED/);
  assert.match(share.indicator.denominatorDefinition,/unknown-stage handling unresolved/);
  const breast=jacksonCancerCase("breast").indicators.find(m=>m.id==="BREAST-LATE-SHARE")!;
  assert.match(breast.denominatorDefinition,/unknown-stage handling unresolved/);
  assert.equal(jacksonCancerCase("breast").drivers.some(d=>d.id==="H-PREVENT"),false);
});
