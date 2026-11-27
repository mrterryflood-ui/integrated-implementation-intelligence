import {randomUUID} from 'node:crypto';
import type {Queryable} from './database';
import {organizationCouncilContext} from './council';
import {digest,getRecord,lockOrganization,OrganizationError,storeCouncilReceipt} from './service';
import {retrieveKnowledge,emptyKnowledgeAnswer,type KnowledgeAnswer} from './knowledge-passages';
import {knowledgeProviderStatus,type KnowledgeProvider} from './knowledge-provider';
import type {NeonModelCatalog} from '../ai-gateway-neon';

function provider(value:unknown):KnowledgeProvider{if(value!=='gpt'&&value!=='gemini')throw new OrganizationError('Choose GPT or Gemini.');return value;}
async function context(db:Queryable,actor:string,org:string,targetId:string,version:number,query:unknown,chosen:KnowledgeProvider,env:Record<string,string|undefined>,catalog?:NeonModelCatalog){
 if(typeof query!=='string'||query.trim().length<3||query.length>1200)throw new OrganizationError('Ask a question of 3–1,200 characters.');
 const authorized=await organizationCouncilContext(db,actor,org,targetId,version,'all',[]),records=[];
 for(const ref of authorized.sourceManifest)records.push(await getRecord(db,org,ref.id));
 const retrieval=retrieveKnowledge(query,records),status=knowledgeProviderStatus(chosen,env,catalog);
 const payload={purpose:'SOURCE_GROUNDED_ORGANIZATION_QUESTION',provider:chosen,model:status.model,transport:status.transport,recipient:status.recipient,endpoint:status.endpoint,modelIdentity:status.modelIdentity,question:query.trim(),target:{id:authorized.target.id,version:authorized.target.version,digest:authorized.target.digest,title:authorized.target.title},sourceManifest:authorized.sourceManifest,passages:retrieval.passages,limitations:'Selected shared plan and attached source ancestry only. Organization text is reported input; retained excerpts are not the complete source documents. No structured claims graph, whole-drive search, or independent causal validation is implied.'};
 const transfer=JSON.stringify(payload,null,2);if(Buffer.byteLength(transfer)>40000)throw new OrganizationError('Choose a smaller source selection.',413);
 return{authorized,retrieval,status,payload,transfer,transferHash:digest(payload)};
}
export async function prepareOrganizationAsk(db:Queryable,actor:string,org:string,targetId:string,version:number,query:unknown,selectedProvider:unknown,env:Record<string,string|undefined>=process.env,catalog?:NeonModelCatalog){
 await lockOrganization(db,org,actor);const chosen=provider(selectedProvider),c=await context(db,actor,org,targetId,version,query,chosen,env,catalog),id=randomUUID();
 const pending=(await db.query("SELECT count(*)::int AS n FROM dis_organization_review_jobs WHERE organization_id=$1 AND owner_subject=$2 AND created_at>now()-interval '1 hour'",[org,actor])).rows[0]?.n||0;
 if(pending>=60)throw new OrganizationError('The source-review preparation limit has been reached. Please try again later.',429);
 const request={mode:'organization_ask',query:c.retrieval.query,provider:chosen,model:c.status.model,payload:c.payload,retrieval:c.retrieval,retrievedAt:new Date().toISOString()};
 await db.query("INSERT INTO dis_organization_review_jobs(id,organization_id,owner_subject,target_id,target_version,transfer_hash,request,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,now()+interval '15 minutes')",[id,org,actor,targetId,version,c.transferHash,JSON.stringify(request)]);
 return{id,transferHash:c.transferHash,transfer:c.transfer,retrieval:c.retrieval,provider:c.status,missingConsents:c.authorized.missingConsents,canExecute:c.status.canExecute&&c.retrieval.layer==='PASSAGES'&&!c.authorized.missingConsents.length,notice:'Source inspection runs within DIS. Asking the selected provider sends the previewed question and excerpts to '+c.status.recipient+', and saves the answer for this organization. No chat or private draft is included.'};
}
export async function claimOrganizationAsk(db:Queryable,actor:string,org:string,id:string,confirmedHash:unknown,env:Record<string,string|undefined>=process.env,catalog?:NeonModelCatalog){
 await lockOrganization(db,org,actor);
 const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];
 if(!job||job.request?.mode!=='organization_ask'||job.state!=='PREPARED'||new Date(job.expires_at).getTime()<=Date.now())throw new OrganizationError('This question preview expired or was already used. Find sources again.',409);
 if(confirmedHash!==job.transfer_hash)throw new OrganizationError('Review this exact transfer before asking the provider.',403);
 const c=await context(db,actor,org,job.target_id,job.target_version,job.request.query,provider(job.request.provider),env,catalog);
 if(c.transferHash!==job.transfer_hash)throw new OrganizationError('The sources or provider configuration changed. Find sources again.',409);
 if(!c.status.canExecute)throw new OrganizationError(c.status.message,503);
 if(c.retrieval.layer!=='PASSAGES')throw new OrganizationError('No relevant source was found. No provider request was made.',409);
 if(c.authorized.missingConsents.length)throw new OrganizationError('The contributing authors must approve provider transfer for these source versions.',403);
 const usage=await db.query('INSERT INTO dis_council_usage(subject_id,usage_day,calls) VALUES($1,CURRENT_DATE,1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_council_usage.calls+1,last_called=now() WHERE dis_council_usage.calls<20 RETURNING calls',[actor]);
 if(!usage.rows.length)throw new OrganizationError('The daily provider-request limit has been reached.',429);
 await db.query("UPDATE dis_organization_review_jobs SET state='CLAIMED' WHERE id=$1",[id]);return{job,context:c};
}
export async function finishOrganizationAsk(db:Queryable,actor:string,org:string,id:string,execution:Awaited<ReturnType<typeof claimOrganizationAsk>>,answer:KnowledgeAnswer){
 await lockOrganization(db,org,actor);
 const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];
 if(!job||job.request?.mode!=='organization_ask'||job.state!=='CLAIMED'||job.transfer_hash!==execution.job.transfer_hash)throw new OrganizationError('The question execution cannot be finalized again.',409);
 let sourcesCurrent=false;
 try{const now=await organizationCouncilContext(db,actor,org,job.target_id,job.target_version,'all',[]);sourcesCurrent=now.target.digest===execution.context.authorized.target.digest&&digest(now.sourceManifest)===digest(execution.context.authorized.sourceManifest)&&now.missingConsents.length===0;}catch(error){if(!(error instanceof OrganizationError)||![403,404,409].includes(error.status))throw error;}
 if(!sourcesCurrent)answer=emptyKnowledgeAnswer('FAILED','A source version, sharing permission, or contributor consent changed while the answer was being prepared. The answer and source excerpts were withheld. Find sources again.');
 const retrieval=sourcesCurrent?execution.context.retrieval:{...execution.context.retrieval,layer:'ABSTAIN',passages:[],reason:'Source access or versions changed; previously retrieved excerpts are withheld.'};
 const sourceManifest=sourcesCurrent?execution.context.authorized.sourceManifest:[];
 const receipt=await storeCouncilReceipt(db,org,actor,{reviewType:'knowledge-answer',targetId:job.target_id,targetVersion:job.target_version,targetTitle:execution.context.authorized.target.title,targetDigest:execution.context.authorized.target.digest,transferHash:job.transfer_hash,provider:execution.context.status,question:job.request.query,retrieval,sourceManifest,result:answer,stale:!sourcesCurrent,reviewedAt:new Date().toISOString(),approvalGranted:false});
 await db.query('UPDATE dis_organization_review_jobs SET state=$1,receipt_id=$2 WHERE id=$3',[answer.state==='FAILED'?'FAILED':'COMPLETED',receipt.id,id]);return receipt;
}
