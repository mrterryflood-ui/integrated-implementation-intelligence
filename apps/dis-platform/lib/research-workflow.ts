/** Editable research inputs travel together. No input or checkbox grants scientific authority. */
import type {IntelligenceRecord} from "./consultation-research";
import {colorectalEvidenceAction} from "./evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff,validateInvestigationSupplement,type InvestigationSupplement} from "./evidence-action-case-handoff";
import {boundDiscoveryLeads,reviewCounterfactual,reviewCrossStudyMeasurements,reviewCorrectionReceipt,type EvidenceActionReview,type CounterfactualRequest,type CorrectionReceipt} from "./evidence-action-bridge";
import {credentialFreeHttps,objectRecord,hasOnlyKeys,strictTimestamp} from "./evidence-action-input-integrity";
import {CasePayloadError,serializeCaseReport} from "./case-payload-capacity";

export const RESEARCH_WORKFLOW_VERSION="dis-research-workflow-v1" as const;
export const WORKFLOW_FIELDS=[
 ["problem","Problem and decision to support"],
 ["setting","Setting, services and geography"],
 ["population","Population, eligibility and exclusions"],
 ["timeZero","First warning sign and time-zero definition"],
 ["designed","Intended care or implementation pathway"],
 ["operational","Observed operations and available resources"],
 ["experienced","Patient, family and community experience"],
 ["design","Proposed research or implementation design"],
 ["designJustification","Why this design; alternatives and assumptions"],
 ["frameworkJustification","Roles of the selected frameworks and why they fit"],
 ["comparison","Counterfactual and competing explanations"],
 ["success","Outcome definitions, denominators, goals and timing"],
 ["harms","Harms, equity, burden and stop or review rules"],
 ["sustainment","Ownership, resources, follow-up and adaptation"],
 ["funding","Funding fit, eligibility, budget and unresolved gates"]
] as const;
export type WorkflowField=typeof WORKFLOW_FIELDS[number][0];
export type WorkflowNarrative=Record<WorkflowField,string>;
export type ResearchLead=Pick<IntelligenceRecord,"id"|"kind"|"title"|"summary"|"source"|"url"|"retrievedAt"|"sourceStatus">;
export type ResearchWorkflow={
 schemaVersion:typeof RESEARCH_WORKFLOW_VERSION;
 narrative:WorkflowNarrative;
 frameworks:("CFIR"|"RE_AIM")[];
 searchQuery:string;
 retrievalQuery:string;
 leads:ResearchLead[];
 focusIds:string[];
 studyText:string;
 counterfactualText:string;
 correctionActionId:string;
 correctionReceiptText:string;
 supplementText:string;
 publicAggregateConfirmed:boolean;
};
export type ResearchReport=ReturnType<typeof buildEvidenceActionCaseHandoff>["report"]&{
 workflow?:ResearchWorkflow;workflowBaselineGapIds?:string[];workflowBaselineNoteIds?:string[];workflowBaselineLeadIds?:string[];
};
const invalid=(message:string):never=>{throw new CasePayloadError(message,400);};
const bounded=(value:unknown,max:number)=>typeof value==="string"&&value.length<=max;
export function emptyResearchWorkflow():ResearchWorkflow{
 const narrative=Object.fromEntries(WORKFLOW_FIELDS.map(([key])=>[key,""])) as WorkflowNarrative;
 narrative.problem="What is missed before avoidable colorectal cancer progression, and which change should this setting test?";
 return {schemaVersion:RESEARCH_WORKFLOW_VERSION,narrative,frameworks:[],searchQuery:"colorectal cancer disparities screening diagnostic follow-up",retrievalQuery:"",leads:[],focusIds:[],studyText:"",counterfactualText:"",correctionActionId:"",correctionReceiptText:"",supplementText:"",publicAggregateConfirmed:false};
}
/** The metadata adapter is discovery only; omit provider-only fields deliberately. */
export function researchLeads(records:readonly IntelligenceRecord[]):ResearchLead[]{
 return records.map(({id,kind,title,summary,source,url,retrievedAt,sourceStatus})=>({id,kind,title,summary,source,url,retrievedAt,sourceStatus}));
}
export function validateResearchWorkflow(value:unknown,bridge:EvidenceActionReview,requireConfirmation=true):ResearchWorkflow{
 const x=objectRecord(value);
 if(!x||x.schemaVersion!==RESEARCH_WORKFLOW_VERSION||!hasOnlyKeys(x,["schemaVersion","narrative","frameworks","searchQuery","retrievalQuery","leads","focusIds","studyText","counterfactualText","correctionActionId","correctionReceiptText","supplementText","publicAggregateConfirmed"]))invalid("Unsupported research workflow fields or version.");
 const r=x!;const narrative=objectRecord(r.narrative);
 if(!narrative||!hasOnlyKeys(narrative,WORKFLOW_FIELDS.map(([k])=>k))||WORKFLOW_FIELDS.some(([k])=>!bounded(narrative[k],2400)))invalid("Research foundation and design fields must be bounded text.");
 if(typeof r.publicAggregateConfirmed!=="boolean"||(requireConfirmation&&r.publicAggregateConfirmed!==true))invalid("Explicit public-aggregate confirmation is required for this investigation and supplement.");
 if(!Array.isArray(r.frameworks)||r.frameworks.length>2||new Set(r.frameworks).size!==r.frameworks.length||r.frameworks.some(f=>f!=="CFIR"&&f!=="RE_AIM"))invalid("Select only supported, distinct framework identifiers.");
 for(const [key,limit] of [["searchQuery",200],["retrievalQuery",200],["studyText",25000],["counterfactualText",25000],["correctionActionId",100],["correctionReceiptText",12000],["supplementText",24000]] as const)
  if(!bounded(r[key],limit))invalid("Research editor exceeds its bounded text capacity: "+key);
 if(!Array.isArray(r.focusIds)||r.focusIds.length>bridge.hypotheses.length||new Set(r.focusIds).size!==r.focusIds.length||r.focusIds.some(id=>!bridge.hypotheses.some(h=>h.id===id)))invalid("Research focus must reference a retained candidate mechanism.");
 if(r.correctionActionId!==""&&!bridge.corrections.some(c=>c.id===r.correctionActionId))invalid("Correction must reference a retained candidate strategy.");
 if(!Array.isArray(r.leads)||r.leads.length>6)invalid("At most six bounded scholarly discovery leads can be retained.");
 if((r.leads as unknown[]).length&&(r.retrievalQuery as string).trim().length<8)invalid("Retained discovery leads require the actual retrieval query.");
 const ids=new Set<string>();
 for(const raw of r.leads as unknown[]){
  const lead=objectRecord(raw);
  if(!lead||!hasOnlyKeys(lead,["id","kind","title","summary","source","url","retrievedAt","sourceStatus"])||lead.kind!=="SCHOLARLY"||lead.sourceStatus!=="DISCOVERY_ONLY"||
   !bounded(lead.id,100)||!String(lead.id).trim()||ids.has(String(lead.id))||!bounded(lead.title,500)||!String(lead.title).trim()||!bounded(lead.summary,5000)||!bounded(lead.source,500)||!bounded(lead.url,1600)||!credentialFreeHttps(lead.url)||strictTimestamp(lead.retrievedAt)===null)
   invalid("Scholarly leads require unique IDs, bounded source metadata and discovery-only status; supplied verification is rejected.");
  ids.add(String(lead!.id));
 }
 if(JSON.stringify(r).length>80000)throw new CasePayloadError("Research inputs exceed the bounded 80,000-character workflow capacity; nothing was truncated.",413);
 return structuredClone(r) as unknown as ResearchWorkflow;
}
export function workflowSupplement(workflow:ResearchWorkflow,baseGapIds:readonly string[]):InvestigationSupplement|undefined{
 if(!workflow.supplementText.trim())return undefined;
 let value:unknown;try{value=JSON.parse(workflow.supplementText);}catch{invalid("Investigation supplement must be valid JSON before saving.");}
 const record=objectRecord(value);if(!record)invalid("Investigation supplement must be an object.");
 try{return validateInvestigationSupplement({...record,publicAggregateConfirmed:workflow.publicAggregateConfirmed},baseGapIds);}
 catch(e){return invalid(e instanceof Error?e.message:"Invalid investigation supplement.");}
}
export function buildResearchWorkflowCase(value:unknown){
 // Validate against the registered baseline before any caller-supplied metadata is used.
 const baseline=colorectalEvidenceAction();const workflow=validateResearchWorkflow(value,baseline.bridge);
 const {program,bridge}=colorectalEvidenceAction(workflow.leads);
 const handoff=buildEvidenceActionCaseHandoff(program,bridge,workflowSupplement(workflow,bridge.gaps.map(g=>g.id)));
 const report:ResearchReport={...handoff.report,workflow,workflowBaselineGapIds:bridge.gaps.map(g=>g.id),workflowBaselineNoteIds:[],workflowBaselineLeadIds:[],
  investigation:{...handoff.report.investigation,privacyStatus:"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED"},noPatientData:null};
 serializeCaseReport(report);
 return {...handoff,title:("CRC research | "+(workflow.narrative.setting.trim()||"Setting to define")).slice(0,150),question:workflow.narrative.problem.trim()||handoff.question,report};
}
export function retainedResearchReport(value:unknown):ResearchReport|null{
 const outer=objectRecord(value);const r=objectRecord(outer?.retainedResearch)||outer;
 if(!r||r.schemaVersion!=="dis-evidence-action-case-v1"||r.condition!=="colorectal"||!objectRecord(r.investigation)||!Array.isArray(r.gapLedger))return null;
 return r as unknown as ResearchReport;
}
/** Use the saved source layer; reopening never substitutes today's source snapshot. */
export function savedWorkflowBridge(report:ResearchReport,leads?:readonly ResearchLead[]):EvidenceActionReview{
 const b=colorectalEvidenceAction().bridge,i=report.investigation;
 const legacyIds=report.workflowBaselineLeadIds||(report.workflow?[]:i.literature.map(l=>l.id));
 const literature=leads?[...i.literature.filter(l=>legacyIds.includes(l.id)),...boundDiscoveryLeads(leads)]:i.literature;
 return {...b,caseId:report.caseId,measures:i.measures,links:i.links,literature,hypotheses:i.hypotheses,corrections:i.corrections,gaps:report.gapLedger};
}
export function workflowFromSavedReport(report:ResearchReport):ResearchWorkflow{
 if(report.workflow)return validateResearchWorkflow(report.workflow,savedWorkflowBridge(report),false);
 // Older cases remain readable and can acquire a workflow; their existing notes
 // stay in the original baseline rather than being silently deleted or recast.
 return emptyResearchWorkflow();
}
export function reviseResearchWorkflowReport(value:unknown,input:unknown):Record<string,unknown>{
 const prior=retainedResearchReport(value);if(!prior)invalid("This case has no supported colorectal research record to revise.");
 const source=prior!;
 if(source.causalEffectEstablished!==false||source.independentOutcomeVerified!==false||source.interventionAuthorized!==false||source.externalCommunicationAuthorized!==false)invalid("The retained research authority fields require independent reconciliation before editing.");
 const workflow=validateResearchWorkflow(input,savedWorkflowBridge(source));
 let baseIds=source.workflowBaselineGapIds||source.gapIDs;
 let baseGaps=source.gapLedger.filter(g=>baseIds.includes(g.id));
 if(baseGaps.length!==baseIds.length||new Set(baseIds).size!==baseIds.length)invalid("Retained baseline gap identities are inconsistent; nothing revised.");
 const baseLeadIds=source.workflowBaselineLeadIds||(source.workflow?[]:source.investigation.literature.map(l=>l.id));
 const baseLeads=source.investigation.literature.filter(l=>baseLeadIds.includes(l.id));
 if(baseLeads.length!==baseLeadIds.length||new Set(baseLeadIds).size!==baseLeadIds.length)invalid("Retained legacy source identities are inconsistent; nothing revised.");
 if(workflow.leads.some(l=>baseLeadIds.includes(l.id)))invalid("A discovery lead cannot replace a retained legacy source ID; use a distinct source ID.");
 const literature=[...baseLeads,...boundDiscoveryLeads(workflow.leads)];
 const declaredSupplement=workflowSupplement(workflow,baseIds);
 const discoveryGapReferenced=[...source.investigation.notes,...(declaredSupplement?.notes||[])].some(n=>n.gapIds.includes("literature-not-retrieved"));
 if(literature.length)baseGaps=discoveryGapReferenced?baseGaps.map(g=>g.id==="literature-not-retrieved"?{...g,problem:"An earlier investigation note references the discovery gap. Candidate leads are now attached; original sources and applicability still require review.",nextEvidence:"Retain this gap identity for the historical note; review the newly attached original articles and record the reconciliation."}:g):baseGaps.filter(g=>g.id!=="literature-not-retrieved");
 else if(!baseGaps.some(g=>g.id==="literature-not-retrieved"))baseGaps.push({id:"literature-not-retrieved",severity:"RESEARCH_REQUIRED",problem:"No scholarly discovery leads are attached to the current workflow.",ownerRole:"Research librarian",nextEvidence:"Retrieve candidate sources, read original articles and confirm population, outcome and design."});
 baseIds=baseGaps.map(g=>g.id);
 const supplement=workflowSupplement(workflow,baseIds),gaps=[...baseGaps,...(supplement?.additionalGaps||[])];
 const baseNoteIds=source.workflowBaselineNoteIds||(source.workflow?[]:source.investigation.notes.map(n=>n.id));
 const baseNotes=source.investigation.notes.filter(n=>baseNoteIds.includes(n.id));
 if(baseNotes.length!==baseNoteIds.length||new Set(baseNoteIds).size!==baseNoteIds.length)invalid("Retained baseline note identities are inconsistent; nothing revised.");
 if(supplement?.notes.some(n=>baseNoteIds.includes(n.id)))invalid("A supplementary note cannot replace a retained legacy note identity; use a new note ID.");
 const tasks=gaps.slice(0,28).map(g=>({title:("Investigate: "+g.problem).slice(0,175),why:("Evidence gap "+g.id+". Proposed review owner: "+g.ownerRole+".").slice(0,340),success:g.nextEvidence.slice(0,340)}));
 const next:ResearchReport={...structuredClone(source),workflow,workflowBaselineGapIds:[...baseIds],workflowBaselineNoteIds:[...baseNoteIds],workflowBaselineLeadIds:[...baseLeadIds],gapIDs:gaps.map(g=>g.id),gapLedger:gaps,
  taskProjection:{...source.taskProjection,editableCount:tasks.length,totalGapCount:gaps.length,unmaterializedGapIDs:gaps.slice(28).map(g=>g.id)},
  investigation:{...source.investigation,literature,notes:[...baseNotes,...(supplement?.notes||[])],privacyStatus:"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED"},
  actionPlan:{...source.actionPlan,tasks},noPatientData:null,
  ...(source.decisionBrief?{decisionBrief:{...source.decisionBrief,openGapIds:gaps.map(g=>g.id)}}:{})};
 // A prior council interpretation belongs to the previous inputs. The journal
 // retains it; this revision returns to the research record rather than implying
 // the old interpretation reviewed the new inputs. The current playbook is kept.
 serializeCaseReport(next);return next;
}
/** Checks are recomputed from the retained inputs, never accepted from a client. */
export function reviewResearchWorkflow(workflow:ResearchWorkflow,bridge:EvidenceActionReview,asOf:string|Date=new Date()){
 const inspect=<T>(raw:string,review:(x:unknown)=>T):{state:"EMPTY"|"CHECKED"|"INVALID";result:T|null;error:string|null}=>{
  if(!raw.trim())return {state:"EMPTY",result:null,error:null};
  try{return {state:"CHECKED",result:review(JSON.parse(raw)),error:null};}catch(e){return {state:"INVALID",result:null,error:e instanceof Error?e.message:"Invalid research input"};}
 };
 const action=bridge.corrections.find(c=>c.id===(workflow.correctionActionId||bridge.corrections[0]?.id));
 return {missingFoundation:WORKFLOW_FIELDS.filter(([key])=>!workflow.narrative[key].trim()).map(([,label])=>label),
  studies:inspect(workflow.studyText,x=>reviewCrossStudyMeasurements(x,bridge.measures)),
  counterfactual:inspect(workflow.counterfactualText,x=>reviewCounterfactual(x as CounterfactualRequest)),
  correction:inspect(workflow.correctionReceiptText,x=>{if(!action)throw Error("No retained correction strategy");return reviewCorrectionReceipt(action,x as CorrectionReceipt,asOf);}),
  independentOutcomeVerified:false,causalEffectEstablished:false,interventionAuthorized:false};
}
