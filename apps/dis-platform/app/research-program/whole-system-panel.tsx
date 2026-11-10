"use client";
import {useMemo,useState} from "react";
import type {ResearchProgram} from "../../lib/research-program";
import type {FullImplementationFlow} from "../../lib/implementation-journey";
import {assessDDD,exerciseResearchToAction,type DddCell,type HILMethod} from "../../lib/whole-system-exercise";

export default function WholeSystemPanel({program,journey}:{program:ResearchProgram;journey:FullImplementationFlow}){
 const [method,setMethod]=useState<HILMethod>("NONE");
 const [purpose,setPurpose]=useState("Identify implementation determinants and leverage points, without clinical or causal assertions.");
 const [consent,setConsent]=useState(false),[working,setWorking]=useState(false),[error,setError]=useState("");
 const [result,setResult]=useState<any>(null);
 const [anchorsText,setAnchorsText]=useState("");
 const [panelText,setPanelText]=useState(""),[panelError,setPanelError]=useState("");
 const [panel,setPanel]=useState<DddCell[]>([]);
 const selection=useMemo(()=>({method,humanSelected:method!=="NONE",explicitDataTransferConsent:consent,
   intendedPurpose:purpose,decisionOwner:"authenticated human operator"}),[method,purpose,consent]);
 const exercise=useMemo(()=>exerciseResearchToAction(program,journey,selection,panel),[program,journey,selection,panel]);
 const run=async()=>{
  setError("");setResult(null);
  if(!consent||method==="NONE"||method==="PARALLAX"){setError("Choose a supported method and explicitly consent to the data transfer.");return;}
  const anchors=anchorsText.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{
   const [name,weight,sensitivity]=line.split("|").map(x=>x.trim());
   return {name,weight:Number(weight),sensitivity:Number(sensitivity)};
  });
  setWorking(true);
  try{
   const r=await fetch("/api/research-program/specialist",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({method,humanSelected:true,externalConsent:true,
      scenario:program.question+" | "+program.population.targetName+" | candidate destination: "+journey.crossSiteTransport.destinationSite,
      purpose,anchors:method==="SALP"?anchors:undefined})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw Error(j.error||"Specialist not available");
   setResult(j);
  }catch(e){setError(e instanceof Error?e.message:"Specialist unavailable");}
  finally{setWorking(false);}
 };
 const importPanel=()=>{
  try{const parsed=JSON.parse(panelText);if(!Array.isArray(parsed))throw Error("Provide an eight-row JSON array.");
   setPanel(parsed);setPanelError("");}catch(e){setPanelError(e instanceof Error?e.message:"Invalid panel");}
 };
 return <section className="rp-content" aria-label="Human specialist choice and whole-system test">
  <h3>HIL selection: you choose the RPLICE method; DIS coordinates its use</h3>
  <p>Choose the specialist analysis, declare its purpose, and decide whether to transfer the bounded, non-identifying question. Selecting a method is not an organizational sign-off or an implementation order.</p>
  <label className="rp-field"><span>Human-selected method</span>
   <select value={method} onChange={e=>{setMethod(e.target.value as HILMethod);setConsent(false);setResult(null);}}>
    <option value="NONE">Not selected</option><option value="SALP">SALP — anchors and leverage points</option>
    <option value="CFIR">CFIR — local implementation determinants</option>
    <option value="RE_AIM">RE-AIM — reach, effectiveness, adoption, implementation, maintenance</option>
    <option value="PARALLAX">Parallax — stakeholder perspective comparison (via Council)</option>
   </select>
  </label>
  <label className="rp-field"><span>Purpose / scope of analysis</span>
   <textarea rows={2} maxLength={320} value={purpose} onChange={e=>{setPurpose(e.target.value);setResult(null);}}/>
  </label>
  {method==="SALP"&&<label className="rp-field"><span>Human-declared anchor hypotheses — one per line: name | priority weight 0–10 | sensitivity 1–5</span>
   <textarea rows={5} maxLength={2500} value={anchorsText} onChange={e=>{setAnchorsText(e.target.value);setResult(null);}}
    placeholder={"Care navigation follow-through | 5 | 4\nReferral capacity | 4 | 4\nTransport access | 3 | 5"}/>
   <small>Values are operator-assigned exploratory judgments, never asserted empirical weights.</small></label>}
  {method==="PARALLAX"&&<p>Select and consent to an operator-declared stakeholder comparison in the <a href="/#consult">existing DIS Council</a>. It must not be represented as a real stakeholder interview.</p>}
  {method!=="NONE"&&method!=="PARALLAX"&&<label className="rp-field"><span>
   <input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);setResult(null);}}/>
   I personally select this method and authorize sharing the non-identifying question, purpose and declared method inputs with RPLICE via its existing MCP interface.
  </span></label>}
  <button type="button" disabled={working||!consent||method==="NONE"||method==="PARALLAX"||purpose.length<8} onClick={()=>void run()}>
   {working?"Consulting RPLICE…":"Run selected methodology"}</button>
  {error&&<p role="alert">{error}</p>}
  {result&&<article className="rp-focus"><h4>RPLICE result — provisional analytic output</h4>
   <p>{result.assurance}</p><p><b>MCP tool:</b> {result.tool} · <b>Source:</b> {result.source}</p>
   <p><b>RPLICE execution ID:</b> {result.executionReceipt?.executionId||"Not reported"} · <b>Persisted scientific run:</b> {result.executionReceipt?.persisted===false?"No":"Not established"} · <b>Independent verification:</b> {result.executionReceipt?.independentVerification===false?"No":"Not established"}</p>
   <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(result.analysis?.result,null,2)}</pre>
   <p><b>Timestamp:</b> {result.analysis?.provenance?.generated_at||"Not reported"}</p></article>}
  <h3>Triple differences: evidence-dependent, not a decorative analysis</h3>
  {program.indicators.some(x=>x.site==="colorectal")&&<p>Historical NCI county-level late-stage colorectal rates (2018–2022): Hinds County, Mississippi 30.4 and Harris County, Texas 23.3 cases per 100,000. The shares of diagnosed cases classified as late-stage were 63.3% and 63.4%, respectively. These are different measures, not a before/after intervention panel. <a href="https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&stage=211&statefips=28&type=incd&year=0" target="_blank" rel="noreferrer">Mississippi NCI table</a> · <a href="https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&stage=211&statefips=48&type=incd&year=0" target="_blank" rel="noreferrer">Texas NCI table</a>.</p>}
  <p><strong>{exercise.ddd.status.replaceAll("_"," ")}</strong>: {exercise.ddd.interpretation}</p>
  <details><summary>Assess a supplied eight-cell DDD panel</summary>
   <p>Provide observed treatment/comparison × pre/post × focus/other subgroup cells. Required fields per row: treatment, post, focusGroup (booleans), value, n, unit and populationDefinition. Even a complete panel provides only arithmetic until causal assumptions are assessed.</p>
   <textarea rows={6} value={panelText} onChange={e=>setPanelText(e.target.value)} aria-label="DDD panel JSON"
    placeholder='[{"treatment":true,"post":false,"focusGroup":true,"value":20,"n":100,"unit":"percent","populationDefinition":"eligible adults"}, ...]'/>
   <button type="button" onClick={importPanel}>Assess panel</button>
   {panelError&&<p role="alert">{panelError}</p>}
   {exercise.ddd.estimate!==null&&<p>Descriptive triple difference: {exercise.ddd.estimate} {exercise.ddd.unit}. No causal claim is made.</p>}
  </details>
  <h3>Full research-to-action thinking exercise</h3>
  <p>The same program object traverses the established {exercise.phaseReceipts.length} phases, preserving their owners and acceptance evidence. Every stage has a worked design output; none is falsely marked as a completed field intervention.</p>
  <details><summary>Review all {exercise.phaseReceipts.length} stage evidence requirements</summary>
   <ol>{exercise.phaseReceipts.map(x=><li key={x.id}><strong>{x.title}</strong> — {x.status.replaceAll("_"," ").toLowerCase()}.
    <p><b>Accountable roles:</b> {x.owner}</p><p><b>Evidence needed:</b> {x.evidenceRequired.join("; ")}</p></li>)}</ol>
  </details>
  <h4>Designed · Operational · Experienced</h4>
  <p>{exercise.statementOfReality.designed}</p><p>{exercise.statementOfReality.operational}</p><p>{exercise.statementOfReality.experienced}</p>
  <h4>Stakeholder voice and adaptation</h4>
  <p>{exercise.stakeholderPerspectives.length} distinct roles are identified for participation; none is claimed to have been interviewed. The transfer matrix examines site mechanisms, local resources and acceptable adaptations before recommending any replication.</p>
  <h4>Day after success and the next ten years</h4>
  <p>Reconfirm ownership, financing, safety, participation, measurement quality, equity, succession, and emerging implementation conditions. The system must reopen unresolved gaps instead of treating initial success as mission completion.</p>
 </section>;
}
