"use client";
import {useState} from "react";
import Link from "next/link";
import type {ResearchProgram} from "../../../lib/research-program";
import type {EvidenceActionReview} from "../../../lib/evidence-action-bridge";
import {WORKFLOW_FIELDS,buildResearchWorkflowCase,reviseResearchWorkflowReport,retainedResearchReport,workflowFromSavedReport,type ResearchWorkflow} from "../../../lib/research-workflow";
import {reviewOutcomeEquity,SYNTHETIC_EQUITY_EXERCISE,type OutcomeAudit} from "../../../lib/outcome-equity-assurance";
import type {SavedResearchCase} from "./evidence-action-client";
type Workspace={id:string;title:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export default function PrivateCaseHandoff({program,bridge,workflow,onChange,savedCase,onSaved}:{program:ResearchProgram;bridge:EvidenceActionReview;workflow:ResearchWorkflow;onChange:(patch:Partial<ResearchWorkflow>)=>void;savedCase:SavedResearchCase|null;onSaved:(item:SavedResearchCase)=>void}){
 const [workspaces,setWorkspaces]=useState<Workspace[]>([]),[chosen,setChosen]=useState("");
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [preview,setPreview]=useState(""),[previewInput,setPreviewInput]=useState("");
 const [outcome,setOutcome]=useState<OutcomeAudit|null>(null);
 const notes=workflow.supplementText,confirmed=workflow.publicAggregateConfirmed;
 const signature=JSON.stringify({workflow,version:savedCase?.version});
 const report=()=>savedCase?reviseResearchWorkflowReport(savedCase.report,workflow):buildResearchWorkflowCase(workflow).report;
 function inspect(){setPreview("");setMessage("");try{setPreview(JSON.stringify(report(),null,2));setPreviewInput(signature);}catch(e){setMessage(e instanceof Error?e.message:"Invalid investigation record.");}}
 function addSynthetic(){
  const r=reviewOutcomeEquity(SYNTHETIC_EQUITY_EXERCISE);setOutcome(r);
  onChange({supplementText:JSON.stringify({additionalGaps:[{id:"synthetic-subgroup-signal",severity:"RESEARCH_REQUIRED",problem:"Synthetic average improvement masks a subgroup decline.",ownerRole:"Internal exercise reviewer; not an actual appointment",nextEvidence:"Investigate subgroup denominators, uncertainty, adverse effects and alternatives before claiming success."}],notes:[{id:"synthetic-equity-1",kind:"OUTCOME",text:JSON.stringify({fixture:SYNTHETIC_EQUITY_EXERCISE,audit:r}),sourceUrl:"https://example.org/synthetic-not-real-data",gapIds:["synthetic-subgroup-signal"],origin:"SYNTHETIC"}]},null,2),publicAggregateConfirmed:false});
  setPreview("");setMessage("Synthetic exercise staged for explicit review; nothing saved. This replaces the supplement editor only.");
 }
 async function load(){
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/workspaces",{credentials:"same-origin",cache:"no-store"});const body=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(r.status===401?"Sign in to use private DIS casework.":r.status===503?"Private workspace access is unavailable in this environment.":String(body.error||"Workspace lookup unavailable."));
   const list=Array.isArray(body.workspaces)?body.workspaces.filter((x:Workspace)=>x&&typeof x.title==="string"&&typeof x.id==="string"&&uuid.test(x.id)).slice(0,100):[];
   setWorkspaces(list);setLoaded(true);setChosen(list[0]?.id||"");setMessage(list.length?"Choose the private destination and review the complete investigation before saving.":"No workspace yet. Create one in My DIS knowledge, then return here.");
  }catch(e){setMessage(e instanceof Error?e.message:"Workspace lookup unavailable.");}finally{setBusy(false);}
 }
 async function save(){
  if(busy||(!savedCase&&!uuid.test(chosen)))return;setBusy(true);setMessage("");
  try{
   report();
   const payload=savedCase?{id:savedCase.id,version:savedCase.version,researchWorkflow:workflow}:{workspaceId:chosen,researchWorkflow:workflow};
   const r=await fetch("/api/cases",{method:savedCase?"PATCH":"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload),cache:"no-store"});
   const body=await r.json().catch(()=>({}));if(!r.ok||body.historyRecorded!==true||!uuid.test(body.case?.id)||!Number.isInteger(body.case?.version))throw Error(String(body.error||"Case and dated journal were not both confirmed. Check existing history before retrying."));
   if(savedCase?(body.case.id!==savedCase.id||body.case.version!==savedCase.version+1):body.case.version!==1)throw Error("The save receipt does not match this case revision. Inspect saved history before retrying.");
   const retained=retainedResearchReport(body.case.report);if(!retained?.workflow)throw Error("The save response omitted the research workflow. Inspect saved history before retrying.");
   workflowFromSavedReport(retained);
   onSaved(body.case);setPreview("");setMessage(savedCase?"Research revision and prior assessment recorded together. The current action plan is retained; review its tasks against your changes.":"Research investigation and baseline checkpoint recorded. You can reopen the editors from the saved case.");
  }catch(e){setMessage(e instanceof Error?e.message:"Save not confirmed; inspect history before retrying.");}finally{setBusy(false);}
 }
 const missingFoundation=WORKFLOW_FIELDS.filter(([key])=>!workflow.narrative[key].trim()).length;
 return <section className="rp-program" aria-labelledby="private-case-heading">
  <h2 id="private-case-heading">7. Preserve the investigation and challenge apparent success</h2>
  <p>The {program.site} record retains the source evidence, all {bridge.gaps.length} existing gaps, your project foundation, selected frameworks and mechanisms, studies, counterfactual inputs, correction receipt and outcome notes. Up to 28 gap tasks fit in the initial editable playbook; the full ledger is retained.</p>
  <p>{missingFoundation} foundation or design fields remain open. Saving records a working draft and does not mark these questions resolved.</p>
  <h3>Internal equity exercise — synthetic, not patient data</h3>
  <p>This example improves average process completion by 10 percentage points while one group declines by 10 points.</p>
  <div className="rp-buttons"><button type="button" disabled={busy} onClick={addSynthetic}>Stage synthetic subgroup challenge</button></div>
  {outcome&&<div className="rp-focus" role="status"><strong>{outcome.state.replaceAll("_"," ").toLowerCase()}</strong><p>Average change: {outcome.overallChange?.toFixed(1)} pp; absolute gap change: {outcome.absoluteGapChange?.toFixed(1)} pp. Equitable success established: no.</p>{outcome.groupChanges.map(g=><p key={g.group}>{g.group}: {g.change.toFixed(1)} pp</p>)}<ul>{outcome.issues.map(x=><li key={x}>{x}</li>)}</ul></div>}
  <h3>Additional evidence and newly discovered gaps</h3>
  <p>Use the supplement for sourced notes, new gaps and reopen decisions. The other editors are captured automatically when you save. The confirmation below applies to every editor in this investigation.</p>
  <label className="rp-field">Public investigation supplement JSON<textarea aria-label="Public investigation supplement JSON" rows={7} maxLength={24000} disabled={busy} value={notes} onChange={e=>onChange({supplementText:e.target.value})} placeholder='{"additionalGaps":[],"notes":[]}'/></label>
  <label className="rp-check"><input type="checkbox" disabled={busy} checked={confirmed} onChange={e=>onChange({publicAggregateConfirmed:e.target.checked})}/>I reviewed this investigation and supplement: public aggregate or explicitly synthetic information only, no private records or personal identifiers.</label>
  <div className="rp-buttons"><button type="button" onClick={inspect}>Preview complete investigation record</button>{!savedCase&&<button type="button" disabled={busy} onClick={()=>void load()}>{busy?"Accessing workspace…":"Load my private DIS workspaces"}</button>}<Link href="/workspace">Manage workspaces</Link></div>
  {preview&&previewInput===signature&&<details open><summary>Complete declared record — unverified, not yet saved</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:420,overflow:"auto",fontSize:12}}>{preview}</pre></details>}
  {loaded&&workspaces.length>0&&!savedCase&&<div className="rp-focus"><label className="rp-field">Private destination workspace<select aria-label="Private destination workspace" value={chosen} onChange={e=>setChosen(e.target.value)}>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select></label><button className="rp-action" type="button" disabled={busy||!uuid.test(chosen)} onClick={()=>void save()}>Create research case and dated baseline</button></div>}
  {savedCase&&<div className="rp-focus"><p>Saved case revision {savedCase.version}. New edits are retained only when you save another revision.</p><button type="button" disabled={busy} onClick={()=>void save()}>Save research revision</button><p><Link href={"/workspace/case?id="+encodeURIComponent(savedCase.id)}>Open research case and track corrections</Link></p><a href={"/api/cases?id="+encodeURIComponent(savedCase.id)} target="_blank" rel="noreferrer">Read complete saved investigation and event history (authenticated JSON)</a></div>}
  {message&&<p role="status" aria-live="polite">{message}</p>}
  <p className="rp-subtle">A save uses your existing private casework and dated journal. It does not contact anyone, run an AI model, transfer to an organization or authorize clinical action. The saved case offers a separate, explicit planning handoff.</p>
 </section>;
}
