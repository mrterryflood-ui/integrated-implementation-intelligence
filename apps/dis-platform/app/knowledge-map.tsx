"use client";
import {useEffect,useState} from "react";
type Node={id:string,kind:string,label:string,evidence_state:string,metadata:Record<string,unknown>};
type Edge={from_node:string,to_node:string,relation:string};
export default function KnowledgeMap({sessionId}:{sessionId:string}){
 const [nodes,setNodes]=useState<Node[]>([]),[edges,setEdges]=useState<Edge[]>([]),[current,setCurrent]=useState<Node|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const refresh=async()=>{if(!sessionId)return;try{const r=await fetch("/api/consultation/graph?sessionId="+encodeURIComponent(sessionId));if(!r.ok)throw Error("Graph unavailable");const j=await r.json();setNodes(j.nodes||[]);setEdges(j.edges||[]);setCurrent(null)}catch(e){setError(e instanceof Error?e.message:"Graph unavailable")}};
 useEffect(()=>{void refresh()},[sessionId]);
 const sync=async()=>{setBusy(true);setError("");try{const r=await fetch("/api/consultation/graph",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sessionId,confirmSync:true})});const j=await r.json();if(!r.ok)throw Error(j.error||"Graph synchronization failed");await refresh()}catch(e){setError(e instanceof Error?e.message:"Graph unavailable")}finally{setBusy(false)}};
 const center=nodes.find(x=>x.kind==="question")||nodes[0];
 const outer=nodes.filter(n=>n.id!==center?.id).slice(0,36);
 const coords=new Map<string,[number,number]>();
 if(center)coords.set(center.id,[310,210]);
 outer.forEach((n,i)=>{const a=-Math.PI/2+(2*Math.PI*i)/Math.max(1,outer.length);const radius=i%3===0?157:i%3===1?175:195;coords.set(n.id,[310+Math.cos(a)*radius,210+Math.sin(a)*radius])});
 const colors:Record<string,string>={question:"#B79C67",source:"#6F9DB5",organization:"#6BB79C",stakeholder:"#C4A8CE",outcome:"#D5B078",concept:"#A4B4B9"};
 return <section className="consult-graph"><h4>Your evolving knowledge map</h4><p>The map links your question, stakeholders, outcomes and retrieved source leads. Connections are contextual—not established causal relationships or independently proven conclusions.</p>
 <div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" disabled={busy} onClick={sync}>{busy?"Synchronizing…":"Sync my saved evidence map"}</button><button type="button" onClick={()=>void refresh()}>Refresh map</button></div>
 {error&&<p role="alert">{error}</p>}
 {!nodes.length?<p>No graph nodes have been created yet. Save your consultation, then select Sync my saved evidence map.</p>:<>
 <svg viewBox="0 0 620 420" role="img" aria-label={"Knowledge graph of "+nodes.length+" research and decision nodes"} style={{width:"100%",maxWidth:760,background:"#102A3A",borderRadius:16,margin:"15px 0"}}>
 {edges.map((e,i)=>{const a=coords.get(e.from_node),b=coords.get(e.to_node);return a&&b?<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#759BAA" strokeOpacity=".45" strokeWidth="1.5"/>:null})}
 {nodes.map(n=>{const p=coords.get(n.id);if(!p)return null;const isCentral=n.id===center?.id;return <g key={n.id} onClick={()=>setCurrent(n)} style={{cursor:"pointer"}} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")setCurrent(n)}}>
 <circle cx={p[0]} cy={p[1]} r={isCentral?32:11} fill={colors[n.kind]||"#97B4C6"} stroke={current?.id===n.id?"#FFFFFF":"#34586B"} strokeWidth={current?.id===n.id?3:1.2}/>
 {isCentral&&<text x={p[0]} y={p[1]+5} textAnchor="middle" fill="#10283A" fontWeight="bold" fontSize="12">WHY?</text>}
 </g>})}</svg>
 <p>{nodes.length} knowledge nodes · {edges.length} contextual relationships · <strong>claim verification: not completed</strong></p>
 {current&&<article style={{background:"#EFF5F7",padding:14,borderRadius:10}}><strong>{current.kind.toUpperCase()}: {current.label}</strong><p>Evidence status: {current.evidence_state}</p>{typeof current.metadata?.sourceUrl==="string"&&current.metadata.sourceUrl.startsWith("https://")&&<a href={current.metadata.sourceUrl} target="_blank" rel="noopener noreferrer">Open original source</a>}<p>{String(current.metadata?.source||"")}</p></article>}
 </>}
 </section>;
}
