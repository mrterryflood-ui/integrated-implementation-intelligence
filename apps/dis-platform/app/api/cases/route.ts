import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {buildPlaybook,validatePlaybook} from "../../../lib/decision-playbook";
import {buildLearningCheckpoint} from "../../../lib/longitudinal-learning";
import {CASE_REPORT_MAX_CHARS,CasePayloadError,readBoundedCaseJson,serializeCasePlaybook,serializeCaseReport} from "../../../lib/case-payload-capacity";
import {CASE_HISTORY_DB_PAYLOAD_BYTES,CASE_HISTORY_LIMIT,CASE_HISTORY_PAGE_SQL,CaseHistoryReadError,buildCaseHistoryPageBody,decodeCaseHistoryCursor,type CaseHistoryDatabasePage} from "../../../lib/case-history-pagination";
import {randomUUID} from "node:crypto";
import {admitCaseReport} from "../../../lib/research-case-admission";
import {buildResearchWorkflowCase,reviseResearchWorkflowReport} from "../../../lib/research-workflow";
import {CASE_RESEARCH_REVISION_SQL} from "../../../lib/research-case-revision";
export const runtime="nodejs";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
async function context(){const {userId}=await auth();if(!userId)return null;if(!process.env.DIS_DATABASE_URL)throw Error("Data unavailable");return {userId,sql:neon(process.env.DIS_DATABASE_URL)}}
const fail=(e?:unknown)=>e instanceof CasePayloadError?Response.json({error:e.message},{status:e.status}):Response.json({error:"Case workspace unavailable"},{status:503});
export async function GET(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const p=new URL(request.url).searchParams,id=p.get("id"),workspaceId=p.get("workspaceId");
 if(id){if(!uuid.test(id))return Response.json({error:"Invalid case identifier"},{status:400});
 try{
  const before=decodeCaseHistoryCursor(p.get("historyCursor"),id);
  const rows=await ctx.sql.transaction([
   ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
   ctx.sql.query(CASE_HISTORY_PAGE_SQL,[id,before?.createdAt??null,before?.id??null,CASE_HISTORY_DB_PAYLOAD_BYTES,CASE_HISTORY_LIMIT])
  ]);
  if(!rows[1].length)return Response.json({error:"Not found"},{status:404});
  const page=buildCaseHistoryPageBody(rows[1][0] as CaseHistoryDatabasePage,id,before);
  return new Response(page.body,{headers:{"content-type":"application/json; charset=utf-8","cache-control":"private, no-store"}});
 }catch(e){if(e instanceof CaseHistoryReadError)return Response.json(e.responseBody(),{status:e.status});throw e;}}
 if(!workspaceId||!uuid.test(workspaceId))return Response.json({error:"Valid workspace required"},{status:400});
 const rows=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`SELECT id,workspace_id,title,question,status,version,updated_at FROM dis_casework WHERE workspace_id=${workspaceId} ORDER BY updated_at DESC LIMIT 100`]);
 return Response.json({cases:rows[1]});
}catch{return fail()}}
export async function POST(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 let input=await readBoundedCaseJson(request);
 if(input.researchWorkflow!==undefined){
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Same-origin research save required"},{status:403});
  if(Object.keys(input).some(k=>!["workspaceId","researchWorkflow"].includes(k)))return Response.json({error:"Research saves accept workflow inputs and a workspace only"},{status:400});
  input={workspaceId:input.workspaceId,...buildResearchWorkflowCase(input.researchWorkflow)};
 }else if(input.report!==undefined){input={...input,report:admitCaseReport(input.report)};}
 const workspaceId=String(input.workspaceId||""),question=String(input.question||"").trim();
 const title=String(input.title||question.slice(0,90)).trim();
 if(!uuid.test(workspaceId)||question.length<5||question.length>3000||title.length<1||title.length>150)return Response.json({error:"Invalid workspace or question"},{status:400});
 const report=input.report&&typeof input.report==="object"?input.report:{state:"NOT_RUN"};
 const reportBody=serializeCaseReport(report);
 const playbook=buildPlaybook(question,report),playbookBody=serializeCasePlaybook(playbook);
 // Ordered inserts share one transaction; the event RLS policy sees its case.
 const caseId=randomUUID();
 const baseline=JSON.stringify(buildLearningCheckpoint(playbook,1,new Date().toISOString()));
 const rows=await ctx.sql.transaction([
  ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
  ctx.sql`INSERT INTO dis_casework(id,workspace_id,owner_subject,title,question,report,playbook,status)
    VALUES(${caseId}::uuid,${workspaceId},${ctx.userId},${title},${question},${reportBody}::jsonb,${playbookBody}::jsonb,'ACTIVE')
    RETURNING id,workspace_id,title,question,report,playbook,version,status,updated_at`,
  ctx.sql`INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload)
    VALUES(${caseId}::uuid,${workspaceId},${ctx.userId},'CREATED',${baseline}::jsonb) RETURNING id`
 ]);
 if(!rows[1].length||!rows[2].length)return Response.json({error:"Workspace not found or not authorized"},{status:404});
 return Response.json({case:rows[1][0],note:"Saved original baseline and action plan; acceptance and outcomes still require independent verification.",historyRecorded:true},{status:201});
}catch(e){return fail(e)}}
export async function PATCH(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const input=await readBoundedCaseJson(request),id=String(input.id||""),version=Number(input.version);
 if(input.researchWorkflow!==undefined){
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Same-origin research revision required"},{status:403});
  if(Object.keys(input).some(k=>!["id","version","researchWorkflow"].includes(k))||!uuid.test(id)||typeof input.version!=="number"||!Number.isSafeInteger(version)||version<1||version>=2147483647)return Response.json({error:"Research revision requires exact case ID, integer version and typed inputs"},{status:400});
  const prior=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`SELECT CASE WHEN char_length(report::text)<=${CASE_REPORT_MAX_CHARS} THEN report ELSE NULL END AS report FROM dis_casework WHERE id=${id}::uuid AND version=${version}`]);
  if(!prior[1].length)return Response.json({error:"Case changed or access denied. Reload before retrying."},{status:409});
  if(prior[1][0].report===null)return Response.json({error:"Stored research report exceeds bounded revision capacity; nothing changed or truncated."},{status:413});
  const body=serializeCaseReport(reviseResearchWorkflowReport(prior[1][0].report,input.researchWorkflow));
  const revised=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql.query(CASE_RESEARCH_REVISION_SQL,[id,version,body])]);
  if(!revised[1].length)return Response.json({error:"Case changed or access denied. Nothing revised; reload before retrying."},{status:409});
  return Response.json({case:revised[1][0],historyRecorded:true,note:"Research inputs saved as a new revision. Prior evidence and the current action plan are retained; review the plan against the changed inputs."},{headers:{"cache-control":"private, no-store"}});
 }
 if(!uuid.test(id)||!Number.isInteger(version)||version<1||!validatePlaybook(input.playbook))return Response.json({error:"Invalid case update"},{status:400});
 const body=serializeCasePlaybook(input.playbook);
 // Case update and checkpoint archive stay atomic and version-conflict protected.
 const learning=JSON.stringify(buildLearningCheckpoint(input.playbook,version+1,new Date().toISOString()));
 const rows=await ctx.sql.transaction([
  ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
  ctx.sql`WITH updated AS (
    UPDATE dis_casework SET playbook=${body}::jsonb,version=version+1,updated_at=now()
    WHERE id=${id} AND version=${version}
    RETURNING id,workspace_id,owner_subject,title,question,report,playbook,version,status,updated_at
   ), journal AS (
    INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload)
    SELECT id,workspace_id,owner_subject,'CHECKPOINT',${learning}::jsonb FROM updated
    RETURNING id
   )
   SELECT updated.id,updated.workspace_id,updated.title,updated.question,
     updated.report,updated.playbook,updated.version,updated.status,
     updated.updated_at,journal.id AS learning_event_id FROM updated CROSS JOIN journal`
 ]);
 if(!rows[1].length)return Response.json({error:"Version conflict, not found, or access denied. Reload before retrying."},{status:409});
 return Response.json({case:rows[1][0],historyRecorded:true});
}catch(e){return fail(e)}}
