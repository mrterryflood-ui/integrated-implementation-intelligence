import {get,head} from '@vercel/blob';
import {inOrganizationTransaction} from '../../../../../lib/organizations/database';
import {originalForOwner,boundedOriginalBytes,completeOriginal} from '../../../../../lib/organizations/storage';
import {extractPlanningFile,extractCapabilityFile} from '../../../../../lib/organizations/imports';
import {uuid,OrganizationError} from '../../../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../../../lib/organizations/http';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(req:Request){try{const actor=await organizationActor(),body=await readOrganizationAction(req),org=uuid(body.organizationId),id=uuid(body.id);let row=await inOrganizationTransaction(actor,db=>originalForOwner(db,org,id,actor));
 if(row.status==='TOKEN_ISSUED'){const h=await head(row.pathname);await inOrganizationTransaction(actor,db=>completeOriginal(db,actor,org,id,{pathname:h.pathname,size:h.size,contentType:h.contentType}));row=await inOrganizationTransaction(actor,db=>originalForOwner(db,org,id,actor));}
 if(row.status!=='ARCHIVED')throw new OrganizationError('Original archive has not completed validation',409);
 const stored=await get(row.pathname,{access:'private',useCache:false});if(!stored||stored.statusCode!==200||stored.blob.size!==Number(row.actual_bytes))throw new OrganizationError('Original transfer unavailable',409);
 const source=await boundedOriginalBytes(stored.stream,Number(row.actual_bytes));if(row.sha256&&row.sha256!==source.sha256)throw new OrganizationError('Original fingerprint changed',409);
 await inOrganizationTransaction(actor,db=>db.query("UPDATE dis_organization_uploads SET sha256=$1,extraction_state='ORIGINAL_FINGERPRINT_VERIFIED' WHERE id=$2 AND organization_id=$3 AND owner_subject=$4",[source.sha256,id,org,actor]));
 const mapped=body.purpose==='capability'?await extractCapabilityFile(row.filename,source.bytes):await extractPlanningFile(row.filename,source.bytes);
 await inOrganizationTransaction(actor,db=>db.query("UPDATE dis_organization_uploads SET sha256=$1,extraction_state='MAPPED_FOR_AUTHOR_REVIEW' WHERE id=$2 AND organization_id=$3 AND owner_subject=$4",[source.sha256,id,org,actor]));
 return organizationResponse({...mapped,originalUploadId:id,scanState:row.scan_state,warning:'Original remains private and has not been certified malware-free. Only reviewed text goes into your draft.'});
 }catch(e){return organizationFailure(e)}}
