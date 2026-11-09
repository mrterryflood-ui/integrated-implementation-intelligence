import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {readBoundedJsonRequest,jsonRequestStatus} from "../../../../lib/bounded-json-request";
import {detail} from "./opportunity-detail";
export const runtime="nodejs";
export const maxDuration=25;
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in required"},{status:401});
 let body:any;try{body=await readBoundedJsonRequest(req,2000)}catch(e){return Response.json({error:"Invalid or oversized JSON request"},{status:jsonRequestStatus(e)});}
 const id=Number(body?.opportunityId);
 if(!Number.isInteger(id)||id<1||id>99999999999)return Response.json({error:"Invalid Grants.gov ID"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Research authorization unavailable"},{status:503});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL),rows=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`INSERT INTO dis_consult_usage(subject_id,calls) VALUES(${userId},1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_consult_usage.calls+1 WHERE dis_consult_usage.calls<20 RETURNING calls`]);
  if(!rows[1]?.length)return Response.json({error:"Daily research limit reached"},{status:429});
  return Response.json(await detail(id),{headers:{"cache-control":"no-store"}});
 }catch{return Response.json({error:"Official opportunity details currently unavailable"},{status:503})}
}
