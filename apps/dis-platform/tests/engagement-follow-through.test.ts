import test from 'node:test';
import assert from 'node:assert/strict';
import {assessEngagement,type EngagementAcceptance,type DeliveryManifest,type DeliveryReceipt} from '../lib/ecosystem/enterprise-engagement-standard';

// All identities, files, values and receipts below are synthetic regression fixtures.
const evidenceIds=['observation','change','verification','downstream','baseline','outcome','prepared','authorization','sent','received','read'];
const revision='b'.repeat(40);
const manifest:DeliveryManifest={artifactId:'synthetic-brief',version:'v2',packageSha256:'a'.repeat(64),
 destination:'https://example.test/recipient-inbox',recipientIds:['fixture-recipient'],
 attachments:[{filename:'synthetic-brief.pdf',sha256:'b'.repeat(64)},{filename:'synthetic-tool.html',sha256:'c'.repeat(64)}]};
function receipt(event:DeliveryReceipt['event'],at:string):DeliveryReceipt{
 return {event,sourceIds:[event.toLowerCase()==='authorized'?'authorization':event.toLowerCase()],at,
  eventId:'fixture-'+event,manifest:structuredClone(manifest),
  ...(['SENT','RECEIVED','READ'].includes(event)?{dispatchId:'fixture-dispatch'}:{}),
  ...(event==='AUTHORIZED'?{actorId:'fixture-decision-owner'}:{})};
}
function completed():EngagementAcceptance{
 return {assignment:'Improve a synthetic briefing delivery workflow',stakeholders:['Fixture recipient'],
  sourceReceipts:evidenceIds.map(sourceId=>({sourceId,origin:'https://example.test/evidence/'+sourceId,revisionOrDate:'2026-10-28',status:'SOURCE_INSPECTED' as const,claims:['Synthetic metadata fixture; not evidence of real delivery or impact.']})),
  domainReviews:[{discipline:'Fixture implementation review',required:true,reviewedBy:'SIMULATED_LENS'}],
  gaps:[{description:'A required briefing tool was omitted.',closureAction:'Add the tool and reconcile the package with its promise.',owner:'fixture-builder',acceptanceTest:'Required files and recipient destination match the promised package.',
   closure:{id:'fixture-gap-1',state:'VERIFIED',observationSourceIds:['observation'],
    change:{revision,actorId:'fixture-builder',at:'2026-10-20T09:00:00Z',sourceIds:['change']},
    verification:{revision,reviewerId:'fixture-independent-reviewer',at:'2026-10-20T10:00:00Z',sourceIds:['verification'],result:'PASS',method:'INDEPENDENT_CHECK',
     acceptanceTest:'Required files and recipient destination match the promised package.',downstreamCheck:'Open both delivered files and exercise the tool.',downstreamSourceIds:['downstream']},
    learning:{lesson:'A promise must be reconciled with actual package contents.',preventionAction:'Retain a missing-attachment regression check.',owner:'fixture-maintainer',reviewOn:'2026-11-15'}}}],
  artifacts:[{kind:'synthetic-brief',sourceIds:['observation'],reviewed:true,delivery:{requiredState:'RECEIVED',claimedState:'RECEIVED',mode:'DIRECT_RECIPIENTS',manifest:structuredClone(manifest),
   prepared:receipt('PREPARED','2026-10-20T10:30:00Z'),authorization:receipt('AUTHORIZED','2026-10-20T10:45:00Z'),
   sent:receipt('SENT','2026-10-20T11:00:00Z'),received:receipt('RECEIVED','2026-10-20T11:01:00Z')}}],
  outcome:{state:'MEASURED',measure:'Missing required files per synthetic package',baseline:'1 of 1',result:'0 of 1',period:'2026-10-20 through 2026-10-27',limitations:'One synthetic case; no field effect or causal inference.',baselineSourceIds:['baseline'],outcomeSourceIds:['outcome']},
  humanApproval:true,executionReceipt:true,measurementBaseline:true,outcomeReceipt:true};
}
const delivery=(input:EngagementAcceptance)=>input.artifacts[0].delivery!;
const closure=(input:EngagementAcceptance)=>input.gaps[0].closure!;

test('legacy all-true flags cannot prove completion, including an empty gap list',()=>{
 for(const noGaps of [false,true]){
  const input=completed();delete input.outcome;delete input.artifacts[0].delivery;delete input.gaps[0].closure;
  if(noGaps)input.gaps=[];
  const result=assessEngagement(input);
  assert.equal(result.readyToPropose,true);assert.equal(result.readyToExecute,true);
  assert.equal(result.measured,false);assert.notEqual(result.status,'OUTCOME_EVIDENCED');
  assert.equal(result.completion.delivery[0].observedState,'DRAFT');
  assert.match(result.completion.blockers.join(' '),/pending/);
 }
});

