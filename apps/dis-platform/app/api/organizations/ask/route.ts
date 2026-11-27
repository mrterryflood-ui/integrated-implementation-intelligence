import {inOrganizationTransaction} from '../../../../lib/organizations/database';
import {prepareOrganizationAsk,claimOrganizationAsk,finishOrganizationAsk} from '../../../../lib/organizations/knowledge';
import {askKnowledgeProvider,observedKnowledgeProviders} from '../../../../lib/organizations/knowledge-provider';
import {NeonGatewayError} from '../../../../lib/ai-gateway-neon';
import {emptyKnowledgeAnswer} from '../../../../lib/organizations/knowledge-passages';
import {organizationActor,readOrganizationAction,organizationFailure,organizationResponse} from '../../../../lib/organizations/http';
import {membership,OrganizationError,uuid} from '../../../../lib/organizations/service';
export const runtime='nodejs';
export const maxDuration=30;
export async function GET(req:Request){try{
 const actor=await organizationActor(),org=uuid(new URL(req.url).searchParams.get('organizationId'));
 await inOrganizationTransaction(actor,db=>membership(db,org,actor));
 const {providers}=await observedKnowledgeProviders();
 return organizationResponse({providers});
}catch(e){return organizationFailure(e)}}
export async function POST(req:Request){try{
 const actor=await organizationActor(),input=await readOrganizationAction(req),org=uuid(input.organizationId);
 if(input.action!=='prepare'&&(input.action!=='execute'||input.externalConsent!==true))throw new OrganizationError('Approve the exact source transfer before asking the selected provider.',403);
 await inOrganizationTransaction(actor,db=>membership(db,org,actor));
 // Catalog availability is observed after authentication and membership, and
 // outside the organization lock. Preparation/claim recheck authority in SQL.
 const providerEnvironment={...process.env},{catalog}=await observedKnowledgeProviders(providerEnvironment);
 if(input.action==='prepare')return organizationResponse({preview:await inOrganizationTransaction(actor,db=>prepareOrganizationAsk(db,actor,org,uuid(input.targetId),input.version,input.question,input.provider,providerEnvironment,catalog))});
 const id=uuid(input.id),execution=await inOrganizationTransaction(actor,db=>claimOrganizationAsk(db,actor,org,id,input.transferHash,providerEnvironment,catalog));
 let answer;try{answer=await askKnowledgeProvider(execution.context.status.provider,execution.context.transfer,execution.context.retrieval.passages,providerEnvironment)}catch(error){answer=emptyKnowledgeAnswer('FAILED',error instanceof NeonGatewayError?error.message:'The selected provider could not return a complete answer with matching source quotations. No alternative provider was called. Review the sources or prepare another question.');}
 const receipt=await inOrganizationTransaction(actor,db=>finishOrganizationAsk(db,actor,org,id,execution,answer));
 return organizationResponse({receipt,approvalGranted:false});
}catch(e){return organizationFailure(e)}}
