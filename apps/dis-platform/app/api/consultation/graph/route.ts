import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {readBoundedJsonRequest,jsonRequestStatus} from "../../../../lib/bounded-json-request";
import {buildGraphData} from "./graph-data";
export const runtime="nodejs";
export const maxDuration=45;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error=()=>Response.json({error:"Knowledge graph unavailable"},{status:503});
export async function POST(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 let body:any;try{body=await readBoundedJsonRequest(request,4000)}catch(e){return Response.json({error:"Invalid or oversized request"},{status:jsonRequestStatus(e)})}
 if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"Invalid request"},{status:400});
 const sessionId=String(body.sessionId||"");
 if(!uuid.test(sessionId)||body.confirmSync!==true)return Response.json({error:"Valid session and explicit sync approval required"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return error();
 const sql=neon(process.env.DIS_DATABASE_URL);
 try{
  const read=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`SELECT id,workspace_id,intake,research FROM dis_consult_sessions WHERE id=${sessionId} LIMIT 1`]);
  if(!read[1]?.length)return Response.json({error:"Not found"},{status:404});
  const session=read[1][0],workspaceId=String(session.workspace_id);
  const nodes=buildGraphData(sessionId,session.intake||{},session.research||{});
  if(!nodes.length)return Response.json({error:"No validated graph inputs"},{status:400});
  const inserts=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_knowledge_nodes(workspace_id,kind,label,evidence_state,metadata)
       SELECT ${workspaceId}::uuid,n.kind,n.label,'UNVALIDATED',n.metadata
       FROM jsonb_to_recordset(${JSON.stringify(nodes)}::jsonb) AS n(kind text,label text,metadata jsonb)
       ON CONFLICT DO NOTHING RETURNING id`,
   sql`SELECT id,kind,label,evidence_state,metadata FROM dis_knowledge_nodes WHERE workspace_id=${workspaceId}::uuid AND metadata->>'consultationId'=${sessionId} ORDER BY created_at,id LIMIT 60`
  ]);
  const actual=inserts[2]||[],root=actual.find((n:any)=>n.kind==="question");
  if(root){
   const edges=actual.filter((n:any)=>n.id!==root.id).map((n:any)=>({from:root.id,to:n.id,relation:n.kind==="source"?"HAS_RESEARCH_LEAD":"RELATES_TO"}));
   if(edges.length)await sql.transaction([
    sql`SELECT set_config('dis.subject_id',${userId},true)`,
    sql`INSERT INTO dis_knowledge_edges(workspace_id,from_node,to_node,relation)
      SELECT ${workspaceId}::uuid,e.source::uuid,e.target::uuid,e.relation
      FROM jsonb_to_recordset(${JSON.stringify(edges.map(e=>({source:e.from,target:e.to,relation:e.relation})))}::jsonb) AS e(source text,target text,relation text)
      ON CONFLICT DO NOTHING RETURNING id`
   ]);
  }
  return Response.json({sessionId,workspaceId,nodeCount:actual.length,sourceLeads:actual.filter((n:any)=>n.kind==="source").length,state:"APPEND_ONLY_UNVALIDATED_GRAPH",note:"Edges represent contextual relations, not causality or verified claim support. Idempotent repeated sync never overwrites independently reviewed evidence."});
 }catch{return error()}
}
export async function GET(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 const sessionId=new URL(request.url).searchParams.get("sessionId")||"";
 if(!uuid.test(sessionId))return Response.json({error:"Invalid session"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return error();
 const sql=neon(process.env.DIS_DATABASE_URL);
 try{
  const result=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`SELECT workspace_id FROM dis_consult_sessions WHERE id=${sessionId}`,
  ]);
  if(!result[1]?.length)return Response.json({error:"Not found"},{status:404});
  const workspaceId=String(result[1][0].workspace_id);
  const graph=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`SELECT id,kind,label,evidence_state,metadata FROM dis_knowledge_nodes WHERE workspace_id=${workspaceId}::uuid AND metadata->>'consultationId'=${sessionId} ORDER BY created_at,id LIMIT 60`,
   sql`SELECT from_node,to_node,relation FROM dis_knowledge_edges WHERE workspace_id=${workspaceId}::uuid AND from_node IN (SELECT id FROM dis_knowledge_nodes WHERE workspace_id=${workspaceId}::uuid AND metadata->>'consultationId'=${sessionId}) ORDER BY created_at LIMIT 100`
  ]);
  return Response.json({nodes:graph[1],edges:graph[2],state:"UNVALIDATED_GRAPH",notice:"Graph links are contextual, not proven cause-effect relationships."});
 }catch{return error()}
}
