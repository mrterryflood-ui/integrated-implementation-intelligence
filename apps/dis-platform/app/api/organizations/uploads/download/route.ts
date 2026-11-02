import {get} from '@vercel/blob';
import {inOrganizationTransaction} from '../../../../../lib/organizations/database';
import {originalForOwner} from '../../../../../lib/organizations/storage';
import {uuid,OrganizationError} from '../../../../../lib/organizations/service';
import {organizationActor,organizationFailure} from '../../../../../lib/organizations/http';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(req:Request){try{const actor=await organizationActor(),p=new URL(req.url).searchParams;const row=await inOrganizationTransaction(actor,db=>originalForOwner(db,uuid(p.get('organizationId')),uuid(p.get('id')),actor));if(row.status!=='ARCHIVED')throw new OrganizationError('Original is not available for download',409);const result=await get(row.pathname,{access:'private',useCache:false});if(!result||result.statusCode!==200||result.blob.size!==Number(row.actual_bytes))throw new OrganizationError('Original could not be verified',409);return new Response(result.stream,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+row.filename.replace(/["\r\n]/g,'_')+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return organizationFailure(e)}}
