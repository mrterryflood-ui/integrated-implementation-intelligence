"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {asLearningCheckpoints,summarizeMetricChanges,type CaseLearningEvent} from "../../../lib/longitudinal-learning";
type Task={id:string,phase:string,title:string,why:string,success:string,owner:string,due:string|null,done:boolean,evidence:string,review:string|null};
type Metric={id:string,label:string,baseline:string,target:string,observed:string,unit:string,verified:boolean,source?:string,observedAt?:string};
type Playbook={objective:string,decision:string,assumptions:string[],alternatives:string[],tasks:Task[],metrics:Metric[],nextReview:string,progressNotes:string[],evidenceLevel:string,version:number,learningReview?:{knowledge:string,skills:string,strategy:string,nextExperiment:string}};
type Case={id:string,title:string,question:string,version:number,status:string,playbook:Playbook,report:{state?:string,deliberation?:{synthesis:string},retrieval?:string,citations?:{checked:string,claimSupport:string},limitations?:string},updated_at:string};
export default function CaseClient(){
 const [item,setItem]=useState<Case|null>(null),[draft,setDraft]=useState<Playbook|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[note,setNote]=useState("");
 const [key,setKey]=useState<string>("");
 const [history,setHistory]=useState<CaseLearningEvent[]>([]),[historyLimit,setHistoryLimit]=useState(250);
 useEffect(()=>{const id=new URLSearchParams(location.search).get("id")||"";setKey(id);if(!id)return;fetch("/api/cases?id="+encodeURIComponent(id)).then(r=>r.json().then(j=>({ok:r.ok,j}))).then(x=>{if(!x.ok)throw Error(x.j.error||"Not found");setItem(x.j.case);setDraft(x.j.case.playbook);setHistory(x.j.history||[]);setHistoryLimit(x.j.historyLimit||250)}).catch(e=>setMessage(String(e.message)))},[]);
 const changeTask=(index:number,patch:Partial<Task>)=>setDraft(p=>p?{...p,tasks:p.tasks.map((t,i)=>i===index?{...t,...patch}:t)}:p);
 const changeMetric=(index:number,patch:Partial<Metric>)=>setDraft(p=>p?{...p,metrics:p.metrics.map((m,i)=>i===index?{...m,...patch}:m)}:p);
 const changeLearning=(field:"knowledge"|"skills"|"strategy"|"nextExperiment",value:string)=>setDraft(p=>p?{...p,learningReview:{knowledge:"",skills:"",strategy:"",nextExperiment:"",...(p.learningReview||{}),[field]:value}}:p);
 const refreshHistory=async(id:string)=>{try{const response=await fetch("/api/cases?id="+encodeURIComponent(id),{cache:"no-store"});if(!response.ok)return;const value=await response.json();setHistory(value.history||[]);setHistoryLimit(value.historyLimit||250)}catch{}};
 async function save(){if(!item||!draft)return;setBusy(true);setMessage("");try{const r=await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:item.version,playbook:draft})});const j=await r.json();if(!r.ok)throw Error(j.error||"Save failed");setItem(j.case);setDraft(j.case.playbook);await refreshHistory(item.id);setMessage(j.historyRecorded?"Progress and time-stamped learning checkpoint saved together. This does not certify impact.":"Save returned without verified archival receipt; inspect history.")}catch(e){setMessage(e instanceof Error?e.message:"Save failed")}finally{setBusy(false)}}
 async function recheck(){if(!item||!draft)return;setBusy(true);setMessage("Rechecking current evidence and reviewing your recorded progress…");try{
 const saveResponse=await fetch("/api/cases",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:item.version,playbook:draft})});
 const saved=await saveResponse.json();if(!saveResponse.ok)throw Error(saved.error||"Save your progress first");
 setItem(saved.case);setDraft(saved.case.playbook);
 const r=await fetch("/api/cases/recheck",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,version:saved.case.version})});
 const j=await r.json();if(!r.ok)throw Error(j.error||"Recheck unavailable");setItem(j.case);setDraft(j.case.playbook);await refreshHistory(item.id);setMessage(j.note||"Council recheck recorded")
 }catch(e){setMessage(e instanceof Error?e.message:"Recheck failed")}finally{setBusy(false)}}
 if(!item||!draft)return <main style={{maxWidth:920,margin:"50px auto",padding:24}}><Link href="/workspace">Back to workspaces</Link><p role="status">{message||"Loading case…"}</p></main>;
 const completed=draft.tasks.filter(t=>t.done).length;
 const timeline=asLearningCheckpoints(history);
 const trends=summarizeMetricChanges(history);
 const latest=timeline[timeline.length-1];
 return <main style={{maxWidth:980,margin:"35px auto",padding:22,color:"#152a3a",background:"#fbfcff"}}>
 <Link href="/workspace">← My workspaces</Link><p style={{color:"#687888"}}>DIS decision workspace · Version {item.version}</p><h1>{item.title}</h1><p>{item.question}</p><div style={{background:"#edf4fa",padding:16,borderRadius:10}}><strong>Progress: {completed} of {draft.tasks.length} checkpoints recorded</strong><p>Recorded completion is not proof of effectiveness. Evidence, baseline and outcomes require separate validation.</p></div>
 {item.report?.deliberation?.synthesis&&<details style={{marginTop:20}}><summary><strong>Read the council's latest preliminary assessment</strong></summary><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{item.report.deliberation.synthesis}</pre></details>}
 <h2>Action plan and guidance</h2><p>Assign owners, collect evidence, and record what you observed. No plan step authorizes external action without your approval.</p>
 {draft.tasks.map((t,i)=><section key={t.id} style={{border:"1px solid #d8e1ea",padding:18,borderRadius:12,margin:"12px 0",background:"white"}}>
 <label style={{display:"flex",gap:9,alignItems:"center"}}><input type="checkbox" checked={t.done} onChange={e=>changeTask(i,{done:e.target.checked})}/><strong>{i+1}. {t.title}</strong></label><p>{t.why}</p><p><strong>Acceptance evidence:</strong> {t.success}</p><label>Responsible person <input value={t.owner} maxLength={145} onChange={e=>changeTask(i,{owner:e.target.value})}/></label>
 <label style={{display:"block",marginTop:8}}>Observation, source or test evidence <textarea rows={2} style={{width:"100%"}} value={t.evidence} maxLength={2000} onChange={e=>changeTask(i,{evidence:e.target.value})}/></label>
 </section>)}
 <h2>Outcome metrics</h2><p>Targets are placeholders until you confirm their suitability. Verification must reflect observed and reproducible evidence.</p>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">Measure</th><th align="left">Baseline</th><th align="left">Target</th><th align="left">Observed</th><th>Source reviewed?</th></tr></thead><tbody>{draft.metrics.map((m,i)=><tr key={m.id}><td>{m.label}</td><td>{m.baseline}</td><td><input aria-label={"Target for "+m.label} value={m.target} maxLength={240} onChange={e=>changeMetric(i,{target:e.target.value})}/></td><td><input aria-label={"Observed "+m.label} value={m.observed} maxLength={240} onChange={e=>changeMetric(i,{observed:e.target.value})}/></td><td><input aria-label={"Source reviewed by you for "+m.label} type="checkbox" checked={m.verified} onChange={e=>changeMetric(i,{verified:e.target.checked})}/></td></tr>)}</tbody></table></div>
 <section aria-label="Measurement provenance" style={{border:"1px solid #d8e1ea",borderRadius:12,padding:16,marginTop:12,background:"white"}}>
 <h3>Where did these observations come from?</h3>
 <p>Record the source and date for each observed measure. A source-review checkbox records your own attestation—not independent validation.</p>
 {draft.metrics.map((m,i)=><div key={m.id} style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end",padding:"10px 0",borderBottom:"1px solid #eef1f5"}}>
 <strong style={{flex:"1 1 190px"}}>{m.label}</strong>
 <label style={{flex:"2 1 240px"}}>Source, record or method
 <input style={{width:"100%"}} aria-label={"Evidence source for "+m.label} value={m.source||""} maxLength={500} onChange={e=>changeMetric(i,{source:e.target.value})} placeholder="Where was this measured?"/></label>
 <label style={{flex:"1 1 150px"}}>Date observed
 <input type="date" aria-label={"Observation date for "+m.label} value={m.observedAt||""} onChange={e=>changeMetric(i,{observedAt:e.target.value})}/></label></div>)}
 </section>
 <h2>Learning and adaptation</h2>
 <p>Link retrospective evidence to the next prospective test. These are your reflections and hypotheses, not AI-certified knowledge or skill improvements.</p>
 <div style={{display:"grid",gap:12,gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))"}}>
 {([
 ["knowledge","What did the evidence teach us?"],
 ["skills","What capability was developed or still needs improvement?"],
 ["strategy","Which strategy should we retain, revise, or stop—and why?"],
 ["nextExperiment","What should we test next, with what safeguards?"]
 ] as const).map(([field,label])=><label key={field}>{label}<textarea rows={3} style={{display:"block",width:"100%"}} maxLength={1000} value={draft.learningReview?.[field]||""} onChange={e=>changeLearning(field,e.target.value)}/></label>)}
 </div>
 <section aria-label="Longitudinal learning history" style={{margin:"22px 0",border:"1px solid #d8e1ea",borderRadius:12,padding:18,background:"white"}}>
 <h2>What changed over time?</h2>
 <p>{timeline.length} recorded learning checkpoint(s) in the available history. This view is capped at the most recent {historyLimit} case events; earlier history is not certified complete. Recorded measures are user-reported and no causal benefit is inferred.</p>
 {latest&&<p><strong>Current evidence documentation:</strong> {latest.summary.measuresObserved} of {latest.summary.measuresDefined} measures have observations; {latest.summary.observedWithSource} name a source; {latest.summary.observedWithDate} have observation dates. <strong>Execution evidence:</strong> {latest.summary.completedWithEvidence} of {latest.summary.tasksWithRecordedCompletion} completed tasks include an evidence note. {latest.summary.reviewScheduled?"A next review is declared.":"A next review still needs scheduling."}</p>}
 {trends.length>0?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><th align="left">Measure</th><th align="left">First recorded</th><th align="left">Latest recorded</th><th align="left">Difference</th></tr></thead><tbody>{trends.map(t=><tr key={t.id}><td>{t.label}</td><td>{t.first.value} {t.unit}</td><td>{t.latest.value} {t.unit}</td><td>{t.delta===null?"Not comparable":(t.delta>0?"+":"")+t.delta+" "+t.unit}</td></tr>)}</tbody></table></div>:<p>No observed values have been saved yet. Enter outcomes with sources and save to establish the first measurable record.</p>}
 <details><summary>See dated checkpoints and learning reflections</summary>
 <ol>{timeline.slice().reverse().map(entry=><li key={entry.caseVersion} style={{margin:"12px 0"}}><strong>Revision {entry.caseVersion} · {new Date(entry.recordedAt).toLocaleString()}</strong>
 <p>Knowledge: {entry.reflection.knowledge||"Not documented"}; Skills: {entry.reflection.skills||"Not documented"}; Strategy: {entry.reflection.strategy||"Not documented"}.</p><p>Next test: {entry.reflection.nextExperiment||"Not specified"}</p>
 </li>)}</ol></details>
 </section>
 <h2>Revisit the decision</h2><label>Next review date (or trigger) <input value={draft.nextReview} maxLength={75} onChange={e=>setDraft({...draft,nextReview:e.target.value})}/></label><p>What changed? Record new evidence, constraints, or outcomes and request another council assessment when you need it.</p>
 <textarea rows={3} style={{width:"100%"}} placeholder="Progress update or changed assumption" value={note} onChange={e=>setNote(e.target.value)} maxLength={1000}/><button onClick={()=>{if(!note.trim())return;setDraft({...draft,progressNotes:[...draft.progressNotes,note.trim()].slice(-80)});setNote("")}}>Add progress note</button>
 <ul>{draft.progressNotes.map((n,i)=><li key={i}>{n}</li>)}</ul><div style={{display:"flex",gap:14,flexWrap:"wrap",margin:"25px 0"}}><button disabled={busy} onClick={save}>Save progress</button><button disabled={busy} onClick={recheck}>Recheck with council</button></div><p role="status">{message}</p><small>Future automatic reminders are not enabled. Rechecks run when you request them, using available connected inference and research.</small>
 </main>
}
