import test from "node:test";
import assert from "node:assert/strict";
import {SIX_STUDY_SITES,STUDY_CONDITIONS,validateSixStudySites,POST_STUDY_HEALTHCARE_EQUITY_HANDOFF,FOCAL_STATES} from "../lib/research-geography-cohorts";
test("six states, five cities plus a Colorado statewide comparator are correctly bounded",()=>{
 const result=validateSixStudySites();
 assert.equal(result.siteCount,6);assert.equal(result.stateCount,6);
 assert.equal(result.uniqueFips,true);assert.equal(result.newYorkCityFiveCounties,true);
 assert.equal(FOCAL_STATES.length,6);
 const ny=SIX_STUDY_SITES.find(s=>s.id==="NEW_YORK_CITY_NY")!;
 assert.deepEqual([...ny.countyFips],["36005","36047","36061","36081","36085"]);
 assert.ok(ny.geographyCaveat.includes("age-adjusted"));
 assert.equal(SIX_STUDY_SITES.find(s=>s.id==="COLORADO_CO")!.scope,"STATEWIDE");
});
test("cancers and women’s health hypotheses maintain distinct outcome definitions and no fabricated state prevalence",()=>{
 assert.equal(STUDY_CONDITIONS.length,6);
 assert.equal(STUDY_CONDITIONS.filter(x=>x.category==="CANCER").length,3);
 assert.equal(STUDY_CONDITIONS.filter(x=>x.category==="WOMENS_HEALTH").length,3);
 assert.ok(STUDY_CONDITIONS.filter(x=>x.category==="WOMENS_HEALTH").every(x=>/no defensible|not harmonized|remain open/.test(x.dataState)));
});
test("healthcare-platform transfer remains explicitly deferred pending evidence and human decision",()=>{
 assert.equal(POST_STUDY_HEALTHCARE_EQUITY_HANDOFF.phase,"DEFERRED_UNTIL_STUDY_COMPLETE");
 assert.match(POST_STUDY_HEALTHCARE_EQUITY_HANDOFF.now,/NOT_STARTED/);
 assert.match(POST_STUDY_HEALTHCARE_EQUITY_HANDOFF.trigger,/human approval/);
});
