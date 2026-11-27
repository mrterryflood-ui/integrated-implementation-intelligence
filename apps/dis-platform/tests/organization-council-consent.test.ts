import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import type {Queryable} from '../lib/organizations/database';
import {actOnOrganization,digest,OrganizationError} from '../lib/organizations/service';
import {normalizeReport,PLANNING_SECTIONS} from '../lib/planning-contract';
import {NEON_AI_GATEWAY_ORIGIN,NEON_AI_RECIPIENT} from '../lib/ai-gateway-neon';
import {organizationCouncilProviderTransfer,assertOrganizationCouncilProviderTransfer,prepareOrganizationCouncil,claimOrganizationCouncil,finishOrganizationCouncil} from '../lib/organizations/council';

// Synthetic configuration and local PostgreSQL fixtures only. No provider request is permitted.
const envKeys=['DIS_AI_TRANSPORT','AI_GATEWAY_MODEL','AI_GATEWAY_PRIMARY_A_MODEL','AI_GATEWAY_PRIMARY_B_MODEL','AI_GATEWAY_RED_MODEL','AI_GATEWAY_SYNTHESIS_MODEL','AI_GATEWAY_PLAN_MODEL','AI_GATEWAY_FORCE_MULTIPROVIDER','NEON_AI_GATEWAY_BASE_URL','NEON_AI_GATEWAY_TOKEN','AI_GATEWAY_API_KEY'] as const;
const neon={DIS_AI_TRANSPORT:'neon',NEON_AI_GATEWAY_BASE_URL:NEON_AI_GATEWAY_ORIGIN,NEON_AI_GATEWAY_TOKEN:'synthetic-neon-token-for-tests-only',AI_GATEWAY_MODEL:'openai/synthetic-main',AI_GATEWAY_PRIMARY_A_MODEL:'openai/synthetic-primary',AI_GATEWAY_PRIMARY_B_MODEL:'google/synthetic-secondary',AI_GATEWAY_RED_MODEL:'anthropic/synthetic-challenge',AI_GATEWAY_SYNTHESIS_MODEL:'openai/synthetic-synthesis',AI_GATEWAY_PLAN_MODEL:'openai/synthetic-plan'};
function installEnvironment(value:Record<string,string|undefined>){for(const key of envKeys){if(value[key]===undefined)delete process.env[key];else process.env[key]=value[key];}}
function report(title:string){return normalizeReport({schemaVersion:'dis.planning.report.v1',title,sections:Object.fromEntries(PLANNING_SECTIONS.map(([key])=>[key,key==='question'?'How should the synthetic team review this proposal?':key==='recommendation'?'Compare resources and test assumptions before implementation.':'UNKNOWN']))});}
const changed=(error:unknown)=>error instanceof OrganizationError&&error.status===409&&/configuration changed|prepare another review/.test(error.message);

test('Council transfer descriptor records actual transport and configured selections without asserting live identities',()=>{
 const legacy=organizationCouncilProviderTransfer({});
 assert.equal(legacy.transport,'vercel');assert.equal(legacy.recipient,'Vercel AI Gateway');
 assert.equal(legacy.endpoint,'https://ai-gateway.vercel.sh/v1/chat/completions');
 assert.equal(legacy.configuredModels.primaryA,'openai/gpt-5.4-mini');
 assert.equal(legacy.configuredModels.primaryB,'google/gemini-3.5-flash-lite');
 assert.deepEqual(legacy.automaticFallback,{enabled:true,model:'openai/gpt-5.4-mini'});
 const selected=organizationCouncilProviderTransfer(neon);
 assert.equal(selected.transport,'neon');assert.equal(selected.recipient,NEON_AI_RECIPIENT);
 assert.equal(selected.endpoint,NEON_AI_GATEWAY_ORIGIN+'/v1/chat/completions');
 assert.equal(selected.modelSelectionStatus,'CONFIGURED_SELECTIONS_NOT_VERIFIED_EXECUTION');
 assert.deepEqual(selected.automaticFallback,{enabled:false,model:null});
 assert.equal(selected.configuredModels.boundedRepair,neon.AI_GATEWAY_MODEL);
 assert.equal(selected.configuredModels.primaryB,neon.AI_GATEWAY_PRIMARY_B_MODEL);
 assert.ok(!JSON.stringify(selected).includes(neon.NEON_AI_GATEWAY_TOKEN));
 const missing=organizationCouncilProviderTransfer({DIS_AI_TRANSPORT:'neon'});
 assert.ok(Object.values(missing.configuredModels).every(model=>model===null));
 assert.doesNotThrow(()=>assertOrganizationCouncilProviderTransfer(selected,{...neon,NEON_AI_GATEWAY_TOKEN:'synthetic-rotated-token-not-consent-content'}));
 assert.throws(()=>assertOrganizationCouncilProviderTransfer(legacy,neon),changed);
 assert.throws(()=>assertOrganizationCouncilProviderTransfer(undefined,neon),changed);
});

