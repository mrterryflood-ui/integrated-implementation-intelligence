import {DIS_OPERATING_CONTRACT} from './generated/dis-operating-contract';

export const OPERATING_CONTRACT_RECEIPT={
 source:DIS_OPERATING_CONTRACT.sourcePath,
 version:DIS_OPERATING_CONTRACT.version,
 sha256:DIS_OPERATING_CONTRACT.sha256,
 scope:'DIS_COUNCIL_MODEL_REQUESTS',
 behaviorVerified:false,
 notice:'Loading instructions does not prove model compliance, human review, execution or outcomes.'
} as const;

/** A server-owned instruction. Source excerpts and browser text cannot replace it. */
export function withOperatingContract(system:string){
 const bound='DIS operating contract '+DIS_OPERATING_CONTRACT.sha256+'\n'+DIS_OPERATING_CONTRACT.text;
 return system.includes(bound)?system:system+'\n\n'+bound;
}
