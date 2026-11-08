import test from "node:test";import assert from "node:assert/strict";
import {stageFlowAudit,ageStandardizedIncidence,pairedCorrelationAudit,assessMechanism} from "../lib/three-study-mechanism-audit";
test("stage shares shift when staging completeness changes, even with identical late-stage count",()=>{
 const a=stageFlowAudit({incidentDiagnoses:100,stagedDiagnoses:100,lateStageDiagnoses:40});
 const b=stageFlowAudit({incidentDiagnoses:100,stagedDiagnoses:80,lateStageDiagnoses:40});
 assert.equal(a.lateAmongStaged,.4);assert.equal(b.lateAmongStaged,.5);
 assert.equal(a.lateAmongAll,b.lateAmongAll);assert.equal(b.stagingCompleteness,.8);
});
test("age standardization uses age-specific rates and weights, not a crude stage-share ratio",()=>{
 const a=ageStandardizedIncidence([{ageBand:"young",cases:10,personYears:100000,standardWeight:.8},{ageBand:"older",cases:40,personYears:100000,standardWeight:.2}]);
 const b=ageStandardizedIncidence([{ageBand:"young",cases:10,personYears:100000,standardWeight:.2},{ageBand:"older",cases:40,personYears:100000,standardWeight:.8}]);
 assert.ok(a.per100k!==null&&b.per100k!==null);assert.equal(a.per100k,16);assert.equal(b.per100k,34);
 assert.equal(ageStandardizedIncidence([{ageBand:"all",cases:1,personYears:10,standardWeight:.5}]).status,"INVALID");
});
test("ecological association requires matched releases and does not certify causal mechanism",()=>{
 const rows=Array.from({length:6},(_,i)=>({unitId:"state-"+i,x:i,y:i*2,period:"2018-2022",sourceVersion:"v1"}));
 const r=pairedCorrelationAudit(rows);assert.equal(r.status,"DESCRIPTIVE_ONLY");assert.ok(r.pearson!==null&&Math.abs(r.pearson-1)<1e-12);
 assert.match(r.issues.join(" "),/does not establish/);
 assert.equal(pairedCorrelationAudit(rows.map((x,i)=>({...x,period:i?"2018-2022":"2019-2023"}))).status,"MEASUREMENT_BLOCK");
});
test("competing explanations remain unresolved even when someone checks independent verification",()=>{
 const x=assessMechanism({id:"M1",observationId:"S1",proposedMechanism:"Diagnostic capacity",rivalMechanism:"Different incidence",discriminatingEvidence:"Referral time series",possibleConfounders:["age"],wouldDisconfirm:"Similar delays with different capacity",reviewStatus:"SUPPORTED_DESCRIPTIVELY",independentReviewerVerified:true});
 assert.equal(x.causalMechanismEstablished,false);assert.equal(x.status,"REVIEW_REQUIRED");
});
test("finite but overflowing correlation cannot become descriptive evidence",()=>{
 const rows=Array.from({length:6},(_,i)=>({unitId:"state-"+i,x:i*1e154,y:i*1e154,period:"2019-2023",sourceVersion:"v1"}));
 const r=pairedCorrelationAudit(rows);assert.equal(r.status,"MEASUREMENT_BLOCK");assert.equal(r.pearson,null);assert.match(r.issues.join(" "),/overflow/i);
});
test("incidence event counts are not constrained by the numerical person-time exposure",()=>{
 const r=ageStandardizedIncidence([{ageBand:"all",cases:2,personYears:.5,standardWeight:1}]);
 assert.equal(r.status,"ARITHMETIC_ONLY");assert.equal(r.per100k,400000);
 const overflow=ageStandardizedIncidence([{ageBand:"all",cases:1e308,personYears:1e-308,standardWeight:1}]);
 assert.equal(overflow.status,"INVALID");assert.equal(overflow.per100k,null);
});
