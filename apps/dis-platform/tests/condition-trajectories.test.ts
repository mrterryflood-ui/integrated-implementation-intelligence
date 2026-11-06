import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewAnnualTrajectories,type AnnualObservation} from "../lib/condition-trajectories";

function row(year:number,overrides:Partial<AnnualObservation>={}):AnnualObservation{
 return {condition:"COLORECTAL_CANCER",geography:"Mississippi",geographyLevel:"STATE",
  measure:"ALL_STAGE_INCIDENCE",periodStartYear:year,periodEndYear:year,
  value:10+(year-2018),reporting:"OBSERVED",unit:"PER_100K",
  sourceId:"cdc-uscs",sourceVersion:"test-release-v1",
  populationDefinition:"Resident population, 2000 US age adjusted",
  numeratorDefinition:"Annual invasive incident colorectal tumors",
  denominatorDefinition:"State resident population per 100000",
  sex:"ALL",raceEthnicity:"All races and ethnicities",
  ageStandard:"2000 US standard",stageDefinition:"ALL STAGES",
  ascertainment:"CDC NPCR and NCI SEER registry, annual",...overrides};
}
const full=()=>[2018,2019,2020,2021,2022].map(y=>row(y));

test("no invented annual or women's-state trajectories from existing pooled snapshots",()=>{
 const s=reviewAnnualTrajectories([]);
 assert.equal(s.status,"NO_ANNUAL_OBSERVATIONS");
 assert.equal(s.series.length,0);
 assert.match(s.issues.join(" "),/five-year state snapshot/);
 assert.equal(s.causalAttribution,"NOT_ESTABLISHED");
 assert.equal(s.methodExecution,"HUMAN_SELECTION_SEPARATE_NO_REMOTE_CALL");
});
test("reject pooled NCI release disguised as one annual point",()=>{
 const s=reviewAnnualTrajectories([row(2019,{periodEndYear:2023})]);
 assert.equal(s.status,"INPUT_INVALID");
 assert.match(s.issues.join(" "),/pooled multi-year/);
});
test("five consecutive compatible annual measurements produce descriptive slope, not causal effect",()=>{
 const s=reviewAnnualTrajectories(full());
 assert.equal(s.status,"DESCRIPTIVE_ONLY");
 assert.equal(s.series[0].status,"DESCRIPTIVE_SERIES_ONLY");
 assert.equal(s.series[0].slopePerYear,1);
 assert.equal(s.series[0].firstValue,10);
 assert.equal(s.series[0].lastValue,14);
 assert.equal(s.series[0].percentChange,40);
 assert.equal(s.sourceVerification,"OPERATOR_SUPPLIED_NOT_INDEPENDENTLY_REPRODUCED");
 assert.equal(s.conclusionsMayBeAppliedToIndividuals,false);
});
test("different disease series stay independent; no cross-disease correlation is calculated",()=>{
 const s=reviewAnnualTrajectories([...full(),...full().map(r=>({...r,condition:"LUNG_CANCER" as const,value:r.value!+2}))]);
 assert.equal(s.status,"DESCRIPTIVE_ONLY");
 assert.equal(s.series.length,2);
 assert.deepEqual(s.series.map(x=>x.condition),["COLORECTAL_CANCER","LUNG_CANCER"]);
 assert.equal("crossDiseaseCorrelation" in s,false);
});
test("missing years and suppressed values never become zero or trend estimates",()=>{
 const gap=reviewAnnualTrajectories(full().filter(x=>x.periodStartYear!==2020));
 assert.equal(gap.status,"INSUFFICIENT_EVIDENCE");
 assert.deepEqual(gap.series[0].missingYears,[2020]);
 assert.equal(gap.series[0].slopePerYear,null);
 const suppressed=reviewAnnualTrajectories(full().map(r=>r.periodStartYear===2020?{...r,reporting:"SUPPRESSED" as const,value:null}:r));
 assert.equal(suppressed.series[0].status,"INSUFFICIENT_ANNUAL_DATA");
 assert.equal(suppressed.series[0].slopePerYear,null);
});
test("same series with inconsistent provenance or demographics fails comparability",()=>{
 const bad=full().map(r=>r.periodStartYear===2020?{...r,denominatorDefinition:"Different age cohort"}:r);
 const s=reviewAnnualTrajectories(bad);
 assert.equal(s.series[0].status,"NONCOMPARABLE_DEFINITIONS");
 assert.equal(s.series[0].slopePerYear,null);
 assert.match(s.series[0].reasons.join(" "),/Numerator, denominator/);
});
test("reject wrong percent units, invalid CIs, individual identifiers, and pooled NSFG",()=>{
 assert.equal(reviewAnnualTrajectories([row(2020,{measure:"LATE_STAGE_CASE_SHARE"})]).status,"INPUT_INVALID");
 assert.equal(reviewAnnualTrajectories([row(2020,{confidenceInterval:[14,15]})]).status,"INPUT_INVALID");
 const personal={...row(2020),patientId:"1234567"};
 assert.match(reviewAnnualTrajectories([personal]).issues.join(" "),/identifiers/);
 assert.match(reviewAnnualTrajectories([row(2020,{sourceId:"nchs-nsfg-2022-2023"})]).issues.join(" "),/pooled estimates/);
});
test("six-condition UI uses the actual annual preflight and never auto-runs an RPLICE method",()=>{
 const page=readFileSync("app/research-program/six-conditions/page.tsx","utf8");
 const panel=readFileSync("app/research-program/six-conditions/trajectory-panel.tsx","utf8");
 assert.match(page,/TrajectoryPanel/);
 assert.match(panel,/reviewAnnualTrajectories/);
 assert.match(panel,/onClick=\{assess\}/);
 assert.doesNotMatch(panel,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
});
