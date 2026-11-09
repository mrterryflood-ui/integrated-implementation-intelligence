/** Actual registered handlers and PostgreSQL-compatible storage, with explicit
 * synthetic Clerk identity and Neon transport. No production sign-in is proved. */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createRequire} from "node:module";
import {build} from "esbuild";
import {PGlite} from "@electric-sql/pglite";

type FixtureGlobals=typeof globalThis&{
 __disResearchRouteActor?:string|null;
 __disResearchRouteDb?:PGlite;
 __disResearchAfterTransaction?:((statements:{text:string;values:unknown[]}[])=>Promise<void>)|null;
};
const fixture=globalThis as FixtureGlobals;

test("research case handlers retain complete inputs, enforce boundaries and recover atomic revisions",async t=>{
 const directory=mkdtempSync(join(tmpdir(),"dis-research-routes-"));
 const databaseDirectory=join(directory,"database"),bundlePath=join(directory,"routes.cjs");
 const previousDatabaseUrl=process.env.DIS_DATABASE_URL;
 let db=new PGlite(databaseDirectory);await db.waitReady;
 const app=process.cwd();
 try{
  await build({stdin:{contents:`
   export * as cases from './app/api/cases/route';
   export * as restore from './app/api/cases/restore/route';
   export {emptyResearchWorkflow,buildResearchWorkflowCase} from './lib/research-workflow';
   export {CASE_REPORT_MAX_CHARS,CASE_REPORT_MAX_DB_BYTES} from './lib/case-payload-capacity';
   export {colorectalEvidenceAction} from './lib/evidence-action-colorectal';
   export {buildEvidenceActionCaseHandoff} from './lib/evidence-action-case-handoff';
   export {applyResearchTaskGuidance} from './lib/research-task-guidance';
  `,resolveDir:app,loader:"ts"},outfile:bundlePath,bundle:true,platform:"node",format:"cjs",packages:"external",logLevel:"silent",plugins:[{
   name:"synthetic-identity-and-transport-only",
   setup(builder){
    builder.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:"identity",namespace:"synthetic"}));
    builder.onResolve({filter:/^@neondatabase\/serverless$/},()=>({path:"transport",namespace:"synthetic"}));
    builder.onLoad({filter:/.*/,namespace:"synthetic"},args=>({loader:"js",contents:args.path==="identity"
     ?"export async function auth(){return {userId:globalThis.__disResearchRouteActor}}"
     :`export function neon(){
       const query=(strings,...values)=>({text:strings.reduce((text,part,i)=>text+part+(i<values.length?'$'+(i+1):''),''),values});
       query.query=(text,values=[])=>({text,values});
       query.transaction=async statements=>{
        const db=globalThis.__disResearchRouteDb;
        await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
        let rows;
        try{rows=[];for(const statement of statements)rows.push((await db.query(statement.text,statement.values)).rows);await db.exec('COMMIT');}
        catch(error){await db.exec('ROLLBACK');throw error;}
        if(globalThis.__disResearchAfterTransaction)await globalThis.__disResearchAfterTransaction(statements);
        return rows;
       };
       return query;
      }`
    }));
   }
  }]});
  const api=createRequire(import.meta.url)(bundlePath);
  fixture.__disResearchRouteDb=db;
  process.env.DIS_DATABASE_URL="synthetic-pglite-transport-not-a-credential";
  await db.exec(readFileSync("tests/fixtures/casework-recovery-schema.sql","utf8"));
  const origin="https://synthetic-research.test",owner="synthetic-research-owner",other="synthetic-other-owner";
  const as=async<T>(actor:string,work:()=>Promise<T>)=>{
   await db.exec("BEGIN; SET LOCAL ROLE dis_app_safe;");
   try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[actor]);const result=await work();await db.exec("COMMIT");return result;}
   catch(error){await db.exec("ROLLBACK");throw error;}
  };
  const workspace=async(actor:string)=>as(actor,async()=>{
   await db.query("INSERT INTO dis_subjects VALUES($1)",[actor]);
   return String((await db.query<{id:string}>("INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,$2) RETURNING id",[actor,"Synthetic route acceptance workspace"])).rows[0].id);
  });
  const workspaceId=await workspace(owner),otherWorkspaceId=await workspace(other);
  const call=async(actor:string|null,handler:(req:Request)=>Promise<Response>,path:string,method:string,body?:unknown,requestOrigin:string|null=origin)=>{
   fixture.__disResearchRouteActor=actor;
   const response=await handler(new Request(origin+path,{method,headers:{"content-type":"application/json",...(requestOrigin?{origin:requestOrigin}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
   return {status:response.status,body:await response.json()};
  };
  const workflow=api.emptyResearchWorkflow();workflow.publicAggregateConfirmed=true;
  workflow.studyText='[{"unfinished":"SYNTHETIC draft; preserve for later review"}]';
  workflow.counterfactualText='{"unfinished":"SYNTHETIC panel draft"}';
  workflow.correctionReceiptText='{"unfinished":"SYNTHETIC receipt draft"}';
  workflow.frameworks=["CFIR","RE_AIM"];
  const context=api.colorectalEvidenceAction();
  workflow.focusIds=[context.bridge.hypotheses[0].id];
  workflow.correctionActionId=context.bridge.corrections[0].id;
  const createBody={workspaceId,researchWorkflow:workflow};
  const caseCount=async()=>Number((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_casework")).rows[0].n);

  await t.test("missing identity, missing/foreign origin and supplied replacement reports are denied before writes",async()=>{
   assert.equal((await call(null,api.cases.POST,"/api/cases","POST",createBody)).status,401);
   for(const requestOrigin of [null,"https://foreign.test"])
    assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",createBody,requestOrigin)).status,403);
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{...createBody,report:{causalEffectEstablished:true}})).status,400);
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{...createBody,researchWorkflow:{...workflow,publicAggregateConfirmed:false}})).status,400);
   assert.equal(await caseCount(),0);
  });
  await t.test("the registered create path cannot write into another subject's workspace",async()=>{
   const denied=await call(other,api.cases.POST,"/api/cases","POST",createBody);
   assert.ok([404,503].includes(denied.status));
   assert.equal(denied.body.case,undefined);assert.equal(await caseCount(),0);
  });

  let item:any;
  await t.test("typed create saves all editor inputs and the dated baseline together, then reloads them",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);
   assert.equal(created.status,201);assert.equal(created.body.historyRecorded,true);item=created.body.case;
   assert.deepEqual(item.report.workflow,workflow);assert.equal(item.report.causalEffectEstablished,false);assert.equal(item.report.independentOutcomeVerified,false);
   assert.equal(item.report.noPatientData,null);assert.equal(item.report.investigation.privacyStatus,"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED");
   const loaded=await call(owner,api.cases.GET,"/api/cases?id="+item.id,"GET");
   assert.equal(loaded.status,200);assert.deepEqual(loaded.body.case.report,item.report);
   assert.equal(loaded.body.history.length,1);assert.equal(loaded.body.history[0].event_type,"CREATED");
  });
  const original=structuredClone(item.report),plan=structuredClone(item.playbook);
  const revisedWorkflow={...workflow,narrative:{...workflow.narrative,setting:"Synthetic revised setting and available services"}};
  await t.test("research revision retains the current playbook and archives the complete predecessor",async()=>{
   const revised=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:1,researchWorkflow:revisedWorkflow});
   assert.equal(revised.status,200);assert.equal(revised.body.historyRecorded,true);item=revised.body.case;
   assert.equal(item.version,2);assert.deepEqual(item.report.workflow,revisedWorkflow);assert.deepEqual(item.playbook,plan);
   const events=(await as(owner,()=>db.query<{payload:any}>("SELECT payload FROM dis_case_events WHERE case_id=$1 AND event_type='REASSESSMENT'",[item.id]))).rows;
   assert.equal(events.length,1);assert.deepEqual(events[0].payload.previousReport,original);assert.equal(events[0].payload.revisionAction,"RESEARCH_WORKFLOW_EDIT");
  });
  await t.test("stale, foreign-owner, wrong-type version, supplied-plan and foreign-origin revisions cannot overwrite the saved case",async()=>{
   for(const actor of [owner,other])assert.equal((await call(actor,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:1,researchWorkflow:workflow})).status,409);
   assert.equal((await call(other,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:2,researchWorkflow:workflow})).status,409);
   assert.equal((await call(other,api.cases.GET,"/api/cases?id="+item.id,"GET")).status,404);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:"2",researchWorkflow:workflow})).status,400);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:2,researchWorkflow:workflow,playbook:plan})).status,400);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:2,researchWorkflow:workflow},"https://foreign.test")).status,403);
   assert.equal((await db.query<{version:number}>("SELECT version FROM dis_casework WHERE id=$1",[item.id])).rows[0].version,2);
  });
  await t.test("the existing recovery route restores an earlier research record and preserves the current plan",async()=>{
   const archive=(await as(owner,()=>db.query<{id:string}>("SELECT id FROM dis_case_events WHERE case_id=$1 AND event_type='REASSESSMENT'",[item.id]))).rows[0];
   assert.equal((await call(other,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:2,eventId:archive.id})).status,409);
   const restored=await call(owner,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:2,eventId:archive.id});
   assert.equal(restored.status,200);assert.equal(restored.body.historyRecorded,true);item=restored.body.case;
   assert.equal(item.version,3);assert.deepEqual(item.report,original);assert.deepEqual(item.playbook,plan);
  });
  await t.test("an audit insert failure rolls back the report, version and event count together",async()=>{
   const before=(await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[item.id])).rows[0].n;
   await db.exec("CREATE FUNCTION refuse_research_journal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic journal refusal'; END $$; CREATE TRIGGER refuse_research_journal BEFORE INSERT ON dis_case_events FOR EACH ROW EXECUTE FUNCTION refuse_research_journal();");
   try{
    assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:3,researchWorkflow:revisedWorkflow})).status,503);
    const durable=(await db.query<{version:number;report:unknown}>("SELECT version,report FROM dis_casework WHERE id=$1",[item.id])).rows[0];
    assert.equal(durable.version,3);assert.deepEqual(durable.report,original);
    assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[item.id])).rows[0].n,before);
   }finally{await db.exec("DROP TRIGGER refuse_research_journal ON dis_case_events");}
  });
  await t.test("oversized editor combinations are rejected without changing the saved record or truncating the request",async()=>{
   const tooLarge={...workflow,narrative:Object.fromEntries(Object.keys(workflow.narrative).map(key=>[key,"x".repeat(2400)])),studyText:"s".repeat(25000),counterfactualText:"p".repeat(25000)};
   const before=JSON.stringify(tooLarge);
   const result=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:3,researchWorkflow:tooLarge});
   assert.equal(result.status,413);assert.equal(JSON.stringify(tooLarge),before);
   const durable=(await db.query<{version:number;report:unknown}>("SELECT version,report FROM dis_casework WHERE id=$1",[item.id])).rows[0];
   assert.equal(durable.version,3);assert.deepEqual(durable.report,original);
  });
  await t.test("a writer arriving between the source read and mutation causes a conflict rather than a lost update",async()=>{
   let competingWriteObserved=false;
   fixture.__disResearchAfterTransaction=async statements=>{
    if(!statements.some(s=>/^\s*SELECT\b[\s\S]*\breport\s+FROM\s+dis_casework\b/.test(s.text)))return;
    fixture.__disResearchAfterTransaction=null;
    const competing=await as(owner,()=>db.query<{version:number}>("UPDATE dis_casework SET version=version+1 WHERE id=$1 RETURNING version",[item.id]));
    assert.equal(competing.rows[0].version,4);competingWriteObserved=true;
   };
   try{
    const result=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:3,researchWorkflow:revisedWorkflow});
    assert.equal(competingWriteObserved,true);assert.equal(result.status,409);
    const durable=(await db.query<{version:number;report:unknown}>("SELECT version,report FROM dis_casework WHERE id=$1",[item.id])).rows[0];
    assert.equal(durable.version,4);assert.deepEqual(durable.report,original);
   }finally{fixture.__disResearchAfterTransaction=null;}
  });
  await t.test("changed or removed research labels cannot admit forged source or outcome claims",async()=>{
   const legacy=api.buildEvidenceActionCaseHandoff(context.program,context.bridge),forged=structuredClone(legacy.report);
   delete forged.schemaVersion;forged.state="DECLARED_RESEARCH";forged.causalEffectEstablished=true;forged.independentOutcomeVerified=true;
   const before=await caseCount();
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,title:legacy.title,question:legacy.question,report:forged})).status,400);
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,title:"Synthetic claim",question:legacy.question,report:{state:"OTHER",causalEffectEstablished:true}})).status,400);
   assert.equal(await caseCount(),before);
  });
  await t.test("legacy compatibility creates reject credential-bearing source links and duplicate source identifiers",async()=>{
   const lead={id:"synthetic-source",kind:"SCHOLARLY",title:"Synthetic discovery record",summary:"Fixture only",source:"Synthetic index",url:"https://fixture-user:fixture-password@example.org/paper",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"};
   const bad=api.colorectalEvidenceAction([lead]),handoff=api.buildEvidenceActionCaseHandoff(bad.program,bad.bridge),before=await caseCount();
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,...handoff})).status,400);
   const duplicate=api.colorectalEvidenceAction([{...lead,url:"https://example.org/a"},{...lead,url:"https://example.org/b"}]);
   const duplicateHandoff=api.buildEvidenceActionCaseHandoff(duplicate.program,duplicate.bridge);
   assert.equal((await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,...duplicateHandoff})).status,400);
   assert.equal(await caseCount(),before);
  });
  await t.test("legacy source leads and notes survive two unrelated workflow revisions",async()=>{
   const lead={id:"legacy-lead",kind:"SCHOLARLY",title:"Synthetic retained source",summary:"Fixture only",source:"Synthetic index",url:"https://example.org/legacy",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"};
   const priorContext=api.colorectalEvidenceAction([lead]);
   const note={id:"legacy-note",kind:"SOURCE",text:"Synthetic original note retained across unrelated edits.",sourceUrl:"https://example.org/legacy",gapIds:[priorContext.bridge.gaps[0].id],origin:"SYNTHETIC"};
   const handoff=api.buildEvidenceActionCaseHandoff(priorContext.program,priorContext.bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[note]});
   const created=await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,...handoff});assert.equal(created.status,201);
   let legacy=created.body.case;
   for(const setting of ["Synthetic first edit","Synthetic second edit"]){
    const result=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:legacy.id,version:legacy.version,researchWorkflow:{...workflow,narrative:{...workflow.narrative,setting}}});
    assert.equal(result.status,200);legacy=result.body.case;
    assert.deepEqual(legacy.report.investigation.notes,[note]);assert.deepEqual(legacy.report.investigation.literature,handoff.report.investigation.literature);
    assert.deepEqual(legacy.report.calibratedEvidence,handoff.report.calibratedEvidence);assert.deepEqual(legacy.report.crcMarginalEvidence,handoff.report.crcMarginalEvidence);
   }
   const loaded=await call(owner,api.cases.GET,"/api/cases?id="+legacy.id,"GET");assert.equal(loaded.body.case.version,3);assert.deepEqual(loaded.body.case.report.investigation.notes,[note]);
  });
  await t.test("attaching a discovery lead retains the gap identity referenced by an older note",async()=>{
   const note={id:"legacy-discovery-note",kind:"SOURCE",text:"Synthetic historical discovery note.",sourceUrl:"https://example.org/earlier-search",gapIds:["literature-not-retrieved"],origin:"SYNTHETIC"};
   const handoff=api.buildEvidenceActionCaseHandoff(context.program,context.bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[note]});
   const created=await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,...handoff});assert.equal(created.status,201);
   const lead={id:"new-discovery-lead",kind:"SCHOLARLY",title:"Synthetic newly attached source",summary:"Fixture only",source:"Synthetic index",url:"https://example.org/new-source",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"};
   const revised=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:created.body.case.id,version:1,researchWorkflow:{...workflow,retrievalQuery:"Synthetic colorectal source search",leads:[lead]}});
   assert.equal(revised.status,200);assert.deepEqual(revised.body.case.report.investigation.notes,[note]);
   assert.equal(revised.body.case.report.investigation.literature.length,1);
   const ids=revised.body.case.report.gapLedger.map((gap:{id:string})=>gap.id);
   assert.ok(note.gapIds.every(id=>ids.includes(id)));
  });
  await t.test("a report admitted at the compact limit remains editable after JSONB spacing and UTF-8 expansion",async()=>{
   const near=api.emptyResearchWorkflow();near.publicAggregateConfirmed=true;
   near.narrative=Object.fromEntries(Object.keys(near.narrative).map(key=>[key,"é".repeat(2400)]));
   near.studyText="s".repeat(25000);
   const remaining=api.CASE_REPORT_MAX_CHARS-JSON.stringify(api.buildResearchWorkflowCase(near).report).length;
   assert.ok(remaining>=0&&remaining<=25000,"the fixture must fit the existing workflow limits");
   near.counterfactualText="é".repeat(remaining);
   assert.equal(JSON.stringify(api.buildResearchWorkflowCase(near).report).length,api.CASE_REPORT_MAX_CHARS);
   const created=await call(owner,api.cases.POST,"/api/cases","POST",{workspaceId,researchWorkflow:near});
   assert.equal(created.status,201);const reportId=created.body.case.id;
   const before=(await db.query<{body:string;chars:number;bytes:number}>("SELECT report::text AS body,char_length(report::text) AS chars,octet_length(report::text) AS bytes FROM dis_casework WHERE id=$1",[reportId])).rows[0];
   assert.ok(before.chars>api.CASE_REPORT_MAX_CHARS);assert.ok(before.bytes>before.chars);
   const revised=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:reportId,version:1,researchWorkflow:workflow});
   assert.equal(revised.status,200,"an admitted report must permit a smaller valid revision");
   assert.equal(revised.body.case.version,2);assert.deepEqual(revised.body.case.report.workflow,workflow);
   assert.deepEqual(revised.body.case.playbook,created.body.case.playbook);
   const journal=(await db.query<{id:string;body:string}>("SELECT id,(payload->'previousReport')::text AS body FROM dis_case_events WHERE case_id=$1 AND event_type='REASSESSMENT'",[reportId])).rows[0];
   assert.equal(journal.body,before.body,"retain the complete prior report without serialization loss");
   const loaded=await call(owner,api.cases.GET,"/api/cases?id="+reportId,"GET");
   assert.equal(loaded.status,200);assert.deepEqual(loaded.body.case.report.workflow,workflow);
   const restored=await call(owner,api.restore.POST,"/api/cases/restore","POST",{id:reportId,version:2,eventId:journal.id});
   assert.equal(restored.status,200,"the original accepted report must remain restorable");
   assert.equal(restored.body.case.version,3);assert.deepEqual(restored.body.case.playbook,created.body.case.playbook);
   assert.equal((await db.query<{body:string}>("SELECT report::text AS body FROM dis_casework WHERE id=$1",[reportId])).rows[0].body,before.body);
  });
  await t.test("the stored-report byte ceiling still rejects a large legacy wrapper before a shrinking revision",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);assert.equal(created.status,201);
   const reportId=created.body.case.id;
   await as(owner,()=>db.query("UPDATE dis_casework SET report=jsonb_build_object('retainedResearch',report,'legacyNotes',$2::text) WHERE id=$1",[reportId,"界".repeat(Math.ceil(api.CASE_REPORT_MAX_DB_BYTES/3))]));
   const before=(await db.query<{body:string;bytes:number}>("SELECT report::text AS body,octet_length(report::text) AS bytes FROM dis_casework WHERE id=$1",[reportId])).rows[0];
   assert.ok(before.bytes>api.CASE_REPORT_MAX_DB_BYTES);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:reportId,version:1,researchWorkflow:workflow})).status,413);
   const after=(await db.query<{body:string;version:number}>("SELECT report::text AS body,version FROM dis_casework WHERE id=$1",[reportId])).rows[0];
   assert.equal(after.body,before.body);assert.equal(after.version,1);
  });
  await t.test("an older oversized stored report is refused without replacing or truncating its contents",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);assert.equal(created.status,201);
   const oversizedId=created.body.case.id;
   await as(owner,()=>db.query("UPDATE dis_casework SET report=jsonb_set(report,'{retainedLargeDraft}',to_jsonb($2::text)) WHERE id=$1",[oversizedId,"Synthetic historical draft "+"x".repeat(130000)]));
   const before=(await db.query<{body:string}>("SELECT report::text AS body FROM dis_casework WHERE id=$1",[oversizedId])).rows[0].body;
   assert.ok(before.length>128000);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:oversizedId,version:1,researchWorkflow:revisedWorkflow})).status,413);
   const after=(await db.query<{body:string;version:number}>("SELECT report::text AS body,version FROM dis_casework WHERE id=$1",[oversizedId])).rows[0];
   assert.equal(after.body,before);assert.equal(after.version,1);
   assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[oversizedId])).rows[0].n,1);
  });
  await t.test("editing a retained research layer preserves exact source numbers and archives the old council interpretation",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);assert.equal(created.status,201);
   const wrappedId=created.body.case.id,exactNumber="12345678901234567890.1234567890123456789";
   await as(owner,()=>db.query("UPDATE dis_casework SET report=jsonb_build_object('state','SYNTHETIC_COUNCIL_DRAFT','deliberation',jsonb_build_object('synthesis','Synthetic previous interpretation, not a new review'),'retainedResearch',jsonb_set(report,'{calibratedEvidence,syntheticPrecisionProbe}',$2::jsonb)) WHERE id=$1",[wrappedId,exactNumber]));
   const before=(await db.query<{body:string}>("SELECT report::text AS body FROM dis_casework WHERE id=$1",[wrappedId])).rows[0].body;
   const revised=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:wrappedId,version:1,researchWorkflow:revisedWorkflow});
   assert.equal(revised.status,200);assert.equal(revised.body.case.report.deliberation,undefined);
   assert.equal(revised.body.case.report.retainedResearch,undefined);assert.deepEqual(revised.body.case.playbook,created.body.case.playbook);
   const durable=(await db.query<{numericText:string}>("SELECT report#>>'{calibratedEvidence,syntheticPrecisionProbe}' AS \"numericText\" FROM dis_casework WHERE id=$1",[wrappedId])).rows[0];
   assert.equal(durable.numericText,exactNumber);
   const predecessor=(await db.query<{body:string}>("SELECT (payload->'previousReport')::text AS body FROM dis_case_events WHERE case_id=$1 AND event_type='REASSESSMENT'",[wrappedId])).rows[0];
   assert.equal(predecessor.body,before);
  });
  await t.test("task reconciliation preserves progress and both plan versions through atomic writes, denied attempts and database restart",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);assert.equal(created.status,201);
   const taskCaseId=created.body.case.id,workingPlan=structuredClone(created.body.case.playbook);
   const taskIndex=workingPlan.tasks.findIndex((task:any)=>task.sourceGapId==="literature-not-retrieved");assert.ok(taskIndex>=0);
   delete workingPlan.tasks[taskIndex].sourceGapId;
   workingPlan.tasks[taskIndex].owner="Synthetic retained owner";workingPlan.tasks[taskIndex].evidence="Synthetic prior search record";workingPlan.tasks[taskIndex].done=true;
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:taskCaseId,version:1,playbook:workingPlan})).status,200);
   const lead={id:"task-discovery-lead",kind:"SCHOLARLY",title:"Synthetic attached source",summary:"Fixture only",source:"Synthetic index",url:"https://example.org/task-source",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"};
   const revised=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:taskCaseId,version:2,researchWorkflow:{...workflow,retrievalQuery:"Synthetic task source search",leads:[lead]}});
   assert.equal(revised.status,200);assert.deepEqual(revised.body.case.playbook,workingPlan);
   const adapted=structuredClone(workingPlan);adapted.tasks[taskIndex]=api.applyResearchTaskGuidance(adapted.tasks[taskIndex],revised.body.case.report);
   assert.equal(adapted.tasks[taskIndex].title,"Appraise discovery leads and record source applicability");
   assert.equal(adapted.tasks[taskIndex].done,false);
   const forgedCompletion=structuredClone(adapted);forgedCompletion.tasks[taskIndex].done=true;
   const request={id:taskCaseId,version:3,playbook:forgedCompletion};
   for(const [actor,version,status] of [[null,3,401],[other,3,409],[owner,2,409],[owner,"3",400]] as const)assert.equal((await call(actor,api.cases.PATCH,"/api/cases","PATCH",{...request,version})).status,status);
   const countBefore=(await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[taskCaseId])).rows[0].n;
   await db.exec("CREATE TRIGGER refuse_research_journal BEFORE INSERT ON dis_case_events FOR EACH ROW EXECUTE FUNCTION refuse_research_journal();");
   try{
    assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",request)).status,503);
    const unchanged=(await db.query<{version:number;playbook:unknown}>("SELECT version,playbook FROM dis_casework WHERE id=$1",[taskCaseId])).rows[0];
    assert.equal(unchanged.version,3);assert.deepEqual(unchanged.playbook,workingPlan);
    assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[taskCaseId])).rows[0].n,countBefore);
   }finally{await db.exec("DROP TRIGGER refuse_research_journal ON dis_case_events");}
   const saved=await call(owner,api.cases.PATCH,"/api/cases","PATCH",request);assert.equal(saved.status,200);assert.equal(saved.body.historyRecorded,true);
   assert.deepEqual(saved.body.case.playbook,adapted);assert.deepEqual(saved.body.case.report,revised.body.case.report);
   for(const key of ["owner","evidence","due","review"])assert.equal(saved.body.case.playbook.tasks[taskIndex][key],workingPlan.tasks[taskIndex][key]);
   assert.equal(saved.body.case.playbook.tasks[taskIndex].done,false);assert.deepEqual(saved.body.reopenedTaskIds,[workingPlan.tasks[taskIndex].id]);
   const checkpoint=(await db.query<{payload:any}>("SELECT payload FROM dis_case_events WHERE case_id=$1 AND payload->>'caseVersion'='4'",[taskCaseId])).rows[0].payload;
   assert.deepEqual(checkpoint.previousPlaybook,workingPlan);assert.deepEqual(checkpoint.playbook,adapted);assert.equal(checkpoint.previousVersion,3);
   await db.close();db=new PGlite(databaseDirectory);await db.waitReady;fixture.__disResearchRouteDb=db;
   const reopened=await call(owner,api.cases.GET,"/api/cases?id="+taskCaseId,"GET");
   assert.deepEqual(reopened.body.case.playbook,adapted);assert.equal(reopened.body.case.version,4);
   assert.deepEqual(reopened.body.history.find((event:any)=>event.payload.caseVersion===4).payload.previousPlaybook,workingPlan);
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",request)).status,409);
   const reviewed=structuredClone(adapted);reviewed.tasks[taskIndex].done=true;
   const completion=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:taskCaseId,version:4,playbook:reviewed});
   assert.equal(completion.status,200);assert.equal(completion.body.case.playbook.tasks[taskIndex].done,true);assert.deepEqual(completion.body.reopenedTaskIds,[]);
   let concurrent=false;
   fixture.__disResearchAfterTransaction=async statements=>{
    if(!statements.some(statement=>/END AS playbook FROM dis_casework/.test(statement.text)))return;
    fixture.__disResearchAfterTransaction=null;
    await as(owner,()=>db.query("UPDATE dis_casework SET version=version+1 WHERE id=$1",[taskCaseId]));concurrent=true;
   };
   try{
    const lost=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id:taskCaseId,version:5,playbook:adapted});
    assert.equal(concurrent,true);assert.equal(lost.status,409);
    const current=(await db.query<{version:number;playbook:unknown}>("SELECT version,playbook FROM dis_casework WHERE id=$1",[taskCaseId])).rows[0];
    assert.equal(current.version,6);assert.deepEqual(current.playbook,reviewed);
   }finally{fixture.__disResearchAfterTransaction=null;}
  });
  await t.test("an admitted near-limit Unicode plan remains editable after JSONB formatting, with bounded legacy reads",async()=>{
   const created=await call(owner,api.cases.POST,"/api/cases","POST",createBody);assert.equal(created.status,201);
   const id=created.body.case.id,largePlan=structuredClone(created.body.case.playbook);
   largePlan.tasks=Array.from({length:35},(_,i)=>({...largePlan.tasks[0],id:"capacity-"+i,title:"T".repeat(160),why:"漢".repeat(2000),success:"S".repeat(700),evidence:"E".repeat(2000),owner:"O".repeat(50)}));
   largePlan.progressNotes=[];
   const target=249950;
   while(JSON.stringify(largePlan).length<target){
    const remaining=target-JSON.stringify(largePlan).length;if(remaining<=3)break;
    largePlan.progressNotes.push("N".repeat(Math.min(1000,remaining-(largePlan.progressNotes.length?3:2))));
   }
   assert.equal(JSON.stringify(largePlan).length,target);assert.ok(largePlan.progressNotes.length<=80);
   const saved=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id,version:1,playbook:largePlan});
   assert.equal(saved.status,200);assert.equal(saved.body.case.version,2);
   const stored=(await db.query<{characters:number;bytes:number}>("SELECT char_length(playbook::text) AS characters,octet_length(playbook::text) AS bytes FROM dis_casework WHERE id=$1",[id])).rows[0];
   assert.ok(stored.characters>250000);assert.ok(stored.bytes>stored.characters);assert.ok(stored.bytes<1000000);
   const smaller={...largePlan,progressNotes:[]};
   const shrunk=await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id,version:2,playbook:smaller});
   assert.equal(shrunk.status,200);assert.equal(shrunk.body.case.version,3);assert.deepEqual(shrunk.body.case.playbook,smaller);
   const checkpoint=(await db.query<{payload:any}>("SELECT payload FROM dis_case_events WHERE case_id=$1 AND payload->>'caseVersion'='3'",[id])).rows[0].payload;
   assert.deepEqual(checkpoint.previousPlaybook,largePlan);assert.deepEqual(checkpoint.playbook,smaller);
   // Oversized legacy content is rejected before transport, without truncation.
   const hugeLegacy={...smaller,legacyPayload:"L".repeat(1000001)};
   await db.query("UPDATE dis_casework SET playbook=$2::jsonb WHERE id=$1",[id,JSON.stringify(hugeLegacy)]);
   const eventCount=(await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[id])).rows[0].n;
   assert.equal((await call(owner,api.cases.PATCH,"/api/cases","PATCH",{id,version:3,playbook:smaller})).status,413);
   const unchanged=(await db.query<{version:number;playbook:unknown}>("SELECT version,playbook FROM dis_casework WHERE id=$1",[id])).rows[0];
   assert.equal(unchanged.version,3);assert.deepEqual(unchanged.playbook,hugeLegacy);
   assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[id])).rows[0].n,eventCount);
  });
  await t.test("committed research inputs and history remain available after closing and reopening the database",async()=>{
   await db.close();db=new PGlite(databaseDirectory);await db.waitReady;fixture.__disResearchRouteDb=db;
   const loaded=await call(owner,api.cases.GET,"/api/cases?id="+item.id,"GET");
   assert.equal(loaded.status,200);assert.equal(loaded.body.case.version,4);assert.deepEqual(loaded.body.case.report,original);assert.deepEqual(loaded.body.case.playbook,plan);
   assert.equal(loaded.body.history.length,3);
   assert.equal((await call(other,api.cases.GET,"/api/cases?id="+item.id,"GET")).status,404);
   assert.ok(otherWorkspaceId);
  });
 }finally{
  await db.close();rmSync(directory,{recursive:true,force:true});
  delete fixture.__disResearchRouteActor;delete fixture.__disResearchRouteDb;delete fixture.__disResearchAfterTransaction;
  if(previousDatabaseUrl===undefined)delete process.env.DIS_DATABASE_URL;else process.env.DIS_DATABASE_URL=previousDatabaseUrl;
 }
});
