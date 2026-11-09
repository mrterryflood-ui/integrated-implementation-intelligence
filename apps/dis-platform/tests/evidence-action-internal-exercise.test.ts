import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram} from "../lib/research-program";
import {unsourcedResearchCase} from "../lib/jackson-cancer-case";
import {colorectalEvidenceAction,COLORECTAL_CROSSWALK} from "../lib/evidence-action-colorectal";
import {reviewEvidenceToAction,reviewCounterfactual,type CounterfactualRequest} from "../lib/evidence-action-bridge";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";
import {buildPlaybook,validatePlaybook} from "../lib/decision-playbook";
import {reviewOutcomeEquity,SYNTHETIC_EQUITY_EXERCISE} from "../lib/outcome-equity-assurance";
const synthetic=()=>structuredClone(SYNTHETIC_EQUITY_EXERCISE);
const newGap=(id:string)=>({id,severity:"RESEARCH_REQUIRED" as const,problem:"Previously unanticipated service capacity gap",ownerRole:"Proposed local implementation owner",nextEvidence:"Check actual service capacity and a competing explanation before selecting an intervention."});
test("a generic service study inherits no cancer incidence, screening or Hinds title",()=>{
 const p=buildResearchProgram(unsourcedResearchCase("How can public services reduce failed handoffs?","Synthetic Community"));
 const r=reviewEvidenceToAction(p,[]);assert.ok(!r.gaps.some(g=>["all-stage-incidence","screening-denominator","diagnostic-resolution"].includes(g.id)));
 const h=buildEvidenceActionCaseHandoff(p,r);assert.doesNotMatch(h.title,/Hinds|Harris|Colorectal/);
 assert.ok(!h.report.actionPlan.metrics.some(m=>/Screening|invasive disease|diagnostic resolution/.test(m.label)));
});
test("all original and newly discovered gaps survive the save contract",()=>{
 const {program,bridge}=colorectalEvidenceAction();const before=bridge.gaps.length;
 const h=buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:[newGap("unexpected-capacity")],notes:[{id:"note-capacity",kind:"HYPOTHESIS",text:"Synthetic bottleneck; investigate appointment supply, not another awareness campaign.",sourceUrl:"https://example.org/synthetic",gapIds:["unexpected-capacity"],origin:"SYNTHETIC"}]});
 assert.equal(h.report.gapLedger.length,before+1);assert.ok(h.report.gapIDs.includes("unexpected-capacity"));
 assert.equal(h.report.investigation.notes.length,1);assert.equal(h.report.investigation.hypotheses.length,bridge.hypotheses.length);
 assert.equal(h.report.investigation.measures.length,bridge.measures.length);assert.equal(h.report.independentOutcomeVerified,false);
 assert.equal(h.report.investigation.privacyStatus,"OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED");
});
test("editable capacity is explicit and the full ledger never silently truncates",()=>{
 const {program,bridge}=colorectalEvidenceAction();const extra=Array.from({length:30},(_,i)=>newGap("extra-"+i));
 const h=buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:extra,notes:[]});
 assert.equal(h.report.gapLedger.length,bridge.gaps.length+30);assert.equal(h.report.actionPlan.tasks.length,28);
 assert.equal(h.report.taskProjection.unmaterializedGapIDs.length,h.report.gapLedger.length-28);
 const p=buildPlaybook(h.question,h.report);assert.equal(p.tasks.length,35);assert.equal(validatePlaybook(p),true);
 assert.ok(p.metrics.some(m=>m.label.includes("Adverse outcomes")));assert.ok(p.metrics.some(m=>m.label.includes("Sustained benefit")));
});
test("public confirmation, unsupported fields and dangling gap links cannot masquerade as accepted supplementary evidence",()=>{
 const {program,bridge}=colorectalEvidenceAction();
 assert.throws(()=>buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:"true",additionalGaps:[],notes:[]}),/confirmation/);
 assert.throws(()=>buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[],patientId:"x"}),/Unexpected/);
 assert.throws(()=>buildEvidenceActionCaseHandoff(program,bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes:[{id:"n",kind:"SOURCE",text:"Synthetic text",sourceUrl:"https://example.org",gapIds:["absent"],origin:"SYNTHETIC"}]}),/reference/);
});
test("two identical headline measurements preserve different rival mechanisms instead of prescribing one answer",()=>{
 const {program}=colorectalEvidenceAction();const a=structuredClone(program),b=structuredClone(program);
 a.drivers[0].hypothesis="Eligible people not invited";a.drivers[0].discriminatingTest="Audit eligibility-to-invitation conversion with source timestamps";
 b.drivers[0].hypothesis="Invited people cannot obtain diagnostic capacity";b.drivers[0].discriminatingTest="Audit referral-to-appointment capacity with source timestamps";
 const ar=reviewEvidenceToAction(a,COLORECTAL_CROSSWALK),br=reviewEvidenceToAction(b,COLORECTAL_CROSSWALK);
 assert.deepEqual(ar.measures,br.measures);assert.notEqual(ar.hypotheses[0].hypothesis,br.hypotheses[0].hypothesis);
 assert.notEqual(ar.hypotheses[0].discriminatingTest,br.hypotheses[0].discriminatingTest);assert.equal(ar.correctiveActionAuthorized,false);
});
test("an improving average cannot hide an adversely moving subgroup",()=>{
 const r=reviewOutcomeEquity(synthetic());assert.equal(r.overallChange,10);assert.equal(r.groupChanges[1].change,-10);assert.equal(r.absoluteGapChange,40);
 assert.equal(r.state,"SUBGROUP_ADVERSE_SIGNAL");assert.equal(r.equitableSuccessEstablished,false);assert.equal(r.causalEffectEstablished,false);
});
test("successful process completion is not a demonstrated beneficiary outcome",()=>{
 const x=synthetic();x.cells[1].followupNumerator=80;const r=reviewOutcomeEquity(x);assert.equal(r.state,"PROCESS_ONLY");assert.equal(r.equitableSuccessEstablished,false);
});
test("changed measurement definition reopens inference without invalid arithmetic",()=>{
 const x=synthetic();x.followupMethod="Changed eligibility";const r=reviewOutcomeEquity(x);assert.equal(r.state,"REOPEN_MEASUREMENT");assert.equal(r.overallChange,null);
});
test("suppressed, duplicate and impossible subgroup data are rejected rather than zero-filled",()=>{
 const x=synthetic();x.cells[0].suppressed=true;assert.equal(reviewOutcomeEquity(x).state,"INVALID_INPUT");
 const y=synthetic();y.cells[0].followupNumerator=101;assert.equal(reviewOutcomeEquity(y).state,"INVALID_INPUT");
 const z=synthetic();z.cells[1].group=z.cells[0].group;assert.equal(reviewOutcomeEquity(z).state,"INVALID_INPUT");
});
test("duplicate crosswalk cannot use first-binding-wins for an admitted measurement",()=>{
 const {program}=colorectalEvidenceAction();const r=reviewEvidenceToAction(program,[...COLORECTAL_CROSSWALK,COLORECTAL_CROSSWALK[0]]);
 assert.ok(!r.measures.some(m=>m.id===COLORECTAL_CROSSWALK[0].indicatorId));assert.ok(r.gaps.some(g=>g.id.startsWith("quarantined:")));
});
test("malformed runtime panel does not escape into a crash or descriptive arithmetic",()=>{
 const r=reviewCounterfactual({treated:{site:14},comparator:null} as unknown as CounterfactualRequest);assert.equal(r.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");assert.equal(r.rawDifferenceInDifferences,null);
});
test("investigation exercise is connected to existing research save and preview buttons",()=>{
 const ui=readFileSync("app/research-program/evidence-action/private-case-handoff.tsx","utf8");
 assert.match(ui,/reviewOutcomeEquity/);assert.match(ui,/Preview complete investigation record/);assert.match(ui,/Stage synthetic subgroup challenge/);assert.match(ui,/researchWorkflow:workflow/);assert.match(ui,/historyRecorded!==true/);
});
