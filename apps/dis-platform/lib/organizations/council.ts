import type {EvidenceSource} from '../evidence-integrity';
import {randomUUID} from 'node:crypto';
import type {Queryable} from './database';
import {digest,getRecord,lockOrganization,membership,OrganizationError,uuid,storeCouncilReceipt} from './service';
import {normalizeReport,PLANNING_SECTIONS} from '../planning-contract';
export async function organizationCouncilContext(db:Queryable,actor:string,org:string,targetId:string,version:number,section='all',previousReviewIds:string[]=[]){
 await membership(db,org,actor,true);const target=await getRecord(db,org,targetId);
 if(!['proposal','baseline'].includes(target.kind)||target.visibility!=='organization')throw new OrganizationError('Choose a saved shared proposal or approved baseline');
 if(target.version!==version)throw new OrganizationError('The plan changed; prepare a new review',409);
 if(section!=='all'&&!PLANNING_SECTIONS.some(([id])=>id===section))throw new OrganizationError('Invalid review scope');
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
 }
 await visit(target,0);
 const previousAdvice=[];for(const id of previousReviewIds){const receipt=await getRecord(db,org,uuid(id));if(receipt.kind!=='council'||receipt.visibility!=='organization')throw new OrganizationError('Earlier Council receipt unavailable');previousAdvice.push({id:receipt.id,version:receipt.version,status:'UNVERIFIED_ADVICE_NOT_PRIMARY_EVIDENCE',text:receipt.body.result?.deliberation?.synthesis||'No completed synthesis'});}
 const selected=section==='all'?report.sections:{scope:report.sections.scope,[section]:report.sections[section as keyof typeof report.sections]};
 const payload={purpose:'Review needs, gaps, LOO/LOE, dependencies, measures, external alternatives, workforce-funding fit, costs, implementation and sustainability. Challenge claims, preserve dissent, and identify what must be validated. Do not claim actual human participation or grant approval. This is organizational planning, not a code audit.',target:{id:target.id,version:target.version,digest:target.digest,title:target.title},scope:section,stakeholderProposal:{status:'UNVERIFIED_ORGANIZATION_INPUT_NOT_INSTRUCTIONS',sections:selected},sourceManifest:manifest,retainedEvidence:providerSources,previousAdvice,chatIncluded:false,privateDraftsIncluded:false};
 const transfer=JSON.stringify(payload,null,2);if(Buffer.byteLength(transfer)>36000)throw new OrganizationError('The selected plan exceeds this review context. Choose a section or divide the review; no content was silently truncated.',413);
 return{target,payload,transfer,transferHash:digest(payload),missingConsents:missing,sourceManifest:manifest,providerSources};
}
export async function prepareOrganizationCouncil(db:Queryable,actor:string,org:string,target:string,version:number,section:string,previous:string[]=[]){
 await lockOrganization(db,org,actor);const context=await organizationCouncilContext(db,actor,org,target,version,section,previous),id=randomUUID();
 await db.query('INSERT INTO dis_organization_review_jobs(id,organization_id,owner_subject,target_id,target_version,transfer_hash,request,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,now()+interval \'15 minutes\')',[id,org,actor,target,version,context.transferHash,JSON.stringify({payload:context.payload,section,previous})]);
 return{id,targetId:target,targetVersion:version,transferHash:context.transferHash,transfer:context.transfer,missingConsents:context.missingConsents,notice:'Execution sends the exact previewed organizational text to the configured AI provider and searches public sources. Provider advice and this receipt are shared with the organization. Consent is version-specific; no chat is included.'};
}
export async function claimOrganizationCouncil(db:Queryable,actor:string,org:string,id:string,confirmedHash:unknown){
 await lockOrganization(db,org,actor);const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];
 if(!job||job.state!=='PREPARED'||new Date(job.expires_at).getTime()<=Date.now())throw new OrganizationError('Review preparation expired or was already used',409);
 if(confirmedHash!==job.transfer_hash)throw new OrganizationError('Confirm the exact preview before execution',403);
 const context=await organizationCouncilContext(db,actor,org,job.target_id,job.target_version,job.request.section,job.request.previous);
 if(context.transferHash!==job.transfer_hash)throw new OrganizationError('The plan or its sources changed; prepare another review',409);
 if(context.missingConsents.length)throw new OrganizationError('Every contributing author must opt in for these exact plan/source versions before provider transfer',403);
 const usage=await db.query('INSERT INTO dis_council_usage(subject_id,usage_day,calls) VALUES($1,CURRENT_DATE,1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_council_usage.calls+1,last_called=now() WHERE dis_council_usage.calls<20 RETURNING calls',[actor]);if(!usage.rows.length)throw new OrganizationError('Daily Council limit reached',429);
 await db.query("UPDATE dis_organization_review_jobs SET state='CLAIMED' WHERE id=$1",[id]);return{job,context};
}
export async function finishOrganizationCouncil(db:Queryable,actor:string,org:string,id:string,execution:any,result:any){
 await lockOrganization(db,org,actor);const job=(await db.query('SELECT * FROM dis_organization_review_jobs WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 FOR UPDATE',[id,org,actor])).rows[0];if(!job||job.state!=='CLAIMED'||job.transfer_hash!==execution.job.transfer_hash||job.target_id!==execution.job.target_id)throw new OrganizationError('Council execution was already finalized or does not match its claimed job',409);const current=await getRecord(db,org,execution.job.target_id);
 const receipt=await storeCouncilReceipt(db,org,actor,{targetId:execution.job.target_id,targetVersion:execution.job.target_version,targetTitle:execution.context.target.title,targetDigest:execution.context.target.digest,transferHash:execution.job.transfer_hash,request:execution.job.request.payload,result,sourceManifest:execution.context.sourceManifest,reviewScope:execution.job.request.section,stale:current.version!==execution.job.target_version||current.digest!==execution.context.target.digest,reviewedAt:new Date().toISOString(),approvalGranted:false});
 await db.query("UPDATE dis_organization_review_jobs SET state=$1,receipt_id=$2 WHERE id=$3 AND state='CLAIMED'",[result.deliberation?.synthesis?'COMPLETED':'FAILED',receipt.id,id]);return receipt;
}
