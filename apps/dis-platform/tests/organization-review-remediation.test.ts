import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import JSZip from 'jszip';
import {inspectOfficeZip} from '../lib/organizations/imports';
import {organizationCouncilResearchQuery} from '../lib/organizations/council';
import {createOrganization} from '../lib/organizations/service';
import {reserveOriginal} from '../lib/organizations/storage';
import {bootstrapConfig,emailInviteFingerprint,normalizeVerifiedEmail,provisionVerifiedOrganizationLogin,verifiedPrimaryEmail} from '../lib/organizations/onboarding';

const setup=async()=>{
 const db=new PGlite();await db.waitReady;
 await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');
 await db.exec(readFileSync('db/003_organization_workflow.sql','utf8'));
 await db.exec(readFileSync('db/004_verified_email_invites.sql','utf8'));
 const as=async<T>(subject:string,callback:(db:PGlite)=>Promise<T>)=>{
  await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
  try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[subject]);const val=await callback(db);await db.exec('COMMIT');return val;}
  catch(e){await db.exec('ROLLBACK');throw e;}
 };
 return {db,as};
};
test('provider searches actual planning question, not transfer preamble',()=>{
 const q=organizationCouncilResearchQuery({target:{title:'Youth workforce proposal'},stakeholderProposal:{sections:{question:'How can a youth mentoring program build an adult career bridge?',scope:'Austin Texas',funding:'workforce grants'}}});
 assert.match(q,/^How can a youth/);assert.match(q,/Austin Texas/);assert.match(q,/workforce grants/);
 assert.doesNotMatch(q,/Review needs, gaps/);
 assert.throws(()=>organizationCouncilResearchQuery({target:{},stakeholderProposal:{sections:{}}}));
});
test('malformed Office archive with hidden additional central entries is rejected before parsing',async()=>{
 const zip=new JSZip();zip.file('word/document.xml','<root>okay</root>');zip.file('word/_rels/document.xml.rels','<Relationships/>');zip.file('[Content_Types].xml','<Types/>');
 const good=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
 assert.ok(inspectOfficeZip(good).names.length>=3);
 const altered=Buffer.from(good);let eocd=-1;for(let i=altered.length-22;i>altered.length-65557&&i>=0;i--){if(altered.readUInt32LE(i)===0x06054b50){eocd=i;break;}}
 assert.ok(eocd>0);const count=altered.readUInt16LE(eocd+10);
 altered.writeUInt16LE(count-1,eocd+10);altered.writeUInt16LE(count-1,eocd+8);
 assert.throws(()=>inspectOfficeZip(altered),/directory count or size/);
});
test('verified primary Clerk email is required; secondary/unverified identities cannot claim an invitation',()=>{
 const user={primaryEmailAddressId:'a',emailAddresses:[{id:'a',emailAddress:'Andre.Patterson@100blackmenaustin.org',verification:{status:'verified'}},{id:'b',emailAddress:'other@example.com',verification:{status:'verified'}}]};
 assert.equal(verifiedPrimaryEmail(user),'andre.patterson@100blackmenaustin.org');
 assert.equal(verifiedPrimaryEmail({...user,primaryEmailAddressId:'c'}),null);
 assert.equal(verifiedPrimaryEmail({...user,emailAddresses:[{id:'a',emailAddress:'andre.patterson@100blackmenaustin.org',verification:{status:'unverified'}}]}),null);
 assert.equal(normalizeVerifiedEmail('bad'),null);
 assert.equal(emailInviteFingerprint('PERSON@EXAMPLE.ORG'),emailInviteFingerprint('person@example.org'));
 assert.equal(bootstrapConfig({DIS_BOOTSTRAP_ENABLED:'approved',DIS_BOOTSTRAP_PLANNER_EMAIL:'planner@example.org',DIS_BOOTSTRAP_ORGANIZATION_NAME:'Community Partnership',DIS_BOOTSTRAP_MEMBER_EMAILS:'a@example.org,b@example.org'})?.roster.length,2);
 assert.equal(bootstrapConfig({DIS_BOOTSTRAP_ENABLED:'approved',DIS_BOOTSTRAP_PLANNER_EMAIL:'planner@example.org',DIS_BOOTSTRAP_ORGANIZATION_NAME:'Community Partnership',DIS_BOOTSTRAP_MEMBER_EMAILS:'a@example.org,A@example.org'}),null);
});
test('approved verified emails join as contributors, with no admin or decision authority; wrong email and revocation fail closed',async()=>{
 const {db,as}=await setup();
 const env={DIS_BOOTSTRAP_ENABLED:'approved',DIS_BOOTSTRAP_ORGANIZATION_NAME:'100 Black Men of Austin',DIS_BOOTSTRAP_PLANNER_EMAIL:'planner@example.org',DIS_BOOTSTRAP_MEMBER_EMAILS:'andre@example.org,nic@example.org,elijah@example.org,justin@example.org'};
 try{
  const result=await as('planner',q=>provisionVerifiedOrganizationLogin(q,'planner','Lead planner','planner@example.org',env));
  assert.equal(result.bootstrapCreated,true);
  assert.equal((await as('planner',q=>provisionVerifiedOrganizationLogin(q,'planner','Lead planner','planner@example.org',env))).bootstrapCreated,false);
  const orgs=await as('planner',q=>q.query<{id:string}>("SELECT id FROM dis_organizations WHERE created_by='planner'"));assert.equal(orgs.rows.length,1);const org=orgs.rows[0].id;
  const unauthorized=await as('attacker',q=>provisionVerifiedOrganizationLogin(q,'attacker','Attacker','wrong@example.org',env));assert.equal(unauthorized.joined,0);
  const outsider=await as('attacker',q=>q.query("SELECT * FROM dis_organization_members WHERE organization_id=$1",[org]));assert.equal(outsider.rows.length,0);
  const admit=await as('nic-subject',q=>provisionVerifiedOrganizationLogin(q,'nic-subject','Nic','NIC@EXAMPLE.ORG',env));assert.equal(admit.joined,1);
  const membership=await as('nic-subject',q=>q.query<{role:string;active:boolean}>("SELECT role,active FROM dis_organization_members WHERE organization_id=$1 AND subject_id='nic-subject'",[org]));
  assert.deepEqual(membership.rows.map(x=>x.role),['contributor']);
  const authorities=await as('nic-subject',q=>q.query('SELECT * FROM dis_organization_authority WHERE organization_id=$1',[org]));assert.equal(authorities.rows.length,0);
  await assert.rejects(as('attacker',q=>q.query("SELECT dis_redeem_verified_email_invites($1,$2,$3)",[emailInviteFingerprint('nic@example.org'),'nic-subject','Nic'])),/Invalid verified invitation context/);
  await as('planner',q=>q.query("UPDATE dis_organization_members SET active=false WHERE organization_id=$1 AND subject_id='nic-subject'",[org]));
  const after=await as('nic-subject',q=>provisionVerifiedOrganizationLogin(q,'nic-subject','Nic','nic@example.org',env));assert.equal(after.joined,0);
  const a=await as('andre-subject',q=>provisionVerifiedOrganizationLogin(q,'andre-subject','Andre','andre@example.org',env));assert.equal(a.joined,1);
  const b=await as('elijah-subject',q=>provisionVerifiedOrganizationLogin(q,'elijah-subject','Elijah','elijah@example.org',env));assert.equal(b.joined,1);
  const c=await as('justin-subject',q=>provisionVerifiedOrganizationLogin(q,'justin-subject','Justin','justin@example.org',env));assert.equal(c.joined,1);
 }finally{await db.close();}
});
test('expired token-free reservations release quota under organization lock',async()=>{
 const {db,as}=await setup();
 try{
  const org:any=await as('planner',q=>createOrganization(q,'planner','Test organization','Planner'));
  await as('planner',q=>q.query("INSERT INTO dis_organization_members(organization_id,subject_id,display_name,role) VALUES($1,'member','Member','contributor')",[org.id]));
  const first:any=await as('member',q=>reserveOriginal(q,'member',org.id,'first.pdf',20*1024*1024));
  const before=await as('member',q=>q.query<{n:string}>('SELECT dis_org_storage_usage($1) AS n',[org.id]));assert.equal(Number(before.rows[0].n),20*1024*1024);
  await as('member',q=>q.query("UPDATE dis_organization_uploads SET expires_at=now()-interval '1 minute' WHERE id=$1",[first.id]));
  const second:any=await as('member',q=>reserveOriginal(q,'member',org.id,'second.pdf',15*1024*1024));
  const after=await as('member',q=>q.query<{n:string}>('SELECT dis_org_storage_usage($1) AS n',[org.id]));
  assert.equal(Number(after.rows[0].n),15*1024*1024);
  const state=await as('member',q=>q.query<{status:string}>('SELECT status FROM dis_organization_uploads WHERE id=$1',[first.id]));assert.equal(state.rows[0].status,'REJECTED');
  assert.ok(second.id);
 }finally{await db.close();}
});
