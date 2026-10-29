import test from "node:test";
import assert from "node:assert/strict";
import {buildPlaybook,validatePlaybook,summarizeProgress} from "../lib/decision-playbook";

test("a real question produces a measurable guided process, never a completed intervention",()=>{
 const p=buildPlaybook("Improve funding success sustainably",{state:"PRELIMINARY_DELIBERATION"});
 assert.equal(p.tasks.length,7);
 assert.equal(p.tasks.filter(t=>t.done).length,0);
 assert.equal(p.metrics.filter(m=>m.verified).length,0);
 assert.match(p.decision,/UNDECIDED/);
 assert.ok(p.tasks.some(t=>t.id==="challenge"));
 assert.ok(p.tasks.some(t=>t.id==="pilot"));
 assert.ok(p.tasks.some(t=>t.id==="sustain"));
 assert.equal(summarizeProgress(p).percentage,0);
 assert.equal(validatePlaybook(p),true);
});
test("progress remains an observation, not verified impact",()=>{
 const p=buildPlaybook("Evaluate a major policy decision",{state:"INCOMPLETE"});
 p.tasks[0].done=true;
 p.metrics[0].observed="25";
 assert.deepEqual({completed:summarizeProgress(p).completed,verified:summarizeProgress(p).measuresVerified},{completed:1,verified:0});
});
test("oversized or malformed plans are rejected",()=>{
 const p=buildPlaybook("Investigate a systems problem",{});
 assert.equal(validatePlaybook({...p,tasks:[{id:"x",done:"yes"}]}),false);
 assert.equal(validatePlaybook({...p,progressNotes:["x".repeat(1001)]}),false);
 assert.equal(validatePlaybook({...p,nextReview:"x".repeat(90)}),false);
});
