"use client";
import {useEffect,useMemo,useState} from "react";
import {investigateMethod,type Inquiry,type ClaimKind,type EvidenceKind} from "../lib/dis-inquire";

/**
 * Local-only scientific-method rehearsal integrated with the existing Council
 * research journey. Does not send entered notes to any external model or API.
 */
type HypForm={explanation:string;prediction:string;falsifier:string;alternatives:string};
type SourceForm={name:string;construct:string;unit:string;scope:string;origin:string;lineage:string;limitation:string;fit:string;validation:string;observedAt:string;retrievedAt:string;kind:EvidenceKind};
const newHyp=():HypForm=>({explanation:"",prediction:"",falsifier:"",alternatives:""});
const newSource=():SourceForm=>({name:"",construct:"",unit:"",scope:"",origin:"",lineage:"",limitation:"",fit:"",validation:"",observedAt:"",retrievedAt:"",kind:"STUDY_REPORT"});
function Field({label,value,onChange,rows=1,placeholder}:{label:string;value:string;onChange:(v:string)=>void;rows?:number;placeholder?:string}){
  return <label style={{display:"flex",flexDirection:"column",gap:5,minWidth:0,margin:"10px 0",fontSize:13}}>
    <span style={{fontWeight:650}}>{label}</span>
    {rows>1?<textarea aria-label={label} rows={rows} value={value} maxLength={1200} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>:
      <input aria-label={label} value={value} maxLength={600} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>}
  </label>;
}
const lines=(s:string)=>s.split(/\n|;/).map(x=>x.trim()).filter(Boolean).slice(0,12);
export default function InquiryMethodStudio({initialQuestion="",initialPopulation="",initialOutcome="",initialContext=""}:{
  initialQuestion?:string;initialPopulation?:string;initialOutcome?:string;initialContext?:string
}){
  const [main,setMain]=useState({
    question:initialQuestion,intendedUse:"Preliminary study / investigation design — not a decision authorization",
    owner:"",population:initialPopulation,outcome:initialOutcome,context:initialContext,
    phenomenon:"",constructs:"",discrimination:"",scope:"",unknowns:"",
    action:"",existing:"",alternatives:"",harms:"",success:"",futureOwner:"",stopTrigger:"",
    asOf:""
  });
  const [hyp,setHyp]=useState<HypForm[]>([newHyp()]);
  const [sources,setSources]=useState<SourceForm[]>([newSource()]);
  const [claim,setClaim]=useState({text:"",kind:"DESCRIPTIVE" as ClaimKind,target:"",population:"",comparator:"",identification:"",uncertainty:false,benefit:false,externalValidation:""});
  const [showReview,setShowReview]=useState(false);
  const [copyStatus,setCopyStatus]=useState("");
  // The timestamp is populated after hydration; server/client clocks cannot
  // create inconsistent markup and the user may override decision-as-of time.
  useEffect(()=>setMain(p=>p.asOf?p:{...p,asOf:new Date().toISOString()}),[]);
  const field=(key:keyof typeof main,value:string)=>{setMain(p=>({...p,[key]:value}));};
  const hfield=(i:number,key:keyof HypForm,value:string)=>setHyp(p=>p.map((x,j)=>i===j?{...x,[key]:value}:x));
  const sfield=(i:number,key:keyof SourceForm,value:string)=>setSources(p=>p.map((x,j)=>i===j?{...x,[key]:value}:x));
  const activeSources=sources.map((s,i)=>({...s,id:"I"+(i+1)})).filter(s=>s.name.trim()||s.construct.trim()||s.origin.trim());
  const packet=useMemo<Inquiry>(()=>({
    id:"local-method-scratch",decisionAsOf:main.asOf,question:main.question,
    intendedUse:main.intendedUse,decisionOwner:main.owner,
    targetPopulation:main.population,targetOutcome:main.outcome,systemContext:main.context,
    searchFrame:{
      phenomenon:main.phenomenon,constructsToDistinguish:lines(main.constructs),
      discriminatingObservation:main.discrimination,scopeAndBoundaries:main.scope,
      unresolvedPossibilities:lines(main.unknowns)
    },
    hypotheses:hyp.filter(h=>Object.values(h).some(x=>x.trim())).map((h,i)=>({
      id:"H"+(i+1),explanation:h.explanation,
      predictedObservations:lines(h.prediction),disconfirmingObservations:lines(h.falsifier),
      alternativesConsidered:lines(h.alternatives)
    })),
    instruments:activeSources.map(s=>({
      id:s.id,name:s.name,construct:s.construct,unit:s.unit,intendedScope:s.scope,
      limitation:s.limitation,sourceId:s.origin,originalLineage:s.lineage,kind:s.kind,
      observedAt:s.observedAt||null,retrievedAt:s.retrievedAt||null,
      validationEvidence:s.validation||null,fitForUseJustification:s.fit||null
    })),
    evidence:claim.text.trim()?[{
      id:"C1",claim:claim.text,kind:claim.kind,
      instrumentIds:activeSources.map(s=>s.id),
      targetOutcome:claim.target,referencePopulation:claim.population,
      comparison:claim.comparator||null,causalIdentification:claim.identification||null,
      uncertaintyReported:claim.uncertainty,targetBenefitMeasured:claim.benefit,
      externalValidation:claim.externalValidation||null
    }]:[],
    proposedDecision:main.action.trim()?{
      action:main.action,options:lines(main.alternatives),currentPracticeComparator:main.existing||null,
      potentialHarms:lines(main.harms),measureOfSuccess:main.success||null,
      futureOwner:main.futureOwner||null,reviewOrStopTrigger:main.stopTrigger||null
    }:undefined
  }),[main,hyp,sources,claim]);
  const result=useMemo(()=>investigateMethod(packet),[packet]);
  return <section className="consult-panel" aria-label="DIS Inquiry Method Studio">
    <h3>DIS Inquiry Method Studio — how to investigate, not what to conclude</h3>
    <p className="truth-note">This is a local browser-only methodological exercise. It makes no research/API/model calls and does not retain or submit inputs. Use fictional or non-sensitive material only. A clear checklist is not clinical advice, proof of causation, approval, or an independently validated study.</p>
    <details className="research-import"><summary>1. Define what you are actually searching for</summary>
      <Field label="Decision or research question" value={main.question} onChange={v=>field("question",v)} rows={2}/>
      <Field label="The underlying phenomenon, not a convenient indicator" value={main.phenomenon} onChange={v=>field("phenomenon",v)} rows={2}/>
      <Field label="What candidate measurements or constructs differ? (one per line)" value={main.constructs} onChange={v=>field("constructs",v)} rows={2}/>
      <Field label="What observation would distinguish among explanations?" value={main.discrimination} onChange={v=>field("discrimination",v)} rows={2}/>
      <Field label="Scope, population and relevant period" value={main.scope} onChange={v=>field("scope",v)}/>
      <Field label="Unconsidered or unresolved possibilities (one per line)" value={main.unknowns} onChange={v=>field("unknowns",v)} rows={2}/>
      <Field label="Intended use (not permission for consequential action)" value={main.intendedUse} onChange={v=>field("intendedUse",v)}/>
      <Field label="Human reviewer or decision owner" value={main.owner} onChange={v=>field("owner",v)}/>
      <Field label="Target population" value={main.population} onChange={v=>field("population",v)}/>
      <Field label="Outcome that matters" value={main.outcome} onChange={v=>field("outcome",v)}/>
      <Field label="Context and existing systems" value={main.context} onChange={v=>field("context",v)} rows={2}/>
      <Field label="As-of time (ISO with Z or offset)" value={main.asOf} onChange={v=>field("asOf",v)}/>
    </details>
    <details className="research-import"><summary>2. Propose competing explanations and falsifiers</summary>
      {hyp.map((h,i)=><fieldset key={i} style={{border:"1px solid #b9cbd0",padding:12,margin:"12px 0",minWidth:0,borderRadius:8}}>
        <legend>Explanation {i+1}</legend>
        <Field label={"Explanation "+(i+1)} value={h.explanation} onChange={v=>hfield(i,"explanation",v)} rows={2}/>
        <Field label={"Prediction "+(i+1)+" — observable if supported"} value={h.prediction} onChange={v=>hfield(i,"prediction",v)} rows={2}/>
        <Field label={"Falsifier "+(i+1)+" — observation that challenges it"} value={h.falsifier} onChange={v=>hfield(i,"falsifier",v)} rows={2}/>
        <Field label={"Alternatives "+(i+1)+" (one per line)"} value={h.alternatives} onChange={v=>hfield(i,"alternatives",v)} rows={2}/>
        {hyp.length>1&&<button type="button" onClick={()=>setHyp(p=>p.filter((_,j)=>i!==j))}>Remove this explanation</button>}
      </fieldset>)}
      <button type="button" disabled={hyp.length>=4} onClick={()=>setHyp(p=>[...p,newHyp()])}>Add competing explanation</button>
      <p className="truth-note">A missing or inconsistent observation does not automatically eliminate a hypothesis. The assessor must verify the source, instrument, interpretation, and conditions of the proposed falsifier.</p>
    </details>
    <details className="research-import"><summary>3. Audit instruments and source lineage</summary>
      {sources.map((s,i)=><fieldset key={i} style={{border:"1px solid #b9cbd0",padding:12,margin:"12px 0",minWidth:0,borderRadius:8}}>
        <legend>Instrument or source {i+1}</legend>
        <Field label={"Source/instrument name "+(i+1)} value={s.name} onChange={v=>sfield(i,"name",v)}/>
        <label style={{display:"flex",flexDirection:"column",gap:6,margin:"10px 0"}}>Evidence class
          <select aria-label={"Evidence class "+(i+1)} value={s.kind} onChange={e=>sfield(i,"kind",e.target.value)}>
            {(["MEASUREMENT","STUDY_REPORT","MODEL_OUTPUT","EXPERIENCE","SCENARIO","PERSONA_PROMPT"] as const).map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}
          </select>
        </label>
        <Field label={"Construct measured "+(i+1)} value={s.construct} onChange={v=>sfield(i,"construct",v)}/>
        <Field label={"Units "+(i+1)} value={s.unit} onChange={v=>sfield(i,"unit",v)}/>
        <Field label={"Measurement scope "+(i+1)} value={s.scope} onChange={v=>sfield(i,"scope",v)}/>
        <Field label={"Original source identifier "+(i+1)} value={s.origin} onChange={v=>sfield(i,"origin",v)}/>
        <Field label={"Underlying shared dataset/instrument lineage "+(i+1)} value={s.lineage} onChange={v=>sfield(i,"lineage",v)}/>
        <Field label={"Blind spots and limitations "+(i+1)} value={s.limitation} onChange={v=>sfield(i,"limitation",v)} rows={2}/>
        <Field label={"Fit-for-this-question justification "+(i+1)} value={s.fit} onChange={v=>sfield(i,"fit",v)} rows={2}/>
        <Field label={"Validation evidence (declared, not verified) "+(i+1)} value={s.validation} onChange={v=>sfield(i,"validation",v)}/>
        <Field label={"Observed timestamp "+(i+1)+" (ISO with offset)"} value={s.observedAt} onChange={v=>sfield(i,"observedAt",v)}/>
        <Field label={"Retrieved timestamp "+(i+1)+" (ISO with offset)"} value={s.retrievedAt} onChange={v=>sfield(i,"retrievedAt",v)}/>
        {sources.length>1&&<button type="button" onClick={()=>setSources(p=>p.filter((_,j)=>i!==j))}>Remove this source</button>}
      </fieldset>)}
      <button type="button" disabled={sources.length>=4} onClick={()=>setSources(p=>[...p,newSource()])}>Add source/instrument</button>
    </details>
    <details className="research-import"><summary>4. Distinguish claims, mechanisms, outcomes and counterfactuals</summary>
      <Field label="Specific claim to investigate" value={claim.text} onChange={v=>setClaim(p=>({...p,text:v}))} rows={2}/>
      <label style={{display:"flex",flexDirection:"column",gap:6,margin:"10px 0"}}>Kind of claim
        <select aria-label="Kind of claim" value={claim.kind} onChange={e=>setClaim(p=>({...p,kind:e.target.value as ClaimKind}))}>
          {(["DESCRIPTIVE","MECHANISTIC","ASSOCIATIONAL","PREDICTIVE","CAUSAL","INTERVENTION_EFFECT"] as const).map(k=><option key={k} value={k}>{k.replaceAll("_"," ")}</option>)}
        </select>
      </label>
      <Field label="Actual endpoint in claim" value={claim.target} onChange={v=>setClaim(p=>({...p,target:v}))}/>
      <Field label="Study/reference population" value={claim.population} onChange={v=>setClaim(p=>({...p,population:v}))}/>
      <Field label="Actual comparator or control group" value={claim.comparator} onChange={v=>setClaim(p=>({...p,comparator:v}))}/>
      <Field label="Causal identification and competing-bias strategy" value={claim.identification} onChange={v=>setClaim(p=>({...p,identification:v}))} rows={2}/>
      <Field label="External validation or transport evidence" value={claim.externalValidation} onChange={v=>setClaim(p=>({...p,externalValidation:v}))}/>
      <label style={{display:"flex",gap:8,margin:"10px 0"}}><input type="checkbox" checked={claim.uncertainty} onChange={e=>setClaim(p=>({...p,uncertainty:e.target.checked}))}/> Uncertainty was reported (declaration only)</label>
      <label style={{display:"flex",gap:8,margin:"10px 0"}}><input type="checkbox" checked={claim.benefit} onChange={e=>setClaim(p=>({...p,benefit:e.target.checked}))}/> Intended beneficiary outcome was measured (declaration only)</label>
      <Field label="Proposed intervention or decision (optional)" value={main.action} onChange={v=>field("action",v)} rows={2}/>
      <Field label="Competent current-practice comparator" value={main.existing} onChange={v=>field("existing",v)}/>
      <Field label="Alternative actions (one per line)" value={main.alternatives} onChange={v=>field("alternatives",v)} rows={2}/>
      <Field label="Possible harms or equity impacts" value={main.harms} onChange={v=>field("harms",v)} rows={2}/>
      <Field label="Meaningful outcome and measurement" value={main.success} onChange={v=>field("success",v)}/>
      <Field label="Post-success human owner" value={main.futureOwner} onChange={v=>field("futureOwner",v)}/>
      <Field label="Review, reversal or stopping trigger" value={main.stopTrigger} onChange={v=>field("stopTrigger",v)}/>
    </details>
    <button type="button" className="primary-cta" onClick={()=>setShowReview(true)}>Assess investigation method locally</button>
    {showReview&&<section className="truth-note" aria-live="polite" aria-label="DIS method assessment">
      <h4>{result.state==="NOT_READY_FOR_CLAIM"?"Claim not ready for inference":"Method requires independent review"}</h4>
      <p>{result.findings.length} methodological question(s) remain open. This does not tell you what diagnosis, conclusion or intervention is correct. No claim is independently validated or authorized.</p>
      {result.findings.length===0?<p>No deterministic methodological gaps were flagged. That does not prove correctness or validate the source declarations.</p>:
        <ol>{result.findings.map(f=><li key={f.id} style={{marginBottom:8}}>
          <strong>{f.domain} — {f.id.replaceAll("_"," ")}</strong> ({f.level}).
          {' '}{f.finding} <em>Next question: {f.nextQuestion}</em>
        </li>)}</ol>}
      <details><summary>Underlying methodological questions and remaining unknowns</summary>
        <ol>{result.methodologicalQuestions.map(q=><li key={q}>{q}</li>)}</ol>
        <p>Open-world rule: elimination of listed explanations never certifies that all possible explanations have been considered.</p>
      </details>
      <button type="button" onClick={()=>{const output=JSON.stringify({schema:"dis-inquiry-local-draft-v1",packet,assessment:result},null,2);if(!navigator.clipboard){setCopyStatus("Clipboard access unavailable; no record was exported.");return;}void navigator.clipboard.writeText(output).then(()=>setCopyStatus("Draft research method record copied locally.")).catch(()=>setCopyStatus("Clipboard denied; no record was exported."));}}>Copy draft research-method record</button>
      <p role="status">{copyStatus}</p>
      <p>Copying exports the supplied text to your clipboard. Do not copy or paste protected records into an uncontrolled destination.</p>
    </section>}
  </section>;
}
