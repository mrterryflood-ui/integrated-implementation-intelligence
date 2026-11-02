import {inOrganizationTransaction} from '../../../../lib/organizations/database';
import {prepareOrganizationCouncil,claimOrganizationCouncil,finishOrganizationCouncil} from '../../../../lib/organizations/council';
import {uuid,OrganizationError} from '../../../../lib/organizations/service';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../../lib/organizations/http';
import {convene,infer} from '../../../../lib/council-engine';
import {integratedCouncilResearch} from '../../../../lib/integrated-research';
import {assemble} from '../../../../lib/council-assembly';
import {organizationCouncilResearchQuery} from '../../../../lib/organizations/council';
export const runtime='nodejs';export const maxDuration=120;
export async function POST(req:Request){try{
 const actor=await organizationActor(),input=await readOrganizationAction(req),org=uuid(input.organizationId);
 if(input.action==='prepare')return organizationResponse({preview:await inOrganizationTransaction(actor,db=>prepareOrganizationCouncil(db,actor,org,uuid(input.targetId),input.version,input.section||'all',input.previousReviewIds||[]))});
 if(input.action!=='execute'||input.externalConsent!==true)throw new OrganizationError('Explicit provider-transfer approval required',403);
 const id=uuid(input.id),execution=await inOrganizationTransaction(actor,db=>claimOrganizationCouncil(db,actor,org,id,input.transferHash));
 const question=execution.context.transfer;
 const researchQuery=organizationCouncilResearchQuery(execution.context.payload);
 const roster=assemble({prompt:question,count:6,redCount:4});
 let result:any;try{result=await convene({prompt:question,providedEvidence:execution.context.providerSources,count:6,redCount:4,selected:[],redSelected:[],depth:'Deep',primaryMembers:roster.primary,redMembers:roster.red,challengeEnabled:true},{research:()=>integratedCouncilResearch(researchQuery),infer});}catch{result={state:'INCOMPLETE',error:'Provider execution failed; no approval or synthesis is inferred'};}
 const receipt=await inOrganizationTransaction(actor,db=>finishOrganizationCouncil(db,actor,org,id,execution,result));
 return organizationResponse({receipt,approvalGranted:false});
 }catch(e){return organizationFailure(e)}}
