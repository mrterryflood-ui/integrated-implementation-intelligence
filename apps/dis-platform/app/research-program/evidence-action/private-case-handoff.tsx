"use client";
import {useState} from "react";
import Link from "next/link";
import type {ResearchProgram} from "../../../lib/research-program";
import type {EvidenceActionReview} from "../../../lib/evidence-action-bridge";
import {buildEvidenceActionCaseHandoff} from "../../../lib/evidence-action-case-handoff";

type Workspace={id:string;title:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export default function PrivateCaseHandoff({program,bridge}:{program:ResearchProgram;bridge:EvidenceActionReview}){
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
  const [chosen,setChosen]=useState("");
  const [loaded,setLoaded]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [savedId,setSavedId]=useState("");
  async function load(){
    setBusy(true);setMessage("");setSavedId("");
    try{
      const r=await fetch("/api/workspaces",{credentials:"same-origin",cache:"no-store"});
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(r.status===401?"Sign in to use private DIS casework.":String(body.error||"Workspace lookup unavailable."));
      const list=Array.isArray(body.workspaces)?body.workspaces.filter((x:Workspace)=>
        x&&typeof x.title==="string"&&typeof x.id==="string"&&uuid.test(x.id)).slice(0,100):[];
      setWorkspaces(list);setLoaded(true);setChosen(list[0]?.id||"");
      setMessage(list.length?"Select a workspace to save a public-evidence research case.":"No workspace yet. Create one in My DIS knowledge, then return here.");
    }catch(e){setMessage(e instanceof Error?e.message:"Workspace lookup unavailable.");}
    finally{setBusy(false);}
  }
  async function save(){
    if(!uuid.test(chosen)||busy||savedId)return;
    setBusy(true);setMessage("");
    try{
      const handoff=buildEvidenceActionCaseHandoff(program,bridge);
      const r=await fetch("/api/cases",{
        method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
        body:JSON.stringify({...handoff,workspaceId:chosen}),cache:"no-store"
      });
      const body=await r.json().catch(()=>({}));
      if(!r.ok||!body.historyRecorded||!uuid.test(body.case?.id))
        throw Error(String(body.error||"The existing casework API did not confirm both a saved case and a dated baseline event."));
      setSavedId(body.case.id);
      setMessage("New private research case and its baseline checkpoint recorded. No implementation or outcome has been independently verified.");
    }catch(e){setMessage(e instanceof Error?e.message:"Private case was not confirmed; verify workspace history before retrying.");}
    finally{setBusy(false);}
  }
  return <section className="rp-program" aria-labelledby="private-case-heading">
    <h2 id="private-case-heading">7. Carry gaps into existing DIS private casework</h2>
    <p>This is the durable continuation. It seeds a new research case, six defined gap-investigation tasks, baseline and follow-up measures through the <strong>existing</strong> authenticated DIS workspace, versioned playbook and longitudinal checkpoint. Research notes, action completions and follow-up measurements can then be documented there, explicitly labeled user-reported until independently reviewed.</p>
    <p><strong>No private transfer occurs automatically.</strong> The save sends only the curated Hinds County public indicators and fixed gap scaffold. It deliberately excludes search queries, pasted third-party study entries, corrective receipt text, patient data and specialist transcripts. A researcher must choose the destination and initiate the write.</p>
    <div className="rp-buttons"><button type="button" disabled={busy} onClick={()=>void load()}>{busy?"Accessing workspace…":"Load my private DIS workspaces"}</button><Link href="/workspace">Manage workspaces</Link></div>
    {loaded&&workspaces.length>0&&!savedId&&<div className="rp-focus">
      <label className="rp-field">Private destination workspace
        <select aria-label="Private destination workspace" value={chosen} onChange={e=>setChosen(e.target.value)}>
          {workspaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}
        </select>
      </label>
      <button className="rp-action" type="button" disabled={busy||!uuid.test(chosen)} onClick={()=>void save()}>Create research case and dated baseline</button>
    </div>}
    {message&&<p role="status" aria-live="polite">{message}</p>}
    {savedId&&<div className="rp-focus"><strong>Existing casework confirmed the create and baseline event.</strong>
      <p>Next: assign the gap owners, verify the source definitions, document the counterfactual, rehearse corrective actions, and record independent review evidence before closing a gap.</p>
      <Link href={"/workspace/case?id="+encodeURIComponent(savedId)}>Open research case and track corrections</Link>
    </div>}
    <p className="rp-subtle">Authenticated tenant RLS and atomic case-event write remain owned by the pre-existing /api/cases service. The local research panel does not attest that outcomes improved or that the selected methodology actually ran.</p>
  </section>;
}
