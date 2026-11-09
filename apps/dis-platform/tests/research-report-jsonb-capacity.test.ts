/** Actual case handlers + PGlite. Identity/transport are synthetic; no live user or care.
 * Negative control reinstates only the former report-read predicate in the same handler.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {createRequire} from "node:module";
import {createHash} from "node:crypto";
import {build} from "esbuild";
import {PGlite} from "@electric-sql/pglite";

type Globals=typeof globalThis&{__reportCapacityActor?:string|null;__reportCapacityDb?:PGlite};
const globals=globalThis as Globals;

test("research report JSONB expansion does not lock an admitted investigation",async t=>{
 const folder=mkdtempSync(join(tmpdir(),"dis-report-capacity-")),bundle=join(folder,"routes.cjs");
 const priorUrl=process.env.DIS_DATABASE_URL;
 const db=new PGlite();await db.waitReady;
 try{
  const routePath=join(process.cwd(),"app/api/cases/route.ts");
  const current=readFileSync(routePath,"utf8");
  const former=current.replaceAll("CASE_REPORT_MAX_DB_BYTES","CASE_REPORT_MAX_CHARS").replace("octet_length(report::text)","char_length(report::text)");
  assert.notEqual(current,former,"Negative control must actually reinstate the old predicate");
  const oldBlob=createHash("sha1").update(`blob ${Buffer.byteLength(former)}\0`).update(former).digest("hex");
  t.diagnostic("Reconstructed old handler Git blob: "+oldBlob);
  await build({stdin:{contents:`
   export * as cases from './app/api/cases/route';
   export * as former from 'before-report-capacity';
   export {emptyResearchWorkflow,buildResearchWorkflowCase} from './lib/research-workflow';
   export {CASE_REPORT_MAX_CHARS,CASE_REPORT_MAX_DB_BYTES,serializeCaseReport} from './lib/case-payload-capacity';
  `,resolveDir:process.cwd(),loader:"ts"},outfile:bundle,bundle:true,platform:"node",format:"cjs",packages:"external",logLevel:"silent",plugins:[{
   name:"explicit-synthetic-identity-transport-and-negative-control",setup(b){
    b.onResolve({filter:/^before-report-capacity$/},()=>({path:"former",namespace:"former"}));
    b.onLoad({filter:/.*/,namespace:"former"},()=>({contents:former,loader:"ts",resolveDir:dirname(routePath)}));
    b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:"identity",namespace:"fixture"}));
    b.onResolve({filter:/^@neondatabase\/serverless$/},()=>({path:"sql",namespace:"fixture"}));
    b.onLoad({filter:/.*/,namespace:"fixture"},a=>({loader:"js",contents:a.path==="identity"
     ?"export async function auth(){return {userId:globalThis.__reportCapacityActor}}"
     :`export function neon(){
       const q=(s,...values)=>({text:s.reduce((a,x,i)=>a+x+(i<values.length?'$'+(i+1):''),''),values});
       q.query=(text,values=[])=>({text,values});
       q.transaction=async statements=>{const d=globalThis.__reportCapacityDb;await d.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
        try{const rows=[];for(const s of statements)rows.push((await d.query(s.text,s.values)).rows);await d.exec('COMMIT');return rows;}
        catch(e){await d.exec('ROLLBACK');throw e;}};return q;}`
    }));
   }
  }]});
  const api=createRequire(import.meta.url)(bundle);
  globals.__reportCapacityDb=db;process.env.DIS_DATABASE_URL="synthetic-capacity-transport-not-a-credential";
  await db.exec(readFileSync("tests/fixtures/casework-recovery-schema.sql","utf8"));
  const owner="synthetic-capacity-owner",other="synthetic-capacity-other",origin="https://capacity-fixture.test";
  await db.query("INSERT INTO dis_subjects VALUES($1),($2)",[owner,other]);
  const workspace=String((await db.query<{id:string}>("INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,$2) RETURNING id",[owner,"Synthetic capacity regression"])).rows[0].id);
  const call=async(actor:string|null,handler:(r:Request)=>Promise<Response>,method:string,body:unknown,requestOrigin=origin)=>{
   globals.__reportCapacityActor=actor;
   const r=await handler(new Request(origin+"/api/cases",{method,headers:{"content-type":"application/json",origin:requestOrigin},body:JSON.stringify(body)}));
   return {status:r.status,body:await r.json()};
  };
  const events=async(id:string)=>Number((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_case_events WHERE case_id=$1",[id])).rows[0].n);
  const snapshot=async(id:string)=>(await db.query<{version:number;report:any;playbook:any}>("SELECT version,report,playbook FROM dis_casework WHERE id=$1",[id])).rows[0];
  // Fill only documented fields and synthetic notes, then use the actual constructor
  // and admission limits to find a valid report just below the compact limit.
  const largeWorkflow=(symbol:string)=>{
   let best:any=null,bestLength=0;
   for(const budget of [23000,18000,12000,6000,0]){
    const base=api.emptyResearchWorkflow();base.publicAggregateConfirmed=true;
    if(budget){const count=20,size=Math.max(1,Math.floor((budget-4200)/count));
     base.supplementText=JSON.stringify({additionalGaps:[],notes:Array.from({length:count},(_,i)=>({id:"capacity-note-"+i,kind:"SOURCE",text:"SYNTHETIC "+symbol.repeat(size),sourceUrl:"https://example.org/synthetic-capacity",gapIds:[],origin:"SYNTHETIC"}))});}
    const filled=(amount:number)=>{const w=structuredClone(base);let remaining=amount;
     for(const [key,cap] of [["studyText",25000],["counterfactualText",25000],["correctionReceiptText",12000]] as const){const n=Math.min(cap,remaining);w[key]=symbol.repeat(n);remaining-=n;}
     for(const key of Object.keys(w.narrative)){const n=Math.min(2200,remaining);w.narrative[key]+=(n?symbol.repeat(n):"");remaining-=n;}
     return w;
    };
    let lo=0,hi=100000;
    while(lo<=hi){const mid=Math.floor((lo+hi)/2),w=filled(mid);
     try{const report=api.buildResearchWorkflowCase(w).report,len=JSON.stringify(report).length;
      if(len>api.CASE_REPORT_MAX_CHARS-16){hi=mid-1;continue;}
      if(len>bestLength){best=w;bestLength=len;}lo=mid+1;
     }catch(e){assert.ok(e instanceof Error);hi=mid-1;}
    }
    if(bestLength>=api.CASE_REPORT_MAX_CHARS-16)break;
   }
   assert.ok(bestLength>=api.CASE_REPORT_MAX_CHARS-100,`fixture must approach report cap, observed ${bestLength}`);
   return best;
  };
  let last:any;
  for(const [name,symbol] of [["ASCII","x"],["Unicode","界"]]){
   await t.test(name+": old handler rejects smaller edit, repaired handler preserves archive and succeeds",async()=>{
    const w=largeWorkflow(symbol),expected=api.buildResearchWorkflowCase(w).report;
    const created=await call(owner,api.cases.POST,"POST",{workspaceId:workspace,researchWorkflow:w});
    assert.equal(created.status,201,JSON.stringify(created.body));const item=created.body.case;last=item;
    const size=(await db.query<{chars:number;bytes:number}>("SELECT char_length(report::text)::int AS chars,octet_length(report::text)::int AS bytes FROM dis_casework WHERE id=$1",[item.id])).rows[0];
    assert.ok(JSON.stringify(expected).length<=api.CASE_REPORT_MAX_CHARS);
    assert.ok(size.chars>api.CASE_REPORT_MAX_CHARS,JSON.stringify(size));assert.ok(size.bytes<=api.CASE_REPORT_MAX_DB_BYTES);
    const small=api.emptyResearchWorkflow();small.publicAggregateConfirmed=true;
    small.narrative.setting="Synthetic smaller replacement; no patient data";
    const edit={id:item.id,version:1,researchWorkflow:small};const before=await snapshot(item.id),n=await events(item.id);
    const blocked=await call(owner,api.former.PATCH,"PATCH",edit);assert.equal(blocked.status,413);
    assert.deepEqual(await snapshot(item.id),before);assert.equal(await events(item.id),n);
    const accepted=await call(owner,api.cases.PATCH,"PATCH",edit);assert.equal(accepted.status,200,JSON.stringify(accepted.body));
    assert.equal(accepted.body.case.version,2);assert.ok(JSON.stringify(accepted.body.case.report).length<JSON.stringify(expected).length);
    assert.deepEqual(accepted.body.case.playbook,before.playbook);assert.deepEqual(accepted.body.case.report.sourceIndicators,before.report.sourceIndicators);
    const journal=(await db.query<{payload:any}>("SELECT payload FROM dis_case_events WHERE case_id=$1 AND event_type='REASSESSMENT'",[item.id])).rows;
    assert.equal(journal.length,1);assert.deepEqual(journal[0].payload.previousReport,before.report);
    for(const field of ["causalEffectEstablished","independentOutcomeVerified","interventionAuthorized","externalCommunicationAuthorized"])
     assert.equal(accepted.body.case.report[field],false);
    assert.equal(await events(item.id),n+1);last=accepted.body.case;
    t.diagnostic(name+" compact="+JSON.stringify(expected).length+" storedChars="+size.chars+" storedBytes="+size.bytes+" old=413 new=200");
   });
  }
  await t.test("owner, origin and stale-version gates remain unchanged",async()=>{
   const w=api.emptyResearchWorkflow();w.publicAggregateConfirmed=true;const input={id:last.id,version:last.version,researchWorkflow:w};
   const before=await snapshot(last.id),n=await events(last.id);
   assert.equal((await call(null,api.cases.PATCH,"PATCH",input)).status,401);
   assert.equal((await call(other,api.cases.PATCH,"PATCH",input)).status,409);
   assert.equal((await call(owner,api.cases.PATCH,"PATCH",input,"https://foreign.test")).status,403);
   assert.equal((await call(owner,api.cases.PATCH,"PATCH",{...input,version:1})).status,409);
   assert.deepEqual(await snapshot(last.id),before);assert.equal(await events(last.id),n);
  });
  await t.test("oversized legacy storage is still refused without mutation",async()=>{
   const report=structuredClone(last.report);report.syntheticOversize="x".repeat(api.CASE_REPORT_MAX_DB_BYTES);
   await db.query("UPDATE dis_casework SET report=$1::jsonb WHERE id=$2",[JSON.stringify(report),last.id]);
   const before=await snapshot(last.id),n=await events(last.id),w=api.emptyResearchWorkflow();w.publicAggregateConfirmed=true;
   const result=await call(owner,api.cases.PATCH,"PATCH",{id:last.id,version:last.version,researchWorkflow:w});
   assert.equal(result.status,413);assert.deepEqual(await snapshot(last.id),before);assert.equal(await events(last.id),n);
  });
  await t.test("compact submission and transport limits are not increased",()=>{
   assert.equal(api.CASE_REPORT_MAX_CHARS,128000);assert.equal(api.CASE_REPORT_MAX_DB_BYTES,512000);
   assert.throws(()=>api.serializeCaseReport({synthetic:"x".repeat(128000)}),/128,000/);
  });
 }finally{
  if(priorUrl===undefined)delete process.env.DIS_DATABASE_URL;else process.env.DIS_DATABASE_URL=priorUrl;
  delete globals.__reportCapacityActor;delete globals.__reportCapacityDb;await db.close();rmSync(folder,{recursive:true,force:true});
 }
});