test('complete synthetic metadata passes, and its notice preserves the authenticity boundary',()=>{
 const result=assessEngagement(completed());
 assert.equal(result.status,'OUTCOME_EVIDENCED');assert.equal(result.completion.fixesVerified,true);
 assert.equal(result.completion.delivery[0].observedState,'RECEIVED');
 assert.equal(result.completion.delivery[0].requirementMet,true);
 assert.match(result.notice,/not receipt authenticity or whether sources support claims/);
 assert.match(result.notice,/grants no permissions, sends nothing/);
});

test('a verified fix with an owned pending outcome is useful without becoming measured impact',()=>{
 const input=completed();input.outcome={state:'PENDING',reason:'Observation period is not complete.',owner:'fixture-evaluator',reviewOn:'2026-11-15'};
 const result=assessEngagement(input);
 assert.equal(result.readyToPropose,true);assert.equal(result.readyToExecute,true);
 assert.equal(result.measured,false);assert.equal(result.completion.state,'FIX_VERIFIED_OUTCOME_PENDING');
 assert.equal(result.completion.nextReview?.owner,'fixture-evaluator');
 delete input.gaps[0].closure;delete input.artifacts[0].delivery;input.outcome.owner='';input.outcome.reviewOn='';
 const draft=assessEngagement(input);
 assert.equal(draft.readyToPropose,true);assert.equal(draft.measured,false);
 assert.match(draft.completion.blockers.join(' '),/reason, owner and next review date/);
});

test('verification must bind the changed revision, a different reviewer, chronology and downstream test',()=>{
 const changes=[
  {revision:'a'.repeat(40)}, {reviewerId:'fixture-builder'}, {reviewerId:' fixture-builder '}, {reviewerId:''},
  {at:'2026-10-20T08:59:59Z'}, {result:'FAIL' as const}, {method:'SIMULATED_LENS' as const},
  {acceptanceTest:'A different acceptance test'}, {downstreamCheck:''}, {downstreamSourceIds:[]}
 ];
 for(const change of changes){
  const input=completed();Object.assign(closure(input).verification!,change);
  const result=assessEngagement(input);
  assert.equal(result.readyToPropose,true);assert.equal(result.measured,false,JSON.stringify(change));
  assert.equal(result.completion.fixesVerified,false,JSON.stringify(change));
  assert.match(result.completion.blockers.join(' '),/Independent verification/);
 }
});

test('an implemented change remains pending until independent verification and a usable lesson exist',()=>{
 const input=completed();closure(input).state='IMPLEMENTED';
 assert.equal(assessEngagement(input).completion.improvements[0].state,'IMPLEMENTED');
 assert.equal(assessEngagement(input).measured,false);
 for(const field of ['lesson','preventionAction','owner','reviewOn'] as const){
  const missing=completed();closure(missing).learning![field]='';
  assert.equal(assessEngagement(missing).completion.fixesVerified,false,field);
 }
 for(const field of ['revision','actorId','at'] as const){
  const missing=completed();closure(missing).change![field]='';
  assert.equal(assessEngagement(missing).measured,false,field);
 }
});

test('all completion references resolve to unambiguous inspected sources',()=>{
 for(const sourceId of evidenceIds){
  const input=completed();delivery(input).read=receipt('READ','2026-10-20T11:02:00Z');delivery(input).claimedState='READ';
  input.sourceReceipts=input.sourceReceipts.filter(s=>s.sourceId!==sourceId);
  assert.equal(assessEngagement(input).measured,false,sourceId);
 }
 for(const status of ['SECONDARY_ONLY','UNVERIFIED','CONFLICTED'] as const){
  const input=completed();input.sourceReceipts.find(s=>s.sourceId==='verification')!.status=status;
  assert.equal(assessEngagement(input).completion.fixesVerified,false,status);
 }
 const duplicate=completed();duplicate.sourceReceipts.push({...duplicate.sourceReceipts.find(s=>s.sourceId==='received')!,status:'UNVERIFIED'});
 const result=assessEngagement(duplicate);
 assert.equal(result.completion.delivery[0].observedState,'SENT');assert.equal(result.measured,false);
});

test('measurement requires a baseline, definition, result, period and limits while zero remains valid',()=>{
 for(const field of ['measure','baseline','result','period','limitations'] as const){
  const input=completed();if(input.outcome!.state==='MEASURED')input.outcome![field]='';
  assert.equal(assessEngagement(input).measured,false,field);
 }
 const zero=completed();if(zero.outcome!.state==='MEASURED')zero.outcome!.result='0';
 assert.equal(assessEngagement(zero).measured,true);
});

test('stable gap and artifact identities cannot be duplicated to hide incomplete work',()=>{
 const gaps=completed();gaps.gaps.push(structuredClone(gaps.gaps[0]));
 assert.equal(assessEngagement(gaps).completion.fixesVerified,false);
 assert.match(assessEngagement(gaps).completion.blockers.join(' '),/Duplicate improvement IDs/);
 const artifacts=completed();artifacts.artifacts.push(structuredClone(artifacts.artifacts[0]));
 assert.equal(assessEngagement(artifacts).measured,false);
 assert.match(assessEngagement(artifacts).completion.blockers.join(' '),/Duplicate artifact IDs/);
});

