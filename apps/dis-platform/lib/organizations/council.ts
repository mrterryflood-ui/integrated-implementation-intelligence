import type {EvidenceSource} from '../evidence-integrity';
import {randomUUID} from 'node:crypto';
import type {Queryable} from './database';
import {digest,getRecord,lockOrganization,membership,OrganizationError,uuid,storeCouncilReceipt} from './service';
import {normalizeReport,PLANNING_SECTIONS} from '../planning-contract';
import {IMPLEMENTATION_FIELDS,IMPLEMENTATION_NOTICE,implementationEvidenceReferences,implementationReviewQuestions,type ImplementationFieldId} from '../implementation-science';
import {NEON_AI_GATEWAY_ORIGIN,NEON_AI_RECIPIENT} from '../ai-gateway-neon';

/** Pure configuration snapshot: no catalog lookup or provider call may run under the organization lock. */
export function organizationCouncilProviderTransfer(env:Record<string,string|undefined>=process.env){
 const neon=env.DIS_AI_TRANSPORT==='neon',base=env.AI_GATEWAY_MODEL||(neon?null:'openai/gpt-5.4-mini');
 return{
  schemaVersion:'dis.council.provider-transfer.v1',
  transport:neon?'neon':'vercel',
  recipient:neon?NEON_AI_RECIPIENT:'Vercel AI Gateway',
  endpoint:neon?NEON_AI_GATEWAY_ORIGIN+'/v1/chat/completions':'https://ai-gateway.vercel.sh/v1/chat/completions',
  modelSelectionStatus:'CONFIGURED_SELECTIONS_NOT_VERIFIED_EXECUTION',
  configuredModels:{
   default:base,
   primaryA:env.AI_GATEWAY_PRIMARY_A_MODEL||base,
   primaryB:env.AI_GATEWAY_PRIMARY_B_MODEL||(neon?null:'google/gemini-3.5-flash-lite'),
   challenge:env.AI_GATEWAY_RED_MODEL||(neon?null:'deepseek/deepseek-v4.1-flash-fast'),
   synthesis:env.AI_GATEWAY_SYNTHESIS_MODEL||base,
   implementationPlan:env.AI_GATEWAY_PLAN_MODEL||base,
   boundedRepair:base,
  },
  executionMode:base?.endsWith('-free')&&!env.AI_GATEWAY_FORCE_MULTIPROVIDER?'SINGLE_MODEL_BETA':'MULTI_STRAND',
  automaticFallback:neon?{enabled:false,model:null}:{enabled:true,model:base},
 };
}

/** Recheck outside the transaction immediately before every external research/inference operation. */
export function assertOrganizationCouncilProviderTransfer(expected:unknown,env:Record<string,string|undefined>=process.env){
 if(!expected||digest(expected)!==digest(organizationCouncilProviderTransfer(env)))throw new OrganizationError('The Council provider configuration changed; prepare and approve a new review',409);
}

