/**
 * Opt-in isolated database acceptance using the actual registered route handlers.
 * Clerk subject identity and Council inference are explicit synthetic adapters.
 * No real user sign-in, production private release or model invocation is proved.
 * Config is a private JSON file; never commit it or put its contents in a receipt.
 */
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import {resolve,join} from "node:path";
import {createRequire} from "node:module";
import {randomUUID,createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {build} from "esbuild";
import {neon} from "@neondatabase/serverless";
const args=process.argv.slice(2),configPath=args[args.indexOf("--config")+1],output=args[args.indexOf("--output")+1];
if(!args.includes("--config")||!args.includes("--output")||!args.includes("--allow-isolated-synthetic-writes"))throw Error("Require private --config, --output and --allow-isolated-synthetic-writes");
const config=JSON.parse(readFileSync(configPath,"utf8")),url=new URL(config.databaseUrl);
assert.equal(config.purpose,"ISOLATED_SYNTHETIC_VALIDATION");assert.equal(url.hostname,config.expectedHostname);assert.notEqual(url.hostname,config.productionHostname);
assert.ok(config.productionHostname&&config.branchId&&config.projectId);assert.equal(decodeURIComponent(url.username),"dis_app_safe");
process.env.DIS_DATABASE_URL=config.databaseUrl;
const sql=neon(config.databaseUrl),runId=randomUUID(),actorA="synthetic-health-"+runId+"-a",actorB="synthetic-health-"+runId+"-b";
const out=resolve(output);mkdirSync(out,{recursive:true});
const baseRevision=execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),dirtyWorktree=Boolean(execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim());
const receipt={kind:"ISOLATED_DATABASE_REAL_ROUTE_HANDLERS_SYNTHETIC_IDENTITY_AND_INFERENCE",runId,startedAt:new Date().toISOString(),baseRevision,dirtyWorktree,revision:dirtyWorktree?null:baseRevision,branchId:config.branchId,projectId:config.projectId,productionDatabaseUsed:false,clerkSignInTested:false,realModelInvoked:false,checks:[]};
const check=(name,details={})=>receipt.checks.push({name,status:"PASS",...details});
const hash=value=>createHash("sha256").update(JSON.stringify(value,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v)).digest("hex");
const permissions=(await sql`SELECT current_user AS role,(SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS bypass_rls,
 has_table_privilege(current_user,'dis_case_events','UPDATE') AS history_update,
 has_table_privilege(current_user,'dis_case_events','DELETE') AS history_delete,
 (SELECT bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN ('dis_workspaces','dis_casework','dis_case_events')) AS forced_rls`)[0];
