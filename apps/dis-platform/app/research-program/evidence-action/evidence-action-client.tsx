"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {colorectalEvidenceAction} from "../../../lib/evidence-action-colorectal";
import {reviewCounterfactual,reviewCorrectionReceipt,type CounterfactualAudit,
  type CounterfactualRequest,type CorrectionReceipt} from "../../../lib/evidence-action-bridge";
import type {IntelligenceRecord} from "../../../lib/consultation-research";
import CrossStudyPanel from "./cross-study-panel";
import PrivateCaseHandoff from "./private-case-handoff";
import CalibratedEvidencePanel from "./calibrated-evidence-panel";

const SYNTHETIC_PANEL:CounterfactualRequest={
  condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic units, not a cancer rate",
  interventionYear:2021,
  commonMeasurementVersion:"Synthetic demonstration: common formula; no actual registry validation",
  comparisonRationale:"Synthetic demonstration of distinct groups, not selected as real controls",
  parallelTrendsEvidence:"Synthetic demonstration of visual trend checks; no actual real-world design review",
  competingChangesEvidence:"Synthetic demonstration; actual policy and diagnostic changes would need investigation",
  spilloverAssessment:"Synthetic demonstration; actual spillover mapping remains required",
  independentReviewer:"Synthetic design prompt; no actual human review has occurred",
  treated:{site:"Synthetic Area A",populationFrame:"Synthetic matched population",
    observations:[{year:2018,value:10,denominator:100},{year:2019,value:11,denominator:100},
      {year:2020,value:12,denominator:100},{year:2021,value:13,denominator:100},
      {year:2022,value:14,denominator:100}]},
  comparator:{site:"Synthetic Area B",populationFrame:"Synthetic matched population",
    observations:[{year:2018,value:9,denominator:100},{year:2019,value:10,denominator:100},
      {year:2020,value:11,denominator:100},{year:2021,value:11,denominator:100},
      {year:2022,value:12,denominator:100}]}
};
export default function EvidenceActionClient(){
  const [query,setQuery]=useState("colorectal cancer disparities screening diagnostic follow-up");
  const [leads,setLeads]=useState<IntelligenceRecord[]>([]);
  const [searchState,setSearchState]=useState("");
  const [searchBusy,setSearchBusy]=useState(false);
  const [panelText,setPanelText]=useState("");
  const [panelAudit,setPanelAudit]=useState<CounterfactualAudit|null>(null);
  const [panelError,setPanelError]=useState("");
  const [actionId,setActionId]=useState("");
  const [receiptText,setReceiptText]=useState("");
  const [receiptResult,setReceiptResult]=useState<ReturnType<typeof reviewCorrectionReceipt>|null>(null);
  const [receiptError,setReceiptError]=useState("");
  const [focusIds,setFocusIds]=useState<string[]>([]);
  const {program,bridge,comparisonSites,decisionBrief,calibratedEvidence,crcMarginalEvidence}=useMemo(()=>colorectalEvidenceAction(leads),[leads]);
  const selected=bridge.corrections.find(x=>x.id===(actionId||bridge.corrections[0]?.id));
  async function search(){
    if(query.trim().length<8||query.trim().length>200){setSearchState("Enter a public research question between 8 and 200 characters.");return;}
    setSearchBusy(true);setSearchState("Searching the existing scholarly index; no records promoted to verified findings.");
    try{
      const response=await fetch("/api/research-program/evidence-search",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:query.trim()}),cache:"no-store",credentials:"same-origin"
      });
      const json:unknown=await response.json();
      if(!json||typeof json!=="object")throw Error("Invalid response");
      const data=json as {error?:string;leads?:IntelligenceRecord[];status?:string};
      if(!response.ok)throw Error(data.error||"Research index unavailable");
      const next=Array.isArray(data.leads)?data.leads.filter(x=>
        x&&x.kind==="SCHOLARLY"&&x.sourceStatus==="DISCOVERY_ONLY"&&
        typeof x.title==="string"&&typeof x.url==="string"&&x.url.startsWith("https://")).slice(0,6):[];
      setLeads(next);
      setSearchState(next.length+" abstract/metadata leads from OpenAlex. Read original articles and methods before using findings.");
    }catch(e){setSearchState(e instanceof Error?e.message:"Scholarly search failed; existing curated baselines remain available.");}
    finally{setSearchBusy(false);}
  }
  function preflightPanel(){
    setPanelAudit(null);setPanelError("");
    try{
      if(panelText.length>25000)throw Error("Panel input exceeds 25 KB.");
      const data=JSON.parse(panelText) as CounterfactualRequest;
      if(!data||typeof data!=="object"||!data.treated||!data.comparator)throw Error("Use a bounded two-arm aggregate panel.");
      setPanelAudit(reviewCounterfactual(data));
    }catch(e){setPanelError(e instanceof Error?e.message:"Invalid panel JSON.");}
  }
  function preflightReceipt(){
    setReceiptError("");setReceiptResult(null);
    if(!selected)return;
    try{
      if(receiptText.length>12000)throw Error("Receipt exceeds 12 KB.");
      const data=JSON.parse(receiptText) as CorrectionReceipt;
      if(!data||typeof data!=="object")throw Error("Use a documented aggregate receipt JSON.");
      setReceiptResult(reviewCorrectionReceipt(selected,data));
    }catch(e){setReceiptError(e instanceof Error?e.message:"Invalid receipt JSON.");}
  }
  return <main className="rp-root">
    <nav aria-label="Research navigation" className="rp-back"><Link href="/research-program">Research Studio</Link> · <Link href="/research-program/method-validation">Methods validation</Link> · <Link href="/">DIS home</Link></nav>
    <header className="rp-head">
      <p className="rp-kicker">DIS × RPLICE · Research-to-action connection</p>
      <h1>What is being missed, and what would improve the outcome?</h1>
      <p>{decisionBrief.purpose}</p>
      <div className="rp-warning"><strong>Research calibration; not clinical or operational authorization.</strong> The legacy2018–2022 Hinds reference and separately reproduced2019–2023 Hinds/Harris and national snapshots retain distinct periods and source lineage. County data are not city findings. Personal data, live feeds, RPLICE execution, a causal effect, verified correction or field benefit are not established.</div>
      <details><summary>Inspect workbench coverage and open evidence gaps</summary><div className="rp-overview">
        <div><span>Measured source rows</span><strong>{bridge.measures.length} curated, not re-extracted</strong></div>
        <div><span>Measurement links</span><strong>{bridge.links.length} requiring interpretation</strong></div>
        <div><span>Research and delivery gaps</span><strong>{bridge.gaps.length} explicitly open</strong></div>
        <div><span>Independent outcome closures</span><strong>{bridge.verifiedCorrections}</strong></div>
      </div></details>
    </header>
    <section className="rp-program" aria-labelledby="decision-heading">
      <h2 id="decision-heading">Start with the decision</h2>
      <div className="rp-focus"><h3>{decisionBrief.decisionNow}</h3>
        <p>{decisionBrief.hypothesisRule}</p>
        <p><strong>Evidence layers:</strong> {decisionBrief.baselineScope}</p>
        <p><strong>Delta still to establish:</strong> the pathway gap, preventable burden, intervention effect and the platform's added benefit are unknown. {decisionBrief.missingnessRule}</p>
      </div>
      <h3>Separate the pathways before combining explanations</h3>
      <ul>{decisionBrief.pathways.map(p=><li key={p.id}><strong>{p.label}:</strong> {p.question}</li>)}</ul>
      <fieldset>
        <legend>Inspect candidate mechanisms together</legend>
        <p>Choose one or several study focuses. Selection does not establish a cause; mechanisms can interact.</p>
        {bridge.hypotheses.map(h=><label className="rp-check" key={h.id}>
          <input type="checkbox" checked={focusIds.includes(h.id)} onChange={e=>setFocusIds(ids=>e.target.checked?[...ids,h.id]:ids.filter(id=>id!==h.id))}/>
          {program.drivers.find(d=>d.id===h.id)?.label||h.id}
        </label>)}
      </fieldset>
      <div aria-live="polite">
        {bridge.hypotheses.filter(h=>focusIds.includes(h.id)).map(h=><article className="rp-focus" key={h.id}>
          <h3>{program.drivers.find(d=>d.id===h.id)?.label||h.id}</h3>
          <p><strong>Next evidence:</strong> {h.discriminatingTest}</p>
          <p><strong>Rival:</strong> {h.alternative}</p>
          <p><strong>Proposed reviewers, awaiting designation:</strong> {h.ownerRole}</p>
          <p><strong>Exit evidence:</strong> {decisionBrief.workPackages.find(w=>w.hypothesisId===h.id)?.exitEvidence}</p>
        </article>)}
      </div>
      <p className="rp-subtle">Focus choices are local to this view. The case record retains the complete candidate set and decision brief; no focus choice assigns work or records a test result.</p>
      <details><summary>What would justify implementation and a claim of benefit?</summary>
        <p>{decisionBrief.implementationCondition}</p><p>{decisionBrief.comparison}</p>
        <p>{decisionBrief.signalValidation}</p><p>{decisionBrief.benefitEvidence}</p>
      </details>
      <details><summary>Who would use or buy this, and why?</summary>
        <p><strong>Users:</strong> {decisionBrief.value.users}.</p>
        <p><strong>Potential buyer:</strong> {decisionBrief.value.potentialBuyer}.</p>
        <p><strong>Beneficiaries:</strong> {decisionBrief.value.beneficiaries}.</p>
        <p><strong>Decision it supports:</strong> {decisionBrief.value.job}.</p>
        <p><strong>Current offering:</strong> {decisionBrief.value.currentOffering}.</p>
        <p><strong>Value to prove:</strong> {decisionBrief.value.proof}.</p>
      </details>
    </section>
    <CalibratedEvidencePanel snapshot={calibratedEvidence} marginals={crcMarginalEvidence}/>
    <section className="rp-program" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading">1. Preserve the measurement, not just the number</h2>
      <p>This retained legacy section supplies2018–2022 Hinds observations. Its historical gaps concern that accepted baseline; the newer supplement above adds source-matched all-stage rates and county contrasts in a separate period. Neither layer establishes clinical pathway performance. The crosswalk is explicit and colorectal-specific.</p>
      <div className="rp-table-wrap"><table>
        <thead><tr><th>Construct</th><th>Historical value</th><th>Numerator</th><th>Denominator</th><th>Source</th></tr></thead>
        <tbody>{bridge.measures.map(m=><tr key={m.id}>
          <th scope="row">{m.construct.replaceAll("_"," ").toLowerCase()}</th>
          <td>{m.indicator.value} {m.indicator.unit}</td>
          <td>{m.indicator.numeratorDefinition}</td>
          <td>{m.indicator.denominatorDefinition}</td>
          <td><a href={m.indicator.sourceUrl} target="_blank" rel="noreferrer">NCI historical county reference</a><div className="rp-subtle">{m.indicator.period}</div></td>
        </tr>)}</tbody>
      </table></div>
      <h3>Related does not mean equivalent</h3>
      <div className="rp-card-grid">{bridge.links.map(link=><article className="rp-card" key={link.left+"-"+link.right}>
        <h4>{link.left} ↔ {link.right}</h4>
        <p><strong>{link.relationship.replaceAll("_"," ").toLowerCase()}.</strong> Safe to pool: no. Verified causal link: no.</p>
        <ul>{link.reasons.map(x=><li key={x}>{x}</li>)}</ul>
      </article>)}</div>
      <h3>Comparison geographies</h3>
      <ul>{comparisonSites.map(s=><li key={s.site}><strong>{s.site}:</strong> {s.state.replaceAll("_"," ").toLowerCase()}</li>)}</ul>
    </section>
    <section className="rp-program" aria-labelledby="search-heading">
      <h2 id="search-heading">2. Discover external scholarship, then independently verify it</h2>
      <p>The search reuses the existing DIS OpenAlex six-year research adapter. Its results are bibliographic and abstract leads; none becomes verified patient, site or causal evidence by appearing here. Signing in is required to make a live query.</p>
      <label className="rp-field">Public research question
        <input value={query} maxLength={200} onChange={e=>setQuery(e.target.value)} aria-label="Public literature research question"/>
      </label>
      <div className="rp-buttons"><button type="button" disabled={searchBusy} onClick={()=>void search()}>{searchBusy?"Searching index…":"Search published research"}</button></div>
      {searchState&&<p role="status" aria-live="polite">{searchState}</p>}
      {bridge.literature.length>0&&<div className="rp-card-grid">{bridge.literature.map(x=><article className="rp-card" key={x.id}>
        <h3>{x.title}</h3><p>OpenAlex metadata only; source content, methods and applicability not independently verified.</p>
        <a href={x.url} target="_blank" rel="noreferrer">Inspect source</a>
      </article>)}</div>}
    </section>
    <CrossStudyPanel baseline={bridge.measures}/>
    <section className="rp-program" aria-labelledby="mechanisms-heading">
      <h2 id="mechanisms-heading">4. Challenge the explanation before choosing the correction</h2>
      <p>Each explanation from the existing DIS research program retains its rival, a test that could distinguish them, the instrument needed, and a reviewer role. None is established as the cause of Hinds or Harris outcomes.</p>
      <div className="rp-card-grid">{bridge.hypotheses.map(h=><article className="rp-card" key={h.id}>
        <p className="rp-small-code">{h.id} · LOCAL TEST NOT RUN</p>
        <h3>{program.drivers.find(x=>x.id===h.id)?.label||h.id}</h3>
        <p><strong>Hypothesis:</strong> {h.hypothesis}</p>
        <p><strong>Competing explanation:</strong> {h.alternative}</p>
        <details><summary>Discriminating evidence and owner</summary>
          <p><strong>Test:</strong> {h.discriminatingTest}</p><p><strong>Data:</strong> {h.proposedInstrument}</p><p><strong>Review:</strong> {h.ownerRole}</p>
        </details>
      </article>)}</div>
    </section>
    <section className="rp-program" aria-labelledby="causal-heading">
      <h2 id="causal-heading">5. Audit a proposed counterfactual, not a single snapshot</h2>
      <p>Paste an aggregate two-arm annual panel to check matched timepoints, stable measurement declaration, treatment timing, comparison rationale, possible confounders, spillover and independent review. A passing screen produces arithmetic only; it does <strong>not</strong> establish parallel trends or a causal effect. The sample is entirely synthetic.</p>
      <div className="rp-buttons"><button type="button" onClick={()=>{setPanelText(JSON.stringify(SYNTHETIC_PANEL,null,2));setPanelAudit(null);setPanelError("");}}>Load synthetic teaching panel</button></div>
      <label className="rp-field">Bounded aggregate design JSON (no patient data)
        <textarea rows={7} maxLength={25000} value={panelText} onChange={e=>{setPanelText(e.target.value);setPanelAudit(null);}} placeholder="Two site-level annual panels, treatment year, and documented design assumptions"/>
      </label>
      <div className="rp-buttons"><button type="button" disabled={!panelText.trim()} onClick={preflightPanel}>Check counterfactual readiness</button></div>
      {panelError&&<p role="alert">{panelError}</p>}
      {panelAudit&&<div className="rp-focus" role="status" aria-live="polite">
        <h3>{panelAudit.gate.replaceAll("_"," ").toLowerCase()}</h3>
        <p>Matched pre-years: {panelAudit.matchedPreYears.join(", ")||"None"}; matched post-years: {panelAudit.matchedPostYears.join(", ")||"None"}.</p>
        <p>Raw difference in differences: {panelAudit.rawDifferenceInDifferences===null?"Not calculated":panelAudit.rawDifferenceInDifferences.toFixed(3)+" (descriptive units only)"}.</p>
        <p><strong>Causal effect established: no.</strong> Independent trend checks, confounding assessment and statistical review cannot be replaced by this form.</p>
        {panelAudit.gaps.length>0&&<ul>{panelAudit.gaps.map((x,i)=><li key={i}>{x}</li>)}</ul>}
      </div>}
    </section>
    <section className="rp-program" aria-labelledby="action-heading">
      <h2 id="action-heading">6. Link an improvement proposal to actual verification</h2>
      <p>Existing evidence-based strategies are candidate actions, not locally proven solutions. A reported delivery receipt is checked for numerator/denominator, fidelity, balancing harms and comparison; it is never automatically declared authentic or closed.</p>
      <label className="rp-field">Select a candidate strategy
        <select value={selected?.id||""} onChange={e=>{setActionId(e.target.value);setReceiptResult(null);}}>
          {bridge.corrections.map(x=><option key={x.id} value={x.id}>{x.strategy}</option>)}
        </select>
      </label>
      {selected&&<div className="rp-focus">
        <h3>{selected.strategy}</h3><p><strong>Source:</strong> <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Review supporting study or guidance</a></p>
        <p><strong>Outcome to verify:</strong> {selected.measureToVerify}</p>
        <p><strong>Potential harm:</strong> {selected.potentialHarm}</p>
        <p><strong>Owner:</strong> {selected.ownerRole}. State: proposed, not authorized.</p>
      </div>}
      <label className="rp-field">Aggregate delivery receipt JSON — review only
        <textarea rows={5} maxLength={12000} value={receiptText} onChange={e=>{setReceiptText(e.target.value);setReceiptResult(null);}}
          placeholder='{"proposedActionId":"...","deliveryRecordedAt":"2026-11-07T14:00:00Z","sourceUrl":"https://...","eligibleDenominator":100,"completedNumerator":70,"coreFunctionChecked":false,"balancingHarmsReviewed":false,"comparisonRecorded":false,"reviewerIdentity":""}'/>
      </label>
      <div className="rp-buttons"><button type="button" disabled={!receiptText.trim()||!selected} onClick={preflightReceipt}>Audit reported correction</button></div>
      {receiptError&&<p role="alert">{receiptError}</p>}
      {receiptResult&&<div role="status" className="rp-focus">
        <h3>{receiptResult.closure.replaceAll("_"," ").toLowerCase()}</h3>
        <p>Metadata completeness: {receiptResult.provisionalCompleteness?"Declared fields present, not independently authenticated":"Evidence fields missing or conflicting"}. Outcome independently verified: no.</p>
        {receiptResult.problems.length>0&&<ul>{receiptResult.problems.map(x=><li key={x}>{x}</li>)}</ul>}
      </div>}
    </section>
    <section className="rp-program" aria-labelledby="gap-heading">
      <h2 id="gap-heading">Open MAP–GAP obligations and handoffs</h2>
      <p>The issue register is generated from the existing research case plus bridge-specific unmet measurement, causal and implementation requirements. A named role is proposed; no institution or person is involuntarily assigned a duty.</p>
      <div className="rp-table-wrap"><table>
        <thead><tr><th>Gap</th><th>Evidence needed</th><th>Proposed owner role</th></tr></thead>
        <tbody>{bridge.gaps.map(g=><tr key={g.id}>
          <th scope="row">{g.problem}<div className="rp-small-code">{g.severity}</div></th>
          <td>{g.nextEvidence}</td><td>{g.ownerRole}</td>
        </tr>)}</tbody>
      </table></div>
      <p><strong>Next governed connection:</strong> follow the existing STELLAR 1 and implementation phases; human-select an appropriate RPLICE method and separately authorize any partner transfer. No specialist RPC is executed on this page.</p>
      <div className="rp-buttons"><Link href="/research-program">Return to full 20-phase research/implementation journey</Link><Link href="/research-program/method-validation">Compare established methods and ChainWeb</Link></div>
    </section>
    <PrivateCaseHandoff program={program} bridge={bridge}/>
    <footer className="rp-footer"><p>External source lookup requires an owner-initiated authenticated metadata search. A separately initiated private case save retains the declared investigation and any explicitly reviewed public or synthetic supplement. Other study, counterfactual and receipt editors are not automatically saved: deliberately include approved material in that supplement. Free text and source declarations are not privacy certification or independent scientific validation. Do not enter medical records or personal identifiers. No clinical action, signed approval, RPLICE execution or verified beneficiary outcome is implied. Live authenticated persistence and independent scientific review remain separate acceptance checks.</p></footer>
  </main>;
}
