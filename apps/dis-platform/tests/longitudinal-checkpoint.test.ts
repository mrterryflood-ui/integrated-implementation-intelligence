import test from "node:test";
import assert from "node:assert/strict";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../lib/jackson-cancer-case";
import {reviewLongitudinalCheckpoint,type CheckpointEvidence,type CheckpointMeasure} from "../lib/longitudinal-assurance";

const program=()=>buildResearchProgram(jacksonCancerCase("colorectal"));
const source=(id:string,role:CheckpointMeasure["role"]="BENEFICIARY_OUTCOME"):CheckpointMeasure=>({
 id,role,construct:role==="BENEFICIARY_OUTCOME"?"Late-stage population incidence":"Implementation delivery fidelity",
 unit:role==="BENEFICIARY_OUTCOME"?"per 100,000":"percent",
 population:"Hinds County, MS",baseline:30.4,observed:29.5,denominator:10000,
 sourceId:"synthetic-method-only",originalLineage:"original-register-"+id,
 observedAt:"2026-11-06T13:00:00Z",receivedAt:"2026-11-06T14:00:00Z",
 comparator:"A contemporaneous, source-valid synthetic counterfactual to be independently adjudicated",
 definitionVersion:"synthetic-v1",limitations:["Data are synthetic and not clinically validated"]
});
const base=():CheckpointEvidence=>({
 caseId:program().caseId,asOf:"2026-11-06T15:00:00Z",reportedPath:"SUCCESS",
 measures:[source("outcome"),source("fidelity","IMPLEMENTATION_FIDELITY")],
 ownerConfirmed:true,successorConfirmed:true,resourcingConfirmed:true,
 stakeholderParticipationConfirmed:true,outcomeIndependentReviewConfirmed:true,
 adverseEffectsReviewed:true,environmentChanged:false,destinationTransferRequested:false
});
test("even a complete-looking success report requires human independent adjudication and NEVER authorizes scale",()=>{
 const r=reviewLongitudinalCheckpoint(program(),base());
 assert.equal(r.finding,"HUMAN_ADJUDICATION_REQUIRED");
 assert.equal(r.evidenceStatus,"DECLARATIONS_NOT_INDEPENDENTLY_VERIFIED");
 assert.equal(r.causalBenefitEstablished,false);
 assert.equal(r.realPilotValidated,false);
 assert.equal(r.scaleAuthorized,false);
 assert.equal(r.clinicalActionAuthorized,false);
 assert.equal(r.adaptationExecuted,false);
});
test("adoption claimed as successful without measurements or successor is an evidence hold",()=>{
 const x=base();
 x.measures=[];x.successorConfirmed=false;x.resourcingConfirmed=false;x.outcomeIndependentReviewConfirmed=false;
 const r=reviewLongitudinalCheckpoint(program(),x);
 assert.equal(r.finding,"EVIDENCE_INSUFFICIENT");
 assert.ok(r.reviewIssues.some(i=>i.code==="NO_ACTUAL_MEASURES"));
 assert.ok(r.reviewIssues.some(i=>i.code==="SUCCESS_STEWARDSHIP_UNCONFIRMED"));
 assert.ok(r.reviewIssues.some(i=>i.code==="RESULT_NOT_INDEPENDENTLY_REVIEWED"));
});
test("future knowledge must not be retroactively used to explain an earlier decision",()=>{
 const x=base();x.measures[0].observedAt="2026-11-07T13:00:00Z";
 const r=reviewLongitudinalCheckpoint(program(),x);
 assert.ok(r.reviewIssues.some(i=>i.code==="TIME_ORDER_INVALID"));
 assert.equal(r.causalBenefitEstablished,false);
});
test("a harm report triggers human safety review, not autonomous intervention",()=>{
 const x=base();x.reportedPath="UNINTENDED_HARM";
 const r=reviewLongitudinalCheckpoint(program(),x);
 assert.equal(r.finding,"SAFETY_REVIEW_URGENT");
 assert.ok(r.reviewIssues.some(i=>i.code==="SAFETY_SIGNAL_REQUIRES_HUMAN"));
 assert.equal(r.clinicalActionAuthorized,false);
 assert.equal(r.scaleAuthorized,false);
});
test("positive versus harmful numerical direction must be prespecified, never guessed",()=>{
 const x=base();
 x.measures.push({...source("balancing","BALANCING_HARM"),baseline:1,observed:2,comparator:null});
 const unknown=reviewLongitudinalCheckpoint(program(),x);
 assert.equal(unknown.finding,"EVIDENCE_INSUFFICIENT");
 assert.ok(unknown.reviewIssues.some(i=>i.code==="BALANCING_DIRECTION_UNSPECIFIED"));
 assert.equal(unknown.reviewIssues.some(i=>i.code==="SAFETY_SIGNAL_REQUIRES_HUMAN"),false);
 x.measures[2].higherMeansWorse=true;
 const reported=reviewLongitudinalCheckpoint(program(),x);
 assert.equal(reported.finding,"SAFETY_REVIEW_URGENT");
});
test("changing the hypothesized core function requires independent revalidation and owner approval",()=>{
 const x=base();x.proposedAdaptation={coreFunctionAffected:true,whatChanges:"Replace human followup with self-service channel",
  reason:"Local resource pressure",owner:"Unconfirmed delivery manager",reviewAfter:"Next decision cycle"};
 const r=reviewLongitudinalCheckpoint(program(),x);
 assert.ok(r.reviewIssues.some(i=>i.code==="CORE_FUNCTION_REVALIDATION"));
 assert.equal(r.adaptationExecuted,false);
 assert.equal(r.scaleAuthorized,false);
});
test("new destination and changing environmental conditions reopen original STELLAR 1 instead of copying EBI",()=>{
 const x=base();x.destinationTransferRequested=true;x.environmentChanged=true;
 const r=reviewLongitudinalCheckpoint(program(),x);
 assert.ok(r.reviewIssues.some(i=>i.code==="TRANSFER_REASSESSMENT_REQUIRED"));
 assert.ok(r.reviewIssues.some(i=>i.code==="ENVIRONMENT_CHANGED"));
 assert.equal(r.scaleAuthorized,false);
});
test("provenance and denominator remain core regardless of cancer vs non-clinical research case",()=>{
 const p=buildResearchProgram(unsourcedResearchCase("Improve municipal software reliability","Fictional City"));
 const x=base();x.caseId=p.caseId;x.measures[0].denominator=0;x.measures[1].originalLineage=x.measures[0].originalLineage;
 const r=reviewLongitudinalCheckpoint(p,x);
 assert.ok(r.reviewIssues.some(i=>i.code==="DENOMINATOR_INVALID"));
 assert.ok(r.reviewIssues.some(i=>i.code==="SHARED_SOURCE_LINEAGE"));
 assert.equal(r.causalBenefitEstablished,false);
});
test("impossible calendar dates do not normalize into accepted checkpoint evidence",()=>{
 const x=base();x.asOf="2026-02-30T15:00:00Z";x.measures[0].observedAt="2026-02-30T13:00:00Z";x.measures[0].receivedAt="2026-02-30T14:00:00Z";
 const r=reviewLongitudinalCheckpoint(program(),x);assert.equal(r.finding,"EVIDENCE_INSUFFICIENT");
 assert.ok(r.reviewIssues.some(i=>i.code==="DECISION_TIME_INVALID"));assert.ok(r.reviewIssues.some(i=>i.code==="TIMESTAMP_UNVERIFIED"));
});
test("percent and proportion scales are enforced before interpreting a longitudinal change",()=>{
 const x=base();x.measures[1].baseline=110;x.measures[1].observed=120;
 const r=reviewLongitudinalCheckpoint(program(),x);assert.equal(r.finding,"EVIDENCE_INSUFFICIENT");assert.ok(r.reviewIssues.some(i=>i.code==="MEASUREMENT_SCALE_INVALID"));
});
