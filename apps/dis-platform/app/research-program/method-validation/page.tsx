import Link from "next/link";
import {SELECTED_METHOD_CASES,evidencePreflight,effectClass,constructEqualEvidenceComparison} from "../../../lib/chainweb-method-validation";

export const metadata={
 title:"DIS ChainWeb | Implementation Methods Validation",
 description:"Source-bound published intervention casebook and fair ChainWeb augmentation comparison against CFIR/PRISM–RE-AIM/FRAME-IS."
};
export default function MethodValidationPage(){
 const audit=evidencePreflight(),study=constructEqualEvidenceComparison();
 return <main style={{maxWidth:1080,margin:"0 auto",padding:"28px 18px",fontFamily:"system-ui,sans-serif",lineHeight:1.55}}>
  <nav aria-label="Study navigation"><Link href="/research-program">Research Studio</Link> · <Link href="/">DIS home</Link></nav>
  <p style={{letterSpacing:1.6,fontSize:12,textTransform:"uppercase",marginTop:26}}>DIS × RPLICE · Methods Validation</p>
  <h1>Does ChainWeb improve implementation decisions?</h1>
  <p>We are evaluating whether a source-linked, whole-system decision and sustainment chain adds measurable value <strong>beyond competent established methods</strong>. We are not testing a new cancer treatment, and we have not established that ChainWeb improves clinical or implementation outcomes.</p>
  <section aria-label="Current evidence status" style={{padding:16,border:"1px solid #bdcad6",borderRadius:12,marginBlock:18}}>
   <h2>Verified research preflight, not a completed superiority study</h2>
   <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
    <div><b>{audit.cases}</b><div>Published cases</div></div>
    <div><b>{audit.numericalContrasts}</b><div>Defined comparisons</div></div>
    <div><b>{study.packets.length}</b><div>Equal-evidence analyst packets</div></div>
    <div><b>0</b><div>Independent ratings received</div></div>
   </div>
   <p role="status"><strong>Method-superiority evidence:</strong> not established. Source ledger is curated from published research; a second reviewer and original-source audit remain necessary. No clinic, researcher or patient participation is implied.</p>
  </section>
  <section aria-label="Actual scientific comparison" style={{marginBlock:22}}>
   <h2>What gets compared?</h2>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(275px,1fr))",gap:12}}>
    <article style={{padding:15,border:"1px solid #bdcad6",borderRadius:10}}>
     <h3>Competent comparator</h3><p>Updated CFIR, iterative PRISM–RE-AIM, FRAME-IS, epidemiologic reasoning, and real implementation-science practice. Analysts receive the same original evidence, time and eligible resources.</p>
    </article>
    <article style={{padding:15,border:"1px solid #bdcad6",borderRadius:10}}>
     <h3>ChainWeb supplementation</h3><p>All comparator capabilities plus explicit evidence-linked cross-system nodes, rival explanations, mechanisms, owner/action/fidelity/outcome/retest traceability, and temporal stewardship. RPLICE methods remain human selected and are not executed by this page.</p>
    </article>
   </div>
   <p><b>Independent outcomes to measure:</b> correct material-gap detection, unsupported explanations, fit of proposed action, fidelity-preserving adaptation, equity and safety, decision cost and time, and sustained implementation effects. No independent blind ratings or clinically validated improvements have occurred.</p>
  </section>
  <section aria-label="Published intervention casebook">
   <h2>Original published evidence — what can actually be claimed?</h2>
   {SELECTED_METHOD_CASES.map(c=><article key={c.id} style={{padding:15,border:"1px solid #d7e0e9",borderRadius:12,marginBottom:12}}>
     <h3 style={{marginBlock:6}}>{c.id}: {c.setting}</h3>
     <p><b>Intervention or subject:</b> {c.intervention}. <b>Evidence design:</b> {c.design.replaceAll("_"," ").toLowerCase()}.</p>
     {c.outcomes.length>0?<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",textAlign:"left"}}>
      <thead><tr><th>Published outcome</th><th>Treatment / later</th><th>Comparison / earlier</th><th>95% CI of published difference</th><th>Legitimate interpretation</th></tr></thead>
      <tbody>{c.outcomes.map(x=><tr key={x.id} style={{borderTop:"1px solid #edf1f5"}}>
       <th scope="row" style={{padding:7}}>{x.label}<div style={{fontSize:12,fontWeight:400}}>{x.time}</div></th>
       <td style={{padding:7}}>{x.treatment.toFixed(1)}%</td><td style={{padding:7}}>{x.comparison.toFixed(1)}%</td>
       <td style={{padding:7}}>{x.ci95?x.ci95[0]+" to "+x.ci95[1]+" pp":"Not reported"}</td>
       <td style={{padding:7}}>{effectClass(c.design,x).replaceAll("_"," ").toLowerCase()}</td>
      </tr>)}</tbody>
     </table></div>:<p>No legitimate randomized effect estimate is included. This case tests mechanism, ascertainment, or adaptation reasoning rather than treatment effectiveness.</p>}
     {c.fidelity.length>0&&<p><b>Documented component delivery:</b> {c.fidelity.map(f=>f.component+" "+f.numerator+"/"+f.denominator+" ("+f.percent.toFixed(1)+"%; "+f.conditioning+")").join(" | ")}. Delivery is not by itself evidence of outcome causation.</p>}
     <details><summary>Competing context and missing-mechanism questions</summary><ul>{c.contextQuestions.map(x=><li key={x}>{x}</li>)}</ul></details>
     <p><a href={c.source} target="_blank" rel="noreferrer">Review original publication</a></p>
    </article>)}
  </section>
  <section aria-label="Research preservation and limits" style={{borderTop:"1px solid #d7e0e9",paddingTop:14}}>
   <h2>Research we preserve</h2><p>The six-condition cancer and women's-health study, three-setting comparative exercise, Hinds/Harris cancer burden work, STELLAR 1 and the 19-phase DIS workflow are separate evidence workstreams. The later state-equity application to HerHealth, Thriving Communities, and Mission Transition is retained but not represented as an approved clinical integration.</p>
   <p><strong>Decision:</strong> published-case fidelity preflight ready for independent verification; comparative superiority, actual beneficiary effect and cross-condition transfer all remain unproven. We do not convert successful software tests into human clinical outcomes.</p>
  </section>
 </main>;
}
