import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatch} from '../app/api/mcp/dispatch';
import {POST} from '../app/api/mcp/route';
import {reviewResearchProtocol,type ResearchProtocolReviewInput} from '../lib/research-protocol-review';
import {researchPlanningDigest} from '../lib/research-planning-handoff';

const fixture=():ResearchProtocolReviewInput=>({
 binding:{runId:'run-fixture-1',workflowId:'workflow-fixture-1',protocolId:'protocol-fixture-1',
  protocolVersion:'1',protocolSha256:'a'.repeat(64),sourceReceiptSha256:'b'.repeat(64)},
 sourceClass:'public_source',
 inquiry:{id:'run-fixture-1',decisionAsOf:'2026-11-14T08:00:00Z',
  question:'Which implementation barriers should a public evidence review investigate?',
  intendedUse:'Prepare a research brief for human appraisal',decisionOwner:'Fixture owner, not actual approval',
  targetPopulation:'Public-service organizations; applicability remains unreviewed',
  targetOutcome:'Define a reproducible research question',systemContext:'Constructed public-source test fixture',
  hypotheses:[],instruments:[{id:'source-1',name:'Constructed article metadata',construct:'Reported implementation barriers',
   unit:'Study report',intendedScope:'Population reported by each study',limitation:'Full text not appraised',
   sourceId:'pubmed:fixture',originalLineage:'study-fixture-1',kind:'STUDY_REPORT',observedAt:null,
   retrievedAt:'2026-11-14T07:30:00Z',validationEvidence:null,fitForUseJustification:'Discovery for later appraisal'}],
  evidence:[{id:'claim-1',claim:'A prediction needs further evaluation',kind:'PREDICTIVE',instrumentIds:['source-1'],
   targetOutcome:'Proposed prediction',referencePopulation:'Not yet externally tested',externalValidation:null}]
 }
});
const rpc=(args:unknown)=>({jsonrpc:'2.0',id:'review-fixture',method:'tools/call',params:{name:'dis_review_research_protocol',arguments:args}});
const fixed=()=>new Date('2026-11-14T08:01:00Z');

test('registered MCP returns real DIS findings and exact retained-run binding without granting authority',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=(async()=>{calls++;throw Error('Method review must not perform source or account requests');}) as typeof fetch;
  const result:any=await dispatch(rpc(fixture()));
  assert.equal(result.error,undefined);
  const review=JSON.parse(result.result.content[0].text);
  assert.deepEqual(review.binding,fixture().binding);
  assert.equal(review.schemaVersion,'dis.research-protocol-review.v1');
  assert.equal(review.assessment.version,'dis-inquire-method-v0.1');
  assert.ok(review.assessment.findings.some((f:any)=>f.id==='TRANSPORT_UNVERIFIED'));
  assert.ok(review.assessment.findings.some((f:any)=>f.id==='INSTRUMENT_FIT_UNSUPPORTED'));
  assert.equal(review.researchContinuation,'CONTINUE_WITH_QUALIFICATIONS');
  assert.deepEqual(review.authority,{actionAuthorized:false,independentValidationEstablished:false,humanApprovalRecorded:false});
  assert.equal(review.assessment.evidenceLevels.studyEffectEstablished,false);
  assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});

test('method restrictions remain attached to unsupported claims while research preparation continues',()=>{
 const input=fixture();input.inquiry.evidence[0].kind='CAUSAL';
 const review=reviewResearchProtocol(input,fixed);
 assert.equal(review.assessment.state,'NOT_READY_FOR_CLAIM');
 assert.ok(review.assessment.findings.some(f=>f.id==='CAUSAL_CLAIM_NO_COUNTERFACTUAL'&&f.level==='HOLD_INFERENCE'));
 assert.equal(review.researchContinuation,'CONTINUE_WITH_QUALIFICATIONS');
 assert.equal(review.authority.actionAuthorized,false);
});

