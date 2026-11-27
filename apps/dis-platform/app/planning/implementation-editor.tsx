'use client';

import {useId} from 'react';
import {
  IMPLEMENTATION_FIELDS,IMPLEMENTATION_GROUPS,IMPLEMENTATION_FIELD_LIMIT,
  emptyImplementationScience,implementationReviewQuestions,implementationReferenceText,
  type ImplementationScience,type ImplementationFieldId,
} from '../../lib/implementation-science';

export type ImplementationEditorProps={
  value:ImplementationScience|undefined;
  onChange:(value:ImplementationScience|undefined)=>void;
  readOnly?:boolean;
};

/** The same saved plan is edited and read; the component assigns no implementation verdict. */
export default function ImplementationEditor({value,onChange,readOnly=false}:ImplementationEditorProps){
  const prefix=useId();
  if(!value){
    if(readOnly)return null;
    return <section className="org-card" aria-labelledby={prefix+'-title'}>
      <h3 id={prefix+'-title'}>Make the approach work here</h3>
      <p>Consider the setting, how people will use and deliver the approach, what can change, and what will keep it working.</p>
      <button type="button" onClick={()=>onChange(emptyImplementationScience())}>Add an implementation plan</button>
    </section>;
  }
  const questions=implementationReviewQuestions(value);
  const update=(field:ImplementationFieldId,text:string)=>onChange({...value,fields:{...value.fields,[field]:text}});
  return <section className="org-card org-implementation" aria-labelledby={prefix+'-title'}>
    <h3 id={prefix+'-title'}>Make the approach work here</h3>
    <p>Work through the questions that matter to this decision. Keep assumptions, evidence, and unresolved questions visible.</p>
    {IMPLEMENTATION_GROUPS.map((group,index)=><details key={group.id} open={index===0} className="org-card">
      <summary>{group.title}</summary>
      {group.fields.map(id=>{
        const field=IMPLEMENTATION_FIELDS.find(item=>item.id===id)!;
        const inputId=prefix+'-'+id,refs=value.evidenceRefs?.[id]||[];
        return <div key={id} style={{marginBlock:'1rem'}}>
          {readOnly?<><h4>{field.title}</h4><p style={{whiteSpace:'pre-wrap'}}>{value.fields[id]||'Not supplied'}</p></>:<>
            <label htmlFor={inputId}>{field.question}</label>
            <p id={inputId+'-help'}>{field.hint}</p>
            <textarea id={inputId} aria-describedby={inputId+'-help'} rows={4} maxLength={IMPLEMENTATION_FIELD_LIMIT} value={value.fields[id]} onChange={event=>update(id,event.target.value)} style={{display:'block',width:'100%',boxSizing:'border-box'}}/>
          </>}
          {refs.length>0&&<details><summary>Source references for review ({refs.length})</summary><p>These references identify supplied source versions. Check that the passages support the statement.</p><ul>{refs.map((ref,i)=><li key={i} style={{overflowWrap:'anywhere'}}>{implementationReferenceText(ref)}</li>)}</ul></details>}
        </div>;
      })}
    </details>)}
    <details><summary>Questions still to consider</summary>
      {questions.length?<ul>{questions.map(item=><li key={item.field}>{item.question}</li>)}</ul>:<p>Each field has an entry. Review the evidence and local fit; entered text does not establish successful implementation.</p>}
      <p>These prompts identify missing information. They do not score readiness or establish that an approach will work.</p>
    </details>
  </section>;
}
