import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {PGlite} from "@electric-sql/pglite";
import {validateAssessmentOrigin,assessmentRestoreRequest,validateAssessmentSource,AssessmentRecoveryError,CASE_ASSESSMENT_SOURCE_SQL,CASE_ASSESSMENT_RESTORE_SQL,assessmentRestoreResponse} from "../lib/case-assessment-recovery";
import {CASE_REPORT_MAX_CHARS} from "../lib/case-payload-capacity";
const id="00000000-0000-4000-8000-000000000001",eventId="00000000-0000-4000-8000-000000000002";
const failure=(status:number)=>(e:unknown)=>e instanceof AssessmentRecoveryError&&e.status===status;

test("assessment restoration rejects missing and foreign browser origins",()=>{
 validateAssessmentOrigin(new Request("https://example.org/api/cases/restore",{headers:{origin:"https://example.org"}}));
 for(const origin of [undefined,"null","https://other.example.org","http://example.org"])
  assert.throws(()=>validateAssessmentOrigin(new Request("https://example.org/api/cases/restore",{headers:origin?{origin}:{}})),failure(403));
});

test("recovery accepts only an archived event reference and exact current integer version",()=>{
 assert.deepEqual(assessmentRestoreRequest({id,eventId,version:2}),{id,eventId,version:2});
 for(const value of [null,[],{}, {id,eventId,version:"2"},{id,eventId,version:0},{id,eventId,version:1.5},{id,eventId,version:2147483647},{id,eventId,version:2,report:{forged:true}},{id:"other",eventId,version:2}])
  assert.throws(()=>assessmentRestoreRequest(value),failure(400));
});
test("legacy malformed and oversized reports cannot pass recovery preflight",()=>{
 const row=(report:string)=>({version:3,previous_version:"1",report_text:report,report_bytes:Buffer.byteLength(report),current_report_bytes:50,playbook_bytes:50});
 validateAssessmentSource(row('{"source":"retained","clinicalActionAuthorized":false}'),3);
 assert.throws(()=>validateAssessmentSource(undefined,3),failure(409));
 assert.throws(()=>validateAssessmentSource({...row("{}"),previous_version:"3"},3),failure(409));
 assert.throws(()=>validateAssessmentSource(row("[]"),3),failure(400));
 assert.throws(()=>validateAssessmentSource(row("not-json"),3),failure(409));
 assert.throws(()=>validateAssessmentSource({...row("{}"),report_bytes:100},3),failure(503));
 assert.throws(()=>validateAssessmentSource({...row("{}"),current_report_bytes:undefined},3),failure(409));
 assert.throws(()=>validateAssessmentSource(row(JSON.stringify({legacy:"x".repeat(CASE_REPORT_MAX_CHARS)})),3),failure(413));
 assert.throws(()=>validateAssessmentSource(row('{"retainedNumber":'+"9".repeat(CASE_REPORT_MAX_CHARS+1)+'}'),3),failure(413));
 assert.throws(()=>validateAssessmentSource({...row("{}"),current_report_bytes:900000},3),failure(413));
});

test("recovery discounts JSON formatting while retaining evidence whitespace and numeric-token limits",()=>{
 const row=(text:string)=>({version:3,previous_version:"1",report_text:text,report_bytes:Buffer.byteLength(text),current_report_bytes:50,playbook_bytes:50});
 const suffix=' an escaped quote: " and backslash: \\; retained spaces   ';
 const template={note:suffix,clinicalActionAuthorized:false};
 const fill=CASE_REPORT_MAX_CHARS-JSON.stringify(template).length;
 const report={...template,note:"é".repeat(fill)+suffix};
 assert.equal(JSON.stringify(report).length,CASE_REPORT_MAX_CHARS);
 const formatted=JSON.stringify(report,null,2);assert.ok(formatted.length>CASE_REPORT_MAX_CHARS);
 validateAssessmentSource(row(formatted),3);
 assert.throws(()=>validateAssessmentSource(row(JSON.stringify({note:" ".repeat(CASE_REPORT_MAX_CHARS)},null,2)),3),failure(413));
 const oversizedNumeric='{\n  "retainedNumber" : '+"9".repeat(CASE_REPORT_MAX_CHARS+1)+'\n}';
 assert.throws(()=>validateAssessmentSource(row(oversizedNumeric),3),failure(413));
});

