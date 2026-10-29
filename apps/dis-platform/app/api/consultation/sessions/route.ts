import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {sanitizeIntake} from "../../../lib/consultation";
import {buildPackage,type SlideSpec} from "../../../lib/consultation-package";
export const runtime="nodejs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validSlides(value:unknown):value is SlideSpec[]{
 return Array.isArray(value)&&value.length===12&&value.every((s:any)=>s&&typeof s.id==="string"&&s.id.length<25&&typeof s.title==="string"&&s.title.length<=180&&typeof s.kicker==="string"&&s.kicker.length<=140&&Array.isArray(s.bullets)&&s.bullets.length<=6&&s.bullets.every((v:unknown)=>typeof v==="string"&&v.length<=500)&&typeof s.notes==="string"&&s.notes.length<=2000&&Array.isArray(s.sourceIds)&&s.sourceIds.every((v:unknown)=>typeof v==="string"&&v.length<50));
}
async function context(){const {userId}=await auth();if(!userId)return null;if(!process.env.DIS_DATABASE_URL)throw Error("Unavailable");return {userId,sql:neon(process.env.DIS_DATABASE_URL)}}
const bad=()=>Response.json({error:"Consultation service unavailable"},{status:503});
export async function GET(req:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const url=new URL(req.url),id=url.searchParams.get("id")||"",workspaceId=url.searchParams.get("workspaceId")||"";
 if(id){
  if(!UUID.test(id))return Response.json({error:"Invalid identifier"},{status:400});
  const r=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`SELECT id,workspace_id,title,intake,research,artifacts,slides,version,review_status,created_at,updated_at FROM dis_consult_sessions WHERE id=${id} LIMIT 1`]);
  return r[1]?.length?Response.json({session:r[1][0]}):Response.json({error:"Not found"},{status:404});
 }
 if(!UUID.test(workspaceId))return Response.json({error:"Valid workspace required"},{status:400});
 const r=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`SELECT id,workspace_id,title,version,review_status,created_at,updated_at FROM dis_consult_sessions WHERE workspace_id=${workspaceId} ORDER BY updated_at DESC LIMIT 70`]);
 return Response.json({sessions:r[1]});
 }catch{return bad()}}
export async function POST(req:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 if(Number(req.headers.get("content-length")||0)>180000)return Response.json({error:"Payload too large"},{status:413});
 const body=await req.json(),workspaceId=String(body.workspaceId||""),mode=body.mode==="general"?"general":"startup";
 const intake=sanitizeIntake(body.intake&&typeof body.intake==="object"?body.intake:{});
 if(!UUID.test(workspaceId)||intake.mission.length<8)return Response.json({error:"Invalid workspace or problem"},{status:400});
 const pkg=buildPackage(intake,mode);
 const title=(body.title&&typeof body.title==="string"?body.title:intake.organization||intake.mission).trim().slice(0,140);
 const results=await ctx.sql.transaction([
  ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
  ctx.sql`INSERT INTO dis_consult_sessions(workspace_id,owner_subject,title,intake,research,artifacts,slides) VALUES(${workspaceId},${ctx.userId},${title},${JSON.stringify({...intake,mode})}::jsonb,'{}'::jsonb,${JSON.stringify(pkg.documents)}::jsonb,${JSON.stringify(pkg.slides)}::jsonb) RETURNING id,title,version,review_status,updated_at`
 ]);
 return results[1]?.length?Response.json({session:results[1][0]},{status:201}):Response.json({error:"Workspace not found or unauthorized"},{status:404});
 }catch{return bad()}}
export async function PATCH(req:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 if(Number(req.headers.get("content-length")||0)>180000)return Response.json({error:"Payload too large"},{status:413});
 const body=await req.json(),id=String(body.id||""),version=Number(body.version);
 if(!UUID.test(id)||!Number.isInteger(version)||version<1)return Response.json({error:"Invalid session revision"},{status:400});
 if(!validSlides(body.slides))return Response.json({error:"Provide twelve valid editable slides"},{status:400});
 const artifacts=Array.isArray(body.artifacts)?body.artifacts:[];
 if(artifacts.length>20||!artifacts.every((a:any)=>a&&typeof a.id==="string"&&typeof a.title==="string"&&a.title.length<180&&typeof a.body==="string"&&a.body.length<=17000))return Response.json({error:"Invalid document payload"},{status:400});
 const research=body.research&&typeof body.research==="object"?body.research:{};
 if(JSON.stringify(research).length>65000)return Response.json({error:"Research evidence exceeds limit"},{status:413});
 const reviewStatus=["DRAFT","REVIEWED","APPROVED"].includes(body.reviewStatus)?body.reviewStatus:"DRAFT";
 const result=await ctx.sql.transaction([
  ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
  ctx.sql`UPDATE dis_consult_sessions SET artifacts=${JSON.stringify(artifacts)}::jsonb,slides=${JSON.stringify(body.slides)}::jsonb,research=${JSON.stringify(research)}::jsonb,review_status=${reviewStatus},updated_at=now(),version=version+1 WHERE id=${id} AND version=${version} RETURNING id,version,review_status,updated_at`
 ]);
 return result[1]?.length?Response.json({session:result[1][0]}):Response.json({error:"Revision conflict, access denied, or session not found"},{status:409});
 }catch{return bad()}}
export async function DELETE(req:Request){try{
 const ctx=await context();if(!ctx)return Response.json({error:"Sign in required"},{status:401});
 const id=new URL(req.url).searchParams.get("id")||"";if(!UUID.test(id))return Response.json({error:"Invalid identifier"},{status:400});
 const result=await ctx.sql.transaction([ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,ctx.sql`DELETE FROM dis_consult_sessions WHERE id=${id} RETURNING id`]);
 return result[1]?.length?Response.json({deleted:true}):Response.json({error:"Not found"},{status:404});
 }catch{return bad()}}
