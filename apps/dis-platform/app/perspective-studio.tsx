"use client";
import {useState} from "react";
import {DEPTHS,DIRECTIONS,type PerspectiveRequest} from "../lib/perspective-translation";
const examples=[["Parent or caregiver","Teacher"],["Community member","Public official"],["Researcher","General audience"],["Employee","Manager"]];
export default function PerspectiveStudio(){
 const [from,setFrom]=useState(""),[to,setTo]=useState(""),[source,setSource]=useState(""),[objective,setObjective]=useState("");
 const [language,setLanguage]=useState("English"),[depth,setDepth]=useState<PerspectiveRequest["depth"]>("Simple"),[direction,setDirection]=useState<PerspectiveRequest["direction"]>("One-way");
 const [consent,setConsent]=useState(false),[status,setStatus]=useState(""),[output,setOutput]=useState(""),[busy,setBusy]=useState(false);
 async function transform(){
  setStatus("");setOutput("");
  if(!from.trim()||!to.trim()||source.trim().length<15){setStatus("Enter both perspectives and at least 15 characters of non-identifying text.");return}
  if(!consent){setStatus("Review and approve the optional AI transfer before submitting.");return}
  setBusy(true);
  try{
   const res=await fetch("/api/perspective-translation",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({from,to,source,objective,language,depth,direction,consent})});
   const data=await res.json();
   if(!res.ok){setStatus(data.error||"Transformation unavailable");return}
   if(data.state!=="DRAFT_REVIEW_REQUIRED"){setStatus(data.error||"No reviewable draft returned");return}
   setOutput(data.output);setStatus("AI draft for review. Verify the original meaning, numbers and attribution before sharing.");
  }catch{setStatus("Connection unavailable; your text remains in this browser form.")}
  finally{setBusy(false)}
 }
 const download=()=>{const blob=new Blob([["DIS PERSPECTIVE DRAFT", "Source perspective: "+from,"Audience: "+to,"Depth: "+depth,"Direction: "+direction,"Language: "+language,"Review status: AI DRAFT — not independently verified","",output].join("\n")],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="dis-perspective-draft.txt";a.click();URL.revokeObjectURL(url)};
 return <section className="perspective-section" id="perspectives" aria-labelledby="perspective-title">
  <div className="section-heading"><span className="eyebrow">PERSPECTIVE INTELLIGENCE</span><h2 id="perspective-title">One issue. Many experiences. Shared understanding.</h2><p>Describe any roles in your own words. Select how deeply DIS should explain the issue, and translate between perspectives without pretending differences are disagreements.</p></div>
  <div className="perspective-panel">
   <div className="perspective-examples" aria-label="Optional perspective examples">{examples.map(([a,b])=><button key={a} type="button" onClick={()=>{setFrom(a);setTo(b)}}>{a} → {b}</button>)}</div>
   <div className="perspective-fields"><label>Your role or perspective<input value={from} onChange={e=>setFrom(e.target.value)} maxLength={160} placeholder="Describe your role in your own words"/></label><label>Receiving audience or perspective<input value={to} onChange={e=>setTo(e.target.value)} maxLength={250} placeholder="Who needs to understand this?"/></label></div>
   <fieldset className="perspective-modes"><legend>How much detail?</legend>{DEPTHS.map(x=><button type="button" key={x} aria-pressed={depth===x} onClick={()=>setDepth(x)}>{x}</button>)}</fieldset>
   <div className="perspective-fields"><label>Communication direction<select value={direction} onChange={e=>setDirection(e.target.value as PerspectiveRequest["direction"])}>{DIRECTIONS.map(x=><option key={x}>{x}</option>)}</select></label><label>Output language<input value={language} onChange={e=>setLanguage(e.target.value)} maxLength={70} placeholder="English, Spanish, etc."/></label></div>
   <label className="perspective-block">What is the purpose? <input value={objective} onChange={e=>setObjective(e.target.value)} maxLength={350} placeholder="Explain, resolve a misunderstanding, identify shared actions..."/></label>
   <label className="perspective-block">Your source text or report excerpt<textarea value={source} onChange={e=>setSource(e.target.value)} maxLength={9000} rows={7} placeholder="Use publicly shareable or fictional text only. Do not enter personal, student, patient or confidential records."/></label>
   <p className="perspective-truth">The four modes control explanation depth, not factual certainty. AI output is a draft; source statistics, citations and conclusions require review. This public pilot does not accept confidential document uploads.</p>
   <label className="perspective-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I confirm this text is permitted for external AI processing and approve sending it to the configured AI service for this request.</label>
   <div className="perspective-actions"><button type="button" disabled={busy} onClick={transform}>{busy?"Preparing draft…":"Translate perspectives"}</button><button type="button" onClick={()=>{setFrom(to);setTo(from);setOutput("");setStatus("Direction reversed. Review the source message before generating another draft.")}}>Swap perspectives ↔</button></div>
   {status&&<p role="status" className="perspective-status">{status}</p>}
   {output&&<div className="perspective-output"><div><h3>Reviewable communication draft</h3><button type="button" onClick={download}>Export text</button></div><pre>{output}</pre></div>}
  </div>
 </section>;
}
