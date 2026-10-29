import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
async function getContext(){const {userId}=await auth();if(!userId)return null;const url=process.env.DIS_DATABASE_URL;if(!url)throw new Error("Database unavailable");return {userId,sql:neon(url)}}
export async function GET(){try{const ctx=await getContext();if(!ctx)return Response.json({error:"Unauthorized"},{status:401});
const results=await ctx.sql.transaction([
 ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
 ctx.sql`SELECT id,title,created_at FROM dis_workspaces ORDER BY created_at DESC LIMIT 100`
]);return Response.json({workspaces:results[1]})}catch{return Response.json({error:"Workspace service unavailable"},{status:503})}}
export async function POST(request:Request){try{const ctx=await getContext();if(!ctx)return Response.json({error:"Unauthorized"},{status:401});
const body=await request.json();const title=typeof body.title==="string"?body.title.trim():"";
if(title.length<1||title.length>120)return Response.json({error:"Invalid title"},{status:400});
const results=await ctx.sql.transaction([
 ctx.sql`SELECT set_config('dis.subject_id',${ctx.userId},true)`,
 ctx.sql`INSERT INTO dis_subjects(subject_id) VALUES(${ctx.userId}) ON CONFLICT DO NOTHING`,
 ctx.sql`INSERT INTO dis_workspaces(owner_subject,title) VALUES(${ctx.userId},${title}) RETURNING id,title,created_at`
]);return Response.json({workspace:results[2][0]},{status:201})}catch{return Response.json({error:"Workspace service unavailable"},{status:503})}}
