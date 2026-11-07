import test from "node:test";
import assert from "node:assert/strict";
import {CASE_SOURCE_REGISTRY,preflightChainwebResearchClaims} from "../lib/chainweb-claim-assurance";
import {SELECTED_METHOD_CASES,evidencePreflight,constructEqualEvidenceComparison} from "../lib/chainweb-method-validation";

const source=(id:string)=>CASE_SOURCE_REGISTRY.find(s=>s.id===id)!.source;
const observed=(overrides:Record<string,unknown>={})=>({
 claimId:"NC-screening",caseId:"NC24",sourceUrl:source("NC24"),
 observedEndpoint:"SCREENING_COMPLETION",claimedEndpoint:"SCREENING_COMPLETION",
 kind:"BENEFICIAL_INTERVENTION_EFFECT",difference:20.29,ci95:[17.85,22.73],comparator:"Usual care",...overrides
});
test("casebook and shared claim assurance register the exact same eight sources",()=>{
 assert.deepEqual(SELECTED_METHOD_CASES.map(c=>[c.id,c.source]),
  CASE_SOURCE_REGISTRY.map(c=>[c.id,c.source]));
 assert.equal(evidencePreflight().evidenceContractPassed,true);
});
test("casebook source substitution is rejected even if all numeric comparisons still match",()=>{
 const fake=SELECTED_METHOD_CASES.map(c=>c.id==="NC24"?{...c,source:"https://doi.org/10.1001/fake"}:c);
 const p=evidencePreflight(fake);
 assert.equal(p.evidenceContractPassed,false);
 assert.ok(p.errors.some(x=>x.includes("citation")));
 assert.throws(()=>constructEqualEvidenceComparison(fake));
});
test("casebook internally consistent fabricated numbers are rejected against frozen source snapshots",()=>{
 const fake=SELECTED_METHOD_CASES.map(c=>c.id==="NC24"?{...c,outcomes:c.outcomes.map((x,i)=>
  i===0?{...x,treatment:31,comparison:10.7,difference:20.29}:x)}:c);
 const p=evidencePreflight(fake);
 assert.equal(p.evidenceContractPassed,false);
 assert.ok(p.errors.some(x=>x.includes("snapshot")));
});
test("no case may disappear from a supposedly complete frozen casebook",()=>{
 const p=evidencePreflight(SELECTED_METHOD_CASES.slice(1));
 assert.equal(p.evidenceContractPassed,false);
 assert.ok(p.errors.some(x=>x.includes("completeness")));
});
test("correctly scoped positive RCT endpoint stays provisional, not externally verified",()=>{
 const r=preflightChainwebResearchClaims([observed()]);
 assert.equal(r.status,"PROVISIONAL_REVIEW_CANDIDATES");
 assert.equal(r.independentOriginalSourceVerification,false);
 assert.equal(r.independentHumanReviewVerified,false);
 assert.equal(r.methodSuperiorityEstablished,false);
});
test("screening benefit cannot be restated as cancer mortality benefit",()=>{
 const r=preflightChainwebResearchClaims([observed({claimedEndpoint:"MORTALITY",kind:"MORTALITY_BENEFIT"})]);
 assert.equal(r.status,"REQUIRES_CORRECTION");
 assert.ok(r.claims[0].reasons.includes("CLAIMED_ENDPOINT_NOT_MEASURED"));
});
test("zero effect and equivalence cannot be inferred from a nonsignificant confidence interval",()=>{
 for(const kind of ["NO_EFFECT","EQUIVALENT_EFFECT","BENEFICIAL_INTERVENTION_EFFECT"]){
  const r=preflightChainwebResearchClaims([observed({kind,difference:0.4,ci95:[-3.6,4.2]})]);
  assert.equal(r.status,"REQUIRES_CORRECTION");
 }
});
test("self-declared independent reviewer and fabricated source URL fail closed",()=>{
 const r=preflightChainwebResearchClaims([observed({reviewerId:"Dr Someone",claimedIndependent:true,
  sourceUrl:"https://doi.org/10.1001/jamanetworkopen.2024.46690"})]);
 assert.equal(r.independentHumanReviewVerified,false);
 assert.ok(r.claims[0].reasons.includes("SOURCE_DOES_NOT_MATCH_CURATED_REFERENCE"));
 assert.ok(r.claims[0].reasons.includes("SELF_DECLARED_REVIEW_IS_NOT_INDEPENDENT_ADJUDICATION"));
});
test("unknown disease and unsupported direct mechanism claims do not inherit causal authority",()=>{
 const r=preflightChainwebResearchClaims([observed({caseId:"MATERNAL42",kind:"CAUSAL_MECHANISM"})]);
 assert.equal(r.status,"REQUIRES_CORRECTION");
 assert.ok(r.claims[0].reasons.includes("UNREGISTERED_CASE_NO_AUTOMATIC_EVIDENCE_TRANSFER"));
});
test("sensitive fields are prohibited even when name obfuscation is used",()=>{
 const r=preflightChainwebResearchClaims([observed({Patient_ID:"private"})]);
 assert.ok(r.claims[0].reasons.includes("PERSON_LEVEL_FIELD_PROHIBITED"));
});
