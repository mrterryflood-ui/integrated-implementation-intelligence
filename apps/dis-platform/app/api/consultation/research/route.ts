import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {investigate} from "../../../../lib/consultation-research";
import {sanitizeIntake} from "../../../../lib/consultation";
export const runtime="nodejs";
export const maxDuration=45;
export async function POST(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in to investigate"},{status:401});
 let body:any;try{body=await request.json()}catch{return Response.json({error:"Malformed input"},{status:400})}
 if(body?.externalConsent!==true)return Response.json({error:"External research requires explicit consent"},{status:403});
 const intake=sanitizeIntake(body?.intake&&typeof body.intake==="object"?body.intake:{});
 if(intake.mission.length<8)return Response.json({error:"Describe the question or problem first"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Research quota service unavailable"},{status:503});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const result=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_consult_usage(subject_id,calls) VALUES(${userId},1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_consult_usage.calls+1 WHERE dis_consult_usage.calls<20 RETURNING calls`
  ]);
  if(!result[1]?.length)return Response.json({error:"Daily research limit reached; resume tomorrow or review saved material"},{status:429});
 }catch{return Response.json({error:"Research authorization unavailable"},{status:503})}
 const data=await investigate(intake);
 return Response.json(data,{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
