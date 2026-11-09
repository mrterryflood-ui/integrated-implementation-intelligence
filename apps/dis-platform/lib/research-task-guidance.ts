import type {EvidenceGap} from "./evidence-action-bridge";
import type {WorkItem} from "./decision-playbook";

/** A bounded task points to the full gap; it never silently cuts a sentence. */
export function projectResearchGapTask(gap:EvidenceGap,hasDiscoveryLeads=false){
 const title=gap.id==="literature-not-retrieved"&&hasDiscoveryLeads
  ?"Appraise discovery leads and record source applicability"
  :"Investigate: "+gap.problem;
 return {
  sourceGapId:gap.id,
  title:title.length<=175?title:"Investigate evidence gap: "+gap.id,
  why:"Evidence gap "+gap.id+". Proposed review owner: "+gap.ownerRole+".",
  success:gap.nextEvidence.length<=790?gap.nextEvidence:"Document the evidence required by gap "+gap.id+"; retain the full requirement and any unresolved parts in the research record."
 };
}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const guidanceKeys=["title","why","success"] as const;
/** Legacy linkage is explicit text from the old generator, never a task index. */
export function taskSourceGapId(task:WorkItem):string|null{
 return task.sourceGapId||(/^Evidence gap (.+)\. Proposed review owner: /.exec(task.why||"")?.[1]??null);
}
export function researchTaskGuidance(report:unknown,task:WorkItem){
 const sourceGapId=taskSourceGapId(task);
 if(!sourceGapId||!object(report))return null;
 const research=object(report.retainedResearch)?report.retainedResearch:report;
 if(research.schemaVersion!=="dis-evidence-action-case-v1"||!Array.isArray(research.gapLedger))return null;
 const matches=research.gapLedger.filter(g=>object(g)&&g.id===sourceGapId);
 const gap=matches.length===1?matches[0]:null;
 if(!object(gap)||!["id","problem","ownerRole","nextEvidence"].every(key=>typeof gap[key]==="string"))return {sourceGapId,gap:null,current:null,changed:false};
 const hasLeads=object(research.investigation)&&Array.isArray(research.investigation.literature)&&research.investigation.literature.length>0;
 const current=projectResearchGapTask(gap as EvidenceGap,hasLeads);
 return {sourceGapId,gap:gap as EvidenceGap,current,changed:guidanceKeys.some(key=>task[key]!==current[key])};
}
/** Explicit draft operation. New guidance needs renewed completion; the previous
 * completion remains in the journal, with ownership and evidence notes retained. */
export function applyResearchTaskGuidance(task:WorkItem,report:unknown):WorkItem{
 const guidance=researchTaskGuidance(report,task);
 return guidance?.current?{...task,...guidance.current,...(guidance.changed?{done:false}:{})}:task;
}
export function researchTaskReviewNotice(report:unknown,tasks:WorkItem[]):string{
 const comparisons=tasks.map(task=>researchTaskGuidance(report,task)).filter(value=>value!==null);
 const changed=comparisons.filter(value=>value.changed).length,missing=comparisons.filter(value=>!value.current).length;
 return `Review the retained tasks against the saved research before use. ${changed} linked task(s) differ from current gap guidance; ${missing} linked task(s) have no unique current gap. Differences may reflect deliberate local adaptation. Matching wording does not establish source appraisal, completed work, clinical benefit or permission to intervene.`;
}
/** The server keeps full before/after plans; this view selects guidance changes. */
export function taskGuidanceChanges(payload:unknown){
 if(!object(payload)||!object(payload.previousPlaybook)||!object(payload.playbook)||!Array.isArray(payload.previousPlaybook.tasks)||!Array.isArray(payload.playbook.tasks))return [];
 const before=payload.previousPlaybook.tasks.filter(object),after=payload.playbook.tasks.filter(object);
 const ids=new Set([...before,...after].map(task=>String(task.id)));
 return [...ids].flatMap(id=>{
  const prior=before.find(task=>task.id===id),current=after.find(task=>task.id===id);
  if(prior&&current&&guidanceKeys.every(key=>prior[key]===current[key]))return [];
  const text=(task:Record<string,unknown>|undefined)=>task?guidanceKeys.map(key=>`${key}: ${String(task[key]??"")}`).join("\n"):"Task absent in this version";
  return [{id,before:text(prior),after:text(current)}];
 });
}
