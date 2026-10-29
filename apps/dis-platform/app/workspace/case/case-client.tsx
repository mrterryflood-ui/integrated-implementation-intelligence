"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Task={id:string,phase:string,title:string,why:string,success:string,owner:string,due:string|null,done:boolean,evidence:string,review:string|null};
type Metric={id:string,label:string,baseline:string,target:string,observed:string,unit:string,verified:boolean};
type Playbook={objective:string,decision:string,assumptions:string[],alternatives:string[],tasks:Task[],metrics:Metric[],nextReview:string,progressNotes:string[],evidenceLevel:string,version:number};
type Case={id:string,title:string,question:string,version:number,status:string,playbook:Playbook,report:{state?:string,deliberation?:{synthesis:string},retrieval?:string,citations?:{checked:string,claimSupport:string},limitations?:string},updated_at:string};
export default function CaseClient(){
 const [item,setItem]=useState<Case|null>(null),[draft,setDraft]=useState<Playbook|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[note,setNote]=useState("");
 const [key,setKey]=useState<string>("");
 useEffect(()=>{const id=new URLSearchParams(location.search).get("id")||"";setKey(id);if(!id)return;fetch("/api/cases?id="+encodeURIComponent(id)).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{if(!x.ok)throw Error(x.j.error||"Not found");setItem(x.j.case);setDraft(x.j.case.playbook)}).catch(e=>setMessage(String(e.message)))},[]);
 const changeTask=(index:number,patch:Partial<Task>)=>setDraft(p=>p?{...p,tasks:p.tasks.map((t,i)=>i===index?{...t,...patch}:t)}:p);
 const changeMetric=(index:number,patch:Partial<Metric>)=>setDraft(p=>p?{...p,metrics:p.metrics.map((m,i)=>i===index?{...m,...patch}:m)}:p);
 async function save(){if(!item||!draft)return;setBusy(true);setMessage("");try{const r=await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:item.version,playbook:draft})});const j=await r.json();if(!r.ok)throw Error(j.error||"Save failed");setItem(j.case);setDraft(j.case.playbook);setMessage("Progress saved. This does not certify completion or impact.")}catch(e){setMessage(e instanceof Error?e.message:"Save failed")}finally{setBusy(false)}}
 async function recheck(){if(!item||!draft)return;setBusy(true);setMessage("Rechecking current evidence and reviewing your recorded progress…");try{
 const saveResponse=await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:item.version,playbook:draft})});
 const saved=await saveResponse.json();if(!saveResponse.ok)throw Error(saved.error||"Save your progress first");
 setItem(saved.case);setDraft(saved.case.playbook);
 const r=await fetch("/api/cases/recheck",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:saved.case.version})});
 const j=await r.json();if(!r.ok)throw Error(j.error||"Recheck unavailable");setItem(j.case);setDraft(j.case.playbook);setMessage(j.note||"Council recheck recorded")
 }catch(e){setMessage(e instanceof Error?e.message:"Recheck failed")}finally{setBusy(false)}}
 if(!item||!draft)return <main style={{maxWidth:920,margin:"50px auto",padding:24}}><Link href="/workspace">Back to workspaces</Link><p role="status">{message||"Loading case…"}</p></main>;
 const completed=draft.tasks.filter(t=>t.done).length;
 return <main style={{maxWidth:980,margin:"35px auto",padding:22,color:"#152a3a",background:"#fbfcff"}}>
 <Link href="/workspace">← My workspaces</Link><p style={{color:"#687888"}}>DIS decision workspace · Version {item.version}</p><h1>{item.title}</h1><p>{item.question}</p><div style={{background:"#edf4fa",padding:16,borderRadius:10}}><strong>Progress: {completed} of {draft.tasks.length} checkpoints recorded</strong><p>Recorded completion is not proof of effectiveness. Evidence, baseline and outcomes require separate validation.</p></div>
 {item.report?.deliberation?.synthesis&&<details style={{marginTop:20}}><summary><strong>Read the council's latest preliminary assessment</strong></summary><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{item.report.deliberation.synthesis}</pre></details>}
 <h2>Action plan and guidance</h2><p>Assign owners, collect evidence, and record what you observed. No plan step authorizes external action without your approval.</p>
 {draft.tasks.map((t,i)=><section key={t.id} style={{border:"1px solid #d8e1ea",padding:18,borderRadius:12,margin:"12px 0",background:"white"}}>
 <label style={{display:"flex",gap:9,alignItems:"center"}}><input type="checkbox" checked={t.done} onChange={e=>changeTask(i,{done:e.target.checked})}/><strong>{i+1}. {t.title}</strong></label><p>{t.why}</p><p><strong>Acceptance evidence:</strong> {t.success}</p><label>Responsible person <input value={t.owner} maxLength={145} onChange={e=>changeTask(i,{owner:e.target.value})}/></label>
 <label style={{display:"block",marginTop:8}}>Observation, source or test evidence <textarea rows={2} style={{width:"100%"}} value={t.evidence} maxLength={2000} onChange={e=>changeTask(i,{evidence:e.target.value})}/></label>
 </section>)}
 <h2>Outcome metrics</h2><p>Targets are placeholders until you confirm their suitability. Verification must reflect observed and reproducible evidence.</p>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">Measure</th><th align="left">Baseline</th><th align="left">Target</th><th align="left">Observed</th><th>Verified?</th></tr></thead><tbody>{draft.metrics.map((m,i)=><tr key={m.id}><td>{m.label}</td><td>{m.baseline}</td><td><input aria-label={"Target for "+m.label} value={m.target} maxLength={240} onChange={e=>changeMetric(i,{target:e.target.value})}/></td><td><input aria-label={"Observed "+m.label} value={m.observed} maxLength={240} onChange={e=>changeMetric(i,{observed:e.target.value})}/></td><td><input aria-label={"Verified "+m.label} type="checkbox" checked={m.verified} onChange={e=>changeMetric(i,{verified:e.target.checked})}/></td></tr>)}</tbody></table></div>
 <h2>Revisit the decision</h2><label>Next review date (or trigger) <input value={draft.nextReview} maxLength={75} onChange={e=>setDraft({...draft,nextReview:e.target.value})}/></label><p>What changed? Record new evidence, constraints, or outcomes and request another council assessment when you need it.</p>
 <textarea rows={3} style={{width:"100%"}} placeholder="Progress update or changed assumption" value={note} onChange={e=>setNote(e.target.value)} maxLength={1000}/><button onClick={()=>{if(!note.trim())return;setDraft({...draft,progressNotes:[...draft.progressNotes,note.trim()].slice(-80)});setNote("")}}>Add progress note</button>
 <ul>{draft.progressNotes.map((n,i)=><li key={i}>{n}</li>)}</ul><div style={{display:"flex",gap:14,flexWrap:"wrap",margin:"25px 0"}}><button disabled={busy} onClick={save}>Save progress</button><button disabled={busy} onClick={recheck}>Recheck with council</button></div><p role="status">{message}</p><small>Future automatic reminders are not enabled. Rechecks run when you request them, using available connected inference and research.</small>
 </main>
}
