/**
 * Enterprise-wide stakeholder engagement standard.
 * Domain-agnostic: no single platform, sector, or model may bypass the evidence gates.
 * Planning metadata only; this module never grants permissions or executes an action.
 */
export const ENGAGEMENT_PHASES=[
 'identify-assignment','inspect-primary-sources','map-known-unknown',
 'investigate-gaps','assemble-disciplinary-review','challenge-options',
 'design-with-stakeholders','prepare-deliverables','approve-execution',
 'implement','measure-fidelity-outcomes','learn-and-reassess'
] as const;
export type Phase=typeof ENGAGEMENT_PHASES[number];
export type EvidenceStatus='SOURCE_INSPECTED'|'SECONDARY_ONLY'|'UNVERIFIED'|'CONFLICTED'|'MISSING';
export type EvidenceReceipt={sourceId:string;origin:string;revisionOrDate:string;status:EvidenceStatus;claims:string[]};
export type ReviewCoverage={discipline:string;required:boolean;reviewedBy:'SIMULATED_LENS'|'VERIFIED_HUMAN'|'NOT_REVIEWED';expertId?:string};
/** Receipt references resolve against the inspected register; they are not authenticated here. */
export type ImprovementClosure={
 id:string;state:'PLANNED'|'IMPLEMENTED'|'VERIFIED';observationSourceIds:string[];
 change?:{revision:string;actorId:string;at:string;sourceIds:string[]};
 verification?:{revision:string;reviewerId:string;at:string;sourceIds:string[];result:'PASS'|'FAIL';method:'INDEPENDENT_CHECK'|'SIMULATED_LENS';acceptanceTest:string;downstreamCheck:string;downstreamSourceIds:string[]};
 learning?:{lesson:string;preventionAction:string;owner:string;reviewOn:string};
};
export type OutcomeEvidence=
 | {state:'PENDING';reason:string;owner:string;reviewOn:string}
 | {state:'MEASURED';measure:string;baseline:string;result:string;period:string;limitations:string;baselineSourceIds:string[];outcomeSourceIds:string[]};
export type DeliveryState='DRAFT'|'PREPARED'|'SENT'|'RECEIVED'|'READ';
export type DeliveryManifest={
 artifactId:string;version:string;packageSha256:string;destination:string;
 recipientIds:string[];attachments:{filename:string;sha256:string}[];
};
export type DeliveryReceipt={
 event:'PREPARED'|'AUTHORIZED'|'SENT'|'RECEIVED'|'READ';
 sourceIds:string[];at:string;eventId:string;manifest:DeliveryManifest;
 /** One dispatch identity joins sending, recipient receipt and explicit reading. */
 dispatchId?:string;actorId?:string;
};
export type ArtifactDelivery={
 requiredState:Exclude<DeliveryState,'DRAFT'>;claimedState:DeliveryState;
 mode:'DIRECT_RECIPIENTS'|'SHARED_DESTINATION';manifest:DeliveryManifest;
 prepared?:DeliveryReceipt;authorization?:DeliveryReceipt;sent?:DeliveryReceipt;received?:DeliveryReceipt;read?:DeliveryReceipt;
};
export type EngagementAcceptance={
 assignment:string;stakeholders:string[];sourceReceipts:EvidenceReceipt[];domainReviews:ReviewCoverage[];
 gaps:{description:string;closureAction:string;owner:string;acceptanceTest:string;closure?:ImprovementClosure}[];
 artifacts:{kind:string;sourceIds:string[];reviewed:boolean;delivery?:ArtifactDelivery}[];
 outcome?:OutcomeEvidence;
 /** Legacy flags remain readable, but cannot establish measured outcomes alone. */
 humanApproval:boolean;executionReceipt:boolean;measurementBaseline:boolean;outcomeReceipt:boolean;
};
const hasText=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
const completeReceipt=(receipt:EvidenceReceipt)=>hasText(receipt.sourceId)&&receipt.sourceId===receipt.sourceId.trim()&&
 hasText(receipt.origin)&&hasText(receipt.revisionOrDate)&&receipt.claims.length>0&&receipt.claims.every(hasText);
const canonical=(value:unknown):value is string=>hasText(value)&&value===value.trim();
const timestamp=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
const reviewDate=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)&&Number.isFinite(Date.parse(value));
const DELIVERY_STATES:DeliveryState[]=['DRAFT','PREPARED','SENT','RECEIVED','READ'];
const sha256=(value:unknown)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const inspectedReferences=(ids:string[]|undefined,known:Set<string>)=>Array.isArray(ids)&&ids.length>0&&ids.every(id=>known.has(id));

