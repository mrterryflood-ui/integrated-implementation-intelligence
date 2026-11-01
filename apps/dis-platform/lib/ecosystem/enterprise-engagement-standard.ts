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
export type EngagementAcceptance={
 assignment:string;stakeholders:string[];sourceReceipts:EvidenceReceipt[];
 domainReviews:ReviewCoverage[];gaps:{description:string;closureAction:string;owner:string;acceptanceTest:string}[];
 artifacts:{kind:string;sourceIds:string[];reviewed:boolean}[];
 humanApproval:boolean;executionReceipt:boolean;measurementBaseline:boolean;outcomeReceipt:boolean;
};
const hasText=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
const completeReceipt=(receipt:EvidenceReceipt)=>hasText(receipt.sourceId)&&receipt.sourceId===receipt.sourceId.trim()&&
 hasText(receipt.origin)&&hasText(receipt.revisionOrDate)&&receipt.claims.length>0&&receipt.claims.every(hasText);
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
 const known=new Set(input.sourceReceipts.filter(r=>r.status==='SOURCE_INSPECTED'&&completeReceipt(r)).map(r=>r.sourceId));
 if(!input.artifacts.length||input.artifacts.some(a=>!hasText(a.kind)||!a.sourceIds.length||a.sourceIds.some(id=>!known.has(id))))blockers.push('Stakeholder deliverables cite missing or uninspected sources, or lack an artifact kind.');
 const readyToPropose=blockers.length===0;
 // A draft can be reviewable without being reviewed. Execution and outcome
 // metadata must not bypass that remaining review gate.
 const executionBlockers=[...blockers];
 if(input.humanApproval!==true)executionBlockers.push('Human approval not recorded.');
 if(input.artifacts.some(a=>a.reviewed!==true))executionBlockers.push('Stakeholder deliverables have not completed review.');
 const readyToExecute=readyToPropose&&executionBlockers.length===0;
 const measured=readyToExecute&&input.executionReceipt===true&&input.measurementBaseline===true&&input.outcomeReceipt===true;
 return {status:measured?'OUTCOME_EVIDENCED':readyToExecute?'APPROVED_FOR_BOUNDED_EXECUTION':readyToPropose?'REVIEWABLE_PROPOSAL':'EVIDENCE_OR_REVIEW_GAPS',
  blockers,executionBlockers,readyToPropose,readyToExecute,measured,notice:'A simulated council lens is not an employed or independently contracted human expert. This assessment checks supplied metadata, not receipt authenticity, and grants no permissions or execution.'} as const;
}
export function missingExpertProspectus(reviews:ReviewCoverage[]){
 return reviews.filter(r=>r.required&&(r.reviewedBy!=='VERIFIED_HUMAN'||!hasText(r.expertId))).map(r=>({
  discipline:r.discipline,status:'HUMAN_REVIEW_NOT_VERIFIED' as const,
  procurementSteps:['Define the question and expected deliverable','Verify credentials, availability and conflicts','Agree compensation and confidentiality','Obtain human approval before outreach or contracting'],
  warning:'This is a prospectus, not a claim that an expert was contacted or hired.'
 }));
}
