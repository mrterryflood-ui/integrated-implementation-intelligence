"use client";
import {useState} from "react";
import {CASE_SOURCE_REGISTRY,preflightChainwebResearchClaims,type ClaimReviewReport} from "../../../lib/chainweb-claim-assurance";

const reference={
 claimId:"NC24-screening",caseId:"NC24",sourceUrl:CASE_SOURCE_REGISTRY[0].source,
 observedEndpoint:"SCREENING_COMPLETION",claimedEndpoint:"SCREENING_COMPLETION",
 kind:"BENEFICIAL_INTERVENTION_EFFECT",difference:20.29,ci95:[17.85,22.73],
 comparator:"Usual care"
};
export default function ClaimReviewPanel(){
 const [raw,setRaw]=useState("");
 const [outcome,setOutcome]=useState<ClaimReviewReport|null>(null);
 const [parseError,setParseError]=useState("");
 const assess=()=>{
  setParseError("");setOutcome(null);
  try{setOutcome(preflightChainwebResearchClaims(JSON.parse(raw)));}
  catch{setParseError("Invalid JSON. Enter an array of bounded, non-identifying literature claims.");}
 };
 return <section aria-label="ChainWeb source and claims integrity preflight" style={{border:"1px solid #bdcad6",borderRadius:12,padding:16,margin:"20px 0"}}>
  <h2>Test a research claim before it enters the ChainWeb</h2>
  <p>This local preflight checks source-reference consistency, claimed outcomes, confidence intervals, unwarranted equivalence, causal extrapolation and fake independent-review claims. It <strong>does not verify an original journal article or a person’s reviewer identity</strong>.</p>
  <details><summary>Supported public research-case format</summary>
   <p>Copy the example into the editor to test a provisional, noncausal screening claim. The values are curated from the study casebook and still require independent original-source verification.</p>
   <pre style={{overflow:"auto",padding:12,background:"#f1f5f9",fontSize:12}}>{JSON.stringify([reference],null,2)}</pre>
  </details>
  <label style={{display:"block",margin:"14px 0"}}>
   <strong>Claim record JSON (public aggregate only)</strong>
   <textarea aria-label="Research claim JSON" value={raw} rows={6} onChange={e=>{setRaw(e.target.value.slice(0,45000));setOutcome(null);setParseError("");}}
    placeholder='[{"claimId":"...","caseId":"NC24","sourceUrl":"...","observedEndpoint":"SCREENING_COMPLETION","claimedEndpoint":"SCREENING_COMPLETION","kind":"DESCRIPTIVE_ENDPOINT"}]'
    style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:8,padding:10,fontFamily:"monospace",fontSize:12}}/>
  </label>
  <button type="button" onClick={assess} disabled={!raw.trim()}
   style={{padding:"10px 15px",border:"1px solid #56758f",borderRadius:7,cursor:raw.trim()?"pointer":"not-allowed"}}>Check claim integrity</button>
  {parseError&&<p role="alert">{parseError}</p>}
  {outcome&&<div aria-live="polite" role="status" style={{marginTop:14}}>
   <p><b>Decision:</b> {outcome.status.replaceAll("_"," ").toLowerCase()} — {outcome.rejectedCount} of {outcome.claimCount} records rejected.</p>
   <p><b>Always unverified:</b> original-source reproduction, human reviewer independence, causal validity and ChainWeb superiority.</p>
   {outcome.claims.map((x,i)=><article key={i} style={{borderTop:"1px solid #d7e0e9",paddingTop:8}}>
    <b>{x.caseId} / {x.claimId}: {x.status.replaceAll("_"," ").toLowerCase()}</b>
    {x.reasons.length?<ul>{x.reasons.map((reason,j)=><li key={j}>{reason.replaceAll("_"," ").toLowerCase()}</li>)}</ul>:
    <p>No contract error detected; still pending original-source and independent scientific review.</p>}
   </article>)}
   {outcome.notes.length>0&&<details><summary>Limits of the test</summary><ul>{outcome.notes.map((note,i)=><li key={i}>{note}</li>)}</ul></details>}
  </div>}
  <p style={{fontSize:12,marginTop:14}}>Runs in this browser only. No network request, database write, RPLICE method execution or clinical action. Do not enter patient details, contact information or confidential records.</p>
 </section>;
}