test('every configured Council strand and the single-model/fallback policy affect transfer consent',()=>{
 const baseline=digest(organizationCouncilProviderTransfer(neon));
 for(const key of ['AI_GATEWAY_MODEL','AI_GATEWAY_PRIMARY_A_MODEL','AI_GATEWAY_PRIMARY_B_MODEL','AI_GATEWAY_RED_MODEL','AI_GATEWAY_SYNTHESIS_MODEL','AI_GATEWAY_PLAN_MODEL']){
  const next={...neon,[key]:'openai/different-synthetic-model'};
  assert.notEqual(digest(organizationCouncilProviderTransfer(next)),baseline,key);
 }
 const free={AI_GATEWAY_MODEL:'synthetic/free-model-free'};
 assert.equal(organizationCouncilProviderTransfer(free).executionMode,'SINGLE_MODEL_BETA');
 assert.notEqual(digest(organizationCouncilProviderTransfer(free)),digest(organizationCouncilProviderTransfer({...free,AI_GATEWAY_FORCE_MULTIPROVIDER:'1'})));
});

test('actual RLS Council jobs bind provider consent and withhold advice after source authorization changes',async t=>{
 const saved=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]));
 const originalFetch=globalThis.fetch;let networkCalls=0;
 globalThis.fetch=async()=>{networkCalls++;throw new Error('Network calls are forbidden in this synthetic Council fixture');};
 const db=new PGlite();
 try{
  await db.waitReady;await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');await db.exec(readFileSync('db/003_organization_workflow.sql','utf8'));
  await db.exec('CREATE TABLE dis_council_usage(subject_id text,usage_day date,calls int,last_called timestamptz DEFAULT now(),PRIMARY KEY(subject_id,usage_day)); GRANT SELECT,INSERT,UPDATE ON dis_council_usage TO dis_app_safe;');
  async function as<T>(actor:string,work:(query:Queryable)=>Promise<T>):Promise<T>{
   await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
   try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[actor]);const value=await work(db as Queryable);await db.exec('COMMIT');return value;}
   catch(error){await db.exec('ROLLBACK');throw error;}
  }
  const act=(actor:string,input:any)=>as(actor,q=>actOnOrganization(q,actor,input));
  installEnvironment({});
  const org:any=await act('alice',{action:'create',name:'SYNTHETIC Council consent organization',displayName:'Alice'});
  const other:any=await act('outside',{action:'create',name:'Separate synthetic organization',displayName:'Outside'});
  for(const subject of ['bob','viewer']){
   await act(subject,{action:'request-membership',organizationId:org.id,displayName:subject,note:'Synthetic request'});
   await act('alice',{action:'admit-member',organizationId:org.id,subject,role:subject==='viewer'?'viewer':'contributor'});
  }
  async function proposal(marker:string){
   const draft:any=await act('bob',{action:'save-draft',organizationId:org.id,report:report(marker)});
   const source:any=await act('bob',{action:'submit',organizationId:org.id,id:draft.id,version:draft.version});
   const target:any=await act('alice',{action:'reconcile',organizationId:org.id,selected:[{id:source.id,version:source.version}],title:marker+' proposal'});
   for(const row of [source,target])for(const subject of new Set<string>([row.owner_subject,...(row.body.contributors||[])]))await act(subject,{action:'consent',organizationId:org.id,id:row.id,version:row.version,allowed:true});
   return{source,target};
  }
  const baseline=await proposal('SYNTHETIC SHARED INPUT');
  const prepare=(target=baseline.target)=>as('alice',q=>prepareOrganizationCouncil(q,'alice',org.id,target.id,target.version,'all'));
  const claim=(preview:any)=>as('alice',q=>claimOrganizationCouncil(q,'alice',org.id,preview.id,preview.transferHash));
  const syntheticResult={state:'SYNTHETIC_PROVIDER_RESULT',deliberation:{synthesis:'SYNTHETIC GENERATED ADVICE MUST NOT SURVIVE WITHDRAWAL'},sources:[{abstract:'SYNTHETIC RETURNED EXCERPT MUST NOT SURVIVE WITHDRAWAL'}]};
  await t.test('pre-migration consent without provider binding cannot claim',async()=>{
   const prepared=await prepare(),oldPayload=JSON.parse(prepared.transfer);delete oldPayload.providerTransfer;
   const oldHash=digest(oldPayload);
   await as('alice',q=>q.query('UPDATE dis_organization_review_jobs SET transfer_hash=$1,request=$2::jsonb WHERE id=$3',[oldHash,JSON.stringify({payload:oldPayload,section:'all',previous:[]}),prepared.id]));
   await assert.rejects(claim({...prepared,transferHash:oldHash}),changed);
  });
  await t.test('a legacy preview cannot authorize Neon or a changed role model',async()=>{
   const legacy=await prepare();installEnvironment(neon);await assert.rejects(claim(legacy),changed);
   for(const key of ['AI_GATEWAY_MODEL','AI_GATEWAY_PRIMARY_A_MODEL','AI_GATEWAY_PRIMARY_B_MODEL','AI_GATEWAY_RED_MODEL','AI_GATEWAY_SYNTHESIS_MODEL','AI_GATEWAY_PLAN_MODEL']){
    installEnvironment(neon);const prepared=await prepare();process.env[key]='openai/changed-after-consent';
    await assert.rejects(claim(prepared),changed);
    const job:any=await as('alice',q=>q.query('SELECT state FROM dis_organization_review_jobs WHERE id=$1',[prepared.id]));assert.equal(job.rows[0].state,'PREPARED');
   }
   assert.equal((await db.query('SELECT * FROM dis_council_usage')).rows.length,0);
   installEnvironment(neon);
  });
  await t.test('unchanged consent survives credential rotation, keeps role isolation, and is single-use',async()=>{
   const prepared=await prepare();process.env.NEON_AI_GATEWAY_TOKEN='synthetic-rotated-token-do-not-disclose';
   await assert.rejects(as('outside',q=>claimOrganizationCouncil(q,'outside',org.id,prepared.id,prepared.transferHash)));
   await assert.rejects(as('alice',q=>claimOrganizationCouncil(q,'alice',other.id,prepared.id,prepared.transferHash)));
   await assert.rejects(as('bob',q=>claimOrganizationCouncil(q,'bob',org.id,prepared.id,prepared.transferHash)),/expired|already used/);
   await assert.rejects(as('viewer',q=>claimOrganizationCouncil(q,'viewer',org.id,prepared.id,prepared.transferHash)),/Read-only/);
   const execution=await claim(prepared);
   assert.equal(execution.context.payload.providerTransfer.transport,'neon');
   assert.doesNotThrow(()=>assertOrganizationCouncilProviderTransfer(execution.context.payload.providerTransfer));
   await assert.rejects(claim(prepared),/already used/);
   const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult));
   assert.equal(receipt.body.result.state,'SYNTHETIC_PROVIDER_RESULT');assert.equal(receipt.body.stale,false);assert.equal(receipt.body.approvalGranted,false);
   assert.equal(receipt.body.providerTransfer.recipient,NEON_AI_RECIPIENT);
   await assert.rejects(as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult)),/already finalized/);
  });
  function assertWithheld(receipt:any,marker:string){
   assert.equal(receipt.body.result.state,'WITHHELD');assert.equal(receipt.body.result.release.state,'WITHHELD');
   assert.equal(receipt.body.request,null);assert.deepEqual(receipt.body.sourceManifest,[]);
   assert.equal(receipt.body.stale,true);assert.equal(receipt.body.approvalGranted,false);
   const text=JSON.stringify(receipt);assert.ok(!text.includes(marker));assert.ok(!text.includes('SYNTHETIC GENERATED ADVICE'));assert.ok(!text.includes('SYNTHETIC RETURNED EXCERPT'));
  }
  await t.test('a configuration change after claim blocks external work and withholds the returning result',async()=>{
   installEnvironment(neon);const prepared=await prepare(),execution=await claim(prepared);
   process.env.AI_GATEWAY_RED_MODEL='anthropic/changed-after-claim';
   assert.throws(()=>assertOrganizationCouncilProviderTransfer(execution.context.payload.providerTransfer),changed);
   const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult));
   assertWithheld(receipt,'SYNTHETIC SHARED INPUT');installEnvironment(neon);
  });
  await t.test('contributor consent revoked during inference withholds all prior input and advice',async()=>{
   const fixture=await proposal('SYNTHETIC REVOKED CONSENT'),prepared=await prepare(fixture.target),execution=await claim(prepared);
   await act('bob',{action:'consent',organizationId:org.id,id:fixture.source.id,version:fixture.source.version,allowed:false});
   const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult));
   assertWithheld(receipt,'SYNTHETIC REVOKED CONSENT');
   assert.equal((await as('alice',q=>q.query('SELECT state FROM dis_organization_review_jobs WHERE id=$1',[prepared.id]))).rows[0].state,'FAILED');
  });
  await t.test('source withdrawal during inference cannot be republished through a Council receipt',async()=>{
   const fixture=await proposal('SYNTHETIC WITHDRAWN SOURCE'),prepared=await prepare(fixture.target),execution=await claim(prepared);
   await act('bob',{action:'withdraw',organizationId:org.id,id:fixture.source.id,version:fixture.source.version});
   const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult));
   assertWithheld(receipt,'SYNTHETIC WITHDRAWN SOURCE');
  });
  await t.test('contributor membership revocation during inference withholds the returning review',async()=>{
   const fixture=await proposal('SYNTHETIC REVOKED CONTRIBUTOR'),prepared=await prepare(fixture.target),execution=await claim(prepared);
   await act('alice',{action:'revoke-member',organizationId:org.id,subject:'bob'});
   const receipt:any=await as('alice',q=>finishOrganizationCouncil(q,'alice',org.id,prepared.id,execution,syntheticResult));
   assertWithheld(receipt,'SYNTHETIC REVOKED CONTRIBUTOR');
   assert.equal((await as('bob',q=>q.query('SELECT * FROM dis_organization_review_jobs'))).rows.length,0);
  });
  assert.equal(networkCalls,0,'preparation, claims, and finalization must not call providers under DB locks');
 }finally{await db.close();globalThis.fetch=originalFetch;installEnvironment(saved);}
});
