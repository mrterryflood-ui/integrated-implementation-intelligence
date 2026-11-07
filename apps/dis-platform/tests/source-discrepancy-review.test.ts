import test from "node:test";import assert from "node:assert/strict";
import {sourceDiscrepancies,HARRIS_HISTORICAL_CONFLICT} from "../lib/source-discrepancy-review";
test("NCI Harris discrepancy preserves both source values and requires human review",()=>{
 const {previous,candidate}=HARRIS_HISTORICAL_CONFLICT;
 const events=sourceDiscrepancies([previous],[candidate]);assert.equal(events.length,1);
 assert.equal(events[0].previous.value,23.3);assert.equal(events[0].candidate.value,23.9);
 assert.equal(events[0].state,"REVIEW_REQUIRED");assert.equal(events[0].decision,"NO_AUTOMATIC_REPLACEMENT");
 assert.ok(events[0].changes.includes("value"));assert.ok(events[0].changes.includes("sourceVersion"));
 assert.equal(previous.value,23.3);
});
test("unchanged source has no event, while a changed denominator or period triggers review",()=>{
 const p=HARRIS_HISTORICAL_CONFLICT.previous;
 assert.deepEqual(sourceDiscrepancies([p],[structuredClone(p)]),[]);
 const c={...p,period:"2019-2023",population:"Females only"};
 assert.deepEqual(sourceDiscrepancies([p],[c])[0].changes,["period","population"]);
});
test("duplicate IDs or invalid numeric evidence cannot be silently accepted",()=>{
 const p=HARRIS_HISTORICAL_CONFLICT.previous;
 assert.throws(()=>sourceDiscrepancies([p,p],[p]),/Duplicate prior/);
 assert.throws(()=>sourceDiscrepancies([p],[p,p]),/Duplicate candidate/);
 assert.throws(()=>sourceDiscrepancies([p],[{...p,value:NaN}]),/Invalid/);
});
