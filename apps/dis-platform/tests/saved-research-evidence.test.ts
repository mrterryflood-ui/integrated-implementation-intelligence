import test from "node:test";
import assert from "node:assert/strict";
import {colorectalEvidenceAction} from "../lib/evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";
import {inspectSavedResearchEvidence,retainResearchForReassessment,researchContextForReassessment,researchSourcesForReassessment} from "../lib/saved-research-evidence";
import {convene} from "../lib/council-engine";
test("saved case reader exposes the exact stored evidence, decision and notes without using newer bundled values",()=>{
 const x=colorectalEvidenceAction();const h=buildEvidenceActionCaseHandoff(x.program,x.bridge);
 const saved=inspectSavedResearchEvidence(h.report);
 assert.equal(saved.state,"SAVED_MATCHES_REPRODUCED_REFERENCE");
 assert.deepEqual(saved.calibrated,h.report.calibratedEvidence);assert.deepEqual(saved.marginals,h.report.crcMarginalEvidence);
 assert.equal(saved.decision.purpose,h.report.decisionBrief!.purpose);
 assert.deepEqual(saved.indicators.map(x=>x.value),[30.4,63.3,76]);
 saved.calibrated!.county.rows[0].late.rate_per_100k=999;
 assert.equal(h.report.calibratedEvidence!.county.rows[0].late.rate_per_100k,29.9);
});
test("copied provenance cannot certify changed numbers, and JSONB key reordering does not alter content identity",()=>{
 const x=colorectalEvidenceAction(),r=buildEvidenceActionCaseHandoff(x.program,x.bridge).report;
 const changed=structuredClone(r);changed.calibratedEvidence!.county.rows[0].late.rate_per_100k=30;
 changed.calibratedEvidence!.county.contrasts.late_stage_rate_difference=30-23.9;
 const saved=inspectSavedResearchEvidence(changed);
 assert.equal(saved.state,"SAVED_EVIDENCE_REQUIRES_REVIEW");assert.equal(saved.calibrationMatchesReference,false);
 assert.equal(saved.calibrated!.county.rows[0].late.rate_per_100k,30,"preserve declared values rather than substituting current data");
 assert.deepEqual(researchSourcesForReassessment(changed),[]);
 const reorder=(v:unknown):unknown=>Array.isArray(v)?v.map(reorder):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reorder(x)])):v;
 assert.equal(inspectSavedResearchEvidence(reorder(r)).calibrationMatchesReference,true);
});
test("reassessment preserves research sources and contrary evidence without recursive report growth or causal promotion",()=>{
 const x=colorectalEvidenceAction();const original=buildEvidenceActionCaseHandoff(x.program,x.bridge).report;
 const first=retainResearchForReassessment(original,{state:"PRELIMINARY_DELIBERATION",deliberation:{synthesis:"New proposed interpretation"}});
 const second=retainResearchForReassessment(first,{state:"PRELIMINARY_DELIBERATION",deliberation:{synthesis:"Later proposed interpretation"}});
 assert.deepEqual(inspectSavedResearchEvidence(second).calibrated,original.calibratedEvidence);
 assert.deepEqual(inspectSavedResearchEvidence(second).marginals,original.crcMarginalEvidence);
 assert.deepEqual(second.retainedResearch,original);
 assert.equal("retainedResearch" in (second.retainedResearch as object),false);
 assert.equal(second.interventionAuthorized,false);assert.equal(second.causalEffectEstablished,false);
 assert.ok(JSON.stringify(second).length<128000);
 assert.equal(second.independentOutcomeVerified,false);assert.equal(second.externalCommunicationAuthorized,false);
 const context=researchContextForReassessment(second);
 assert.ok(context.includes('"lateStageRate":29.9'));assert.ok(context.includes('"jointAgeRace":false'));
 assert.ok(context.length<5000);
 assert.doesNotMatch(context,/https:|workspaceId|owner_subject|notes/);
 const evidence=researchSourcesForReassessment(second);
 assert.equal(evidence.length,4);assert.equal(new Set(evidence.map(x=>x.id)).size,4);
 assert.ok(evidence.every(x=>x.evidenceKind==="PLATFORM_PUBLIC_EXCERPT"&&/^[a-f0-9]{64}$/.test(x.receiptHash!)&&x.abstract&&!x.abstractTruncated));
 assert.ok(evidence[1].abstract!.includes("NOT_A_PUBLISHED_CORRELATION_FINDING"));
 assert.ok(evidence[2].url.includes("cdc.gov"));
 assert.ok(evidence[3].abstract!.includes('"under45InferenceSupported":false'));
});
test("legacy or invalid saved evidence never acquires a fresh snapshot or silent scientific approval",()=>{
 const legacy=inspectSavedResearchEvidence({sourceIndicators:[{id:"old",value:0,period:"older source"}]});
 assert.equal(legacy.indicators[0].value,0);assert.equal(legacy.calibrated,undefined);assert.equal(legacy.marginals,undefined);
 const broken=inspectSavedResearchEvidence({calibratedEvidence:{schema:"future-or-invalid",clinicalActionAuthorized:true}});
 assert.equal(broken.state,"SAVED_EVIDENCE_REQUIRES_REVIEW");assert.equal(broken.calibrated,undefined);assert.ok(broken.issues.length>0);
 assert.equal(inspectSavedResearchEvidence({state:"PRELIMINARY_DELIBERATION"}).present,false);
});
test("the existing council consumes the retained scoped excerpts even when fresh literature lookup returns no source",async()=>{
 const x=colorectalEvidenceAction(),r=buildEvidenceActionCaseHandoff(x.program,x.bridge).report;
 const prior=process.env.AI_GATEWAY_MODEL,force=process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 process.env.AI_GATEWAY_MODEL="fixture-free";delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 let calls=0;
 try{
  const result=await convene({prompt:"Investigate the competing explanations without selecting an intervention.",count:4,redCount:2,selected:[],redSelected:[],depth:"Standard",providedEvidence:researchSourcesForReassessment(r)},
   {research:async()=>({sources:[],status:"SYNTHETIC_UNAVAILABLE_LOOKUP"}),infer:async()=>{calls++;return {ok:true,text:"The county measures describe different constructs [E901]. Agree a reversible next study with the owner, investigate rivals, and compare appropriate outcomes before choosing a change. The retained estimates do not establish causation or clinical benefit.",model:"fixture-free"};}});
  assert.ok(calls>0);assert.notEqual(result.state,"EVIDENCE_INSUFFICIENT");
  assert.deepEqual(result.sources.map(s=>s.id),["E901","E902","E903","E904"]);
  assert.ok(result.sources.every(s=>s.evidenceKind==="PLATFORM_PUBLIC_EXCERPT"));
  assert.equal(result.operatingContract.inferenceInvocationCount,calls);
 }finally{if(prior===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=prior;if(force===undefined)delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;else process.env.AI_GATEWAY_FORCE_MULTIPROVIDER=force;}
});
