import {investigate,type IntelligenceBundle} from './consultation-research';
import {research as scholarlyResearch} from './council-runtime';
import {needsTexasWorkforce,texasWorkforceEvidence} from './texas-workforce';
import type {Intake} from './consultation';
import type {EvidenceSource} from './evidence-integrity';
/** Extends existing public discovery; does not replace it with owned-product recommendations. */
export async function integratedInvestigation(intake:Intake,fetcher:typeof fetch=fetch):Promise<IntelligenceBundle&{sourceReceipts:unknown[]}>{
 const text=[intake.mission,intake.audience,intake.geography,intake.desiredOutcome].join(' ');
 const [base,texas]=await Promise.all([investigate(intake,fetcher),needsTexasWorkforce(text)?texasWorkforceEvidence(fetcher):Promise.resolve(null)]);
 if(!texas)return{...base,sourceReceipts:[]};
 return{...base,records:[...base.records,...texas.records],errors:[...base.errors,...texas.errors],coverage:{...base.coverage,texasWorkforce:texas.records.length?'PRIMARY_SOURCE_PASSAGES_APPLICANT_UNVERIFIED':'UNAVAILABLE'},sourceReceipts:texas.receipts,researchStandard:base.researchStandard+' '+texas.notice};
}
/** Council uses freshly retrieved external sources, not browser assertions or a catalog label. */
export async function integratedCouncilResearch(query:string,fetcher:typeof fetch=fetch):Promise<{sources:EvidenceSource[];status:string;error?:string}>{
 const [scholarly,texas]=await Promise.all([scholarlyResearch(query,fetcher),needsTexasWorkforce(query)?texasWorkforceEvidence(fetcher):Promise.resolve(null)]);
 if(!texas)return scholarly;
 const publicSources:EvidenceSource[]=texas.records.map((r,i)=>({id:'E'+(701+i),title:r.title,doi:null,url:r.url,year:null,abstract:r.summary,abstractTruncated:false,evidenceKind:'PRIMARY_PUBLIC_DOCUMENT',source:r.source,retrievedAt:r.retrievedAt,geography:'Texas; applicant and local program fit remain unverified',receiptHash:texas.receipts.find(s=>s.id===r.id)?.sha256}));
 return{sources:[...publicSources,...scholarly.sources],status:publicSources.length?'PRIMARY_PUBLIC_DOCUMENTS_AND_SCHOLARLY_DISCOVERY':scholarly.status,error:[scholarly.error,...texas.errors].filter(Boolean).join('; ')||undefined};
}
