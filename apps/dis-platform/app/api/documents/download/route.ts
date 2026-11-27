import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { get } from "@vercel/blob";
import {isRailwayObjectPath,ObjectStoreError,railwayObjectStore} from "../../../../lib/organizations/object-store";

import {attachmentFilename} from "./attachment-filename";

export const runtime = "nodejs";
export const maxDuration = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERSONAL_PATH=/^(?:railway\/)?dis\/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,110}$/;

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return Response.json({ error: "Invalid document ID" }, { status: 400 });
  if (!process.env.DIS_DATABASE_URL)
    return Response.json({ error: "Private retrieval unavailable" }, { status: 503 });

  let stream:ReadableStream<Uint8Array>|null=null;
  try {
    const sql = neon(process.env.DIS_DATABASE_URL);
    // Ownership is enforced by FORCE RLS under transaction-local Clerk subject.
    const records = await sql.transaction([
      sql`SELECT set_config('dis.subject_id',${userId},true)`,
      sql`SELECT filename,blob_path,byte_size,media_type,sha256 FROM dis_documents WHERE id=${id} AND owner_subject=${userId} LIMIT 1`,
    ]);
    const document = records[1]?.[0];
    if (!document) return Response.json({ error: "Document not found" }, { status: 404 });
    const path = String(document.blob_path || "");
    if (!PERSONAL_PATH.test(path)) return Response.json({ error: "Invalid stored document" }, { status: 503 });

    if(isRailwayObjectPath(path)){
      const original=await railwayObjectStore.get(path,{size:Number(document.byte_size),contentType:String(document.media_type||""),sha256:String(document.sha256||"")});
      stream=original.stream;
    }else{
      if(!process.env.BLOB_READ_WRITE_TOKEN)return Response.json({error:"Legacy private retrieval unavailable"},{status:503});
      const blob=await get(path,{access:"private"});
      if(!blob||blob.statusCode!==200||!blob.stream)return Response.json({error:"Stored file unavailable"},{status:404});
      stream=blob.stream;
    }
    // Fetching storage must not allow a stale ownership/receipt check to release
    // the original after access or its saved object reference changed.
    const current=await sql.transaction([
      sql`SELECT set_config('dis.subject_id',${userId},true)`,
      sql`SELECT blob_path,byte_size,media_type,sha256 FROM dis_documents WHERE id=${id} AND owner_subject=${userId} LIMIT 1`,
    ]);
    const latest=current[1]?.[0];
    if(!latest)throw new ObjectStoreError("DOCUMENT_UNAVAILABLE","Document not found",404);
    if(latest.blob_path!==document.blob_path||Number(latest.byte_size)!==Number(document.byte_size)||latest.media_type!==document.media_type||latest.sha256!==document.sha256)throw new ObjectStoreError("DOCUMENT_CHANGED","The saved original changed. Reload the document before downloading.",409);

    return new Response(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="' + attachmentFilename(String(document.filename)) + '"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch(error) {
    await stream?.cancel().catch(()=>{});
    return Response.json({ error:error instanceof ObjectStoreError?error.message:"Private retrieval unavailable" }, { status:error instanceof ObjectStoreError?error.status:503 });
  }
}
