import {councilEngagementAssurance} from '../council-engagement-assurance';
import {createHash} from 'node:crypto';
import {convene,research,infer} from '../council-engine';
import {looksLikePrivateRecord} from '../answer-release-policy';
import type {EvidenceSource} from '../evidence-integrity';
import type {IntelligenceBundle} from '../consultation-research';
import {executeEngagement,type EngagementResult,type ExecutionContext,type RuntimeOptions} from './orchestrator';
import {planEngagement} from './planner';
import {parseEngagement,ContractError,type EngagementInput} from './contracts';
/** Only the server's scoped adapter outputs enter this handoff; browser evidence text is not accepted. */
export function councilEvidence(result:EngagementResult):EvidenceSource[]{
 let remaining=24000;
 return result.items.slice(0,12).flatMap((r,i)=>{
  const text=[r.summary,'Geography: '+r.geography,'Reference period: '+(r.referencePeriod||'not established'),'Retrieved: '+r.retrievedAt,'Evidence state: source-reported; not independently verified.'].join('\n');
  if(!text.trim()||text.length>6000||text.length>remaining)return [];
  if(looksLikePrivateRecord(text))throw new ContractError('PRIVATE_RECORD_INPUT','Possible private record content was withheld before external inference.');
  remaining-=text.length;
  return [{id:'E'+(i+1),title:r.title,url:r.url,doi:null,year:null,abstract:text,abstractTruncated:false,evidenceKind:'PLATFORM_PUBLIC_EXCERPT' as const,source:r.source,retrievedAt:r.retrievedAt,referencePeriod:r.referencePeriod,geography:r.geography,receiptHash:result.receiptHash}];
 });
}
export function validateCouncilEngagement(value:unknown,prompt:string,consent:unknown):EngagementInput{
 if(consent!==true)throw new ContractError('EVIDENCE_CONSENT_REQUIRED','Approve transfer of the public/aggregate evidence to council model providers.');
 const e=parseEngagement(value);
 if(!e.externalConsent)throw new ContractError('EVIDENCE_CONSENT_REQUIRED','External specialist retrieval requires consent.');
 if(!prompt.trim().startsWith(e.problem))throw new ContractError('STALE_ENGAGEMENT','The source engagement no longer matches the question. Refresh the capability plan.');
 const plan=planEngagement(e);if(plan.question)throw new ContractError('CONTEXT_REQUIRED',plan.question);
 return e;
}
export function sourceRegister(sources:EvidenceSource[],result:EngagementResult):IntelligenceBundle{
 return {query:result.plan.input.problem,retrievedAt:result.finishedAt,records:sources.map(s=>({id:s.id,kind:s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'TECHNICAL_REPORT':'SCHOLARLY',title:s.title,summary:s.abstract||'No source excerpt supplied',source:s.source||(s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'Owned-platform public source':'Scholarly discovery'),url:s.url,retrievedAt:s.retrievedAt||result.finishedAt,sourceStatus:'DISCOVERY_ONLY'})),errors:result.receipts.filter(r=>r.state!=='RETURNED').map(r=>r.capabilityId+': '+r.state+' — '+r.reason),coverage:Object.fromEntries(result.receipts.map(r=>[r.capabilityId,r.state])),researchStandard:'This register contains the exact bounded excerpts supplied to this council run, not independently validated claims. E identifiers are platform public/aggregate excerpts; S identifiers are scholarly abstracts. Earlier documents have their own source snapshots. No intervention or outcome is implied.'};
}
export async function runGroundedCouncil(input:Parameters<typeof convene>[0],engagement:EngagementInput,context:ExecutionContext,options:RuntimeOptions={},deps={research,infer}){
 if(!engagement.externalConsent)throw new ContractError('EVIDENCE_CONSENT_REQUIRED','Specialist retrieval consent is required.');
 const planned=planEngagement(engagement);if(planned.question)throw new ContractError('CONTEXT_REQUIRED',planned.question);
 if(looksLikePrivateRecord([input.prompt,...(input.conversation||[]).map(t=>t.content)].join('\n')))throw new ContractError('PRIVATE_RECORD_INPUT','Remove identifying record content before external retrieval or inference.');
 if(context.kind!=='AUTHENTICATED_AGGREGATE'||!context.subjectId)throw new ContractError('AUTHENTICATION_REQUIRED','Verified user identity is required.');
 const result=await executeEngagement(engagement,context,options),providedEvidence=councilEvidence(result);
 const report=await convene({...input,providedEvidence,evidenceCoverage:[...result.receipts.map(r=>r.platformId+'/'+r.capabilityId+': '+r.state),...result.items.filter((_,i)=>!providedEvidence.some(s=>s.id==='E'+(i+1))).map(s=>'SOURCE_EXCERPT_OMITTED_BY_SIZE_BUDGET: '+s.id)]},deps);
 const sources=(report.sources||[]) as EvidenceSource[];
 const register=sourceRegister(sources,result);
 const answer=report.deliberation?.synthesis||'';
 return {...report,engagementAssurance:councilEngagementAssurance(report,input.prompt),ecosystem:{...result,councilState:answer?'DRAFT_REVIEW_REQUIRED':'INCOMPLETE'},intelligence:register,evidenceHandoff:{state:answer?'USED_IN_DRAFT':'NO_RELEASED_SYNTHESIS',sourceIds:sources.map(s=>s.id),receiptHash:result.receiptHash,inputSourceHash:createHash('sha256').update(JSON.stringify(sources)).digest('hex'),sourceRefresh:'RETRIEVED_SERVER_SIDE_FOR_THIS_RUN',providedPlatformRecords:providedEvidence.length,omittedPlatformRecordIds:result.items.filter((_,i)=>!providedEvidence.some(s=>s.id==='E'+(i+1))).map(s=>s.id),independentClaimVerification:false,modelWeightsChanged:false}};
}
