"use client";
import {WORKFLOW_FIELDS,type ResearchWorkflow,type WorkflowField} from "../../../lib/research-workflow";
export default function WorkflowFoundation({workflow,onChange}:{workflow:ResearchWorkflow;onChange:(patch:Partial<ResearchWorkflow>)=>void}){
 const field=(key:WorkflowField,label:string)=><label className="rp-field" key={key}>{label}<textarea rows={2} maxLength={2400} value={workflow.narrative[key]} onChange={e=>onChange({narrative:{...workflow.narrative,[key]:e.target.value}})}/></label>;
 return <section className="rp-program" aria-labelledby="workflow-foundation-heading">
  <h2 id="workflow-foundation-heading">Define this project</h2>
  <p>Describe the setting and people before choosing a design. Blank fields remain open questions. This project keeps your working inputs together with the source evidence.</p>
  {WORKFLOW_FIELDS.slice(0,4).map(([key,label])=>field(key,label))}
  <details><summary>Pathway, lived experience and design justification</summary>{WORKFLOW_FIELDS.slice(4,9).map(([key,label])=>field(key,label))}</details>
  <fieldset><legend>Frameworks to consider together</legend>
   {([ ["CFIR","CFIR — implementation determinants"],["RE_AIM","RE-AIM — reach, effectiveness, adoption, implementation and maintenance"] ] as const).map(([id,label])=><label className="rp-check" key={id}><input type="checkbox" checked={workflow.frameworks.includes(id)} onChange={e=>onChange({frameworks:e.target.checked?[...workflow.frameworks,id]:workflow.frameworks.filter(x=>x!==id)})}/>{label}</label>)}
  </fieldset>
  {field("frameworkJustification","Roles of the selected frameworks and why they fit")}
  <details><summary>Comparison, outcomes, sustainment and funding</summary>{WORKFLOW_FIELDS.slice(10).map(([key,label])=>field(key,label))}</details>
  <p className="rp-subtle">Framework choices and a complete form record a proposal. Review the design, evidence, feasibility and approvals before conducting the study.</p>
 </section>;
}