function assessClosure(gap:EngagementAcceptance['gaps'][number],known:Set<string>){
 const c=gap.closure,pending:string[]=[],blockers:string[]=[];
 if(!c)return {id:null,state:'PLANNED' as const,verified:false,pending:['Record the observed gap, exact change, independent check and recurrence prevention.'],blockers};
 if(!canonical(c.id)||!['PLANNED','IMPLEMENTED','VERIFIED'].includes(c.state))blockers.push('Improvement identity or state is invalid.');
 if(!inspectedReferences(c.observationSourceIds,known))blockers.push('Observed gap lacks inspected evidence.');
 const change=c.change;
 const changed=Boolean(change&&canonical(change.revision)&&canonical(change.actorId)&&timestamp(change.at)&&inspectedReferences(change.sourceIds,known));
 if(c.state!=='PLANNED'&&!changed)blockers.push('Implemented change lacks an exact revision, actor, timestamp or inspected receipt.');
 if(c.state==='PLANNED')pending.push('Remediation has not been implemented and independently checked.');
 const v=c.verification;
 const independentlyChecked=Boolean(changed&&v&&v.result==='PASS'&&v.method==='INDEPENDENT_CHECK'&&
  canonical(v.reviewerId)&&v.reviewerId!==change!.actorId&&v.revision===change!.revision&&
  timestamp(v.at)&&Date.parse(v.at)>=Date.parse(change!.at)&&inspectedReferences(v.sourceIds,known)&&
  v.acceptanceTest===gap.acceptanceTest&&hasText(v.downstreamCheck)&&inspectedReferences(v.downstreamSourceIds,known));
 if(c.state==='VERIFIED'&&!independentlyChecked)blockers.push('Independent verification must pass after the change, match its exact revision and acceptance test, identify a different reviewer and check the affected downstream result.');
 if(c.state==='IMPLEMENTED')pending.push('Independent post-change verification is pending.');
 const learning=c.learning;
 const learned=Boolean(learning&&[learning.lesson,learning.preventionAction,learning.owner].every(hasText)&&reviewDate(learning.reviewOn));
 if(c.state==='VERIFIED'&&!learned)blockers.push('Verified improvement lacks a lesson, recurrence-prevention action, owner or next review date.');
 const verified=c.state==='VERIFIED'&&independentlyChecked&&learned&&blockers.length===0;
 return {id:c.id,state:verified?'FIX_VERIFIED' as const:blockers.length?'UNVERIFIED_CLAIM' as const:c.state,verified,pending,blockers};
}

