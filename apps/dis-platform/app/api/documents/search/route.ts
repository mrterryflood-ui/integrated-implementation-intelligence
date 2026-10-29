import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export async function GET(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Search unavailable"},{status:503});
 const params=new URL(request.url).searchParams;
 const workspaceId=params.get("workspaceId")||"",query=(params.get("q")||"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(workspaceId)||query.length<3||query.length>120)return Response.json({error:"Invalid search"},{status:400});
 const escaped=query.replace(/[\\%_]/g,x=>"\\"+x);
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const rows=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`SELECT id,filename,extraction_state,LEFT(extracted_text,600) AS preview FROM dis_documents WHERE workspace_id=${workspaceId} AND extracted_text ILIKE ${"%"+escaped+"%"} ORDER BY created_at DESC LIMIT 20`
  ]);
  return Response.json({results:rows[1],note:"Text search over extracted documents only; matches do not verify claims or prove relevance."});
 }catch{return Response.json({error:"Search unavailable"},{status:503})}
}
