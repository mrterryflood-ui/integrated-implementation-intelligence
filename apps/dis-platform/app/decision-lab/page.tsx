"use client";
import {useMemo,useState} from "react";
import type {Comparison,DecisionPacket,EvidenceObservation} from "../../lib/decision-assurance";
import {auditDecisionPacket} from "../../lib/decision-assurance";
import {SYNTHETIC_CASES} from "../../lib/decision-assurance-cases";
import "./decision-lab.css";

const clone = (p:DecisionPacket):DecisionPacket=>({
  ...p,observations:p.observations.map(o=>({...o})),
  comparison:p.comparison?{...p.comparison,ids:[...p.comparison.ids]}:undefined,
  decision:p.decision?{...p.decision}:undefined,
  outcome:p.outcome?{...p.outcome}:undefined,
  objective:p.objective?{...p.objective}:undefined,
  stewardship:p.stewardship?{...p.stewardship}:undefined,
  informationValue:p.informationValue?{...p.informationValue}:undefined
});
const textKeys=["id","label","origin","construct","unit","scope","observedAt","receivedAt"] as const;
const labels:Record<(typeof textKeys)[number],string>={
  id:"Record ID",label:"What it reports",origin:"Original source / lineage",
  construct:"Phenomenon measured",unit:"Unit",scope:"Geographic / population scope",
  observedAt:"Measured at (ISO time)",receivedAt:"Received at (ISO time)"
};
const emptyObservation=(n:number):EvidenceObservation=>({
  id:"source-"+n,label:"",origin:"",construct:"",unit:"",scope:"",
  observedAt:"",receivedAt:"",kind:"SOURCE_REPORTED",validated:false
});
const blank:DecisionPacket={
  id:"custom",title:"Local research packet",question:"",goal:"",
  asOf:"",observations:[emptyObservation(1)]
};
export default function DecisionAssuranceLab(){
  const [chosen,setChosen]=useState("F01");
  const [editable,setEditable]=useState<DecisionPacket>(clone(blank));
  const [expanded,setExpanded]=useState(false);
  const [showLenses,setShowLenses]=useState(false);
  const source=chosen==="custom"?editable:(SYNTHETIC_CASES.find(c=>c.id===chosen)||SYNTHETIC_CASES[0]);
  const result=useMemo(()=>auditDecisionPacket(source),[source]);
  const custom=chosen==="custom";
  const edit=(f:(p:DecisionPacket)=>DecisionPacket)=>{if(custom)setEditable(p=>f(p));};
  const startEditable=()=>{
    setEditable(clone({...source,id:"custom",title:"Local research packet"}));
    setChosen("custom");
  };
  const updateObservation=(id:string,key:keyof EvidenceObservation,value:string|boolean|number)=>{
    edit(p=>({...p,observations:p.observations.map(o=>o.id===id?({...o,[key]:value}):o)}));
  };
  const addObservation=()=>edit(p=>{const observations=[...p.observations,emptyObservation(p.observations.length+1)].map((o,i)=>({...o,id:"source-"+(i+1)}));return {...p,observations,comparison:p.comparison?{...p.comparison,ids:observations.map(o=>o.id)}:undefined};});
  const removeObservation=(id:string)=>edit(p=>({...p,observations:p.observations.filter(o=>o.id!==id).map((o,i)=>({...o,id:"source-"+(i+1)})),comparison:undefined}));
  const selectComparison=(kind:string)=>edit(p=>({
    ...p,comparison:kind==="NONE"?undefined:{
      intent:kind as Comparison["intent"],ids:p.observations.map(o=>o.id),
      claimedIndependent:false,claimedScope:""
    }
  }));
  const updateOutcome=(key:keyof NonNullable<DecisionPacket["outcome"]>,checked:boolean)=>edit(p=>({...p,outcome:{...p.outcome,[key]:checked}}));
  const updateSteward=(key:keyof NonNullable<DecisionPacket["stewardship"]>,value:boolean|string)=>edit(p=>({...p,stewardship:{...p.stewardship,[key]:value}}));
  const updateGoal=(key:keyof NonNullable<DecisionPacket["objective"]>,value:boolean)=>edit(p=>({...p,objective:{...p.objective,[key]:value}}));
  return <main className="assurance-lab">
    <header className="assurance-header">
      <a href="/" className="assurance-back">← Return to Dynamic Intelligence</a>
      <span className="assurance-kicker">DIS · DECISION ASSURANCE LAB</span>
      <h1>See the evidence. Challenge the inference. Revisit the mission.</h1>
      <p>Research-stage, multidimensional decision preflight. Select a synthetic vignette or examine your own source descriptions locally. This tool flags known incompatibilities; it does not validate a conclusion or authorize action.</p>
      <div className="assurance-notice" role="status"><strong>RESEARCH PROTOTYPE — NOT SCIENTIFICALLY VALIDATED</strong> No sources are fetched, personal data is not required, entries remain in browser state, and no operational, clinical, legal, or safety decision is made.</div>
    </header>
    <div className="assurance-columns">
      <section className="assurance-panel" aria-label="Evidence packet">
        <div className="assurance-section-head">
          <div><span className="assurance-overline">01 · DEFINE</span><h2>Understand the object and purpose</h2></div>
        </div>
        <label className="assurance-field"><span>Choose a synthetic research vignette</span>
          <select value={chosen} onChange={e=>setChosen(e.target.value)}>
            {SYNTHETIC_CASES.map(c=><option key={c.id} value={c.id}>{c.id} · {c.title}</option>)}
            <option value="custom">Custom · editable local evidence packet</option>
          </select>
        </label>
        {!custom&&<button className="assurance-action-secondary" onClick={startEditable}>Use this example as an editable packet</button>}
        {custom&&<button className="assurance-action-secondary" onClick={()=>{setEditable(clone({...blank,asOf:new Date().toISOString()}));}} >Clear and start new local packet</button>}
        <div className="assurance-field"><span>Decision question</span>{custom?
          <textarea rows={2} value={source.question} onChange={e=>edit(p=>({...p,question:e.target.value}))} placeholder="What decision must be made, by whom, and using which evidence?" />:
          <p className="assurance-description">{source.question}</p>}</div>
        <div className="assurance-field"><span>What success means</span>{custom?
          <textarea rows={2} value={source.goal} onChange={e=>edit(p=>({...p,goal:e.target.value}))} placeholder="Intended outcome, beneficiary and decision authority" />:
          <p className="assurance-description">{source.goal}</p>}</div>
        <label className="assurance-field"><span>Decision-as-of time (ISO with Z or offset)</span>
          {custom?<input value={source.asOf} onChange={e=>edit(p=>({...p,asOf:e.target.value}))} placeholder="2026-11-05T09:05:00Z"/>:
          <output>{source.asOf}</output>}
        </label>
        <div className="assurance-section-head assurance-subhead">
          <div><span className="assurance-overline">02 · OBSERVE</span><h2>Independent measurements, not independent-looking screens</h2></div>
          {custom&&<button className="assurance-action-secondary" onClick={addObservation} disabled={source.observations.length>=8}>Add evidence</button>}
        </div>
        {source.observations.map((o,i)=> <div className="assurance-source" key={o.id+"-"+i}>
          <div className="assurance-source-heading"><strong>{o.label||("Source "+(i+1))}</strong><span>{o.kind.replace("_"," ")}</span></div>
          {custom?<><div className="assurance-source-grid">
            {textKeys.filter(k=>k!=="id").map(key=><label key={key} className="assurance-field">
              <span>{labels[key]}</span><input value={String(o[key]||"")} onChange={e=>updateObservation(o.id,key,e.target.value)} placeholder={labels[key]}/>
            </label>)}
          </div>
          <div className="assurance-source-grid">
            <label className="assurance-field"><span>Evidence class</span><select value={o.kind} onChange={e=>updateObservation(o.id,"kind",e.target.value)}><option value="MEASURED">Measured observation</option><option value="SOURCE_REPORTED">Source-reported claim</option><option value="SCENARIO">Hypothetical scenario</option><option value="PERSONA">Conceptual persona prompt</option></select></label>
            <label className="assurance-field"><span>Evidence validity window, minutes (optional)</span><input type="number" min="0" value={o.maxAgeMinutes??""} onChange={e=>updateObservation(o.id,"maxAgeMinutes",e.target.value===""?"":Number(e.target.value))} placeholder="Only if domain evidence supports a limit"/></label>
          </div>
          <div className="assurance-source-actions">
            <label><input type="checkbox" checked={Boolean(o.validated)} onChange={e=>updateObservation(o.id,"validated",e.target.checked)} /> Validation record supplied (user-declared only)</label>
            <button className="assurance-text-button" onClick={()=>removeObservation(o.id)}>Remove</button>
          </div></>:<dl className="assurance-facts">
            <div><dt>Original lineage</dt><dd>{o.origin}</dd></div>
            <div><dt>Measured construct</dt><dd>{o.construct} · {o.unit}</dd></div>
            <div><dt>Scope</dt><dd>{o.scope}</dd></div>
            <div><dt>Measured / received</dt><dd>{o.observedAt} / {o.receivedAt}</dd></div>
          </dl>}
        </div>)}
        {custom&&<div className="assurance-custom-controls">
          <label className="assurance-field"><span>Proposed evidence operation</span>
            <select value={source.comparison?.intent||"NONE"} onChange={e=>selectComparison(e.target.value)}>
              <option value="NONE">None — inspect independently</option>
              <option value="CORROBORATE">Corroborate sources</option>
              <option value="POOL">Numerically pool measures</option>
              <option value="TRANSFER">Transfer conclusion across scopes</option>
              <option value="LATEST_CLAIM">Claim a current state at a named scope</option>
            </select>
          </label>
          {source.comparison&&<>
            <label className="assurance-field"><span>Scope claimed (for latest-state comparison)</span><input value={source.comparison.claimedScope||""} onChange={e=>edit(p=>({...p,comparison:p.comparison?{...p.comparison,claimedScope:e.target.value}:undefined}))}/></label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.comparison.claimedIndependent)} onChange={e=>edit(p=>({...p,comparison:p.comparison?{...p.comparison,claimedIndependent:e.target.checked}:undefined}))}/> Claim these sources are independent</label>
          </>}
          <details className="assurance-details"><summary>Check implementation, consequences and stewardship</summary>
            <div className="assurance-field"><span>Warning window and action lead time (hours, optional)</span>
              <div className="assurance-three-inputs">
                {(["implementationHours","warningHoursMin","warningHoursMax"] as const).map(k=><label key={k}>{k.replace(/([A-Z])/g," $1")}<input type="number" min="0" value={source.decision?.[k]??""} onChange={e=>edit(p=>({...p,decision:{implementationHours:p.decision?.implementationHours??0,warningHoursMin:p.decision?.warningHoursMin??0,warningHoursMax:p.decision?.warningHoursMax??0,[k]:Number(e.target.value)}}))} /></label>)}
              </div>
            </div>
            {([
              ["processMetricAsOutcome","A process count is being claimed as an outcome"],
              ["interventionChangedIndicator","The intervention itself changed the measured indicator"],
              ["denominatorDefinitionChanged","Population, eligibility or denominator definition changed"],
              ["coreFunctionRemoved","The intervention lost an original core function"],
              ["metricTargetIncentive","The measured quantity became a rewarded target"],
              ["codingRulesChanged","Reporting or coding rules changed"],
              ["beneficiaryOutcomeMeasured","An appropriate beneficiary outcome was measured"]
            ] as const).map(([key,label])=><label className="assurance-checkbox" key={key}><input type="checkbox" checked={Boolean(source.outcome?.[key])} onChange={e=>updateOutcome(key,e.target.checked)}/>{label}</label>)}
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.stewardship?.milestoneReached)} onChange={e=>updateSteward("milestoneReached",e.target.checked)}/> Initial milestone achieved</label>
            <label className="assurance-field"><span>Accountable post-success owner</span><input value={source.stewardship?.accountableOwner||""} onChange={e=>updateSteward("accountableOwner",e.target.value)}/></label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.stewardship?.sustainedResources)} onChange={e=>updateSteward("sustainedResources",e.target.checked)}/> Ongoing resources committed</label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.stewardship?.fidelityPlan)} onChange={e=>updateSteward("fidelityPlan",e.target.checked)}/> Sustained delivery/fidelity monitoring planned</label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.objective?.contextChanged)} onChange={e=>updateGoal("contextChanged",e.target.checked)}/> Conditions have changed</label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.objective?.stakeholderPreferencesChanged)} onChange={e=>updateGoal("stakeholderPreferencesChanged",e.target.checked)}/> Stakeholder priorities have changed</label>
            <label className="assurance-checkbox"><input type="checkbox" checked={Boolean(source.objective?.reviewed)} onChange={e=>updateGoal("reviewed",e.target.checked)}/> Objective reexamined under authorized process</label>
          </details>
        </div>}
      </section>
      <section className="assurance-panel assurance-findings" aria-live="polite">
        <span className="assurance-overline">03 · RECONCILE</span>
        <h2>What can this evidence justify?</h2>
        <div className="assurance-status" data-state={result.state==="HOLD_UNSUPPORTED_CLAIM"?"hold":"review"}>
          <strong>{result.state==="HOLD_UNSUPPORTED_CLAIM"?"Unsupported claim: hold":"Human review required"}</strong>
          <span>{result.findings.length} identified issue(s); {result.distinctDeclaredOrigins} distinct declared measurement origin(s). Distinct origins have not been independently verified.</span>
        </div>
        {result.findings.length?<div className="assurance-finding-list">{result.findings.map(f=><article key={f.code} className="assurance-finding">
          <div className="assurance-finding-head"><strong>{f.title}</strong><small>{f.severity}</small></div>
          <p>{f.explanation}</p><p className="assurance-next"><b>Next evidence check:</b> {f.nextStep}</p>
          <span className="assurance-finding-code">{f.code}</span>
        </article>)}</div>:<p className="assurance-description">No conflicts were detected by these limited deterministic rules. That does not establish accuracy, real-world safety, validity or authorization.</p>}
        <div className="assurance-section-head assurance-subhead"><div><span className="assurance-overline">04 · INTERPRET</span><h2>Evidence timing</h2></div></div>
        <div className="assurance-age-list">{result.observations.map(o=><div key={o.id}><span>{o.id}</span><strong>{o.ageMinutes===null?"Unknown":Number(o.ageMinutes.toFixed(1))+" min at decision"}</strong><small>{o.freshness.replaceAll("_"," ")}</small></div>)}</div>
        <div className="assurance-section-head assurance-subhead"><div><span className="assurance-overline">05 · DELIBERATE</span><h2>Multiple lenses, separate from evidence</h2></div></div>
        <p className="assurance-description">These are analytical questions, not consultations, expert endorsements, simulated human testimony or independent observations.</p>
        <button className="assurance-action-secondary" onClick={()=>setShowLenses(v=>!v)}>{showLenses?"Hide":"Show"} all {result.lenses.length} review lenses</button>
        {showLenses&&<div className="assurance-lenses">{result.lenses.map(l=><div key={l.id}><strong>{l.label}</strong><p>{l.question}</p></div>)}</div>}
        <div className="assurance-section-head assurance-subhead"><div><span className="assurance-overline">06 · STEWARD</span><h2>Past, present, day after, future</h2></div></div>
        <ol className="assurance-temporal">{result.temporalReview.map(q=><li key={q}>{q}</li>)}</ol>
        <button className="assurance-action-secondary" onClick={()=>setExpanded(x=>!x)}>{expanded?"Hide":"Show"} methodological limitations</button>
        {expanded&&<p className="assurance-description assurance-limitations">The checks are deterministic and rely upon user-entered metadata. They do not perform sensor association, validate calibrations, estimate causal effects or read actual source documents. Sources may share unreported dependencies. The absence of findings is not certification. No auto-approval, clinical advice, dispatch, legal decision or production submission is possible.</p>}
      </section>
    </div>
    <footer className="assurance-footer">DIS Research Method · No external model calls, no database writes, no automated decisions · Human authority retained · Scientific validation not established</footer>
  </main>;
}
