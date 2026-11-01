import test from 'node:test';import assert from 'node:assert/strict';
import {ENGAGEMENT_PHASES,assessEngagement,missingExpertProspectus,type EngagementAcceptance} from '../lib/ecosystem/enterprise-engagement-standard';
const base:EngagementAcceptance={assignment:'Evaluate a specific VA AI evaluation platform',stakeholders:['VA leadership'],sourceReceipts:[{sourceId:'repo',origin:'GitHub',revisionOrDate:'a'.repeat(40),status:'SOURCE_INSPECTED',claims:['Synthetic evaluation implemented']}],domainReviews:[{discipline:'clinical AI evaluation',required:true,reviewedBy:'SIMULATED_LENS'}],gaps:[{description:'Calibration',closureAction:'Independent benchmark',owner:'Research lead',acceptanceTest:'Human-rater agreement'}],artifacts:[{kind:'executive-brief',sourceIds:['repo'],reviewed:false}],humanApproval:false,executionReceipt:false,measurementBaseline:false,outcomeReceipt:false};
test('standard spans assignment through learning and measurement',()=>{assert.equal(ENGAGEMENT_PHASES[0],'identify-assignment');assert.equal(ENGAGEMENT_PHASES.at(-1),'learn-and-reassess')});
test('proposal is not approved implementation or measured impact',()=>{const r=assessEngagement(base);assert.equal(r.status,'REVIEWABLE_PROPOSAL');assert.equal(r.readyToExecute,false);assert.equal(r.measured,false)});
test('source missing or conflicting blocks confident proposal',()=>{for(const status of ['MISSING','CONFLICTED','UNVERIFIED'] as const){const r=assessEngagement({...base,sourceReceipts:[{...base.sourceReceipts[0],status}]});assert.equal(r.readyToPropose,false)}});
test('missing discipline, remedy or citations blocks proposal',()=>{assert.equal(assessEngagement({...base,domainReviews:[{discipline:'security',required:true,reviewedBy:'NOT_REVIEWED'}]}).readyToPropose,false);assert.equal(assessEngagement({...base,gaps:[{...base.gaps[0],acceptanceTest:''}]}).readyToPropose,false);assert.equal(assessEngagement({...base,artifacts:[{kind:'brief',sourceIds:[],reviewed:false}]}).readyToPropose,false)});
test('human approval alone does not prove execution or impact',()=>{const r=assessEngagement({...base,humanApproval:true});assert.equal(r.readyToExecute,true);assert.equal(r.measured,false)});
test('external SME prospects never imply employment',()=>{const p=missingExpertProspectus(base.domainReviews);assert.equal(p.length,1);assert.match(p[0].warning,/not a claim/);assert.equal(missingExpertProspectus([{discipline:'stats',required:true,reviewedBy:'VERIFIED_HUMAN'}]).length,0)});

test('invented or uninspected source IDs cannot establish proposal readiness',()=>{
 const invented=assessEngagement({...base,artifacts:[{kind:'brief',sourceIds:['fabricated-source'],reviewed:false}]});
 assert.equal(invented.readyToPropose,false);
 const secondary=assessEngagement({...base,sourceReceipts:[...base.sourceReceipts,{sourceId:'secondary',origin:'aggregator',revisionOrDate:'today',status:'SECONDARY_ONLY',claims:['unverified']}],artifacts:[{kind:'brief',sourceIds:['secondary'],reviewed:false}]});
 assert.equal(secondary.readyToPropose,false);
});
