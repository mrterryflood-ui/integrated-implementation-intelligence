import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {convene} from "../../../../lib/council-engine";
export const runtime="nodejs";
export const maxDuration=90;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export async function POST(request:Request){try{
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in required"},{status:401});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Workspace unavailable"},{status:503});
 const body=await request.json(),id=String(body.id||""),version=Number(body.version);
 if(!uuid.test(id)||!Number.isInteger(version)||version<1)return Response.json({error:"Invalid case or version"},{status:400});
 const sql=neon(process.env.DIS_DATABASE_URL);
 const rows=await sql.transaction([
  sql`SELECT set_config('dis.subject_id',${userId},true)`,
  sql`SELECT id,workspace_id,question,playbook,report,version FROM dis_casework WHERE id=${id} AND version=${version} LIMIT 1`
 ]);
 if(!rows[1].length)return Response.json({error:"Case was updated or access denied; refresh before rechecking"},{status:409});
 const prior=rows[1][0],playbook=prior.playbook as {tasks?:{title:string,done:boolean,evidence:string}[],metrics?:{label:string,observed:string,verified:boolean}[],progressNotes?:string[]};
 const observations=JSON.stringify({tasks:playbook.tasks?.map(t=>({title:t.title,done:t.done,evidence:t.evidence.slice(0,350)})),metrics:playbook.metrics?.map(m=>({measure:m.label,observed:m.observed,verified:m.verified})),recentNotes:playbook.progressNotes?.slice(-8)}).slice(0,4500);
 const prompt=String(prior.question).slice(0,1800)+"\n\nLatest user-reported progress and observations (UNVERIFIED):\n"+observations+"\n\nReassess course of action, reaction, counteraction, measurable outcomes, implementation gaps and next review. Differentiate user reports from verified evidence.";
 const report=await convene({prompt,count:6,redCount:4,selected:[],redSelected:[],depth:"Deep"});
 if(report.state!=="PRELIMINARY_DELIBERATION")return Response.json({error:"New council research or inference was incomplete. Existing assessment preserved.",state:report.state},{status:503});
 const audit=JSON.stringify(report);
 if(audit.length>65000)return Response.json({error:"Report exceeds safe storage limit"},{status:413});
 // Prior report is preserved as an append-only revision event. Case update uses optimistic concurrency.
 // A council reassessment must preserve its predecessor in the same
 // transaction as the new report. No best-effort archival success claims.
 const previous=JSON.stringify(prior.report);
 const updated=await sql.transaction([
  sql`SELECT set_config('dis.subject_id',${userId},true)`,
  sql`WITH revised AS (
    UPDATE dis_casework SET report=${audit}::jsonb,version=version+1,updated_at=now(),status='REVIEW'
    WHERE id=${id} AND version=${version}
    RETURNING id,workspace_id,owner_subject,title,question,report,playbook,version,status,updated_at
   ), archived AS (
    INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload)
    SELECT id,workspace_id,owner_subject,'REASSESSMENT',
      jsonb_build_object('previousVersion',${version}::integer,'previousReport',${previous}::jsonb,
      'newVersion',version,'evidenceState','PRELIMINARY_NOT_INDEPENDENTLY_VERIFIED')
    FROM revised RETURNING id
   )
   SELECT revised.id,revised.workspace_id,revised.title,revised.question,
     revised.report,revised.playbook,revised.version,revised.status,revised.updated_at,
     archived.id AS reassessment_event_id FROM revised CROSS JOIN archived`
 ]);
 if(!updated[1].length)return Response.json({error:"The case changed during recheck. New report was not applied."},{status:409});
 return Response.json({case:updated[1][0],note:"Preliminary council reassessment and prior report archived atomically; the new analysis is not independently verified.",historyRecorded:true});
}catch{return Response.json({error:"Recheck unavailable"},{status:503})}}
