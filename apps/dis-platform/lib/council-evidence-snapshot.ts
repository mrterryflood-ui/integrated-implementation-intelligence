import {createHash} from 'node:crypto';
import type {EvidenceSource} from './evidence-integrity';
import {councilEvidenceBundle} from './council-source-register';
/** Bind ordinary council answers to this run's server-returned sources, never prior Investigate state. */
export function withCouncilEvidenceSnapshot<T extends {sources?:EvidenceSource[];deliberation?:{synthesis?:string}}>(report:T,question:string){
 const sources=report.sources||[];
 const intelligence=councilEvidenceBundle(question,sources);
 const sourceHash=createHash('sha256').update(JSON.stringify(sources)).digest('hex');
 return {...report,intelligence,evidenceHandoff:{state:report.deliberation?.synthesis?'USED_IN_DRAFT':'NO_RELEASED_SYNTHESIS',sourceIds:intelligence.records.map(s=>s.id),inputSourceHash:sourceHash,sourceRefresh:sources.length?'RETRIEVED_SERVER_SIDE_FOR_THIS_RUN':'NO_SOURCE_EVIDENCE_RETURNED',providedPlatformRecords:0,independentClaimVerification:false,modelWeightsChanged:false}};
}
