import {assessEngagement,missingExpertProspectus,type EngagementAcceptance} from './ecosystem/enterprise-engagement-standard';
import type {EvidenceSource} from './evidence-integrity';
import {MEMBERS} from './council';
import {OPERATING_CONTRACT_RECEIPT} from './operating-contract';

type CouncilReport={
 sources?:EvidenceSource[];
 primary?:{id:string;name:string}[];
 red?:{id:string;name:string}[];
 deliberation?:{synthesis?:string};
 operatingContract?:typeof OPERATING_CONTRACT_RECEIPT&{inferenceInvocationCount:number};
};

/** Assess only this server run. Discovery excerpts cannot become inspected primary evidence. */
export function councilEngagementAssurance(report:CouncilReport,question:string){
 const sources=report.sources||[];
 const synthesis=report.deliberation?.synthesis||'';
 const citations=[...new Set((synthesis.match(/\b[SE]\d+\b/g)||[]))];
 const members=[...(report.primary||[]),...(report.red||[])];
 const domainReviews:EngagementAcceptance['domainReviews']=members.map(m=>({
  discipline:MEMBERS.find(x=>x.id===m.id)?.domain||m.name,
  required:true,
  reviewedBy:synthesis?'SIMULATED_LENS':'NOT_REVIEWED'
 }));
 const acceptance:EngagementAcceptance={
  assignment:question,
  // This is the audience for the generated draft, not verified stakeholder participation.
  stakeholders:['Requester reviewing this preliminary council draft'],
  sourceReceipts:sources.map(s=>({
   sourceId:s.id,origin:s.url,revisionOrDate:s.retrievedAt||String(s.year||'Date not established'),
   status:s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'UNVERIFIED':'SECONDARY_ONLY',
   claims:s.abstract?.trim()?[s.abstract]:[]
  })),
  domainReviews,
  gaps:[{description:'Primary-source claim support and local applicability are not independently reviewed.',
   closureAction:'Inspect original passages, resolve conflicts and obtain the relevant stakeholder and domain review.',
   owner:'Human decision owner; named reviewer to be assigned',
   acceptanceTest:'Every material claim resolves to an inspected source and the stated local decision.'}],
  artifacts:synthesis?[{kind:'council-synthesis',sourceIds:citations,reviewed:false}]:[],
  humanApproval:false,executionReceipt:false,measurementBaseline:false,outcomeReceipt:false
 };
 return {...assessEngagement(acceptance),
  sourceCount:sources.length,sourceReview:'DISCOVERY_EXCERPTS_ONLY' as const,
  operatingContract:report.operatingContract||null,
  expertProspectus:missingExpertProspectus(domainReviews),
  nextAction:'Inspect the original sources with the decision owner, resolve the evidence gaps, then review the proposed action and measures.',
  limits:'This draft does not establish full-text verification, actual human expertise, permission to act or measured impact.'
 };
}

export type CouncilEngagementAssurance=ReturnType<typeof councilEngagementAssurance>;
