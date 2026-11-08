import test from "node:test";
import assert from "node:assert/strict";
import {reviewCounterfactual,type CounterfactualRequest} from "../lib/evidence-action-bridge";
const panel=(a=[10,12,14],b=[9,9,9]):CounterfactualRequest=>({
 condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic units",interventionYear:2021,
 commonMeasurementVersion:"Declared common method, not source verified",
 comparisonRationale:"Declared comparison rationale, not independent review",
 parallelTrendsEvidence:"Confident prose alleging reviewed parallel trends",
 competingChangesEvidence:"Declared review of simultaneous changes in both places",
 spilloverAssessment:"Declared review of cross-area service delivery",
 independentReviewer:"Self-reported reviewer; identity not authenticated",
 treated:{site:"Synthetic A",populationFrame:"Same synthetic frame",observations:[...a.map((value,i)=>({year:2018+i,value,denominator:100})),{year:2021,value:16,denominator:100},{year:2022,value:18,denominator:100}]},
 comparator:{site:"Synthetic B",populationFrame:"Same synthetic frame",observations:[...b.map((value,i)=>({year:2018+i,value,denominator:100})),{year:2021,value:10,denominator:100},{year:2022,value:11,denominator:100}]}
});
test("current workbench receives numeric pretrend challenge, not a prose-only declaration",()=>{
 const r=reviewCounterfactual(panel());
 assert.equal(r.pretrendDiagnostics.gapSlopePerYear,2);
 assert.ok(r.gaps.some(s=>s.includes("Observed preperiod slopes: treated 2, comparison 0, gap 2")));
 assert.equal(r.causalEffectEstablished,false);
});
test("zero slope nonlinear pattern is carried to existing UI issue list",()=>{
 const r=reviewCounterfactual(panel([10,14,10],[9,9,9]));
 assert.equal(r.pretrendDiagnostics.gapSlopePerYear,0);
 assert.equal(r.pretrendDiagnostics.gapRange,4);
 assert.ok(r.gaps.some(s=>s.includes("linear-gap residual RMS")));
});
test("parallel observed trajectories never certify the unobserved counterfactual",()=>{
 const r=reviewCounterfactual(panel([10,11,12],[9,10,11]));
 assert.equal(r.pretrendDiagnostics.parallelTrendsEstablished,false);
 assert.equal(r.gate,"CANDIDATE_FOR_INDEPENDENT_DESIGN_REVIEW");
 assert.equal(r.causalEffectEstablished,false);
});
test("malformed measurement keeps original readiness failures and diagnostic errors",()=>{
 const p=panel();p.treated.observations[0].value=null;
 const r=reviewCounterfactual(p);
 assert.equal(r.rawDifferenceInDifferences,null);
 assert.equal(r.pretrendDiagnostics.state,"INVALID_PANEL");
 assert.ok(r.gaps.some(s=>s.includes("MISSING_OR_NONFINITE_VALUE")));
});
