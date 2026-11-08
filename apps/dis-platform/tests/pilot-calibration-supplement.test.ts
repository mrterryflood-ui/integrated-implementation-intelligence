import test from "node:test";
import assert from "node:assert/strict";
import {getCalibrationSupplement,validateCalibrationSupplement,calibrationExplanations} from "../lib/pilot-calibration-supplement";
import {colorectalEvidenceAction} from "../lib/evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";

test("source-matched county, six ecological constructs and three survey conditions remain separately scoped",()=>{
 const s=getCalibrationSupplement();
 assert.deepEqual(s.county.rows.map(r=>[r.late.rate_per_100k,r.late.ci95,r.late.late_share_percent]),[[29.9,[26.8,33.2],63.7],[23.9,[23.3,24.6],63.4]]);
 assert.equal(s.county.contrasts.late_stage_rate_difference,6);
 assert.equal(s.national.correlations.length,6);
 assert.equal(s.national.states,50);
 assert.deepEqual(s.survey.conditions.map(c=>c.publishedPercent),[6.2,8.7,7.8]);
 assert.deepEqual(s.survey.conditions.map(c=>c.eligibilitySensitivity.n_valid),[4814,4802,4809]);
 assert.notEqual(s.survey.publicCsvSha256,s.sources.find(x=>x.id==="nsfg_female")!.sha256);
 assert.equal(calibrationExplanations(s).county.status,"DESCRIPTIVE_ONLY");
 assert.equal(calibrationExplanations(s).survey.status,"DESCRIPTIVE_ONLY");
});
test("the actual investigation retains every displayed calibrated field without overwriting historical measures",()=>{
 const x=colorectalEvidenceAction();const h=buildEvidenceActionCaseHandoff(x.program,x.bridge);
 assert.deepEqual(h.report.calibratedEvidence,x.calibratedEvidence);
 assert.deepEqual(h.report.sourceIndicators.map(m=>m.value),[30.4,63.3,76]);
 assert.ok(h.report.sourceIndicators.every(m=>m.period.includes("2018–2022")));
 assert.equal(h.report.calibratedEvidence!.county.period,"2019-2023");
 assert.ok(new TextEncoder().encode(JSON.stringify(h.report)).length<64000);
 assert.equal(h.report.interventionAuthorized,false);
 const extended=buildEvidenceActionCaseHandoff(x.program,x.bridge,{publicAggregateConfirmed:true,additionalGaps:[{id:"new-capacity",severity:"IMPLEMENTATION_REQUIRED",problem:"Capacity not observed",ownerRole:"Proposed operations lead",nextEvidence:"Measure demand and waiting times"}],notes:[]});
 assert.deepEqual(extended.report.calibratedEvidence,x.calibratedEvidence);
 assert.ok(extended.report.decisionBrief!.openGapIds.includes("new-capacity"));
});
test("source, period, sex and frame changes require a new reconciled snapshot",()=>{
 for(const mutate of [
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.sources[0].sha256="changed";},
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.sources[0].id=s.sources[1].id;},
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.county.period="2018-2022";},
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.national.states=53;},
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.national.scope=s.national.scope.replace("breast: female","breast: both sexes");},
  (s:ReturnType<typeof getCalibrationSupplement>)=>{s.sources[0].capturedAt="2026-02-30T12:00:00.123456+00:00";}
 ]){const s=getCalibrationSupplement();mutate(s);assert.throws(()=>validateCalibrationSupplement(s),/Calibration supplement/);}
});
test("missing or impossible values never become zeros or fabricated precision",()=>{
 const missing=getCalibrationSupplement();missing.county.rows[0].late.rate_per_100k=null as unknown as number;
 assert.throws(()=>validateCalibrationSupplement(missing),/rate/);
 const impossible=getCalibrationSupplement();impossible.county.rows[0].late.ci95[0]=90;
 assert.throws(()=>validateCalibrationSupplement(impossible),/interval/);
 const correlation=getCalibrationSupplement();correlation.national.correlations[0].conditionalIidFisher95=[-2,2];
 assert.throws(()=>validateCalibrationSupplement(correlation),/correlation/);
});
test("survey group contrast uncertainty cannot be relabeled as crude diagnosis uncertainty",()=>{
 const s=getCalibrationSupplement();
 assert.deepEqual(s.survey.standardization.bands,[[20,29],[30,39],[40,50]]);
 assert.equal(s.survey.literalInterview20to49N,4855);
 assert.equal(s.survey.eligibilityAge50SensitivityN,4856);
 for(const c of s.survey.conditions)assert.equal(c.publicGroups[3].label,"non_Hispanic_other_or_multiple");
 s.survey.conditions[0].publicGroups[0].standardizedGroupMinusOverall.estimand="CRUDE_GROUP_PREVALENCE";
 assert.throws(()=>validateCalibrationSupplement(s),/contrast/);
 const recode=getCalibrationSupplement();recode.survey.conditions[0].publicGroups[3].label="Asian";
 assert.throws(()=>validateCalibrationSupplement(recode),/group definitions/);
 const wrongGroup=getCalibrationSupplement();wrongGroup.survey.conditions[0].publicGroups[0].label="non_Hispanic_Asian";
 assert.throws(()=>validateCalibrationSupplement(wrongGroup),/group definitions/);
 const impossible=getCalibrationSupplement();impossible.survey.conditions[0].publishedPercent=101;
 assert.throws(()=>validateCalibrationSupplement(impossible),/published survey/);
 const emptyWeights=getCalibrationSupplement();emptyWeights.survey.standardization.weights=[];
 assert.throws(()=>validateCalibrationSupplement(emptyWeights),/standardization/);
});
test("clinical authority, missing effects and snapshot ownership cannot be upgraded by metadata",()=>{
 const authority=getCalibrationSupplement();authority.authority.clinicalActionAuthorized=true;
 assert.throws(()=>validateCalibrationSupplement(authority),/authority/);
 const missing=getCalibrationSupplement();missing.missing.interventionEffect=0 as unknown as null;
 assert.throws(()=>validateCalibrationSupplement(missing),/unknowns/);
 const changed=getCalibrationSupplement();changed.county.contrasts.late_stage_rate_difference=9;
 assert.throws(()=>validateCalibrationSupplement(changed),/contrast/);
 const duplicate=getCalibrationSupplement();duplicate.national.correlations[1]=structuredClone(duplicate.national.correlations[0]);
 assert.throws(()=>validateCalibrationSupplement(duplicate),/distinct/);
 const negative=getCalibrationSupplement();negative.survey.conditions[0].eligibilitySensitivity.n_valid=-1;negative.survey.conditions[0].eligibilitySensitivity.n_excluded=4857;
 assert.throws(()=>validateCalibrationSupplement(negative),/domain/);
 const swapped=getCalibrationSupplement() as unknown as Record<string,any>;delete swapped.authority.clinicalActionAuthorized;swapped.authority.unrelatedFlag=false;
 assert.throws(()=>validateCalibrationSupplement(swapped as ReturnType<typeof getCalibrationSupplement>),/authority/);
});
