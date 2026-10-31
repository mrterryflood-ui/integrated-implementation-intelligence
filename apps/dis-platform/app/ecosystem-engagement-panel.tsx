'use client';
import type {EngagementInput} from '../lib/ecosystem/contracts';
import {useEffect,useRef,useState} from 'react';
import styles from './ecosystem-engagement-panel.module.css';
import type {ConsultationPackage} from '../lib/consultation-package';
import type {IntelligenceBundle} from '../lib/consultation-research';
type Props={privateReady:boolean;problem:string;audience:string;initialContext?:EngagementInput|null;onResult:(pkg:ConsultationPackage,intel:IntelligenceBundle,context:EngagementInput)=>void};
/** UI consumes the same protected orchestration path; public discovery never runs tools. */
export default function EcosystemEngagementPanel({privateReady,problem,audience,initialContext,onResult}:Props){
 const [kind,setKind]=useState(initialContext?.geography.kind||'city'),[label,setLabel]=useState(initialContext?.geography.label||''),[state,setState]=useState(initialContext?.geography.stateFips||''),[county,setCounty]=useState(initialContext?.geography.countyFips||''),[place,setPlace]=useState(initialContext?.geography.placeFips||''),[zcta,setZcta]=useState(initialContext?.geography.zcta||'');
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[plan,setPlan]=useState<any>(null),[result,setResult]=useState<any>(null),[error,setError]=useState('');
 const request=useRef<AbortController|null>(null),revision=useRef(0);
 useEffect(()=>{revision.current++;request.current?.abort();setBusy(false);setPlan(null);setResult(null);setConsent(false)},[problem,audience,kind,label,state,county,place,zcta]);
 useEffect(()=>()=>{revision.current++;request.current?.abort()},[]);
 const engagement=()=>({problem,audience:audience||'Decision owner and affected people',geography:{kind,...(label?{label}:{}),...(state?{stateFips:state}:{}),...(county?{countyFips:county}:{}),...(kind==='city'&&place?{placeFips:place}:{}),...(kind==='zcta'&&zcta?{zcta}:{})},externalConsent:consent});
 async function run(execute:boolean){
  if(busy||problem.trim().length<8||execute&&(!privateReady||!consent))return;
  const version=++revision.current;request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError('');
  try{
   const input=engagement();
   const body=execute?{mode:'ecosystem-invoke',engagement:input}:{jsonrpc:'2.0',id:'ecosystem-plan',method:'tools/call',params:{name:'dis_ecosystem_plan',arguments:{problem:input.problem,audience:input.audience,geography:input.geography}}};
   const response=await fetch(execute?'/api/capability-fabric':'/api/mcp',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
   const data=await response.json();if(!response.ok||data.error)throw Error(typeof data.error==='string'?data.error:data.error?.message||'This engagement could not be completed.');
   if(version!==revision.current)return;
   if(execute){setResult(data.result);setPlan(data.result.plan);onResult(data.package,data.intelligence,data.result.plan.input);}
   else setPlan(JSON.parse(data.result.content.find((c:any)=>c.type==='text').text));
  }catch(e){if(version===revision.current)setError(e instanceof Error?e.message:'Unable to complete this request.');}finally{if(version===revision.current)setBusy(false);}
 }
 return <section className={styles.panel} aria-label="Coordinate the ecosystem" style={{border:'1px solid currentColor',borderRadius:12,padding:20,marginBlock:20}}><h3>Bring the right capabilities together</h3><p>Use the question above once. DIS proposes the relevant specialist contributions, keeps their source dates and boundaries visible, and carries the results into the draft package.</p>
 <label>Study boundary <select value={kind} onChange={e=>setKind(e.target.value as EngagementInput['geography']['kind'])}><option value="city">City</option><option value="county">County</option><option value="zcta">Census ZIP Code Tabulation Area</option><option value="unspecified">Not place-based</option></select></label>
 {kind!=='unspecified'&&<div><label>Public place name <input value={label} maxLength={120} onChange={e=>setLabel(e.target.value)} placeholder="City or county name"/></label><label>State FIPS <input value={state} inputMode="numeric" maxLength={2} onChange={e=>setState(e.target.value)} placeholder="Two digits"/></label><label>County FIPS for regional context <input value={county} inputMode="numeric" maxLength={5} onChange={e=>setCounty(e.target.value)} placeholder="Five digits"/></label>{kind==='city'&&<label>City/place FIPS, when known <input value={place} inputMode="numeric" maxLength={5} onChange={e=>setPlace(e.target.value)}/></label>}{kind==='zcta'&&<label>Census ZCTA <input value={zcta} inputMode="numeric" maxLength={5} onChange={e=>setZcta(e.target.value)}/></label>}</div>}
 <button type="button" disabled={busy||problem.trim().length<8} onClick={()=>run(false)}>Show the capability plan</button>
 {plan&&<div aria-live="polite">{plan.question&&<p><strong>One clarification:</strong> {plan.question}</p>}<ul>{plan.selected?.map((s:any)=><li key={s.id}><strong>{s.label}</strong> — {s.technicalState}. {s.purpose}</li>)}</ul><p>Integration approval, technical connection and evidence acceptance are separate. A planned tool has not necessarily run.</p></div>}
 <label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked){revision.current++;request.current?.abort();setBusy(false);setResult(null)}}}/> Allow the listed public/aggregate reads for this engagement. No individual health, client, or restricted operational records are requested.</label>
 <button type="button" disabled={busy||!privateReady||!consent||Boolean(plan?.question)||problem.trim().length<8} onClick={()=>run(true)}>{busy?'Coordinating the selected contributions…':'Retrieve evidence and update the package'}</button>
 {!privateReady&&<p>Capability planning is available here. Signed-in execution remains subject to the existing production identity release gate.</p>}
 {result&&<p role="status">{result.evidenceRecordCount} evidence records from {result.sourceCount} distinct source URLs; {result.networkRequests} network requests. Status: {result.state}. The council has not yet reviewed this package; implementation outcomes have not been measured.</p>}
 {error&&<p role="alert">{error}</p>}</section>;
}
