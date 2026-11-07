import test from "node:test";
import assert from "node:assert/strict";
import {buildEnvironmentalResearch,getEnvironmentalProtocol,exportEnvironmentalResearch,reviewWaterReplay,type WaterReplayInput} from "../lib/environmental-research";
import {colorectalEvidenceAction} from "../lib/evidence-action-colorectal";

test("environmental cases reuse the bridge without inheriting colorectal assumptions",()=>{
 for(const id of ["epa-water-reuse","noaa-hazard-decisions"] as const){
  const x=buildEnvironmentalResearch(id);
  assert.equal(x.program.site,"general");assert.equal(x.bridge.measures.length,0);assert.equal(x.studyResults,"NOT_COLLECTED");
  assert.ok(!x.bridge.gaps.some(g=>["all-stage-incidence","screening-denominator","diagnostic-resolution"].includes(g.id)));
  assert.ok(!x.program.issues.find(g=>g.code==="NO_MEASURED_BASELINE")?.nextEvidence.includes("incidence/stage"));
  assert.ok(x.bridge.gaps.some(g=>g.id==="counterfactual-unverified"));assert.equal(x.bridge.correctiveActionAuthorized,false);
 }
 const crc=colorectalEvidenceAction();assert.ok(crc.bridge.gaps.some(g=>g.id==="all-stage-incidence"));
});
test("deadline timezones, scope, budget and models remain distinct and proposed",()=>{
 const e=getEnvironmentalProtocol("epa-water-reuse"),n=getEnvironmentalProtocol("noaa-hazard-decisions");
 assert.equal(e.submissionDeadline,"2026-11-09T04:59:00Z");assert.equal(n.submissionDeadline,"2027-02-10T07:59:00Z");
 assert.equal(e.planningBudget,100000);assert.equal(n.planningBudget,480000);
 for(const p of [e,n]){assert.equal(p.noveltyState,"HYPOTHESIS_REQUIRES_PRIOR_ART_REVIEW");assert.equal(p.methodExecution,"HUMAN_SELECTION_REQUIRED_NOT_INVOKED");assert.ok(p.comparator.length>=3);}
 e.aims[0]="changed locally";assert.notEqual(getEnvironmentalProtocol("epa-water-reuse").aims[0],e.aims[0]);
});
test("prospective organization and owner-designated PI cannot become commitment or eligibility evidence",()=>{
 const x=exportEnvironmentalResearch("epa-water-reuse",{pi:"Named owner",partners:[{organization:"Candidate county",proposedRole:"Access and local context",state:"PROSPECTIVE"}]});
 assert.equal(x.pi.role,"OWNER_DESIGNATED_NOT_ELIGIBILITY_CERTIFICATION");assert.equal(x.externalCommitments,false);assert.equal(x.externalSubmissionAuthorized,false);
 assert.throws(()=>exportEnvironmentalResearch("epa-water-reuse",{pi:"Named owner",partners:[{organization:"Candidate county",proposedRole:"Access",state:"COMMITTED" as any}]}));
});
const replay=():WaterReplayInput=>({decisionAt:"2026-11-07T12:00:00Z",requiredMetrics:["turbidity"],expectedUnits:{turbidity:"NTU"},records:[{sourceId:"sensor-a",lineageId:"plant-a-sensor-a",metric:"turbidity",unit:"NTU",value:0,observedAt:"2026-11-07T11:59:00Z",availableAt:"2026-11-07T11:59:10Z",calibrationUntil:"2026-12-01T00:00:00Z",kind:"OBSERVED"}]});
test("an actual zero remains zero; consistent metadata never means safe water",()=>{
 const r=reviewWaterReplay(replay());assert.equal(r.observedRecords,1);assert.deepEqual(r.missingObservedMetrics,[]);assert.equal(r.state,"METADATA_CONSISTENT_NOT_SAFETY_VALIDATED");assert.equal(r.waterSafe,null);assert.equal(r.contaminationDetected,null);assert.equal(r.actionAuthorized,false);
});
test("future receipt, invalid units, expired calibration and null values each prevent measured evidence admission",()=>{
 for(const patch of [{availableAt:"2026-11-07T12:01:00Z"},{unit:"mg/L"},{calibrationUntil:"2026-11-01T00:00:00Z"},{value:null}]){
  const x=replay();Object.assign(x.records[0],patch);const r=reviewWaterReplay(x);assert.equal(r.observedRecords,0);assert.deepEqual(r.missingObservedMetrics,["turbidity"]);assert.ok(r.issues.length);
 }
});
test("model and synthetic records never satisfy missing observed metrics",()=>{
 for(const kind of ["MODELED","SYNTHETIC"] as const){const x=replay();x.records[0].kind=kind;const r=reviewWaterReplay(x);assert.equal(r.observedRecords,0);assert.equal(r.modeledOrSyntheticRecords,1);assert.deepEqual(r.missingObservedMetrics,["turbidity"]);}
});
test("duplicates and multiple displays of one source never become independent corroboration",()=>{
 const x=replay();x.records.push({...x.records[0]});let r=reviewWaterReplay(x);assert.equal(r.admissibleRecords,1);assert.equal(r.lineageCount,1);assert.ok(r.issues.some(i=>i.includes("duplicate")));
 x.records[1].sourceId="repackaged-display";r=reviewWaterReplay(x);assert.equal(r.admissibleRecords,2);assert.equal(r.lineageCount,1);assert.ok(r.issues.some(i=>i.includes("share lineage")));
});
test("malformed, oversized and ambiguous replay requests are rejected",()=>{
 for(const x of [null,{}, {...replay(),decisionAt:"2026-11-07 12:00"},{...replay(),records:Array(501).fill(replay().records[0])},{...replay(),requiredMetrics:["turbidity","turbidity"]}])assert.throws(()=>reviewWaterReplay(x));
});
