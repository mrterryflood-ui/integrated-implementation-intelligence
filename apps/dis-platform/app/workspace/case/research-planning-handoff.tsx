'use client';
import {useEffect,useRef,useState} from 'react';

type Props={caseId:string;caseVersion:number;caseTitle?:string;disabled?:boolean};
type Organization={id:string;name:string;role:string};
type Receipt={id:string;version:number;organizationId:string;organizationName:string;title:string;sourceDigest:string};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/** A user-initiated copy to an existing private organization draft. */
export default function ResearchPlanningHandoff(props:Props){
 // Key the entire local operation lifetime, including A → B → A navigation.
 return <CasePlanningHandoff key={props.caseId+':'+props.caseVersion} {...props}/>;
}
function CasePlanningHandoff({caseId,caseVersion,caseTitle,disabled=false}:Props){
 const [organizations,setOrganizations]=useState<Organization[]>([]),[selected,setSelected]=useState('');
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[confirmed,setConfirmed]=useState(false);
 const [error,setError]=useState(''),[receipt,setReceipt]=useState<Receipt|null>(null);
 const lifetime=useRef(0);
 useEffect(()=>{const epoch=++lifetime.current;return()=>{if(lifetime.current===epoch)lifetime.current++;};},[]);
 async function load(){
  const epoch=lifetime.current;setBusy(true);setError('');
  try{
   const response=await fetch('/api/organizations',{credentials:'same-origin',cache:'no-store'});
   const body=await response.json();if(!response.ok)throw Error(body.error||'Planning workspaces are unavailable.');
   if(!Array.isArray(body.organizations)||body.organizations.length>100)throw Error('The planning workspace list was not recognized.');
   const rows=body.organizations.filter((item:unknown):item is Organization=>Boolean(item)&&typeof item==='object'&&UUID.test((item as Organization).id)&&typeof (item as Organization).name==='string'&&['admin','facilitator','contributor'].includes((item as Organization).role));
   if(lifetime.current!==epoch)return;setOrganizations(rows);setLoaded(true);setSelected('');setConfirmed(false);setReceipt(null);
  }catch(cause){if(lifetime.current===epoch)setError(cause instanceof Error?cause.message:'Planning workspaces are unavailable.');}
  finally{if(lifetime.current===epoch)setBusy(false);}
 }
 async function save(){
  if(disabled||busy||!confirmed||!UUID.test(selected)||!UUID.test(caseId)||!Number.isSafeInteger(caseVersion)||caseVersion<1)return;
  const epoch=lifetime.current,organization=organizations.find(item=>item.id===selected);if(!organization)return;
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/organizations',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'import-research-case',organizationId:selected,caseId,caseVersion,confirmedPublicAggregate:true})});
   const body=await response.json();if(!response.ok)throw Error(body.error||'The planning copy could not be confirmed.');
   const row=body.result,snapshot=row?.body?.researchSnapshot;
   if(!row||!UUID.test(row.id)||row.kind!=='draft'||row.visibility!=='private'||!Number.isSafeInteger(row.version)||row.version<1||snapshot?.source?.caseId!==caseId||snapshot?.source?.caseVersion!==caseVersion||typeof snapshot.sourceDigest!=='string'||!/^[a-f0-9]{64}$/.test(snapshot.sourceDigest))throw Error('The private draft receipt was not recognized. Refresh the organization before retrying.');
   if(lifetime.current!==epoch)return;
   setReceipt({id:row.id,version:row.version,organizationId:selected,organizationName:organization.name,title:row.title,sourceDigest:snapshot.sourceDigest});
  }catch(cause){if(lifetime.current===epoch)setError(cause instanceof Error?cause.message:'The planning copy could not be confirmed.');}
  finally{if(lifetime.current===epoch)setBusy(false);}
 }
 return <section aria-label="Research case to organization planning">
  <h3>Continue this research in organization planning</h3>
  <p>Create a private planning draft from saved case version {caseVersion}{caseTitle?` (${caseTitle})`:''}. The copy retains the saved question, complete research assessment, actions, measures and learning notes. Save any current edits first.</p>
  <p>Your planning draft stays private until you submit it through the organization’s existing workflow. Source claims and recorded progress keep their current evidence status.</p>
  <button type="button" disabled={disabled||busy} onClick={()=>void load()}>{loaded?'Refresh planning workspaces':'Choose a planning workspace'}</button>
  {loaded&&<>
   {organizations.length?<label>Destination organization<select aria-label="Research planning destination" value={selected} disabled={disabled||busy} onChange={event=>{setSelected(event.target.value);setConfirmed(false);setReceipt(null);setError('');}}><option value="">Choose a destination</option>{organizations.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>:<p>No organization with contribution access is available to this account. You can review membership or create a planning workspace in <a href="/planning">organization planning</a>.</p>}
   {selected&&<>
    <label><input type="checkbox" checked={confirmed} disabled={disabled||busy||Boolean(receipt)} onChange={event=>setConfirmed(event.target.checked)}/> I reviewed the saved question, assessment and action record, and confirm that the complete copy contains only public aggregate or synthetic research, with no individual patient or confidential records.</label>
    <button type="button" disabled={disabled||busy||!confirmed||Boolean(receipt)} onClick={()=>void save()}>{busy?'Saving private planning copy…':'Create private planning draft'}</button>
   </>}
  </>}
  {error&&<p role="alert">{error}</p>}
  {receipt&&<div role="status">
   <p>Private draft saved in {receipt.organizationName}: {receipt.title}, planning version {receipt.version}. The retained source is case version {caseVersion}. Later changes to the case will not change this copy.</p>
   <p><a href="/planning">Open organization planning</a> and select {receipt.organizationName}, then “{receipt.title}” in permitted records to continue editing.</p>
   <p>{['json','md','docx'].map(format=><span key={format}><a href={'/api/organizations/export?'+new URLSearchParams({organizationId:receipt.organizationId,id:receipt.id,version:String(receipt.version),format})}>Download {format==='docx'?'Word':format.toUpperCase()}</a>{' '}</span>)}</p>
   <details><summary>Inspect the retained source receipt</summary><p>Draft: {receipt.id}<br/>Case: {caseId}, version {caseVersion}<br/>Source content SHA-256: {receipt.sourceDigest}</p><p>The fingerprint identifies the retained content. It does not independently verify its claims.</p></details>
  </div>}
 </section>;
}
