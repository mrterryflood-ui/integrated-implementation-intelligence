"use client";
import {useEffect,useState} from "react";
type W={id:string,title:string,created_at:string};
type Doc={id:string,filename:string,byte_size:number,extraction_state:string,created_at:string};
export default function WorkspaceClient(){
 const [cases,setCases]=useState<{id:string,title:string,status:string,version:number}[]>([]);
 const [query,setQuery]=useState(""),[hits,setHits]=useState<{id:string,filename:string,preview:string}[]>([]);
 const [items,setItems]=useState<W[]>([]),[title,setTitle]=useState(""),[error,setError]=useState(""),[selected,setSelected]=useState(""),[docs,setDocs]=useState<Doc[]>([]),[busy,setBusy]=useState(false);
 const refresh=async()=>{const r=await fetch("/api/workspaces");if(!r.ok){setError("Unable to load workspaces");return}const j=await r.json();setItems(j.workspaces||[])};
 const refreshDocs=async(id:string)=>{if(!id){setDocs([]);return}const r=await fetch("/api/documents?workspaceId="+encodeURIComponent(id));if(!r.ok){setError("Unable to load documents");return}const j=await r.json();setDocs(j.documents||[])};
 useEffect(()=>{void refresh()},[]);
 const add=async()=>{setError("");const r=await fetch("/api/workspaces",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title})});if(!r.ok){setError("Unable to create workspace");return}setTitle("");await refresh()};
 const refreshCases=async(id:string)=>{const r=await fetch("/api/cases?workspaceId="+encodeURIComponent(id));if(!r.ok){setError("Unable to load decision cases");return}const j=await r.json();setCases(j.cases||[])};
 const search=async()=>{if(!selected||query.trim().length<3)return;setError("");const r=await fetch("/api/documents/search?workspaceId="+encodeURIComponent(selected)+"&q="+encodeURIComponent(query));if(!r.ok){setError("Search unavailable");return}const j=await r.json();setHits(j.results||[])};
 const upload=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f||!selected)return;setBusy(true);setError("");
 try{const form=new FormData();form.append("file",f);form.append("workspaceId",selected);const r=await fetch("/api/documents",{method:"POST",body:form});const j=await r.json();if(!r.ok)throw Error(j.error||"Upload failed");await refreshDocs(selected)}catch(x){setError(x instanceof Error?x.message:"Upload failed")}finally{setBusy(false);e.target.value=""}};
 return <main style={{maxWidth:900,margin:"50px auto",padding:24}}><h1>My DIS knowledge</h1><p>Private research workspaces and source documents. Uploaded material is untrusted evidence until verified; no automatic council conclusions are generated.</p>
 <label htmlFor="title">Workspace name</label><input id="title" value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}/><button disabled={!title.trim()} onClick={add}>Create workspace</button>
 <h2>Workspaces</h2><ul>{items.map(x=><li key={x.id}><button onClick={()=>{setSelected(x.id);void refreshDocs(x.id);void refreshCases(x.id)}}>{x.title}</button></li>)}</ul>
 {selected&&<section><h2>Decision cases and council follow-up</h2><p>Return to previous questions, your checkpoints and evidence metrics. Rechecks occur only when requested.</p><ul>{cases.map(c=><li key={c.id}><a href={"/workspace/case?id="+encodeURIComponent(c.id)}>{c.title}</a> · {c.status} · revision {c.version}</li>)}</ul><a href="/#council">Ask a new question and save its plan</a><h2>Documents</h2><p>Upload one file at a time, up to 5 MB. PDF, DOCX, text, CSV, JSON and email .eml may be text-extracted. Other files are stored privately but may not be searchable. Scanned PDFs may require OCR, which is not enabled.</p><label htmlFor="file">Add document</label><input id="file" type="file" disabled={busy} onChange={upload}/>{busy&&<p role="status">Uploading…</p>}<ul>{docs.map(d=><li key={d.id}>{d.filename} — {d.extraction_state} ({d.byte_size} bytes)</li>)}</ul><h3>Search my documents</h3><label htmlFor="search">Search extracted text</label><input id="search" value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={query.trim().length<3} onClick={search}>Search</button><ul>{hits.map(h=><li key={h.id}><strong>{h.filename}</strong><p>{h.preview}</p></li>)}</ul></section>}
 {error&&<p role="alert">{error}</p>}
 </main>
}
