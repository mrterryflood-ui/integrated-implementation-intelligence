/** Real registered Ask route + PGlite RLS; synthetic Clerk and network only.
 * FIXTURE_AUTH_NOT_CLERK_ACCEPTANCE. No remote database or AI is contacted. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import {NEON_AI_GATEWAY_ORIGIN,NEON_AI_RECIPIENT} from '../lib/ai-gateway-neon';
import {actOnOrganization} from '../lib/organizations/service';
import {normalizeReport,PLANNING_SECTIONS} from '../lib/planning-contract';
import type {Queryable} from '../lib/organizations/database';

test('registered Ask route checks membership before catalog, observes availability outside SQL locks, and preserves blocked execution receipts',async t=>{
 const fixtureEnv:Record<string,string|undefined>={
  NODE_ENV:'test',DIS_HOST_PRODUCTION:undefined,VERCEL_ENV:undefined,
  DIS_AI_TRANSPORT:'neon',NEON_AI_GATEWAY_BASE_URL:NEON_AI_GATEWAY_ORIGIN,NEON_AI_GATEWAY_TOKEN:'synthetic-route-neon-token',
  DIS_ORG_ASK_ENABLED:'true',DIS_ORG_ASK_OPENAI_MODEL:'gpt-5-4-mini',DIS_ORG_ASK_GEMINI_MODEL:'gemini-3-5-flash-lite',
 };
 const originalEnv=Object.fromEntries(Object.keys(fixtureEnv).map(key=>[key,process.env[key]])),originalFetch=globalThis.fetch;
 const globals=globalThis as typeof globalThis&{__disNeonAskRouteFixture?:any};
 const db=new PGlite();await db.waitReady;
 mkdirSync('test-results',{recursive:true});const directory=mkdtempSync(join(process.cwd(),'test-results/neon-ask-route-'));
 let actor:string|null='alice',inTransaction=false,availability:boolean[]=[false],catalogCalls=0,inferenceCalls=0;
 const events:string[]=[];
 const wire=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 const catalogue=(enabled:boolean)=>({data:[{id:'gpt-5-4-mini',owned_by:'openai',enabled,...(enabled?{}:{unavailable_reason:'credits_required'})},{id:'gemini-3-5-flash-lite',owned_by:'google',enabled,...(enabled?{}:{unavailable_reason:'credits_required'})}]});
 async function as<T>(subject:string,work:(q:Queryable)=>Promise<T>):Promise<T>{
  assert.equal(inTransaction,false);inTransaction=true;events.push('transaction-start');
  await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
  try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[subject]);const result=await work(db as Queryable);await db.exec('COMMIT');return result;}
  catch(error){await db.exec('ROLLBACK');throw error;}
  finally{inTransaction=false;events.push('transaction-end');}
 }
 const action=(input:any)=>as('alice',q=>actOnOrganization(q,'alice',input));
 try{
  for(const[key,value]of Object.entries(fixtureEnv))if(value===undefined)delete process.env[key];else process.env[key]=value;
  await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');await db.exec(readFileSync('db/003_organization_workflow.sql','utf8'));
  await db.exec('CREATE TABLE dis_council_usage(subject_id text,usage_day date,calls int,last_called timestamptz DEFAULT now(),PRIMARY KEY(subject_id,usage_day)); GRANT SELECT,INSERT,UPDATE ON dis_council_usage TO dis_app_safe;');
  const org:any=await action({action:'create',name:'Synthetic Neon route pilot',displayName:'Alice'});
  await as('mallory',q=>actOnOrganization(q,'mallory',{action:'create',name:'Separate fixture tenant',displayName:'Mallory'}));
  const report=normalizeReport({schemaVersion:'dis.planning.report.v1',title:'Digital skills capacity',sections:Object.fromEntries(PLANNING_SECTIONS.map(([id])=>[id,id==='question'?'What digital skills capacity should we confirm?':id==='recommendation'?'Verify instructor capacity and local access before discussing a limited digital skills pilot.':id==='evidence'?'The proposed digital skills pilot requires available instructors and suitable local access.':'UNKNOWN']))});
  const draft:any=await action({action:'save-draft',organizationId:org.id,report});
  const submission:any=await action({action:'submit',organizationId:org.id,id:draft.id,version:draft.version});
  const proposal:any=await action({action:'reconcile',organizationId:org.id,selected:[{id:submission.id,version:submission.version}],title:'Digital skills capacity'});
  for(const row of [submission,proposal])await action({action:'consent',organizationId:org.id,id:row.id,version:row.version,allowed:true});
  globals.__disNeonAskRouteFixture={get actor(){events.push('identity');return actor;},transaction:as};
  const bundle=join(directory,'route.cjs');
  await build({entryPoints:['app/api/organizations/ask/route.ts'],outfile:bundle,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{
   name:'synthetic-clerk-and-real-pglite',setup(builder){
    builder.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'identity',namespace:'ask-fixture'}));
    builder.onResolve({filter:/\/lib\/organizations\/database$/},()=>({path:'database',namespace:'ask-fixture'}));
    builder.onLoad({filter:/.*/,namespace:'ask-fixture'},args=>({loader:'js',contents:args.path==='identity'
     ?'export async function auth(){return {userId:globalThis.__disNeonAskRouteFixture.actor}}'
     :'export const inOrganizationTransaction=(actor,work)=>globalThis.__disNeonAskRouteFixture.transaction(actor,work);'}));
   },
  }]});
  const api=createRequire(import.meta.url)(bundle) as {GET:(r:Request)=>Promise<Response>;POST:(r:Request)=>Promise<Response>};
  globalThis.fetch=(async(input:RequestInfo|URL,init:RequestInit={})=>{
   assert.equal(inTransaction,false,'Provider network must never occur under an organization transaction');
   const url=String(input);assert.equal(new URL(url).origin,NEON_AI_GATEWAY_ORIGIN);
   assert.equal(new Headers(init.headers).get('authorization'),'Bearer '+fixtureEnv.NEON_AI_GATEWAY_TOKEN);
   if(url===NEON_AI_GATEWAY_ORIGIN+'/v1/models'){
    events.push('catalog');catalogCalls++;assert.equal(init.method,'GET');assert.equal(init.body,undefined);
    const enabled=availability.length>1?availability.shift()!:availability[0];return wire(catalogue(enabled));
   }
   inferenceCalls++;events.push('inference');
   assert.equal(url,NEON_AI_GATEWAY_ORIGIN+'/openai/v1/responses');
   const body=JSON.parse(String(init.body)),payload=JSON.parse(body.input),passage=payload.passages[0];
   return wire({model:'gpt-5-4-mini',status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({claims:[{text:'The supplied source describes proposed pilot requirements.',citations:[{id:passage.id,quote:passage.text.slice(0,300)}]}],questions:[],unknowns:[]})}]}]});
  }) as typeof fetch;
  const requestOrigin='https://synthetic-dis.test';
  const get=()=>api.GET(new Request(requestOrigin+'/api/organizations/ask?organizationId='+org.id));
  const post=(input:any,origin=requestOrigin)=>api.POST(new Request(requestOrigin+'/api/organizations/ask',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({organizationId:org.id,...input})}));
  const prepare=()=>post({action:'prepare',targetId:proposal.id,version:proposal.version,question:'What digital skills capacity should be confirmed?',provider:'gpt'});
  const execute=(preview:any)=>post({action:'execute',id:preview.id,transferHash:preview.transferHash,externalConsent:true});
  const state=async(id:string)=>(await db.query<{state:string}>('SELECT state FROM dis_organization_review_jobs WHERE id=$1',[id])).rows[0].state;
  let preview:any;

  await t.test('signed-out, outside-tenant and foreign-origin requests make no catalog or inference call',async()=>{
   events.length=0;actor=null;assert.equal((await get()).status,401);
   actor='mallory';assert.equal((await get()).status,404);assert.equal((await prepare()).status,404);
   actor='alice';assert.equal((await post({action:'prepare'},'https://foreign.test')).status,403);
   assert.equal(catalogCalls,0);assert.equal(inferenceCalls,0);
  });
  await t.test('member status discloses observed credits-required and the recipient without credentials',async()=>{
   events.length=0;const response=await get();assert.equal(response.status,200);const body=await response.json();
   assert.equal(body.catalog,undefined);assert.equal(body.providers.length,2);
   for(const provider of body.providers){assert.equal(provider.configured,true);assert.equal(provider.canExecute,false);assert.equal(provider.unavailableReason,'credits_required');assert.equal(provider.recipient,NEON_AI_RECIPIENT);}
   assert.deepEqual(events,['identity','transaction-start','transaction-end','catalog']);
   assert.equal(JSON.stringify(body).includes(fixtureEnv.NEON_AI_GATEWAY_TOKEN!),false);
  });
  await t.test('preparation persists disclosed exact transfer but disabled model cannot claim or consume quota',async()=>{
   events.length=0;const response=await prepare();assert.equal(response.status,200);preview=(await response.json()).preview;
   assert.equal(preview.canExecute,false);assert.equal(preview.provider.availability,'UNAVAILABLE');assert.deepEqual(preview.missingConsents,[]);
   const transfer=JSON.parse(preview.transfer);assert.equal(transfer.transport,'neon');assert.equal(transfer.recipient,NEON_AI_RECIPIENT);
   assert.equal(transfer.modelIdentity,'openai/gpt-5-4-mini');assert.equal(transfer.endpoint,NEON_AI_GATEWAY_ORIGIN+'/openai/v1/responses');
   assert.equal(preview.transfer.includes(fixtureEnv.NEON_AI_GATEWAY_TOKEN!),false);
   assert.deepEqual(events,['identity','transaction-start','transaction-end','catalog','transaction-start','transaction-end']);
   const blocked=await execute(preview);assert.equal(blocked.status,503);assert.match((await blocked.json()).error,/credits_required/);
   assert.equal(await state(preview.id),'PREPARED');assert.equal((await db.query('SELECT * FROM dis_council_usage')).rows.length,0);assert.equal(inferenceCalls,0);
  });
  await t.test('a credits block after claim is saved as a safe failure receipt and never performs inference',async()=>{
   availability=[true,false];events.length=0;const response=await execute(preview);assert.equal(response.status,200);
   const body=await response.json();assert.equal(body.approvalGranted,false);assert.equal(body.receipt.body.result.state,'FAILED');
   assert.match(JSON.stringify(body.receipt.body.result),/credits_required/);assert.equal(body.receipt.body.result.claims.length,0);
   assert.equal(await state(preview.id),'FAILED');assert.equal(inferenceCalls,0);
   assert.equal(events.filter(event=>event==='catalog').length,2);
   assert.equal(JSON.stringify(body).includes(fixtureEnv.NEON_AI_GATEWAY_TOKEN!),false);
   availability=[true];assert.equal((await execute(preview)).status,409);assert.equal(inferenceCalls,0);
  });
  await t.test('enabled exact model completes the same consent-bound source workflow and cannot replay',async()=>{
   availability=[true];const ready=(await (await prepare()).json()).preview;assert.equal(ready.canExecute,true);
   const response=await execute(ready);assert.equal(response.status,200);const body=await response.json();
   assert.equal(body.receipt.body.result.state,'DRAFT_WITH_CITATIONS');assert.equal(body.receipt.body.result.approvalGranted,false);
   assert.equal(body.receipt.body.provider.modelIdentity,'openai/gpt-5-4-mini');assert.equal(body.receipt.body.provider.recipient,NEON_AI_RECIPIENT);
   assert.equal(await state(ready.id),'COMPLETED');assert.equal(inferenceCalls,1);
   assert.equal((await execute(ready)).status,409);assert.equal(inferenceCalls,1);
  });
 }finally{
  globalThis.fetch=originalFetch;delete globals.__disNeonAskRouteFixture;
  for(const[key,value]of Object.entries(originalEnv))if(value===undefined)delete process.env[key];else process.env[key]=value;
  await db.close();rmSync(directory,{recursive:true,force:true});
 }
});
