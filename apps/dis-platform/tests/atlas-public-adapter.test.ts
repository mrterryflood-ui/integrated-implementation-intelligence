import test from 'node:test';
import assert from 'node:assert/strict';
import {NetworkBudget} from '../lib/ecosystem/transport';
import {ECOSYSTEM_CAPABILITIES} from '../lib/ecosystem/catalog';
import {planEngagement} from '../lib/ecosystem/planner';
import {executeEngagement} from '../lib/ecosystem/orchestrator';
import {ATLAS_PUBLIC_COMPOSITION_URL,projectAtlasPublicComposition,readAtlasPublicComposition} from '../lib/ecosystem/atlas-public-adapter';
const capability=ECOSYSTEM_CAPABILITIES.find(x=>x.id==='continuity-and-emergency-intelligence')!;
function fixture(){
 return {contract:'atlas.mission-composition.v1',goal:'hazard-awareness',hasAnyLiveEvidence:false,fullyReceipted:false,
  endToEndServiceAccepted:false,independentRedundancyProven:false,
  needs:[
   {required:'HAZARD_CONTEXT',sourceIds:['hazardaware-cop'],implementedCandidates:['hazardaware-cop'],observedSourceIds:[],satisfiedByLiveEvidence:false,independentlyReceiptedPairs:0,gap:'NO_LIVE_SOURCE_RECEIPT'},
   {required:'WEATHER_OBSERVATION',sourceIds:['nws-direct'],implementedCandidates:['nws-direct'],observedSourceIds:[],satisfiedByLiveEvidence:false,independentlyReceiptedPairs:0,gap:'NO_LIVE_SOURCE_RECEIPT'}
  ],
  nodes:[{id:'hazardaware-cop',implementation:'CODE_PRESENT'},{id:'nws-direct',implementation:'CODE_PRESENT'},{id:'defense-radar-gateway',implementation:'DECLARATION_ONLY'}]
 };
}
const json=(data:unknown,status=200,headers:Record<string,string>={'content-type':'application/json'})=>new Response(JSON.stringify(data),{status,headers});
test('explicit ATLAS public catalog is bound to the existing defense capability without a credential or write action',()=>{
 assert.equal(capability.transport,'PUBLIC_JSON');assert.equal(capability.endpoint,ATLAS_PUBLIC_COMPOSITION_URL);
 assert.equal(capability.requiresGeography,false);assert.equal(capability.dataClass,'PUBLIC_AGGREGATE');
 const plan=planEngagement({problem:'Assess ATLAS emergency continuity and hazard readiness for a program office.',audience:'Program evaluator',domains:['defense'],geography:{kind:'unspecified'},externalConsent:true});
 assert.equal(plan.question,null);assert.ok(plan.selected.some(x=>x.id===capability.id));
});
test('source projections never imply operational acceptance even when the upstream boasts it',()=>{
 for(const live of [true,false]){const x=fixture();x.hasAnyLiveEvidence=live;x.endToEndServiceAccepted=live;
  const p=projectAtlasPublicComposition(x);
  assert.equal(p.independentlyVerifiedSource,false);assert.equal(p.independentlyVerifiedOutcome,false);
  assert.equal(p.physicalIntegrationProven,false);assert.equal(p.fieldAcceptanceProven,false);assert.equal(p.observedAt,null);
  assert.equal(p.providerReportedLive,live);assert.equal(p.needs[0].providerReportedLiveSources,0);
 }
});
test('the bounded metadata read transfers no token, user question, private record or location',async()=>{
 let seen=0;const budget=new NetworkBudget(1,1000,16384,async(url,init)=>{seen++;assert.equal(String(url),ATLAS_PUBLIC_COMPOSITION_URL);assert.equal(init?.method,'GET');assert.equal(init?.body,undefined);assert.equal(new Headers(init?.headers).has('authorization'),false);return json(fixture())});
 const r=await readAtlasPublicComposition(capability,budget);assert.equal(seen,1);assert.equal(r.state,'RETURNED');assert.equal(r.items.length,1);
 assert.equal(r.items[0].data.independentlyVerifiedOutcome,false);assert.equal(r.claimVerification,'NOT_PERFORMED');assert.equal(r.privateDataTransferred,false);
 assert.match(r.items[0].summary,/not a location observation/);
});
test('DIS actual engagement invokes existing public adapter and leaves outcome NOT_MEASURED',async()=>{
 const p={problem:'Assess ATLAS emergency continuity integration readiness.',audience:'Program office',domains:['defense'],geography:{kind:'unspecified'},externalConsent:true};
 const r=await executeEngagement(p,{kind:'PUBLIC_ONLY'},{fetcher:async()=>json(fixture())});
 assert.ok(r.receipts.some(x=>x.capabilityId===capability.id&&x.state==='RETURNED'));
 assert.equal(r.outcomeState,'NOT_MEASURED');assert.equal(r.implementationState,'NOT_EXECUTED');
 assert.ok(r.items.some(x=>x.id==='atlas-public-composition-hazard-awareness'));
});
test('wrong contracts, contradictory counts, duplicated identities, and missing requirements fail closed',()=>{
 const mutate=[
  (x:any)=>{x.goal='multi-source-picture'},(x:any)=>{x.contract='atlas.other'},
  (x:any)=>{x.needs=[]},(x:any)=>{x.needs[0].sourceIds=['one','one']},
  (x:any)=>{x.needs[0].observedSourceIds=['not-a-source']},
  (x:any)=>{x.needs[0].satisfiedByLiveEvidence=true},
  (x:any)=>{x.needs[0].independentlyReceiptedPairs=-1},
  (x:any)=>{x.needs[0].gap={fake:true}},
  (x:any)=>{x.nodes[0].implementation='IMPLEMENTED_PRODUCTION'},
  (x:any)=>{x.nodes[0].id='a secret bad ID'},
  (x:any)=>{x.hasAnyLiveEvidence='green'},
 ];
 for(const f of mutate){const v:any=fixture();f(v);assert.throws(()=>projectAtlasPublicComposition(v));}
});
test('upstream status, malformed content and redirect never yield an evidence record',async()=>{
 for(const code of [401,403,404,429,500])await assert.rejects(readAtlasPublicComposition(capability,new NetworkBudget(1,1000,4000,async()=>json({error:'no'},code))));
 await assert.rejects(readAtlasPublicComposition(capability,new NetworkBudget(1,1000,4000,async()=>json(fixture(),200,{'content-type':'text/plain'}))));
 await assert.rejects(readAtlasPublicComposition(capability,new NetworkBudget(1,1000,4000,async()=>new Response(null,{status:302,headers:{location:'https://evil.example'}}))));
 const huge='x'.repeat(6000);
 await assert.rejects(readAtlasPublicComposition(capability,new NetworkBudget(1,1000,1200,async()=>json({blob:huge}))));
});
test('2048 adversarial public shapes cannot self-certify source or recipient outcome',()=>{
 for(let i=0;i<2048;i++){const x:any=fixture();x.hasAnyLiveEvidence=i%2===0;x.endToEndServiceAccepted=i%3===0;
  const p=projectAtlasPublicComposition(x);assert.equal(p.independentlyVerifiedOutcome,false);
  assert.equal(p.independentlyVerifiedSource,false);assert.equal(p.needs.length,2);
 }
});
test('100 concurrent bounded read-only calls use exactly one allowed HTTPS endpoint each',async()=>{
 let total=0;const runs=Array.from({length:100},(_,i)=>readAtlasPublicComposition(capability,new NetworkBudget(1,2000,15000,async()=>{total++;return json(fixture())})));
 const results=await Promise.all(runs);assert.equal(results.length,100);assert.equal(total,100);
 assert.ok(results.every(x=>x.state==='RETURNED'&&x.requestCount===1&&x.privateDataTransferred===false));
});
