import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {readBoundedJsonRequest,jsonRequestStatus} from "../../../../lib/bounded-json-request";
import {AssessmentRecoveryError,validateAssessmentOrigin,assessmentRestoreRequest,CASE_ASSESSMENT_SOURCE_SQL,validateAssessmentSource,CASE_ASSESSMENT_RESTORE_SQL,assessmentRestoreResponse} from "../../../../lib/case-assessment-recovery";
export const runtime="nodejs";

export async function POST(request:Request){try{
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in required"},{status:401});
 validateAssessmentOrigin(request);
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Case recovery unavailable"},{status:503});
 let input:unknown;try{input=await readBoundedJsonRequest(request,4000)}catch(e){return Response.json({error:"Invalid or oversized recovery request"},{status:jsonRequestStatus(e)})}
 const {id,version,eventId}=assessmentRestoreRequest(input),sql=neon(process.env.DIS_DATABASE_URL);
 const source=await sql.transaction([
  sql`SELECT set_config('dis.subject_id',${userId},true)`,
  sql.query(CASE_ASSESSMENT_SOURCE_SQL,[id,version,eventId])
 ]);
 validateAssessmentSource(source[1][0],version);
 const restored=await sql.transaction([
  sql`SELECT set_config('dis.subject_id',${userId},true)`,
  sql.query(CASE_ASSESSMENT_RESTORE_SQL,[id,version,eventId])
 ]);
 return new Response(assessmentRestoreResponse(restored[1][0],eventId),{headers:{"content-type":"application/json; charset=utf-8","cache-control":"private, no-store"}});
}catch(e){return e instanceof AssessmentRecoveryError?Response.json({error:e.message},{status:e.status}):Response.json({error:"Case recovery unavailable; reload the case before retrying"},{status:503})}}
