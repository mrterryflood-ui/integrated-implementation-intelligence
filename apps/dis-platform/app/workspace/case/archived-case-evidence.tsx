"use client";
import {useState} from "react";
import type {CaseLearningEvent} from "../../../lib/longitudinal-learning";
import SavedCaseEvidence from "./saved-case-evidence";
export default function ArchivedCaseEvidence({event,caseId,onRestore,restoring=false}:{event:CaseLearningEvent;caseId:string;onRestore?:(eventId:string)=>Promise<void>;restoring?:boolean}){
 const [open,setOpen]=useState(false);
 const [confirmRestore,setConfirmRestore]=useState(false);
 const payload=event.payload&&typeof event.payload==="object"&&!Array.isArray(event.payload)?event.payload as Record<string,unknown>:{};
 const previous=payload.previousReport;
 if(event.event_type!=="REASSESSMENT"||!previous||typeof previous!=="object")return null;
 return <details onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>Archived assessment before revision {String(payload.newVersion||"unknown")} · {new Date(event.created_at).toLocaleString()}{payload.revisionAction==="RESTORE_PRIOR_ASSESSMENT"?" · Recovery revision":""}</summary>
  {open&&<><p>This is the retained earlier report, not a new validation or the current interpretation.</p><SavedCaseEvidence report={previous} caseId={caseId}/><details><summary>Complete archived report</summary><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(previous,null,2)}</pre></details>
   {onRestore&&<div style={{margin:"16px 0",padding:14,border:"1px solid #c6d3df",borderRadius:8}}>
    {confirmRestore?<><p>Make this archived assessment the current report in a new review revision? Your current report will be archived. The action plan, unsaved edits and all earlier history remain available.</p><button disabled={restoring} onClick={async()=>{await onRestore(event.id);setConfirmRestore(false)}}>Confirm assessment restoration</button>{" "}<button disabled={restoring} onClick={()=>setConfirmRestore(false)}>Cancel restoration</button></>:<button disabled={restoring} onClick={()=>setConfirmRestore(true)}>Restore this assessment</button>}
   </div>}
  </>}
 </details>;
}
