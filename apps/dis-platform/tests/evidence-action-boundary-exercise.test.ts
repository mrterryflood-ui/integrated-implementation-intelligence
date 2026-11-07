import test from "node:test";
import assert from "node:assert/strict";
import {
 reviewCrossStudyMeasurements,reviewCorrectionReceipt,reviewCounterfactual,reviewEvidenceToAction,
 type ExternalStudyMeasure,type CorrectionReceipt,type CorrectionProposal,type CounterfactualRequest,
 type MeasureBinding
} from "../lib/evidence-action-bridge";
import {strictTimestamp} from "../lib/evidence-action-input-integrity";
import type {ResearchProgram} from "../lib/research-program";
const AS_OF="2026-11-07T16:00:00Z";
const measure=():ExternalStudyMeasure=>({id:"exercise-1",title:"Synthetic contract exercise; not population evidence",
 sourceUrl:"https://example.org/synthetic-study",condition:"colorectal",construct:"SCREENING_COMPLETION",
 geography:"Synthetic county",populationFrame:"Synthetic eligible cohort",period:"2020",
 numeratorDefinition:"Synthetic completions",denominatorDefinition:"Synthetic eligible persons",
 unit:"percent",methodVersion:"synthetic-v1",value:40});
const action:CorrectionProposal={id:"synthetic-action",strategy:"Synthetic exercise",basis:"Not actual delivery",
 ownerRole:"Not assigned",measureToVerify:"Synthetic",potentialHarm:"Synthetic",
 coreFunctionEvidence:"NOT_INDEPENDENTLY_VALIDATED_FOR_SITE",sourceUrl:"https://example.org/synthetic-study",state:"PROPOSED_NOT_AUTHORIZED"};
const receipt=():CorrectionReceipt=>({proposedActionId:action.id,deliveryRecordedAt:"2026-11-07T14:00:00Z",
 sourceUrl:"https://example.org/synthetic-receipt",eligibleDenominator:100,completedNumerator:60,
 coreFunctionChecked:true,balancingHarmsReviewed:true,comparisonRecorded:true,reviewerIdentity:"Synthetic declarant, not authenticated"});
const panel=():CounterfactualRequest=>({condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic rate units",interventionYear:2021,
 commonMeasurementVersion:"Synthetic methods declaration, not independently verified",
 comparisonRationale:"Synthetic matching rationale, not independently verified",
 parallelTrendsEvidence:"Synthetic trend declaration, not independently verified",
 competingChangesEvidence:"Synthetic confounding declaration, not independently verified",
 spilloverAssessment:"Synthetic spillover declaration, not independently verified",
 independentReviewer:"Synthetic reviewer declaration, not independently verified",
 treated:{site:"Synthetic A",populationFrame:"Same synthetic definition",observations:[2018,2019,2020,2021,2022].map((year,i)=>({year,value:10+i,denominator:100}))},
 comparator:{site:"Synthetic B",populationFrame:"Same synthetic definition",observations:[2018,2019,2020,2021,2022].map((year,i)=>({year,value:9+i-(i>=3?1:0),denominator:100}))}});