function manifestKey(manifest:DeliveryManifest){
 return JSON.stringify([manifest.artifactId,manifest.version,manifest.packageSha256,manifest.destination,
  [...manifest.recipientIds].sort(),manifest.attachments.map(a=>[a.filename,a.sha256]).sort((a,b)=>a[0].localeCompare(b[0]))]);
}
function completeManifest(m:DeliveryManifest|undefined,mode:ArtifactDelivery['mode']){
 return Boolean(m&&[m.artifactId,m.version,m.destination].every(canonical)&&sha256(m.packageSha256)&&
  Array.isArray(m.recipientIds)&&m.recipientIds.every(canonical)&&new Set(m.recipientIds).size===m.recipientIds.length&&
  (mode==='SHARED_DESTINATION'||mode==='DIRECT_RECIPIENTS'&&m.recipientIds.length>0)&&
  Array.isArray(m.attachments)&&m.attachments.every(a=>canonical(a.filename)&&sha256(a.sha256))&&
  new Set(m.attachments.map(a=>a.filename)).size===m.attachments.length);
}
function assessDelivery(artifact:EngagementAcceptance['artifacts'][number],known:Set<string>){
 const d=artifact.delivery,blockers:string[]=[],pending:string[]=[];
 if(!d)return {kind:artifact.kind,observedState:'DRAFT' as DeliveryState,claimedState:'DRAFT' as DeliveryState,authorized:false,requirementMet:false,claimSupported:true,blockers,pending:['Delivery manifest and preparation receipt are pending.']};
 const manifestValid=completeManifest(d.manifest,d.mode);
 if(!manifestValid)blockers.push('Delivery manifest lacks an exact artifact/version/package hash, destination, recipient set or unambiguous attachment hashes.');
 if(!DELIVERY_STATES.includes(d.claimedState)||!DELIVERY_STATES.slice(1).includes(d.requiredState))blockers.push('Delivery state or promised destination state is invalid.');
 const receiptMatches=(receipt:DeliveryReceipt|undefined,event:DeliveryReceipt['event'])=>Boolean(manifestValid&&receipt&&receipt.event===event&&
  timestamp(receipt.at)&&canonical(receipt.eventId)&&inspectedReferences(receipt.sourceIds,known)&&completeManifest(receipt.manifest,d.mode)&&
  manifestKey(receipt.manifest)===manifestKey(d.manifest));
 const prepared=receiptMatches(d.prepared,'PREPARED');
 const sent=receiptMatches(d.sent,'SENT')&&canonical(d.sent?.dispatchId);
 const received=sent&&receiptMatches(d.received,'RECEIVED')&&d.received!.dispatchId===d.sent!.dispatchId&&Date.parse(d.received!.at)>=Date.parse(d.sent!.at);
 const read=received&&receiptMatches(d.read,'READ')&&d.read!.dispatchId===d.sent!.dispatchId&&Date.parse(d.read!.at)>=Date.parse(d.received!.at);
 // Preserve an observed unauthorized send as an audit fact; it never becomes permission.
 const observedState:DeliveryState=read?'READ':received?'RECEIVED':sent?'SENT':prepared?'PREPARED':'DRAFT';
 const authorized=Boolean(receiptMatches(d.authorization,'AUTHORIZED')&&canonical(d.authorization?.actorId)&&
  (!sent||Date.parse(d.authorization!.at)<=Date.parse(d.sent!.at)));
 const packageChecked=prepared&&(!sent||Date.parse(d.prepared!.at)<=Date.parse(d.sent!.at));
 if(!prepared)pending.push('Exact-package preparation receipt is pending.');
 if(!sent)pending.push('Sending is not evidenced.');
 if(!received)pending.push('Recipient receipt is not evidenced.');
 if(!read)pending.push('Reading is not evidenced.');
 if(DELIVERY_STATES.indexOf(d.claimedState)>DELIVERY_STATES.indexOf(observedState))blockers.push('Claimed delivery state exceeds matching inspected receipts; prepared, sent, received and read are distinct.');
 if(DELIVERY_STATES.indexOf(d.claimedState)>=1&&!packageChecked)blockers.push('Claimed delivery lacks preparation evidence for the exact package before dispatch.');
 if((sent||DELIVERY_STATES.indexOf(d.claimedState)>=2)&&(!authorized||artifact.reviewed!==true))blockers.push('Dispatch lacks exact-package explicit authorization or completed artifact review.');
 const claimSupported=blockers.length===0;
 const requirementMet=claimSupported&&packageChecked&&DELIVERY_STATES.indexOf(observedState)>=DELIVERY_STATES.indexOf(d.requiredState)&&
  (d.requiredState==='PREPARED'||authorized&&artifact.reviewed===true);
 return {kind:artifact.kind,observedState,claimedState:d.claimedState,authorized,requirementMet,claimSupported,blockers,pending};
}
export function assessEngagement(input:EngagementAcceptance){
 const blockers:string[]=[];
 if(input.assignment.trim().length<8||!input.stakeholders.length||!input.stakeholders.every(hasText))blockers.push('Assignment and stakeholders not established.');
 if(input.sourceReceipts.some(r=>!completeReceipt(r)))blockers.push('Source receipt lacks a canonical ID, origin, revision or supported claim.');
 const sourceIds=input.sourceReceipts.map(r=>r.sourceId.trim());
 if(new Set(sourceIds).size!==sourceIds.length)blockers.push('Duplicate source IDs make evidence traceability ambiguous.');
 if(!input.sourceReceipts.some(r=>r.status==='SOURCE_INSPECTED'&&completeReceipt(r)))blockers.push('Primary source not inspected.');
 if(input.sourceReceipts.some(r=>r.status==='CONFLICTED'||r.status==='MISSING'))blockers.push('Unresolved source conflict or missing evidence.');
 if(!input.domainReviews.some(r=>r.required===true)||input.domainReviews.some(r=>r.required&&(!hasText(r.discipline)||!['SIMULATED_LENS','VERIFIED_HUMAN'].includes(r.reviewedBy))))blockers.push('Required discipline has not reviewed the work.');
 if(input.domainReviews.some(r=>r.reviewedBy==='VERIFIED_HUMAN'&&!hasText(r.expertId)))blockers.push('Claimed human review lacks a reviewer identity.');
 if(input.gaps.some(g=>![g.description,g.closureAction,g.owner,g.acceptanceTest].every(hasText)))blockers.push('Gap lacks a description, owner, remedy or acceptance test.');
 const known=new Set(input.sourceReceipts.filter(r=>r.status==='SOURCE_INSPECTED'&&completeReceipt(r)&&sourceIds.indexOf(r.sourceId)===sourceIds.lastIndexOf(r.sourceId)).map(r=>r.sourceId));
 if(!input.artifacts.length||input.artifacts.some(a=>!hasText(a.kind)||!a.sourceIds.length||a.sourceIds.some(id=>!known.has(id))))blockers.push('Stakeholder deliverables cite missing or uninspected sources, or lack an artifact kind.');
 const readyToPropose=blockers.length===0;
 // A draft can be reviewable without being reviewed. Execution and outcome
 // metadata must not bypass that remaining review gate.
 const executionBlockers=[...blockers];
 if(input.humanApproval!==true)executionBlockers.push('Human approval not recorded.');
 if(input.artifacts.some(a=>a.reviewed!==true))executionBlockers.push('Stakeholder deliverables have not completed review.');
 const readyToExecute=readyToPropose&&executionBlockers.length===0;
 const improvements=input.gaps.map(g=>assessClosure(g,known));
 const improvementIds=improvements.map(x=>x.id).filter((id):id is string=>id!==null);
 const uniqueImprovements=new Set(improvementIds).size===improvementIds.length;
 const delivery=input.artifacts.map(a=>assessDelivery(a,known));
 const completionBlockers=[...improvements.flatMap(x=>x.blockers),...delivery.flatMap(x=>x.blockers)];
 if(!uniqueImprovements)completionBlockers.push('Duplicate improvement IDs make closure evidence ambiguous.');
 const artifactIds=input.artifacts.flatMap(a=>a.delivery?[a.delivery.manifest?.artifactId]:[]);
 if(new Set(artifactIds).size!==artifactIds.length)completionBlockers.push('Duplicate artifact IDs make delivery evidence ambiguous.');
 if(improvements.some(x=>!x.verified))completionBlockers.push('Observed gaps still require independently verified remediation and recurrence prevention.');
 if(delivery.some(x=>!x.requirementMet))completionBlockers.push('Promised artifact preparation or delivery remains pending.');
 if(input.executionReceipt!==true)completionBlockers.push('Implementation execution receipt is not recorded.');
 const outcome=input.outcome;
 const outcomeEvidenced=outcome?.state==='MEASURED'&&
  [outcome.measure,outcome.baseline,outcome.result,outcome.period,outcome.limitations].every(hasText)&&
  inspectedReferences(outcome.baselineSourceIds,known)&&inspectedReferences(outcome.outcomeSourceIds,known);
 if(!outcomeEvidenced)completionBlockers.push(outcome?.state==='MEASURED'?
  'Measured outcome lacks a baseline, measure, result, period, limits or inspected evidence.':
  'Outcome measurement is pending; technical verification is not measured impact.');
 const pendingOutcome=outcome?.state==='PENDING'&&[outcome.reason,outcome.owner].every(hasText)&&reviewDate(outcome.reviewOn);
 if(!outcomeEvidenced&&!pendingOutcome)completionBlockers.push('Pending measurement needs a reason, owner and next review date.');
 if(outcomeEvidenced&&(input.measurementBaseline!==true||input.outcomeReceipt!==true))completionBlockers.push('Baseline and outcome receipt assertions are not both recorded.');
 const fixesVerified=improvements.length>0&&uniqueImprovements&&improvements.every(x=>x.verified);
 const measured=readyToExecute&&input.executionReceipt===true&&input.measurementBaseline===true&&input.outcomeReceipt===true&&completionBlockers.length===0;
 const completion={state:measured?'OUTCOME_MEASURED' as const:fixesVerified&&!outcomeEvidenced?'FIX_VERIFIED_OUTCOME_PENDING' as const:
  outcomeEvidenced&&delivery.some(x=>!x.requirementMet)?'DELIVERY_PENDING' as const:'VERIFICATION_PENDING' as const,
  fixesVerified,improvements,delivery,blockers:[...new Set(completionBlockers)],
  outcomeState:outcomeEvidenced?'MEASURED' as const:'PENDING' as const,
  nextReview:pendingOutcome?{reason:outcome.reason,owner:outcome.owner,reviewOn:outcome.reviewOn}:null};
 return {status:measured?'OUTCOME_EVIDENCED':readyToExecute?'APPROVED_FOR_BOUNDED_EXECUTION':readyToPropose?'REVIEWABLE_PROPOSAL':'EVIDENCE_OR_REVIEW_GAPS',
  blockers,executionBlockers,readyToPropose,readyToExecute,measured,completion,notice:'A simulated council lens is not an employed or independently contracted human expert. This assessment checks supplied metadata and reference consistency, not receipt authenticity or whether sources support claims. It grants no permissions, sends nothing, and does not infer receipt or reading from dispatch.'} as const;
}
export function missingExpertProspectus(reviews:ReviewCoverage[]){
 return reviews.filter(r=>r.required&&(r.reviewedBy!=='VERIFIED_HUMAN'||!hasText(r.expertId))).map(r=>({
  discipline:r.discipline,status:'HUMAN_REVIEW_NOT_VERIFIED' as const,
  procurementSteps:['Define the question and expected deliverable','Verify credentials, availability and conflicts','Agree compensation and confidentiality','Obtain human approval before outreach or contracting'],
  warning:'This is a prospectus, not a claim that an expert was contacted or hired.'
 }));
}
