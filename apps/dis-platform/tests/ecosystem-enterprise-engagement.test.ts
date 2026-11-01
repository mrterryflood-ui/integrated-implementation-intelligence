import test from 'node:test';import assert from 'node:assert/strict';
import {ENGAGEMENT_PHASES,assessEngagement,missingExpertProspectus,type EngagementAcceptance} from '../lib/ecosystem/enterprise-engagement-standard';
const base:EngagementAcceptance={assignment:'Evaluate a specific VA AI evaluation platform',stakeholders:['VA leadership'],sourceReceipts:[{sourceId:'repo',origin:'GitHub',revisionOrDate:'a'.repeat(40),status:'SOURCE_INSPECTED',claims:['Synthetic evaluation implemented']}],domainReviews:[{discipline:'clinical AI evaluation',required:true,reviewedBy:'SIMULATED_LENS'}],gaps:[{description:'Calibration',closureAction:'Independent benchmark',owner:'Research lead',acceptanceTest:'Human-rater agreement'}],artifacts:[{kind:'executive-brief',sourceIds:['repo'],reviewed:false}],humanApproval:false,executionReceipt:false,measurementBaseline:false,outcomeReceipt:false};
test('standard spans assignment through learning and measurement',()=>{assert.equal(ENGAGEMENT_PHASES[0],'identify-assignment');assert.equal(ENGAGEMENT_PHASES.at(-1),'learn-and-reassess')});
test('proposal is not approved implementation or measured impact',()=>{const r=assessEngagement(base);assert.equal(r.status,'REVIEWABLE_PROPOSAL');assert.equal(r.readyToExecute,false);assert.equal(r.measured,false)});
test('source missing or conflicting blocks confident proposal',()=>{for(const status of ['MISSING','CONFLICTED','UNVERIFIED'] as const){const r=assessEngagement({...base,sourceReceipts:[{...base.sourceReceipts[0],status}]});assert.equal(r.readyToPropose,false)}});
test('missing discipline, remedy or citations blocks proposal',()=>{assert.equal(assessEngagement({...base,domainReviews:[{discipline:'security',required:true,reviewedBy:'NOT_REVIEWED'}]}).readyToPropose,false);assert.equal(assessEngagement({...base,gaps:[{...base.gaps[0],acceptanceTest:''}]}).readyToPropose,false);assert.equal(assessEngagement({...base,artifacts:[{kind:'brief',sourceIds:[],reviewed:false}]}).readyToPropose,false)});
test('approval of reviewed deliverables does not prove execution or impact',()=>{const r=assessEngagement({...base,artifacts:base.artifacts.map(a=>({...a,reviewed:true})),humanApproval:true});assert.equal(r.readyToExecute,true);assert.equal(r.measured,false)});
test('external SME prospects never imply employment',()=>{const p=missingExpertProspectus(base.domainReviews);assert.equal(p.length,1);assert.match(p[0].warning,/not a claim/);assert.equal(missingExpertProspectus([{discipline:'stats',required:true,reviewedBy:'VERIFIED_HUMAN',expertId:'reviewer-1'}]).length,0)});

test('invented or uninspected source IDs cannot establish proposal readiness',()=>{
 const invented=assessEngagement({...base,artifacts:[{kind:'brief',sourceIds:['fabricated-source'],reviewed:false}]});
 assert.equal(invented.readyToPropose,false);
 const secondary=assessEngagement({...base,sourceReceipts:[...base.sourceReceipts,{sourceId:'secondary',origin:'aggregator',revisionOrDate:'today',status:'SECONDARY_ONLY',claims:['unverified']}],artifacts:[{kind:'brief',sourceIds:['secondary'],reviewed:false}]});
 assert.equal(secondary.readyToPropose,false);
});

