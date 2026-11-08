import test from "node:test";
import assert from "node:assert/strict";
import {emptyResearchWorkflow,buildResearchWorkflowCase,reviseResearchWorkflowReport,retainedResearchReport,workflowFromSavedReport,reviewResearchWorkflow,validateResearchWorkflow,WORKFLOW_FIELDS} from "../lib/research-workflow";
import {colorectalEvidenceAction} from "../lib/evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";
import {admitCaseReport} from "../lib/research-case-admission";
import {CasePayloadError} from "../lib/case-payload-capacity";
const {program,bridge}=colorectalEvidenceAction();
function fixture(){
 const w=emptyResearchWorkflow();w.publicAggregateConfirmed=true;
 for(const [key,label] of WORKFLOW_FIELDS)w.narrative[key]="SYNTHETIC exercise: "+label;
 w.frameworks=["CFIR","RE_AIM"];w.focusIds=[bridge.hypotheses[0].id];w.correctionActionId=bridge.corrections[0].id;
 const m=bridge.measures[0];
 w.studyText=JSON.stringify([{id:"synthetic-repeated-source",title:"Repeated source exercise, not an independent study",sourceUrl:m.indicator.sourceUrl,condition:m.condition,construct:m.construct,geography:m.indicator.geography,populationFrame:m.populationFrame,period:m.indicator.period,numeratorDefinition:m.indicator.numeratorDefinition,denominatorDefinition:m.indicator.denominatorDefinition,unit:m.indicator.unit,methodVersion:m.methodVersion,value:m.indicator.value}]);
 w.counterfactualText=JSON.stringify({condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic units",interventionYear:2021,commonMeasurementVersion:"Synthetic common formula",comparisonRationale:"Synthetic comparator selection rationale",parallelTrendsEvidence:"Synthetic prompt only",competingChangesEvidence:"Synthetic competing changes context",spilloverAssessment:"Synthetic spillover assessment context",independentReviewer:"Synthetic reviewer, not an actual adjudication",treated:{site:"Synthetic A",populationFrame:"Synthetic population",observations:[10,11,12,13,14].map((value,i)=>({year:2018+i,value,denominator:100}))},comparator:{site:"Synthetic B",populationFrame:"Synthetic population",observations:[9,10,11,11,12].map((value,i)=>({year:2018+i,value,denominator:100}))}});
 w.correctionReceiptText=JSON.stringify({proposedActionId:w.correctionActionId,deliveryRecordedAt:"2026-11-07T12:00:00Z",sourceUrl:"https://example.org/synthetic-receipt",eligibleDenominator:100,completedNumerator:75,coreFunctionChecked:true,balancingHarmsReviewed:true,comparisonRecorded:true,reviewerIdentity:"Synthetic reviewer, no real delivery"});
 w.retrievalQuery="synthetic colorectal source test";
 w.leads=[{id:"synthetic-lead",kind:"SCHOLARLY",title:"Synthetic discovery metadata",summary:"Synthetic test fixture only",source:"Synthetic index",url:"https://example.org/synthetic-study",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"}];
 w.supplementText=JSON.stringify({additionalGaps:[{id:"synthetic-gap",severity:"RESEARCH_REQUIRED",problem:"Synthetic capacity gap",ownerRole:"Synthetic proposed role",nextEvidence:"Measure synthetic capacity"}],notes:[{id:"synthetic-note",kind:"OUTCOME",text:"Synthetic observation, not a patient outcome",sourceUrl:"https://example.org/synthetic-note",gapIds:["synthetic-gap"],origin:"SYNTHETIC"}]});
 return w;
}
test("all research editors and framework/design choices survive a JSON save/read/reopen round trip",()=>{
 const w=fixture(),handoff=buildResearchWorkflowCase(w);const stored=JSON.parse(JSON.stringify(handoff.report));
 assert.deepEqual(workflowFromSavedReport(stored),w);assert.equal(stored.workflow.narrative.timeZero,w.narrative.timeZero);
 assert.ok(stored.gapIDs.includes("synthetic-gap"));assert.equal(stored.investigation.notes[0].id,"synthetic-note");
 assert.equal(stored.investigation.literature[0].claimVerified,false);assert.equal(stored.causalEffectEstablished,false);
 assert.equal(stored.independentOutcomeVerified,false);assert.equal(stored.interventionAuthorized,false);
 assert.equal(stored.noPatientData,null);assert.equal(stored.investigation.privacyStatus,"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED");
 assert.equal(handoff.question,w.narrative.problem);assert.ok(handoff.title.includes(w.narrative.setting));
 const checked=reviewResearchWorkflow(w,bridge,"2026-11-08T13:00:00Z");
 assert.equal(checked.counterfactual.result?.rawDifferenceInDifferences,1);assert.equal(checked.correction.result?.provisionalCompleteness,true);
 assert.equal(checked.correction.result?.claimedOutcomeVerified,false);assert.equal(checked.studies.result?.links[0].sourceIndependenceEstablished,false);
 assert.deepEqual(checked.missingFoundation,[]);
});
test("saving a working draft preserves incomplete JSON and reports invalid checks without claiming completion",()=>{
 const w=fixture();w.counterfactualText="{ unfinished public aggregate draft";w.studyText="[ unfinished";w.narrative.design="";
 const h=buildResearchWorkflowCase(w);assert.equal(h.report.workflow?.counterfactualText,w.counterfactualText);
 const result=reviewResearchWorkflow(w,bridge);assert.equal(result.counterfactual.state,"INVALID");assert.equal(result.studies.state,"INVALID");
 assert.ok(result.missingFoundation.includes("Proposed research or implementation design"));assert.equal(result.causalEffectEstablished,false);
});
test("unsupported authority, IDs, metadata, versions and absent confirmation are rejected",()=>{
 const mutations=[(w:any)=>{w.publicAggregateConfirmed=false;},(w:any)=>{w.verified=true;},(w:any)=>{w.schemaVersion="invented";},(w:any)=>{w.frameworks=["CFIR","invented"];},(w:any)=>{w.focusIds=["invented"];},(w:any)=>{w.correctionActionId="invented";},(w:any)=>{w.leads[0].sourceStatus="VERIFIED";},(w:any)=>{w.leads[0].url="https://user:secret@example.org/study";},(w:any)=>{w.retrievalQuery="";},(w:any)=>{w.narrative.approved=true;},(w:any)=>{w.leads.push({...w.leads[0]});}];
 for(const mutate of mutations){const w=fixture();mutate(w);assert.throws(()=>buildResearchWorkflowCase(w),CasePayloadError);}
});
test("oversized input is rejected without truncating or mutating the editor draft",()=>{
 const w=fixture();w.studyText="x".repeat(25001);const before=JSON.stringify(w);
 assert.throws(()=>buildResearchWorkflowCase(w),/capacity/);assert.equal(JSON.stringify(w),before);
 const maximum=fixture();for(const [key] of WORKFLOW_FIELDS)maximum.narrative[key]="x".repeat(2400);
 maximum.studyText="x".repeat(25000);maximum.counterfactualText="x".repeat(25000);
 assert.throws(()=>buildResearchWorkflowCase(maximum),(e:unknown)=>e instanceof CasePayloadError&&e.status===413);
});
test("a revision retains the saved source version and removes a council interpretation of older inputs",()=>{
 const w=fixture(),original=buildResearchWorkflowCase(w).report;
 original.calibratedEvidence!.county.period="SYNTHETIC SAVED PERIOD";
 const wrapped={state:"PRELIMINARY_DELIBERATION",deliberation:{synthesis:"Prior interpretation"},retainedResearch:original};
 const edited={...w,narrative:{...w.narrative,setting:"A newly declared synthetic setting"}};
 const revised=reviseResearchWorkflowReport(wrapped,edited),r=retainedResearchReport(revised)!;
 assert.equal(r.calibratedEvidence?.county.period,"SYNTHETIC SAVED PERIOD");assert.deepEqual(r.sourceIndicators,original.sourceIndicators);
 assert.equal(r.workflow?.narrative.setting,edited.narrative.setting);assert.equal("deliberation" in revised,false);
 assert.equal(original.workflow?.narrative.setting,w.narrative.setting);assert.equal(wrapped.deliberation.synthesis,"Prior interpretation");
});
test("legacy notes and discovery leads survive successive conversions, while current leads and gaps remain current",()=>{
 const w=fixture();const legacyBridge=colorectalEvidenceAction(w.leads).bridge;
 const legacy=buildEvidenceActionCaseHandoff(program,legacyBridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[{id:"legacy-note",kind:"SOURCE",text:"Retain this older declaration",sourceUrl:"https://example.org/legacy",gapIds:[],origin:"SYNTHETIC"}]}).report;
 const a=emptyResearchWorkflow();a.publicAggregateConfirmed=true;
 const first=reviseResearchWorkflowReport(legacy,a),second=retainedResearchReport(reviseResearchWorkflowReport(first,a))!;
 assert.equal(second.investigation.notes[0].id,"legacy-note");assert.equal(second.investigation.literature[0].id,"synthetic-lead");
 const newCase=buildResearchWorkflowCase(a).report;
 const withLeads=retainedResearchReport(reviseResearchWorkflowReport(newCase,w))!;
 assert.equal(withLeads.investigation.literature[0].id,"synthetic-lead");assert.ok(!withLeads.gapIDs.includes("literature-not-retrieved"));
 const without=retainedResearchReport(reviseResearchWorkflowReport(withLeads,{...w,leads:[]}))!;
 assert.equal(without.investigation.literature.length,0);assert.ok(without.gapIDs.includes("literature-not-retrieved"));
});
test("legacy admission compares the entire source contract and cannot be bypassed by changing its markers",()=>{
 const legacy=buildEvidenceActionCaseHandoff(program,bridge).report;assert.deepEqual(admitCaseReport(legacy),legacy);
 const forged:any=structuredClone(legacy);delete forged.schemaVersion;forged.state="DRAFT";forged.independentOutcomeVerified=true;forged.causalEffectEstablished=true;
 assert.throws(()=>admitCaseReport(forged),CasePayloadError);
 const changed=structuredClone(legacy);changed.sourceIndicators[0].value=0;assert.throws(()=>admitCaseReport(changed),CasePayloadError);
 assert.deepEqual(admitCaseReport({state:"NOT_RUN"}),{state:"NOT_RUN"});
});
test("attaching literature retains the identity of a gap cited by an older note",()=>{
 const legacy=buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[{id:"earlier-discovery-note",kind:"SOURCE",text:"Synthetic earlier missing-source observation",sourceUrl:"https://example.org/earlier",gapIds:["literature-not-retrieved"],origin:"SYNTHETIC"}]}).report;
 const revised=retainedResearchReport(reviseResearchWorkflowReport(legacy,fixture()))!;
 assert.ok(revised.gapIDs.includes("literature-not-retrieved"));
 assert.match(revised.gapLedger.find(g=>g.id==="literature-not-retrieved")!.problem,/leads are now attached/);
 for(const note of revised.investigation.notes)for(const id of note.gapIds)assert.ok(revised.gapIDs.includes(id));
});
