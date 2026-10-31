import {validationAssertion} from './answer-release-policy';
import type {EvidenceSource} from './evidence-integrity';
/** Heuristics locate review work; their absence NEVER certifies scientific truth. */
export const LESSONS:Record<string,string>={
 UNTRACEABLE_CITATION:'Use only supplied source IDs and explain the supporting passage; leave unsupported claims unverified.',
 UNSUPPORTED_NUMBER:'Do not invent a percentage, target or timetable. Ask the decision owner to agree it or explicitly mark it illustrative.',
 VALIDATION_OVERCLAIM:'A study using a measure does not validate it in this setting. State the limitation and require qualified appraisal.',
 LEGAL_DATE_REVIEW:'Do not infer a law date or requirement from article metadata. Request the primary legal source and jurisdiction.',
 AUTHORITY_MISMATCH:'Keep actions within the stated individual role. Separate a step the person controls from a request to an authorized institution.',
 ROBOTIC_STRUCTURE:'Replace the committee transcript with a direct, humane answer and a practical next step; do not narrate every lens.',
 TOO_MANY_QUESTIONS:'Ask one important question, not an interview checklist, after giving immediately useful help.',
 MISSING_MEASUREMENT:'Explain how to observe progress and burden without fabricating a baseline or causal effect.',
 MISSING_AGENCY:'Make ownership and consent clear without claiming somebody has agreed.',
 LENGTH_REVIEW:'Be concise enough to use; prioritize the answer, evidence caveat and next step.'
};
export function reviewAnswer(text:string,question:string,sources:EvidenceSource[]){
 const issues:string[]=[];
 const cited=[...new Set((text.match(/\[[SE]\d+\]/g)||[]).map(s=>s.slice(1,-1)))];
 const evidence=question+' '+sources.map(s=>s.abstract||'').join(' ');
 if(cited.some(id=>!sources.some(s=>s.id===id)))issues.push('UNTRACEABLE_CITATION');
 const numbers=[...new Set(text.match(/\b\d+(?:\.\d+)?\s*(?:%|weeks?\b|months?\b|days?\b)/gi)||[])];
 if(numbers.some(n=>!evidence.toLowerCase().includes(n.toLowerCase()))&&!/illustrative|example only|proposed.*(?:agree|approval)/i.test(text))issues.push('UNSUPPORTED_NUMBER');
 if(text.split(/(?<=[.!?])\s+|\n+/u).some(sentence=>validationAssertion(sentence))&&!/\bvalidated\b/i.test(evidence))issues.push('VALIDATION_OVERCLAIM');
 if(/\b(?:Act|statute|regulation)\s*(?:\(|of\s+)?(?:19|20)\d{2}/.test(text))issues.push('LEGAL_DATE_REVIEW');
 if(/\b(individual|parent|resident|family member)\b/i.test(question)&&/you (?:must|should|can) (?:mandate|enforce|legislate|set tariffs|change municipal)/i.test(text))issues.push('AUTHORITY_MISMATCH');
 if((text.match(/^#{1,4}\s/gm)||[]).length>5||(text.match(/(?:Geodesy|Geopolitics|Mathematics|Health) (?:Lens|View)/gi)||[]).length>2)issues.push('ROBOTIC_STRUCTURE');
 const directed=text.split(/(?<=[.!?])\s+|\n+/u).filter(s=>/\?/.test(s)&&/\b(?:you|your|would it|could we|shall we)\b/i.test(s));
 if(directed.length>1)issues.push('TOO_MANY_QUESTIONS');
 if(!/measure|baseline|track|record|observe|monitor|compare|progress/i.test(text))issues.push('MISSING_MEASUREMENT');
 if(!/you|owner|responsib|agree|consent|approve|permission/i.test(text))issues.push('MISSING_AGENCY');
 const wordCount=text.trim()?text.trim().split(/\s+/u).length:0;
 if(wordCount>500)issues.push('LENGTH_REVIEW');
 return {status:'REVIEW_REQUIRED' as const,method:'HEURISTIC_REVIEW_TRIAGE_NOT_CLAIM_VALIDATION',issues,wordCount,citedIds:cited,independentClaimVerification:false,nextCycleLessons:issues.map(id=>LESSONS[id])};
}
export function learningRecord(cycle:number,reviews:ReturnType<typeof reviewAnswer>[],prior:string[]=[]){
 const issues=[...new Set(reviews.flatMap(r=>r.issues))];
 return {cycle,observedAt:new Date().toISOString(),outputsReviewed:reviews.length,issueCounts:Object.fromEntries(issues.map(id=>[id,reviews.filter(r=>r.issues.includes(id)).length])),lessonsForNextCycle:[...new Set([...prior,...issues.map(id=>LESSONS[id])])],status:'CANDIDATE_LEARNING_NOT_APPROVED',modelWeightsChanged:false,knowledgePromoted:false};
}
