"use client";
import {memo,useMemo} from "react";
import {inspectSavedResearchEvidence} from "../../../lib/saved-research-evidence";
import {credentialFreeHttps} from "../../../lib/evidence-action-input-integrity";
import CalibratedEvidencePanel from "../../research-program/evidence-action/calibrated-evidence-panel";
import {retainedResearchReport,workflowFromSavedReport,WORKFLOW_FIELDS} from "../../../lib/research-workflow";
import ResearchPlanningHandoff from "./research-planning-handoff";
function SavedCaseEvidence({report,caseId,caseVersion,planningDisabled=false}:{report:unknown;caseId:string;caseVersion?:number;planningDisabled?:boolean}){
 const saved=useMemo(()=>inspectSavedResearchEvidence(report),[report]);
 const research=useMemo(()=>retainedResearchReport(report),[report]);
 const workflow=useMemo(()=>{try{return research?.workflow?workflowFromSavedReport(research):null;}catch{return null;}},[research]);
 if(!saved.present)return null;
 return <section className="rp-root" aria-label="Saved research decision and evidence">
  <h2>Research evidence retained with this case</h2>
  <p>This view uses the saved record. It does not replace earlier evidence with today's snapshot or certify a clinical effect.</p>
  {saved.decision.purpose&&<div className="rp-focus"><h3>{saved.decision.decisionNow||"Decision recorded for review"}</h3><p>{saved.decision.purpose}</p><p>{saved.decision.hypothesisRule}</p><p>{saved.decision.baselineScope}</p></div>}
  {saved.issues.map(x=><p role="alert" key={x}>{x}</p>)}
  {saved.calibrated&&<CalibratedEvidencePanel snapshot={saved.calibrated} marginals={saved.marginals}/>}
  {saved.marginals&&!saved.calibrated&&<p>The marginal evidence is retained without its companion three-study snapshot. Review the full saved record before combining them.</p>}
  {saved.indicators.length>0&&<details><summary>Historical baseline definitions retained in this case</summary><div className="rp-table-wrap"><table><thead><tr><th>Declared construct</th><th>Value</th><th>Period</th><th>Denominator</th></tr></thead><tbody>{saved.indicators.map((x,i)=><tr key={x.id+"-"+i}><th scope="row">{x.construct}</th><td>{x.value===null?"Unknown":x.value} {x.unit}</td><td>{x.period}</td><td>{x.denominator}{credentialFreeHttps(x.sourceUrl)&&<div><a href={x.sourceUrl} target="_blank" rel="noreferrer">Original reference</a></div>}</td></tr>)}</tbody></table></div></details>}
  {saved.notes.length>0&&<details><summary>Saved investigation notes and contrary evidence</summary>{saved.notes.map((x,i)=><article key={x.id+"-"+i}><h3>{x.kind} · {x.origin}</h3><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{x.text}</p>{credentialFreeHttps(x.sourceUrl)&&<a href={x.sourceUrl} target="_blank" rel="noreferrer">Declared source</a>}</article>)}</details>}
  {research&&<section aria-label="Retained research workflow"><h3>Project inputs and design choices</h3>
   {workflow?<><p>Frameworks: {workflow.frameworks.join(" + ").replaceAll("RE_AIM","RE-AIM")||"Not selected"}. Saved inputs remain proposals requiring review.</p><details><summary>Read saved foundation, design, outcomes and sustainment</summary>{WORKFLOW_FIELDS.map(([key,label])=><div key={key}><strong>{label}</strong><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{workflow.narrative[key]||"Open question"}</p></div>)}</details><p>Studies: {workflow.studyText.trim()?"retained":"not entered"}; counterfactual: {workflow.counterfactualText.trim()?"retained":"not entered"}; correction receipt: {workflow.correctionReceiptText.trim()?"retained":"not entered"}. Reopen the editors to inspect inputs and rerun checks.</p></>:<p>{research.workflow?"The saved workflow has unsupported or invalid fields. Its original bytes remain in the record for reconciliation.":"This older case retains its original evidence. Reopen it to add project inputs as a new revision."}</p>}
   <a href={"/research-program/evidence-action?caseId="+encodeURIComponent(caseId)}>Resume research editors</a>
   {caseVersion&&<ResearchPlanningHandoff key={caseId+":"+caseVersion} caseId={caseId} caseVersion={caseVersion} disabled={planningDisabled}/>}
  </section>}
  <p><a href={"/api/cases?id="+encodeURIComponent(caseId)} target="_blank" rel="noreferrer">Read the complete saved report and current history page (authenticated JSON)</a></p>
 </section>;
}
export default memo(SavedCaseEvidence);