test("valid source report stays unverified and detached from caller mutations",()=>{
 const row=measure(),out=reviewCrossStudyMeasurements([row],[]);row.value=140;
 assert.equal(out.admitted.length,1);assert.equal(out.admitted[0].value,40);
 assert.equal(out.originalMethodsVerified,false);assert.equal(out.pooledEstimate,null);
});
test("missing identifier is an error rather than an invented evidence identity",()=>{
 const row:Record<string,unknown>={...measure()};delete row.id;
 const out=reviewCrossStudyMeasurements([row],[]);
 assert.equal(out.admitted.length,0);assert.match(out.rejected[0].reasons.join(" "),/explicit.*identifier/);
});
test("conflicting duplicate IDs quarantine every collision, independent of order",()=>{
 for(const values of [[40,70],[70,40]]){
  const out=reviewCrossStudyMeasurements(values.map(value=>({...measure(),value})),[]);
  assert.equal(out.admitted.length,0);assert.equal(out.rejected.length,2);
  assert.ok(out.rejected.every(x=>x.reasons.some(r=>r.includes("conflicting"))));
 }
});
test("an identical duplicate remains one source, never an independent confirmation",()=>{
 const out=reviewCrossStudyMeasurements([measure(),measure()],[]);
 assert.equal(out.admitted.length,1);assert.equal(out.rejected.length,1);
 assert.equal(out.originalMethodsVerified,false);
});
test("unknown fields and claimed trust cannot be carried into aggregate evidence",()=>{
 for(const extra of [{patientName:"SYNTHETIC_MARKER_NOT_A_PERSON"},{causalEffectEstablished:true},{notes:{recordId:"SYNTHETIC"}}]){
  const out=reviewCrossStudyMeasurements([{...measure(),...extra}],[]);
  assert.equal(out.admitted.length,0);assert.match(out.rejected[0].reasons.join(" "),/Unexpected fields/);
  assert.ok(!JSON.stringify(out).includes("SYNTHETIC_MARKER_NOT_A_PERSON"),"Do not echo prohibited values in diagnostics");
 }
});
test("source URLs with embedded credentials are rejected without returning them",()=>{
 const out=reviewCrossStudyMeasurements([{...measure(),sourceUrl:"https://synthetic:NOT_A_SECRET@example.org/source"}],[]);
 assert.equal(out.admitted.length,0);assert.ok(!JSON.stringify(out).includes("NOT_A_SECRET"));
});
for(const unit of ["%","percent"," Percentage ","per cent","percentage (%)"]){
 test("percentage scale bounds apply to alias "+JSON.stringify(unit),()=>{
  assert.equal(reviewCrossStudyMeasurements([{...measure(),unit,value:140}],[]).admitted.length,0);
  assert.equal(reviewCrossStudyMeasurements([{...measure(),unit,value:100}],[]).admitted.length,1);
  const p=panel();p.unit=unit;p.treated.observations[0].value=140;
  assert.equal(reviewCounterfactual(p).rawDifferenceInDifferences,null);
 });
}
for(const unit of ["proportion","fraction","probability"]){
 test("fraction scale bounds apply to "+unit,()=>{
  assert.equal(reviewCrossStudyMeasurements([{...measure(),unit,value:1.1}],[]).admitted.length,0);
  assert.equal(reviewCrossStudyMeasurements([{...measure(),unit,value:1}],[]).admitted.length,1);
 });
}
test("unknown and zero stay distinct, and units are not silently converted",()=>{
 for(const value of [0,null]){
  const out=reviewCrossStudyMeasurements([{...measure(),value,unit:" Percentage "}],[]);
  assert.equal(out.admitted[0].value,value);assert.equal(out.admitted[0].unit," Percentage ");
 }
});
test("complete receipt is only a provisional metadata check",()=>{
 const out=reviewCorrectionReceipt(action,receipt(),AS_OF);
 assert.equal(out.provisionalCompleteness,true);assert.equal(out.claimedOutcomeVerified,false);
 assert.equal(out.actionAuthorized,false);assert.equal(out.closure,"INDEPENDENT_EXTERNAL_VERIFICATION_REQUIRED");
});
for(const stamp of ["2026-02-30T12:00:00Z","2025-02-29T12:00:00Z","2026-11-07T14:00:00","2026-11-07T24:00:00Z","2026-11-07T12:00:00+24:00"]){
 test("invalid or ambiguous delivery timestamp rejected: "+stamp,()=>{
  assert.equal(strictTimestamp(stamp),null);
  assert.equal(reviewCorrectionReceipt(action,{...receipt(),deliveryRecordedAt:stamp},AS_OF).provisionalCompleteness,false);
 });
}
test("real leap date and equivalent offset clocks are accepted",()=>{
 assert.equal(strictTimestamp("2024-02-29T12:00:00Z"),Date.parse("2024-02-29T12:00:00Z"));
 assert.equal(strictTimestamp("2026-11-07T08:00:00-06:00"),strictTimestamp("2026-11-07T14:00:00Z"));
 assert.equal(reviewCorrectionReceipt(action,{...receipt(),deliveryRecordedAt:"2026-11-07T08:00:00-06:00"},AS_OF).provisionalCompleteness,true);
});
test("future receipt and invalid review clock cannot certify completion",()=>{
 assert.equal(reviewCorrectionReceipt(action,{...receipt(),deliveryRecordedAt:"2026-11-08T14:00:00Z"},AS_OF).provisionalCompleteness,false);
 assert.equal(reviewCorrectionReceipt(action,receipt(),"not a clock").provisionalCompleteness,false);
 assert.equal(reviewCorrectionReceipt(action,receipt(),new Date(NaN)).provisionalCompleteness,false);
});
test("unsafe integer counts and credential-bearing receipt references are rejected",()=>{
 assert.equal(reviewCorrectionReceipt(action,{...receipt(),eligibleDenominator:Number.MAX_SAFE_INTEGER+1},AS_OF).provisionalCompleteness,false);
 assert.equal(reviewCorrectionReceipt(action,{...receipt(),sourceUrl:"https://synthetic:NOT_A_SECRET@example.org/receipt"},AS_OF).provisionalCompleteness,false);
});
test("malformed receipt and unknown receipt fields fail without exceptions",()=>{
 assert.equal(reviewCorrectionReceipt(action,null as unknown as CorrectionReceipt,AS_OF).provisionalCompleteness,false);
 assert.equal(reviewCorrectionReceipt(action,{...receipt(),reviewerIdentity:8 as unknown as string},AS_OF).provisionalCompleteness,false);
 const extra={...receipt(),patientName:"SYNTHETIC_MARKER_NOT_A_PERSON"};
 const out=reviewCorrectionReceipt(action,extra,AS_OF);
 assert.equal(out.provisionalCompleteness,false);assert.ok(!JSON.stringify(out).includes("SYNTHETIC_MARKER_NOT_A_PERSON"));
});
test("finite input overflow cannot yield a passing NaN or Infinity DID",()=>{
 const p=panel();for(const arm of [p.treated,p.comparator])for(const row of arm.observations)row.value=Number.MAX_VALUE;
 const out=reviewCounterfactual(p);
 assert.equal(out.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");assert.equal(out.rawDifferenceInDifferences,null);
 assert.match(out.gaps.join(" "),/overflow|non-finite/);
});
test("a valid synthetic DID remains computable but never gains causal authority",()=>{
 const out=reviewCounterfactual(panel());
 assert.equal(out.rawDifferenceInDifferences,1);assert.equal(out.causalEffectEstablished,false);
 assert.equal(out.interpretation,"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL");
});
for(const [construct,id] of [["SCREENING_COMPLETION","screening-denominator"],["DIAGNOSTIC_FOLLOWUP","diagnostic-resolution"],["DISEASE_INCIDENCE","all-stage-incidence"]] as const){
 for(const cause of ["invalid numeric value","ambiguous binding"]){
  test("quarantine reopens "+id+" after "+cause,()=>{
   const program={caseId:"synthetic",site:"colorectal",issues:[],indicators:[{
    id:"candidate",site:"colorectal",value:cause==="invalid numeric value"?140:40,unit:"percent",
    sourceUrl:"https://example.org/source",evidenceState:"PUBLISHED_AGGREGATE",period:"2020",
    numeratorDefinition:"Synthetic numerator",denominatorDefinition:"Synthetic denominator",geography:"Synthetic county"
   }],drivers:[],strategies:[]} as unknown as ResearchProgram;
   const binding:MeasureBinding={indicatorId:"candidate",condition:"colorectal",construct,denominatorClass:"synthetic",populationFrame:"Synthetic",methodVersion:"v1"};
   const out=reviewEvidenceToAction(program,cause==="ambiguous binding"?[binding,{...binding}]:[binding]);
   assert.equal(out.measures.length,0);assert.equal(out.links.length,0);
   assert.ok(out.gaps.some(g=>g.id===id));assert.equal(out.correctiveActionAuthorized,false);
  });
 }
}
