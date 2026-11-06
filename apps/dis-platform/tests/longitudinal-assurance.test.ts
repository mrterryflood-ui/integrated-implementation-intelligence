import test from "node:test";
import assert from "node:assert/strict";
import {buildLongitudinalAssurance} from "../lib/longitudinal-assurance";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../lib/jackson-cancer-case";
import {buildImplementationJourney} from "../lib/implementation-journey";

const build=()=>buildLongitudinalAssurance(buildResearchProgram(jacksonCancerCase("colorectal")));
const paths=["NOT_TESTED","FAILURE","PARTIAL_SUCCESS","SUCCESS","UNINTENDED_HARM"];

test("all five post-decision futures have a human owner, discriminating signal, counteraction, alternative and proof",()=>{
 const x=build();
 assert.deepEqual(x.cases.map(c=>c.path),paths);
 for(const c of x.cases){
   assert.equal(c.scenario,"HYPOTHETICAL_NOT_AN_OBSERVED_RESULT");
   assert.equal(c.automaticConclusion,false);
   assert.equal(c.automaticScale,false);
   for(const field of ["leadingQuestions","earlySignals","alternativeExplanations","responsesToTest","evidenceRequired","responsibleRoles"] as const)
     assert.ok(c[field].length>=2,"missing "+field+" for "+c.path);
 }
 assert.equal(x.actualResult,"NOT_OBSERVED");
 assert.equal(x.scaleAuthorized,false);
 assert.equal(x.sourceIndependentOutcomeVerified,false);
});
test("a success rehearsal NEVER becomes automatic scaling or an observed beneficiary effect",()=>{
 const x=build(),s=x.cases.find(c=>c.path==="SUCCESS")!;
 assert.ok(s.leadingQuestions.some(q=>/tomorrow|success/i.test(q)));
 assert.ok(s.responsesToTest.some(q=>/successor|funding/i.test(q)));
 assert.ok(s.responsesToTest.some(q=>/new-site scaling/i.test(q)));
 assert.equal(s.automaticScale,false);
 assert.equal(x.accountableSuccessorConfirmed,false);
 assert.equal(x.approvedSustainmentBudget,false);
 assert.equal(x.downstreamEffectsObserved,false);
});
test("partial success requires subgroup, denominator and equity examination, not averaged success",()=>{
 const x=build(),s=x.cases.find(c=>c.path==="PARTIAL_SUCCESS")!;
 assert.ok(s.leadingQuestions.some(q=>/excluded|harmed/i.test(q)));
 assert.ok(s.alternativeExplanations.some(q=>/denominator|artifact/i.test(q)));
 assert.equal(x.sourceIndependentOutcomeVerified,false);
});
test("failure and harms require safe alternatives and stopping authority, not endless optimization of the target",()=>{
 const x=build();
 const f=x.cases.find(c=>c.path==="FAILURE")!;
 const h=x.cases.find(c=>c.path==="UNINTENDED_HARM")!;
 assert.ok(f.responsesToTest.some(q=>/reversing|deimplementing|stopping/i.test(q)));
 assert.ok(f.leadingQuestions.some(q=>/fail/i.test(q)));
 assert.ok(h.responsesToTest.some(q=>/authorized safety/i.test(q)));
 assert.equal(x.automaticRetirementAuthorized,false);
});
test("core function is a hypothesis; changing delivery form must preserve clinical/governance authority",()=>{
 const x=build(),f=x.coreFidelity;
 assert.equal(f.coreFunctionValidated,false);
 assert.equal(f.changeExecuted,false);
 assert.equal(f.changeControl.whatChanged,"NOT_RECORDED");
 assert.equal(f.changeControl.whoAuthorized,"NOT_RECORDED");
 assert.ok(f.invariantHypotheses.some(q=>/consent|decision rights/i.test(q)));
 assert.ok(f.adaptableForms.some(q=>/Language|channel/i.test(q)));
 assert.ok(f.prohibitedInference.includes("never proves"));
});
test("day-after, short-term, mid-term, long-term and successors force longitudinal remapping",()=>{
 const x=build();
 assert.deepEqual(x.triggers.map(t=>t.id),["NEXT_DAY","SHORT_TERM","MID_TERM","LONG_TERM","SUCCESSOR_FUTURE"]);
 assert.ok(x.triggers.every(t=>t.observed===false));
 assert.ok(x.triggers.every(t=>t.ownerRole.length>5&&t.evidenceInstrument.length>20));
 assert.ok(x.learningCycle.includes("REMAP"));
 assert.ok(x.systemIntersections.some(q=>/bottlenecks downstream/i.test(q)));
});
test("generic nonhealth research uses a domain-neutral beneficiary-outcome rule",()=>{
 const p=buildResearchProgram(unsourcedResearchCase("How do we improve city permitting reliability?","City of Fiction"));
 const r=buildLongitudinalAssurance(p);
 assert.ok(r.primaryOutcome.includes("beneficiary")||r.primaryOutcome.includes("system"));
 assert.ok(!r.triggers.find(t=>t.id==="LONG_TERM")!.evidenceInstrument.includes("cancer registry"));
 assert.equal(r.scaleAuthorized,false);
});
test("the orchestrated lifecycle contains longitudinal scenario reasoning, not just STELLAR, SALP and phase labels",()=>{
 const p=buildResearchProgram(jacksonCancerCase("colorectal"));
 const w=buildImplementationJourney(p);
 assert.equal(w.longitudinal.schemaVersion,"dis-dynamic-stewardship-v1");
 assert.equal(w.stellarOne.stage,"STELLAR_1");
 assert.equal(w.longitudinal.cases.length,5);
 assert.equal(w.longitudinal.approvedSustainmentBudget,false);
 assert.equal(w.crossSiteTransport.automaticReplicationAuthorized,false);
});