test('empty and incomplete inspected receipts cannot establish traceability',()=>{
 for(const receipt of [
  {...base.sourceReceipts[0],sourceId:''},
  {...base.sourceReceipts[0],sourceId:' repo '},
  {...base.sourceReceipts[0],origin:' '},
  {...base.sourceReceipts[0],revisionOrDate:' '},
  {...base.sourceReceipts[0],claims:[]},
  {...base.sourceReceipts[0],claims:[' ']}
 ]){
  const result=assessEngagement({...base,sourceReceipts:[receipt],artifacts:[{...base.artifacts[0],sourceIds:[receipt.sourceId]}]});
  assert.equal(result.readyToPropose,false);
  assert.match(result.blockers.join(' '),/Source receipt/);
 }
});

test('duplicate source IDs cannot hide an unverified or competing receipt',()=>{
 for(const duplicate of [
  {...base.sourceReceipts[0],status:'UNVERIFIED' as const,claims:['Unsupported competing claim']},
  {...base.sourceReceipts[0],origin:'Another repository'},
  {...base.sourceReceipts[0],sourceId:' repo '}
 ]){
  const result=assessEngagement({...base,sourceReceipts:[...base.sourceReceipts,duplicate]});
  assert.equal(result.readyToPropose,false);
  assert.match(result.blockers.join(' '),/Duplicate source IDs/);
 }
});

test('omitted or optional-only council coverage cannot waive required review',()=>{
 for(const domainReviews of [[],base.domainReviews.map(r=>({...r,required:false})),base.domainReviews.map(r=>({...r,discipline:' '}))]){
  assert.equal(assessEngagement({...base,domainReviews}).readyToPropose,false);
 }
});

test('claimed human review requires reviewer identity and cannot suppress the SME gap',()=>{
 for(const expertId of [undefined,'',' ']){
  const domainReviews=[{discipline:'clinical AI',required:true,reviewedBy:'VERIFIED_HUMAN' as const,expertId}];
  const result=assessEngagement({...base,domainReviews});
  assert.equal(result.readyToPropose,false);
  assert.match(result.blockers.join(' '),/reviewer identity/);
  assert.equal(missingExpertProspectus(domainReviews).length,1);
 }
});

test('whitespace does not fulfill stakeholder, gap or deliverable requirements',()=>{
 assert.equal(assessEngagement({...base,stakeholders:[' ']}).readyToPropose,false);
 assert.equal(assessEngagement({...base,artifacts:[{...base.artifacts[0],kind:' '}]}).readyToPropose,false);
 for(const field of ['description','closureAction','owner','acceptanceTest']){
  assert.equal(assessEngagement({...base,gaps:[{...base.gaps[0],[field]:' '}]}).readyToPropose,false);
 }
});

test('unreviewed deliverables remain drafts even when approval and outcome flags are supplied',()=>{
 const result=assessEngagement({...base,humanApproval:true,executionReceipt:true,measurementBaseline:true,outcomeReceipt:true});
 assert.equal(result.status,'REVIEWABLE_PROPOSAL');
 assert.equal(result.readyToPropose,true);
 assert.equal(result.readyToExecute,false);
 assert.equal(result.measured,false);
 assert.match(result.executionBlockers.join(' '),/deliverables have not completed review/);
});

test('reviewed and approved legacy flags cannot substitute for structured completion evidence',()=>{
 const reviewed={...base,artifacts:base.artifacts.map(a=>({...a,reviewed:true})),humanApproval:true,executionReceipt:true,measurementBaseline:true,outcomeReceipt:true};
 assert.equal(assessEngagement(reviewed).status,'APPROVED_FOR_BOUNDED_EXECUTION');
 assert.equal(assessEngagement(reviewed).measured,false);
 assert.match(assessEngagement(reviewed).completion.blockers.join(' '),/independently verified remediation/);
 for(const field of ['executionReceipt','measurementBaseline','outcomeReceipt']){
  assert.equal(assessEngagement({...reviewed,[field]:false}).measured,false);
 }
 const invalidApproval={...reviewed,humanApproval:'false'} as unknown as EngagementAcceptance;
 assert.equal(assessEngagement(invalidApproval).readyToExecute,false);
});
