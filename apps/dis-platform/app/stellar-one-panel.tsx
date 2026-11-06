"use client";
import {useState} from "react";
import type {StellarOneAssessment,StellarOneInput,EnvironmentElement,ChainRelation} from "../lib/stellar-one";

type P={review:StellarOneAssessment;overrides:Partial<StellarOneInput>;onChange:(v:Partial<StellarOneInput>)=>void};
type Field="whatDoing"|"forWhom"|"understandOrDeliver"|"where"|"howLong"|"intendedChange"|"counterfactual"|"centerOfInquiry";
const FIELDS:{key:Field;label:string;hint:string}[]=[
 {key:"whatDoing",label:"What are we doing?",hint:"A real problem, inquiry, or delivery task—not an assumed solution"},
 {key:"forWhom",label:"For whom?",hint:"Beneficiaries, affected people, and potentially excluded populations"},
 {key:"understandOrDeliver",label:"To understand or deliver what?",hint:"Underlying phenomenon, intended evidence, or usable deliverable"},
 {key:"where",label:"Where and in which jurisdiction?",hint:"Correct geography, service catchment, and overlapping authorities"},
 {key:"howLong",label:"For how long?",hint:"Observation period, intervention window, delays, and day-after-success stewardship"},
 {key:"intendedChange",label:"To change or improve what?",hint:"Direct beneficiary/system outcome, valid denominator, and intended impact"},
 {key:"counterfactual",label:"Compared with what?",hint:"Competent existing process, realistic alternative, and no-change scenario"},
 {key:"centerOfInquiry",label:"What is the center of the chain?",hint:"Real phenomenon or decision, not a proxy or convenient dashboard"}
];
type MultiKey="stakeholders"|"demographicDimensions"|"historicalContext"|"perspectives";
const MULTI:{key:MultiKey;label:string;hint:string}[]=[
 {key:"stakeholders",label:"Stakeholders and decision rights",hint:"Who experiences, directs, funds, implements, dissents, and succeeds the project?"},
 {key:"demographicDimensions",label:"Demographics and relevant population strata",hint:"Record dimensions to validate; do not assume individual or group-level causes"},
 {key:"historicalContext",label:"Historical conditions and prior attempts",hint:"Sources, timelines, inherited systems, earlier benefits and failures"},
 {key:"perspectives",label:"Actual perspectives to invite",hint:"Whose lived experience or opposing analysis must be gathered with consent?"}
];
const LEVELS:EnvironmentElement["level"][]=["PERSON","GROUP","ORGANIZATION","COMMUNITY","LOCAL","REGIONAL","STATE","NATIONAL","GLOBAL","OTHER"];
const RELATIONS:ChainRelation[]=["UPSTREAM_OF","DOWNSTREAM_OF","DEPENDS_ON","INTERSECTS","PARALLEL_WITH"];
const split=(s:string)=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,14);

