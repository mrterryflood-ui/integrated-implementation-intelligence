import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";
import {
  BRIDGE_VERSION,boundDiscoveryLeads,reviewEvidenceToAction,
  reviewCounterfactual,reviewCorrectionReceipt,
  type CounterfactualRequest,type CorrectionReceipt
} from "../lib/evidence-action-bridge";
import {COLORECTAL_CROSSWALK,colorectalEvidenceAction,COLORECTAL_COMPARISON_SITES} from "../lib/evidence-action-colorectal";
import type {IntelligenceRecord} from "../lib/consultation-research";

test("existing Hinds County source remains three distinct, nonpoolable colorectal indicators",()=>{
  const {program,bridge}=colorectalEvidenceAction();
  assert.equal(bridge.schemaVersion,BRIDGE_VERSION);
  assert.equal(program.population.proxyUnit,"Hinds County, MS");
  assert.deepEqual(bridge.measures.map(m=>m.indicator.value),[30.4,63.3,76]);
  assert.deepEqual(bridge.measures.map(m=>m.construct),
    ["LATE_STAGE_INCIDENCE","LATE_STAGE_CASE_SHARE","LATE_STAGE_CASE_COUNT"]);
  assert.equal(bridge.links.length,3);
  assert.ok(bridge.links.every(x=>x.relationship==="RELATED_PHENOMENON_DIFFERENT_MEASURE"));
  assert.ok(bridge.links.every(x=>x.safeToPool===false&&x.causalRelationshipEstablished===false));
  assert.ok(bridge.gaps.some(x=>x.id==="all-stage-incidence"));
  assert.ok(bridge.gaps.some(x=>x.id==="diagnostic-resolution"));
  assert.equal(bridge.specialistExecution,"HUMAN_SELECTION_REQUIRED_NOT_INVOKED");
  assert.equal(bridge.verifiedCorrections,0);
  assert.equal(bridge.causalEffectEstablished,false);
  assert.equal(bridge.correctiveActionAuthorized,false);
});
test("Harris, Colorado and other diseases never inherit source values from Hinds",()=>{
  assert.equal(COLORECTAL_COMPARISON_SITES.length,3);
  assert.ok(COLORECTAL_COMPARISON_SITES.slice(1).every(x=>x.state.includes("REQUIRED")));
  const breast=buildResearchProgram(jacksonCancerCase("breast"));
  const mismatch=reviewEvidenceToAction(breast,COLORECTAL_CROSSWALK);
  assert.equal(mismatch.measures.length,0);
  assert.ok(mismatch.gaps.some(x=>x.id==="unmapped:BREAST-LATE-INC"));
  const colorectal=buildResearchProgram(jacksonCancerCase("colorectal"));
  const misbind=reviewEvidenceToAction(colorectal,[{...COLORECTAL_CROSSWALK[0],condition:"lung"}]);
  assert.equal(misbind.measures.length,0);
  assert.ok(misbind.gaps.some(x=>x.id==="unmapped:CRC-LATE-INC"));
});
test("unknown or unsourced cells never become observed evidence",()=>{
  const source=jacksonCancerCase("colorectal");
  source.indicators[0]={...source.indicators[0],value:null,evidenceState:"NOT_OBSERVED"};
  source.indicators[1]={...source.indicators[1],sourceUrl:"http://example.com"};
  const result=reviewEvidenceToAction(buildResearchProgram(source),COLORECTAL_CROSSWALK);
  assert.equal(result.measures.length,1);
  assert.ok(result.gaps.some(x=>x.id==="source:CRC-LATE-INC"));
  assert.ok(result.gaps.some(x=>x.id==="source:CRC-LATE-SHARE"));
  assert.equal(result.measures[0].id,"CRC-LATE-COUNT");
});
test("duplicated or orphan crosswalk bindings remain explicit measurement blockers",()=>{
  const program=buildResearchProgram(jacksonCancerCase("colorectal"));
  const result=reviewEvidenceToAction(program,[...COLORECTAL_CROSSWALK,COLORECTAL_CROSSWALK[0],
    {...COLORECTAL_CROSSWALK[0],indicatorId:"UNKNOWN"}]);
  assert.ok(result.gaps.some(x=>x.id==="duplicate:CRC-LATE-INC"));
  assert.ok(result.gaps.some(x=>x.id==="orphan:UNKNOWN"));
});
const lead=(id:string,url:string,title="Study"):IntelligenceRecord=>({
  id,kind:"SCHOLARLY",title,summary:"Abstract-level discovery lead",
  source:"OpenAlex",url,retrievedAt:"2026-11-07T14:00:00Z",
  sourceStatus:"DISCOVERY_ONLY"
});
test("literature discovery deduplicates DOI identities and cannot certify independent corroboration",()=>{
  const leads=boundDiscoveryLeads([
    lead("one","https://doi.org/10.1000/Test"),
    lead("two","https://doi.org/10.1000/test"),
    lead("bad","javascript:alert(1)"),
    {...lead("grant","https://grants.gov/grant"),kind:"OPEN_GRANT"}
  ]);
  assert.equal(leads.length,1);
  assert.equal(leads[0].claimVerified,false);
  assert.equal(leads[0].independentConfirmation,false);
  const review=colorectalEvidenceAction([lead("one","https://doi.org/10.1000/Test")]).bridge;
  assert.equal(review.literature.length,1);
  assert.equal(review.literature[0].sourceStatus,"DISCOVERY_ONLY");
  assert.ok(!review.gaps.some(x=>x.id==="literature-not-retrieved"));
  assert.ok(review.gaps.some(x=>x.id==="counterfactual-unverified"));
});
const panel:CounterfactualRequest={
  condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"cases per 100,000",
  interventionYear:2021,commonMeasurementVersion:"Matched NCI method and release, to be independently checked",
  comparisonRationale:"Documented treated and comparison selection rationale with baseline covariates",
  parallelTrendsEvidence:"Pre-intervention event-study and residual trend inspection documented for independent review",
  competingChangesEvidence:"Registry changes, campaigns, screening, policies and shocks examined for both groups",
  spilloverAssessment:"Cross-site referral and provider spillovers investigated before interpretation",
  independentReviewer:"Independent epidemiology reviewer identification for actual assignment",
  treated:{site:"Site A",populationFrame:"Source-specific comparable eligible residents",
    observations:[{year:2018,value:10,denominator:100000},{year:2019,value:11,denominator:100000},
      {year:2020,value:12,denominator:100000},{year:2021,value:13,denominator:100000},
      {year:2022,value:14,denominator:100000}]},
  comparator:{site:"Site B",populationFrame:"Source-specific comparable eligible residents",
    observations:[{year:2018,value:9,denominator:100000},{year:2019,value:10,denominator:100000},
      {year:2020,value:11,denominator:100000},{year:2021,value:11,denominator:100000},
      {year:2022,value:12,denominator:100000}]}
};
test("an aligned synthetic DID panel yields only descriptive arithmetic, never causal effect",()=>{
  const out=reviewCounterfactual(panel);
  assert.equal(out.gate,"CANDIDATE_FOR_INDEPENDENT_DESIGN_REVIEW");
  assert.deepEqual(out.matchedPreYears,[2018,2019,2020]);
  assert.deepEqual(out.matchedPostYears,[2021,2022]);
  assert.equal(out.rawDifferenceInDifferences,1);
  assert.equal(out.interpretation,"DESCRIPTIVE_ARITHMETIC_ONLY_NOT_CAUSAL");
  assert.equal(out.causalEffectEstablished,false);
});
test("single snapshot, missing timing, missing denominator or undocumented trends blocks DID",()=>{
  const brief=reviewCounterfactual({...panel,interventionYear:null,
    treated:{...panel.treated,observations:panel.treated.observations.slice(0,1)},
    parallelTrendsEvidence:"",comparator:{...panel.comparator,observations:panel.comparator.observations.slice(0,1)}});
  assert.equal(brief.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");
  assert.equal(brief.rawDifferenceInDifferences,null);
  assert.ok(brief.gaps.some(g=>g.includes("intervention year")));
  assert.ok(brief.gaps.some(g=>g.includes("pre-intervention")));
  assert.ok(brief.gaps.some(g=>g.includes("parallel-trends")));
  const invalid=reviewCounterfactual({...panel,treated:{...panel.treated,
    observations:[...panel.treated.observations,{year:2022,value:15,denominator:null}]}});
  assert.ok(invalid.gaps.some(g=>g.includes("duplicate year")));
  assert.equal(invalid.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");
  const diffFrame=reviewCounterfactual({...panel,comparator:{...panel.comparator,populationFrame:"Different age group"}});
  assert.ok(diffFrame.gaps.some(g=>g.includes("frames differ")));
});
test("complete self-reported correction receipt cannot impersonate independent outcome verification",()=>{
  const action=colorectalEvidenceAction().bridge.corrections[0];
  const receipt:CorrectionReceipt={proposedActionId:action.id,
    deliveryRecordedAt:"2026-11-07T14:00:00Z",sourceUrl:"https://example.org/operations/receipt",
    eligibleDenominator:100,completedNumerator:81,coreFunctionChecked:true,
    balancingHarmsReviewed:true,comparisonRecorded:true,reviewerIdentity:"Claimed external reviewer"};
  const out=reviewCorrectionReceipt(action,receipt);
  assert.equal(out.provisionalCompleteness,true);
  assert.equal(out.closure,"INDEPENDENT_EXTERNAL_VERIFICATION_REQUIRED");
  assert.equal(out.claimedOutcomeVerified,false);
  assert.equal(out.actionAuthorized,false);
  const bad=reviewCorrectionReceipt(action,{...receipt,eligibleDenominator:0,completedNumerator:105,
    balancingHarmsReviewed:false,proposedActionId:"WRONG"});
  assert.ok(bad.problems.length>=3);
  assert.equal(bad.provisionalCompleteness,false);
});
test("new discovery API reuses bounded OpenAlex and existing authentication boundary",()=>{
  const route=readFileSync("app/api/research-program/evidence-search/route.ts","utf8");
  assert.match(route,/from "\.\.\/\.\.\/\.\.\/\.\.\/lib\/council-runtime"/);
  assert.match(route,/await auth\(\)/);
  assert.match(route,/looksLikePrivateRecord\(query\)/);
  assert.match(route,/sourceStatus:"DISCOVERY_ONLY"/);
  assert.doesNotMatch(route,/RPLICE_API_KEY|runSelectedRpliceMcp|AI_GATEWAY_API_KEY/);
});
