"use client";
import {useState} from "react";
import {reviewAnnualTrajectories,type TrajectoryReview} from "../../../lib/condition-trajectories";

const example={
 condition:"COLORECTAL_CANCER",geography:"Mississippi",geographyLevel:"STATE",
 measure:"ALL_STAGE_INCIDENCE",periodStartYear:2023,periodEndYear:2023,
 value:null,reporting:"MISSING",unit:"PER_100K",sourceId:"cdc-uscs",
 sourceVersion:"REPLACE_WITH_ACTUAL_PUBLICATION",
 populationDefinition:"REPLACE_WITH_PUBLISHED_POPULATION",
 numeratorDefinition:"REPLACE_WITH_PUBLISHED_NUMERATOR",
 denominatorDefinition:"REPLACE_WITH_PUBLISHED_DENOMINATOR",
 sex:"ALL",raceEthnicity:"All races and ethnicities",
 ageStandard:"2000 US standard",stageDefinition:"ALL STAGES",
 ascertainment:"REPLACE_WITH_PUBLISHED_REGISTRY_METHOD"
} as const;

export default function TrajectoryPanel(){
 const [input,setInput]=useState("");
 const [report,setReport]=useState<TrajectoryReview>(reviewAnnualTrajectories([]));
 const [error,setError]=useState("");
 const assess=()=>{
  setError("");
  try{setReport(reviewAnnualTrajectories(JSON.parse(input)));}
  catch{setError("Invalid JSON. Supply an array of annual public aggregate observations matching the documented fields.");}
 };
 return <section aria-label="Annual disease trajectory validity laboratory"
  style={{padding:18,border:"1px solid #ccd5df",borderRadius:12,marginBlock:18}}>
  <h2>ChainWeb: test actual disease trajectories, not pooled snapshots</h2>
  <p>The existing cancer dataset summarizes 2019–2023, while the women's-health survey combines 2022–2023 diagnoses. Neither contains five independent annual observations. Those references remain valuable for orientation, but <strong>an annual trend cannot be calculated from them</strong>. This preflight starts with no invented time-series values.</p>
  <p>To test a longitudinal claim, enter genuine annual public aggregates from an appropriate source, with the original observation year, disease definition, geography, population, age standard and denominator. All five consecutive years must describe the same construct. A single result is never proof of prevention, causation or effective implementation.</p>
  <details>
   <summary>Inspect the required public-data record format</summary>
   <p>This example has a deliberately missing value. It illustrates the data contract and is <strong>not</strong> a measured or synthetic health result. Replace every placeholder with a reproducible source-specific definition.</p>
   <pre style={{maxHeight:300,overflow:"auto",background:"#eef3f8",padding:12,fontSize:12}}>{JSON.stringify([example],null,2)}</pre>
   <p>Accepted conditions: colorectal cancer, lung cancer, female breast cancer, endometriosis, PCOS, uterine fibroids. Allowed metrics: all-stage incidence, late-stage incidence, late-stage share, mortality or ever-diagnosed percentage. Values must retain their own denominators. This interface processes public aggregate rows locally; do not paste patient-level records.</p>
  </details>
  <label style={{display:"block",marginBlock:12}}>
   <strong>Annual public aggregate observations (JSON array)</strong>
   <textarea aria-label="Annual public aggregate observations JSON" rows={7} value={input}
    onChange={e=>{setInput(e.target.value.slice(0,800000));setError("");}}
    placeholder="Paste source-qualified annual public aggregate records. There are no prefilled trends."
    style={{display:"block",boxSizing:"border-box",width:"100%",fontFamily:"monospace",fontSize:12,padding:10,marginTop:8}}/>
  </label>
  <button type="button" disabled={!input.trim()} onClick={assess}
   style={{padding:"10px 14px",border:"1px solid #597487",borderRadius:7,cursor:input.trim()?"pointer":"not-allowed"}}>
   Assess series and comparability
  </button>
  <p style={{fontSize:12}}>Analysis stays in this browser session: no upload, storage or RPLICE MCP call. Human specialist-method selection remains in the existing Research Studio.</p>
  {error&&<p role="alert">{error}</p>}
  <div role="status" aria-live="polite" style={{marginTop:14}}>
   <strong>Review status: {report.status.replaceAll("_"," ").toLowerCase()}</strong>
   <p>Source state: operator-supplied, <strong>not independently reproduced</strong>. Causal effects: not established.</p>
  </div>
  {report.issues.length>0&&<div aria-label="Validity warnings"><strong>Evidence and comparison requirements</strong><ul>{report.issues.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
  {report.series.length>0&&<div style={{overflowX:"auto",marginTop:12}}>
   <table style={{width:"100%",minWidth:620,textAlign:"left",borderCollapse:"collapse"}}>
    <caption style={{textAlign:"left"}}>Descriptive analyses of supplied series only; not clinical or causal assessments</caption>
    <thead><tr><th scope="col">Condition / geography</th><th scope="col">Measure</th><th scope="col">Annual years</th><th scope="col">Readiness</th><th scope="col">Descriptive slope per year</th></tr></thead>
    <tbody>{report.series.map((s,i)=><tr key={i} style={{borderTop:"1px solid #d4dee7"}}>
     <th scope="row" style={{padding:8}}>{s.condition.replaceAll("_"," ").toLowerCase()} / {s.geography}</th>
     <td style={{padding:8}}>{s.measure.replaceAll("_"," ").toLowerCase()}</td>
     <td style={{padding:8}}>{s.years[0]}–{s.years[s.years.length-1]} ({s.points} records)</td>
     <td style={{padding:8}}>{s.status.replaceAll("_"," ").toLowerCase()}</td>
     <td style={{padding:8}}>{s.slopePerYear===null?"Not estimable":String(s.slopePerYear)}</td>
    </tr>)}</tbody>
   </table>
   {report.series.some(s=>s.reasons.length>0)&&<details><summary>Read the specific failed-series tests</summary>
    <ul>{report.series.filter(s=>s.reasons.length>0).map((s,i)=><li key={i}><b>{s.condition} / {s.geography}</b>: {s.reasons.join(" ")}</li>)}</ul>
   </details>}
  </div>}
  <p><strong>ChainWeb next research move:</strong> after original annual data are independently reproduced, test hypothesized biological, environmental, occupational, care-access and policy links using time-aligned measures, falsifying alternatives and actual affected-stakeholder evidence. Any selected SALP, CFIR, RE-AIM or Parallax analysis remains a separate human-controlled decision.</p>
 </section>;
}
