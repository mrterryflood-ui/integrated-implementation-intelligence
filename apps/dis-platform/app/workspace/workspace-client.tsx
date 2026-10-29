"use client";
import {useEffect,useState} from "react";
type W={id:string,title:string,created_at:string};
export default function WorkspaceClient(){const [items,setItems]=useState<W[]>([]),[title,setTitle]=useState(""),[error,setError]=useState("");
const refresh=async()=>{const r=await fetch("/api/workspaces");if(!r.ok){setError("Unable to load workspaces");return}const j=await r.json();setItems(j.workspaces||[])};
useEffect(()=>{void refresh()},[]);
const add=async()=>{setError("");const r=await fetch("/api/workspaces",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title})});if(!r.ok){setError("Unable to create workspace");return}setTitle("");await refresh()};
return <main style={{maxWidth:900,margin:"50px auto",padding:24}}><h1>My DIS knowledge</h1><p>Private workspaces linked to your verified identity. Evidence and council features are being added in stages.</p><label htmlFor="title">Workspace name</label><input id="title" value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}/><button disabled={!title.trim()} onClick={add}>Create workspace</button>{error&&<p role="alert">{error}</p>}<ul>{items.map(x=><li key={x.id}>{x.title}</li>)}</ul></main>}
