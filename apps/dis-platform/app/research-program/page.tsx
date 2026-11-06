"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {buildResearchProgram,type SiteKey} from "../../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../../lib/jackson-cancer-case";
import "./research-program.css";

type Pane="population"|"contributors"|"implementation"|"evaluation"|"sources";
const PANES:{id:Pane;label:string}[]=[
  {id:"population",label:"Population and measures"},
  {id:"contributors",label:"Competing explanations"},
  {id:"implementation",label:"Implementation pathway"},
  {id:"evaluation",label:"Evaluate and adapt"},
  {id:"sources",label:"Sources and limits"}
];
const access:Record<string,string>={
  MEASURED_IN_CASE_BASELINE:"Historical aggregate only",
  BREAKDOWN_NOT_YET_VERIFIED:"Local stratification not verified",
  REQUIRES_AUTHORIZED_DATA:"Approved dataset needed"
};
export default function ResearchProgramStudio(){
  const [mode,setMode]=useState<"jackson"|"custom">("jackson");
  const [site,setSite]=useState<SiteKey>("colorectal");
  const [question,setQuestion]=useState("How can we prevent late-stage cancer diagnosis?");
  const [target,setTarget]=useState("Jackson, Mississippi");
  const [pane,setPane]=useState<Pane>("population");
  const [copyStatus,setCopyStatus]=useState("");
  const caseSpec=useMemo(()=>mode==="jackson"?jacksonCancerCase(site):unsourcedResearchCase(question,target),[mode,site,question,target]);
  const program=useMemo(()=>buildResearchProgram(caseSpec),[caseSpec]);
  const copy=async(kind:"markdown"|"json")=>{
    let output="";
    if(kind==="json")output=JSON.stringify(program,null,2);
    else output=[
      "# DIS Research-to-Implementation — DRAFT / NOT VALIDATED",
      "Question: "+program.question,
      "Target population: "+program.population.targetName,
      "Measurement proxy: "+program.population.proxyUnit+" (not necessarily equivalent)",
      "Source status: "+program.sourceReviewStatus,
      "",
      "## Measured historical indicators (not city findings)",
      ...program.indicators.map(x=>"- "+x.label+": "+x.value+" "+x.unit+"; "+x.geography+", "+x.period+"\n  Source: "+x.sourceUrl+"\n  Numerator: "+x.numeratorDefinition+"\n  Denominator: "+x.denominatorDefinition),
      "## Population stratification requiring evidence",
      ...program.strata.map(s=>"- "+s.dimension+" — "+s.availability+"; "+s.neededFor+"; risk: "+s.interpretationRisk),
      "## Competing hypotheses, not confirmed local causes",
      ...program.drivers.map(d=>"- "+d.label+": "+d.hypothesis+"\n  Test: "+d.discriminatingTest+"\n  Competing account: "+d.competingExplanation+"\n  Data: "+d.instrumentOrDataNeeded),
      "## Candidate intervention methods",
      ...program.strategies.map(s=>"- "+s.name+": "+s.studyTarget+"; evidence: "+s.basis+"; source: "+s.sourceUrl+"\n  Measure: "+s.measureToVerify+"; harm: "+s.potentialHarm),
      "## Research/implementation milestones",
      ...program.stages.map(s=>"- "+s.window+": "+s.mission+"; owner: "+s.accountableRole+"; closure: "+s.closureRequirement),
      "## Evaluation",
      program.comparisonDesign,
      ...program.successMeasures.map(s=>"- "+s.role+" "+s.name+": "+s.definition+"; "+s.cadence),
      "## Unresolved gaps and prohibited inferences",
      ...program.issues.map(x=>"- "+x.code+": "+x.finding+" Required: "+x.nextEvidence),
      "## Limitations",...program.interpretationGuardrails.map(s=>"- "+s),
      "",
      "All entries are public, aggregate or proposed; no person-level data reviewed and no clinical action authorized."
    ].join("\n\n");
    if(!navigator.clipboard){setCopyStatus("Clipboard unavailable; nothing was exported.");return;}
    try{await navigator.clipboard.writeText(output);setCopyStatus(kind==="json"?"Research case JSON copied.":"Draft research/implementation package copied.");}
    catch{setCopyStatus("Clipboard permission denied; nothing was exported.");}
  };
  return <main className="rp-root">
    <header className="rp-head">
      <Link className="rp-back" href="/">← Dynamic Intelligence</Link>
      <div className="rp-kicker">DIS · RESEARCH TO IMPLEMENTATION</div>
      <h1>Understand the population. Investigate the causes. Test what works.</h1>
      <p>An evidence-first workflow for turning a public-health question into a structured, testable research and implementation program. Not a clinical decision system or an automatic causal diagnosis.</p>
      <div className="rp-warning" role="note"><strong>Research-stage program · Public aggregate evidence only.</strong> Local causes, patient outcomes, clinical decisions, and improved late-stage detection have not been established by this demonstration. Do not enter protected information.</div>
    </header>
    <section className="rp-case" aria-label="Research question and geography">
      <div className="rp-section-top">
        <div><div className="rp-kicker">01 · ORIENT</div><h2>What problem, population and disease?</h2></div>
      </div>
      <label className="rp-field"><span>Research scenario</span>
        <select value={mode} onChange={e=>{setMode(e.target.value as "jackson"|"custom");setPane("population")}}>
          <option value="jackson">Demonstration · Late-stage cancer, Jackson, Mississippi</option>
          <option value="custom">New question · methodological framework only (no retrieved statistics)</option>
        </select>
      </label>
      {mode==="jackson"?<div className="rp-form">
        <label className="rp-field"><span>Cancer site / analysis</span>
          <select value={site} onChange={e=>setSite(e.target.value as SiteKey)}>
            <option value="colorectal">Colorectal cancer — Hinds County historical baseline</option>
            <option value="breast">Female breast cancer — Hinds County historical baseline</option>
            <option value="general">Compare separate sites — never pool unlike stage measures</option>
          </select>
        </label>
        <p className="rp-subtle">Target: Jackson, Mississippi. Available historical proxy: <strong>Hinds County</strong>. Jackson County is a separate county and is not substituted. <strong>No Jackson city-level cancer incidence is asserted.</strong></p>
      </div>:<div className="rp-form">
        <label className="rp-field"><span>Your research/implementation question</span>
          <textarea rows={2} maxLength={300} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What phenomenon and outcome need investigation?"/>
        </label>
        <label className="rp-field"><span>Target population or geographic frame</span>
          <input maxLength={130} value={target} onChange={e=>setTarget(e.target.value)} placeholder="Define specific target population"/>
        </label>
        <p className="rp-subtle">A new question produces a method and evidence-gap scaffold, not invented research findings or automatically retrieved local statistics. To obtain new evidence, use the existing <Link href="/#consult">DIS research workflow</Link> with appropriate consent.</p>
      </div>}
      <div className="rp-overview">
        <div><span>Target</span><strong>{program.population.targetName}</strong></div>
        <div><span>Observed geography</span><strong>{mode==="jackson"?"Hinds County only":"Not verified"}</strong></div>
        <div><span>Source connection</span><strong>{program.sourceReviewStatus.replaceAll("_"," ").toLowerCase()}</strong></div>
        <div><span>Claim status</span><strong>Research design · not validated</strong></div>
      </div>
    </section>
    <section className="rp-program" aria-label="DIS research program assessment">
      <div className="rp-section-top">
        <div><div className="rp-kicker">02 · MAP–GAP</div><h2>Follow the evidence through to action</h2></div>
        <span className="rp-counter">{program.issues.length} unresolved research or inference gaps</span>
      </div>
      <nav className="rp-tabs" aria-label="Research program sections">{PANES.map(t=><button key={t.id} type="button" aria-pressed={pane===t.id} onClick={()=>setPane(t.id)}>{t.label}</button>)}</nav>
      {pane==="population"&&<section aria-label="Population and indicators" className="rp-content">
        <h3>What is actually measured?</h3>
        <p>All numbers shown below originate from published historical county tables. The rate, the share of incident cancers that were late-stage, and the average annual count have different denominators.</p>
        {program.indicators.length?<div className="rp-stats">{program.indicators.map(m=><article className="rp-stat" key={m.id}>
          <span>{m.label}</span><strong>{m.value?.toLocaleString("en-US")??"Not reported"}</strong><small>{m.unit}</small>
          <div className="rp-note">{m.geography} · {m.period}</div>
          {m.confidenceInterval&&<div className="rp-note">95% CI: {m.confidenceInterval[0]}–{m.confidenceInterval[1]}</div>}
          <details><summary>Measure meaning and limitation</summary><p><b>Numerator:</b> {m.numeratorDefinition}</p><p><b>Denominator:</b> {m.denominatorDefinition}</p><p>{m.sourceLimit}</p><a href={m.sourceUrl} target="_blank" rel="noreferrer">Original NCI source</a></details>
        </article>)}</div>:<p className="rp-no-data">No verified observed population values have been supplied for this custom case. Define the source, period, geography, numerator and denominator first.</p>}
        <h3>Population stratification and unavailable cells</h3>
        <div className="rp-table-wrap"><table><thead><tr><th>Dimension</th><th>Grouping to assess</th><th>Evidence status</th><th>Why investigate</th></tr></thead>
          <tbody>{program.strata.map(x=><tr key={x.id}><td><strong>{x.dimension}</strong></td><td>{x.comparison}</td><td>{access[x.availability]}</td><td>{x.neededFor}</td></tr>)}</tbody></table></div>
        <p className="rp-subtle">Subgroups are *analytical questions*, not assumed causes. Small-cell suppression and source population definitions must be respected.</p>
      </section>}
      {pane==="contributors"&&<section aria-label="Competing contributing explanations" className="rp-content">
        <h3>What could explain late diagnosis—and what would distinguish the explanations?</h3>
        <p>These represent plausible pathways requiring investigation. None has been established as a local causal finding.</p>
        <div className="rp-card-grid">{program.drivers.map(x=><article key={x.id} className="rp-card">
          <span className="rp-small-code">{x.id} · NOT LOCALLY TESTED</span>
          <h4>{x.label}</h4><p>{x.hypothesis}</p>
          <details><summary>Discriminating test and counterexplanation</summary>
            <p><b>Test:</b> {x.discriminatingTest}</p>
            <p><b>Alternative:</b> {x.competingExplanation}</p>
            <p><b>Needed data/instruments:</b> {x.instrumentOrDataNeeded}</p>
            <p><b>Reviewer roles:</b> {x.responsibleReviewers}</p>
          </details>
        </article>)}</div>
        <p className="rp-subtle">Open-world rule: even if a candidate explanation is not supported, the remaining explanation is not automatically true. Wrong instruments, missingness and unconsidered causes remain possible.</p>
      </section>}
      {pane==="implementation"&&<section aria-label="Implementation pathway" className="rp-content">
        <h3>Where might the clinical and community journey break down?</h3>
        <ol className="rp-path">{program.pathway.map(x=><li key={x.stage}>
          <strong>{x.stage}</strong><p>{x.processMeasure}</p><small><b>Denominator:</b> {x.denominator}. <b>Owner:</b> {x.owner}</small>
        </li>)}</ol>
        <h3>Candidate strategies: supporting evidence is not local efficacy</h3>
        <div className="rp-card-grid">{program.strategies.length?program.strategies.map(x=><article className="rp-card" key={x.id}>
          <span className="rp-small-code">{x.basis.replaceAll("_"," ")}</span>
          <h4>{x.name}</h4><p>{x.studyTarget}</p>
          <p><b>Measure:</b> {x.measureToVerify}</p><p><b>Potential harm:</b> {x.potentialHarm}</p>
          <a href={x.sourceUrl} target="_blank" rel="noreferrer">Review evidence and applicability</a>
        </article>):<p>Intervention options have not yet been identified or appraised for this question.</p>}</div>
        <h3>Execution and sustainment milestones</h3>
        <div className="rp-timeline">{program.stages.map(s=><article key={s.order}><strong>{s.window}</strong><div><h4>{s.mission}</h4><p><b>Responsible:</b> {s.accountableRole}</p><p><b>Measure:</b> {s.measure}</p><p><b>Closure:</b> {s.closureRequirement}</p></div></article>)}</div>
      </section>}
      {pane==="evaluation"&&<section aria-label="Research design and evaluation" className="rp-content">
        <h3>How will we know it improves outcomes?</h3>
        <p>{program.comparisonDesign}</p>
        <div className="rp-card-grid">{program.successMeasures.map(x=><article className="rp-card" key={x.name}>
          <span className="rp-small-code">{x.role.replaceAll("_"," ")}</span><h4>{x.name}</h4>
          <p>{x.definition}</p><small>Review cadence: {x.cadence}</small>
        </article>)}</div>
        <h3>Current evidence gaps and unacceptable inferences</h3>
        <ul className="rp-issues">{program.issues.map(i=><li key={i.code}>
          <strong>{i.code.replaceAll("_"," ")}</strong>: {i.finding}<div className="rp-note">What resolves this: {i.nextEvidence}</div>
        </li>)}</ul>
        <div className="rp-warning"><strong>Research ≠ care.</strong> The system has no patient data and no authorization to order tests, issue diagnoses, contact patients, or recommend therapy. Its implementation plan is proposed for stakeholder and scientific review.</div>
      </section>}
      {pane==="sources"&&<section aria-label="Source catalog and limitations" className="rp-content">
        <h3>Authoritative data and integration boundaries</h3>
        <p>This is a curated source catalogue and dated historical evidence snapshot, not an always-current CDC/NCI or EHR integration.</p>
        <div className="rp-card-grid">{program.dataSources.length?program.dataSources.map(s=><article className="rp-card" key={s.id}>
          <span className="rp-small-code">{s.kind.replaceAll("_"," ")} · {s.connection.replaceAll("_"," ")}</span>
          <h4>{s.name}</h4><p>{s.owner}</p><p><b>Scope:</b> {s.granularity}; {s.observationWindow}</p>
          <p><b>Permitted inference:</b> {s.legitimateUse}</p>
          <p><b>Not supported:</b> {s.prohibitedUse}</p>
          <a href={s.url} target="_blank" rel="noreferrer">Open original source</a>
        </article>):<p>No sources have been retrieved or connected for this custom question.</p>}</div>
        <h3>What this program does not establish</h3>
        <ul className="rp-issues">{program.interpretationGuardrails.map(s=><li key={s}>{s}</li>)}</ul>
      </section>}
    </section>
    <footer className="rp-footer">
      <div><strong>DIS evidence to action</strong><p>Investigate → measure → distinguish explanations → co-design → compare → implement under human authority → track and adapt.</p></div>
      <div className="rp-buttons">
        <button type="button" onClick={()=>void copy("markdown")}>Copy research and implementation brief</button>
        <button type="button" onClick={()=>void copy("json")}>Copy structured research case</button>
        <Link href="/#consult">Continue in DIS Council</Link>
      </div>
      <p role="status">{copyStatus}</p>
      <p className="rp-subtle">No source calls, accounts, model requests, database writes or clinical actions are made by this demonstration. Publicly reported aggregate observations and investigation hypotheses remain separate.</p>
    </footer>
  </main>;
}
