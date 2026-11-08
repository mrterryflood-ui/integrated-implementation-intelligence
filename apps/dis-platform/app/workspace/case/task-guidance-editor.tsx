"use client";
import type {WorkItem} from "../../../lib/decision-playbook";
import {applyResearchTaskGuidance,researchTaskGuidance,taskSourceGapId} from "../../../lib/research-task-guidance";

export default function TaskGuidanceEditor({task,index,report,disabled,onChange}:{task:WorkItem;index:number;report:unknown;disabled:boolean;onChange:(patch:Partial<WorkItem>)=>void}){
 const guidance=researchTaskGuidance(report,task);
 const edit=(patch:Partial<WorkItem>)=>onChange({...patch,...(taskSourceGapId(task)?{sourceGapId:taskSourceGapId(task)!}:{})});
 return <div style={{overflowWrap:"anywhere"}}>
 {guidance?.changed&&<p><strong>Review needed:</strong> this task differs from the current evidence-gap guidance. Keep or revise it deliberately.</p>}
 {guidance&&!guidance.current&&<p><strong>Source gap needs review:</strong> {guidance.sourceGapId} has no unique match in the current report. Its absence does not establish completion; retain or revise this task after review.</p>}
 <details><summary style={{padding:"12px 0",cursor:"pointer"}}>Review or edit task guidance</summary>
 {guidance?.gap&&<section aria-label={"Current evidence for task "+(index+1)}>
 <h3>Current evidence gap</h3><p>{guidance.gap.problem}</p><p><strong>Next evidence required:</strong> {guidance.gap.nextEvidence}</p>
 <p><strong>Suggested task:</strong> {guidance.current?.title}</p>
 <button type="button" style={{minHeight:44}} disabled={disabled} onClick={()=>onChange(applyResearchTaskGuidance(task,report))}>Use current guidance for task {index+1}</button>
 <p>This changes the draft wording only. It preserves the owner, progress and evidence. Save progress to record the revision.</p>
 </section>}
 <label style={{display:"block",marginTop:12}}>Task title
 <input aria-label={"Task title "+(index+1)} style={{display:"block",width:"100%",minHeight:44,boxSizing:"border-box"}} disabled={disabled} maxLength={499} value={task.title} onChange={event=>edit({title:event.target.value})}/></label>
 <label style={{display:"block",marginTop:12}}>Why this task matters
 <textarea aria-label={"Task rationale "+(index+1)} style={{display:"block",width:"100%"}} disabled={disabled} rows={3} maxLength={2000} value={task.why} onChange={event=>edit({why:event.target.value})}/></label>
 <label style={{display:"block",marginTop:12}}>Evidence needed to accept this task
 <textarea aria-label={"Task acceptance evidence "+(index+1)} style={{display:"block",width:"100%"}} disabled={disabled} rows={3} maxLength={799} value={task.success} onChange={event=>edit({success:event.target.value})}/></label>
 </details></div>;
}
