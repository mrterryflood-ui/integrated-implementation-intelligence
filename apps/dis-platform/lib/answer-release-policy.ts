import {observedAnswerFailures} from './observed-answer-failures';
import {assertsApprovalExemption} from './approval-language';
import type {EvidenceSource} from './evidence-integrity';
export const ANSWER_RELEASE_RULES=`Never ask people to paste, upload, share or send patient-level data, clinical notes, student records, client records, identifiers or confidential files into this conversation or an external AI service. Calling records anonymized does not establish permission or a safe environment. Offer wholly fictitious scenarios with invented nonsensitive values, or a schema of field names with no values. A schema alone is not a test dataset and cannot be scored as completed records. Never derive a synthetic example from private records. Actual record processing requires a separately approved environment, authorized purpose, consent where applicable, access controls and an accountable reviewer BEFORE transfer; this platform has not established those approvals.
Do not declare that all wholly fictitious examples require an ethics board either; establish the actual local rules and decision owner without inventing either approval or exemption. Do not pronounce an activity exempt from ethics review, consent, policy or other approval. Do not recommend filming children or collecting private disclosures without the relevant safeguarding and permissions. Do not invent thresholds, durations, costs, staffing, approval or validated instruments. Prefer agreeing measures and timing with the people involved; label any optional example in the SAME sentence, not with a blanket disclaimer. Missing baseline does not make a directly observed measure subjective or meaningless. Before/after changes and proxy counts cannot by themselves establish causation, psychological safety or an intervention effect. A small step can be simple AND faithful to an agreed core function.
Use only supplied nonempty abstracts for empirical statements. Identify each source as [S#], distinguish its population and findings from this user's situation, and decline to infer missing findings. Make the response natural and practical; avoid a compulsory committee transcript. Finish with at most one direct question to the user. No generated answer has independent claim verification.`;
export function selectAnswerEvidence<T extends EvidenceSource>(sources:T[],limit=6):T[]{
 return sources.filter(s=>typeof s.abstract==='string'&&s.abstract.trim().length>0&&s.abstractTruncated!==true&&/^S\d+$/.test(s.id)&&/^https:\/\//.test(s.url)).slice(0,Math.max(0,Math.min(6,limit)));
}
const sensitive=/\b(patient[- ]level|clinical notes?|medical records?|patient records?|student records?|client records?|confidential (?:files?|records?)|ehr data)\b/i;
const transfer=/\b(share|upload|paste|send|feed|submit|provide|enter)\b/i;
const prohibit=/\b(?:do not|don't|never|must not|cannot|can't|avoid|should not)\s+(?:ask (?:me|people|users) to |please )?(?:share|upload|paste|send|feed|submit|provide|enter|record|film|collect)\b|\b(?:transfer|upload|sharing|processing)\b.{0,25}\b(?:not permitted|not authorized)\b/i;
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[\u2010-\u2015]/g,'-').replace(/\s+/g,' ');
export function looksLikePrivateRecord(text:string):boolean{
 return /\b(?:MRN|patient\s*ID|medical record number)\s*[:#=]\s*[\w-]{3,}/i.test(text)||(/\b(?:DOB|date of birth)\s*[:=]\s*\d/i.test(text)&&/\b(patient|diagnosis|medication|clinical)\b/i.test(text));
}
export function validationAssertion(text:string){
 return /\b(?:is|are|using|use|with|a|the)\s+(?:(?:a|the|scientifically|clinically|fully)\s+)?validated\s+(?:tool|scale|instrument|measure|score|method|protocol)/i.test(text)&&!/(?:no|not|neither|without|lacks?|does not|do not|has not|have not)\b[^.!?\n]{0,90}\bvalidated\b/i.test(text);
}
export function releaseConcerns(text:string,question:string,sources:EvidenceSource[]):string[]{
 const issues=new Set<string>(observedAnswerFailures(text,question+' '+sources.map(s=>s.abstract||'').join(' ')));const known=new Set(sources.map(s=>s.id));
 for(const id of text.match(/\bS\d+\b/g)||[])if(!known.has(id))issues.add('UNKNOWN_SOURCE_ID');
 const evidence=normalize(question+' '+sources.map(s=>s.abstract||'').join(' '));
 for(const sentence of text.split(/(?<=[.!?])\s+|\n+/u).filter(Boolean)){
  const s=normalize(sentence);
  if((sensitive.test(s)||(sensitive.test(text)&&/\b(?:send|upload|paste|feed|share)\s+(?:them|those|these)\b/.test(s)))&&transfer.test(s)&&!prohibit.test(s))issues.add('SENSITIVE_DATA_TRANSFER');
  if(assertsApprovalExemption(s))issues.add('UNVERIFIED_APPROVAL_EXEMPTION');
  if(/\b(?:video|film|record)\b/.test(s)&&/\b(child|children|youth|athlete|student|session|drill)\b/.test(s)&&/\b(child|children|youth|school|student)\b/i.test(question)&&!prohibit.test(s)&&!/\bconsent|permission|safeguard/.test(s))issues.add('RECORDING_PERMISSION');
  if(/before.?after|pre.?post/.test(s)&&/will (?:tell|show)|establish|prov(?:e|es)|caus|intervention moved/.test(s)&&!prohibit.test(s)&&!/does not|do not|not establish|not prove|alone cannot/.test(s))issues.add('CAUSAL_OVERCLAIM');
  if(/\b(?:no|without|absent|missing)\b.{0,25}\bbaseline\b/.test(s)&&/any metric is a guess|progress will be subjective|(?:metric|measure).{0,20}(?:meaningless|invalid)/.test(s))issues.add('BASELINE_FALLACY');
  if(validationAssertion(s)&&! /\bvalidated\b/.test(evidence))issues.add('VALIDATION_ASSERTION');
  if(/\b(?:count|frequency).{0,30}(?:rises|increases)\b/.test(s)&&/safety is improving|proves|demonstrates/.test(s)&&!prohibit.test(s))issues.add('PROXY_AS_OUTCOME');
  if(/identify a single funder to reduce revenue.dependency/.test(s))issues.add('DEPENDENCY_CONTRADICTION');
  const quantities=s.match(/(?:[$€£]\s*\d+(?:\.\d+)?(?:\s*-\s*[$€£]?\d+)?|[<>≥≤]?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:%|minutes?\b|hours?\b|days?\b|weeks?\b|months?\b|seconds?\b|homes?\b|insights?\b|cm\b|items?\b))/g)||[];
  for(const n of quantities)if(!evidence.includes(n.trim())&&!/\b(?:illustrative|optional example|for example|e\.g\.)\b/.test(s))issues.add('UNSUPPORTED_QUANTITY');
 }
 return [...issues];
}
export function safeBoundaryReply(kind:'privacy'|'evidence'|'quality'){
 if(kind==='privacy')return 'Please leave personal records and identifying details out of this conversation. We can still work through the decision using a synthetic example or field names with no real values. What outcome are you trying to improve?';
 if(kind==='evidence')return 'The retrieved records do not contain usable abstract evidence for a source-grounded answer. I will not infer findings from titles alone. We can clarify the decision and look for a better source without sending private records. Which part of the decision matters most?';
 return 'The draft needs closer review before I can recommend it. A useful next step is to agree on the decision, the people affected, and what you can safely observe without collecting private records. What is the most important outcome for you?';
}