assert.equal(permissions.role,"dis_app_safe");assert.equal(permissions.bypass_rls,false);assert.equal(permissions.history_update,false);assert.equal(permissions.history_delete,false);assert.equal(permissions.forced_rls,true);check("restricted_role_and_forced_rls",permissions);
const bundlePath=join(process.cwd(),"test-results","casework-storage-fixture-"+runId+".cjs");mkdirSync(resolve(bundlePath,".."),{recursive:true});
const compilation=await build({metafile:true,stdin:{contents:`import * as workspaces from './app/api/workspaces/route'; import * as cases from './app/api/cases/route'; import * as recheck from './app/api/cases/recheck/route'; import * as restore from './app/api/cases/restore/route'; import {colorectalEvidenceAction} from './lib/evidence-action-colorectal'; import {buildEvidenceActionCaseHandoff} from './lib/evidence-action-case-handoff'; export {workspaces,cases,recheck,restore}; export const handoff=()=>{const x=colorectalEvidenceAction();return buildEvidenceActionCaseHandoff(x.program,x.bridge)};`,resolveDir:process.cwd(),loader:"ts"},outfile:bundlePath,bundle:true,platform:"node",format:"cjs",packages:"external",logLevel:"silent",plugins:[{name:"explicit-synthetic-boundaries",setup(b){b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:"identity",namespace:"synthetic"}));b.onResolve({filter:/council-engine$/},()=>({path:"council",namespace:"synthetic"}));b.onLoad({filter:/.*/,namespace:"synthetic"},a=>({loader:"js",contents:a.path==="identity"?'export async function auth(){return {userId:globalThis.__disSyntheticActor}}':'export async function convene(input){globalThis.__disSyntheticCouncilSourceCount=input.providedEvidence.length;return {state:"PRELIMINARY_DELIBERATION",deliberation:{synthesis:"SYNTHETIC acceptance interpretation; no model or clinical conclusion."}}}'}));}}]});
try{
 receipt.fixtureBundleSha256=createHash("sha256").update(readFileSync(bundlePath)).digest("hex");
 receipt.sourceInputsSha256=Object.fromEntries(Object.keys(compilation.metafile.inputs).filter(p=>!p.startsWith("<")&&!p.includes(":")).map(p=>[p,createHash("sha256").update(readFileSync(p)).digest("hex")]));
 const api=createRequire(import.meta.url)(bundlePath),handoff=api.handoff(),origin="https://synthetic-dis.example";
 const call=async(subject,handler,path,method="GET",body)=>{globalThis.__disSyntheticActor=subject;const request=new Request(origin+path,{method,headers:method==="GET"?{}:{"content-type":"application/json",origin},...(body===undefined?{}:{body:JSON.stringify(body)})});const response=await handler(request);return {status:response.status,body:await response.json()};};
 const createWorkspace=async actor=>{const x=await call(actor,api.workspaces.POST,"/api/workspaces","POST",{title:"SYNTHETIC Health acceptance "+runId});assert.equal(x.status,201);return x.body.workspace.id;};
 const createCase=async(actor,workspace)=>{const x=await call(actor,api.cases.POST,"/api/cases","POST",{workspaceId:workspace,title:"SYNTHETIC public pilot record",question:handoff.question,report:handoff.report});assert.equal(x.status,201);assert.equal(x.body.historyRecorded,true);return x.body.case;};
 const workspaceA=await createWorkspace(actorA),workspaceB=await createWorkspace(actorB);let item=await createCase(actorA,workspaceA);const other=await createCase(actorB,workspaceB);
 receipt.fixtureCaseIds=[item.id,other.id];const baselineDigest=hash(handoff.report);assert.equal(hash(item.report),baselineDigest);check("create_complete_public_pilot_case",{reportBytes:Buffer.byteLength(JSON.stringify(handoff.report)),baselineDigest});
 let loaded=await call(actorA,api.cases.GET,"/api/cases?id="+item.id);assert.equal(loaded.status,200);assert.equal(hash(loaded.body.case.report),baselineDigest);const initialEvent=loaded.body.history[0];check("reload_saved_case_and_original_checkpoint");
 const plan=structuredClone(item.playbook);plan.progressNotes.push("SYNTHETIC storage acceptance observation; field outcomes remain unmeasured.");
 let saved=await call(actorA,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:item.version,playbook:plan});assert.equal(saved.status,200);item=saved.body.case;assert.equal(item.version,2);check("save_progress_and_atomic_checkpoint");
 assert.equal((await call(actorB,api.cases.GET,"/api/cases?id="+item.id)).status,404);
 assert.equal((await call(actorB,api.cases.PATCH,"/api/cases","PATCH",{id:item.id,version:item.version,playbook:plan})).status,409);
 assert.equal((await call(actorB,api.recheck.POST,"/api/cases/recheck","POST",{id:item.id,version:item.version})).status,409);check("cross_tenant_read_update_and_recheck_denied");
 const assessed=await call(actorA,api.recheck.POST,"/api/cases/recheck","POST",{id:item.id,version:item.version});assert.equal(assessed.status,200);item=assessed.body.case;assert.equal(item.version,3);assert.equal(globalThis.__disSyntheticCouncilSourceCount,4);assert.equal(hash(item.report.retainedResearch),baselineDigest);check("actual_reassessment_handler_with_synthetic_inference_preserves_four_source_excerpts");
 loaded=await call(actorA,api.cases.GET,"/api/cases?id="+item.id);const archive=loaded.body.history.find(e=>e.event_type==="REASSESSMENT");assert.ok(archive);assert.equal(hash(archive.payload.previousReport),baselineDigest);
 assert.equal((await call(actorB,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:item.version,eventId:archive.id})).status,409);
 assert.equal((await call(actorB,api.restore.POST,"/api/cases/restore","POST",{id:other.id,version:other.version,eventId:archive.id})).status,409);check("cross_tenant_and_cross_case_restoration_denied");
 const restored=await call(actorA,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:item.version,eventId:archive.id});assert.equal(restored.status,200);item=restored.body.case;assert.equal(item.version,4);assert.equal(hash(item.report),baselineDigest);assert.deepEqual(item.playbook,plan);assert.equal(restored.body.historyRecorded,true);check("restore_archived_assessment_as_new_revision_without_losing_plan");
 assert.equal((await call(actorA,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:3,eventId:archive.id})).status,409);check("stale_restoration_rejected");
 globalThis.__disSyntheticActor=actorA;const foreign=await api.restore.POST(new Request(origin+"/api/cases/restore",{method:"POST",headers:{origin:"https://foreign.example","content-type":"application/json"},body:JSON.stringify({id:item.id,version:item.version,eventId:archive.id})}));assert.equal(foreign.status,403);check("foreign_origin_rejected_before_write");
 await sql.transaction([sql`SELECT set_config('dis.subject_id',${actorA},true)`,sql`INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload) SELECT ${item.id}::uuid,${workspaceA}::uuid,${actorA},'NOTE',jsonb_build_object('kind','SYNTHETIC_PAGINATION_ACCEPTANCE','sequence',n) FROM generate_series(1,260) n`]);
 const ids=[],events=[];let cursor=null,pages=0;do{loaded=await call(actorA,api.cases.GET,"/api/cases?id="+item.id+(cursor?"&historyCursor="+encodeURIComponent(cursor):""));assert.equal(loaded.status,200);assert.equal(loaded.body.case.version,4);assert.ok(Buffer.byteLength(JSON.stringify(loaded.body))<=3145728);ids.push(...loaded.body.history.map(e=>e.id));events.push(...loaded.body.history);cursor=loaded.body.historyPage.nextCursor;pages++;assert.ok(pages<10);}while(cursor);
 assert.equal(ids.length,264);assert.equal(new Set(ids).size,264);assert.deepEqual(events.find(e=>e.id===initialEvent.id),initialEvent);check("all_history_pages_recovered_without_duplicate_or_missing_events",{pages,events:ids.length});
 const reconnect=neon(config.databaseUrl);const again=await reconnect.transaction([reconnect`SELECT set_config('dis.subject_id',${actorA},true)`,reconnect`SELECT report,version FROM dis_casework WHERE id=${item.id}::uuid`]);assert.equal(hash(again[1][0].report),baselineDigest);assert.equal(again[1][0].version,4);check("independent_connection_recovers_committed_case");
 globalThis.__disSyntheticActor=null;assert.equal((await call(null,api.restore.POST,"/api/cases/restore","POST",{id:item.id,version:item.version,eventId:archive.id})).status,401);check("missing_identity_rejected_by_registered_handler");
 receipt.state="PASS";receipt.finalVersion=4;receipt.baselineDigest=baselineDigest;receipt.completedAt=new Date().toISOString();receipt.limits=["Synthetic subjects replace Clerk in this isolated harness; no production sign-in witnessed.","Council output is a labeled fixture; no model request or scientific validation.","Actual database SQL, RLS, route parsing, storage, paging and recovery were exercised.","Synthetic records remain on the existing validation branch; no production data changed."];
 writeFileSync(join(out,"casework-storage-receipt.json"),JSON.stringify(receipt,null,2)+"\n");console.log(JSON.stringify({state:receipt.state,checks:receipt.checks.length,receipt:join(out,"casework-storage-receipt.json"),productionSignInVerified:false}));
}finally{rmSync(bundlePath,{force:true});delete globalThis.__disSyntheticActor;delete globalThis.__disSyntheticCouncilSourceCount;}
