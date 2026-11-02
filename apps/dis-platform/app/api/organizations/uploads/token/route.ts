import {handleUpload,type HandleUploadBody} from '@vercel/blob/client';
import {head} from '@vercel/blob';
import {inOrganizationTransaction} from '../../../../../lib/organizations/database';
import {claimOriginalToken,completeOriginal} from '../../../../../lib/organizations/storage';
import {uuid,OrganizationError} from '../../../../../lib/organizations/service';
import {organizationActor,sameOrigin,organizationFailure,organizationResponse} from '../../../../../lib/organizations/http';
import {readBoundedOfficeRequest} from '../../../../../lib/consultation-export-artifacts';
import {trustedProductionUploader} from '../../../../../lib/release-gates';
export const runtime='nodejs';export const maxDuration=30;
export async function POST(req:Request){try{
 const body=await readBoundedOfficeRequest(req,16000) as HandleUploadBody;
 const response=await handleUpload({request:req,body,
  onBeforeGenerateToken:async(path,clientPayload)=>{
   sameOrigin(req);const actor=await organizationActor();if(!trustedProductionUploader(actor,process.env))throw new OrganizationError('Upload access not released',403);
   const payload=JSON.parse(clientPayload||'{}'),org=uuid(payload.organizationId),id=uuid(payload.reservationId);
   const row=await inOrganizationTransaction(actor,db=>claimOriginalToken(db,actor,org,id,path));
   return{allowedContentTypes:[row.media_type],maximumSizeInBytes:Number(row.expected_bytes),validUntil:new Date(row.expires_at).getTime(),addRandomSuffix:false,allowOverwrite:false,tokenPayload:JSON.stringify({actor,organizationId:org,reservationId:id,pathname:row.pathname})};
  },
  onUploadCompleted:async({blob,tokenPayload})=>{
   // handleUpload validates the provider callback signature before this callback.
   const payload=JSON.parse(tokenPayload||'{}'),org=uuid(payload.organizationId),id=uuid(payload.reservationId);
   if(typeof payload.actor!=='string'||payload.pathname!==blob.pathname||!blob.pathname.startsWith('organizations/'+org+'/'+id+'/'))throw new OrganizationError('Invalid completion receipt',403);
   const actual=await head(blob.pathname);
   await inOrganizationTransaction(payload.actor,db=>completeOriginal(db,payload.actor,org,id,{pathname:actual.pathname,size:actual.size,contentType:actual.contentType}));
  }
 });return organizationResponse(response);
 }catch(e){return organizationFailure(e)}}
