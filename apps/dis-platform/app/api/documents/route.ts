import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {del} from "@vercel/blob";
import {createHash,randomUUID} from "node:crypto";
import {trustedProductionUploader} from "../../../lib/release-gates";
import {isRailwayObjectPath,ObjectStoreError,railwayObjectStore,railwayStorageConfiguration} from "../../../lib/organizations/object-store";
import {ALLOWED_EXT,extension,safeName,extractFile} from "./file-processing";
import {sameOriginRequestFailure} from '../../../lib/request-origin';
export const runtime="nodejs";
export const maxDuration=60;
const MAX_BYTES=5*1024*1024;
const MAX_FORM_BYTES=MAX_BYTES+100000;
const PERSONAL_PATH=/^(?:railway\/)?dis\/[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\/(?!\.{1,2}$)[A-Za-z0-9._-]{1,110}$/;
const MIME:Record<string,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",txt:"text/plain",md:"text/markdown",csv:"text/csv",json:"application/json",xml:"application/xml",html:"text/html",htm:"text/html",log:"text/plain",eml:"message/rfc822",yaml:"application/yaml",yml:"application/yaml",rtf:"application/rtf"};
function originFailure(request:Request){
 return sameOriginRequestFailure(request);
}
class UploadRequestError extends Error {constructor(message:string,readonly status:number){super(message);}}
/** Bound actual multipart bytes even when Content-Length is absent or false. */
async function boundedUploadForm(request:Request){
 const declared=request.headers.get("content-length");
 if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))))throw new UploadRequestError("Invalid upload size",400);
 if(declared!==null&&Number(declared)>MAX_FORM_BYTES)throw new UploadRequestError("File too large",413);
 if(!request.body)throw new UploadRequestError("Invalid upload",400);
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{
  for(;;){const item=await reader.read();if(request.signal.aborted)throw new UploadRequestError("Upload interrupted",400);if(item.done)break;size+=item.value.byteLength;if(size>MAX_FORM_BYTES)throw new UploadRequestError("File too large",413);chunks.push(item.value);}
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return new Response(Buffer.concat(chunks,size),{headers:{"content-type":request.headers.get("content-type")||""}}).formData();
}
export async function POST(request:Request){
 const {userId}=await auth();
 if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 if(!trustedProductionUploader(userId,process.env))return Response.json({error:"Uploads restricted to invited beta users until file scanning and privacy acceptance are verified"},{status:403});
 const originError=originFailure(request);if(originError)return originError;
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Private storage unavailable"},{status:503});
 // New originals require the explicitly selected provider. Legacy Vercel objects
 // remain readable/removable through their stored namespace, never a fallback.
 try{railwayStorageConfiguration();}catch{return Response.json({error:"Private Railway storage unavailable"},{status:503});}
 let form:FormData;
 try{form=await boundedUploadForm(request)}catch(error){return Response.json({error:error instanceof UploadRequestError?error.message:"Invalid upload"},{status:error instanceof UploadRequestError?error.status:400})}
 const file=form.get("file"),workspaceId=form.get("workspaceId");
 if(!(file instanceof File)||typeof workspaceId!=="string"||!/^[0-9a-f-]{36}$/i.test(workspaceId))return Response.json({error:"File and workspace required"},{status:400});
 if(file.size===0||file.size>MAX_BYTES)return Response.json({error:"File must be 1 byte to 5 MB"},{status:413});
 if(!ALLOWED_EXT.has(extension(file.name)))return Response.json({error:"File type is not permitted"},{status:415});
 const sql=neon(process.env.DIS_DATABASE_URL);
 let check;
 try{check=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`SELECT id FROM dis_workspaces WHERE id=${workspaceId} AND owner_subject=${userId} LIMIT 1`])}catch{return Response.json({error:"Workspace unavailable"},{status:503})}
 if(!check[1].length)return Response.json({error:"Workspace not found"},{status:404});
 const bytes=Buffer.from(await file.arrayBuffer());
 const hash=createHash("sha256").update(bytes).digest("hex");
 const name=safeName(file.name),ext=extension(name),mediaType=MIME[ext]||"application/octet-stream";
 const extracted=await extractFile(name,bytes);
 const path="railway/dis/"+randomUUID()+"/"+name;
 let uploadedPath:string|null=null,metadataAttempted=false;
 try{
  const uploaded=await railwayObjectStore.putBytes(path,bytes,mediaType);
  if(uploaded.pathname===path)uploadedPath=path;
  if(uploaded.pathname!==path||uploaded.size!==bytes.length||uploaded.contentType!==mediaType||uploaded.sha256!==hash)throw new ObjectStoreError("OBJECT_RECEIPT_INVALID","Private storage did not confirm this document's exact upload receipt.",409);
  metadataAttempted=true;
  const saved=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_documents(workspace_id,owner_subject,filename,media_type,byte_size,blob_path,extracted_text,extraction_state,sha256) VALUES(${workspaceId},${userId},${name},${mediaType},${bytes.length},${path},${extracted.text},${extracted.state},${hash}) RETURNING id,filename,byte_size,extraction_state,created_at`
  ]);
  if(!saved[1]?.[0])throw Error("Document receipt missing");
  return Response.json({document:saved[1][0]},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(uploadedPath&&metadataAttempted){
   // A lost database response may follow a committed INSERT. Never delete its
   // original on the assumption that a transport exception means rollback.
   try{
    const recovered=await sql.transaction([
     sql`SELECT set_config('dis.subject_id',${userId},true)`,
     sql`SELECT id,filename,byte_size,extraction_state,created_at FROM dis_documents WHERE workspace_id=${workspaceId} AND owner_subject=${userId} AND blob_path=${path} AND sha256=${hash} AND media_type=${mediaType} AND byte_size=${bytes.length} LIMIT 1`
    ]);
    if(recovered[1]?.[0])return Response.json({document:recovered[1][0],receiptRecovered:true},{status:201,headers:{"Cache-Control":"private, no-store"}});
   }catch{}
   return Response.json({error:"Upload completion could not be confirmed. The private original was retained for reconciliation; contact support.",uploadReference:path.split("/")[2]},{status:503});
  }
  if(uploadedPath)try{await railwayObjectStore.remove(uploadedPath)}catch{return Response.json({error:"Upload not saved. Private storage cleanup could not be confirmed; contact support."},{status:503});}
  return Response.json({error:error instanceof ObjectStoreError?error.message:"Upload not saved",uploadReference:path.split("/")[2]},{status:error instanceof ObjectStoreError?error.status:503});
 }
}
export async function GET(request:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Unavailable"},{status:503});
 const id=new URL(request.url).searchParams.get("workspaceId")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Invalid workspace"},{status:400});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const rows=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`SELECT id,filename,byte_size,extraction_state,created_at FROM dis_documents WHERE workspace_id=${id} ORDER BY created_at DESC LIMIT 100`]);
  return Response.json({documents:rows[1]});
 }catch{return Response.json({error:"Unable to list documents"},{status:503})}
}

export async function DELETE(request: Request) {
 const {userId}=await auth();
 if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 const originError=originFailure(request);if(originError)return originError;
 const id=new URL(request.url).searchParams.get("id")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Invalid document"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Deletion unavailable"},{status:503});
 const sql=neon(process.env.DIS_DATABASE_URL);
 try{
  const found=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`SELECT id,blob_path FROM dis_documents WHERE id=${id} AND owner_subject=${userId} LIMIT 1`
  ]);
  if(!found[1]?.length)return Response.json({error:"Document not found"},{status:404});
  const path=String(found[1][0].blob_path||"");
  if(!PERSONAL_PATH.test(path))return Response.json({error:"Invalid storage path"},{status:503});
  const railway=isRailwayObjectPath(path);
  if(railway)railwayStorageConfiguration();
  else if(!process.env.BLOB_READ_WRITE_TOKEN)return Response.json({error:"Legacy private storage unavailable"},{status:503});
  // Delete private file first; failure leaves owner metadata intact for a safe retry.
  if(railway)await railwayObjectStore.remove(path);else await del(path);
  const removed=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`DELETE FROM dis_documents WHERE id=${id} AND owner_subject=${userId} AND blob_path=${path} RETURNING id`
  ]);
  if(!removed[1]?.length)return Response.json({error:"File deleted but record cleanup requires support"},{status:503});
  return Response.json({deleted:true,note:railway?"Private file and its record were removed.":"Private file removed; CDN caches may take up to one minute to expire."},{headers:{"cache-control":"no-store"}});
 }catch{
  return Response.json({error:"Deletion could not be fully confirmed. No success is recorded. Retry or contact support."},{status:503});
 }
}
