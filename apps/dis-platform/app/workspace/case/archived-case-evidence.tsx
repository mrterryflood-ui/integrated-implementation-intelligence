"use client";
import {useState} from "react";
import type {CaseLearningEvent} from "../../../lib/longitudinal-learning";
import SavedCaseEvidence from "./saved-case-evidence";
export default function ArchivedCaseEvidence({event,caseId}:{event:CaseLearningEvent;caseId:string}){
 const [open,setOpen]=useState(false);
 const payload=event.payload&&typeof event.payload==="object"&&!Array.isArray(event.payload)?event.payload as Record<string,unknown>:{};
 const previous=payload.previousReport;
 if(event.event_type!=="REASSESSMENT"||!previous||typeof previous!=="object")return null;
 return <details onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Archived assessment before revision {String(payload.newVersion||"unknown")} · {new Date(event.created_at).toLocaleString()}</summary>
  {open&&<><p>This is the retained earlier report, not a new validation or the current interpretation.</p><SavedCaseEvidence report={previous} caseId={caseId}/><details><summary>Complete archived report</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(previous,null,2)}</pre></details></>}
 </details>;
}
