"use client";
import {useMemo,useState} from "react";
import {calibrationExplanations,matchesReproducedCalibrationReference,type CalibrationSupplement} from "../../../lib/pilot-calibration-supplement";
import {marginalSourceUrl,matchesReproducedMarginalReference,type CrcMarginalSupplement} from "../../../lib/crc-marginal-supplement";
export default function CalibratedEvidencePanel({snapshot:s,marginals:m}:{snapshot:CalibrationSupplement;marginals?:CrcMarginalSupplement}){
 const [study,setStudy]=useState("county");
 const explanations=useMemo(()=>calibrationExplanations(s),[s]);
 const referenceMatched=useMemo(()=>matchesReproducedCalibrationReference(s)&&(!m||matchesReproducedMarginalReference(m)),[s,m]);
 const fmt=(n:number,d=1)=>n.toFixed(d);
 return <section className="rp-program" aria-labelledby="calibrated-heading">
  <h2 id="calibrated-heading">{referenceMatched?"Reproduced pilot evidence and the decision it supports":"Saved study declarations requiring source review"}</h2>
  <p>{referenceMatched?"These source-bound records match registered reproduced references.":"These saved values have not matched a registered reproduced reference. Metadata validity and copied source hashes do not establish numerical reproduction."} The snapshots are separate from the historical case below. Every field is retained when the investigation is saved. No live patient feed, causal mechanism or field benefit is established.</p>
  <label className="rp-field">Inspect a calibrated study<select aria-label="Inspect a calibrated study" value={study} onChange={e=>setStudy(e.target.value)}>
   <option value="county">Colorectal · matched counties</option>{m&&<option value="marginals">Colorectal · age and race patterns</option>}<option value="national">Three cancers · measurement sensitivity</option><option value="survey">Women's health · reported diagnosis</option>
  </select></label>
  <div aria-live="polite">
  {study==="county"&&<>
   <p><strong>Decision:</strong> investigate why population burden differs before choosing a correction. Observed late-stage rate contrast: {fmt(s.county.contrasts.late_stage_rate_difference)} per100,000 annually. Published case-share contrast: {fmt(s.county.contrasts.share_difference_pp)} percentage points. These answer different questions.</p>
   <p>{s.county.period} · {s.county.scope}. {s.county.meaning}.</p>
   <div className="rp-table-wrap"><table><thead><tr><th>County</th><th>All-stage rate /100,000 (95%CI)</th><th>Late-stage rate /100,000 (95%CI)</th><th>{referenceMatched?"Published":"Declared"} late-stage case share</th><th>Average annual late cases</th></tr></thead>
    <tbody>{s.county.rows.map(r=><tr key={r.fips}><th scope="row">{r.name}, {r.fips==="28049"?"MS":"TX"}<div className="rp-small-code">FIPS {r.fips}</div></th><td>{fmt(r.all.rate_per_100k)} ({r.all.ci95.map(x=>fmt(x)).join("–")})</td><td>{fmt(r.late.rate_per_100k)} ({r.late.ci95.map(x=>fmt(x)).join("–")})</td><td>{fmt(r.late.late_share_percent)}%</td><td>{r.late.annual_count}</td></tr>)}</tbody>
   </table></div>
   <p><strong>Next evidence:</strong> {s.county.nextTest}.</p><p>{s.county.stageShareDefinition}.</p>
   <details><summary>Interpretation and rival mechanisms</summary><p>{explanations.county.finding}</p><ul>{explanations.county.cannotConclude.map(x=><li key={x}>{x}</li>)}</ul></details>
  </>}
  {study==="marginals"&&m&&<>
   <p><strong>Decision:</strong> test whether the countywide picture holds within relevant groups before choosing a correction. Separate age and race marginal estimates reveal questions the aggregate cannot resolve; they do not select a cause.</p>
   <p>{m.period} · both sexes. Age panels use all races including Hispanic; race panels use all ages. Rates are per100,000 residents within the published scope; intervals belong to each source estimate.</p>
   <div className="rp-table-wrap"><table><thead><tr><th>Marginal group</th><th>County</th><th>All-stage rate (95%CI)</th><th>Late-stage rate (95%CI)</th><th>Published late-stage case share</th></tr></thead>
    <tbody>{m.strata.flatMap(row=>row.counties.map(c=><tr key={row.dimension+row.code+c.fips}><th scope="row">{row.label}</th><td>{c.name}</td><td>{c.all.ratePer100k===null?"Suppressed / missing":fmt(c.all.ratePer100k)+" ("+c.all.ci95?.map(x=>fmt(x)).join("–")+")"}</td><td>{c.late.ratePer100k===null?"Suppressed / missing":fmt(c.late.ratePer100k)+" ("+c.late.ci95?.map(x=>fmt(x)).join("–")+")"}</td><td>{c.late.lateCaseSharePercent===null?"Unavailable":fmt(c.late.lateCaseSharePercent)+"%"}</td></tr>))}</tbody>
   </table></div>
   <p><strong>Next evidence:</strong> {m.nextTest}</p><ul>{m.limits.map(x=><li key={x}>{x}</li>)}</ul>
   <details><summary>Sixteen marginal source records</summary><p>Complete source receipt SHA256: {m.sourceReceiptSha256}. Source URLs share a published endpoint; the exact queries and original-byte hashes are retained for each cell.</p><ul>{m.sources.map(x=><li key={x.id}><a href={marginalSourceUrl(m,x.id)} target="_blank" rel="noreferrer">{x.id}</a><br/><span className="rp-small-code">SHA256 {x.sha256}</span></li>)}</ul></details>
  </>}
  {study==="national"&&<>
   <p><strong>Decision:</strong> choose the measure that fits the planning question before ranking places or transferring a disease explanation.</p>
   <p>{s.national.states} states, {s.national.period}. {s.national.scope}. Excludes US aggregate, DC and Puerto Rico.</p>
   <div className="rp-table-wrap"><table><thead><tr><th>Cancer pair</th><th>Construct</th><th>Pearson r</th><th>Conditional IID Fisher95% interval</th><th>Conditional permutation p</th></tr></thead>
    <tbody>{s.national.correlations.map(r=><tr key={r.construct+r.pair.join()}><th scope="row">{r.pair.join(" / ")}</th><td>{r.construct==="rate"?"Late-stage population rate":"Published late-stage case share"}</td><td>{fmt(r.pearson,3)}</td><td>{r.conditionalIidFisher95.map(x=>fmt(x,3)).join("–")}</td><td>{r.conditionalExchangeablePermutationP.toPrecision(3)}</td></tr>)}</tbody>
   </table></div>
   <p><strong>Limits:</strong> {s.national.uncertaintyLimit}</p><p><strong>Next evidence:</strong> {s.national.nextTest}.</p>
  </>}
  {study==="survey"&&<>
   <p><strong>Decision:</strong> distinguish occurrence, recognition, access, recall and selection before claiming underdiagnosis or selecting a tool.</p>
   <p>{s.survey.period} · {s.survey.population}. {s.survey.domainNote}. Literal interview20–49 n={s.survey.literalInterview20to49N}; age-50 eligibility sensitivity n={s.survey.eligibilityAge50SensitivityN}.</p>
   <div className="rp-table-wrap"><table><thead><tr><th>Condition</th><th>{referenceMatched?"NCHS published%":"Declared published%"}</th><th>{referenceMatched?"Reproduced":"Declared"} eligibility sensitivity%</th><th>Taylor SE (pp)</th><th>Item valid / excluded n</th></tr></thead>
    <tbody>{s.survey.conditions.map(c=><tr key={c.code}><th scope="row">{c.label}</th><td>{fmt(c.publishedPercent)}</td><td>{fmt(c.eligibilitySensitivity.percent,3)}</td><td>{fmt(c.eligibilitySensitivity.taylor_se_pp,3)}</td><td>{c.eligibilitySensitivity.n_valid} / {c.eligibilitySensitivity.n_excluded}</td></tr>)}</tbody>
   </table></div>
   <p><strong>Next evidence:</strong> {s.survey.nextTest}.</p>
   <details><summary>Public groups and separate standardized contrasts</summary>
    <p>{s.survey.standardization.interpretation}. Bands20–29,30–39,40–50; weights1/3 each. Group crude percentages use the eligibility sensitivity domain. The contrast intervals below are for standardized group-minus-overall differences; they are not intervals around crude percentages. Code4 combines other/multiple races and does not identify an Asian-specific estimate.</p>
    {s.survey.conditions.map(c=><div key={c.code}><h3>{c.label}</h3><div className="rp-table-wrap"><table><thead><tr><th>Public group</th><th>Crude reported diagnosis%</th><th>Standardized group−overall (pp)</th><th>Unadjusted95% contrast interval (pp)</th></tr></thead>
      <tbody>{c.publicGroups.map(g=><tr key={g.code}><th scope="row">{g.label.replaceAll("_"," ")}</th><td>{fmt(g.crudePercent,2)}</td><td>{fmt(g.standardizedGroupMinusOverall.estimatePp,2)}</td><td>{g.standardizedGroupMinusOverall.unadjusted95CiPp.map(x=>fmt(x,2)).join("–")}</td></tr>)}</tbody></table></div></div>)}
   </details>
  </>}
  </div>
  <details><summary>{referenceMatched?"Source lineage and exact retained evidence":"Declared source lineage and retained record"}</summary>
   <p>Snapshot {s.id}. Captured {s.sourceCaptureCompletedAt}; observation windows differ from capture time. Analysis producer {s.analysisProducerRevision}. Consumer revision is recorded separately in the build/review receipt. {s.lineageRule}.</p>
   <ul>{s.sources.map(x=><li key={x.id}><a href={x.url} target="_blank" rel="noreferrer">{x.id.replaceAll("_"," ")}</a> · {x.scope}<br/><span className="rp-small-code">SHA256 {x.sha256}</span></li>)}</ul>
   <p>NSFG archive and extracted CSV are separate objects. CSV SHA256: <span className="rp-small-code">{s.survey.publicCsvSha256}</span>.</p>
   <p>Analysis artifact SHA256: <span className="rp-small-code">{s.artifacts.analysisSha256}</span>. Follow-up artifact SHA256: <span className="rp-small-code">{s.artifacts.reviewFollowupSha256}</span>.</p>
  </details>
 </section>;
}
