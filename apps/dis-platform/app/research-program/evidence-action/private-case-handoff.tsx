"use client";
import {useState} from "react";
import Link from "next/link";
import type {ResearchProgram} from "../../../lib/research-program";
import type {EvidenceActionReview} from "../../../lib/evidence-action-bridge";
import {buildEvidenceActionCaseHandoff} from "../../../lib/evidence-action-case-handoff";
import {reviewOutcomeEquity,SYNTHETIC_EQUITY_EXERCISE,type OutcomeAudit} from "../../../lib/outcome-equity-assurance";
type Workspace={id:string;title:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export default function PrivateCaseHandoff({program,bridge}:{program:ResearchProgram;bridge:EvidenceActionReview}){
 const [workspaces,setWorkspaces]=useState<Workspace[]>([]),[chosen,setChosen]=useState("");
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[savedId,setSavedId]=useState("");
 const [notes,setNotes]=useState(""),[confirmed,setConfirmed]=useState(false),[preview,setPreview]=useState("");
 const [outcome,setOutcome]=useState<OutcomeAudit|null>(null);
 const supplement=()=>notes.trim()?{...JSON.parse(notes),publicAggregateConfirmed:confirmed}:undefined;
 function inspect(){setPreview("");setMessage("");try{setPreview(JSON.stringify(buildEvidenceActionCaseHandoff(program,bridge,supplement()).report,null,2));}catch(e){setMessage(e instanceof Error?e.message:"Invalid investigation record.");}}
 function addSynthetic(){
  const r=reviewOutcomeEquity(SYNTHETIC_EQUITY_EXERCISE);setOutcome(r);
  setNotes(JSON.stringify({additionalGaps:[{id:"synthetic-subgroup-signal",severity:"RESEARCH_REQUIRED",problem:"Synthetic average improvement masks a subgroup decline.",ownerRole:"Internal exercise reviewer; not an actual appointment",nextEvidence:"Investigate subgroup denominators, uncertainty, adverse effects and alternatives before claiming success."}],notes:[{id:"synthetic-equity-1",kind:"OUTCOME",text:JSON.stringify({fixture:SYNTHETIC_EQUITY_EXERCISE,audit:r}),sourceUrl:"https://example.org/synthetic-not-real-data",gapIds:["synthetic-subgroup-signal"],origin:"SYNTHETIC"}]},null,2));
  setConfirmed(false);setPreview("");setMessage("Synthetic exercise staged for explicit review; nothing saved. This replaces the supplement editor only.");
 }
 async function load(){
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/workspaces",{credentials:"same-origin",cache:"no-store"});const body=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(r.status===401?"Sign in to use private DIS casework.":r.status===503?"Private workspace access is unavailable in this environment.":String(body.error||"Workspace lookup unavailable."));
   const list=Array.isArray(body.workspaces)?body.workspaces.filter((x:Workspace)=>x&&typeof x.title==="string"&&typeof x.id==="string"&&uuid.test(x.id)).slice(0,100):[];
   setWorkspaces(list);setLoaded(true);setChosen(list[0]?.id||"");setMessage(list.length?"Choose the private destination and review the full investigation before saving.":"No workspace yet. Create one in My DIS knowledge, then return here.");
  }catch(e){setMessage(e instanceof Error?e.message:"Workspace lookup unavailable.");}finally{setBusy(false);}
 }
 async function save(){
  if(!uuid.test(chosen)||busy||savedId)return;setBusy(true);setMessage("");
  try{const handoff=buildEvidenceActionCaseHandoff(program,bridge,supplement());
   const r=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({...handoff,workspaceId:chosen}),cache:"no-store"});
   const body=await r.json().catch(()=>({}));if(!r.ok||body.historyRecorded!==true||!uuid.test(body.case?.id))throw Error(String(body.error||"Case and dated baseline were not both confirmed. Check existing history before retrying."));
   setSavedId(body.case.id);setMessage("Research investigation and baseline checkpoint recorded; no outcome or causal effect independently verified.");
  }catch(e){setMessage(e instanceof Error?e.message:"Save not confirmed; inspect history before retrying.");}finally{setBusy(false);}
 }
 return <section className="rp-program" aria-labelledby="private-case-heading">
  <h2 id="private-case-heading">7. Preserve the investigation and challenge apparent success</h2>
  <p>The complete calibrated public-evidence supplement, colorectal decision brief, intended users and value test, all {bridge.gaps.length} baseline/research gaps, original measurement definitions, source leads, competing explanations and proposed corrections are retained in the case report. Up to28 gap tasks fit in the editable playbook; additional gaps remain in the full archive. Nothing is silently dropped or marked resolved.</p>
  <h3>Internal equity exercise — synthetic, not patient data</h3>
  <p>A better average does not establish equitable benefit. This example improves average process completion by 10 percentage points while one group declines by 10 points. No independent or causal conclusion follows.</p>
  <div className="rp-buttons"><button type="button" disabled={busy||!!savedId} onClick={addSynthetic}>Stage synthetic subgroup challenge</button></div>
  {outcome&&<div className="rp-focus" role="status"><strong>{outcome.state.replaceAll("_"," ").toLowerCase()}</strong><p>Average change: {outcome.overallChange?.toFixed(1)} pp; absolute gap change: {outcome.absoluteGapChange?.toFixed(1)} pp. Equitable success established: no.</p>{outcome.groupChanges.map(g=><p key={g.group}>{g.group}: {g.change.toFixed(1)} pp</p>)}<ul>{outcome.issues.map(x=><li key={x}>{x}</li>)}</ul></div>}
  <h3>Additional evidence and newly discovered gaps</h3>
  <p>Use the supplement for source excerpts, rival explanations, counterfactual notes, correction receipts, outcomes and reopen decisions. Include their source and gap IDs. Other editors on this page are not automatically captured: deliberately copy approved public information here. This declaration is not an automated privacy or scientific certification.</p>
  <label className="rp-field">Public investigation supplement JSON<textarea aria-label="Public investigation supplement JSON" rows={7} maxLength={24000} disabled={busy||!!savedId} value={notes} onChange={e=>{setNotes(e.target.value);setConfirmed(false);setPreview("");}} placeholder='{"additionalGaps":[],"notes":[]}'/></label>
  <label className="rp-check"><input type="checkbox" disabled={busy||!!savedId} checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setPreview("");}}/>I reviewed this supplement: public aggregate or explicitly synthetic information only, no private records or personal identifiers.</label>
  <div className="rp-buttons"><button type="button" onClick={inspect}>Preview complete investigation record</button><button type="button" disabled={busy||!!savedId} onClick={()=>void load()}>{busy?"Accessing workspace…":"Load my private DIS workspaces"}</button><Link href="/workspace">Manage workspaces</Link></div>
  {preview&&<details open><summary>Complete declared record — unverified, not yet saved</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",maxHeight:420,overflow:"auto",fontSize:12}}>{preview}</pre></details>}
  {loaded&&workspaces.length>0&&!savedId&&<div className="rp-focus"><label className="rp-field">Private destination workspace<select aria-label="Private destination workspace" value={chosen} onChange={e=>setChosen(e.target.value)}>{workspaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select></label><button className="rp-action" type="button" disabled={busy||!uuid.test(chosen)} onClick={()=>void save()}>Create research case and dated baseline</button></div>}
  {message&&<p role="status" aria-live="polite">{message}</p>}
  {savedId&&<div className="rp-focus"><p>Existing casework confirmed the case and baseline. Assign owners and investigate the evidence; completion checkboxes are not independent verification.</p><Link href={"/workspace/case?id="+encodeURIComponent(savedId)}>Open research case and track corrections</Link><p><a href={"/api/cases?id="+encodeURIComponent(savedId)} target="_blank" rel="noreferrer">Read complete saved investigation and event history (authenticated JSON)</a></p></div>}
  <p className="rp-subtle">Saving uses existing authenticated tenant casework. No email, clinical action, cross-tenant transfer or RPLICE method execution is authorized. Changed evidence requires a new review; retain the prior baseline and record the decision in case history.</p>
 </section>;
}
