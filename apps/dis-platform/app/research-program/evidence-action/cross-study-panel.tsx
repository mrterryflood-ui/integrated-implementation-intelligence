"use client";
import {useState} from "react";
import {reviewCrossStudyMeasurements,type BoundMeasure,type CrossStudyReview} from "../../../lib/evidence-action-bridge";

export default function CrossStudyPanel({baseline}:{baseline:readonly BoundMeasure[]}){
  const [raw,setRaw]=useState("");
  const [review,setReview]=useState<CrossStudyReview|null>(null);
  const [error,setError]=useState("");
  const example=()=>{
    const row=baseline[0];if(!row)return;
    setRaw(JSON.stringify([{
      id:"repeated-known-source-for-training",title:"Curated NCI Hinds County late-stage colorectal incidence — demonstration",
      sourceUrl:row.indicator.sourceUrl,condition:row.condition,construct:row.construct,
      geography:row.indicator.geography,populationFrame:row.populationFrame,
      period:row.indicator.period,numeratorDefinition:row.indicator.numeratorDefinition,
      denominatorDefinition:row.indicator.denominatorDefinition,unit:row.indicator.unit,
      methodVersion:row.methodVersion,value:row.indicator.value
    }],null,2));
    setReview(null);setError("");
  };
  const assess=()=>{
    setReview(null);setError("");
    try{
      if(raw.length>25000)throw Error("Review input must be 25 KB or less.");
      setReview(reviewCrossStudyMeasurements(JSON.parse(raw),baseline));
    }catch(e){setError(e instanceof Error?e.message:"Invalid public aggregate source JSON.");}
  };
  return <section className="rp-program" aria-labelledby="cross-study-heading">
    <h2 id="cross-study-heading">3. Reconcile studies before calling them comparable</h2>
    <p>Academic papers, registries and program reports can describe related problems using different definitions, populations or instruments. Enter only a manually transcribed, public aggregate source record; this browser check identifies the relationship without authenticating the article or calculating a pooled effect.</p>
    <div className="rp-buttons"><button type="button" onClick={example}>Load existing NCI exercise source</button></div>
    <p className="rp-subtle">The example intentionally repeats the same curated source; it must be identified as shared lineage, not independent evidence. External studies require original article and methods review.</p>
    <label className="rp-field">Public aggregate measurement records (JSON)
      <textarea rows={7} maxLength={25000} value={raw} onChange={e=>{setRaw(e.target.value);setReview(null);setError("");}}
        placeholder='[{"id":"...","title":"...","sourceUrl":"https://...","condition":"colorectal","construct":"DISEASE_INCIDENCE","geography":"...","populationFrame":"...","period":"...","numeratorDefinition":"...","denominatorDefinition":"...","unit":"...","methodVersion":"...","value":null}]'/>
    </label>
    <div className="rp-buttons"><button type="button" disabled={!raw.trim()} onClick={assess}>Review cross-study measurements</button></div>
    {error&&<p role="alert">{error}</p>}
    {review&&<div className="rp-focus" role="status" aria-live="polite">
      <h3>Source report — not independently verified</h3>
      <p>{review.admitted.length} admitted for preliminary comparison; {review.rejected.length} rejected; {review.links.length} condition-matched measurement links. <strong>Pooled estimate: not allowed.</strong></p>
      {review.rejected.length>0&&<details><summary>Rejected source records</summary>
        {review.rejected.map((x,i)=><p key={i}><strong>{x.id}</strong>: {x.reasons.join("; ")}</p>)}
      </details>}
      {review.links.map((link,i)=><article key={link.studyId+"-"+link.baselineId+"-"+i} className="rp-card">
        <h4>{link.studyId} ↔ {link.baselineId}</h4>
        <p><strong>Relationship:</strong> {link.relation.replaceAll("_"," ").toLowerCase()}.</p>
        <p>Independent corroboration: not established. Causal link: not established. Safe to pool: no.</p>
        <ul>{link.issues.map(issue=><li key={issue}>{issue}</li>)}</ul>
      </article>)}
      {review.admitted.length>0&&review.links.length===0&&<p>No matching condition is available in this case. Do not transfer evidence across diseases without its own original research.</p>}
    </div>}
  </section>;
}
