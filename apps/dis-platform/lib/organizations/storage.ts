import {randomUUID,createHash} from 'node:crypto';
import type {Queryable} from './database';
import {lockOrganization,membership,OrganizationError,uuid} from './service';
import {documentType,safeFilename} from '../document-capacity';
export const ORGANIZATION_FILE_BYTES=100*1024*1024;
export const ORGANIZATION_DEFAULT_BYTES=100*1024*1024*1024;
export async function reserveOriginal(db:Queryable,actor:string,orgId:string,filename:unknown,size:unknown){
 await lockOrganization(db,orgId,actor);
 // Expired reservations that never received an upload token cannot contain an authorized object.
 // Release them under the organization lock before checking concurrent quota and pending count.
 await db.query("UPDATE dis_organization_uploads SET status='REJECTED' WHERE organization_id=$1 AND status='RESERVED' AND expires_at<=now()",[orgId]);
 if(typeof filename!=='string'||filename.length>200||!Number.isSafeInteger(size)||Number(size)<1||Number(size)>ORGANIZATION_FILE_BYTES)throw new OrganizationError('Use an allowed document of 1 byte to 100 MiB',413);
 const type=documentType(filename),name=safeFilename(filename),id=randomUUID(),path='organizations/'+orgId+'/'+id+'/'+name;
 const capacity=(await db.query('SELECT storage_quota_bytes,dis_org_storage_usage(id) AS used FROM dis_organizations WHERE id=$1',[orgId])).rows[0];
 if(!capacity||Number(capacity.used)+Number(size)>Number(capacity.storage_quota_bytes))throw new OrganizationError('Organization storage allocation is full; no upload token was issued',413);
 const count=(await db.query("SELECT count(*)::int AS n FROM dis_organization_uploads WHERE organization_id=$1 AND owner_subject=$2 AND status IN ('RESERVED','TOKEN_ISSUED')",[orgId,actor])).rows[0].n;if(count>=10)throw new OrganizationError('Resolve unfinished uploads before starting another batch',429);
 return (await db.query("INSERT INTO dis_organization_uploads(id,organization_id,owner_subject,filename,media_type,pathname,expected_bytes,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '15 minutes') RETURNING id,pathname,filename,media_type,expected_bytes,expires_at",[id,orgId,actor,name,type,path,size])).rows[0];
}
export async function originalForOwner(db:Queryable,org:string,id:string,actor:string){await membership(db,org,actor);const row=(await db.query('SELECT * FROM dis_organization_uploads WHERE id=$1 AND organization_id=$2 AND owner_subject=$3',[uuid(id),uuid(org),actor])).rows[0];if(!row)throw new OrganizationError('Original document unavailable',404);return row;}
export async function claimOriginalToken(db:Queryable,actor:string,orgId:string,id:string,pathname:string){
 await lockOrganization(db,orgId,actor);const row=await originalForOwner(db,orgId,id,actor);
 if(row.status!=='RESERVED'||new Date(row.expires_at).getTime()<=Date.now()||row.pathname!==pathname)throw new OrganizationError('Upload reservation is stale, already used or does not match this path',409);
 await db.query("UPDATE dis_organization_uploads SET status='TOKEN_ISSUED' WHERE id=$1 AND status='RESERVED'",[id]);return row;
}
export async function completeOriginal(db:Queryable,actor:string,orgId:string,id:string,actual:{pathname:string;size:number;contentType:string;sha256?:string}){
 await lockOrganization(db,orgId,actor);const row=await originalForOwner(db,orgId,id,actor);
 if(row.pathname!==actual.pathname)throw new OrganizationError('Storage path does not match the reservation',409);
 if(row.status==='ARCHIVED'){if(Number(row.actual_bytes)!==actual.size)throw new OrganizationError('Stored object changed unexpectedly',409);return row;}
 if(!['TOKEN_ISSUED','REJECTED'].includes(row.status))throw new OrganizationError('No issued upload reservation',409);
 const valid=Number.isSafeInteger(actual.size)&&actual.size>0&&actual.size<=Number(row.expected_bytes)&&actual.size<=ORGANIZATION_FILE_BYTES&&actual.contentType===row.media_type;
 return(await db.query("UPDATE dis_organization_uploads SET actual_bytes=$1,status=$2,sha256=COALESCE($3,sha256),completed_at=now() WHERE id=$4 RETURNING id,status,actual_bytes,scan_state,filename",[Number.isSafeInteger(actual.size)&&actual.size>=0?actual.size:Number(row.expected_bytes),valid?'ARCHIVED':'REJECTED',actual.sha256||null,id])).rows[0];
}
export async function boundedOriginalBytes(stream:ReadableStream<Uint8Array>,expected:number){
 if(!Number.isSafeInteger(expected)||expected<1||expected>ORGANIZATION_FILE_BYTES)throw new OrganizationError('Original exceeds extraction bounds',413);
 const reader=stream.getReader(),chunks:Uint8Array[]=[];let length=0;
 try{for(;;){const item=await reader.read();if(item.done)break;length+=item.value.byteLength;if(length>expected||length>ORGANIZATION_FILE_BYTES)throw new OrganizationError('Original size differs from its stored receipt',409);chunks.push(item.value);}}finally{await reader.cancel().catch(()=>{});}
 if(length!==expected)throw new OrganizationError('Original transfer was incomplete',409);const bytes=Buffer.concat(chunks);return{bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
}
