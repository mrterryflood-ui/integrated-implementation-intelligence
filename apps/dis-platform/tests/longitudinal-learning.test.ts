import test from "node:test";
import assert from "node:assert/strict";
import {buildPlaybook,validatePlaybook} from "../lib/decision-playbook";
import {buildLearningCheckpoint,asLearningCheckpoints,summarizeMetricChanges,type CaseLearningEvent} from "../lib/longitudinal-learning";

const at="2026-10-29T22:00:00.000Z";
const example=()=>{
 const p=buildPlaybook("Improve uptake of a community-based program",{state:"PRELIMINARY_DELIBERATION"});
 p.tasks[0]={...p.tasks[0],owner:"Implementation lead",done:true,evidence:"Training log, self-reported; awaiting audit"};
 p.metrics[0]={...p.metrics[0],baseline:"10",target:"25",observed:"14",unit:"%",source:"Site register, unvalidated",observedAt:"2026-10-21",verified:true};
 p.nextReview="2026-11-12";
 p.learningReview={knowledge:"Staff reported access barriers",skills:"More training needed",strategy:"Test assisted onboarding",nextExperiment:"Two-site opt-in pilot"};
 return p;
};
test("user-recorded evidence and reflections remain explicitly unverified",()=>{
 const p=example();
 assert.equal(validatePlaybook(p),true);
 const s=buildLearningCheckpoint(p,2,at);
 assert.equal(s.kind,"DIS_LONGITUDINAL_CHECKPOINT_V1");
 assert.equal(s.caseVersion,2);
 assert.equal(s.evidenceState,"USER_REPORTED_UNVERIFIED");
 assert.equal(s.summary.completedWithEvidence,1);
 assert.equal(s.summary.ownedTasks,1);
 assert.equal(s.summary.observedWithSource,1);
 assert.equal(s.summary.observedWithDate,1);
 assert.equal(s.summary.selfAttested,1);
 assert.equal(s.summary.reviewScheduled,true);
 assert.equal(s.metrics[0].sourceState,"SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED");
 assert.ok(s.assurance.includes("not independently"));
 assert.equal(s.reflection.nextExperiment,"Two-site opt-in pilot");
});
test("unobserved or unsourced measures never count as demonstrated outcomes",()=>{
 const p=buildPlaybook("Improve agency implementation",null);
 const s=buildLearningCheckpoint(p,1,at);
 assert.equal(s.summary.measuresObserved,0);
 assert.equal(s.summary.observedWithSource,0);
 assert.equal(s.summary.selfAttested,0);
 assert.equal(s.summary.reviewScheduled,false);
 assert.equal(s.evidenceState,"USER_REPORTED_UNVERIFIED");
});
test("validation limits learning notes, observational dates and sources",()=>{
 const p=example();
 assert.equal(validatePlaybook(p),true);
 p.metrics[0].source="a".repeat(501);
 assert.equal(validatePlaybook(p),false);
 p.metrics[0].source="Documentation";
 p.metrics[0].observedAt="2026/10/29";
 assert.equal(validatePlaybook(p),false);
 p.metrics[0].observedAt="2026-10-29";
 p.learningReview!.strategy="x".repeat(1001);
 assert.equal(validatePlaybook(p),false);
});
test("reconstruct longitudinal changes without claiming improvement or causal effect",()=>{
 const p=example();
 const s1=buildLearningCheckpoint(p,2,"2026-10-29T10:00:00.000Z");
 p.metrics[0].observed="19";
 const s2=buildLearningCheckpoint(p,3,"2026-10-30T10:00:00.000Z");
 const history:CaseLearningEvent[]=[
  {id:"2",event_type:"CHECKPOINT",created_at:s2.recordedAt,payload:s2},
  {id:"1",event_type:"CHECKPOINT",created_at:s1.recordedAt,payload:s1},
  {id:"other",event_type:"NOTE",created_at:at,payload:{kind:"DIS_LONGITUDINAL_CHECKPOINT_V1"}},
 ];
 assert.deepEqual(asLearningCheckpoints(history).map(x=>x.caseVersion),[2,3]);
 const trend=summarizeMetricChanges(history).find(x=>x.id===p.metrics[0].id);
 assert.ok(trend);
 assert.equal(trend.first.value,"14");
 assert.equal(trend.latest.value,"19");
 assert.equal(trend.delta,5);
 assert.equal(trend.observations,2);
 assert.equal(trend.evidenceState,"USER_REPORTED_UNVERIFIED");
});
test("cross-unit and nonnumeric observations cannot be compared arithmetically",()=>{
 const p=example();
 const a=buildLearningCheckpoint(p,2,"2026-10-29T10:00:00.000Z");
 p.metrics[0]={...p.metrics[0],observed:"15",unit:"people"};
 const b=buildLearningCheckpoint(p,3,"2026-10-30T10:00:00.000Z");
 const events:CaseLearningEvent[]=[
  {id:"1",event_type:"CHECKPOINT",created_at:a.recordedAt,payload:a},
  {id:"2",event_type:"CHECKPOINT",created_at:b.recordedAt,payload:b},
 ];
 const metric=summarizeMetricChanges(events).find(x=>x.id===p.metrics[0].id)!;
 assert.equal(metric.delta,null);
 p.metrics[0].observed="Unknown";
 const c=buildLearningCheckpoint(p,4,"2026-10-31T10:00:00.000Z");
 const events2=[...events,{id:"3",event_type:"CHECKPOINT",created_at:c.recordedAt,payload:c}];
 assert.equal(summarizeMetricChanges(events2).find(x=>x.id===p.metrics[0].id)!.delta,null);
});
