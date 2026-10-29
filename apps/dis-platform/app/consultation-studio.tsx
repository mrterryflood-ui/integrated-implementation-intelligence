"use client";
import {useState} from "react";
import {sanitizeIntake,deliverables,packageMarkdown,type Intake,type Deliverable} from "../lib/consultation";
const labels:Record<keyof Intake,string>={mission:"What problem do you want to solve?",organization:"Company, organization or project name",audience:"Who has this problem? Who buys or decides?",stage:"What exists today (idea, prototype, MVP, traction)?",alternatives:"How do people solve it today? Known competitors?",traction:"What have you measured or validated?",resources:"Budget, team and constraints",geography:"Industry or geography",desiredOutcome:"What does a successful engagement deliver?"};
const keys=Object.keys(labels) as (keyof Intake)[];
const empty=Object.fromEntries(keys.map(k=>[k,""])) as Intake;
export default function ConsultationStudio(){
 const [intake,setIntake]=useState<Intake>(empty),[items,setItems]=useState<Deliverable[]>([]),[working,setWorking]=useState(false),[error,setError]=useState(""),[answer,setAnswer]=useState("");
 const [mode,setMode]=useState<"startup"|"general">("startup");
 const [externalConsent,setExternalConsent]=useState(false);
 const build=async()=>{setError("");if(intake.mission.trim().length<8){setError("Describe the problem in at least eight characters.");return}
 setWorking(true);try{const result=deliverables(sanitizeIntake(intake),undefined,mode);setItems(result)}finally{setWorking(false)}};
 const researchWithCouncil=async()=>{if(!externalConsent){setError("Give explicit permission to share your stated question with scholarly search and AI providers.");return}if(intake.mission.trim().length<8){setError("Describe your problem first.");return}
 setWorking(true);setError("");
 try{
  const prompt=[intake.mission,intake.organization,intake.audience,intake.stage,intake.alternatives,intake.traction,intake.resources,intake.geography,intake.desiredOutcome].filter(Boolean).join("\n");
  const response=await fetch("/api/council",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt,count:6,redCount:4,selectionMode:"auto",challengeEnabled:true,allowExternalResearch:true,depth:"Deep"})});
  const report=await response.json();
  if(!response.ok)throw Error(report.error||"Council unavailable");
  if(!report.deliberation?.synthesis)throw Error(report.notice||report.error||"Council response incomplete; no verified synthesis available");
  setItems(deliverables(sanitizeIntake(intake),report,mode));
 }catch(e){setError(e instanceof Error?e.message:"Unable to complete council research")}finally{setWorking(false)}
 };
 const download=()=>{const md=packageMarkdown(intake,items);const blob=new Blob([md],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="DIS-consultation-draft.md";a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
 const copy=async()=>{await navigator.clipboard.writeText(packageMarkdown(intake,items));setAnswer("Copied the complete draft package.")};
 return <section className="lab-section" id="consult"><div className="section-heading"><span className="eyebrow">FROM CONSULTATION TO DELIVERABLES</span><h2>Bring an idea. Leave with a working package.</h2><p>Start with what you know. DIS identifies what must still be verified, drafts practical artifacts, and preserves a path from research to action.</p></div>
 <div className="lab-card"><div className="selection-mode"><button type="button" aria-pressed={mode==="startup"} onClick={()=>setMode("startup")}>Startup and MVP</button><button type="button" aria-pressed={mode==="general"} onClick={()=>setMode("general")}>Any problem</button></div>
 <p className="selection-help">{mode==="startup"?"Prepare a founder consultation: pitch, competition, blue-ocean opportunities and funding research.":"Use the same investigation structure for an organization, service, technology, program or community problem. Startup-specific documents are examples to adapt."}</p>
 <div className="consult-fields">{keys.map((key,i)=><label key={key} htmlFor={"consult-"+key}><span>{i+1}. {labels[key]}</span><textarea id={"consult-"+key} rows={i===0?3:2} value={intake[key]} onChange={e=>setIntake(old=>({...old,[key]:e.target.value}))} maxLength={1200} placeholder={i>3?"Optional—leave blank if unknown. DIS will flag the gap.":"Use plain language; no specialist terminology needed."}/></label>)}</div>
 <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:15}}><button type="button" className="primary-cta" disabled={working} onClick={build}>{working?"Preparing…":"Build my consultation package"}</button><button type="button" disabled={working} onClick={researchWithCouncil}>Add live council critique</button><a href="#council">Customize council</a></div><label className="privacy-consent" style={{display:"block",marginTop:14}}><input type="checkbox" checked={externalConsent} onChange={e=>setExternalConsent(e.target.checked)}/> Allow this consultation question to be shared with external scholarly and AI providers if I request live council analysis. Do not include sensitive or confidential details.</label>{error&&<p role="alert" className="error">{error}</p>}
 {items.length>0&&<div className="consult-output" aria-live="polite"><h3>Your consultation package</h3><p className="truth-note">These are useful editable working drafts, not researched proof, verified investor matches, or guaranteed winning proposals. The council can be convened separately; it is not claimed to have reviewed this package.</p><div className="consult-actions"><button type="button" onClick={download}>Download all drafts (.md)</button><button type="button" onClick={copy}>Copy entire package</button>{answer&&<span role="status">{answer}</span>}</div>{items.map(item=><details key={item.id} className="consult-deliverable"><summary>{item.title} — Draft</summary><pre className="council-text">{item.body}</pre><p>{item.note}</p></details>)}</div>}
 </div></section>
}