export default function StellarOnePanel({review,overrides,onChange}:P){
 const [name,setName]=useState("");
 const [role,setRole]=useState("");
 const [level,setLevel]=useState<EnvironmentElement["level"]>("ORGANIZATION");
 const [from,setFrom]=useState("MISSION_CENTER");
 const [to,setTo]=useState("");
 const [relation,setRelation]=useState<ChainRelation>("INTERSECTS");
 const [notice,setNotice]=useState("");
 const change=(key:keyof StellarOneInput,v:unknown)=>onChange({...overrides,[key]:v});
 const addElement=()=>{
   if(!name.trim()){setNotice("Name the stakeholder/system first.");return;}
   if((overrides.elements||[]).length>=16){setNotice("The local sample is limited to 16 elements; use an authorized full map for larger ecosystems.");return;}
   const current=overrides.elements||[];
   const id="S"+(current.length+1);
   const next=[...current,{id,name:name.trim().slice(0,130),level,role:role.trim().slice(0,240)||"Role not established"}];
   change("elements",next);setName("");setRole("");setTo(id);
   setNotice("Candidate element added. A name and relationship are not verified participation or causal evidence.");
 };
 const addRelation=()=>{
   if(!to||!review.environment.nodes.some(x=>x.id===from)||!review.environment.nodes.some(x=>x.id===to)||from===to){
     setNotice("Select two different recognized systems to declare a relationship.");return;
   }
   if((overrides.connections||[]).length>=40){setNotice("Local relation cap reached; no inferred extra paths.");return;}
   change("connections",[...(overrides.connections||[]),{from,to,relation,explanation:"Declared for investigation; source evidence and direction not independently verified."}]);
   setNotice("Declared relationship added. A graph hop does not establish causal distance, influence or mechanism.");
 };
 return <section className="rp-content" aria-label="STELLAR 1 fact finding and environmental map">
   <h3>STELLAR 1 — begin with the question, people, purpose and environment</h3>
   <p>Each field is a proposed research frame, not independently established truth. STELLAR 1 stays open until original sources, stakeholders, context and relationships have actually been validated.</p>
   <div className="rp-card-grid">{FIELDS.map(f=>{
     const mapKey=f.key==="centerOfInquiry"?"center":f.key;
     const inherited=review.orientation[mapKey]||"";
     return <label key={f.key} className="rp-field"><span>{f.label}</span>
       <textarea aria-label={f.label} value={(overrides[f.key] as string|undefined)??inherited}
         onChange={e=>change(f.key,e.target.value)} rows={2} maxLength={650} placeholder={f.hint}/>
       <small>{f.hint}</small>
     </label>;
   })}</div>
   <h3>Fact finding: stakeholders, demographics, history and perspectives</h3>
   <div className="rp-card-grid">{MULTI.map(f=><label key={f.key} className="rp-field"><span>{f.label}</span>
     <textarea aria-label={f.label} rows={3} maxLength={1800}
       value={(overrides[f.key]||[]).join("\n")} placeholder={f.hint}
       onChange={e=>change(f.key,split(e.target.value))}/>
     <small>One entry per line. This is a proposed evidence or engagement lead, not actual testimony.</small>
   </label>)}</div>
   <h3>Position the system chain around the center</h3>
   <p>Declare upstream/downstream dependencies, intersections and parallel systems. The displayed distance counts <strong>declared graph links</strong>, not causal strength, real-world geographic distance or verified interagency connectivity.</p>
   <div className="rp-card-grid">
     <fieldset className="rp-card"><legend>Add a system or stakeholder</legend>
       <label className="rp-field"><span>System or stakeholder name</span><input value={name} onChange={e=>setName(e.target.value)} maxLength={130}/></label>
       <label className="rp-field"><span>Role or function</span><input value={role} onChange={e=>setRole(e.target.value)} maxLength={240}/></label>
       <label className="rp-field"><span>System level</span><select value={level} onChange={e=>setLevel(e.target.value as EnvironmentElement["level"])}>
         {LEVELS.map(x=><option key={x}>{x}</option>)}</select></label>
       <button type="button" onClick={addElement}>Add candidate element</button>
     </fieldset>
     <fieldset className="rp-card"><legend>Declare a connection for investigation</legend>
       <label className="rp-field"><span>From</span><select value={from} onChange={e=>setFrom(e.target.value)}>
         {review.environment.nodes.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
       <label className="rp-field"><span>Relationship</span><select value={relation} onChange={e=>setRelation(e.target.value as ChainRelation)}>
         {RELATIONS.map(x=><option key={x}>{x}</option>)}</select></label>
       <label className="rp-field"><span>To</span><select value={to} onChange={e=>setTo(e.target.value)}>
         <option value="">Choose another element</option>
         {review.environment.nodes.filter(x=>x.id!==from).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
       </select></label>
       <button type="button" onClick={addRelation}>Add unverified relationship</button>
     </fieldset>
   </div>
   <p role="status">{notice}</p>
   <div className="rp-table-wrap"><table><thead><tr><th>Element</th><th>Declared distance from center</th><th>Relationship</th><th>Evidence state</th></tr></thead>
     <tbody>{review.environment.nodes.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.distanceFromCenter??"Unmapped"}</td>
       <td>{x.relationToCenter.replaceAll("_"," ").toLowerCase()}</td><td>{x.relationshipValidation.replaceAll("_"," ").toLowerCase()}</td></tr>)}</tbody></table></div>
   <h3>What remains unresolved?</h3>
   <ul className="rp-issues">{review.questions.map(x=><li key={x.code}>
     <strong>{x.priority}: {x.code.replaceAll("_"," ")}</strong> — {x.question}
     <div className="rp-note">Proof required: {x.proofNeeded}</div>
   </li>)}</ul>
   <div className="rp-warning"><strong>Environmental completeness:</strong> Not established. <strong>Verified connections:</strong> 0. <strong>Decision authorization:</strong> No. Disagreement, unconsidered causes and missing relationships remain legitimate findings.</div>
 </section>;
}
