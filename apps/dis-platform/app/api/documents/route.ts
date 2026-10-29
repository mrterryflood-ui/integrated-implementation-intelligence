import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {put,del} from "@vercel/blob";
import {createHash,randomUUID} from "node:crypto";
export const runtime="nodejs";
export const maxDuration=30;
const MAX_BYTES=5*1024*1024;
const TEXT_EXT=new Set(["txt","md","csv","json","xml","html","htm","log","eml","yaml","yml","rtf"]);
const MIME:Record<string,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"};
export function extension(name:string){return (name.split(".").pop()||"").toLowerCase()}
export function safeName(name:string){return name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,110)||"document"}
export async function extractFile(name:string,buffer:Buffer):Promise<{state:"EXTRACTED"|"UNSUPPORTED"|"FAILED"|"EMPTY",text:string|null}>{
 const ext=extension(name);
 try{
  let value:string|null=null;
  if(TEXT_EXT.has(ext))value=buffer.toString("utf8");
  else if(ext==="docx"){const mammoth=await import("mammoth");value=(await mammoth.extractRawText({buffer})).value}
  else if(ext==="pdf"){const pdfParse=(await import("pdf-parse")).default;value=(await pdfParse(buffer,{max:80})).text}
  else return {state:"UNSUPPORTED",text:null};
  const trimmed=(value||"").trim().slice(0,150000);
  return {state:trimmed?"EXTRACTED":"EMPTY",text:trimmed||null};
 }catch{return {state:"FAILED",text:null}}
}
export async function POST(request:Request){
 const {userId}=await auth();
 if(!userId)return Response.json({error:"Unauthorized"},{status:401});
 if(!process.env.DIS_DATABASE_URL||!process.env.BLOB_READ_WRITE_TOKEN)return Response.json({error:"Private storage unavailable"},{status:503});
 const len=Number(request.headers.get("content-length")||0);
 if(len>MAX_BYTES+100000)return Response.json({error:"File too large"},{status:413});
 let form:FormData;
 try{form=await request.formData()}catch{return Response.json({error:"Invalid upload"},{status:400})}
 const file=form.get("file"),workspaceId=form.get("workspaceId");
 if(!(file instanceof File)||typeof workspaceId!=="string"||!/^[0-9a-f-]{36}$/i.test(workspaceId))return Response.json({error:"File and workspace required"},{status:400});
 if(file.size===0||file.size>MAX_BYTES)return Response.json({error:"File must be 1 byte to 5 MB"},{status:413});
 const sql=neon(process.env.DIS_DATABASE_URL);
 let check;
 try{check=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`SELECT id FROM dis_workspaces WHERE id=${workspaceId} LIMIT 1`])}catch{return Response.json({error:"Workspace unavailable"},{status:503})}
 if(!check[1].length)return Response.json({error:"Workspace not found"},{status:404});
 const bytes=Buffer.from(await file.arrayBuffer());
 const hash=createHash("sha256").update(bytes).digest("hex");
 const name=safeName(file.name),ext=extension(name);
 const extracted=await extractFile(name,bytes);
 const path="dis/"+randomUUID()+"/"+name;
 let uploaded:{url:string,pathname:string}|null=null;
 try{
  uploaded=await put(path,bytes,{access:"private",addRandomSuffix:false,contentType:MIME[ext]||file.type||"application/octet-stream"});
  const saved=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_documents(workspace_id,owner_subject,filename,media_type,byte_size,blob_path,extracted_text,extraction_state,sha256) VALUES(${workspaceId},${userId},${name},${MIME[ext]||file.type||"application/octet-stream"},${bytes.length},${uploaded.pathname},${extracted.text},${extracted.state},${hash}) RETURNING id,filename,byte_size,extraction_state,created_at`
  ]);
  return Response.json({document:saved[1][0]},{status:201});
 }catch{
  if(uploaded)try{await del(uploaded.url)}catch{}
  return Response.json({error:"Upload not saved"},{status:503});
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
