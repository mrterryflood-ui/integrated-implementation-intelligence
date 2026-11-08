import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildPlaybook,validatePlaybook} from "../lib/decision-playbook";
import {CASE_PLAYBOOK_MAX_CHARS,CASE_REPORT_MAX_CHARS,CASE_REQUEST_MAX_BYTES,CasePayloadError,serializeCaseReport,serializeCasePlaybook,readBoundedCaseJson} from "../lib/case-payload-capacity";
const full=()=>{
 const p=buildPlaybook("Synthetic maximum annotated research plan",{state:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",actionPlan:{status:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",tasks:Array.from({length:28},(_,i)=>({title:"Task "+i,why:"w".repeat(340),success:"s".repeat(340)})),metrics:Array.from({length:20},(_,i)=>({label:"Measure "+i,baseline:"b".repeat(120),target:"t".repeat(120),unit:"%"}))}});
 for(const t of p.tasks){t.evidence="é".repeat(2000);t.owner="o".repeat(145);t.title="t".repeat(180);t.success="s".repeat(790);}
 for(const m of p.metrics){m.observed="1".repeat(240);m.target="2".repeat(240);m.source="s".repeat(500);m.observedAt="2026-11-07";}
 p.progressNotes=Array.from({length:80},()=>"n".repeat(1000));p.learningReview={knowledge:"k".repeat(1000),skills:"s".repeat(1000),strategy:"x".repeat(1000),nextExperiment:"e".repeat(1000)};
 return p;
};
test("full 35-task and 25-measure playbook with maximum evidence and progress notes serializes without loss",async()=>{
 const p=full();assert.equal(validatePlaybook(p),true);assert.equal(p.tasks.length,35);assert.equal(p.metrics.length,25);
 assert.ok(JSON.stringify(p).length>50000,"reproduce the old PATCH rejection");
 const serialized=serializeCasePlaybook(p);assert.ok(serialized.length<=CASE_PLAYBOOK_MAX_CHARS);
 const body=JSON.stringify({id:"00000000-0000-4000-8000-000000000000",version:1,playbook:JSON.parse(serialized)});
 assert.ok(new TextEncoder().encode(body).byteLength<CASE_REQUEST_MAX_BYTES);
 const parsed=await readBoundedCaseJson(new Request("https://example.org/api/cases",{method:"PATCH",body}));
 assert.deepEqual(parsed.playbook,p,"all task evidence survives the actual bounded JSON transport");
});
test("oversize or invalid playbooks reject without silently shrinking evidence",()=>{
 const p=full();assert.throws(()=>serializeCasePlaybook({...p,unexpectedPayload:"x".repeat(CASE_PLAYBOOK_MAX_CHARS)}),(e:unknown)=>e instanceof CasePayloadError&&e.status===413);
 p.tasks[0].evidence="x".repeat(2001);assert.throws(()=>serializeCasePlaybook(p),(e:unknown)=>e instanceof CasePayloadError&&e.status===400);
});
test("byte limit covers chunked requests without Content-Length and malformed JSON",async()=>{
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(CASE_REQUEST_MAX_BYTES+1));c.close();}});
 const req=new Request("https://example.org/api/cases",{method:"PATCH",body:stream,duplex:"half"} as RequestInit);
 await assert.rejects(()=>readBoundedCaseJson(req),(e:unknown)=>e instanceof CasePayloadError&&e.status===413);
 await assert.rejects(()=>readBoundedCaseJson(new Request("https://example.org/api/cases",{method:"PATCH",body:"[not-json]"})),(e:unknown)=>e instanceof CasePayloadError&&e.status===400);
});
test("create and checkpoint routes share capacity while retaining real auth, RLS and version conflict protection",()=>{
 const route=readFileSync("app/api/cases/route.ts","utf8");
 assert.equal((route.match(/await readBoundedCaseJson\(request\)/g)||[]).length,2);
 assert.equal((route.match(/serializeCasePlaybook\(/g)||[]).length,2);
 assert.match(route,/await auth\(\)/);assert.match(route,/set_config\('dis.subject_id'/);assert.match(route,/version=c\.version\+1/);assert.match(route,/c\.id=prior\.id AND c\.version=\$\{version\}/);assert.match(route,/status:409/);assert.doesNotMatch(route,/body.length>50000/);
});
test("a source-rich 100K-character report survives bounded multibyte create transport without loss",async()=>{
 const report={state:"RESEARCH_CALIBRATION",notes:"é".repeat(100000),clinicalActionAuthorized:false};
 const serialized=serializeCaseReport(report);assert.ok(serialized.length>65000);assert.ok(serialized.length<CASE_REPORT_MAX_CHARS);
 const body=JSON.stringify({workspaceId:"00000000-0000-4000-8000-000000000000",title:"Public evidence",question:"Synthetic capacity exercise",report:JSON.parse(serialized)});
 assert.ok(new TextEncoder().encode(body).length<CASE_REQUEST_MAX_BYTES);
 const result=await readBoundedCaseJson(new Request("https://example.org/api/cases",{method:"POST",body}));
 assert.deepEqual(result.report,report);
});
test("report boundary denies oversize and malformed reports with no silent truncation",()=>{
 const overhead=JSON.stringify({note:""}).length;
 const atBoundary={note:"x".repeat(CASE_REPORT_MAX_CHARS-overhead)};
 assert.equal(serializeCaseReport(atBoundary).length,CASE_REPORT_MAX_CHARS);
 assert.throws(()=>serializeCaseReport({note:atBoundary.note+"x"}),(e:unknown)=>e instanceof CasePayloadError&&e.status===413);
 assert.throws(()=>serializeCaseReport([]),(e:unknown)=>e instanceof CasePayloadError&&e.status===400);
});
test("builder, create and reassessment share report capacity and preserve predecessor archive and authority checks",()=>{
 const create=readFileSync("app/api/cases/route.ts","utf8"),recheck=readFileSync("app/api/cases/recheck/route.ts","utf8"),builder=readFileSync("lib/evidence-action-case-handoff.ts","utf8");
 for(const text of [create,builder])assert.match(text,/serializeCaseReport\(report\)/);
 assert.match(recheck,/serializeCaseReport\(retainResearchForReassessment\(prior.report,report\)\)/);
 assert.match(recheck,/await auth\(\)/);assert.match(recheck,/set_config\('dis.subject_id'/);assert.match(recheck,/previousReport/);assert.match(recheck,/version=version\+1/);assert.match(recheck,/status:409/);
 assert.match(recheck,/e instanceof CasePayloadError/);assert.equal(CASE_REQUEST_MAX_BYTES,1048576);assert.equal(CASE_PLAYBOOK_MAX_CHARS,250000);
});
