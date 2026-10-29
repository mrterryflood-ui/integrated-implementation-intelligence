"use client";
import {useMemo,useState} from "react";
type GraphNode={id:string,kind:string,label:string,evidence_state:string,metadata:Record<string,unknown>};
type GraphEdge={from_node:string,to_node:string,relation:string};
export type Graph={nodes:GraphNode[],edges:GraphEdge[],state:string,notice?:string};
export default function GraphExplorer({graph}:{graph:Graph}){
 const [search,setSearch]=useState(""),[selected,setSelected]=useState<string|null>(null);
 const nodes=(graph.nodes||[]).filter(n=>!search||[n.label,n.kind,String(n.metadata?.source||"")].join(" ").toLowerCase().includes(search.toLowerCase())).slice(0,50);
 const centered=nodes.find(x=>x.kind==="question")||nodes[0],outer=nodes.filter(n=>n.id!==centered?.id);
 const positions=useMemo(()=>{
  const result=new Map<string,{x:number,y:number}>();
  if(centered)result.set(centered.id,{x:460,y:270});
  outer.forEach((n,i)=>{const radius=170+Math.floor(i/18)*64;const angle=i/(outer.length||1)*2*Math.PI-Math.PI/2;result.set(n.id,{x:460+radius*Math.cos(angle),y:270+radius*Math.sin(angle)})});
  return result;
 },[nodes.map(n=>n.id).join("|")]);
 const active=nodes.find(n=>n.id===selected)||centered;
 const edges=(graph.edges||[]).filter(e=>positions.has(e.from_node)&&positions.has(e.to_node));
 return <div className="dis-graph"><div className="dis-graph-header"><div><h4>My knowledge map</h4><p>Visible connections are discovery relationships. They do not prove a claim, imply causation, or establish a funding match.</p></div><label>Filter nodes<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find questions, sources or people"/></label></div>
 <div className="dis-graph-layout"><svg viewBox="0 0 920 560" width="100%" role="img" aria-label="Saved consultation knowledge map">
 <rect width="920" height="560" fill="#122A3C" rx="16"/>
 {edges.map((e,i)=>{const a=positions.get(e.from_node),b=positions.get(e.to_node);return a&&b?<line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#6E93A4" strokeOpacity=".57" strokeWidth="1.25"/>:null})}
 {nodes.map(n=>{const p=positions.get(n.id);if(!p)return null;const isCenter=n.id===centered?.id;const color=isCenter?"#D8BD86":n.kind==="source"?"#7FB8BD":"#C2D8EB";return <g key={n.id} onClick={()=>setSelected(n.id)} style={{cursor:"pointer"}} aria-label={n.kind+": "+n.label}><circle cx={p.x} cy={p.y} r={isCenter?39:16} fill={color} stroke={selected===n.id?"white":"#23465B"} strokeWidth={selected===n.id?3:1.8}/><title>{n.kind+": "+n.label}</title>{isCenter&&<text x={p.x} y={p.y+5} fill="#183449" fontSize="14" fontWeight="bold" textAnchor="middle">IDEA</text>}</g>})}
 </svg><div className="dis-graph-details"><p className="eyebrow">SELECTED CONNECTION</p>{active?<><h4>{active.label}</h4><p>Type: {active.kind}</p><p>Evidence status: {active.evidence_state}</p>{typeof active.metadata?.sourceUrl==="string"&&/^https:\/\//.test(active.metadata.sourceUrl)&&<a href={active.metadata.sourceUrl} target="_blank" rel="noopener noreferrer">Open original source ↗</a>}<p>No passage-level claim support has been verified.</p></>:<p>No matching nodes.</p>}
 <h5>Accessible node list</h5><ul>{nodes.slice(0,40).map(n=><li key={n.id}><button type="button" aria-pressed={selected===n.id} onClick={()=>setSelected(n.id)}>{n.kind}: {n.label.slice(0,70)}</button></li>)}</ul></div></div>
 </div>;
}
