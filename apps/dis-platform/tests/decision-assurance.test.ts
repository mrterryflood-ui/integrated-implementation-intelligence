import test from "node:test";
import assert from "node:assert/strict";
import {auditDecisionPacket,LENSES,type DecisionPacket} from "../lib/decision-assurance";
import {SYNTHETIC_CASES} from "../lib/decision-assurance-cases";

const expected:Record<string,string>={
  F01:"SCOPE_MISATTRIBUTION",
  F02:"SHARED_PROVENANCE",
  F03:"INCOMPATIBLE_CONSTRUCTS",
  F04:"SCOPE_ALIGNMENT_UNVERIFIED",
  F05:"TRIGGER_TOO_LATE",
  F06:"MEASUREMENT_REACTIVITY",
  L01:"DENOMINATOR_BREAK",
  L02:"SUCCESS_NOT_SUSTAINMENT",
  L03:"CORE_FUNCTION_UNTESTED",
  L04:"METRIC_INCENTIVE_SHIFT",
  L05:"REOPEN_OBJECTIVE",
  L06:"UNSUPPORTED_INFORMATION_VALUE"
};

test("all twelve cases are present and distinct",()=>{
  assert.equal(SYNTHETIC_CASES.length,12);
  assert.equal(new Set(SYNTHETIC_CASES.map(x=>x.id)).size,12);
  assert.deepEqual(new Set(SYNTHETIC_CASES.map(x=>x.id)),new Set(Object.keys(expected)));
});

for(const sample of SYNTHETIC_CASES){
  test("synthetic fixture "+sample.id+": "+sample.title,()=>{
    const audit=auditDecisionPacket(sample);
    assert.equal(audit.schemaVersion,"dis-decision-assurance-research-v1");
    assert.equal(audit.scientificValidation,"NOT_ESTABLISHED");
    assert.equal(audit.actionAuthorized,false);
    assert.equal(audit.state,"HOLD_UNSUPPORTED_CLAIM");
    assert.ok(audit.findings.some(x=>x.code===expected[sample.id]),JSON.stringify(audit.findings));
    assert.equal(audit.observations.length,sample.observations.length);
  });
}

test("shared declared lineage is not counted as independent corroboration",()=>{
  const sample=SYNTHETIC_CASES.find(x=>x.id==="F02")!;
  const r=auditDecisionPacket(sample);
  assert.equal(r.distinctDeclaredOrigins,1);
  assert.equal(r.findings.find(x=>x.code==="SHARED_PROVENANCE")?.severity,"HOLD");
});

test("same unit does not imply the same construct",()=>{
  const base=SYNTHETIC_CASES.find(x=>x.id==="F03")!;
  const p:DecisionPacket={...base,observations:base.observations.map(x=>({...x,unit:"scalar",scope:"Basin A"}))};
  const r=auditDecisionPacket(p);
  assert.ok(r.findings.some(f=>f.code==="INCOMPATIBLE_CONSTRUCTS"));
  assert.ok(!r.findings.some(f=>f.code==="INCOMPATIBLE_UNITS"));
});

test("no arbitrary universal freshness threshold is applied",()=>{
  const base=SYNTHETIC_CASES.find(x=>x.id==="F01")!;
  const p:DecisionPacket={...base,comparison:undefined};
  const r=auditDecisionPacket(p);
  assert.equal(r.observations[0].freshness,"NOT_ASSESSED");
  assert.ok(!r.findings.some(f=>f.code==="STALE_FOR_DECISION"));
  const stale=auditDecisionPacket({...p,observations:p.observations.map((o,i)=>i===0?{...o,maxAgeMinutes:10}:o)});
  assert.ok(stale.findings.some(f=>f.code==="STALE_FOR_DECISION"));
});

test("future and post-decision records cannot justify an earlier decision",()=>{
  const base=SYNTHETIC_CASES.find(x=>x.id==="F01")!;
  const p:DecisionPacket={...base,comparison:undefined,observations:[{...base.observations[0],observedAt:"2026-11-05T09:06:00Z",receivedAt:"2026-11-05T09:07:00Z"}]};
  const r=auditDecisionPacket(p);
  assert.ok(r.findings.some(f=>f.code==="FUTURE_OBSERVATION"));
  assert.ok(r.findings.some(f=>f.code==="NOT_AVAILABLE_AT_DECISION"));
});

test("goals can be reopened without having a numerical superiority score",()=>{
  const sample=SYNTHETIC_CASES.find(x=>x.id==="L05")!;
  const r=auditDecisionPacket(sample);
  assert.equal(typeof (r as unknown as Record<string,unknown>).truthScore,"undefined");
  assert.equal(r.actionAuthorized,false);
  assert.ok(r.temporalReview.some(q=>q.toLowerCase().includes("day after success")));
  assert.ok(r.findings.some(x=>x.code==="REOPEN_OBJECTIVE"));
});

