"use client";
import {useEffect,useMemo,useState} from "react";
import {sanitizeIntake,type Intake} from "../lib/consultation";
import {buildPackage,renderPackageMarkdown,type ConsultationPackage,type SlideSpec} from "../lib/consultation-package";
import type {IntelligenceBundle,IntelligenceRecord} from "../lib/consultation-research";
type Space={id:string,title:string};
type Saved={id:string,title:string,version:number,review_status:string};
const label:Record<keyof Intake,string>={
 mission:"What problem or opportunity brought you here?",organization:"Your organization or project",audience:"Who needs this, and who decides or pays?",stage:"What already exists (idea, prototype, MVP, service)?",alternatives:"What solutions are people using today?",traction:"What have you actually tested or measured?",resources:"Available team, budget and constraints",geography:"Target market or geography",desiredOutcome:"What would a successful result look like?"
};
const fields=Object.keys(label) as (keyof Intake)[];
const blank=Object.fromEntries(fields.map(k=>[k,""])) as Intake;
const tabs=["Consult","Investigate","Council review","Design & deliver"] as const;
const palettes={midnight:{ink:"#11283C",paper:"#F9F7F0",accent:"#C7AA75"},forest:{ink:"#143B34",paper:"#F7FAF5",accent:"#D6B980"},slate:{ink:"#263248",paper:"#F7F9FE",accent:"#7F9EC3"}} as const;
type Theme=keyof typeof palettes;
function downloadText(text:string,name:string){const url=URL.createObjectURL(new Blob([text],{type:"text/markdown;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
export default function ConsultationStudio(){
 const [mode,setMode]=useState<"startup"|"general">("startup");
 const [intake,setIntake]=useState<Intake>(blank),[intel,setIntel]=useState<IntelligenceBundle|null>(null),[pkg,setPkg]=useState<ConsultationPackage|null>(null);
 const [tab,setTab]=useState<(typeof tabs)[number]>("Consult"),[slideIndex,setSlideIndex]=useState(0),[theme,setTheme]=useState<Theme>("midnight");
 const [workspaceId,setWorkspaceId]=useState(""),[spaces,setSpaces]=useState<Space[]>([]),[sessions,setSessions]=useState<Saved[]>([]),[savedId,setSavedId]=useState(""),[version,setVersion]=useState(0),[title,setTitle]=useState("");
 const [allowResearch,setAllowResearch]=useState(false),[working,setWorking]=useState(false),[status,setStatus]=useState(""),[error,setError]=useState("");
 const [councilReport,setCouncilReport]=useState<any>(null),[filter,setFilter]=useState("all"),[query,setQuery]=useState("");
 const [review,setReview]=useState<"DRAFT"|"REVIEWED"|"APPROVED">("DRAFT");
 const [importJson,setImportJson]=useState("");
 const current=useMemo(()=>pkg?.slides[slideIndex]||null,[pkg,slideIndex]);
 const count=pkg?.quality.sources||0;
 const filteredRecords=(intel?.records||[]).filter(r=>(filter==="all"||r.kind===filter)&&(!query||[r.title,r.summary,r.source].join(" ").toLowerCase().includes(query.toLowerCase())));
 useEffect(()=>{fetch("/api/workspaces").then(r=>r.ok?r.json():null).then(v=>{if(v?.workspaces?.length){setSpaces(v.workspaces);setWorkspaceId(v.workspaces[0].id)}}).catch(()=>{})},[]);
 useEffect(()=>{if(!workspaceId){setSessions([]);return}fetch("/api/consultation/sessions?workspaceId="+encodeURIComponent(workspaceId)).then(r=>r.ok?r.json():null).then(v=>setSessions(v?.sessions||[])).catch(()=>{})},[workspaceId]);
 const update=(key:keyof Intake,value:string)=>setIntake(old=>({...old,[key]:value}));
 const generate=(researchIntel:IntelligenceBundle|null=intel,report:any=councilReport)=>{const result=buildPackage(sanitizeIntake(intake),mode,researchIntel,report?.deliberation?.synthesis?report:undefined);setPkg(result);setSlideIndex(0);setStatus("Draft consultation package built. Review the evidence gates and edit any slides or reports.");setError("");return result};
 const investigate=async()=>{if(!allowResearch){setError("Give permission before sending this question to external research services.");return}if(intake.mission.trim().length<8){setError("Describe your problem first.");return}setWorking(true);setError("");setStatus("Querying public scholarly and federal indexes…");
 try{const response=await fetch("/api/consultation/research",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({intake,externalConsent:true})});const result=await response.json();if(!response.ok)throw Error(result.error||"Research unavailable");
  setIntel(result);generate(result,councilReport);setStatus(result.records.length+" source records collected. Eligibility, competitive fit and individual claims still require verification.");setTab("Investigate");
 }catch(e){setError(e instanceof Error?e.message:"Research failed")}finally{setWorking(false)}};
 const importResearch=()=>{try{
  if(importJson.length>65000)throw Error("Research bundle is too large (65 KB maximum).");
  const parsed=JSON.parse(importJson);
  const supplied=Array.isArray(parsed)?parsed:parsed&&Array.isArray(parsed.records)?parsed.records:null;
  if(!supplied||supplied.length>60)throw Error("Paste JSON with up to 60 entries in a records array.");
  const types=new Set(["SCHOLARLY","OPEN_GRANT","PAST_AWARD","LANDSCAPE_LEAD","TECHNICAL_REPORT","REGULATION"]);
  const now=new Date().toISOString();
  const records=supplied.flatMap((record:unknown,i:number)=>{if(!record||typeof record!=="object")return [];const r=record as Record<string,unknown>;
   if(typeof r.title!=="string"||typeof r.url!=="string"||!/^https:\/\/[^\s]+$/.test(r.url)||r.url.length>500)return [];
   return [{id:"IMP"+(i+1),kind:typeof r.kind==="string"&&types.has(r.kind)?r.kind as IntelligenceRecord["kind"]:"LANDSCAPE_LEAD" as const,title:r.title.slice(0,250),summary:typeof r.summary==="string"?r.summary.slice(0,500):"Imported source lead; content not independently verified.",source:typeof r.source==="string"?r.source.slice(0,90):"User-supplied research",url:r.url.slice(0,500),retrievedAt:now,sourceStatus:"DISCOVERY_ONLY" as const}];
  });
  if(!records.length)throw Error("No valid HTTPS source records were found.");
  const combined:IntelligenceBundle={query:"User-approved imported research",retrievedAt:now,records:[...(intel?.records||[]),...records].slice(0,80),errors:intel?.errors||[],coverage:{...(intel?.coverage||{}),userImport:"USER_PROVIDED_UNVERIFIED"},researchStandard:"Imported records remain discovery leads even if ChatGPT or another tool described them as authoritative. Verify official source text, dates, fit and claim-level support independently."};
  setIntel(combined);generate(combined,councilReport);setStatus("Imported "+records.length+" source lead(s) with unverified provenance. Review originals before making claims.");setError("");setImportJson("");
 }catch(e){setError(e instanceof Error?e.message:"Invalid research JSON")}};
 const debate=async()=>{if(!allowResearch){setError("External research and inference require your permission.");return}setWorking(true);setStatus("Conducting primary analysis, challenge and synthesis…");setError("");
 try{const q=[intake.mission,intake.audience,intake.organization,intake.stage,intake.alternatives,intake.traction,intake.desiredOutcome].filter(Boolean).join("\n");
  const response=await fetch("/api/council",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt:q,count:6,redCount:4,depth:"Deep",selectionMode:"auto",challengeEnabled:true,allowExternalResearch:true})});
  const report=await response.json();if(!response.ok)throw Error(report.error||"Council unavailable");
  setCouncilReport(report);generate(intel,report);setTab("Council review");setStatus(report.deliberation?.synthesis?"Preliminary council analysis attached. Source support and proposed outcomes remain unverified.":"Council incomplete. No fabricated consensus.");if(!report.deliberation?.synthesis)setError(report.error||report.notice||"Model inference incomplete");
 }catch(e){setError(e instanceof Error?e.message:"Council unavailable")}finally{setWorking(false)}};
 const editSlide=(next:Partial<SlideSpec>)=>setPkg(p=>!p?null:{...p,slides:p.slides.map((s,i)=>i===slideIndex?{...s,...next}:s)});
 const editDoc=(id:string,body:string)=>setPkg(p=>!p?null:{...p,documents:p.documents.map(x=>x.id===id?{...x,body,validation:"DRAFT"}:x)});
 const save=async()=>{if(!pkg||!workspaceId){setError("Sign in and select a workspace to save this consultation.");return}setWorking(true);setError("");
 try{
  let id=savedId,ver=version;
  if(!id){const a=await fetch("/api/consultation/sessions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({workspaceId,intake,mode,title:title||intake.organization||"Consultation"})});const j=await a.json();if(!a.ok)throw Error(j.error||"Unable to create session");id=j.session.id;ver=j.session.version;setSavedId(id);setTitle(j.session.title)}
  const b=await fetch("/api/consultation/sessions",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,version:ver,slides:pkg.slides,artifacts:pkg.documents,research:{...intel,designTheme:theme,mode},reviewStatus:review})});const result=await b.json();if(!b.ok)throw Error(result.error||"Save failed");
  setVersion(result.session.version);setStatus("Saved to your private workspace, revision "+result.session.version+".");await refreshSessions();
 }catch(e){setError(e instanceof Error?e.message:"Save unavailable")}finally{setWorking(false)}};
 const refreshSessions=async()=>{if(!workspaceId)return;const r=await fetch("/api/consultation/sessions?workspaceId="+encodeURIComponent(workspaceId));if(r.ok)setSessions((await r.json()).sessions||[])};
 const load=async(id:string)=>{setWorking(true);setError("");try{const response=await fetch("/api/consultation/sessions?id="+encodeURIComponent(id));const data=await response.json();if(!response.ok)throw Error(data.error||"Consultation unavailable");const s=data.session;
  const restored=s.intake||{},m=restored.mode==="general"?"general":"startup";const i=sanitizeIntake(restored);
  setIntake(i);setMode(m);setIntel(s.research?.records?s.research:null);setCouncilReport(null);const p=buildPackage(i,m,s.research?.records?s.research:null);
  if(Array.isArray(s.slides)&&s.slides.length===12)p.slides=s.slides;
  if(Array.isArray(s.artifacts)&&s.artifacts.length)p.documents=s.artifacts;
  setPkg(p);setSavedId(id);setVersion(s.version);setTitle(s.title);setReview(s.review_status);setTheme((["midnight","forest","slate"].includes(s.research?.designTheme)?s.research.designTheme:"midnight") as Theme);setTab("Design & deliver");setStatus("Loaded saved consultation. Review changes before exporting.");
 }catch(e){setError(e instanceof Error?e.message:"Unable to load saved consultation")}finally{setWorking(false)}};
 const exportOffice=async(format:"pptx"|"docx")=>{if(!pkg)return;setWorking(true);setError("");setStatus("Creating editable "+format.toUpperCase()+" document…");
 try{const response=await fetch("/api/consultation/export",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({format,intake,mode,slides:pkg.slides,intelligence:intel,theme})});
  if(!response.ok){const j=await response.json().catch(()=>({}));throw Error(j.error||"Export unavailable")}
  const blob=await response.blob(),url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=format==="pptx"?"Dynamic-Intelligence-Pitch.pptx":"Dynamic-Intelligence-Consultation.docx";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus("Editable file generated. Review citations and all factual claims before circulation.");
 }catch(e){setError(e instanceof Error?e.message:"Export failed")}finally{setWorking(false)}};
 const reset=()=>{setIntake(blank);setPkg(null);setIntel(null);setSavedId("");setVersion(0);setCouncilReport(null);setReview("DRAFT");setStatus("New consultation started.");setTab("Consult")};
 return <section id="consult" className="lab-section consult-studio"><div className="section-heading"><span className="eyebrow">YOUR DECISION-TO-DELIVERY STUDIO</span><h2>Walk in with a question. Leave with an actionable package.</h2><p>Explore customers, science, funding and competing approaches, convene a challenge council, design a pitch, and keep editable deliverables in your private knowledge workspace.</p></div>
 <div className="lab-card">
 <div className="selection-mode" aria-label="Consultation type"><button type="button" aria-pressed={mode==="startup"} onClick={()=>setMode("startup")}>Founder & MVP</button><button type="button" aria-pressed={mode==="general"} onClick={()=>setMode("general")}>Any question or organization</button><button type="button" onClick={reset}>New consultation</button></div>
 <div className="consult-tabs" role="tablist" aria-label="Consultation workflow">{tabs.map((x,i)=><button key={x} role="tab" type="button" aria-selected={tab===x} onClick={()=>setTab(x)}>{i+1}. {x}</button>)}</div>
 {tab==="Consult"&&<div className="consult-panel"><h3>Tell us what you know</h3><p>Only the problem is required. The rest can be discovered, challenged or added later.</p><div className="consult-fields">{fields.map((k,i)=><label key={k} htmlFor={"ci-"+k}><strong>{label[k]}</strong><textarea id={"ci-"+k} rows={i===0?3:2} maxLength={1200} placeholder={i?"Optional—DIS will flag anything unknown":"Describe the outcome you want to change"} value={intake[k]} onChange={e=>update(k,e.target.value)}/></label>)}</div><button className="primary-cta" disabled={working||intake.mission.trim().length<8} onClick={()=>{generate();setTab("Design & deliver")}}>Build the first package →</button></div>}
 {tab==="Investigate"&&<div className="consult-panel"><h3>Research the landscape</h3><p>Discover open government opportunities, historical awards, scientific research, regulations and market leads. Every returned record retains its source and retrieval date.</p><label className="privacy-consent"><input type="checkbox" checked={allowResearch} onChange={e=>setAllowResearch(e.target.checked)}/> I consent to sending this consultation question to external public research and AI services; no private files are included.</label><button type="button" className="primary-cta" disabled={working} onClick={investigate}>{working?"Investigating…":"Search live public records"}</button>
 <details className="research-import"><summary>Bring research from ChatGPT, SciSpace, Sider Scholar, or another source</summary><p>Paste JSON containing a <code>records</code> array. Each record needs <code>title</code> and an HTTPS <code>url</code>; optional fields are <code>source</code>, <code>kind</code>, and <code>summary</code>. Imported facts stay unverified until original-source checks.</p><textarea rows={5} value={importJson} onChange={e=>setImportJson(e.target.value)} placeholder='{"records":[{"title":"Example study","url":"https://doi.org/10.1234/example","source":"Scholarly index","kind":"SCHOLARLY"}]}'/><button type="button" onClick={importResearch} disabled={!importJson.trim()}>Import into evidence review</button></details>{intel&&<><p className="truth-note">{intel.records.length} records · {intel.retrievedAt}. Official records still require eligibility and claim verification.</p><div className="research-filters"><label>Source type <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All records</option>{[...new Set(intel.records.map(r=>r.kind))].map(k=><option key={k}>{k}</option>)}</select></label><label>Find in results <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search titles and descriptions"/></label></div>
 <div className="research-results">{filteredRecords.map(r=><article key={r.id}><span>{r.kind.replaceAll("_"," ")} · {r.sourceStatus}</span><h4><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a></h4><p>{r.summary}</p><small>{r.source} · {r.retrievedAt}</small></article>)}</div>
 {intel.errors.length>0&&<details><summary>Sources not available ({intel.errors.length})</summary><ul>{intel.errors.map((e,i)=><li key={i}>{e}</li>)}</ul></details>}
 <p>{intel.researchStandard}</p></>}
 </div>}
 {tab==="Council review"&&<div className="consult-panel"><h3>Challenge the ideas, not just the presentation</h3><p>Multiple model calls examine the issue from distinct perspectives. The critical path keeps disagreement, unknowns and evidence limitations visible.</p><label className="privacy-consent"><input type="checkbox" checked={allowResearch} onChange={e=>setAllowResearch(e.target.checked)}/> I consent to external research and AI inference for this question (not private files).</label><button className="primary-cta" disabled={working||intake.mission.length<8} onClick={debate}>{working?"Debating…":"Convene an independent challenge"}</button><p><a href="#council">Customize the wider council first</a></p>
 {councilReport&&<div className="consult-council"><strong>State: {councilReport.state}</strong><p>{councilReport.limitations||councilReport.error}</p>{councilReport.deliberation&&<><h4>Synthesis</h4><pre>{councilReport.deliberation.synthesis}</pre><details><summary>Primary analyses and red-team dissent</summary><pre>{councilReport.deliberation.primaryA}</pre><pre>{councilReport.deliberation.primaryB}</pre><pre>{councilReport.deliberation.challenge}</pre></details></>}</div>}</div>}
 {tab==="Design & deliver"&&<div className="consult-panel"><h3>Design studio and finished draft package</h3>{!pkg?<p>Start a consultation or run research to create your first deliverable package.</p>:<>
 <div className="consult-quality"><strong>{pkg.quality.grade}</strong><span>Source leads: {count}</span><span>Active grant candidates: {pkg.quality.activeOpportunityCandidates}</span><span>Historical awards: {pkg.quality.historicalAwards}</span></div>
 <div className="design-choices"><span>Visual identity</span>{(Object.keys(palettes) as Theme[]).map(k=><button type="button" key={k} aria-pressed={theme===k} onClick={()=>setTheme(k)}>{k}</button>)}</div>
 <div className="design-editor">
 <div className="slide-list" aria-label="Pitch slides">{pkg.slides.map((s,i)=><button type="button" key={s.id} aria-current={i===slideIndex?"step":undefined} onClick={()=>setSlideIndex(i)}>{s.id} · {s.title}</button>)}</div>
 <div>{current&&<><div className="slide-preview" style={{background:palettes[theme].ink,color:palettes[theme].paper,borderLeft:"7px solid "+palettes[theme].accent}}><div className="slide-meta" style={{color:palettes[theme].accent}}>DYNAMIC INTELLIGENCE · {current.kicker.toUpperCase()}</div><h3>{current.title}</h3><ul>{current.bullets.map((b,i)=><li key={i}>{b}</li>)}</ul><span>Working draft · Slide {current.id} of 12</span></div>
 <label>Slide headline<input maxLength={180} value={current.title} onChange={e=>editSlide({title:e.target.value})}/></label><label>Section name<input maxLength={140} value={current.kicker} onChange={e=>editSlide({kicker:e.target.value})}/></label><label>Talking points (one per line)<textarea rows={6} value={current.bullets.join("\n")} onChange={e=>editSlide({bullets:e.target.value.split("\n").slice(0,6).map(x=>x.slice(0,500))})}/></label><label>Speaker notes<textarea rows={4} maxLength={2000} value={current.notes} onChange={e=>editSlide({notes:e.target.value})}/></label></>}
 </div></div>
 <h4>Reports and editable documents</h4><div className="consult-docs">{pkg.documents.map(d=><details key={d.id}><summary>{d.title} · {d.validation}</summary><label>Edit document<textarea rows={9} value={d.body} onChange={e=>editDoc(d.id,e.target.value)}/></label><p>{d.note}</p></details>)}</div>
 <details><summary>Unresolved evidence and acceptance gates ({pkg.quality.knownGaps.length})</summary><ul>{pkg.quality.knownGaps.map(x=><li key={x}>{x}</li>)}</ul></details>
 <div className="consult-actions"><button type="button" disabled={working} onClick={()=>exportOffice("pptx")}>Export editable PowerPoint</button><button type="button" disabled={working} onClick={()=>exportOffice("docx")}>Export Word report</button><button type="button" onClick={()=>downloadText(renderPackageMarkdown(pkg),"DIS-Consultation-Package.md")}>Export Markdown</button></div>
 <div className="consult-save"><h4>Retain the consultation</h4><p>Save or resume a versioned consultation in your own DIS workspace. Saving never authorizes sending or implementation.</p><label>Workspace<select value={workspaceId} onChange={e=>{setWorkspaceId(e.target.value);setSavedId("");setVersion(0)}}><option value="">Sign in to select workspace</option>{spaces.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label><label>Project title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Name this decision package"/></label><label>Review state<select value={review} onChange={e=>setReview(e.target.value as typeof review)}><option>DRAFT</option><option>REVIEWED</option><option>APPROVED</option></select></label><button type="button" disabled={working||!workspaceId} onClick={save}>Save revision to my workspace</button>{savedId&&<small>Saved ID: {savedId} · version {version}</small>}</div>
 </>}</div>}
 <div className="consult-session-bar"><span>Resume a previous consultation:</span><select value={savedId} onChange={e=>{if(e.target.value)void load(e.target.value)}}><option value="">Choose saved project</option>{sessions.map(s=><option key={s.id} value={s.id}>{s.title} · v{s.version}</option>)}</select><a href="/workspace">Manage my workspaces</a></div>
 {status&&<p role="status" className="consult-status">{status}</p>}{error&&<p role="alert" className="error">{error}</p>}
 </div></section>;
}
