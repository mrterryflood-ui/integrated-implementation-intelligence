import test from "node:test";
import assert from "node:assert/strict";
import {sourceDiscrepancies,HARRIS_HISTORICAL_CONFLICT as h} from "../lib/source-discrepancy-review";

test("Harris source rows belong to the displayed 2018-2022 and 2019-2023 windows",()=>{
 assert.equal(h.previous.period,"2018-2022");assert.equal(h.candidate.period,"2019-2023");
 assert.match(h.previous.sourceVersion,/2024/);assert.match(h.candidate.sourceVersion,/2025/);
});
test("source drift retains observation-period, registry-vintage and value changes together",()=>{
 const event=sourceDiscrepancies([h.previous],[h.candidate])[0];
 assert.ok(event.changes.includes("period"));assert.ok(event.changes.includes("sourceVersion"));assert.ok(event.changes.includes("value"));
 assert.equal(event.decision,"NO_AUTOMATIC_REPLACEMENT");assert.equal(event.verifiedBy,null);
});
test("review records preserve both supplied vintages without aliasing mutable inputs",()=>{
 const old=structuredClone(h.previous),next=structuredClone(h.candidate);
 const event=sourceDiscrepancies([old],[next])[0];old.value=99;next.value=88;
 assert.equal(event.previous.value,23.3);assert.equal(event.candidate.value,23.9);
});
test("an unchanged estimate does not hide a changed observation window",()=>{
 assert.deepEqual(sourceDiscrepancies([h.previous],[{...h.previous,period:"2019-2023"}])[0].changes,["period"]);
});
test("a retrieval-date change alone does not assert that registry data changed",()=>{
 assert.deepEqual(sourceDiscrepancies([h.previous],[{...h.previous,retrievedAt:"2026-11-08"}]),[]);
});
test("period-matched source arithmetic differs from the withdrawn mixed-window contrast",()=>{
 // Source-transcribed aggregate fixtures; no treatment, trend or independent-review claim.
 const earlier={period:"2018-2022",hinds:30.4,harris:23.3};
 const later={period:"2019-2023",hinds:29.9,harris:23.9};
 assert.ok(Math.abs(earlier.hinds-earlier.harris-7.1)<1e-10);
 assert.ok(Math.abs(later.hinds-later.harris-6.0)<1e-10);
 assert.notEqual(earlier.period,later.period);
 assert.ok(Math.abs(later.hinds/later.harris-1.2510460251046025)<1e-10);
});
