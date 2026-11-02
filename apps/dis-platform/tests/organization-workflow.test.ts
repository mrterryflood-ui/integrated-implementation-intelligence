import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import type {Queryable} from '../lib/organizations/database';
import {PGlite} from '@electric-sql/pglite';
import {actOnOrganization,organizationSnapshot,getRecord,recordHistory,channelMessages,storeEvidence,type OrganizationError} from '../lib/organizations/service';
import {reserveOriginal,claimOriginalToken,completeOriginal} from '../lib/organizations/storage';
import {normalizeReport,PLANNING_SECTIONS} from '../lib/planning-contract';
import {organizationCouncilContext,prepareOrganizationCouncil,claimOrganizationCouncil,finishOrganizationCouncil} from '../lib/organizations/council';
const schema=readFileSync('db/003_organization_workflow.sql','utf8');
const report=(title:string)=>normalizeReport({schemaVersion:'dis.planning.report.v1',title,sections:Object.fromEntries(PLANNING_SECTIONS.map(([key])=>[key,key==='question'?'How should the organization develop its next plan?':key==='recommendation'?'Compare capacity, participants and funding evidence.':'UNKNOWN']))});
test('actual organization SQL and service workflow: tenancy, privacy, governance, revisions and originals',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'dis-org-'));let db=new PGlite(directory);await db.waitReady;
 await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');await db.exec(schema);await db.exec("CREATE TABLE dis_council_usage(subject_id text,usage_day date,calls int,last_called timestamptz DEFAULT now(),PRIMARY KEY(subject_id,usage_day)); GRANT SELECT,INSERT,UPDATE ON dis_council_usage TO dis_app_safe;");
 async function as<T>(actor:string,fn:(q:Queryable)=>Promise<T>):Promise<T>{await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[actor]);const result=await fn(db as Queryable);await db.exec('COMMIT');return result}catch(e){await db.exec('ROLLBACK');throw e}}
 const act=(actor:string,body:any)=>as(actor,q=>actOnOrganization(q,actor,body));
 const a:any=await act('alice',{action:'create',name:'Austin synthetic planning test',displayName:'Alice'});
 const b:any=await act('outsider',{action:'create',name:'Separate organization',displayName:'Outside'});
 await t.test('same-account organization access and cross-tenant denial',async()=>{assert.equal((await as('alice',q=>organizationSnapshot(q,a.id,'alice'))).organization.name,'Austin synthetic planning test');await assert.rejects(as('outsider',q=>organizationSnapshot(q,a.id,'outsider')));assert.equal((await as('outsider',q=>q.query('SELECT * FROM dis_organizations WHERE id=$1',[a.id]))).rows.length,0);});
 await act('bob',{action:'request-membership',organizationId:a.id,displayName:'Bob',note:'Synthetic test request'});
 await act('alice',{action:'admit-member',organizationId:a.id,subject:'bob',role:'contributor'});
 const draft:any=await act('bob',{action:'save-draft',organizationId:a.id,report:report('Bob private proposal')});
 await t.test('administrator cannot inspect private drafts or their version history',async()=>{await assert.rejects(as('alice',q=>getRecord(q,a.id,draft.id)));const direct:any=await as('alice',q=>q.query('SELECT * FROM dis_organization_versions WHERE record_id=$1',[draft.id]));assert.equal(direct.rows.length,0);});
 const edited:any=await act('bob',{action:'save-draft',organizationId:a.id,id:draft.id,version:1,report:report('Revised private proposal')});
 await t.test('stale edit rejected without overwriting the current version',async()=>{await assert.rejects(act('bob',{action:'save-draft',organizationId:a.id,id:draft.id,version:1,report:report('STALE')}),/changed/);assert.equal((await as('bob',q=>getRecord(q,a.id,draft.id))).version,2);});
 const submitted:any=await act('bob',{action:'submit',organizationId:a.id,id:edited.id,version:edited.version});
 await t.test('submission is a distinct shared snapshot; private draft remains hidden',async()=>{assert.notEqual(submitted.id,draft.id);assert.equal((await as('alice',q=>getRecord(q,a.id,submitted.id))).visibility,'organization');await assert.rejects(as('alice',q=>getRecord(q,a.id,draft.id)));});
 const proposal:any=await act('alice',{action:'reconcile',organizationId:a.id,selected:[{id:submitted.id,version:submitted.version}],title:'Committee proposal'});
 await t.test('reconciliation retains original report reference and excludes chat',async()=>{assert.equal(proposal.body.manifest.chatIncluded,false);assert.equal(proposal.body.sourceIds[0],submitted.id);assert.ok(proposal.body.report.sections.question.includes('Perspective'));});
 await t.test('technical administration does not grant authority or a baseline',async()=>{await assert.rejects(act('alice',{action:'confirm-governance',organizationId:a.id,approvers:['alice'],quorum:1,decisionBody:'Board'}),/delegation/);await assert.rejects(act('alice',{action:'publish-baseline',organizationId:a.id,id:proposal.id,version:proposal.version}),/authority/);await assert.rejects(as('alice',q=>q.query("INSERT INTO dis_organization_authority VALUES($1,'alice','governance','Forged authority','alice',now(),null)",[a.id])));});
 // Test fixture only: the database owner represents separately verified external delegation.
 for(const subject of ['alice','bob'])await db.query("INSERT INTO dis_organization_authority(organization_id,subject_id,scope,authority_reference,verified_by,verified_at) VALUES($1,$2,'approve_plan','SYNTHETIC charter verification','fixture-verifier',now())",[a.id,subject]);
 await db.query("INSERT INTO dis_organization_authority(organization_id,subject_id,scope,authority_reference,verified_by,verified_at) VALUES($1,'alice','governance','SYNTHETIC committee delegation','fixture-verifier',now())",[a.id]);
 await act('alice',{action:'confirm-governance',organizationId:a.id,approvers:['alice','bob'],quorum:2,decisionBody:'Authorized planning committee'});
 await act('alice',{action:'vote',organizationId:a.id,id:proposal.id,version:proposal.version,decision:'approve'});
 await t.test('one approval cannot satisfy a two-person quorum',async()=>{await assert.rejects(act('alice',{action:'publish-baseline',organizationId:a.id,id:proposal.id,version:proposal.version}),/quorum/);});
 await act('bob',{action:'vote',organizationId:a.id,id:proposal.id,version:proposal.version,decision:'approve'});
 const baseline:any=await act('alice',{action:'publish-baseline',organizationId:a.id,id:proposal.id,version:proposal.version});
 await t.test('baseline immutable and repeat publication idempotent',async()=>{assert.equal(baseline.kind,'baseline');assert.equal((await act('alice',{action:'publish-baseline',organizationId:a.id,id:proposal.id,version:proposal.version})).id,baseline.id);await assert.rejects(as('alice',q=>q.query("UPDATE dis_organization_records SET body='{}',version=version+1 WHERE id=$1",[baseline.id])));});
 const newProposal:any=await act('bob',{action:'save-proposal',organizationId:a.id,id:proposal.id,version:proposal.version,report:report('Different plan')});
 await t.test('changed proposal cannot inherit earlier ballots',async()=>{await assert.rejects(act('alice',{action:'publish-baseline',organizationId:a.id,id:newProposal.id,version:newProposal.version}),/quorum/);assert.equal((await as('alice',q=>getRecord(q,a.id,baseline.id))).body.report.title,'Committee proposal');});
 const profile:any=await act('bob',{action:'save-capability',organizationId:a.id,title:'UAS guidance',description:'Synthetic specialist profile',expertise:['UAS','STEM'],availability:'By arrangement'});
 await t.test('capabilities default to private, sharing is author controlled',async()=>{await assert.rejects(as('alice',q=>getRecord(q,a.id,profile.id)));await act('bob',{action:'save-capability',organizationId:a.id,id:profile.id,version:profile.version,title:profile.title,description:profile.body.description,expertise:profile.body.expertise,share:true});assert.equal((await as('alice',q=>organizationSnapshot(q,a.id,'alice',{kind:'capability',q:'UAS'}))).records.length,1);});
 const channel:any=await act('bob',{action:'create-channel',organizationId:a.id,name:'Private brainstorm',audience:['bob']});
 const message:any=await act('bob',{action:'message',organizationId:a.id,channelId:channel.id,body:'Just a conversation.'});
 await t.test('chats unlinked by default and restricted channels invisible to admin',async()=>{assert.equal(message.linked_record_id,null);assert.equal((await as('alice',q=>channelMessages(q,a.id,channel.id))).messages.length,0);await assert.rejects(act('alice',{action:'message',organizationId:a.id,channelId:channel.id,body:'Unauthorized read attempt'}));});
 const reservation:any=await as('bob',q=>reserveOriginal(q,'bob',a.id,'large-reading.pdf',50*1024*1024));
 await t.test('real SQL reservation accepts 50MiB, rejects over 100MiB and another tenant',async()=>{assert.equal(Number(reservation.expected_bytes),50*1024*1024);await assert.rejects(as('bob',q=>reserveOriginal(q,'bob',a.id,'too-large.pdf',101*1024*1024)));await assert.rejects(as('outsider',q=>claimOriginalToken(q,'outsider',a.id,reservation.id,reservation.pathname)));});
 await as('bob',q=>claimOriginalToken(q,'bob',a.id,reservation.id,reservation.pathname));
 await t.test('upload token cannot be issued twice',async()=>{await assert.rejects(as('bob',q=>claimOriginalToken(q,'bob',a.id,reservation.id,reservation.pathname)),/already used/);});
 const original:any=await as('bob',q=>completeOriginal(q,'bob',a.id,reservation.id,{pathname:reservation.pathname,size:50*1024*1024,contentType:'application/pdf'}));
 await t.test('archive size verified, original private and unscanned',async()=>{assert.equal(original.status,'ARCHIVED');assert.equal(original.scan_state,'NOT_SCANNED');assert.equal((await as('alice',q=>q.query('SELECT * FROM dis_organization_uploads WHERE id=$1',[reservation.id]))).rows.length,0);});
 const over:any=await as('bob',q=>reserveOriginal(q,'bob',a.id,'misstated.pdf',10));await as('bob',q=>claimOriginalToken(q,'bob',a.id,over.id,over.pathname));
 await t.test('actual oversized object is rejected and still charged against quota',async()=>{const denied:any=await as('bob',q=>completeOriginal(q,'bob',a.id,over.id,{pathname:over.pathname,size:1024,contentType:'application/pdf'}));assert.equal(denied.status,'REJECTED');const x:any=await as('bob',q=>q.query('SELECT dis_org_storage_usage($1) AS n',[a.id]));assert.equal(Number(x.rows[0].n),50*1024*1024+1024);});
 await t.test('records and baselines survive database restart',async()=>{await db.close();db=new PGlite(directory);await db.waitReady;assert.equal((await as('alice',q=>getRecord(q,a.id,baseline.id))).kind,'baseline');assert.equal((await as('bob',q=>recordHistory(q,a.id,draft.id))).length,2);});

 await t.test('a member forks an exact shared baseline without altering it',async()=>{
  const fork:any=await act('bob',{action:'save-draft',organizationId:a.id,report:report('My baseline perspective'),baseReference:{id:baseline.id,version:baseline.version,digest:baseline.digest}});
  assert.equal(fork.body.baseReference.digest,baseline.digest);assert.equal(fork.visibility,'private');
  await assert.rejects(act('bob',{action:'save-draft',organizationId:a.id,report:report('Wrong version'),baseReference:{id:baseline.id,version:999,digest:baseline.digest}}),/changed/);
 });
 const evidence:any=await as('alice',q=>storeEvidence(q,a.id,'alice',{query:'Texas workforce',retrievedAt:'2026-11-02T18:00:00Z',records:[{id:'TX-TEST',title:'Synthetic program rule',url:'https://example.org/program-rule',summary:'A qualifying training partner is required. Current applicant eligibility remains unverified.',source:'Synthetic public authority',retrievedAt:'2026-11-02T18:00:00Z',kind:'TECHNICAL_REPORT',sourceStatus:'OFFICIAL_RECORD'}],sourceReceipts:[{id:'TX-TEST',url:'https://example.org/program-rule',sha256:'b'.repeat(64)}]}));
 for(const actor of ['alice','bob'])await act(actor,{action:'vote',organizationId:a.id,id:newProposal.id,version:newProposal.version,decision:'approve'});
 const evidenceProposal:any=await act('bob',{action:'save-proposal',organizationId:a.id,id:newProposal.id,version:newProposal.version,report:newProposal.body.report,sourceIds:[submitted.id,evidence.id]});
 await t.test('an evidence-only change invalidates previous approvals',async()=>{
  assert.deepEqual(evidenceProposal.body.report,newProposal.body.report);assert.notEqual(evidenceProposal.digest,newProposal.digest);
  await assert.rejects(act('alice',{action:'publish-baseline',organizationId:a.id,id:evidenceProposal.id,version:evidenceProposal.version}),/quorum/);
 });
 const prepared:any=await as('alice',q=>prepareOrganizationCouncil(q,'alice',a.id,evidenceProposal.id,evidenceProposal.version,'all'));
 await t.test('actual retained source excerpts enter Council preview, while chat remains excluded',async()=>{
  const context:any=await as('alice',q=>organizationCouncilContext(q,'alice',a.id,evidenceProposal.id,evidenceProposal.version));
  assert.equal(context.providerSources.length,1);assert.match(context.transfer,/qualifying training partner/);assert.equal(context.payload.chatIncluded,false);assert.ok(!context.transfer.includes('Just a conversation.'));
  await assert.rejects(as('alice',q=>claimOrganizationCouncil(q,'alice',a.id,prepared.id,prepared.transferHash)),/contributing author/);
 });
 for(const row of [evidenceProposal,submitted,evidence])for(const actor of row.body.contributors||[row.owner_subject])await act(actor,{action:'consent',organizationId:a.id,id:row.id,version:row.version,allowed:true});
 const execution:any=await as('alice',q=>claimOrganizationCouncil(q,'alice',a.id,prepared.id,prepared.transferHash));
 await t.test('Council claims are exact-hash and single-use; completed advice grants no authority',async()=>{
  await assert.rejects(as('alice',q=>claimOrganizationCouncil(q,'alice',a.id,prepared.id,prepared.transferHash)),/already used/);
  const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',a.id,prepared.id,execution,{state:'TEST_FIXTURE',deliberation:{synthesis:'Synthetic advice, not actual inference'}}));
  assert.equal(receipt.body.approvalGranted,false);assert.equal(receipt.body.stale,false);await assert.rejects(as('alice',q=>finishOrganizationCouncil(q,'alice',a.id,prepared.id,execution,{state:'REPLAY'})),/already finalized/);
  const next:any=await as('alice',q=>prepareOrganizationCouncil(q,'alice',a.id,evidenceProposal.id,evidenceProposal.version,'all',[receipt.id]));
  assert.match(next.transfer,/Synthetic advice/);
  await act('bob',{action:'consent',organizationId:a.id,id:submitted.id,version:submitted.version,allowed:false});
  await assert.rejects(as('alice',q=>claimOrganizationCouncil(q,'alice',a.id,next.id,next.transferHash)),/contributing author/);
 });
 await act('alice',{action:'revoke-member',organizationId:a.id,subject:'bob'});
 await t.test('revoked membership immediately loses reads and writes',async()=>{await assert.rejects(as('bob',q=>organizationSnapshot(q,a.id,'bob')));await assert.rejects(act('bob',{action:'save-draft',organizationId:a.id,report:report('Denied')}));assert.equal((await as('bob',q=>q.query('SELECT * FROM dis_organization_records WHERE id=$1',[baseline.id]))).rows.length,0);});
 await db.close();rmSync(directory,{recursive:true,force:true});
});