test("actual durable recovery SQL retains history, exact JSON, current plan and tenant boundaries",async t=>{
 const path=mkdtempSync(join(tmpdir(),"dis-case-recovery-"));let db=new PGlite(path);await db.waitReady;
 const q=async<T=Record<string,unknown>>(sql:string,params:unknown[]=[])=>db.query<T>(sql,params);
 const as=async<T>(subject:string,action:()=>Promise<T>)=>{await db.exec("BEGIN; SET LOCAL ROLE dis_app_safe;");try{await q("SELECT set_config('dis.subject_id',$1,true)",[subject]);const result=await action();await db.exec("COMMIT");return result;}catch(e){await db.exec("ROLLBACK");throw e;}};
 const oldReport='{"state":"RESEARCH_GAP_SCAFFOLD_UNVERIFIED","largeOriginalNumber":900719925474099312345,"clinicalActionAuthorized":false,"baseline":{"source":"synthetic retained original"}}';
 const currentReport='{"state":"PRELIMINARY_DELIBERATION","clinicalActionAuthorized":false,"interpretation":"Current synthetic assessment"}';
 const playbook={objective:"Synthetic recovery acceptance",progressNotes:["Keep current action-plan work"]};
 let workspace:string,otherWorkspace:string,otherCase:string,archived:string,created:string;
 const restore=async(subject:string,caseId:string,version:number,sourceId:string)=>as(subject,async()=>{
  const source=await q(CASE_ASSESSMENT_SOURCE_SQL,[caseId,version,sourceId]);validateAssessmentSource(source.rows[0],version);
  const result=await q(CASE_ASSESSMENT_RESTORE_SQL,[caseId,version,sourceId]);return {result,body:assessmentRestoreResponse(result.rows[0],sourceId)};
 });
 try{
  await db.exec(readFileSync("tests/fixtures/casework-recovery-schema.sql","utf8"));
  await as("synthetic-a",async()=>{
   await q("INSERT INTO dis_subjects VALUES($1)",["synthetic-a"]);
   workspace=String((await q("INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,'Synthetic A') RETURNING id",["synthetic-a"])).rows[0].id);
   await q("INSERT INTO dis_casework(id,workspace_id,owner_subject,title,question,report,playbook,version) VALUES($1,$2,$3,'Recovery fixture','Can we recover the exact earlier assessment?',$4::jsonb,$5::jsonb,3)",[id,workspace,"synthetic-a",currentReport,JSON.stringify(playbook)]);
   created=String((await q("INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload) VALUES($1,$2,$3,'CREATED','{\"baseline\":\"original-unmeasured\"}') RETURNING id",[id,workspace,"synthetic-a"])).rows[0].id);
   archived=String((await q("INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload) VALUES($1,$2,$3,'REASSESSMENT',jsonb_build_object('previousVersion',1,'newVersion',3,'previousReport',$4::jsonb)) RETURNING id",[id,workspace,"synthetic-a",oldReport])).rows[0].id);
  });
  await as("synthetic-b",async()=>{
   await q("INSERT INTO dis_subjects VALUES($1)",["synthetic-b"]);
   otherWorkspace=String((await q("INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,'Synthetic B') RETURNING id",["synthetic-b"])).rows[0].id);
   otherCase=String((await q("INSERT INTO dis_casework(workspace_id,owner_subject,title,question,report,playbook,version) VALUES($1,$2,'Other tenant','Other synthetic case','{}','{}',3) RETURNING id",[otherWorkspace,"synthetic-b"])).rows[0].id);
  });
  await t.test("another tenant cannot read or restore the case, or reuse its source event",async()=>{
   await assert.rejects(restore("synthetic-b",id,3,archived),failure(409));
   await assert.rejects(restore("synthetic-b",otherCase,3,archived),failure(409));
   const denied=await as("synthetic-b",()=>q(CASE_ASSESSMENT_RESTORE_SQL,[id,3,archived]));assert.equal(denied.rows.length,0);
  });
  let recoveryEvent="";
  await t.test("restore creates one review revision and journals displaced report without changing the current plan",async()=>{
   const {body}=await restore("synthetic-a",id,3,archived),response=JSON.parse(body);
   recoveryEvent=response.restorationEventId;
   assert.match(body,/900719925474099312345/);assert.equal(response.case.version,4);assert.equal(response.case.status,"REVIEW");
   assert.deepEqual(response.case.playbook,playbook);assert.equal(response.case.report.clinicalActionAuthorized,false);assert.equal(response.historyRecorded,true);
   const journal=await as("synthetic-a",()=>q("SELECT payload FROM dis_case_events WHERE id=$1",[recoveryEvent]));
   assert.deepEqual((journal.rows[0].payload as any).previousReport,JSON.parse(currentReport));assert.equal((journal.rows[0].payload as any).restoredFromEvent,archived);
   const baseline=await as("synthetic-a",()=>q("SELECT payload FROM dis_case_events WHERE id=$1",[created]));assert.deepEqual(baseline.rows[0].payload,{baseline:"original-unmeasured"});
  });
  await t.test("stale/repeated requests cannot overwrite the recovered revision or add events",async()=>{
   await assert.rejects(restore("synthetic-a",id,3,archived),failure(409));
   const direct=await as("synthetic-a",()=>q(CASE_ASSESSMENT_RESTORE_SQL,[id,3,archived]));assert.equal(direct.rows.length,0);
   const count=await q("SELECT count(*)::integer AS n FROM dis_case_events WHERE case_id=$1",[id]);assert.equal(count.rows[0].n,3);
  });
  await t.test("committed recovery survives database close and reopen with exact retained original number",async()=>{
   await db.close();db=new PGlite(path);await db.waitReady;
   const row=(await as("synthetic-a",()=>q("SELECT report::text,version,playbook FROM dis_casework WHERE id=$1",[id]))).rows[0];
   assert.match(String(row.report),/900719925474099312345/);assert.equal(row.version,4);assert.deepEqual(row.playbook,playbook);
  });
  await t.test("the displaced report can itself be restored as another append-only revision",async()=>{
   const {body}=await restore("synthetic-a",id,4,recoveryEvent);assert.deepEqual(JSON.parse(body).case.report,JSON.parse(currentReport));assert.equal(JSON.parse(body).case.version,5);
   assert.equal((await q("SELECT count(*)::integer AS n FROM dis_case_events WHERE case_id=$1",[id])).rows[0].n,4);
  });
  await t.test("journal failure rolls back the report and version together",async()=>{
   await db.exec("CREATE FUNCTION reject_fixture_recovery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic journal failure'; END $$; CREATE TRIGGER reject_fixture_recovery BEFORE INSERT ON dis_case_events FOR EACH ROW EXECUTE FUNCTION reject_fixture_recovery();");
   await assert.rejects(restore("synthetic-a",id,5,archived),/Synthetic journal failure/);
   const row=(await q("SELECT version,report FROM dis_casework WHERE id=$1",[id])).rows[0];assert.equal(row.version,5);assert.deepEqual(row.report,JSON.parse(currentReport));
   await db.exec("DROP TRIGGER reject_fixture_recovery ON dis_case_events;");
  });
  await t.test("runtime role cannot alter or delete historical evidence",async()=>{
   await assert.rejects(as("synthetic-a",()=>q("UPDATE dis_case_events SET payload='{}' WHERE id=$1",[archived])),/permission denied/);
   await assert.rejects(as("synthetic-a",()=>q("DELETE FROM dis_case_events WHERE id=$1",[archived])),/permission denied/);
  });
 }finally{await db.close();rmSync(path,{recursive:true,force:true});}
});
