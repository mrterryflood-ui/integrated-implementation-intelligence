import test from "node:test";
import assert from "node:assert/strict";
import {exerciseEvidenceAction} from "../lib/evidence-action-internal-exercise";
test("reproducible internal red-team exercises eight named scenarios",()=>{
 const result=exerciseEvidenceAction();
 assert.equal(result.schema,"dis-internal-exercise-v1");
 assert.equal(result.findings.length,8);
 assert.deepEqual(result.findings.map(f=>f.id),
  ["EX-01","EX-02","EX-03","EX-04","EX-05","EX-06","EX-07","EX-08"]);
 assert.equal(result.allContractChecksPassed,true,
  JSON.stringify(result.findings.filter(x=>x.result!=="PASS_CONTRACT")));
 assert.equal(result.scientificValidityEstablished,false);
});
test("divergent synthetic pretrends are not validated by a text-only design declaration",()=>{
 const finding=exerciseEvidenceAction().findings.find(x=>x.id==="EX-04")!;
 assert.match(finding.observed,/Pretrend slopes 2 vs 0/);
 assert.match(finding.observed,/causal=false/);
 assert.match(finding.nextEvidence,/objective pretrend diagnostics/i);
});
test("receipt metadata and disease measure gaps cannot be represented as closed",()=>{
 const result=exerciseEvidenceAction();
 const receipt=result.findings.find(x=>x.id==="EX-06")!;
 const gaps=result.findings.find(x=>x.id==="EX-07")!;
 assert.match(receipt.observed,/verified=false/);
 assert.match(gaps.observed,/remain open/);
});
