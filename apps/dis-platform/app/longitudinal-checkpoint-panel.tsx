"use client";
import {useMemo,useState} from "react";
import type {ResearchProgram} from "../lib/research-program";
import {reviewLongitudinalCheckpoint,type CheckpointEvidence,type CheckpointMeasure,type OutcomePath} from "../lib/longitudinal-assurance";

/** Owner-submitted checkpoint scratchpad. No transport or storage.
 * All data remain SOURCE-REPORTED, not independently verified.
 */
const paths:OutcomePath[]=["NOT_TESTED","FAILURE","PARTIAL_SUCCESS","SUCCESS","UNINTENDED_HARM"];
const labels:{key:keyof Pick<CheckpointEvidence,"ownerConfirmed"|"successorConfirmed"|"resourcingConfirmed"|"stakeholderParticipationConfirmed"|"outcomeIndependentReviewConfirmed"|"adverseEffectsReviewed"|"environmentChanged"|"destinationTransferRequested">;text:string}[]=[
 {key:"ownerConfirmed",text:"An actual owner has accepted responsibility (declaration only)"},
 {key:"successorConfirmed",text:"A post-pilot successor has accepted responsibility (declaration only)"},
 {key:"resourcingConfirmed",text:"Sustainment resources have been committed (declaration only)"},
 {key:"stakeholderParticipationConfirmed",text:"Affected stakeholders actually participated (declaration only)"},
 {key:"outcomeIndependentReviewConfirmed",text:"An independent reviewer has examined outcomes (declaration only)"},
 {key:"adverseEffectsReviewed",text:"Unintended harms and burden have been assessed (declaration only)"},
 {key:"environmentChanged",text:"Population, policy, technology or other contextual conditions changed"},
 {key:"destinationTransferRequested",text:"A different institution or geography is requesting adoption"}
];
const initialFlags={
 ownerConfirmed:false,successorConfirmed:false,resourcingConfirmed:false,
 stakeholderParticipationConfirmed:false,outcomeIndependentReviewConfirmed:false,adverseEffectsReviewed:false,
 environmentChanged:false,destinationTransferRequested:false
};
const asNumber=(s:string)=>s.trim()===""?null:Number(s);
export default function LongitudinalCheckpointPanel({program}:{program:ResearchProgram}){
 const [path,setPath]=useState<OutcomePath>("SUCCESS");
 const [asOf,setAsOf]=useState("");
 const [observedAt,setObservedAt]=useState("");
 const [receivedAt,setReceivedAt]=useState("");
 const [measureRole,setMeasureRole]=useState<CheckpointMeasure["role"]>("BENEFICIARY_OUTCOME");
 const [construct,setConstruct]=useState("");
 const [unit,setUnit]=useState("");
 const [sourceId,setSourceId]=useState("");
 const [lineage,setLineage]=useState("");
 const [population,setPopulation]=useState(program.population.targetName);
 const [baseline,setBaseline]=useState("");
 const [observed,setObserved]=useState("");
 const [denominator,setDenominator]=useState("");
 const [comparator,setComparator]=useState("");
 const [limitations,setLimitations]=useState("");
 const [harmDirection,setHarmDirection]=useState<"UNKNOWN"|"HIGHER_IS_WORSE"|"LOWER_IS_WORSE">("UNKNOWN");
 const [coreAffected,setCoreAffected]=useState(false);
 const [adaptWhat,setAdaptWhat]=useState("");
 const [adaptWhy,setAdaptWhy]=useState("");
 const [adaptOwner,setAdaptOwner]=useState("");
 const [adaptRetest,setAdaptRetest]=useState("");
 const [flags,setFlags]=useState(initialFlags);
 const [reviewed,setReviewed]=useState(false);
 const packet=useMemo<CheckpointEvidence>(()=>{
  const active=Boolean(construct.trim()||baseline.trim()||observed.trim()||sourceId.trim());
  const measure:CheckpointMeasure={
    id:"DECLARED_MEASURE_1",role:measureRole,construct,unit,population,
    baseline:asNumber(baseline),observed:asNumber(observed),denominator:asNumber(denominator),
    sourceId,originalLineage:lineage,observedAt,receivedAt,
    comparator:comparator||null,definitionVersion:"DECLARED_UNVERIFIED",
    limitations:limitations.trim()?[limitations]:[],
    ...(harmDirection==="UNKNOWN"?{}:{higherMeansWorse:harmDirection==="HIGHER_IS_WORSE"})
  };
  return {
    caseId:program.caseId,asOf,reportedPath:path,
    measures:active?[measure]:[],
    ...flags,
    ...(adaptWhat.trim()||coreAffected?{proposedAdaptation:{
      coreFunctionAffected:coreAffected,whatChanges:adaptWhat,reason:adaptWhy,
      owner:adaptOwner,reviewAfter:adaptRetest
    }}:{})
  };
 },[program.caseId,asOf,path,measureRole,construct,unit,population,baseline,observed,denominator,
  sourceId,lineage,observedAt,receivedAt,comparator,limitations,harmDirection,flags,coreAffected,
  adaptWhat,adaptWhy,adaptOwner,adaptRetest]);
 const result=useMemo(()=>reviewLongitudinalCheckpoint(program,packet),[program,packet]);
 const textField=(label:string,value:string,onChange:(v:string)=>void,placeholder?:string)=>
  <label className="rp-field"><span>{label}</span><input value={value} onChange={e=>{onChange(e.target.value);setReviewed(false)}} maxLength={320} placeholder={placeholder}/></label>;
 return <section className="rp-focus" aria-label="Dynamic longitudinal checkpoint">
  <h4>Longitudinal checkpoint — review the evidence after adoption or failure</h4>
  <p>Use <strong>fictional or non-identifying aggregate observations only</strong>. This assessment is local to your browser, does not contact a patient, clinician, agency or model, and does not save a history or verify a real source. It can only surface further questions, concerns and human-review gates.</p>
  <label className="rp-field"><span>Reported outcome (not verified)</span>
    <select aria-label="Reported checkpoint outcome" value={path} onChange={e=>{setPath(e.target.value as OutcomePath);setReviewed(false)}}>
      {paths.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
    </select>
  </label>
  <div className="rp-card-grid">
    {textField("Decision as-of time (ISO with Z or offset)",asOf,setAsOf,"2026-11-06T14:00:00Z")}
    {textField("Original observation time",observedAt,setObservedAt,"2026-11-05T14:00:00Z")}
    {textField("When the source was received",receivedAt,setReceivedAt,"2026-11-06T13:00:00Z")}
    {textField("Construct actually measured",construct,setConstruct,"e.g., eligible follow-up completed")}
    <label className="rp-field"><span>Kind of measurement</span>
      <select value={measureRole} onChange={e=>{setMeasureRole(e.target.value as CheckpointMeasure["role"]);setReviewed(false)}}>
        {(["BENEFICIARY_OUTCOME","IMPLEMENTATION_FIDELITY","REACH","BALANCING_HARM","COST","OTHER"] as const).map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}
      </select>
    </label>
    {textField("Measurement unit",unit,setUnit,"count, per 100,000, percent, hours")}
    {textField("Measured population and scope",population,setPopulation)}
    {textField("Original source identifier (nonpersonal)",sourceId,setSourceId)}
    {textField("Original instrument/dataset lineage",lineage,setLineage)}
    {textField("Baseline (if legitimately comparable)",baseline,setBaseline)}
    {textField("Observed value (aggregate or synthetic)",observed,setObserved)}
    {textField("Denominator (valid eligible cohort)",denominator,setDenominator)}
    {textField("Current-practice comparator",comparator,setComparator)}
    {textField("Measurement limitations",limitations,setLimitations)}
    {measureRole==="BALANCING_HARM"&&<label className="rp-field"><span>Direction of adverse-effect measure</span>
      <select value={harmDirection} onChange={e=>{setHarmDirection(e.target.value as typeof harmDirection);setReviewed(false)}}>
        <option value="UNKNOWN">Unknown — do not infer</option>
        <option value="HIGHER_IS_WORSE">Higher measurement means worse</option>
        <option value="LOWER_IS_WORSE">Lower measurement means worse</option>
      </select>
    </label>}
  </div>
  <h4>Human accountability and changing conditions</h4>
  <div className="rp-card-grid">{labels.map(f=><label key={f.key} className="rp-check">
    <input type="checkbox" checked={flags[f.key]} onChange={e=>{setFlags(old=>({...old,[f.key]:e.target.checked}));setReviewed(false)}}/>
    {f.text}
  </label>)}</div>
  <h4>Proposed adaptation (never automatically implemented)</h4>
  <label className="rp-check"><input type="checkbox" checked={coreAffected} onChange={e=>{setCoreAffected(e.target.checked);setReviewed(false)}}/> Could this change the hypothesized core function?</label>
  <div className="rp-card-grid">
    {textField("What would change?",adaptWhat,setAdaptWhat)}
    {textField("Why and based on what evidence?",adaptWhy,setAdaptWhy)}
    {textField("Authorized owner role (not an approval)",adaptOwner,setAdaptOwner)}
    {textField("Next independent retest/review time",adaptRetest,setAdaptRetest)}
  </div>
  <button type="button" className="rp-action" onClick={()=>setReviewed(true)}>Review checkpoint evidence locally</button>
  {reviewed&&<div className="rp-stage-gate" role="status">
    <strong>Review result: {result.finding.replaceAll("_"," ")}</strong>
    <p>{result.reviewIssues.length} methodological or sustainability gaps. This is not proof that the intervention caused a benefit, met a safety standard, succeeded, failed, or should be scaled. Reported evidence is not independently verified.</p>
    <ul>{result.reviewIssues.map(x=><li key={x.code}><strong>{x.code.replaceAll("_"," ")}:</strong> {x.explanation}<div className="rp-note">Required: {x.requiredProof}</div></li>)}</ul>
    <h4>Actions for the authorized review team to examine</h4>
    <ul>{result.scenarioActions.map(x=><li key={x}>{x}</li>)}</ul>
    <p><strong>Core-function change executed:</strong> No. <strong>Scale authorized:</strong> No. <strong>Actual outcome causally established:</strong> No.</p>
  </div>}
 </section>;
}
