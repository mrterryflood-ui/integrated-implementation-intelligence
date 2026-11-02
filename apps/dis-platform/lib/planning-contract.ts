import {createHash} from 'node:crypto';
import {PLANNING_SCHEMA,PLANNING_SECTIONS,type PlanningReport,type SectionId} from './planning-fields';
export {PLANNING_SCHEMA,PLANNING_SECTIONS,type PlanningReport,type SectionId} from './planning-fields';
export type Governance={version:number;authoritySource:string;decisionBody:string;approverSubjects:string[];quorum:number;confirmedAt:string|null};
export type Ballot={subject:string;planDigest:string;governanceVersion:number;decision:'approve'|'reject'|'abstain';recordedAt:string};
export const EMPTY_GOVERNANCE:Governance={version:1,authoritySource:'',decisionBody:'',approverSubjects:[],quorum:0,confirmedAt:null};
const keys=new Set<string>(PLANNING_SECTIONS.map(([key])=>key));
export function normalizeReport(input:unknown):PlanningReport{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('A structured report is required');const item=input as Record<string,unknown>;
 if(item.schemaVersion!==PLANNING_SCHEMA)throw Error('Unsupported template version; review the mapping before importing');
 if(typeof item.title!=='string'||item.title.trim().length<1||item.title.length>180)throw Error('Report title is required (maximum 180 characters)');
 if(!item.sections||typeof item.sections!=='object'||Array.isArray(item.sections))throw Error('Template sections are required');const incoming=item.sections as Record<string,unknown>;
 if(Object.keys(incoming).some(k=>!keys.has(k)))throw Error('Unknown section; no content was silently discarded');
 const sections=Object.fromEntries(PLANNING_SECTIONS.map(([key])=>{const value=incoming[key]??'';if(typeof value!=='string'||value.length>50000)throw Error('Invalid or oversized section: '+key);return[key,value.replace(/\r\n/g,'\n')];})) as Record<SectionId,string>;
 return{schemaVersion:PLANNING_SCHEMA,title:item.title.trim(),sections};
}
/** Explicit end markers keep headings and instructions out of the preceding answer. */
export function reportFromText(text:string):PlanningReport{
 if(text.length>850000)throw Error('Template extraction exceeds the review limit; split the report by section');
 const matches=[...text.matchAll(/\[DIS_FIELD:([a-zA-Z]+)\]|\[DIS_END\]/g)];
 if(!matches.length||matches.at(-1)?.[0]!=='[DIS_END]')throw Error('Template markers are missing; use the current editable template');
 const fields:Record<string,string>={};
 for(let i=0;i<matches.length-1;i++){
  const key=matches[i][1];if(!key)throw Error('Unexpected end marker');
  if(Object.hasOwn(fields,key))throw Error('Duplicate template section: '+key);
  if(key!=='title'&&key!=='schemaVersion'&&!keys.has(key))throw Error('Unknown template marker: '+key);
  const between=text.slice((matches[i].index??0)+matches[i][0].length,matches[i+1].index),end=between.indexOf('[DIS_END_FIELD]');
  if(end<0)throw Error('Missing end marker for '+key+'; review the original rather than silently mixing sections');
  fields[key]=between.slice(0,end).trim();
 }
 return normalizeReport({schemaVersion:fields.schemaVersion,title:fields.title,sections:Object.fromEntries(PLANNING_SECTIONS.map(([key])=>[key,fields[key]||'']))});
}
export function reportText(report:PlanningReport){const r=normalizeReport(report);return['[DIS_FIELD:schemaVersion]',r.schemaVersion,'[DIS_END_FIELD]','[DIS_FIELD:title]',r.title,'[DIS_END_FIELD]',...PLANNING_SECTIONS.flatMap(([key])=>['[DIS_FIELD:'+key+']',r.sections[key],'[DIS_END_FIELD]']),'[DIS_END]'].join('\n');}
export function planDigest(report:PlanningReport){return createHash('sha256').update(JSON.stringify(normalizeReport(report))).digest('hex');}
export function approvalStatus(g:Governance,r:PlanningReport,ballots:Ballot[]){
 const configured=Boolean(Number.isInteger(g.version)&&g.version>0&&g.confirmedAt&&Number.isFinite(Date.parse(g.confirmedAt))&&g.authoritySource.trim()&&g.decisionBody.trim()&&Number.isInteger(g.quorum)&&g.quorum>0&&g.quorum<=new Set(g.approverSubjects).size);
 if(!configured)return{state:'GOVERNANCE_REQUIRED' as const,approvals:0,reason:'The organization must confirm its decision body, authority and quorum. Portal administrators receive no default approval power.'};
 const digest=planDigest(r),latest=new Map<string,Ballot>();
 for(const b of ballots){if(!g.approverSubjects.includes(b.subject)||b.planDigest!==digest||b.governanceVersion!==g.version||!Number.isFinite(Date.parse(b.recordedAt)))continue;const prior=latest.get(b.subject);if(!prior||Date.parse(b.recordedAt)>Date.parse(prior.recordedAt))latest.set(b.subject,b);else if(Date.parse(b.recordedAt)===Date.parse(prior.recordedAt)&&b.decision!==prior.decision)latest.set(b.subject,{...b,decision:'abstain'});}
 const approvals=[...latest.values()].filter(b=>b.decision==='approve').length;return{state:approvals>=g.quorum?'APPROVED' as const:'PENDING' as const,approvals,reason:'Approval is bound to the exact proposal and organization-confirmed governance version.'};
}
export type SharedReport={id:string;revision:number;authorLabel:string;visibility:'private'|'submitted';report:PlanningReport};
export function reconciliationInput(reports:SharedReport[]){
 if(reports.length<1||reports.length>50)throw Error('Select between one and fifty submitted reports');if(new Set(reports.map(r=>r.id)).size!==reports.length)throw Error('Duplicate reports would over-count a perspective');if(reports.some(r=>r.visibility!=='submitted'))throw Error('Private drafts are not reconciliation inputs');
 return{mode:'COMPARISON_NOT_CONSENSUS',inputs:reports.map(r=>({id:r.id,revision:r.revision,authorLabel:r.authorLabel,digest:planDigest(r.report)})),sections:PLANNING_SECTIONS.map(([id,title])=>({id,title,perspectives:reports.map(r=>({reportId:r.id,revision:r.revision,text:r.report.sections[id]})),requiresDiscussion:new Set(reports.map(r=>r.report.sections[id].trim()).filter(Boolean)).size>1})),chatIncluded:false};
}
export const LOGIC_MODEL_FIELDS=['context','population','assets','needs','inputs','activities','outputs','mechanisms','nearTermOutcomes','longTermOutcomes','assumptions','externalFactors','alternatives','measures','costs','adaptations'] as const;
export function logicModelGaps(model:Partial<Record<typeof LOGIC_MODEL_FIELDS[number],string>>){return LOGIC_MODEL_FIELDS.filter(k=>!model[k]?.trim()||model[k]?.trim().toUpperCase()==='UNKNOWN');}
export function nonStateShare(grant:number,fraction=.4){if(!Number.isFinite(grant)||grant<0||!Number.isFinite(fraction)||fraction<0||fraction>=1)throw Error('Invalid grant or non-state fraction');return{totalCost:grant/(1-fraction),nonStateFunding:grant*fraction/(1-fraction)};}
