import test from "node:test";
import assert from "node:assert/strict";
import {agreesWithComputedDifference} from "../lib/computed-difference";
import {getCrcMarginals,validateCrcMarginals,matchesReproducedMarginalReference} from "../lib/crc-marginal-supplement";
import {getCalibrationSupplement,validateCalibrationSupplement,matchesReproducedCalibrationReference} from "../lib/pilot-calibration-supplement";

test("Next compiled JSON's observed one-ULP contrast survives validation without gaining exact source identity",()=>{
 const s=getCrcMarginals(),row=s.strata[3];
 assert.equal(row.counties[0].late.ratePer100k,28.3);assert.equal(row.counties[1].late.ratePer100k,29.9);
 assert.equal(row.lateRateDifference,-1.5999999999999979);
 // Extracted from the failing production SSR JSON.parse module; source JSON
 // remained -1.5999999999999979 while the emitted token was the adjacent value.
 row.lateRateDifference=-1.599999999999998;
 assert.doesNotThrow(()=>validateCrcMarginals(s));
 assert.equal(matchesReproducedMarginalReference(s),false,"arithmetic agreement must not loosen source-content identity");
 row.lateRateDifference=-1.5999999999999983;
 assert.throws(()=>validateCrcMarginals(s),/contrast/);
 row.lateRateDifference=-1.5;
 assert.throws(()=>validateCrcMarginals(s),/contrast/);
});
test("the same county contrast boundary allows only adjacent binary64 representation",()=>{
 const s=getCalibrationSupplement();s.county.contrasts.all_stage_rate_difference=8.4;
 assert.doesNotThrow(()=>validateCalibrationSupplement(s));
 assert.equal(matchesReproducedCalibrationReference(s),false);
 s.county.contrasts.all_stage_rate_difference=8.400000000000002;
 assert.throws(()=>validateCalibrationSupplement(s),/contrast/);
});
test("computed contrasts preserve negative values and exact zero and deny non-finite, string and sign substitutions",()=>{
 assert.equal(agreesWithComputedDifference(-1.599999999999998,28.3,29.9),true);
 assert.equal(agreesWithComputedDifference(0,62.1,62.1),true);
 for(const value of [Number.MIN_VALUE,-Number.MIN_VALUE,NaN,Infinity,-Infinity,"0",null])assert.equal(agreesWithComputedDifference(value,62.1,62.1),false);
 assert.equal(agreesWithComputedDifference(1.599999999999998,28.3,29.9),false);
 assert.equal(agreesWithComputedDifference(0,Number.MIN_VALUE,0),false);
 assert.equal(agreesWithComputedDifference(1,Infinity,1),false);
 assert.equal(agreesWithComputedDifference(Infinity,Number.MAX_VALUE,-Number.MAX_VALUE),false);
});
test("suppression requires null contrasts and cannot become a zero-valued observation",()=>{
 const s=getCrcMarginals(),row=s.strata[0],late=row.counties[0].late;
 Object.assign(late,{state:"SUPPRESSED_OR_MISSING",ratePer100k:null,ci95:null,lateCaseSharePercent:null});
 Object.assign(row,{lateRateDifference:null,lateShareDifferencePp:null});
 assert.doesNotThrow(()=>validateCrcMarginals(s));
 assert.equal(matchesReproducedMarginalReference(s),false);
 row.lateRateDifference=0;assert.throws(()=>validateCrcMarginals(s),/contrast/);
 assert.equal(agreesWithComputedDifference(null,null,5),true);
 assert.equal(agreesWithComputedDifference(0,null,5),false);
 assert.equal(agreesWithComputedDifference(null,null,NaN),false);
});
test("binary64 adjacency also holds at an exponent boundary without permitting two steps",()=>{
 assert.equal(agreesWithComputedDifference(1-Number.EPSILON/2,1,0),true);
 assert.equal(agreesWithComputedDifference(1+Number.EPSILON,1,0),true);
 assert.equal(agreesWithComputedDifference(1-Number.EPSILON,1,0),false);
 assert.equal(agreesWithComputedDifference(1+2*Number.EPSILON,1,0),false);
});
