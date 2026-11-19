"use client";
import {useEffect,useState} from "react";
type Space={id:string;title:string};type DocumentInfo={id:string;filename:string;byte_size:number;extraction_state:string};
type Extract={filename:string;excerpt:string;offset:number;totalCharacters:number;nextOffset:number|null;windowCharacters:number;sourceSha256:string;notice:string};
export default function PerspectiveDocuments({privateReady,onUseText}:{privateReady:boolean;onUseText:(text:string)=>void}){
 const [expanded,setExpanded]=useState(false),[spaces,setSpaces]=useState<Space[]>([]),[workspaceId,setWorkspaceId]=useState(""),[documents,setDocuments]=useState<DocumentInfo[]>([]);
 const [documentId,setDocumentId]=useState(""),[extract,setExtract]=useState<Extract|null>(null),[state,setState]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!expanded||!privateReady)return;let active=true;fetch("/api/workspaces",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Workspaces unavailable");if(active)setSpaces(d.workspaces||[])}).catch(e=>{if(active)setState(String(e.message||"Sign in to use private documents."))});return()=>{active=false}},[expanded,privateReady]);
 useEffect(()=>{if(!workspaceId||!privateReady)return;let active=true;fetch("/api/documents?workspaceId="+encodeURIComponent(workspaceId),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Documents unavailable");if(active)setDocuments(d.documents||[])}).catch(e=>{if(active)setState(String(e.message||"Documents unavailable."))});return()=>{active=false}},[workspaceId,privateReady]);
 async function load(documentId:string,offset=0){setBusy(true);setState("");try{
  const params=new URLSearchParams({workspaceId,documentId,offset:String(offset)});
  const r=await fetch("/api/perspective-translation/source?"+params,{cache:"no-store"});
  const j=await r.json();if(!r.ok)throw Error(j.error||"Excerpt unavailable");
  setExtract(j);setDocumentId(documentId);
 }catch(e){setState(e instanceof Error?e.message:"Document unavailable");setExtract(null)}finally{setBusy(false)}}
 async function upload(e:React.ChangeEvent<HTMLInputElement>){
  const file=e.target.files?.[0];if(!file||!workspaceId)return;setBusy(true);setState("");
  try{
   const form=new FormData();form.append("workspaceId",workspaceId);form.append("file",file);
   const r=await fetch("/api/documents",{method:"POST",body:form});
   const j=await r.json();if(!r.ok)throw Error(j.error||"Upload denied");
   const list=await fetch("/api/documents?workspaceId="+encodeURIComponent(workspaceId),{cache:"no-store"}).then(z=>z.json());
   setDocuments(list.documents||[]);setState("File saved privately; inspect the extracted text and choose a section before enabling AI transfer.");
  }catch(err){setState(err instanceof Error?err.message:"File upload unavailable")}finally{setBusy(false);e.target.value=""}
 }
 return <details className="perspective-documents" onToggle={e=>setExpanded(e.currentTarget.open)}>
  <summary>Use an existing PDF or Word document (private workspace)</summary>
  {!privateReady?<p>Private document access requires verified production sign-in. <a href="/workspace">Open my DIS knowledge</a>. Do not upload confidential or identifying records into the public AI pilot.</p>:<>
  <p>Existing DIS document storage remains owner-scoped. Files are never automatically sent to the AI service. Production upload is restricted to approved beta identities until file scanning and privacy acceptance pass.</p>
  <label>Choose a workspace<select value={workspaceId} onChange={e=>{setWorkspaceId(e.target.value);setDocumentId("");setExtract(null);setDocuments([])}}><option value="">Choose a private workspace</option>{spaces.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select></label>
  {workspaceId&&<><label>PDF or Word upload (invited beta only)<input type="file" accept=".pdf,.docx" disabled={busy} onChange={e=>void upload(e)}/></label>
  <label>Choose a saved document<select value={documentId} onChange={e=>{setDocumentId(e.target.value);setExtract(null);if(e.target.value)void load(e.target.value)}}><option value="">Choose a document</option>{documents.map(d=><option key={d.id} value={d.id}>{d.filename} ({d.extraction_state})</option>)}</select></label></>}
  {extract&&<div><p><strong>{extract.filename}</strong> · section {Math.floor(extract.offset/extract.windowCharacters)+1} of {Math.ceil(extract.totalCharacters/extract.windowCharacters)} · private source fingerprint {extract.sourceSha256?.slice(0,12)||"unavailable"}</p>
   <textarea value={extract.excerpt} readOnly rows={7} aria-label="Private document excerpt preview"/>
   <div className="perspective-actions">
    <button type="button" disabled={busy||extract.offset<=0} onClick={()=>void load(documentId,Math.max(0,extract.offset-extract.windowCharacters))}>Previous section</button>
    <button type="button" disabled={busy||extract.nextOffset===null} onClick={()=>void load(documentId,extract.nextOffset!)}>Next section</button>
    <button type="button" onClick={()=>{onUseText(extract.excerpt.slice(0,9000));setState("This section was placed in the editor. Review the text and grant fresh AI transfer consent if appropriate.")}}>Use this section in Perspective Studio</button>
   </div>
   <p>For documents longer than one section, process and review each section separately. Do not interpret a single-section result as a translation of the complete document.</p>
  </div>}
  {busy&&<p role="status">Working with your private file…</p>}
  {state&&<p role="status">{state}</p>}
  </>}
 </details>;
}
