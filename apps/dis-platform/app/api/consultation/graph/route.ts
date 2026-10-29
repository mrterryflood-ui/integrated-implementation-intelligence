import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const maxDuration=45;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type GraphNode={kind:string,label:string,metadata:Record<string,unknown>};
const clean=(x:unknown,n=250)=>typeof x==="string"?x.replace(/[\u0000-\u001f]/g," ").trim().slice(0,n):"";
export function buildGraphData(sessionId:string,intake:Record<string,unknown>,research:Record<string,unknown>):GraphNode[]{
 const base=[
  {kind:"question",label:clean(intake.mission,240),metadata:{role:"problem",consultationId:sessionId}},
  {kind:"organization",label:clean(intake.organization,160),metadata:{role:"organization",consultationId:sessionId}},
  {kind:"stakeholder",label:clean(intake.audience,180),metadata:{role:"customer",consultationId:sessionId}},
  {kind:"concept",label:clean(intake.stage,180),metadata:{role:"solution-stage",consultationId:sessionId}},
  {kind:"outcome",label:clean(intake.desiredOutcome,180),metadata:{role:"desired-outcome",consultationId:sessionId}}
 ].filter(x=>x.label);
 const records=Array.isArray(research.records)?research.records:[];
 for(const raw of records.slice(0,45)){
  if(!raw||typeof raw!=="object")continue;
  const r=raw as Record<string,unknown>,url=clean(r.url,450),title=clean(r.title,245);
  if(!title||!url.startsWith("https://"))continue;
  base.push({kind:"source",label:title,metadata:{role:"research-lead",sourceUrl:url,source:clean(r.source,100),recordKind:clean(r.kind,60),sourceStatus:clean(r.sourceStatus,50),retrievedAt:clean(r.retrievedAt,45),consultationId:sessionId,verification:"NOT_CLAIM_VERIFIED"}});
 }
 return base.slice(0,50);
}
const error=()=>Response.json({error:"Knowledge graph unavailable"},{status:503});
export async function POST(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 let body:any;try{body=await request.json()}catch{return Response.json({error:"Invalid request"},{status:400})}
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