test("conceptual personas are analytical prompts, not evidence sources",()=>{
  assert.ok(LENSES.length>=6);
  assert.ok(LENSES.every(l=>l.evidenceState==="ANALYTICAL_PROMPT_NOT_TESTIMONY"));
  const base=SYNTHETIC_CASES.find(x=>x.id==="F02")!;
  const p:DecisionPacket={...base,observations:base.observations.map((x,i)=>i===2?{...x,kind:"PERSONA"}:x)};
  const r=auditDecisionPacket(p);
  assert.equal(r.distinctDeclaredOrigins,1);
  assert.ok(r.findings.some(x=>x.code==="PERSPECTIVE_NOT_OBSERVATION"));
});

test("the clear structured packet still requires human review, not authorization",()=>{
  const p:DecisionPacket={
    id:"clean",title:"Compatible records",question:"What changed?",goal:"Describe a measured trend.",
    asOf:"2026-11-05T09:05:00Z",
    observations:[
      {id:"one",label:"One",origin:"A",construct:"level",unit:"m",scope:"one location",observedAt:"2026-11-05T09:01:00Z",receivedAt:"2026-11-05T09:02:00Z",kind:"MEASURED",validated:true,maxAgeMinutes:20},
      {id:"two",label:"Two",origin:"B",construct:"level",unit:"m",scope:"one location",observedAt:"2026-11-05T09:03:00Z",receivedAt:"2026-11-05T09:04:00Z",kind:"MEASURED",validated:true,maxAgeMinutes:20},
    ],
    comparison:{intent:"CORROBORATE",ids:["one","two"]}
  };
  const r=auditDecisionPacket(p);
  assert.deepEqual(r.findings,[]);
  assert.equal(r.state,"HUMAN_REVIEW_REQUIRED");
  assert.equal(r.actionAuthorized,false);
  assert.equal(r.scientificValidation,"NOT_ESTABLISHED");
});

test("no false independence when shared origin present but no explicit corroboration claim",()=>{
  const p=SYNTHETIC_CASES.find(x=>x.id==="F02")!;
  const r=auditDecisionPacket({...p,comparison:{...p.comparison!,claimedIndependent:false}});
  assert.equal(r.findings.find(x=>x.code==="SHARED_PROVENANCE")?.severity,"REVIEW");
});

test("unsupported information-value number never becomes an observed monetary gain",()=>{
  const p=SYNTHETIC_CASES.find(x=>x.id==="L06")!;
  const r=auditDecisionPacket(p);
  assert.ok(r.findings.some(x=>x.code==="UNSUPPORTED_INFORMATION_VALUE"));
  assert.equal("valueOfInformation" in r,false);
});

test("scope mismatches are not repaired by counting more sensors",()=>{
  const base=SYNTHETIC_CASES.find(x=>x.id==="F04")!;
  const p:DecisionPacket={...base,observations:[...base.observations,{...base.observations[0],id:"east2",origin:"additional-source"}]};
  const r=auditDecisionPacket({...p,comparison:{...base.comparison!,ids:["east","east2","west"]}});
  assert.equal(r.state,"HOLD_UNSUPPORTED_CLAIM");
  assert.ok(r.findings.some(x=>x.code==="SCOPE_ALIGNMENT_UNVERIFIED"));
});

test("adequate warning time cannot be inferred from a partly insufficient interval",()=>{
  const p=SYNTHETIC_CASES.find(x=>x.id==="F05")!;
  const r=auditDecisionPacket({...p,decision:{implementationHours:48,warningHoursMin:36,warningHoursMax:60}});
  assert.ok(r.findings.some(x=>x.code==="TRIGGER_LEAD_TIME_UNCERTAIN"));
  assert.ok(!r.findings.some(x=>x.code==="TRIGGER_TOO_LATE"));
});

test("post-success responsibilities must be planned before success, not only after it",()=>{
  const base=SYNTHETIC_CASES.find(x=>x.id==="L02")!;
  const r=auditDecisionPacket({...base,stewardship:{initiativePlanned:true,milestoneReached:false,accountableOwner:"",sustainedResources:false,fidelityPlan:false}});
  assert.ok(r.findings.some(x=>x.code==="POST_SUCCESS_PLAN_MISSING"));
  assert.equal(r.state,"HOLD_UNSUPPORTED_CLAIM");
  const planned=auditDecisionPacket({...base,stewardship:{initiativePlanned:true,milestoneReached:false,accountableOwner:"Program steward",sustainedResources:true,fidelityPlan:true}});
  assert.ok(!planned.findings.some(x=>x.code==="POST_SUCCESS_PLAN_MISSING"));
  assert.equal(planned.actionAuthorized,false);
});
