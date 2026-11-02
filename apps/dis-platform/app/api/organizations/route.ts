import {currentUser} from '@clerk/nextjs/server';
import {verifiedPrimaryEmail,provisionVerifiedOrganizationLogin,preapproveVerifiedEmail} from '../../../lib/organizations/onboarding';
import {inOrganizationTransaction} from '../../../lib/organizations/database';
import {actOnOrganization,listOrganizations,organizationSnapshot,uuid,getRecord,recordHistory,channelMessages,membership,lockOrganization,OrganizationError} from '../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../lib/organizations/http';
export const runtime='nodejs';export const maxDuration=30;
export async function GET(req:Request){try{const actor=await organizationActor(),p=new URL(req.url).searchParams;return organizationResponse(await inOrganizationTransaction(actor,async db=>{
 if(!p.get('organizationId')){
 const user=await currentUser();
 await provisionVerifiedOrganizationLogin(db,actor,[user?.firstName,user?.lastName].filter(Boolean).join(' ')||'Verified member',verifiedPrimaryEmail(user));
 return {organizations:await listOrganizations(db)};
 }
 const org=uuid(p.get('organizationId'));await membership(db,org,actor);
 if(p.get('recordId'))return{record:await getRecord(db,org,uuid(p.get('recordId')))};
 if(p.get('historyId'))return{history:await recordHistory(db,org,uuid(p.get('historyId')),p.has('version')?Number(p.get('version')):undefined)};
 if(p.get('channelId'))return channelMessages(db,org,uuid(p.get('channelId')),p.get('before')||undefined);
 return organizationSnapshot(db,org,actor,{kind:p.get('kind')||undefined,q:p.get('q')||undefined,after:p.get('after')||undefined});
 }));}catch(e){return organizationFailure(e)}}
export async function POST(req:Request){try{const actor=await organizationActor(),input=await readOrganizationAction(req);return organizationResponse({result:await inOrganizationTransaction(actor,async db=>{
 if(input.action==='preapprove-email'){
  const org=uuid(input.organizationId),member=await lockOrganization(db,org,actor);
  if(member.role!=='admin')throw new OrganizationError('Technical administrator access required',403);
  return preapproveVerifiedEmail(db,actor,org,input.email);
 }
 return actOnOrganization(db,actor,input);
 })});}catch(e){return organizationFailure(e)}}
