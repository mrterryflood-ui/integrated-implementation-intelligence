import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";
import {
  BRIDGE_VERSION,boundDiscoveryLeads,reviewEvidenceToAction,
  reviewCounterfactual,reviewCorrectionReceipt,reviewCrossStudyMeasurements,
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

test("cross-source measurements identify related phenomena without pooling or fabricating provenance",()=>{
  const base=colorectalEvidenceAction().bridge.measures;
  const item={id:"registry-typed",title:"Source-reported external screening measurement",
    sourceUrl:"https://www.cdc.gov/places/about/",condition:"colorectal",
    construct:"SCREENING_COMPLETION",geography:"Comparison geography not yet reconciled",
    populationFrame:"Screening-eligible adults, definition unverified",
    period:"2022",numeratorDefinition:"Completed recommended colorectal screening",
    denominatorDefinition:"Screening-eligible population",unit:"percent",
    methodVersion:"Source methods must be checked",value:null};
  const reviewed=reviewCrossStudyMeasurements([item],base);
  assert.equal(reviewed.admitted.length,1);
  assert.equal(reviewed.links.length,3);
  assert.ok(reviewed.links.every(x=>x.relation==="SAME_PHENOMENON_DIFFERENT_MEASURE"));
  assert.ok(reviewed.links.every(x=>!x.safeToPool&&!x.causalityEstablished));
  assert.equal(reviewed.originalMethodsVerified,false);
  assert.equal(reviewed.pooledEstimate,null);
  const wrong=reviewCrossStudyMeasurements([{...item,id:"breast-switch",condition:"breast"}],base);
  assert.equal(wrong.links.length,0,"No automatic cross-condition evidence transfer");
});
test("cross-study importer refuses malformed, repeated and impossible values",()=>{
  const base=colorectalEvidenceAction().bridge.measures;
  const valid={id:"lead",title:"Source-reported example",sourceUrl:"https://www.cdc.gov/places/about/",
    condition:"colorectal",construct:"SCREENING_COMPLETION",
    geography:"Test county",populationFrame:"Ages per source",
    period:"2022",numeratorDefinition:"Screened individuals",
    denominatorDefinition:"Eligible residents",unit:"percent",methodVersion:"Source method",value:40};
  const out=reviewCrossStudyMeasurements([valid,{...valid,value:110,id:"overflow"},
    {...valid,id:"lead"},{...valid,id:"bad-url",sourceUrl:"http://notsecure.example"}],base);
  assert.equal(out.admitted.length,1);
  assert.equal(out.rejected.length,3);
  assert.ok(out.rejected.some(x=>x.id==="overflow"&&x.reasons.some(r=>r.includes("exceed 100"))));
  assert.ok(out.rejected.some(x=>x.id==="lead"&&x.reasons.some(r=>r.includes("Duplicate"))));
});
test("generic multi-site program cannot relabel breast indicator as colorectal",()=>{
  const source=buildResearchProgram(jacksonCancerCase("general"));
  const fake=[{indicatorId:"BREAST-LATE-SHARE",condition:"colorectal" as const,
    construct:"LATE_STAGE_CASE_SHARE" as const,denominatorClass:"STAGED_INCIDENT_CASES",
    populationFrame:"Hinds County residents",methodVersion:"Original NCI county methods"}];
  const result=reviewEvidenceToAction(source,fake);
  assert.equal(result.measures.length,0);
  assert.ok(result.gaps.some(x=>x.id==="unmapped:BREAST-LATE-SHARE"));
});

test("adversarial panel cannot provide DID arithmetic without recognized outcome contract",()=>{
  const absent=reviewCounterfactual({...panel,construct:undefined as unknown as CounterfactualRequest["construct"]});
  const unknown=reviewCounterfactual({...panel,construct:"FAKE_SUCCESS_RATE" as CounterfactualRequest["construct"]});
  assert.equal(absent.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");
  assert.equal(absent.rawDifferenceInDifferences,null);
  assert.equal(unknown.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");
  assert.equal(unknown.rawDifferenceInDifferences,null);
  assert.ok(absent.gaps.some(x=>x.includes("outcome construct")));
});
test("a string 'false' cannot impersonate three completed correction checks",()=>{
  const action=colorectalEvidenceAction().bridge.corrections[0];
  const base:CorrectionReceipt={
    proposedActionId:action.id,deliveryRecordedAt:"2026-11-07T14:00:00Z",
    sourceUrl:"https://example.org/receipts/fake",
    eligibleDenominator:100,completedNumerator:50,
    coreFunctionChecked:true,balancingHarmsReviewed:true,comparisonRecorded:true,
    reviewerIdentity:"Claimed reviewer (not authenticated)"
  };
  const forged=reviewCorrectionReceipt(action,{
    ...base,
    coreFunctionChecked:"false" as unknown as boolean,
    balancingHarmsReviewed:"false" as unknown as boolean,
    comparisonRecorded:"false" as unknown as boolean
  });
  assert.equal(forged.provisionalCompleteness,false);
  assert.equal(forged.problems.length,3);
  assert.equal(forged.claimedOutcomeVerified,false);
});
test("malformed panel array item and wrong data types fail bounded validation",()=>{
  const malformed=reviewCounterfactual({...panel,
    treated:{...panel.treated,observations:[null as unknown as CounterfactualRequest["treated"]["observations"][0],
      ...panel.treated.observations]}});
  assert.equal(malformed.gate,"INSUFFICIENT_FOR_CAUSAL_ESTIMATE");
  assert.ok(malformed.gaps.some(x=>x.includes("invalid observation structure")));
});

test("NCI Colorado 2019-2023 release cannot be silently reconciled with Hinds 2018-2022",()=>{
  const baseline=colorectalEvidenceAction().bridge.measures;
  const candidate={
    id:"co-mismatched-vintage",title:"Colorado late-stage colorectal county NCI release 2019-2023",
    sourceUrl:"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&datatype=01&graph=2&race=00&ruralurban=0&sex=0&sortOrder=asc&sortVariableName=name&stage=211&statefips=08&type=incd",
    condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",
    geography:"Denver County, Colorado",
    populationFrame:"Residents; both sexes, all ages, NCI latest release",
    period:"2019-2023",
    numeratorDefinition:baseline[0].indicator.numeratorDefinition,
    denominatorDefinition:baseline[0].indicator.denominatorDefinition,
    unit:baseline[0].indicator.unit,
    methodVersion:"NCI 2019-2023 release; distinct vintage",
    value:null
  } as const;
  const result=reviewCrossStudyMeasurements([candidate],baseline);
  assert.equal(result.admitted.length,1);
  assert.equal(result.links.length,3);
  assert.ok(result.links.some(x=>x.baselineId==="CRC-LATE-INC"&&x.issues.some(i=>i.includes("Reporting window mismatch"))));
  assert.equal(result.pooledEstimate,null);
  assert.equal(result.originalMethodsVerified,false);
});
