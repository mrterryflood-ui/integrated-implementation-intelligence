import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {WOMENS_CONDITIONS,STATE_WOMENS_CONDITION_STATUS,threePlusThreeResearchSnapshot} from "../lib/six-condition-research";
test("CDC national 2022-2023 gynecologic diagnosis benchmarks are correctly bounded",()=>{
 assert.equal(WOMENS_CONDITIONS.length,3);
 assert.deepEqual(WOMENS_CONDITIONS.map(x=>x.nationalDiagnosedPercent),[6.2,8.7,7.8]);
 assert.deepEqual(WOMENS_CONDITIONS.map(x=>x.nhBlackDiagnosedPercent),[3.7,4.4,12.5]);
 assert.deepEqual(WOMENS_CONDITIONS.map(x=>x.nhWhiteDiagnosedPercent),[8.1,9.9,7.1]);
});
test("no fabricated Mississippi Texas Colorado state-specific gynecologic rates",()=>{
 assert.deepEqual(STATE_WOMENS_CONDITION_STATUS.map(x=>x.state),["Mississippi","Texas","Colorado"]);
 assert.ok(STATE_WOMENS_CONDITION_STATUS.every(x=>x.stateLevelObservation==="NOT_OBSERVED_IN_NCHS_SOURCE"));
 const s=threePlusThreeResearchSnapshot();
 assert.equal(s.crossConditionCorrelation,"NOT_ESTIMABLE_FROM_NONCOMPARABLE_NATIONAL_AND_STATE_MEASURES");
 assert.equal(s.causalContribution,"NOT_ESTABLISHED");
 assert.equal(s.independentReplication,"NOT_PERFORMED");
});
test("DIS preserves dedicated six-condition journey and original CDC source",()=>{
 const page=readFileSync("app/research-program/six-conditions/page.tsx","utf8");
 assert.match(page,/WOMENS_CONDITIONS/);
 assert.match(page,/state estimates|state-specific/i);
 assert.match(page,/NCI|Cancer|cancer/);
});
