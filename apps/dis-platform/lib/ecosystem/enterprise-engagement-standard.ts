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
export function assessEngagement(input:EngagementAcceptance){
 const blockers:string[]=[];
 if(input.assignment.trim().length<8||!input.stakeholders.length)blockers.push('Assignment and stakeholders not established.');
 if(!input.sourceReceipts.some(r=>r.status==='SOURCE_INSPECTED'))blockers.push('Primary source not inspected.');
 if(input.sourceReceipts.some(r=>r.status==='CONFLICTED'||r.status==='MISSING'))blockers.push('Unresolved source conflict or missing evidence.');
 if(input.domainReviews.some(r=>r.required&&r.reviewedBy==='NOT_REVIEWED'))blockers.push('Required discipline has not reviewed the work.');
 if(input.gaps.some(g=>!g.closureAction||!g.owner||!g.acceptanceTest))blockers.push('Gap lacks an owner, remedy or acceptance test.');
 const known=new Set(input.sourceReceipts.filter(r=>r.status==='SOURCE_INSPECTED').map(r=>r.sourceId));
 if(!input.artifacts.length||input.artifacts.some(a=>!a.sourceIds.length||a.sourceIds.some(id=>!known.has(id))))blockers.push('Stakeholder deliverables cite missing or uninspected sources.');
 const readyToPropose=blockers.length===0;
 const readyToExecute=readyToPropose&&input.humanApproval;
 const measured=readyToExecute&&input.executionReceipt&&input.measurementBaseline&&input.outcomeReceipt;
 return {status:measured?'OUTCOME_EVIDENCED':readyToExecute?'APPROVED_FOR_BOUNDED_EXECUTION':readyToPropose?'REVIEWABLE_PROPOSAL':'EVIDENCE_OR_REVIEW_GAPS',
  blockers,readyToPropose,readyToExecute,measured,notice:'A simulated council lens is not an employed or independently contracted human expert. No action is executed by this assessment.'} as const;
}
export function missingExpertProspectus(reviews:ReviewCoverage[]){
 return reviews.filter(r=>r.required&&r.reviewedBy!=='VERIFIED_HUMAN').map(r=>({
  discipline:r.discipline,status:'HUMAN_REVIEW_NOT_VERIFIED' as const,
  procurementSteps:['Define the question and expected deliverable','Verify credentials, availability and conflicts','Agree compensation and confidentiality','Obtain human approval before outreach or contracting'],
  warning:'This is a prospectus, not a claim that an expert was contacted or hired.'
 }));
}
