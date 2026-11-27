import {get} from '@vercel/blob';
import {inOrganizationTransaction} from '../../../../../lib/organizations/database';
import {originalForOwner} from '../../../../../lib/organizations/storage';
import {uuid,OrganizationError} from '../../../../../lib/organizations/service';
import {organizationActor,organizationFailure} from '../../../../../lib/organizations/http';
import {isRailwayObjectPath,railwayObjectStore,ObjectStoreError} from '../../../../../lib/organizations/object-store';
export const runtime='nodejs';export const maxDuration=120;
export async function GET(req:Request){try{
 const actor=await organizationActor(),p=new URL(req.url).searchParams;
 const org=uuid(p.get('organizationId')),id=uuid(p.get('id'));
 const row=await inOrganizationTransaction(actor,db=>originalForOwner(db,org,id,actor));
 if(row.status!=='ARCHIVED')throw new OrganizationError('Original is not available for download',409);
 let stream:ReadableStream<Uint8Array>;
 if(isRailwayObjectPath(row.pathname))stream=(await railwayObjectStore.get(row.pathname,{size:Number(row.actual_bytes),contentType:row.media_type,sha256:row.sha256})).stream;
 else {
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new OrganizationError('This original is in legacy private storage. Its verified transfer is pending; no replacement file is assumed.',503);
  const result=await get(row.pathname,{access:'private',useCache:false});
  if(!result||result.statusCode!==200||result.blob.size!==Number(row.actual_bytes))throw new OrganizationError('Original could not be verified',409);stream=result.stream;
 }
 try{await inOrganizationTransaction(actor,db=>originalForOwner(db,org,id,actor));}catch(e){await stream.cancel().catch(()=>{});throw e;}
 return new Response(stream,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+row.filename.replace(/["\r\n]/g,'_')+'"','Content-Length':String(row.actual_bytes),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return organizationFailure(e instanceof ObjectStoreError?new OrganizationError(e.message,e.status):e)}}
