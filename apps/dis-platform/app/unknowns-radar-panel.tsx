"use client";
import {useMemo,useState} from "react";
import {generateUnknowns,type UnknownPriority,type UnknownStatus} from "../lib/unknowns-radar";
import type {Intake} from "../lib/consultation";
import type {IntelligenceBundle} from "../lib/consultation-research";
export default function UnknownsRadar({intake,bundle,onResearch}:{intake:Intake,bundle?:IntelligenceBundle|null,onResearch?:()=>void}){
 const [filter,setFilter]=useState<"all"|"notasked"|"unverified"|"blocking">("notasked");
 const [expanded,setExpanded]=useState(false);
 const data=useMemo(()=>generateUnknowns(intake,bundle),[intake,bundle]);
 if(intake.mission.trim().length<8)return null;
 const shown=data.questions.filter(q=>filter==="all"||filter==="notasked"&&q.status==="NOT_ASKED"||filter==="unverified"&&q.status==="ASKED_BUT_UNVERIFIED"||filter==="blocking"&&q.priority==="RELEASE_BLOCKER");
 const list=expanded?shown:shown.slice(0,4);
 return <section className="unknowns-radar" aria-label="The questions you may not know to ask">
 <div className="unknowns-head"><div><span className="eyebrow">BEYOND YOUR ORIGINAL QUESTION</span><h3>Here's what you asked. Here's what we still need to discover.</h3><p>DIS examines the surrounding system, including assumptions, missing stakeholders, alternatives, risks and other questions you may not have known to ask.</p></div><div className="unknowns-metrics"><strong>{data.notAsked}<small>Not yet asked</small></strong><strong>{data.unanswered}<small>Raised but unverified</small></strong></div></div>
 <div className="unknowns-tags"><span>Context: {data.mode==="REAL_ESTATE"?"Property / land / homeowner decisions":"Cross-domain consultation"}</span>{data.assetTracks.map(x=><span key={x}>{x}</span>)}</div>
 <div className="unknowns-filter" role="group" aria-label="Filter blind spots">
 {[["notasked","What you didn't ask"],["unverified","What still needs proof"],["blocking","Decision blockers"],["all","Everything"]].map(([key,title])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>{setFilter(key as typeof filter);setExpanded(false)}}>{title}</button>)}
 </div>
 <div className="unknowns-grid">{list.map(x=><article key={x.id} className="unknowns-item">
 <div className="unknowns-meta"><span>{x.priority==="RELEASE_BLOCKER"?"REVIEW BEFORE ACTION":x.priority==="HIGH"?"HIGH PRIORITY":"EXPLORE"}</span><span>{x.status==="NOT_ASKED"?"NOT ASKED": "RAISED / UNVERIFIED"}</span></div>
 <h4>{x.question}</h4><p>{x.why}</p><details><summary>How do we find out?</summary><p><strong>Next action:</strong> {x.nextStep}</p><p><strong>Evidence standard:</strong> {x.evidence}</p><p><strong>Decision gate:</strong> {x.gate}</p>{x.source&&<p><a href={x.source.url} target="_blank" rel="noopener noreferrer">Official reference: {x.source.title}</a></p>}</details>
 </article>)}</div>
 {shown.length>4&&<button type="button" className="unknowns-more" onClick={()=>setExpanded(!expanded)}>{expanded?"Show fewer":"Explore all "+shown.length+" questions"} ↗</button>}
 <div className="unknowns-foot"><p>{data.notice}</p>{onResearch&&<button type="button" onClick={onResearch}>Review research sources ↗</button>}</div>
 </section>
}
