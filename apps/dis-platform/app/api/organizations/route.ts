import {inOrganizationTransaction} from '../../../lib/organizations/database';
import {actOnOrganization,listOrganizations,organizationSnapshot,uuid,getRecord,recordHistory,channelMessages,membership} from '../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../lib/organizations/http';
export const runtime='nodejs';export const maxDuration=30;
export async function GET(req:Request){try{const actor=await organizationActor(),p=new URL(req.url).searchParams;return organizationResponse(await inOrganizationTransaction(actor,async db=>{
 if(!p.get('organizationId'))return{organizations:await listOrganizations(db)};
 const org=uuid(p.get('organizationId'));await membership(db,org,actor);
 if(p.get('recordId'))return{record:await getRecord(db,org,uuid(p.get('recordId')))};
 if(p.get('historyId'))return{history:await recordHistory(db,org,uuid(p.get('historyId')),p.has('version')?Number(p.get('version')):undefined)};
 if(p.get('channelId'))return channelMessages(db,org,uuid(p.get('channelId')),p.get('before')||undefined);
 return organizationSnapshot(db,org,actor,{kind:p.get('kind')||undefined,q:p.get('q')||undefined,after:p.get('after')||undefined});
 }));}catch(e){return organizationFailure(e)}}
export async function POST(req:Request){try{const actor=await organizationActor(),input=await readOrganizationAction(req);return organizationResponse({result:await inOrganizationTransaction(actor,db=>actOnOrganization(db,actor,input))});}catch(e){return organizationFailure(e)}}
