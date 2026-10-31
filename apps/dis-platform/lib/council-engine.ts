import {convene as executeCouncil,research,infer} from './council-runtime';
import {selectAnswerEvidence,releaseConcerns,looksLikePrivateRecord,safeBoundaryReply,ANSWER_RELEASE_RULES} from './answer-release-policy';
import {sanitizeConversation} from './conversation-context';
import {reviewAnswer} from './answer-quality';
export {research,infer,reconstruct,citationAudit,parseActionPlan} from './council-runtime';
export async function convene(input:Parameters<typeof executeCouncil>[0],deps={research,infer}){
 const history=sanitizeConversation(input.conversation);
 const base={primary:[],red:[],sources:[],retrieval:'NOT_RUN',quality:null,deliberation:undefined,actionPlan:null,callStatuses:undefined,citations:undefined,modelProvenance:undefined,limitations:'Generated drafts are not independently verified advice or completed implementation.'};
 const combined=[input.prompt,...history.map(t=>t.content)].join('\n');
 if(looksLikePrivateRecord(combined))return {...base,state:'PRIVATE_RECORD_INPUT_BLOCKED',notice:safeBoundaryReply('privacy'),error:'Remove real record content before external research.',release:{state:'WITHHELD',issues:['PRIVATE_RECORD_INPUT'],revisionCalls:0,independentlyVerified:false}};
 const original=history.find(t=>t.role==='user')?.content;
 const found=await deps.research(original?original.slice(0,150)+' '+input.prompt.slice(0,80):input.prompt);
 const sources=selectAnswerEvidence(found.sources);
 if(!sources.length)return {...base,state:'EVIDENCE_INSUFFICIENT',retrieval:found.status,notice:safeBoundaryReply('evidence'),error:'Evidence-based deliberation incomplete: no eligible selected abstracts.',release:{state:'WITHHELD',issues:['NO_SELECTED_ABSTRACTS'],revisionCalls:0,independentlyVerified:false}};
 const executed=await executeCouncil(input,{research:async()=>({...found,sources}),infer:(system,prompt,model)=>deps.infer(system+'\n'+ANSWER_RELEASE_RULES,prompt,model)});
 const result={...executed,callStatuses:executed.callStatuses?.map(x=>({ok:x.ok,error:'error' in x?x.error:undefined,model:'model' in x?x.model:undefined}))};
 const text=result.deliberation?.synthesis||'';
 if(!text)return {...result,release:{state:'INCOMPLETE',issues:[],revisionCalls:0,independentlyVerified:false}};
 const drafts=[text,result.deliberation?.primaryA,result.deliberation?.primaryB,result.deliberation?.challenge,result.actionPlan?JSON.stringify(result.actionPlan):''].filter(Boolean).join('\n');
 const issues=releaseConcerns(drafts,input.prompt,sources);
 if(!issues.length)return {...result,release:{state:'DRAFT_REVIEW_REQUIRED',issues:[],revisionCalls:0,independentlyVerified:false}};
 // One bounded repair, never an unbounded chain or an independent scientific reviewer.
 const correction=await deps.infer(ANSWER_RELEASE_RULES+'\nReturn only a corrected helpful answer, under 300 words. Remove the flagged risks; do not invent source support. No sensitive-record request, approval exemption, unsupported numerical target or causal claim.',JSON.stringify({question:input.prompt,untrustedHistory:history,sources,draft:text,issues}),process.env.AI_GATEWAY_MODEL||undefined);
 const remaining=correction.ok?releaseConcerns(correction.text,input.prompt,sources):['REVISION_FAILED'];
 if(remaining.length)return {...result,state:'ANSWER_WITHHELD',deliberation:undefined,actionPlan:null,notice:safeBoundaryReply('quality'),error:'Draft did not clear the bounded release checks.',quality:null,release:{state:'WITHHELD',issues:remaining,originalIssues:issues,revisionCalls:1,independentlyVerified:false}};
 return {...result,state:'REVISED_DRAFT_REVIEW_REQUIRED',actionPlan:null,deliberation:{primaryA:'Superseded candidate withheld after release review.',primaryB:'Superseded candidate withheld after release review.',challenge:'Automated review is not independent scientific validation.',synthesis:correction.text},quality:reviewAnswer(correction.text,input.prompt,sources),release:{state:'DRAFT_REVIEW_REQUIRED',issues:[],originalIssues:issues,revisionCalls:1,revisionModel:correction.model||null,independentlyVerified:false}};
}
