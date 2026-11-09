import {createHash} from 'node:crypto';
import {serializeCasePlaybook,serializeCaseReport} from './case-payload-capacity';
import {normalizeReport,PLANNING_SCHEMA,PLANNING_SECTIONS,type PlanningReport} from './planning-contract';
import {WORKFLOW_FIELDS} from './research-workflow';
import type {WorkItem} from './decision-playbook';
import {researchTaskReviewNotice} from './research-task-guidance';

/** A retained planning source, never evidence of clinical benefit or authority. */
export const RESEARCH_PLANNING_SNAPSHOT_VERSION='dis.research-planning-snapshot.v1';
const RESEARCH_CASE_VERSION='dis-evidence-action-case-v1';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export const RESEARCH_PLANNING_NOTICE='This is a fixed copy of the author’s saved research case and reported progress. Its fingerprint binds the retained content; it does not independently verify sources, causal effects, clinical outcomes or permission to intervene. Later case edits do not change this copy. Submission, provider transfer and organizational approval retain their separate existing controls.';
type JsonObject=Record<string,unknown>;
export type ResearchPlanningSnapshot={
 schemaVersion:typeof RESEARCH_PLANNING_SNAPSHOT_VERSION;
 source:{caseId:string;caseVersion:number;workspaceId:string;title:string};
 question:string;report:JsonObject;playbook:JsonObject;sourceDigest:string;
 confirmedPublicAggregate:true;claimState:'RECORDED_NOT_INDEPENDENTLY_VERIFIED';
 interventionAuthorized:false;externalCommunicationAuthorized:false;
};
export class ResearchPlanningError extends Error {
 constructor(message:string,readonly status:400|409|413=400){super(message);this.name='ResearchPlanningError';}
}
function object(value:unknown):value is JsonObject{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);}
function checkedText(value:unknown,max:number,label:string){
 if(typeof value!=='string'||!value.trim()||value.length>max)throw new ResearchPlanningError('Invalid '+label);
 return value;
}
/** JSONB reorders object keys. A sorted-key digest survives an ordinary save/read. */
function canonicalJson(value:unknown,depth=0):string{
 if(depth>48)throw new ResearchPlanningError('The saved research structure exceeds the review boundary',413);
 if(value===null)return 'null';
 if(typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(item=>canonicalJson(item,depth+1)).join(',')+']';
 if(object(value))return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonicalJson(value[key],depth+1)).join(',')+'}';
 throw new ResearchPlanningError('The saved research must contain finite JSON values');
}
export function researchPlanningDigest(value:unknown){return createHash('sha256').update(canonicalJson(value)).digest('hex');}
/** Word uses XML 1.0. Escape only its presentation; never rewrite saved evidence. */
export function wordPresentationText(value:string):string{
 return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu,character=>'\\u'+character.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'));
}
export function retainedPlanningResearch(report:unknown):JsonObject{
 if(!object(report))throw new ResearchPlanningError('A saved research assessment is required');
 const research=object(report.retainedResearch)?report.retainedResearch:report;
 if(research.schemaVersion!==RESEARCH_CASE_VERSION)throw new ResearchPlanningError('This case has no supported retained research assessment');
 return research;
}
/** Called only with a case selected on the server under the actor’s case/workspace RLS. */
export function buildResearchPlanningSnapshot(row:{id:unknown;workspace_id:unknown;version:unknown;title:unknown;question:unknown;report:unknown;playbook:unknown}):ResearchPlanningSnapshot{
 if(typeof row.id!=='string'||!UUID.test(row.id)||typeof row.workspace_id!=='string'||!UUID.test(row.workspace_id)||typeof row.version!=='number'||!Number.isSafeInteger(row.version)||row.version<1)throw new ResearchPlanningError('Invalid saved case identity');
 retainedPlanningResearch(row.report);
 try{serializeCaseReport(row.report);serializeCasePlaybook(row.playbook);}catch(error){throw new ResearchPlanningError(error instanceof Error?error.message:'Invalid saved case content',(error as {status?:number})?.status===413?413:400);}
 const source={caseId:row.id,caseVersion:row.version,workspaceId:row.workspace_id,title:checkedText(row.title,150,'saved case title')};
 const contents={schemaVersion:RESEARCH_PLANNING_SNAPSHOT_VERSION,source,question:checkedText(row.question,3000,'saved case question'),report:row.report as JsonObject,playbook:row.playbook as JsonObject} as const;
 const sourceDigest=researchPlanningDigest(contents);
 const snapshot:ResearchPlanningSnapshot={...contents,sourceDigest,confirmedPublicAggregate:true,claimState:'RECORDED_NOT_INDEPENDENTLY_VERIFIED',interventionAuthorized:false,externalCommunicationAuthorized:false};
 return structuredClone(snapshot);
}
export function validateResearchPlanningSnapshot(value:unknown):ResearchPlanningSnapshot{
 if(!object(value)||value.schemaVersion!==RESEARCH_PLANNING_SNAPSHOT_VERSION||!object(value.source)||value.confirmedPublicAggregate!==true||value.claimState!=='RECORDED_NOT_INDEPENDENTLY_VERIFIED'||value.interventionAuthorized!==false||value.externalCommunicationAuthorized!==false)throw new ResearchPlanningError('Invalid retained research planning snapshot',409);
 const expected=buildResearchPlanningSnapshot({id:value.source.caseId,workspace_id:value.source.workspaceId,version:value.source.caseVersion,title:value.source.title,question:value.question,report:value.report,playbook:value.playbook});
 if(value.sourceDigest!==expected.sourceDigest||Object.keys(value).some(key=>!Object.hasOwn(expected,key))||Object.keys(value.source).some(key=>!Object.hasOwn(expected.source,key)))throw new ResearchPlanningError('The retained research planning fingerprint does not match its content',409);
 return expected;
}
function recordedText(value:unknown,depth=0):string{
 if(value===null)return 'null';
 if(typeof value!=='object')return String(value);
 const entries=Array.isArray(value)?value.map((item,index)=>[String(index+1),item] as const):Object.entries(value as JsonObject);
 if(!entries.length)return Array.isArray(value)?'[]':'{}';
 return entries.map(([key,item])=>{
  const nested=item!==null&&typeof item==='object';
  return '  '.repeat(depth)+key+(nested?':\n'+recordedText(item,depth+1):': '+String(item));
 }).join('\n');
}
export function researchPlanningSections(value:unknown):Array<{title:string;text:string}>{
 const snapshot=validateResearchPlanningSnapshot(value),research=retainedPlanningResearch(snapshot.report);
 const sections=[
  {title:'Research case provenance',text:`${RESEARCH_PLANNING_NOTICE}\nSource case: ${snapshot.source.caseId}\nSource case version: ${snapshot.source.caseVersion}\nSource title: ${snapshot.source.title}\nSource content SHA-256: ${snapshot.sourceDigest}\nContent basis: sorted-key JSON of the source identity, question, full saved report and action record. The public/aggregate confirmation is the author’s declaration.`},
  {title:'Saved research question',text:snapshot.question},
 ];
 if(object(research.workflow)){
  const workflow=research.workflow,narrative=object(workflow.narrative)?workflow.narrative:{};
  for(const [key,title] of WORKFLOW_FIELDS)sections.push({title,text:typeof narrative[key]==='string'&&narrative[key].trim()?narrative[key]:'Not supplied'});
  const fields=[['frameworks','Selected frameworks'],['searchQuery','Current evidence search question'],['retrievalQuery','Query used for the retained discovery leads'],['leads','Retained scholarly discovery leads'],['focusIds','Selected candidate mechanisms'],['studyText','Saved study measurement inputs'],['counterfactualText','Saved counterfactual inputs'],['correctionActionId','Selected correction candidate'],['correctionReceiptText','Saved correction receipt inputs'],['supplementText','Saved investigation and outcome supplement'],['publicAggregateConfirmed','Author’s public aggregate confirmation']] as const;
  for(const [key,title] of fields)sections.push({title,text:workflow[key]===undefined||workflow[key]===''?'Not supplied':recordedText(workflow[key])});
 }
 sections.push({title:'Task guidance review',text:researchTaskReviewNotice(snapshot.report,snapshot.playbook.tasks as WorkItem[])},{title:'Saved actions, measures and learning',text:recordedText(snapshot.playbook)},{title:'Full retained research snapshot (JSON)',text:JSON.stringify(snapshot,null,2)});
 return sections;
}
/** Seed the existing editable template; the complete source stays beside it. */
export function researchPlanningReport(value:ResearchPlanningSnapshot):PlanningReport{
 const snapshot=validateResearchPlanningSnapshot(value),research=retainedPlanningResearch(snapshot.report);
 const sections=Object.fromEntries(PLANNING_SECTIONS.map(([key])=>[key,'UNKNOWN'])) as PlanningReport['sections'];
 sections.question=snapshot.question;
 sections.scope=['condition','geography'].flatMap(key=>typeof research[key]==='string'?[key+': '+research[key]]:[]).join('\n')||'UNKNOWN';
 sections.evidence=`Retained case ${snapshot.source.caseId}, version ${snapshot.source.caseVersion}.\nContent fingerprint: ${snapshot.sourceDigest}.\nThe complete saved assessment, source references, research workspace and limitations are retained in the research appendix. Review original sources before adopting claims.`;
 sections.gaps='Review the complete gap ledger in the retained research appendix. Resolve ownership, missing evidence and closure criteria before adopting a plan.';
 sections.outcomes='Review the saved actions and measures in the research appendix. Recorded progress and checked verification fields are author declarations; independent outcomes remain to be established.';
 sections.implementation='Review and adapt the retained case tasks, owners, dependencies and learning notes with the organization. This private draft grants no intervention authority.';
 sections.measures='Review the complete saved measures and counterfactual workspace in the appendix; confirm denominators, timing, comparison, equity and uncertainty before execution.';
 sections.risks=RESEARCH_PLANNING_NOTICE;
 const workflow=object(research.workflow)?research.workflow:{},narrative=object(workflow.narrative)?workflow.narrative:{};
 const supplied=(...keys:string[])=>keys.flatMap(key=>typeof narrative[key]==='string'&&narrative[key].trim()?[`${WORKFLOW_FIELDS.find(([id])=>id===key)?.[1]||key}:\n${narrative[key]}`]:[]).join('\n\n');
 sections.question=supplied('problem')||sections.question;
 sections.scope=supplied('setting','population','timeZero')||sections.scope;
 sections.assets=supplied('operational')||sections.assets;
 sections.gaps=supplied('designed','operational','experienced')||sections.gaps;
 sections.outcomes=supplied('success')||sections.outcomes;
 sections.options=supplied('design','designJustification','comparison')||sections.options;
 sections.implementation=[supplied('designed','sustainment')||sections.implementation,researchTaskReviewNotice(snapshot.report,snapshot.playbook.tasks as WorkItem[])].join('\n\n');
 sections.measures=supplied('success','comparison')||sections.measures;
 sections.resources=supplied('operational','sustainment')||sections.resources;
 sections.risks=[supplied('harms'),RESEARCH_PLANNING_NOTICE].filter(Boolean).join('\n\n');
 sections.funding=supplied('funding','sustainment')||sections.funding;
 sections.pilot=supplied('design','designJustification','frameworkJustification','comparison')||sections.pilot;
 return normalizeReport({schemaVersion:PLANNING_SCHEMA,title:snapshot.source.title,sections});
}
