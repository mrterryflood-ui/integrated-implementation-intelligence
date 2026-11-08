import test from "node:test";
import assert from "node:assert/strict";
import {getCrcMarginals,validateCrcMarginals,marginalSourceUrl} from "../lib/crc-marginal-supplement";
import {colorectalEvidenceAction} from "../lib/evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff} from "../lib/evidence-action-case-handoff";
test("original-source marginal point patterns stay distinct from aggregate and causal conclusions",()=>{
 const m=getCrcMarginals();
 assert.equal(m.sources.length,16);assert.equal(m.strata.length,4);
 const black=m.strata.find(x=>x.dimension==="race"&&x.code==="28")!;
 assert.deepEqual(black.counties.map(x=>[x.late.ratePer100k,x.late.ci95,x.late.lateCaseSharePercent]),[[28.3,[24.7,32.3],62.1],[29.9,[28.2,31.6],62.1]]);
 assert.ok(black.lateRateDifference<0);assert.equal(black.lateShareDifferencePp,0);
 const younger=m.strata.find(x=>x.dimension==="age"&&x.code==="009")!;
 assert.ok(younger.lateRateDifference>0);assert.ok(younger.lateShareDifferencePp<0);
 assert.equal(m.jointAgeRaceAnalysis,false);assert.equal(m.under45InferenceSupported,false);assert.equal(m.causalEffectEstablished,false);
});
test("case save retains all source scopes, point estimates and intervals while preserving old history",()=>{
 const x=colorectalEvidenceAction();const save=buildEvidenceActionCaseHandoff(x.program,x.bridge);
 assert.deepEqual(save.report.crcMarginalEvidence,x.crcMarginalEvidence);
 assert.deepEqual(save.report.calibratedEvidence,x.calibratedEvidence);
 assert.deepEqual(save.report.sourceIndicators.map(r=>r.value),[30.4,63.3,76]);
 assert.ok(new TextEncoder().encode(JSON.stringify(save.report)).length<64000);
 assert.match(x.bridge.gaps.find(g=>g.id==="all-stage-incidence")!.problem,/2019–2023.*available/);
 assert.ok(x.bridge.gaps.some(g=>g.id==="diagnostic-resolution"));
 const notes=Array.from({length:4},(_,i)=>({id:"long-note-"+i,kind:"HYPOTHESIS",text:"x".repeat(4900),sourceUrl:"https://example.org/synthetic-capacity",gapIds:["diagnostic-resolution"],origin:"SYNTHETIC"}));
 const annotated=buildEvidenceActionCaseHandoff(x.program,x.bridge,{publicAggregateConfirmed:true,additionalGaps:[],notes});
 assert.ok(JSON.stringify(annotated.report).length>65000,"reproduce the former source-rich report rejection");
 assert.equal(annotated.report.investigation.notes[3].text.length,4900);
 assert.deepEqual(annotated.report.crcMarginalEvidence,x.crcMarginalEvidence);
});
test("sourceURL compaction is lossless and cannot change the clinical/data scope",()=>{
 const m=getCrcMarginals();
 for(const s of m.sources){const u=new URL(marginalSourceUrl(m,s.id));assert.equal(u.hostname,"statecancerprofiles.cancer.gov");assert.equal(u.searchParams.get("sex"),"0");assert.equal(u.searchParams.get("cancer"),"020");}
 const changed=getCrcMarginals();changed.sources[0].query=changed.sources[0].query.replace("sex=0","sex=2");
 assert.throws(()=>validateCrcMarginals(changed),/query frame/);
 const age=getCrcMarginals();age.strata[0].label="<45";
 assert.throws(()=>validateCrcMarginals(age),/marginal frame/);
 const missing=getCrcMarginals();missing.sources.pop();
 assert.throws(()=>validateCrcMarginals(missing),/source identity/);
});
test("joint analysis, clinical authority, invented contrasts and zero-filled suppression are denied",()=>{
 for(const key of ["jointAgeRaceAnalysis","clinicalActionAuthorized","causalEffectEstablished","under45InferenceSupported"] as const){const m=getCrcMarginals();m[key]=true;assert.throws(()=>validateCrcMarginals(m),/promotion/);}
 const contrast=getCrcMarginals();contrast.strata[0].lateRateDifference=10;
 assert.throws(()=>validateCrcMarginals(contrast),/contrast/);
 const suppressed=getCrcMarginals();suppressed.strata[0].counties[0].late.state="SUPPRESSED_OR_MISSING";suppressed.strata[0].counties[0].late.ratePer100k=0;
 assert.throws(()=>validateCrcMarginals(suppressed),/suppression/);
});
