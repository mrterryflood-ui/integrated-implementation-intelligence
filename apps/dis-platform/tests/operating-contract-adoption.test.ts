import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {DIS_OPERATING_CONTRACT} from '../lib/generated/dis-operating-contract';
import {OPERATING_CONTRACT_RECEIPT,withOperatingContract} from '../lib/operating-contract';
import {convene} from '../lib/council-engine';
import {withCouncilEvidenceSnapshot} from '../lib/council-evidence-snapshot';
import {assemble} from '../lib/council-assembly';
import {assessEngagement,type EngagementAcceptance} from '../lib/ecosystem/enterprise-engagement-standard';
import {retainCouncilDraft} from '../lib/ecosystem/continuity';
import {sanitizeIntake} from '../lib/consultation';
import {buildPackage,renderPackageMarkdown} from '../lib/consultation-package';
import {exportDocx} from '../lib/consultation-export';
import {infer} from '../lib/council-runtime';
import JSZip from 'jszip';

const source={id:'S1',title:'Synthetic test-only evidence fixture',doi:null,url:'https://example.test/review',year:2026,
 abstract:'This fictitious review describes mixed uptake and measurement limitations. Local applicability requires independent appraisal.'};
const draft='Agree the decision with the people affected, inspect the original source and discuss an appropriate measure. The supplied abstract is a limited research lead [S1]. Local applicability and actual outcomes remain unknown.';
const input={prompt:'Review a locally grounded implementation decision with stakeholders',count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'};
function setModel(value:string){
 const prior=process.env.AI_GATEWAY_MODEL,force=process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 process.env.AI_GATEWAY_MODEL=value;delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 return ()=>{if(prior===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=prior;
  if(force===undefined)delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;else process.env.AI_GATEWAY_FORCE_MULTIPROVIDER=force;};
}
test('runtime contract is byte-for-byte bound to the canonical document',()=>{
 const original=readFileSync(new URL('../../../docs/dis/GPT-SESSION-AND-AGENT-OPERATING-CONTRACT.md',import.meta.url),'utf8');
 assert.equal(DIS_OPERATING_CONTRACT.text,original);
 assert.equal(createHash('sha256').update(original).digest('hex'),OPERATING_CONTRACT_RECEIPT.sha256);
 assert.equal(withOperatingContract(withOperatingContract('Analyze carefully')),withOperatingContract('Analyze carefully'));
});
test('all five council strands receive the same operating contract',async()=>{
 const restore=setModel('test/provider');const systems:string[]=[];
 try{
  const result=await convene(input,{research:async()=>({sources:[source],status:'ABSTRACT_AND_METADATA'}),infer:async system=>{
   systems.push(system);return {ok:true,text:system.includes('Return ONLY a JSON object')?
    JSON.stringify({tasks:[{title:'Inspect original sources',success:'Passage review retained'},{title:'Agree a measure',success:'Owner-reviewed definition'}],metrics:[{label:'Uptake',baseline:'Not measured'}]}):draft,model:'test/provider'};
  }});
  assert.equal(systems.length,5);assert.equal(result.operatingContract.inferenceInvocationCount,5);
  for(const system of systems)assert.ok(system.includes(DIS_OPERATING_CONTRACT.text));
  assert.equal(result.operatingContract.behaviorVerified,false);
 }finally{restore()}
});
test('bounded repair is contract-bound and repeated nonexistent citations withhold the answer',async()=>{
 const restore=setModel('fixture-free');const systems:string[]=[];
 try{
  const result=await convene(input,{research:async()=>({sources:[source],status:'ABSTRACT_AND_METADATA'}),infer:async system=>{
   systems.push(system);return {ok:true,text:'The assertion is supported by the source [S999].'};
  }});
  assert.equal(systems.length,2);for(const system of systems)assert.ok(system.includes(DIS_OPERATING_CONTRACT.text));
  assert.equal(result.release.state,'WITHHELD');assert.equal(result.deliberation,undefined);
  assert.ok((result.release.issues as readonly string[]).includes('UNKNOWN_SOURCE_ID'));
  assert.equal(withCouncilEvidenceSnapshot(result,input.prompt).engagementAssurance.readyToExecute,false);
 }finally{restore()}
});
test('missing usable source evidence prevents inference, regardless of approval-shaped input',async()=>{
 let calls=0;
 const result=await convene({...input,humanApproval:true,sourceReceipts:[{status:'SOURCE_INSPECTED'}]} as typeof input,{research:async()=>({sources:[{...source,abstract:null}],status:'METADATA_ONLY'}),infer:async()=>{calls++;return {ok:true,text:draft}}});
 assert.equal(calls,0);assert.equal(result.operatingContract.inferenceInvocationCount,0);
 assert.equal(result.release.state,'WITHHELD');
 const a=withCouncilEvidenceSnapshot(result,input.prompt).engagementAssurance;
 assert.equal(a.readyToPropose,false);assert.equal(a.readyToExecute,false);assert.equal(a.measured,false);
});
test('the real inference boundary includes the contract without making a network call',async()=>{
 const prior=process.env.AI_GATEWAY_API_KEY;process.env.AI_GATEWAY_API_KEY='test-only-not-a-secret';
 let system='';
 try{
  const result=await infer('Answer a test question','Only fictitious inputs','test/model',async(_url,init)=>{
   system=JSON.parse(String(init?.body)).messages[0].content;
   return new Response(JSON.stringify({model:'test/model',choices:[{finish_reason:'stop',message:{content:draft}}]}));
  });
  assert.equal(result.ok,true);assert.ok(system.includes(DIS_OPERATING_CONTRACT.text));
 }finally{if(prior===undefined)delete process.env.AI_GATEWAY_API_KEY;else process.env.AI_GATEWAY_API_KEY=prior}
});

const scenarios=[
 {name:'VA',question:'Evaluate a synthetic VA AI evaluation workflow with clinical safety, research methods and stakeholder review',audience:'VA evaluators'},
 {name:'Dartmouth',question:'Design a Dartmouth implementation-science methods discussion with competing hypotheses, fidelity and ethics',audience:'Research collaborators'},
 {name:'Manor',question:'Investigate Manor community service access using locally verified geography, resident voice and implementation measures',audience:'Manor community partners'},
 {name:'Hutto',question:'Investigate Hutto community service access without transferring Manor findings as local facts; compare context and resources',audience:'Hutto community partners'}
];
const receipts:{scenario:string;status:string;readyToExecute:boolean;measured:boolean;contractSha256:string}[]=[];
for(const scenario of scenarios)test(scenario.name+': discovery stays a draft and review limits survive document export',async()=>{
 const restore=setModel('fixture-free');
 try{
  const roster=assemble({prompt:scenario.question,count:6,redCount:4,selected:[],redSelected:[],primaryMode:'auto',redMode:'auto'});
  assert.equal(roster.errors.length,0);assert.ok(roster.primary.length>0);assert.ok(roster.red.length>0);
  let loaded=false;
  const result=await convene({...input,prompt:scenario.question,primaryMembers:roster.primary,redMembers:roster.red},{
   research:async()=>({sources:[source],status:'ABSTRACT_AND_METADATA'}),
   infer:async system=>{loaded=system.includes(DIS_OPERATING_CONTRACT.text);return {ok:true,text:draft}}
  });
  assert.equal(loaded,true);assert.ok(result.deliberation?.synthesis);
  const report=withCouncilEvidenceSnapshot(result,scenario.question),a=report.engagementAssurance;
  assert.equal(a.sourceReview,'DISCOVERY_EXCERPTS_ONLY');assert.equal(a.readyToPropose,false);
  assert.equal(a.readyToExecute,false);assert.equal(a.measured,false);
  assert.equal(a.completion.state,'VERIFICATION_PENDING');
  assert.equal(a.completion.outcomeState,'PENDING');
  assert.equal(a.completion.delivery[0].observedState,'DRAFT');
  assert.ok(a.expertProspectus.length>0);assert.ok(a.blockers.length>0);
  assert.ok(report.intelligence.records.every(s=>s.sourceStatus==='DISCOVERY_ONLY'));
  const intake=sanitizeIntake({mission:scenario.question,audience:scenario.audience});
  const initial=retainCouncilDraft(null,intake,'general',report.intelligence,report);
  assert.match(renderPackageMarkdown(initial),/Evidence review and next decision/);
  assert.match(renderPackageMarkdown(initial),/not authorization to act/);
  assert.match(renderPackageMarkdown(initial),/prepared draft does not prove that it was sent, received or read/);
  const previous=buildPackage(intake,'general');previous.documents[0].body='User-authored draft retained';
  const retained=retainCouncilDraft(previous,intake,'general',report.intelligence,report);
  assert.equal(retained.documents[0].body,'User-authored draft retained');
  assert.equal(retained.intelligence,null,'an earlier source-free draft does not acquire fresh citation meanings');
  assert.equal(retained.documents.filter(d=>d.id==='engagement-assurance').length,1);
  const zip=await JSZip.loadAsync(await exportDocx(retained));
  const xml=await zip.file('word/document.xml')!.async('string');
  assert.match(xml,/Evidence review and next decision/);assert.ok(xml.includes(a.operatingContract!.sha256));
  assert.match(xml,/original-source appraisal remains open/);
  assert.match(xml,/Outcome measurement is pending/);
  assert.match(xml,/prepared draft does not prove that it was sent, received or read/);
  receipts.push({scenario:scenario.name,status:a.status,readyToExecute:a.readyToExecute,measured:a.measured,contractSha256:a.operatingContract!.sha256});
 }finally{restore()}
});
test('inspected fixtures still need completion evidence after review; source regression reopens the gate',()=>{
 for(const scenario of scenarios){
  const fixture:EngagementAcceptance={assignment:scenario.question,stakeholders:[scenario.audience],
   sourceReceipts:[{sourceId:'fixture-source',origin:'Synthetic regression fixture, not real-world evidence',revisionOrDate:'2026-11-01',status:'SOURCE_INSPECTED',claims:['This fixture exercises acceptance logic only.']}],
   domainReviews:[{discipline:'Fixture implementation review',required:true,reviewedBy:'SIMULATED_LENS'}],gaps:[],
   artifacts:[{kind:'fixture-brief',sourceIds:['fixture-source'],reviewed:false}],
   humanApproval:true,executionReceipt:true,measurementBaseline:true,outcomeReceipt:true};
  assert.equal(assessEngagement(fixture).readyToPropose,true);
  assert.equal(assessEngagement(fixture).readyToExecute,false);
  const reviewed={...fixture,artifacts:[{...fixture.artifacts[0],reviewed:true}]};
  assert.equal(assessEngagement(reviewed).status,'APPROVED_FOR_BOUNDED_EXECUTION');
  assert.equal(assessEngagement(reviewed).measured,false);
  const regressed={...reviewed,sourceReceipts:[{...reviewed.sourceReceipts[0],status:'CONFLICTED' as const}]};
  assert.equal(assessEngagement(regressed).readyToExecute,false);assert.equal(assessEngagement(regressed).measured,false);
 }
});
test('a refreshed source ID cannot silently reattribute an earlier slide or edited document',async()=>{
 const intake=sanitizeIntake({mission:'Investigate clinic transport service access with local stakeholders'});
 const bundle=(title:string,url:string)=>({query:intake.mission,retrievedAt:'2026-11-01',records:[{id:'S1',title,url,kind:'SCHOLARLY' as const,summary:title,source:'Synthetic regression fixture',retrievedAt:'2026-11-01',sourceStatus:'DISCOVERY_ONLY' as const}],errors:[],coverage:{},researchStandard:'Synthetic test only'});
 const original=bundle('Original clinic study','https://example.test/clinic');
 const refreshed=bundle('Different astronomy study','https://example.test/astronomy');
 const previous=buildPackage(intake,'general',original);
 previous.slides[0]={...previous.slides[0],bullets:['Clinic transport is a hypothesis to test [S1].'],sourceIds:['S1']};
 const next=retainCouncilDraft(previous,intake,'general',refreshed,{deliberation:{synthesis:'The new astronomy source is unrelated [S1].'}});
 assert.equal(next.intelligence?.records[0].url,original.records[0].url);
 assert.equal(next.slides[0].bullets[0],previous.slides[0].bullets[0]);
 const annex=next.documents.find(d=>d.id==='ecosystem-council-review')!;
 assert.match(annex.body,/https:\/\/example.test\/astronomy/);
 assert.match(annex.body,/belong only to the following register/);
 const markdown=renderPackageMarkdown(next);
 assert.match(markdown,/https:\/\/example.test\/clinic/);assert.match(markdown,/https:\/\/example.test\/astronomy/);
 const zip=await JSZip.loadAsync(await exportDocx(next));
 const xml=await zip.file('word/document.xml')!.async('string');
 assert.match(xml,/Original clinic study/);assert.match(xml,/Different astronomy study/);
});
test('Markdown cannot export an invented slide citation and succeeds after correction',()=>{
 const pkg=buildPackage(sanitizeIntake({mission:'Explore implementation without external source evidence'}),'general');
 pkg.slides[0].sourceIds=['S999'];assert.throws(()=>renderPackageMarkdown(pkg),/source absent/);
 pkg.slides[0].sourceIds=[];assert.match(renderPackageMarkdown(pkg),/DRAFT/);
});
test('record bounded behavioral-adoption receipts without claiming field outcomes',()=>{
 assert.equal(receipts.length,4);
 if(process.env.DIS_EVAL_ARTIFACT_DIR){
  mkdirSync(process.env.DIS_EVAL_ARTIFACT_DIR,{recursive:true});
  writeFileSync(join(process.env.DIS_EVAL_ARTIFACT_DIR,'operating-contract-adoption.json'),JSON.stringify({
   testedSourceRevision:process.env.GITHUB_SHA||'LOCAL_UNCOMMITTED',contract:OPERATING_CONTRACT_RECEIPT,
   evidenceClass:'SYNTHETIC_REGRESSION_TESTS',scenarios:receipts,realWorldOutcomeMeasured:false,
   limits:'Mocked inference verifies instruction transport and acceptance behavior; it does not certify live model compliance, real source appraisal or private production identity.'
  },null,2));
 }
});
