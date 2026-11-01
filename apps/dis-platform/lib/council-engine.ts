import {OPERATING_CONTRACT_RECEIPT,withOperatingContract} from './operating-contract';
import type {EvidenceSource} from './evidence-integrity';
import {convene as executeCouncil,research,infer,citationAudit} from './council-runtime';
import {selectAnswerEvidence,releaseConcerns,looksLikePrivateRecord,safeBoundaryReply,ANSWER_RELEASE_RULES} from './answer-release-policy';
import {sanitizeConversation} from './conversation-context';
import {reviewAnswer} from './answer-quality';
export {research,infer,reconstruct,citationAudit,parseActionPlan} from './council-runtime';
async function conveneInternal(input:Parameters<typeof executeCouncil>[0]&{providedEvidence?:EvidenceSource[];evidenceCoverage?:string[]},deps={research,infer}){
 const history=sanitizeConversation(input.conversation);
 const base={primary:[],red:[],sources:[],retrieval:'NOT_RUN',quality:null,deliberation:undefined,actionPlan:null,callStatuses:undefined,citations:undefined,modelProvenance:undefined,limitations:'Generated drafts are not independently verified advice or completed implementation.'};
 const combined=[input.prompt,...history.map(t=>t.content)].join('\n');
 if(looksLikePrivateRecord(combined))return {...base,state:'PRIVATE_RECORD_INPUT_BLOCKED',notice:safeBoundaryReply('privacy'),error:'Remove real record content before external research.',release:{state:'WITHHELD',issues:['PRIVATE_RECORD_INPUT'],revisionCalls:0,independentlyVerified:false}};
 const original=history.find(t=>t.role==='user')?.content;
 const provided=(input.providedEvidence||[]).filter(s=>s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'&&/^E\d+$/.test(s.id)&&s.abstract&&!s.abstractTruncated);
 if(provided.some(s=>looksLikePrivateRecord(s.abstract||'')))return {...base,state:'PRIVATE_RECORD_INPUT_BLOCKED',error:'Potentially private source content withheld.',release:{state:'WITHHELD',issues:['PRIVATE_RECORD_INPUT'],revisionCalls:0,independentlyVerified:false}};
 const found=await deps.research(original?original.slice(0,150)+' '+input.prompt.slice(0,80):input.prompt);
 const sources=[...selectAnswerEvidence(found.sources,4),...provided.slice(0,12)];
 if(!sources.length)return {...base,state:'EVIDENCE_INSUFFICIENT',retrieval:found.status,notice:safeBoundaryReply('evidence'),error:'Evidence-based deliberation incomplete: no eligible selected source excerpts.',release:{state:'WITHHELD',issues:['NO_SELECTED_ABSTRACTS'],revisionCalls:0,independentlyVerified:false}};
 const coverage=JSON.stringify({kind:'SERVER_REPORTED_CAPABILITY_COVERAGE',states:(input.evidenceCoverage||[]).slice(0,16),rule:'Unavailable, denied, invalid and empty responses are gaps, not evidence of absence or zero. Do not claim comprehensive coverage.'});
 const executed=await executeCouncil(input,{research:async()=>({...found,sources}),infer:(system,prompt,model)=>deps.infer(system+'\n'+ANSWER_RELEASE_RULES,prompt+'\n'+coverage,model)});
 const result={...executed,callStatuses:executed.callStatuses?.map(x=>({ok:x.ok,error:'error' in x?x.error:undefined,model:'model' in x?x.model:undefined}))};
 const text=result.deliberation?.synthesis||'';
 if(!text)return {...result,release:{state:'INCOMPLETE',issues:[],revisionCalls:0,independentlyVerified:false}};
 const drafts=[text,result.deliberation?.primaryA,result.deliberation?.primaryB,result.deliberation?.challenge,result.actionPlan?JSON.stringify(result.actionPlan):''].filter(Boolean).join('\n');
 const issues=releaseConcerns(drafts,input.prompt,sources);
 if(!issues.length)return {...result,release:{state:'DRAFT_REVIEW_REQUIRED',issues:[],revisionCalls:0,independentlyVerified:false}};
 // One bounded repair, never an unbounded chain or an independent scientific reviewer.
 const correction=await deps.infer(ANSWER_RELEASE_RULES+'\nWrite a NEW answer from the question and sources, not a paraphrase of a discarded draft. Use four short prose paragraphs and under 220 words. Give a direct answer, evidence limits with source IDs, one actionable choice, and one useful follow-up. Do not narrate disciplinary lenses. Avoid numeric AND spelled-out prescriptions entirely. Do not specify minutes, days, weeks, sessions, budgets, doses or thresholds. State that the team should choose these. Never say no one needs ethics review or that every synthetic exercise needs it; local rules and designated decision rights must be checked. Do not set a duration, budget, threshold or dosage. Ask the owner to agree these. Do not assert any ethics or privacy exemption, invite records, or infer causal effects from before/after. Cite the actual source IDs for empirical claims. Give a useful step using existing non-sensitive process descriptions or synthetic examples.',JSON.stringify({question:input.prompt,untrustedHistory:history,sources,coverage,requiredCorrections:issues,discardedDraftOmitted:true}),process.env.AI_GATEWAY_MODEL||undefined);
 const remaining=correction.ok?releaseConcerns(correction.text,input.prompt,sources):['REVISION_FAILED'];
 if(remaining.length)return {...result,state:'ANSWER_WITHHELD',deliberation:undefined,actionPlan:null,notice:safeBoundaryReply('quality'),error:'Draft did not clear the bounded release checks.',quality:null,release:{state:'WITHHELD',issues:remaining,originalIssues:issues,revisionCalls:1,independentlyVerified:false}};
 return {...result,state:'REVISED_DRAFT_REVIEW_REQUIRED',citations:citationAudit(correction.text,sources),actionPlan:null,deliberation:{primaryA:'Superseded candidate withheld after release review.',primaryB:'Superseded candidate withheld after release review.',challenge:'Automated review is not independent scientific validation.',synthesis:correction.text},quality:reviewAnswer(correction.text,input.prompt,sources),release:{state:'DRAFT_REVIEW_REQUIRED',issues:[],originalIssues:issues,revisionCalls:1,revisionModel:correction.model||null,independentlyVerified:false}};
}

/** Bind every council strand and bounded repair to the same versioned contract. */
export async function convene(input:Parameters<typeof conveneInternal>[0],deps={research,infer}){
 let inferenceInvocationCount=0;
 const result=await conveneInternal(input,{...deps,infer:(system,prompt,model)=>{
  inferenceInvocationCount++;
  return deps.infer(withOperatingContract(system),prompt,model);
 }});
 return {...result,operatingContract:{...OPERATING_CONTRACT_RECEIPT,inferenceInvocationCount}};
}