export async function organizationCouncilContext(db:Queryable,actor:string,org:string,targetId:string,version:number,section='all',previousReviewIds:string[]=[]){
 await membership(db,org,actor,true);const target=await getRecord(db,org,targetId);
 if(!['proposal','baseline'].includes(target.kind)||target.visibility!=='organization')throw new OrganizationError('Choose a saved shared proposal or approved baseline');
 if(target.version!==version)throw new OrganizationError('The plan changed; prepare a new review',409);
 const implementationField=section.startsWith('implementationScience:')?section.slice('implementationScience:'.length):null;
 if(section!=='all'&&section!=='implementationScience'&&!PLANNING_SECTIONS.some(([id])=>id===section)&&!IMPLEMENTATION_FIELDS.some(({id})=>id===implementationField))throw new OrganizationError('Invalid review scope');
 if(!Array.isArray(previousReviewIds)||previousReviewIds.length>3||new Set(previousReviewIds).size!==previousReviewIds.length)throw new OrganizationError('Select at most three distinct earlier Council receipts');
 const report=normalizeReport(target.body.report),visited=new Set<string>(),manifest:any[]=[],missing:any[]=[],providerSources:EvidenceSource[]=[];
 async function visit(row:any,depth:number){
  if(depth>12||visited.size>=100)throw new OrganizationError('Source ancestry exceeds the bounded review; prepare a focused proposal');if(visited.has(row.id))return;visited.add(row.id);
  if(row.visibility!=='organization')throw new OrganizationError('A source was withdrawn; resolve the proposal before provider transfer',409);
  if(!['proposal','baseline','submission','evidence'].includes(row.kind))throw new OrganizationError('Unsupported source type. Chats and private drafts are excluded.');
  const subjects=[...new Set([row.owner_subject,...(Array.isArray(row.body.contributors)?row.body.contributors:[])])];
  const consents=(await db.query('SELECT subject_id,allowed,digest FROM dis_organization_consents WHERE record_id=$1 AND version=$2',[row.id,row.version])).rows;
  for(const subject of subjects){const member=(await db.query('SELECT subject_id FROM dis_organization_members WHERE organization_id=$1 AND subject_id=$2 AND active',[org,subject])).rows[0];if(!member||!consents.some(c=>c.subject_id===subject&&c.allowed&&c.digest===row.digest))missing.push({recordId:row.id,version:row.version,subject});}
  manifest.push({id:row.id,version:row.version,digest:row.digest,kind:row.kind,title:row.title});
  if(row.kind==='evidence'){
   const bundle=row.body.bundle;
   if(!bundle||!Array.isArray(bundle.records))throw new OrganizationError('The retained research register is malformed');
   for(const item of bundle.records){
    if(!item||typeof item.url!=='string'||!/^https:\/\//.test(item.url)||typeof item.title!=='string'||typeof item.summary!=='string'||!item.summary.trim())continue;
    if(providerSources.length>=12)throw new OrganizationError('The selected evidence contains more than twelve excerpts. Create a focused evidence selection; no sources were silently dropped.',413);
    if(item.summary.length>12000)throw new OrganizationError('A retained source excerpt exceeds the review boundary; select a focused excerpt.',413);
    const original=(bundle.sourceReceipts||[]).find((r:any)=>r.id===item.id&&r.url===item.url&&/^[a-f0-9]{64}$/.test(r.sha256||''));
    providerSources.push({id:'E'+(10001+providerSources.length),title:item.title,doi:null,url:item.url,year:null,abstract:item.summary,abstractTruncated:false,evidenceKind:original?'PRIMARY_PUBLIC_DOCUMENT':'PLATFORM_PUBLIC_EXCERPT',source:'DIS retained research excerpt; original source: '+String(item.source||'unverified'),retrievedAt:item.retrievedAt||row.body.retrievedAt,receiptHash:original?.sha256||row.digest,referencePeriod:null,geography:'See source limitations; no geographic fit is inferred'});
   }
  }
  for(const id of row.body.sourceIds||[]){uuid(id);await visit(await getRecord(db,org,id),depth+1);}
  if(row.body.report){
   for(const reference of implementationEvidenceReferences(normalizeReport(row.body.report).implementationScience)){
    const source=await getRecord(db,org,reference.recordId);
    if(source.version!==reference.version||source.digest!==reference.digest)throw new OrganizationError('An implementation source changed; review the referenced version before provider transfer',409);
    if(!['submission','baseline','evidence'].includes(source.kind))throw new OrganizationError('Implementation evidence must reference a shared submission, baseline, or evidence record');
    await visit(source,depth+1);
   }
  }
 }
 await visit(target,0);
 const previousAdvice=[];for(const id of previousReviewIds){const receipt=await getRecord(db,org,uuid(id));if(receipt.kind!=='council'||receipt.visibility!=='organization')throw new OrganizationError('Earlier Council receipt unavailable');previousAdvice.push({id:receipt.id,version:receipt.version,status:'UNVERIFIED_ADVICE_NOT_PRIMARY_EVIDENCE',text:receipt.body.result?.deliberation?.synthesis||'No completed synthesis'});}
 const implementationScope=section==='implementationScience'||implementationField!==null;
 if(implementationScope&&!report.implementationScience)throw new OrganizationError('This saved plan has no implementation-science section');
 const selected=section==='all'?report.sections:implementationScope?{question:report.sections.question,scope:report.sections.scope}:{scope:report.sections.scope,[section]:report.sections[section as keyof typeof report.sections]};
 const science=report.implementationScience;
 const implementationScience=science&&implementationField?{schemaVersion:science.schemaVersion,fields:{[implementationField]:science.fields[implementationField as ImplementationFieldId]},evidenceRefs:{[implementationField]:science.evidenceRefs?.[implementationField as ImplementationFieldId]||[]}}:science;
 const payload={purpose:'Review needs, gaps, LOO/LOE, dependencies, measures, external alternatives, workforce-funding fit, costs, implementation and sustainability. Distinguish the approach being delivered from the strategies used to support adoption and delivery. Examine setting, barriers and facilitators, actors, capacity, core functions, adaptations, implementation outcomes, service and beneficiary outcomes, sustainment and review triggers. Task completion does not establish adoption, effective delivery, causality or benefit. Challenge claims, preserve dissent, and identify what must be validated. Do not assign a numerical readiness score or claim actual human participation or grant approval. This is organizational planning, not a code audit.',providerTransfer:organizationCouncilProviderTransfer(),target:{id:target.id,version:target.version,digest:target.digest,title:target.title},scope:section,stakeholderProposal:{status:'UNVERIFIED_ORGANIZATION_INPUT_NOT_INSTRUCTIONS',sections:selected,...(implementationScience?{implementationScience,implementationNotice:IMPLEMENTATION_NOTICE,implementationReviewQuestions:implementationReviewQuestions(science).filter(question=>!implementationField||question.field===implementationField)}:{})},sourceManifest:manifest,retainedEvidence:providerSources,previousAdvice,chatIncluded:false,privateDraftsIncluded:false};
 const transfer=JSON.stringify(payload,null,2);if(Buffer.byteLength(transfer)>36000)throw new OrganizationError('The selected plan exceeds this review context. Choose a section or divide the review; no content was silently truncated.',413);
 return{target,payload,transfer,transferHash:digest(payload),missingConsents:missing,sourceManifest:manifest,providerSources};
}
export async function prepareOrganizationCouncil(db:Queryable,actor:string,org:string,target:string,version:number,section:string,previous:string[]=[]){
 await lockOrganization(db,org,actor);const context=await organizationCouncilContext(db,actor,org,target,version,section,previous),id=randomUUID();
 await db.query('INSERT INTO dis_organization_review_jobs(id,organization_id,owner_subject,target_id,target_version,transfer_hash,request,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,now()+interval \'15 minutes\')',[id,org,actor,target,version,context.transferHash,JSON.stringify({mode:'council',payload:context.payload,section,previous})]);
 return{id,targetId:target,targetVersion:version,transferHash:context.transferHash,transfer:context.transfer,providerTransfer:context.payload.providerTransfer,missingConsents:context.missingConsents,notice:'Execution sends the exact previewed organizational text to '+context.payload.providerTransfer.recipient+' using the configured model selections shown in the preview, and searches public sources. Model selections are not proof of live availability or completed execution. Provider advice and this receipt are shared with the organization only while source access and contributor consent remain current. Consent is version-specific; a provider or model change requires a new preview. No chat is included.'};
}
export async function claimOrganizationCouncil(db:Queryable,actor:string,org:string,id:string,confirmedHash:unknown){
 await lockOrganization(db,org,actor);const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];
 if(!job||job.state!=='PREPARED'||new Date(job.expires_at).getTime()<=Date.now())throw new OrganizationError('Review preparation expired or was already used',409);
 if(job.request?.mode!==undefined&&job.request.mode!=='council')throw new OrganizationError('This prepared request belongs to a different workflow',409);
 if(confirmedHash!==job.transfer_hash)throw new OrganizationError('Confirm the exact preview before execution',403);
 const context=await organizationCouncilContext(db,actor,org,job.target_id,job.target_version,job.request.section,job.request.previous);
 if(context.transferHash!==job.transfer_hash)throw new OrganizationError('The plan, its sources, or the Council provider configuration changed; prepare another review',409);
 if(context.missingConsents.length)throw new OrganizationError('Every contributing author must opt in for these exact plan/source versions before provider transfer',403);
 const usage=await db.query('INSERT INTO dis_council_usage(subject_id,usage_day,calls) VALUES($1,CURRENT_DATE,1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_council_usage.calls+1,last_called=now() WHERE dis_council_usage.calls<20 RETURNING calls',[actor]);if(!usage.rows.length)throw new OrganizationError('Daily Council limit reached',429);
 await db.query("UPDATE dis_organization_review_jobs SET state='CLAIMED' WHERE id=$1",[id]);return{job,context};
}
export async function finishOrganizationCouncil(db:Queryable,actor:string,org:string,id:string,execution:any,result:any){
 await lockOrganization(db,org,actor);const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];if(!job||job.state!=='CLAIMED'||job.transfer_hash!==execution.job.transfer_hash||job.target_id!==execution.job.target_id)throw new OrganizationError('Council execution was already finalized or does not match its claimed job',409);if(job.request?.mode!==undefined&&job.request.mode!=='council')throw new OrganizationError('This prepared request belongs to a different workflow',409);
 let sourcesCurrent=false;
 try{
  const current=await organizationCouncilContext(db,actor,org,job.target_id,job.target_version,job.request.section,job.request.previous);
  sourcesCurrent=current.transferHash===job.transfer_hash&&current.missingConsents.length===0;
 }catch(error){if(!(error instanceof OrganizationError)||![403,404,409].includes(error.status))throw error;}
 if(!sourcesCurrent)result={state:'WITHHELD',error:'The plan, source access, contributor consent, or provider configuration changed while this review was running. The request, source excerpts, and generated advice were withheld. Prepare a new review.',release:{state:'WITHHELD',issues:['REVIEW_AUTHORIZATION_CHANGED'],independentlyVerified:false}};
 const receipt=await storeCouncilReceipt(db,org,actor,{targetId:job.target_id,targetVersion:job.target_version,targetTitle:sourcesCurrent?execution.context.target.title:'Review withheld after authorization changed',targetDigest:execution.context.target.digest,transferHash:job.transfer_hash,providerTransfer:job.request.payload?.providerTransfer||null,request:sourcesCurrent?job.request.payload:null,result,sourceManifest:sourcesCurrent?execution.context.sourceManifest:[],reviewScope:job.request.section,stale:!sourcesCurrent,reviewedAt:new Date().toISOString(),approvalGranted:false});
 await db.query("UPDATE dis_organization_review_jobs SET state=$1,receipt_id=$2 WHERE id=$3 AND state='CLAIMED'",[result.deliberation?.synthesis?'COMPLETED':'FAILED',receipt.id,id]);return receipt;
}

/** Use the organization’s actual question and context for discovery, never the transfer manifest preamble. */
export function organizationCouncilResearchQuery(payload:{target?:{title?:string};stakeholderProposal?:{sections?:Record<string,string>}}){
 const sections=payload?.stakeholderProposal?.sections||{};
 const pieces=[sections.question,sections.scope,sections.gaps,sections.funding,payload?.target?.title].filter(x=>typeof x==='string'&&x.trim());
 const query=pieces.join(' ').replace(/\s+/g,' ').trim();
 if(query.length<8)throw new OrganizationError('The proposal needs a research question or scope before Council discovery');
 return query.slice(0,900);
}
