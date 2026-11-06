import type {CouncilEngagementAssurance} from '../lib/council-engagement-assurance';

export default function CouncilReadiness({assurance}:{assurance?:CouncilEngagementAssurance|null}){
 if(!assurance)return null;
 const mesh=assurance.evidenceMesh;
 const inquiry=assurance.inquiryMethod;
 return <section className="truth-note" aria-label="Council evidence and next steps">
  <h4>{assurance.readyToPropose?'Ready for your review':'Evidence review needed'}</h4>
  <p>Use this draft to investigate and discuss the decision. Original-source checks and accountable human review are still required before action. Outcome improvement has not been measured.</p>
  <p><strong>Next step:</strong> {assurance.nextAction}</p>
  <section aria-label="Question-first scientific method review">
   <h4>DIS Inquiry — how to investigate what the evidence really measures</h4>
   <p>Preliminary method state: <strong>{inquiry.assessment.state.replaceAll('_',' ').toLowerCase()}</strong>.
   {' '}{inquiry.assessment.findings.length} open methodological question(s), {inquiry.sourceLeadIds.length} bibliographic or source-reported lead(s).
   No actual instruments, independent explanations, causal effects, or clinical outcomes were verified by this preflight.</p>
   <details><summary>See research-method questions before drawing conclusions</summary>
    <ol>{inquiry.assessment.methodologicalQuestions.slice(0,8).map(q=><li key={q}>{q}</li>)}</ol>
    <p>{inquiry.explanation}</p>
   </details>
  </section>
  <section aria-label="Federated evidence assurance">
   <h4>DIS evidence mesh — what can these sources actually establish?</h4>
   <p>{mesh.reviewedRecordCount} source record(s) examined for declared origin, retrieval time, geographic scope and reference period. <strong>No independent measurements, causal effects, or cross-source comparisons are certified.</strong></p>
   <p>{mesh.repeatedReferenceGroups.length?mesh.repeatedReferenceGroups.length+' repeated source reference group(s) need deduplication.':'No identical source references detected. Different URLs do not prove independent evidence.'}</p>
   <p>{mesh.issues.length} metadata issue(s) identified. The absence of a flag does not establish source accuracy, sensor fitness, or the ability to act.</p>
   {mesh.issues.length>0&&<ul>{mesh.issues.slice(0,6).map((issue,i)=><li key={issue.code+'-'+i}>
    <strong>{issue.code.replaceAll('_',' ').toLowerCase()}:</strong> {issue.explanation}
    {' '}<span>Source IDs: {issue.sourceIds.join(', ').slice(0,180)}</span>
   </li>)}</ul>}
   <details><summary>Source-level provenance, disagreement and remaining checks</summary>
    <p>{mesh.operatingRule}</p>
    <p><strong>Before acting:</strong> {mesh.nextDecision}</p>
    {mesh.issues.length>6&&<ul>{mesh.issues.slice(6).map((issue,i)=><li key={issue.code+'-'+i}>{issue.code}: {issue.explanation} Review: {issue.nextCheck}</li>)}</ul>}
    <ul>{mesh.sources.map(s=><li key={s.id}>
     <strong>{s.id} — {s.kind.toLowerCase().replaceAll('_',' ')}</strong>.
     {' '}Declared scope: {s.declaredScope||'unknown'}; reference period: {s.referencePeriod||'unknown'};
     {' '}retrieved: {s.retrievalTime||'unknown'} ({s.retrievalState.toLowerCase().replaceAll('_',' ')}).
     {' '}Measurement and claim validation: not established.
    </li>)}</ul>
   </details>
  </section>
  <details><summary>See acceptance checks and review limits</summary>
   <ul>{[...new Set([...assurance.blockers,...assurance.executionBlockers])].map(gap=><li key={gap}>{gap}</li>)}</ul>
   <p>{assurance.limits}</p>
  </details>
 </section>;
}
