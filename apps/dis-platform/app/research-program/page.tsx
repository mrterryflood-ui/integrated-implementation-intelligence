"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {buildResearchProgram,type SiteKey} from "../../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../../lib/jackson-cancer-case";
import {buildImplementationJourney} from "../../lib/implementation-journey";
import StellarOnePanel from "../stellar-one-panel";
import WholeSystemPanel from "./whole-system-panel";
import LongitudinalCheckpointPanel from "../longitudinal-checkpoint-panel";
import type {StellarOneInput} from "../../lib/stellar-one";
import {RPLICE_HIL_METHODS,buildChainMethodSelection,type RpliceHilMethodId} from "../../lib/chain-method-selection";
import "./research-program.css";

type Pane="stellar"|"population"|"contributors"|"implementation"|"evaluation"|"sources"|"lifecycle"|"transport"|"hil";
const PANES:{id:Pane;label:string}[]=[
  {id:"stellar",label:"STELLAR 1 · Fact finding"},
  {id:"population",label:"Population and measures"},
  {id:"contributors",label:"Competing explanations"},
  {id:"implementation",label:"Implementation pathway"},
  {id:"evaluation",label:"Evaluate and adapt"},
  {id:"sources",label:"Sources and limits"},
  {id:"lifecycle",label:"Full DIS lifecycle"},
  {id:"transport",label:"Transfer to Houston"},
  {id:"hil",label:"HIL specialist & DDD"}
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
  const [pane,setPane]=useState<Pane>("stellar");
  const [stellarOverrides,setStellarOverrides]=useState<Partial<StellarOneInput>>({});
  const [destination,setDestination]=useState("Houston, Texas");
  const [phase,setPhase]=useState("STELLAR_1");
  const [rehearsal,setRehearsal]=useState("SUCCESS");
  const [copyStatus,setCopyStatus]=useState("");
  const [hilMethods,setHilMethods]=useState<RpliceHilMethodId[]>([]);
  const toggleMethod=(id:RpliceHilMethodId)=>setHilMethods(previous=>
    previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]);
  const caseSpec=useMemo(()=>mode==="jackson"?jacksonCancerCase(site):unsourcedResearchCase(question,target),[mode,site,question,target]);
  const program=useMemo(()=>buildResearchProgram(caseSpec),[caseSpec]);
  const journey=useMemo(()=>buildImplementationJourney(program,destination,stellarOverrides),[program,destination,stellarOverrides]);
  const methodSelection=useMemo(()=>buildChainMethodSelection(journey,hilMethods),[journey,hilMethods]);
  const copy=async(kind:"markdown"|"json")=>{
    let output="";
    if(kind==="json")output=JSON.stringify({program,journey,methodSelection,provenance:"RESEARCH_DESIGN_NOT_FIELD_VALIDATED",approval:"NOT_AUTHORIZED"},null,2);
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
      "## STELLAR 1 fact finding and chain/environment map",
      "Question: "+journey.stellarOne.orientation.whatDoing,
      "For whom: "+journey.stellarOne.orientation.forWhom,
      "Understand or deliver: "+journey.stellarOne.orientation.understandOrDeliver,
      "Where: "+journey.stellarOne.orientation.where,
      "How long: "+journey.stellarOne.orientation.howLong,
      "Intended change: "+journey.stellarOne.orientation.intendedChange,
      "Counterfactual: "+journey.stellarOne.orientation.counterfactual,
      ...journey.stellarOne.environment.nodes.map(x=>"- "+x.name+": declared hops "+(x.distanceFromCenter??"unmapped")+"; "+x.relationToCenter+"; validated "+x.relationshipValidation),
      ...journey.stellarOne.questions.map(x=>"- "+x.code+": "+x.question+"; proof "+x.proofNeeded),
      "## End-to-end DIS implementation lifecycle",
      ...journey.nodes.map(n=>"- "+n.id+": "+n.title+"\n  Intent: "+n.why+"\n  Outputs: "+n.outputs.join("; ")+"\n  Acceptance conditions: "+n.gates.map(g=>g.artifact+"; owner "+g.ownerRole+"; reviewer "+g.reviewerRole+"; "+g.acceptance).join(" | ")+"\n  State: "+n.status+" — NOT independently verified"),
      "## HIL-selected RPLICE methods and connected chain-web",
      "Human-declared selection, not execution, institutional consent or intervention approval: "+methodSelection.state,
      ...methodSelection.selectedMethods.map(m=>"- "+m.label+" — RPLICE owns "+(m.mcpTool||"specialist appraisal; no confirmed MCP execution method")+"; scope: "+m.chainQuestion+"; evidence requirements: "+m.stageEvidence.map(g=>g.phase+" / "+g.artifact).join(" | ")),
      "Chain center: "+(methodSelection.chainWeb.center||"not independently confirmed"),
      "Declared nodes: "+methodSelection.chainWeb.nodes.length+"; edges: "+methodSelection.chainWeb.edges.length+"; independently verified: "+methodSelection.chainWeb.verifiedEdges,
      ...methodSelection.chainWeb.edges.map(e=>"- "+e.from+" "+e.relation+" "+e.to+" — source: "+(e.evidenceRef||"NOT VERIFIED")),
      "Source and destination: "+methodSelection.chainWeb.sourceSite+" → "+methodSelection.chainWeb.destinationSite,
      ...methodSelection.transport.requiredLocalComparisons.map(x=>"- Reassess "+x.dimension+": "+x.proofNeeded),
      ...Object.entries(methodSelection.temporal).map(([period,question])=>"- "+period+": "+question),
      "## SALP systemic anchors and leverage points",
      ...journey.systemicModel.leverageQuestions.map(q=>"- "+q),
      "## SMART theory of change and logic model",
      "Inputs: "+journey.logicModel.inputs.join("; "),
      "Activities: "+journey.logicModel.activities.join("; "),
      "Outputs: "+journey.logicModel.outputs.join("; "),
      "Short term: "+journey.logicModel.shortTerm.join("; "),
      "Intermediate: "+journey.logicModel.intermediate.join("; "),
      "Long term: "+journey.logicModel.longTerm.join("; "),
      ...journey.logicModel.smartObjectives.map(x=>"- "+x.id+": "+x.specific+"\n  Measure: "+x.measurable+"\n  Baseline: "+x.baseline+"\n  Target: "+x.target+"\n  Owner: "+x.ownerRole),
      "## Longitudinal success, partial success, failure, adverse harm and unknown rehearsals",
      "Actual observed program outcome: "+journey.longitudinal.actualResult,
      ...journey.longitudinal.cases.map(x=>"- "+x.path+" (scenario only)\n  Anticipate: "+x.leadingQuestions.join("; ")+"\n  Signals: "+x.earlySignals.join("; ")+"\n  Alternatives: "+x.alternativeExplanations.join("; ")+"\n  Responses to test: "+x.responsesToTest.join("; ")+"\n  Proof required: "+x.evidenceRequired.join("; ")),
      "## Core fidelity, allowed adaptations, and the day after success",
      "Hypothesized core: "+journey.longitudinal.coreFidelity.proposedCoreFunction,
      ...journey.longitudinal.coreFidelity.invariantHypotheses.map(x=>"- Core-function hypothesis: "+x),
      ...journey.longitudinal.coreFidelity.adaptableForms.map(x=>"- Potential adaptable form: "+x),
      ...journey.longitudinal.triggers.map(x=>"- "+x.timeHorizon+": "+x.question+"\n  Evidence: "+x.evidenceInstrument+"\n  Owner: "+x.ownerRole+"\n  Response: "+x.actionIfConcern),
      "## Cross-site transportability (not automatic replication)",
      "Destination: "+journey.crossSiteTransport.destinationSite,
      ...journey.crossSiteTransport.tests.map(t=>"- "+t.dimension+": "+t.requiredComparison+" — "+t.state),
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
      <p><Link href="/research-program/evidence-action">Open the evidence-to-action bridge: measurements, sources, counterfactuals and corrective verification</Link> · Bounded colorectal pilot; no effect established.</p>
      <p><Link href="/research-program/method-validation">Review ChainWeb method validation and published implementation evidence</Link> · Source-qualified research; method superiority not established.</p>
      <div className="rp-warning" role="note"><strong>Research-stage program · Public aggregate evidence only.</strong> Local causes, patient outcomes, clinical decisions, and improved late-stage detection have not been established by this demonstration. Do not enter protected information.</div>
    </header>
    <section className="rp-case" aria-label="Research question and geography">
      <div className="rp-section-top">
        <div><div className="rp-kicker">01 · ORIENT</div><h2>What problem, population and disease?</h2></div>
      </div>
      <label className="rp-field"><span>Research scenario</span>
        <select value={mode} onChange={e=>{setMode(e.target.value as "jackson"|"custom");setPane("stellar")}}>
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
      {pane==="stellar"&&<StellarOnePanel review={journey.stellarOne} overrides={stellarOverrides} onChange={setStellarOverrides}/>}
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
      {pane==="lifecycle"&&<section aria-label="DIS full implementation lifecycle" className="rp-content">
        <h3>Stage-gated research, implementation, translation and scale-up</h3>
        <p>The sequence below is generated from the case. Each phase defines what to investigate, the work product, responsible role and acceptance requirement. <strong>No stage is reported executed until an independent record and authorized human approval exist.</strong></p>
        <div className="rp-overview">
          <div><span>Configured phases</span><strong>{journey.nodes.length}</strong></div>
          <div><span>Actual completed</span><strong>{journey.acceptance.stagesActuallyCompleted}</strong></div>
          <div><span>Next phase</span><strong>{journey.currentRecommendedPhase}</strong></div>
          <div><span>Human sign-offs</span><strong>Not yet obtained</strong></div>
        </div>
        <div className="rp-stage-grid">{journey.nodes.map((node,i)=><button key={node.id} type="button" className={phase===node.id?"rp-stage active":"rp-stage"} aria-pressed={phase===node.id} onClick={()=>setPhase(node.id)}><small>{String(i+1).padStart(2,"0")}</small><strong>{node.title}</strong><span>{node.status.replaceAll("_"," ").toLowerCase()}</span></button>)}</div>
        {journey.nodes.filter(n=>n.id===phase).map(node=><article key={node.id} className="rp-focus">
          <span className="rp-small-code">STAGE {node.id} · NO ACTION AUTHORIZED</span><h4>{node.title}</h4>
          <p>{node.why}</p><p><b>Required outputs:</b> {node.outputs.join("; ")}</p>
          {node.gates.map(g=><div key={g.id} className="rp-stage-gate"><strong>{g.question}</strong>
            <p><b>Evidence artifact:</b> {g.artifact}</p>
            <p><b>Delivery owner:</b> {g.ownerRole} · <b>Independent reviewer:</b> {g.reviewerRole}</p>
            <p><b>Closure:</b> {g.acceptance}</p>
            <small>No externally verified proof or owner acceptance recorded in this case.</small>
          </div>)}
        </article>)}
        <section className="rp-focus" aria-label="Human-selected RPLICE methodologies and chain-web context">
          <h3>Human-in-the-loop method selection · connected chain web</h3>
          <p>Choose RPLICE specialist approaches for the question and its surrounding system. Selection is yours; DIS recommends an evidence scope, not a mandatory method or an automatic HOLD. No private material is sent to RPLICE by this panel.</p>
          <div className="rp-card-grid">{RPLICE_HIL_METHODS.map(method=><label className="rp-card" key={method.id}>
            <span style={{display:"flex",alignItems:"flex-start",gap:9}}>
              <input type="checkbox" checked={hilMethods.includes(method.id)} onChange={()=>toggleMethod(method.id)} aria-label={"Select "+method.label}/>
              <strong>{method.label}</strong>
            </span>
            <p>{method.contextQuestion}</p>
            <small>Relevant phases: {method.phases.join(" · ")}</small>
          </label>)}</div>
          <p role="status"><b>Method decision:</b> {methodSelection.state.replaceAll("_"," ").toLowerCase()} · {methodSelection.selectedMethods.length} selected. This is a local methodological choice, not a verified partner execution or approval to change operations.</p>
          {methodSelection.selectedMethods.length>0&&<div className="rp-card-grid">{methodSelection.selectedMethods.map(m=><article className="rp-card" key={m.id}>
            <h4>{m.label}</h4><p><b>Provider:</b> RPLICE · <b>Execution:</b> not attempted</p>
            <p><b>Question across the chain:</b> {m.chainQuestion}</p>
            <details><summary>Evidence needed at connected lifecycle stages</summary><ul>{m.stageEvidence.map((g,i)=><li key={g.phase+i}><strong>{g.phase}</strong> — {g.artifact}. Owner: {g.ownerRole}. Acceptance: {g.acceptance}</li>)}</ul></details>
          </article>)}</div>}
          <h4>Chain-web context before recommending action</h4>
          <p><b>Center:</b> {methodSelection.chainWeb.center||"not verified"} · <b>Nodes:</b> {methodSelection.chainWeb.nodes.length} · <b>Declared edges:</b> {methodSelection.chainWeb.edges.length} · <b>Independently verified edges:</b> {methodSelection.chainWeb.verifiedEdges}. Map upstream, downstream, intersecting, parallel and apparently disconnected effects without converting associations into causes.</p>
          <details><summary>Inspect declared chain connections and unmapped systems</summary>
            <ul>{methodSelection.chainWeb.edges.map((e,i)=><li key={i}>{e.from} → {e.to}: {e.relation}. {e.evidenceRef?"Evidence lead: "+e.evidenceRef:"No independently verified relationship source"} {e.explanation||""}</li>)}</ul>
            {methodSelection.chainWeb.edges.length===0&&<p>No evidence-backed chain edges supplied yet. A missing link is an investigation item, not proof of no relationship.</p>}
            <p><b>Unmapped or parallel declared nodes:</b> {methodSelection.chainWeb.unresolvedNodes.join(", ")||"None declared; completeness is not established."}</p>
          </details>
          <h4>Reassess the chain before transfer to another setting</h4>
          <p><b>{methodSelection.chainWeb.sourceSite} → {methodSelection.chainWeb.destinationSite}</b>: the same intervention label does not mean the system, mechanism, capacity, stakeholders or results are the same.</p>
          <details><summary>Destination-specific evidence needed</summary><ul>{methodSelection.transport.requiredLocalComparisons.map(x=><li key={x.dimension}>{x.dimension}: {x.proofNeeded} ({x.state.replaceAll("_"," ").toLowerCase()})</li>)}</ul></details>
          <h4>Temporal chain and second-order effects</h4>
          <ol>{Object.entries(methodSelection.temporal).map(([period,question])=><li key={period}><strong>{period.replaceAll(/([A-Z])/g," $1")}:</strong> {question}</li>)}</ol>
          <p className="rp-subtle">Method selection, analytical execution, evidence acceptance, participation and operational authorization are separate events. RPLICE owns its methods. Current state: no remote tool invocation, no clinical action, no signed approval and no verified chain causation.</p>
        </section>
        <h3>SALP: systemic anchors, leverage points, governance and fidelity</h3>
        <p>SALP is used here as <strong>Structural Anchor and Leverage Protocol</strong>. Its RPLICE sequence is <strong>{journey.systemicModel.rPliceSequence.join(" → ")}</strong>. These are research-method stages, not evidence that an actual community system has been changed.</p>
        <div className="rp-card-grid">
          <article className="rp-card"><h4>What must be investigated?</h4><ul>{journey.systemicModel.leverageQuestions.map(q=><li key={q}>{q}</li>)}</ul></article>
          <article className="rp-card"><h4>Power, institutions and adoption</h4><ul>{journey.systemicModel.powerAndIncentiveQuestions.map(q=><li key={q}>{q}</li>)}</ul></article>
        </div>
        <h3>SMART logic model — draft outcomes, not invented targets</h3>
        <div className="rp-model">
          {([["Inputs",journey.logicModel.inputs],["Activities",journey.logicModel.activities],["Outputs",journey.logicModel.outputs],["Short term",journey.logicModel.shortTerm],["Intermediate",journey.logicModel.intermediate],["Long term",journey.logicModel.longTerm],["Potential harms",journey.logicModel.unintendedEffects]] as const).map(([name,items])=><article key={name}><strong>{name}</strong><ul>{items.map(x=><li key={x}>{x}</li>)}</ul></article>)}
        </div>
        <h4>SMART objective development — baselines, targets and timelines require evidence</h4>
        <div className="rp-card-grid">{journey.logicModel.smartObjectives.map(x=><article key={x.id} className="rp-card">
          <span className="rp-small-code">{x.id}</span><h4>{x.specific}</h4><p>{x.measurable}</p>
          <p><b>Target:</b> {x.target} · <b>Baseline:</b> {x.baseline}</p>
          <p><b>Time:</b> {x.timeBound.replaceAll("_"," ").toLowerCase()}</p>
          <p><b>Owner role:</b> {x.ownerRole}</p><p><b>Safety/balance:</b> {x.balancingMeasure}</p>
        </article>)}</div>
        <h3>Participation, collaboration and communications</h3>
        <div className="rp-table-wrap"><table><thead><tr><th>Role</th><th>Accountability</th><th>Participation</th></tr></thead><tbody>{journey.collaborationRoles.map(x=><tr key={x.role}><td>{x.role}</td><td>{x.responsibility}</td><td>{x.participationState.replaceAll("_"," ").toLowerCase()}</td></tr>)}</tbody></table></div>
        <div className="rp-card-grid">{journey.communicationTracks.map(x=><article className="rp-card" key={x.audience}><h4>{x.audience}</h4><p>{x.purpose}</p><p><b>Feedback:</b> {x.feedback}</p><p><b>Authorization:</b> Not obtained; no messages sent</p></article>)}</div>
        <h3>Plan for what happens when the intervention fails, works partially, succeeds, or creates harm</h3>
        <p>These are <strong>scenario rehearsals only</strong>, not predictions, observed results, or authorizations. A successful process milestone cannot automatically move the program to SCALE; an actual benefit requires independently reviewed outcomes and a renewed sustainment contract.</p>
        <label className="rp-field"><span>Rehearse a possible result (not a recorded outcome)</span>
          <select value={rehearsal} onChange={e=>setRehearsal(e.target.value)}>
            {journey.longitudinal.cases.map(x=><option key={x.path} value={x.path}>{x.path.replaceAll("_"," ").toLowerCase()}</option>)}
          </select>
        </label>
        {journey.longitudinal.cases.filter(x=>x.path===rehearsal).map(x=><article className="rp-focus" key={x.path}>
          <span className="rp-small-code">{x.path.replaceAll("_"," ")} · HYPOTHETICAL, NOT OBSERVED</span>
          <h4>Before declaring this outcome</h4><ul>{x.leadingQuestions.map(q=><li key={q}>{q}</li>)}</ul>
          <h4>Possible warning signals</h4><ul>{x.earlySignals.map(q=><li key={q}>{q}</li>)}</ul>
          <h4>Alternative explanations</h4><ul>{x.alternativeExplanations.map(q=><li key={q}>{q}</li>)}</ul>
          <h4>Corrective actions to test—not automatically execute</h4><ul>{x.responsesToTest.map(q=><li key={q}>{q}</li>)}</ul>
          <p><strong>Independent proof required:</strong> {x.evidenceRequired.join("; ")}</p>
          <p><strong>Responsible roles:</strong> {x.responsibleRoles.join("; ")}</p>
          <p><strong>Automatic conclusions and scale-up:</strong> Not authorized.</p>
        </article>)}
        <h3>Core function versus adaptable form</h3>
        <div className="rp-warning"><strong>Proposed, not clinically or causally verified:</strong> {journey.longitudinal.coreFidelity.proposedCoreFunction}. The invariant function and permitted adaptations require independent validation and human authority.</div>
        <div className="rp-card-grid">
          <article className="rp-card"><h4>Core requirements to protect and validate</h4><ul>{journey.longitudinal.coreFidelity.invariantHypotheses.map(q=><li key={q}>{q}</li>)}</ul></article>
          <article className="rp-card"><h4>Forms that might adapt</h4><ul>{journey.longitudinal.coreFidelity.adaptableForms.map(q=><li key={q}>{q}</li>)}</ul></article>
        </div>
        <h3>Longitudinal stewardship and transformation triggers</h3>
        <div className="rp-timeline">{journey.longitudinal.triggers.map(t=><article key={t.id}>
          <strong>{t.timeHorizon}</strong><div><h4>{t.question}</h4>
          <p><b>Instrument:</b> {t.evidenceInstrument}</p><p><b>Counteraction:</b> {t.actionIfConcern}</p>
          <p><b>Accountable role:</b> {t.ownerRole} · <b>Observed:</b> no</p></div>
        </article>)}</div>
        <h3>Cascading effects and other systems</h3>
        <ul>{journey.longitudinal.systemIntersections.map(s=><li key={s}>{s}</li>)}</ul>
        <h3>Succession, resourcing and sustaining the core</h3>
        <ul>{journey.longitudinal.ownerQuestions.map(q=><li key={q}>{q}</li>)}</ul>
        <p className="rp-subtle"><strong>Current truth:</strong> Observed outcomes, independently verified mechanisms, approved sustainment budget, successor acceptance and scale authorization are all absent. A successful pilot creates new responsibilities; it does not close the mission.</p>
        <LongitudinalCheckpointPanel key={program.caseId} program={program}/>
        <h3>Adaptive learning and sustainment</h3><ol>{journey.learningLoop.map(x=><li key={x}>{x}</li>)}</ol>
      </section>}
      {pane==="hil"&&<WholeSystemPanel program={program} journey={journey}/>}
      {pane==="transport"&&<section aria-label="Cross-site EBI transferability" className="rp-content">
        <h3>Same EBI name ≠ demonstrated benefit in a different city</h3>
        <p>Before applying an intervention from Jackson to Houston, DIS rechecks the actual local mechanism, population, service capacity and implementation environment. These inputs are currently <strong>not measured for the destination</strong>.</p>
        <label className="rp-field"><span>Proposed destination (no data automatically retrieved)</span>
          <input value={destination} maxLength={120} onChange={e=>setDestination(e.target.value)} placeholder="Houston, Texas"/>
        </label>
        <div className="rp-warning"><strong>Transfer decision:</strong> {journey.crossSiteTransport.decision.replaceAll("_"," ").toLowerCase()}. No automatic copying, agency contact, clinical recommendation or scale-up is authorized.</div>
        <p><strong>Candidate:</strong> {journey.crossSiteTransport.candidateEbi}</p>
        <p><strong>Core function under test:</strong> {journey.crossSiteTransport.originalCoreFunction}</p>
        <h4>Context checks before a local pilot</h4>
        <div className="rp-table-wrap"><table><thead><tr><th>Dimension</th><th>Source-site knowledge</th><th>Destination validation needed</th><th>Status</th></tr></thead><tbody>
          {journey.crossSiteTransport.tests.map(t=><tr key={t.dimension}><td><strong>{t.dimension}</strong></td><td>{t.jacksonEvidence}</td><td>{t.requiredComparison}</td><td>{t.state.replaceAll("_"," ").toLowerCase()}</td></tr>)}
        </tbody></table></div>
        <h4>Adapt form, protect mechanism, independently evaluate results</h4>
        <ul>{journey.crossSiteTransport.adaptableDeliveryForms.map(x=><li key={x}>{x}</li>)}</ul>
        <p>{journey.crossSiteTransport.recommendation}</p>
        <p className="rp-subtle">No Houston city or Harris County cancer rates are generated from the Jackson sources. Each site requires fresh source, population, causal and delivery checks before conclusions or action.</p>
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
