import type {CouncilEngagementAssurance} from '../lib/council-engagement-assurance';

export default function CouncilReadiness({assurance}:{assurance?:CouncilEngagementAssurance|null}){
 if(!assurance)return null;
 return <section className="truth-note" aria-label="Council evidence and next steps">
  <h4>{assurance.readyToPropose?'Ready for your review':'Evidence review needed'}</h4>
  <p>Use this draft to investigate and discuss the decision. Original-source checks and accountable human review are still required before action. Outcome improvement has not been measured.</p>
  <p><strong>Next step:</strong> {assurance.nextAction}</p>
  <details><summary>See evidence checks and review limits</summary>
   <ul>{[...new Set([...assurance.blockers,...assurance.executionBlockers])].map(gap=><li key={gap}>{gap}</li>)}</ul>
   <p>{assurance.limits}</p>
  </details>
 </section>;
}
