import test from "node:test";
import assert from "node:assert/strict";
import {
 SELECTED_METHOD_CASES,evidencePreflight,effectClass,constructEqualEvidenceComparison,
 STANDARD_COMPARATOR,CHAINWEB_ADDITION,type SelectedCase
} from "../lib/chainweb-method-validation";

const by=(id:string)=>SELECTED_METHOD_CASES.find(c=>c.id===id)!;

test("eight source-identified published cases and nine distinct numerical contrasts are preflighted without claiming validation",()=>{
 const check=evidencePreflight();
 assert.equal(check.cases,8);
 assert.equal(check.numericalContrasts,9);
 assert.equal(check.evidenceContractPassed,true,check.errors.join(";"));
 assert.equal(check.chainwebSuperiorityMeasured,false);
 assert.equal(check.independentAdjudicationPerformed,false);
 assert.equal(check.clinicalEffectOfChainwebMeasured,false);
 assert.equal(check.interventionAuthorized,false);
});

test("RCT screening benefit is endpoint-specific; positive FIT subgroup is inconclusive",()=>{
 const c=by("NC24");
 assert.equal(effectClass(c.design,c.outcomes[0]),"POSITIVE_DEFINED_ENDPOINT");
 assert.equal(effectClass(c.design,c.outcomes[1]),"UNCERTAIN_NOT_EQUIVALENCE");
 assert.equal(c.outcomes[1].endpoint,"DIAGNOSTIC_COMPLETION");
});

test("navigation benefit over usual care is not proof navigation adds benefit beyond active outreach",()=>{
 const c=by("US23");
 assert.equal(effectClass(c.design,c.outcomes[0]),"POSITIVE_DEFINED_ENDPOINT");
 assert.equal(effectClass(c.design,c.outcomes[1]),"UNCERTAIN_NOT_EQUIVALENCE");
 assert.equal(c.outcomes[1].ci95?.[0],-3.6);
 assert.equal(c.fidelity[0].conditioning.includes("completed follow-up"),true);
});

test("context-specific Washington navigation evidence stays diagnostic rather than incidence prevention",()=>{
 const c=by("WA25");
 assert.equal(effectClass(c.design,c.outcomes[0]),"POSITIVE_DEFINED_ENDPOINT");
 assert.equal(c.outcomes[0].endpoint,"DIAGNOSTIC_COMPLETION");
});

test("conditional implementation denominators are not interchangeable",()=>{
 const c=by("OR25");
 assert.equal(c.fidelity[0].denominator,1489);
 assert.equal(c.fidelity[1].denominator,19);
 assert.equal(effectClass(c.design,c.outcomes[0]),"POSITIVE_DEFINED_ENDPOINT");
});

test("changing comparison-group performance does not authorize fidelity-collapse attribution",()=>{
 const c=by("CA26");
 assert.equal(c.outcomes[0].difference,10.8);
 assert.equal(c.outcomes[1].difference,2.9);
 assert.equal(c.outcomes[1].treatment>c.outcomes[0].treatment,true);
 assert.equal(c.outcomes[1].comparison>c.outcomes[0].comparison,true);
 assert.equal(effectClass(c.design,c.outcomes[1]),"UNCERTAIN_NOT_EQUIVALENCE");
 assert.ok(c.contextQuestions.some(x=>x.includes("Cannot infer")));
});

test("observational and methods cases never become randomized causal estimates",()=>{
 for(const id of ["ALTA25","PCOS24","FRAME26"]){
  const c=by(id);
  for(const o of c.outcomes)assert.equal(effectClass(c.design,o),"OBSERVATIONAL_NONCAUSAL");
  assert.notEqual(c.design,"RANDOMIZED_EBI");
 }
});

test("balanced packets expose identical source/denominator/context to both arms and protect unearned method-superiority claims",()=>{
 const p=constructEqualEvidenceComparison();
 assert.equal(p.packets.length,16);
 for(const c of SELECTED_METHOD_CASES){
  const pair=p.packets.filter(x=>x.caseId===c.id);
  assert.equal(pair.length,2);
  assert.deepEqual(pair.map(x=>x.method),["STANDARD","CHAINWEB_AUGMENTED"]);
  assert.equal(pair[0].sourceDigest,pair[1].sourceDigest);
  assert.deepEqual(pair[0].caseEvidence,pair[1].caseEvidence);
  assert.equal(pair[0].task,pair[1].task);
 }
 assert.match(STANDARD_COMPARATOR,/CFIR.*PRISM.*FRAME-IS/);
 assert.match(CHAINWEB_ADDITION,/All standard comparator methods/);
 assert.equal(p.superiorityEstablished,false);
 assert.equal(p.independentRatings,0);
 assert.equal(p.noPartnerOrClinicalAction,true);
});

test("tampering with numerical contrast and conditional fidelity denominators fails closed",()=>{
 const corruptContrast=SELECTED_METHOD_CASES.map(c=>({...c,outcomes:c.id==="NC24"?c.outcomes.map((o,i)=>i===0?{...o,difference:91}:o):c.outcomes}));
 assert.equal(evidencePreflight(corruptContrast).evidenceContractPassed,false);
 const corruptDose=SELECTED_METHOD_CASES.map(c=>({...c,fidelity:c.id==="OR25"?c.fidelity.map((d,i)=>i===1?{...d,denominator:190}:d):c.fidelity}));
 assert.equal(evidencePreflight(corruptDose).evidenceContractPassed,false);
 assert.throws(()=>constructEqualEvidenceComparison(corruptDose));
});

test("no registered RPLICE execution, fabricated clinical observation or retrospective DDD is hidden in native benchmark",()=>{
 const p=constructEqualEvidenceComparison();
 assert.equal(p.goldStandardIndependentlyAdjudicated,false);
 assert.equal(p.studyStatus,"EQUAL_EVIDENCE_PACKETS_ONLY_NOT_EXECUTED");
 assert.ok(p.requiredEndpoints.includes("time/cost"));
 assert.ok(p.requiredEndpoints.includes("equity and sustainment"));
});
