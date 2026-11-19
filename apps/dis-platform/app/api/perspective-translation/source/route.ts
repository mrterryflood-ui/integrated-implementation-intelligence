import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {productionIdentityBlocked} from "../../../../lib/release-gates";
export const runtime="nodejs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WINDOW=9000,MAX_OFFSET=150000;
export async function GET(request:Request){
 if(productionIdentityBlocked(process.env))return Response.json({error:"Private document access unavailable"},{status:503});
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in to inspect your documents"},{status:401});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Private document storage unavailable"},{status:503});
 const p=new URL(request.url).searchParams,workspaceId=p.get("workspaceId")||"",documentId=p.get("documentId")||"";
 const offsetRaw=p.get("offset")||"0",offset=Number(offsetRaw);
 if(!UUID.test(workspaceId)||!UUID.test(documentId)||!/^(0|[1-9][0-9]{0,5})$/.test(offsetRaw)||!Number.isSafeInteger(offset)||offset<0||offset>MAX_OFFSET)return Response.json({error:"Invalid document selection"},{status:400});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const result=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`SELECT d.filename,d.extraction_state,CHAR_LENGTH(d.extracted_text) AS text_length,
      SUBSTRING(d.extracted_text FROM ${offset+1} FOR ${WINDOW}) AS excerpt,
      d.sha256 FROM dis_documents d JOIN dis_workspaces w ON w.id=d.workspace_id
      WHERE d.id=${documentId} AND d.workspace_id=${workspaceId}
        AND d.owner_subject=${userId} AND w.owner_subject=${userId} LIMIT 1`
  ]);
  const d=result[1][0];if(!d)return Response.json({error:"Document not found in your workspace"},{status:404});
  if(d.extraction_state!=="EXTRACTED"||typeof d.excerpt!=="string")return Response.json({error:"Document has no extractable text; image-only PDF extraction is not available",state:d.extraction_state},{status:422});
  const total=Number(d.text_length||0);
  return Response.json({filename:d.filename,sourceSha256:d.sha256,excerpt:d.excerpt,offset,totalCharacters:total,nextOffset:offset+WINDOW<total?offset+WINDOW:null,windowCharacters:WINDOW,extractionState:d.extraction_state,notice:"Private document excerpt. It is NOT sent to AI unless you explicitly select it and consent."},{headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
 }catch{return Response.json({error:"Private document lookup unavailable"},{status:503})}
}
