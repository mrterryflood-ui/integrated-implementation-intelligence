import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {DISCIPLINES,FIVE_OBJECTIVES,PROGRAM_MILESTONES,designEnterpriseMission,renderEnterpriseMission} from "../lib/enterprise-mission";
import {sanitizeIntake} from "../lib/consultation";
import {buildPackage} from "../lib/consultation-package";
import {CONSULTATION_FOCUS_AREAS} from "../lib/consultation-focus";

test("enterprise outcomes retain eight separate discipline end states, five shared objectives and six milestones",()=>{
 assert.equal(DISCIPLINES.length,8);
 assert.equal(new Set(DISCIPLINES.map(x=>x.id)).size,8);
 assert.ok(DISCIPLINES.every(x=>x.endState.length>35&&x.objectives.length>=3));
 assert.deepEqual(FIVE_OBJECTIVES.map(x=>x.id),["O1","O2","O3","O4","O5"]);
 assert.deepEqual(PROGRAM_MILESTONES.map(x=>x.phase),["Scope","Validate","Integrate","Demonstrate","Measure","Expand"]);
 assert.ok(PROGRAM_MILESTONES.every(x=>x.status==="NOT_VERIFIED"&&x.gate&&x.ownerRole));
});
test("research and university questions produce actionable interdisciplinary proposals, never invented partners",()=>{
 const m=designEnterpriseMission("Design research with university faculty and implementation science experts to reduce cancer disparities in clinical and community settings");
 assert.ok(m.primary);
 assert.ok([m.primary?.id,...m.contributing.map(d=>d.id)].includes("research-universities"));
 assert.ok([m.primary?.id,...m.contributing.map(d=>d.id)].includes("health-wellbeing"));
 assert.equal(m.universityResearch.find(x=>x.role.includes("collaboration"))?.status,"NOT_ENGAGED");
 assert.equal(m.state,"DESIGN_PROPOSAL_NOT_EXECUTED");
 const out=renderEnterpriseMission(m);
 assert.match(out,/RESEARCH AND CONVERGENCE QUESTIONS/);
 assert.match(out,/IRB\/DUA\/IP/);
 assert.match(out,/M5 Expand/);
 assert.match(out,/Source/);
 assert.ok(!out.includes("partners confirmed"));
});
test("unrecognized mission does not hallucinate a specialty or research evidence",()=>{
 const m=designEnterpriseMission("xxxxqqyzzzz");
 assert.equal(m.primary,null);
 assert.equal(m.contributing.length,0);
 assert.ok(m.milestones.every(x=>x.status==="NOT_VERIFIED"));
 assert.ok(m.limitations.some(x=>x.includes("No university")));
});
test("natural cross-domain questions route to relevant methods without universal capability invocation",()=>{
 const community=designEnterpriseMission("How can county community workforce programs improve employment outcomes and implementation fidelity?");
 const ids=[community.primary?.id,...community.contributing.map(x=>x.id)];
 assert.ok(ids.includes("community-civic-policy")||ids.includes("implementation-systems")||ids.includes("veterans-workforce"));
 assert.ok(community.contributing.length<=3);
 assert.equal(community.objectives.length,5);
});
test("mission roadmap is a real document in native Word/Markdown export package",()=>{
 const intake=sanitizeIntake({mission:"Build a university research implementation program addressing evidence gaps in healthcare"});
 const pkg=buildPackage(intake,"general");
 const doc=pkg.documents.find(x=>x.id==="enterprise-mission");
 assert.ok(doc);
 assert.equal(doc.validation,"DRAFT");
 assert.match(doc.body,/UNIVERSITIES AND RESEARCH/);
 assert.match(doc.body,/NOT_VERIFIED/);
 assert.ok(!doc.body.includes("COMPLETED SUCCESS"));
 const source=readFileSync(join(process.cwd(),"lib","consultation-package.ts"),"utf8");
 assert.match(source,/renderEnterpriseMission\(designEnterpriseMission\(intake\.mission\)\)/);
});
test("university/research selection is an actual consultation link, not an isolated platform listing",()=>{
 const f=CONSULTATION_FOCUS_AREAS.find(x=>x.id==="research-universities");
 assert.ok(f);
 assert.equal(f.examples.length,2);
 const page=readFileSync(join(process.cwd(),"app","page.tsx"),"utf8");
 assert.match(page,/CONSULTATION_FOCUS_AREAS\.map/);
 assert.ok(f.guidance.includes("no institution is represented")||f.guidance.includes("no institution is represented as a partner"));
});
