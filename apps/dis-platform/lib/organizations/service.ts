import {createHash,randomUUID} from 'node:crypto';
import {normalizeReport,reconciliationInput,planDigest,approvalStatus,type PlanningReport,type Governance,PLANNING_SECTIONS} from '../planning-contract';
import {buildResearchPlanningSnapshot,researchPlanningReport,validateResearchPlanningSnapshot,ResearchPlanningError} from '../research-planning-handoff';
import type {Queryable} from './database';
export class OrganizationError extends Error {constructor(message:string,public status=400){super(message)}}
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function uuid(value:unknown){if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))throw new OrganizationError('A valid record identifier is required');return value;}
export function text(value:unknown,max=1000,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new OrganizationError('Text is missing or exceeds the field limit');return value.trim();}
function strings(value:unknown,max=30){if(!Array.isArray(value)||value.length>max||value.some(x=>typeof x!=='string'||x.length>200))throw new OrganizationError('Invalid list');return [...new Set(value as string[])];}
export async function membership(db:Queryable,orgId:string,actor:string,write=false){
 const r=(await db.query('SELECT * FROM dis_organization_members WHERE organization_id=$1 AND subject_id=$2 AND active',[orgId,actor])).rows[0];
 if(!r)throw new OrganizationError('Organization not available to this account',404);
 if(write&&r.role==='viewer')throw new OrganizationError('Read-only membership',403);return r;
}
export async function lockOrganization(db:Queryable,orgId:string,actor:string,write=true){
 await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",['dis-org:'+orgId]);return membership(db,orgId,actor,write);
}
export async function getRecord(db:Queryable,orgId:string,id:string){const row=(await db.query('SELECT * FROM dis_organization_records WHERE id=$1 AND organization_id=$2',[id,orgId])).rows[0];if(!row)throw new OrganizationError('Record unavailable',404);return row;}
function expectVersion(row:any,version:unknown){if(!Number.isInteger(version)||row.version!==version)throw new OrganizationError('This record changed. Your work was not overwritten; refresh and compare the newer version.',409);}
async function insertRecord(db:Queryable,orgId:string,actor:string,kind:string,title:string,body:any,visibility='private'){
 const value=JSON.stringify(body);if(Buffer.byteLength(value)>1048576)throw new OrganizationError('A record exceeds 1 MiB. Keep original files in the document archive; split large analysis into linked records.',413);
 return (await db.query('INSERT INTO dis_organization_records(id,organization_id,owner_subject,last_editor,kind,title,body,digest,visibility) VALUES($1,$2,$3,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *',[randomUUID(),orgId,actor,kind,text(title,180,true),value,digest(body),visibility])).rows[0];
}
async function replaceRecord(db:Queryable,row:any,actor:string,body:any,title:string,visibility=row.visibility){
 const value=JSON.stringify(body);if(Buffer.byteLength(value)>1048576)throw new OrganizationError('Record exceeds its storage boundary',413);
 const changed=(await db.query('UPDATE dis_organization_records SET title=$1,body=$2::jsonb,digest=$3,visibility=$4,version=version+1,last_editor=$5,updated_at=now() WHERE id=$6 AND organization_id=$7 AND version=$8 RETURNING *',[text(title,180,true),value,digest(body),visibility,actor,row.id,row.organization_id,row.version])).rows[0];
 if(!changed)throw new OrganizationError('Revision conflict; no content was overwritten',409);return changed;
}
async function requireAuthority(db:Queryable,orgId:string,actor:string,scope:string){
 const row=(await db.query('SELECT * FROM dis_organization_authority WHERE organization_id=$1 AND subject_id=$2 AND scope=$3 AND (expires_at IS NULL OR expires_at>now())',[orgId,actor,scope])).rows[0];
 if(!row)throw new OrganizationError('The organization’s verified delegation is required. Technical administration does not confer this decision authority.',403);return row;
}
async function checkedSources(db:Queryable,orgId:string,ids:unknown){const selected=strings(ids??[],50);for(const id of selected){uuid(id);const r=await getRecord(db,orgId,id);if(!['submission','baseline','evidence'].includes(r.kind)||r.visibility!=='organization')throw new OrganizationError('Select shared, source-bound reports or evidence');}return selected;}
async function baselineId(db:Queryable,orgId:string){return (await db.query("SELECT id FROM dis_organization_records WHERE organization_id=$1 AND kind='baseline' ORDER BY created_at DESC,id DESC LIMIT 1",[orgId])).rows[0]?.id||null;}
export async function listOrganizations(db:Queryable){return(await db.query('SELECT o.id,o.name,o.created_at,m.role FROM dis_organizations o JOIN dis_organization_members m ON m.organization_id=o.id AND m.subject_id=current_setting(\'dis.subject_id\',true) AND m.active ORDER BY o.created_at DESC LIMIT 100')).rows;}
export async function createOrganization(db:Queryable,actor:string,name:unknown,displayName:unknown){
 await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",['dis-creator:'+actor]);
 const count=(await db.query('SELECT count(*)::int AS n FROM dis_organizations WHERE created_by=$1',[actor])).rows[0].n;
 if(count>=20)throw new OrganizationError('Organization creation limit reached; review existing organizations first',429);
 const org=(await db.query('INSERT INTO dis_organizations(name,created_by) VALUES($1,$2) RETURNING id,name,created_at',[text(name,160,true),actor])).rows[0];
 await db.query("INSERT INTO dis_organization_members(organization_id,subject_id,display_name,role) VALUES($1,$2,$3,'admin')",[org.id,actor,text(displayName,160,true)]);
 await db.query("INSERT INTO dis_organization_channels(organization_id,name,created_by) VALUES($1,'General discussion',$2)",[org.id,actor]);
 return {...org,role:'admin',decisionAuthority:'NOT_GRANTED'};
}
export async function organizationSnapshot(db:Queryable,orgId:string,actor:string,params:{kind?:string;q?:string;after?:string}={}){
 const me=await membership(db,orgId,actor);
 const kinds=['draft','submission','proposal','baseline','evidence','task','capability','council','governance','decision','preference'];
 const kind=params.kind||'';if(kind&&kind.split(',').some(k=>!kinds.includes(k)))throw new OrganizationError('Unknown view');
 const q=text(params.q||'',200);const after=params.after?uuid(params.after):null;
 const org=(await db.query('SELECT id,name,storage_quota_bytes,dis_org_storage_usage(id) AS occupied_bytes FROM dis_organizations WHERE id=$1',[orgId])).rows[0];
 const rows=(await db.query("SELECT id,kind,title,owner_subject,visibility,version,digest,created_at,updated_at,body->>'status' AS task_status,body->>'assignee' AS assignee,body->>'loe' AS loe,body->>'loo' AS loo FROM dis_organization_records WHERE organization_id=$1 AND ($2='' OR kind=ANY(string_to_array($2,','))) AND ($3='' OR title ILIKE '%'||$3||'%' OR (kind='capability' AND body::text ILIKE '%'||$3||'%')) AND ($4::uuid IS NULL OR id>$4) ORDER BY id LIMIT 51",[orgId,kind,q,after])).rows;
 const members=(await db.query('SELECT subject_id,display_name,role,active FROM dis_organization_members WHERE organization_id=$1 ORDER BY display_name LIMIT 501',[orgId])).rows;
 const authority=(await db.query('SELECT subject_id,scope,authority_reference,verified_at,expires_at FROM dis_organization_authority WHERE organization_id=$1 AND (expires_at IS NULL OR expires_at>now())',[orgId])).rows;
 const channels=(await db.query('SELECT id,name,audience,created_by FROM dis_organization_channels WHERE organization_id=$1 ORDER BY created_at LIMIT 101',[orgId])).rows;
 const requests=me.role==='admin'?(await db.query("SELECT subject_id,display_name,note,created_at FROM dis_organization_requests WHERE organization_id=$1 AND state='pending' ORDER BY created_at LIMIT 100",[orgId])).rows:[];
 return {organization:org,me,records:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null,members:members.slice(0,500),membersTruncated:members.length>500,authority,channels:channels.slice(0,100),channelsTruncated:channels.length>100,requests,baselineId:await baselineId(db,orgId),notice:'Only permitted records are listed. Private drafts and chats are never automatic Council inputs.'};
}
export async function recordHistory(db:Queryable,orgId:string,id:string,version?:number){
 await getRecord(db,orgId,id);
 if(version!==undefined){if(!Number.isInteger(version)||version<1)throw new OrganizationError('Invalid revision');const r=(await db.query('SELECT * FROM dis_organization_versions WHERE record_id=$1 AND organization_id=$2 AND version=$3',[id,orgId,version])).rows[0];if(!r)throw new OrganizationError('Revision unavailable',404);return r;}
 return(await db.query('SELECT record_id,version,title,digest,author_subject,created_at FROM dis_organization_versions WHERE record_id=$1 AND organization_id=$2 ORDER BY version DESC LIMIT 100',[id,orgId])).rows;
}
export async function actOnOrganization(db:Queryable,actor:string,input:any){
 if(!input||typeof input!=='object')throw new OrganizationError('Invalid action');
 if(input.action==='create')return createOrganization(db,actor,input.name,input.displayName);
 const orgId=uuid(input.organizationId);
 if(input.action==='request-membership'){
  await db.query("INSERT INTO dis_organization_requests(organization_id,subject_id,display_name,note) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",[orgId,actor,text(input.displayName,160,true),text(input.note||'',1000)]);return{requested:true,accessGranted:false};
 }
 const member=await lockOrganization(db,orgId,actor);
 if(input.action==='import-research-case'){
  if(Object.keys(input).some(key=>!['action','organizationId','caseId','caseVersion','confirmedPublicAggregate'].includes(key)))throw new OrganizationError('The handoff accepts a saved case reference, not replacement case content');
  const caseId=uuid(input.caseId);
  if(typeof input.caseVersion!=='number'||!Number.isSafeInteger(input.caseVersion)||input.caseVersion<1)throw new OrganizationError('Choose an exact saved case version');
  if(input.confirmedPublicAggregate!==true)throw new OrganizationError('Review the saved question, assessment and action record, and confirm that the complete copy contains only public aggregate or synthetic research');
  // Existing subject/workspace RLS remains in force. The explicit owner predicates
  // also make the intended private-case boundary visible at this transfer point.
  // Holding the case read lock binds this transaction to one committed revision.
  const source=(await db.query('SELECT c.id,c.workspace_id,c.version,c.title,c.question,c.report,c.playbook FROM dis_casework c JOIN dis_workspaces w ON w.id=c.workspace_id WHERE c.id=$1 AND c.owner_subject=$2 AND w.owner_subject=$2 FOR SHARE OF c',[caseId,actor])).rows[0];
  if(!source)throw new OrganizationError('Saved research case unavailable to this account',404);
  if(source.version!==input.caseVersion)throw new OrganizationError('This research case changed. Review its current saved version before copying it to planning.',409);
  try{
   const researchSnapshot=buildResearchPlanningSnapshot(source);
   // The existing organization transaction lock serializes ambiguous retries.
   // Reuse an already edited private draft without replacing its planning text.
   const prior=(await db.query("SELECT * FROM dis_organization_records WHERE organization_id=$1 AND owner_subject=$2 AND kind='draft' AND visibility='private' AND body->'researchSnapshot'->'source'->>'caseId'=$3 AND body->'researchSnapshot'->'source'->>'caseVersion'=$4 AND body->'researchSnapshot'->>'sourceDigest'=$5 ORDER BY created_at,id LIMIT 1",[orgId,actor,caseId,String(source.version),researchSnapshot.sourceDigest])).rows[0];
   if(prior){validateResearchPlanningSnapshot(prior.body.researchSnapshot);return prior;}
   const report=researchPlanningReport(researchSnapshot);
   return await insertRecord(db,orgId,actor,'draft',report.title,{report,researchSnapshot,baseBaselineId:null,baseReference:null,originalUploadId:null,sourceIds:[]});
  }catch(error){if(error instanceof ResearchPlanningError)throw new OrganizationError(error.message,error.status);throw error;}
 }
 if(input.action==='admit-member'){
  if(member.role!=='admin')throw new OrganizationError('Membership administration required',403);
  const subject=text(input.subject,200,true),role=input.role||'contributor';if(!['contributor','facilitator','viewer'].includes(role))throw new OrganizationError('This action cannot confer administration or decision authority');
  const pending=(await db.query("SELECT * FROM dis_organization_requests WHERE organization_id=$1 AND subject_id=$2 AND state='pending'",[orgId,subject])).rows[0];if(!pending)throw new OrganizationError('An authenticated membership request is required');
  await db.query('INSERT INTO dis_organization_members(organization_id,subject_id,display_name,role) VALUES($1,$2,$3,$4) ON CONFLICT(organization_id,subject_id) DO UPDATE SET active=true,role=EXCLUDED.role',[orgId,subject,pending.display_name,role]);
  await db.query("UPDATE dis_organization_requests SET state='admitted' WHERE organization_id=$1 AND subject_id=$2",[orgId,subject]);return{admitted:true,emailSent:false};
 }
 if(input.action==='revoke-member'){
  if(member.role!=='admin')throw new OrganizationError('Membership administration required',403);
  if(input.subject===actor)throw new OrganizationError('Transfer administration through the organization’s support process before removing your own account');
  await db.query('UPDATE dis_organization_members SET active=false WHERE organization_id=$1 AND subject_id=$2 AND role<>\'admin\'',[orgId,text(input.subject,200,true)]);return{revoked:true};
 }
 if(input.action==='save-draft'){
  const report=normalizeReport(input.report);let originalUploadId:string|null=null;
  if(input.originalUploadId){originalUploadId=uuid(input.originalUploadId);const upload=(await db.query("SELECT id FROM dis_organization_uploads WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 AND status='ARCHIVED'",[originalUploadId,orgId,actor])).rows[0];if(!upload)throw new OrganizationError('Original upload is not available',404);}
  if(!input.id){const base=input.baseBaselineId?uuid(input.baseBaselineId):null;if(base&&(await getRecord(db,orgId,base)).kind!=='baseline')throw new OrganizationError('Common baseline required');let baseReference=null;if(input.baseReference){const r=await getRecord(db,orgId,uuid(input.baseReference.id));if(!['baseline','proposal','submission'].includes(r.kind)||r.visibility!=='organization'||r.version!==input.baseReference.version||r.digest!==input.baseReference.digest)throw new OrganizationError('The selected common starting version changed; inspect it again',409);baseReference={id:r.id,version:r.version,digest:r.digest,kind:r.kind};}return insertRecord(db,orgId,actor,'draft',report.title,{report,baseBaselineId:base,baseReference,originalUploadId});}
  const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='draft'||row.owner_subject!==actor)throw new OrganizationError('Only the author may edit this draft',403);expectVersion(row,input.version);
  return replaceRecord(db,row,actor,{...row.body,report,originalUploadId:originalUploadId||row.body.originalUploadId},report.title,'private');
 }
 if(input.action==='submit'){
  const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='draft'||row.owner_subject!==actor)throw new OrganizationError('Only the draft author can submit it',403);expectVersion(row,input.version);
  const report=normalizeReport(row.body.report);if([report.sections.question,report.sections.recommendation].some(value=>!value.trim()||/^(UNKNOWN|NOT SUPPLIED|\[.*\])$/i.test(value.trim())))throw new OrganizationError('Add a question and recommendation before submitting');
  let researchSnapshot;try{if(row.body.researchSnapshot!==undefined)researchSnapshot=validateResearchPlanningSnapshot(row.body.researchSnapshot);}catch(error){if(error instanceof ResearchPlanningError)throw new OrganizationError(error.message,error.status);throw error;}
  return insertRecord(db,orgId,actor,'submission',report.title,{report,...(researchSnapshot?{researchSnapshot}:{}),draftId:row.id,draftVersion:row.version,baseBaselineId:row.body.baseBaselineId,baseReference:row.body.baseReference,contributors:[actor],sourceIds:[]},'organization');
 }
 if(input.action==='withdraw'){
  const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='submission'||row.owner_subject!==actor)throw new OrganizationError('Only the author may withdraw a submission',403);expectVersion(row,input.version);
  // Visibility changes must preserve immutable submission content and its stored
  // digest. Re-stringifying a JSONB object can reorder keys and change that digest.
  const changed=(await db.query("UPDATE dis_organization_records SET visibility='private',version=version+1,last_editor=$1,updated_at=now() WHERE id=$2 AND organization_id=$3 AND version=$4 RETURNING *",[actor,row.id,orgId,row.version])).rows[0];
  if(!changed)throw new OrganizationError('Revision conflict; no content was overwritten',409);return changed;
 }
 if(input.action==='reconcile'){
  if(!['admin','facilitator'].includes(member.role))throw new OrganizationError('Facilitator access required',403);
  if(!Array.isArray(input.selected)||input.selected.length<1||input.selected.length>30)throw new OrganizationError('Select 1–30 exact submitted reports');
  const rows:any[]=[];for(const selected of input.selected){const row=await getRecord(db,orgId,uuid(selected.id));if(row.kind!=='submission'||row.visibility!=='organization')throw new OrganizationError('Only currently shared submissions can be reconciled');expectVersion(row,selected.version);rows.push(row);}
  const manifest=reconciliationInput(rows.map(r=>({id:r.id,revision:r.version,authorLabel:r.owner_subject,visibility:'submitted',report:normalizeReport(r.body.report)})));
  const report:PlanningReport=normalizeReport({schemaVersion:'dis.planning.report.v1',title:text(input.title||'Reconciled working proposal',180,true),sections:Object.fromEntries(PLANNING_SECTIONS.map(([key])=>[key,rows.map(r=>'Perspective — '+r.title+'\n'+r.body.report.sections[key]).join('\n\n')]))});
  return insertRecord(db,orgId,actor,'proposal',report.title,{report,manifest,contributors:[...new Set([actor,...rows.map(r=>r.owner_subject)])],sourceIds:rows.map(r=>r.id),baseBaselineId:await baselineId(db,orgId),status:'DISCUSSION_REQUIRED'},'organization');
 }
 if(input.action==='save-proposal'){
  const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='proposal'||row.visibility!=='organization')throw new OrganizationError('Shared proposal required');expectVersion(row,input.version);
  const report=normalizeReport(input.report);return replaceRecord(db,row,actor,{...row.body,report,sourceIds:input.sourceIds===undefined?row.body.sourceIds:await checkedSources(db,orgId,input.sourceIds),contributors:[...new Set([...(row.body.contributors||[]),actor])],status:'DISCUSSION_REQUIRED'},report.title);
 }
 if(input.action==='consent'){
  const row=await getRecord(db,orgId,uuid(input.id));expectVersion(row,input.version);if(!['proposal','submission','baseline','evidence'].includes(row.kind)||row.visibility!=='organization')throw new OrganizationError('Select an exact shared planning record');
  if(typeof input.allowed!=='boolean')throw new OrganizationError('Choose whether to allow the previewed model-provider transfer');
  await db.query('INSERT INTO dis_organization_consents(record_id,organization_id,version,digest,subject_id,allowed) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(record_id,version,subject_id) DO UPDATE SET allowed=EXCLUDED.allowed,digest=EXCLUDED.digest,updated_at=now()',[row.id,orgId,row.version,row.digest,actor,input.allowed]);return{allowed:input.allowed,version:row.version,digest:row.digest};
 }
 if(input.action==='confirm-governance'){
  const authority=await requireAuthority(db,orgId,actor,'governance');const approvers=strings(input.approvers,100);const quorum=Number(input.quorum);
  if(!approvers.length||!Number.isInteger(quorum)||quorum<1||quorum>approvers.length)throw new OrganizationError('Specify a valid decision quorum');
  for(const subject of approvers){await membership(db,orgId,subject);await requireAuthority(db,orgId,subject,'approve_plan');}
  const n=(await db.query("SELECT count(*)::int AS n FROM dis_organization_records WHERE organization_id=$1 AND kind='governance'",[orgId])).rows[0].n;
  return insertRecord(db,orgId,actor,'governance',text(input.decisionBody,180,true),{version:n+1,decisionBody:input.decisionBody,approverSubjects:approvers,quorum,authoritySource:authority.authority_reference,confirmedAt:new Date().toISOString()},'organization');
 }
 if(input.action==='vote'||input.action==='publish-baseline'){
  const row=await getRecord(db,orgId,uuid(input.id));expectVersion(row,input.version);if(row.kind!=='proposal')throw new OrganizationError('A saved shared proposal is required');
  const policy=(await db.query("SELECT * FROM dis_organization_records WHERE organization_id=$1 AND kind='governance' ORDER BY created_at DESC,id DESC LIMIT 1",[orgId])).rows[0];if(!policy)throw new OrganizationError('The chapter has not confirmed its decision authority',409);
  const governance=policy.body as Governance,report=normalizeReport(row.body.report),hash=row.digest;
  if(input.action==='vote'){
   await requireAuthority(db,orgId,actor,'approve_plan');if(!governance.approverSubjects.includes(actor))throw new OrganizationError('Not an approver under the current policy',403);
   if(!['approve','reject','abstain'].includes(input.decision))throw new OrganizationError('Choose a ballot decision');
   await db.query('INSERT INTO dis_organization_ballots(proposal_id,organization_id,proposal_digest,policy_id,subject_id,decision) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(proposal_id,proposal_digest,policy_id,subject_id) DO UPDATE SET decision=EXCLUDED.decision,recorded_at=now()',[row.id,orgId,hash,policy.id,actor,input.decision]);return{recorded:true,proposalDigest:hash,policyId:policy.id};
  }
  const active=[];for(const subject of governance.approverSubjects){try{await membership(db,orgId,subject);await requireAuthority(db,orgId,subject,'approve_plan');active.push(subject)}catch{}}
  const ballots=(await db.query('SELECT * FROM dis_organization_ballots WHERE proposal_id=$1 AND proposal_digest=$2 AND policy_id=$3',[row.id,hash,policy.id])).rows;
  const status=approvalStatus({...governance,approverSubjects:active},report,ballots.map(b=>({subject:b.subject_id,planDigest:planDigest(report),governanceVersion:governance.version,decision:b.decision,recordedAt:new Date(b.recorded_at).toISOString()})));
  if(status.state!=='APPROVED')throw new OrganizationError('The current, authorized quorum has not approved this exact proposal',409);
  const previous=await baselineId(db,orgId);if(previous){const last=await getRecord(db,orgId,previous);if(last.body.proposalId===row.id&&last.body.proposalDigest===hash&&last.body.policyId===policy.id)return last;}
  return insertRecord(db,orgId,actor,'baseline',row.title,{report,proposalId:row.id,proposalVersion:row.version,proposalDigest:hash,policyId:policy.id,ballots,previousBaselineId:previous,contributors:row.body.contributors,sourceIds:row.body.sourceIds},'organization');
 }
 if(input.action==='save-capability'){
  let originalUploadId:string|null=null;if(input.originalUploadId){originalUploadId=uuid(input.originalUploadId);if(!(await db.query("SELECT id FROM dis_organization_uploads WHERE id=$1 AND organization_id=$2 AND owner_subject=$3 AND status='ARCHIVED'",[originalUploadId,orgId,actor])).rows.length)throw new OrganizationError('Capability original is unavailable',404);}
  const body={originalUploadId,description:text(input.description||'',10000),expertise:strings(input.expertise||[],30),availability:text(input.availability||'',300),externalShareAllowed:input.externalShareAllowed===true};
  const visibility=input.share===true?'organization':'private';
  if(!input.id)return insertRecord(db,orgId,actor,'capability',text(input.title,180,true),body,visibility);
  const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='capability'||row.owner_subject!==actor)throw new OrganizationError('Only the profile owner can edit sharing',403);expectVersion(row,input.version);return replaceRecord(db,row,actor,body,input.title,visibility);
 }
 if(input.action==='save-task'){
  const assignee=text(input.assignee||'',200);if(assignee)await membership(db,orgId,assignee);
  const status=input.status||'planned';if(!['planned','active','blocked','complete'].includes(status))throw new OrganizationError('Invalid task status');
  const dependencies=strings(input.dependencies||[],30);for(const id of dependencies){const task=await getRecord(db,orgId,uuid(id));if(task.kind!=='task')throw new OrganizationError('Task dependency required');if(id===input.id)throw new OrganizationError('A task cannot depend on itself');}
  const body={assignee,status,loe:text(input.loe||'',200),loo:text(input.loo||'',200),successMeasure:text(input.successMeasure||'',2000),baseline:text(input.baseline||'',500),target:text(input.target||'',500),dueDate:text(input.dueDate||'',40),progress:text(input.progress||'',5000),dependencies,sourceIds:await checkedSources(db,orgId,input.sourceIds)};
  if(!input.id)return insertRecord(db,orgId,actor,'task',input.title,body,'organization');const row=await getRecord(db,orgId,uuid(input.id));if(row.kind!=='task')throw new OrganizationError('Task required');expectVersion(row,input.version);return replaceRecord(db,row,actor,body,input.title,'organization');
 }
 if(input.action==='save-preferences'){
  const body={views:strings(input.views||[],20),loe:text(input.loe||'',200),loo:text(input.loo||'',200),search:text(input.search||'',200)};
  const row=(await db.query("SELECT * FROM dis_organization_records WHERE organization_id=$1 AND owner_subject=$2 AND kind='preference' LIMIT 1",[orgId,actor])).rows[0];return row?replaceRecord(db,row,actor,body,'My terminal','private'):insertRecord(db,orgId,actor,'preference','My terminal',body);
 }
 if(input.action==='create-channel'){
  const audience=strings(input.audience||[],100);if(audience.length&&!audience.includes(actor))audience.push(actor);for(const subject of audience)await membership(db,orgId,subject);
  return(await db.query('INSERT INTO dis_organization_channels(organization_id,name,created_by,audience) VALUES($1,$2,$3,$4) RETURNING id,name,audience',[orgId,text(input.name,80,true),actor,audience])).rows[0];
 }
 if(input.action==='message'){
  const channelId=uuid(input.channelId),channel=(await db.query('SELECT * FROM dis_organization_channels WHERE id=$1 AND organization_id=$2',[channelId,orgId])).rows[0];if(!channel)throw new OrganizationError('Channel unavailable',404);
  const n=(await db.query("SELECT count(*)::int AS n FROM dis_organization_messages WHERE author_subject=$1 AND created_at>now()-interval '1 minute'",[actor])).rows[0].n;if(n>=30)throw new OrganizationError('Message rate limit reached',429);
  const linked=input.linkedRecordId?uuid(input.linkedRecordId):null;if(linked){const r=await getRecord(db,orgId,linked);if(r.visibility!=='organization')throw new OrganizationError('A private record cannot be linked into a shared conversation');}
  const parent=input.parentId?uuid(input.parentId):null;
  return(await db.query('INSERT INTO dis_organization_messages(organization_id,channel_id,author_subject,body,parent_id,linked_record_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[orgId,channelId,actor,text(input.body,8000,true),parent,linked])).rows[0];
 }
 throw new OrganizationError('Unsupported organization action');
}
export async function channelMessages(db:Queryable,orgId:string,channelId:string,before?:string){
 const rows=(await db.query('SELECT m.*,p.display_name FROM dis_organization_messages m JOIN dis_organization_members p ON p.organization_id=m.organization_id AND p.subject_id=m.author_subject WHERE m.organization_id=$1 AND m.channel_id=$2 AND ($3::timestamptz IS NULL OR m.created_at<$3) ORDER BY m.created_at DESC,m.id DESC LIMIT 101',[orgId,channelId,before||null])).rows;return{messages:rows.slice(0,100).reverse(),more:rows.length>100,nextBefore:rows.length>100?rows[99].created_at:null,chatLinkedByDefault:false};
}
export async function storeEvidence(db:Queryable,orgId:string,actor:string,bundle:any){await lockOrganization(db,orgId,actor);return insertRecord(db,orgId,actor,'evidence','Research: '+String(bundle.query||'public sources').slice(0,150),{bundle,claimValidation:'NOT_INDEPENDENTLY_VERIFIED',retrievedAt:new Date().toISOString()},'organization');}
export async function storeCouncilReceipt(db:Queryable,orgId:string,actor:string,receipt:any){await membership(db,orgId,actor,true);return insertRecord(db,orgId,actor,'council','Council review — '+receipt.targetTitle,receipt,'organization');}