test('preparation, sending, receipt and reading have separate matching evidence',()=>{
 const input=completed(),d=delivery(input);delete d.sent;delete d.received;
 d.claimedState='PREPARED';
 let result=assessEngagement(input).completion.delivery[0];
 assert.equal(result.observedState,'PREPARED');assert.equal(result.claimSupported,true);assert.equal(result.requirementMet,false);
 d.claimedState='READ';
 assert.equal(assessEngagement(input).completion.delivery[0].claimSupported,false);
 d.sent=receipt('SENT','2026-10-20T11:00:00Z');d.claimedState='SENT';
 result=assessEngagement(input).completion.delivery[0];
 assert.equal(result.observedState,'SENT');assert.equal(result.requirementMet,false);
 d.received=receipt('RECEIVED','2026-10-20T11:01:00Z');d.claimedState='RECEIVED';
 assert.equal(assessEngagement(input).completion.delivery[0].observedState,'RECEIVED');
 d.read=receipt('READ','2026-10-20T11:02:00Z');d.claimedState='READ';
 assert.equal(assessEngagement(input).completion.delivery[0].observedState,'READ');
});

test('recipient and reading receipts must match dispatch identity, event type and chronology',()=>{
 for(const mutation of [
  {dispatchId:'another-dispatch'}, {event:'SENT' as const}, {at:'2026-10-20T10:59:00Z'}, {eventId:''}
 ]){
  const input=completed();Object.assign(delivery(input).received!,mutation);
  assert.equal(assessEngagement(input).completion.delivery[0].observedState,'SENT',JSON.stringify(mutation));
  assert.equal(assessEngagement(input).measured,false);
 }
 const input=completed();delivery(input).read=receipt('READ','2026-10-20T11:02:00Z');delivery(input).read!.dispatchId='another-dispatch';delivery(input).claimedState='READ';
 assert.equal(assessEngagement(input).completion.delivery[0].observedState,'RECEIVED');
 assert.equal(assessEngagement(input).completion.delivery[0].claimSupported,false);
});

test('an observed send without exact-package approval remains an audit fact, never authority',()=>{
 const input=completed();delete delivery(input).authorization;
 let result=assessEngagement(input);
 assert.equal(result.completion.delivery[0].observedState,'RECEIVED');
 assert.equal(result.completion.delivery[0].authorized,false);
 assert.equal(result.completion.delivery[0].claimSupported,false);assert.equal(result.measured,false);
 delivery(input).authorization=receipt('AUTHORIZED','2026-10-20T11:03:00Z');
 assert.equal(assessEngagement(input).completion.delivery[0].authorized,false);
 delivery(input).authorization=receipt('AUTHORIZED','2026-10-20T10:45:00Z');
 delivery(input).authorization!.manifest.recipientIds=['another-recipient'];
 result=assessEngagement(input);
 assert.equal(result.completion.delivery[0].observedState,'RECEIVED');assert.equal(result.completion.delivery[0].authorized,false);
});

test('changing the version, actual destination, recipient set or attachment bytes invalidates old receipts',()=>{
 const mutations:((m:DeliveryManifest)=>void)[]=[
  m=>{m.artifactId='another-artifact'},m=>{m.version='v3'},m=>{m.packageSha256='d'.repeat(64)},
  m=>{m.destination='https://example.test/another-inbox'},m=>{m.recipientIds=['another-recipient']},
  m=>{m.attachments[0].sha256='e'.repeat(64)},m=>{m.attachments[0].filename='other.pdf'}
 ];
 for(const mutate of mutations){
  const input=completed();mutate(delivery(input).manifest);
  const result=assessEngagement(input);
  assert.equal(result.completion.delivery[0].observedState,'DRAFT');assert.equal(result.measured,false);
 }
 const duplicate=completed();delivery(duplicate).manifest.attachments.push({...delivery(duplicate).manifest.attachments[0]});
 assert.equal(assessEngagement(duplicate).completion.delivery[0].observedState,'DRAFT');
 const reordered=completed();delivery(reordered).manifest.attachments.reverse();
 assert.equal(assessEngagement(reordered).measured,true,'set ordering is not a package change');
});

test('a local prepared artifact can satisfy a preparation-only promise without claiming it was sent',()=>{
 const input=completed(),d=delivery(input);d.requiredState='PREPARED';d.claimedState='PREPARED';d.mode='SHARED_DESTINATION';
 delete d.sent;delete d.received;delete d.authorization;
 const result=assessEngagement(input);
 assert.equal(result.completion.delivery[0].observedState,'PREPARED');
 assert.equal(result.completion.delivery[0].authorized,false);assert.equal(result.completion.delivery[0].requirementMet,true);
 assert.equal(result.measured,true,'the synthetic measured outcome does not invent external delivery');
});
