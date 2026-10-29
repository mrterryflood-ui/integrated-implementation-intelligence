import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeIntake} from "../lib/consultation";
import {generateUnknowns} from "../lib/unknowns-radar";
const mortgage=sanitizeIntake({
 mission:"Create a Central Texas homeowner-first pre-foreclosure mortgage solutions CRM with voluntary house acquisition and flipping, also land parcels, GIS satellite imagery, county data, calling and AI.",
 geography:"Killeen Temple Waco Austin San Antonio Houston",
 stage:"Concept without live data",traction:"No confirmed completed transactions"
});
test("unknowns radar separates user requests from unasked high impact issues",()=>{
 const r=generateUnknowns(mortgage);
 assert.equal(r.mode,"REAL_ESTATE");
 assert.ok(r.assetTracks.includes("RESIDENTIAL / HOMEOWNER CHOICE"));
 assert.ok(r.assetTracks.includes("VACANT LAND / DEVELOPMENT"));
 assert.ok(r.questions.find(x=>x.id==="geo-imagery"));
 assert.equal(r.questions.find(x=>x.id==="bankruptcy-probate")?.status,"NOT_ASKED");
 assert.equal(r.questions.find(x=>x.id==="phone-consent")?.priority,"RELEASE_BLOCKER");
 assert.ok(r.notAsked>=10);
});
test("land-specific topics do not disappear under residential foreclosure workflow",()=>{
 const r=generateUnknowns(sanitizeIntake({mission:"Buy land parcels for homebuilding"}));
 assert.equal(r.mode,"REAL_ESTATE");
 assert.ok(r.assetTracks.some(x=>x.includes("LAND")));
 assert.ok(r.questions.some(x=>x.id==="ag-rollback"));
 assert.ok(r.questions.some(x=>x.id==="land-flood-soil"));
 assert.ok(r.questions.some(x=>x.id==="land-entitlements"));
});
test("general problem retains universal research and implementation quality questions",()=>{
 const r=generateUnknowns(sanitizeIntake({mission:"Help teachers improve science learning"}));
 assert.equal(r.mode,"GENERAL");
 assert.ok(r.questions.find(x=>x.id==="blindspot"));
 assert.ok(r.questions.find(x=>x.id==="assurance"));
 assert.ok(r.questions.every(x=>x.source===undefined));
});
test("keyword mention is not treated as legal or source verification",()=>{
 const r=generateUnknowns(sanitizeIntake({mission:"Make homeowner consent and fair offers possible"}));
 assert.equal(r.questions.find(x=>x.id==="seller-equity")?.priority,"RELEASE_BLOCKER");
 assert.equal(r.coverage.claimsVerified,0);
 assert.ok(r.notice.includes("does not mean"));
});
