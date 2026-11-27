import {inOrganizationTransaction} from '../../../../lib/organizations/database';
import {reserveOriginal} from '../../../../lib/organizations/storage';
import {membership,uuid,OrganizationError} from '../../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../../lib/organizations/http';
import {trustedProductionUploader} from '../../../../lib/release-gates';
import {railwayStorageConfiguration,ObjectStoreError} from '../../../../lib/organizations/object-store';
export const runtime='nodejs';
function uploadAvailability(actor:string,role:string){
 if(role==='viewer')return{allowed:false,message:'Your organization role allows viewing. Ask an administrator for contribution access before uploading a document.'};
 if(!trustedProductionUploader(actor,process.env))return{allowed:false,message:'Original-file uploads require pilot account activation. You can create and share planning contributions directly in this workspace.'};
 try{if(process.env.DIS_OBJECT_STORAGE_PROVIDER==='railway')railwayStorageConfiguration();else if(process.env.DIS_OBJECT_STORAGE_PROVIDER||!process.env.BLOB_READ_WRITE_TOKEN)throw Error();}
 catch{return{allowed:false,message:'Private file storage is unavailable. Your saved planning contributions remain available.'};}
 return{allowed:true,message:'Original-file uploads are enabled for your pilot account. Review extracted content before sharing a contribution.'};
}
export async function POST(req:Request){try{
 const actor=await organizationActor(),body=await readOrganizationAction(req);
 if(!trustedProductionUploader(actor,process.env))throw new OrganizationError('Uploads remain restricted to reviewed beta accounts until security and privacy acceptance',403);
 const provider=process.env.DIS_OBJECT_STORAGE_PROVIDER;
 if(provider==='railway')railwayStorageConfiguration();
 else if(provider||!process.env.BLOB_READ_WRITE_TOKEN)throw new OrganizationError('Private object storage is not configured',503);
 const reservation=await inOrganizationTransaction(actor,db=>reserveOriginal(db,actor,uuid(body.organizationId),body.filename,body.size,provider==='railway'?'railway':undefined));
 return organizationResponse({reservation,provider:provider==='railway'?'railway':'vercel-legacy',transport:provider==='railway'?'PRIVATE_VERIFIED_UPLOAD':'PRIVATE_DIRECT_UPLOAD',fileLimitBytes:104857600,retainsOriginal:true});
 }catch(e){return organizationFailure(e instanceof ObjectStoreError?new OrganizationError(e.message,e.status):e)}}
export async function GET(req:Request){try{const actor=await organizationActor(),p=new URL(req.url).searchParams,org=uuid(p.get('organizationId'));return organizationResponse(await inOrganizationTransaction(actor,async db=>{const member=await membership(db,org,actor);const rows=(await db.query('SELECT id,filename,expected_bytes,actual_bytes,status,scan_state,extraction_state,sha256,created_at FROM dis_organization_uploads WHERE organization_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT 51',[org,p.get('after')?uuid(p.get('after')):null])).rows;return{documents:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null,uploadAvailability:uploadAvailability(actor,member.role)};}));}catch(e){return organizationFailure(e)}}