test('review digest survives key reordering and binds every returned field',()=>{
 const review=reviewResearchProtocol(fixture(),fixed);
 const {reviewSha256,...contents}=review;
 assert.equal(researchPlanningDigest(contents),reviewSha256);
 const reversed=Object.fromEntries(Object.entries(contents).reverse());
 assert.equal(researchPlanningDigest(reversed),reviewSha256);
 assert.notEqual(researchPlanningDigest({...contents,binding:{...contents.binding,protocolVersion:'2'}}),reviewSha256);
 assert.notEqual(researchPlanningDigest({...contents,authority:{...contents.authority,humanApprovalRecorded:true}}),reviewSha256);
 const changed=fixture();changed.inquiry.question+=' A changed question.';
 assert.notEqual(reviewResearchProtocol(changed,fixed).inquirySha256,review.inquirySha256);
});

test('partner identifiers with namespaces retain their exact value',()=>{
 const input=fixture();
 input.binding.runId='aide/tenant@example:run-1';
 input.inquiry.id=input.binding.runId;
 input.binding.workflowId='aide/research/workflow-1';
 input.binding.protocolId='protocol@organization/1';
 const review=reviewResearchProtocol(input,fixed);
 assert.deepEqual(review.binding,input.binding);
});

test('unknown nested fields, forged authority, wrong identities and duplicate record IDs are rejected',async()=>{
 const cases:Array<unknown>=[];
 const wrongId=fixture();wrongId.inquiry.id='another-run';cases.push(wrongId);
 const duplicate=fixture();duplicate.inquiry.instruments.push({...duplicate.inquiry.instruments[0]});cases.push(duplicate);
 const badHash=fixture();badHash.binding.sourceReceiptSha256='not-a-sha';cases.push(badHash);
 cases.push({...fixture(),humanApprovalRecorded:true});
 cases.push({...fixture(),sourceClass:'protected_patient_record'});
 cases.push({...fixture(),inquiry:{...fixture().inquiry,reviewerVerified:true}});
 cases.push({...fixture(),inquiry:{...fixture().inquiry,instruments:[{...fixture().inquiry.instruments[0],validationEvidence:true}]}});
 for(const value of cases){
  const result:any=await dispatch(rpc(value));assert.equal(result.error?.code,-32602);
 }
});

test('metadata arrays and source types are bounded before method execution',async()=>{
 const input=fixture();input.inquiry.instruments=Array.from({length:21},(_,i)=>({...input.inquiry.instruments[0],id:'source-'+i}));
 assert.equal((await dispatch(rpc(input)) as any).error.code,-32602);
 const malformed=fixture();(malformed.inquiry as any).hypotheses={};
 assert.equal((await dispatch(rpc(malformed)) as any).error.code,-32602);
});

test('actual registered HTTP path returns the review and refuses oversized UTF-8 without trusting Content-Length',async()=>{
 const response=await POST(new Request('http://localhost/api/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(rpc(fixture()))}));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'no-store');
 const body:any=await response.json();assert.equal(JSON.parse(body.result.content[0].text).binding.runId,'run-fixture-1');
 const oversized=fixture();oversized.inquiry.systemContext='界'.repeat(6000);
 const denied=await POST(new Request('http://localhost/api/mcp',{method:'POST',headers:{'content-type':'application/json','content-length':'1'},body:JSON.stringify(rpc(oversized))}));
 assert.equal(denied.status,413);
 assert.equal((await denied.json() as any).error.code,-32600);
});

test('second-sector inquiry uses the same review without inheriting healthcare claims',()=>{
 const input=fixture();input.inquiry.question='What factors affect uptake of workforce training?';
 input.inquiry.targetPopulation='Adult workforce program participants';input.inquiry.evidence=[];input.inquiry.instruments=[];
 const review=reviewResearchProtocol(input,fixed);
 assert.equal(review.researchContinuation,'CONTINUE_WITH_QUALIFICATIONS');
 assert.ok(review.assessment.findings.some(f=>f.id==='INSTRUMENT_SELECTION_NOT_EXPLAINED'));
 assert.equal(review.assessment.evidenceLevels.clinicalRecommendationAuthorized,false);
 assert.equal(JSON.stringify(review).includes('women’s health'),false);
});
