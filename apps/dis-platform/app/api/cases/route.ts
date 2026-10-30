import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {buildPlaybook,validatePlaybook} from "../../../lib/decision-playbook";
import {buildLearningCheckpoint} from "../../../lib/longitudinal-learning";
export const runtime="nodejs";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
async function context(){const {userId}=await auth();if(!userId)return null;if(!process.env.DIS_DATABASE_URL)throw Error("Data unavailable");return {userId,sql:neon(process.env.DIS_DATABASE_URL)}}
const fail=()=>Response.json({error:"Case workspace unavailable"},{status:503});
export async function GET(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const p=new URL(request.url).searchParams,id=p.get("id"),workspaceId=p.get("workspaceId");
 if(id){if(!uuid.test(id))return Response.json({error:"Invalid case identifier"},{status:400});
 const rows=await ctx.sql.transaction([
  ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
  ctx.sql`SELECT id,workspace_id,title,question,report,playbook,version,status,updated_at,created_at FROM dis_casework WHERE id=${id} LIMIT 1`,
  ctx.sql`SELECT id,event_type,payload,created_at FROM dis_case_events WHERE case_id=${id} ORDER BY created_at DESC,id DESC LIMIT 250`
 ]);
 return rows[1].length?Response.json({case:rows[1][0],history:rows[2],historyLimit:250}):Response.json({error:"Not found"},{status:404})}
 if(!workspaceId||!uuid.test(workspaceId))return Response.json({error:"Valid workspace required"},{status:400});
 const rows=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`SELECT id,workspace_id,title,question,status,version,updated_at FROM dis_casework WHERE workspace_id=${workspaceId} ORDER BY updated_at DESC LIMIT 100`]);
 return Response.json({cases:rows[1]});
}catch{return fail()}}
export async function POST(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const input=await request.json();const workspaceId=String(input.workspaceId||""),question=String(input.question||"").trim();
 const title=String(input.title||question.slice(0,90)).trim();
 if(!uuid.test(workspaceId)||question.length<5||question.length>3000||title.length<1||title.length>150)return Response.json({error:"Invalid workspace or question"},{status:400});
 const report=input.report&&typeof input.report==="object"?input.report:{state:"NOT_RUN"};
 if(JSON.stringify(report).length>65000)return Response.json({error:"Report exceeds save limit"},{status:413});
 const playbook=buildPlaybook(question,report);
 const rows=await ctx.sql.transaction([
 ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
 ctx.sql`INSERT INTO dis_casework(workspace_id,owner_subject,title,question,report,playbook,status) VALUES(${workspaceId},${ctx.userId},${title},${question},${JSON.stringify(report)}::jsonb,${JSON.stringify(playbook)}::jsonb,'ACTIVE') RETURNING id,workspace_id,title,question,report,playbook,version,status,updated_at`
 ]);
 if(!rows[1].length)return Response.json({error:"Workspace not found or not authorized"},{status:404});
 return Response.json({case:rows[1][0],note:"Saved draft and checkpoints; acceptance and observed outcomes still require verification."},{status:201});
}catch{return fail()}}
export async function PATCH(request:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const input=await request.json(),id=String(input.id||""),version=Number(input.version);
 if(!uuid.test(id)||!Number.isInteger(version)||version<1||!validatePlaybook(input.playbook))return Response.json({error:"Invalid case update"},{status:400});
 const body=JSON.stringify(input.playbook);
 if(body.length>50000)return Response.json({error:"Update too large"},{status:413});
 // The case update and longitudinal journal are one atomic operation. A partial
 // archival failure rolls back the case update; no success is falsely reported.
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
}catch{return fail()}}
