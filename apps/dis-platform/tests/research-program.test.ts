import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram,type ResearchProgramSpec} from "../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase,JACKSON_CANCER_INDICATORS} from "../lib/jackson-cancer-case";

const codes=(site:Parameters<typeof jacksonCancerCase>[0])=>buildResearchProgram(jacksonCancerCase(site)).issues.map(x=>x.code);

test("Jackson study is geographically precise: Hinds County baseline is not Jackson city or coastal Jackson County",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  assert.equal(p.population.targetName,"Jackson, Mississippi");
  assert.equal(p.population.proxyUnit,"Hinds County, MS");
  assert.equal(p.population.proxyFips,"28049");
  assert.equal(p.population.equivalence,"NOT_ESTABLISHED");
  assert.equal(p.claimsOfCityData,false);
  assert.ok(p.issues.some(x=>x.code==="GEOGRAPHY_PROXY_NOT_CITY"&&x.severity==="BLOCK_PROGRAM_CLAIM"));
  assert.ok(p.indicators.every(x=>x.geography==="Hinds County, MS"));
  assert.ok(p.indicators.every(x=>x.period.includes("2018–2022")));
  assert.ok(p.interpretationGuardrails.some(x=>x.includes("Jackson city")));
});
test("published historical late-stage colorectal indicators preserve three different measurement denominators",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  const by=Object.fromEntries(p.indicators.map(x=>[x.id,x]));
  assert.equal(by["CRC-LATE-INC"].value,30.4);
  assert.deepEqual(by["CRC-LATE-INC"].confidenceInterval,[27.3,33.8]);
  assert.equal(by["CRC-LATE-SHARE"].value,63.3);
  assert.equal(by["CRC-LATE-COUNT"].value,76);
  assert.match(by["CRC-LATE-INC"].denominatorDefinition,/resident population/);
  assert.match(by["CRC-LATE-SHARE"].denominatorDefinition,/incident colorectal cancers/);
  assert.match(by["CRC-LATE-COUNT"].denominatorDefinition,/annualized/);
  assert.equal(new Set(p.indicators.map(x=>x.sourceUrl)).size,1);
});
test("female breast baselines cannot masquerade as an all-person or colorectal statistic",()=>{
  const p=buildResearchProgram(jacksonCancerCase("breast"));
  const by=Object.fromEntries(p.indicators.map(x=>[x.id,x]));
  assert.equal(by["BREAST-LATE-INC"].value,53.2);
  assert.deepEqual(by["BREAST-LATE-INC"].confidenceInterval,[47.7,59.1]);
  assert.equal(by["BREAST-LATE-SHARE"].value,37.7);
  assert.equal(by["BREAST-LATE-COUNT"].value,74);
  assert.ok(p.indicators.every(x=>x.site==="breast"));
  assert.match(by["BREAST-LATE-INC"].denominatorDefinition,/female/);
  assert.equal(p.localCausalEffectsEstablished,false);
});
test("multiple cancer sites are retained separately, with an explicit no-pooled-stage-rate gate",()=>{
  const p=buildResearchProgram(jacksonCancerCase("general"));
  assert.equal(p.indicators.length,6);
  assert.equal(new Set(p.indicators.map(x=>x.site)).size,2);
  assert.ok(p.issues.some(x=>x.code==="NO_UNIVERSAL_STAGE_RATE"));
  assert.ok(p.interpretationGuardrails.some(x=>x.includes("never pool")));
  assert.equal(p.individualDataProcessed,false);
});
test("population segmentation shows missing race/age/geography/insurance/access data without inventing disparity rankings",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  const by=Object.fromEntries(p.strata.map(x=>[x.id,x]));
  for(const id of ["AGE","RACE","GEO","PAYER","ACCESS","JOURNEY"])assert.notEqual(by[id].availability,"MEASURED_IN_CASE_BASELINE");
  assert.equal(by["JOURNEY"].availability,"REQUIRES_AUTHORIZED_DATA");
  assert.ok(p.issues.some(x=>x.code==="SUBGROUP_RATES_UNVERIFIED"));
  assert.equal("racialRiskScore" in p,false);
  assert.equal("highRiskGroup" in p,false);
});
test("all contextual driver narratives remain hypotheses, with observable disconfirming tests and alternatives",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  assert.ok(p.drivers.length>=6);
  for(const d of p.drivers){
    assert.equal(d.evidenceState,"NOT_LOCALLY_TESTED");
    assert.ok(d.discriminatingTest.length>30);
    assert.ok(d.competingExplanation.length>30);
    assert.ok(d.instrumentOrDataNeeded.length>25);
  }
  assert.ok(p.issues.some(x=>x.code==="DRIVERS_ARE_HYPOTHESES"));
});
test("an evidence-based screening strategy is not promoted to proven local stage-shift efficacy",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  assert.ok(p.strategies.some(s=>s.name==="Patient navigation"));
  for(const s of p.strategies){
    assert.equal(s.localEffect,"NOT_ESTABLISHED");
    assert.ok(s.sourceUrl.startsWith("https://"));
    assert.ok(s.potentialHarm.length>15);
  }
  assert.ok(p.issues.some(x=>x.code==="SCREENING_EVIDENCE_NOT_STAGE_EFFECT"));
  assert.equal(p.interventionAuthorized,false);
});
test("screening and diagnostic resolution use distinct denominators and no universal eligibility rule",()=>{
  const p=buildResearchProgram(jacksonCancerCase("breast"));
  const screening=p.pathway.find(x=>x.stage==="Screening completed")!;
  const follow=p.pathway.find(x=>x.stage==="Diagnostic assessment resolved")!;
  assert.match(screening.denominator,/eligible individuals due/i);
  assert.match(follow.denominator,/abnormal results/i);
  assert.notEqual(screening.denominator,follow.denominator);
  assert.ok(p.successMeasures.some(x=>x.role==="PRIMARY_DISTAL"&&/lagged registry/.test(x.definition)));
  assert.ok(p.successMeasures.some(x=>x.role==="SAFETY_BALANCE"));
});
test("custom geographic questions receive a transferable framework, never convenient invented statistics",()=>{
  const p=buildResearchProgram(unsourcedResearchCase("How can we reduce missed public services?","Another City"));
  assert.equal(p.question,"How can we reduce missed public services?");
  assert.equal(p.indicators.length,0);
  assert.equal(p.dataSources.length,0);
  assert.equal(p.population.targetName,"Another City");
  assert.equal(p.claimsOfCityData,false);
  assert.equal(p.status,"RESEARCH_DESIGN_NOT_FIELD_VALIDATED");
  assert.ok(p.issues.some(x=>x.code==="NO_MEASURED_BASELINE"));
  assert.ok(p.issues.some(x=>x.code==="OFFICIAL_SOURCE_MISSING"));
});
test("known values outside source geography or impossible percent must block claims",()=>{
  const x:ResearchProgramSpec=jacksonCancerCase("colorectal");
  x.indicators[0]={...x.indicators[0],geography:"Jackson County, MS"};
  x.indicators[1]={...x.indicators[1],value:115};
  const p=buildResearchProgram(x);
  assert.ok(p.issues.some(x=>x.code==="UNMATCHED_INDICATOR_GEOGRAPHY"));
  assert.ok(p.issues.some(x=>x.code==="INVALID_PERCENT"));
});
test("unknown or suppressed measurements must not be silently interpreted as zero",()=>{
  const x=jacksonCancerCase("breast");
  x.indicators[0]={...x.indicators[0],value:null,evidenceState:"NOT_OBSERVED"};
  const p=buildResearchProgram(x);
  assert.equal(p.indicators[0].value,null);
  assert.ok(p.issues.some(x=>x.code==="SUPPRESSED_OR_UNKNOWN_CELL"));
});
test("research program is public, source-aware, and never a health record or clinical decision engine",()=>{
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  assert.equal(p.individualDataProcessed,false);
  assert.equal(p.interventionAuthorized,false);
  assert.equal(p.localCausalEffectsEstablished,false);
  assert.equal(p.sourceReviewStatus,"CURATED_PUBLIC_REFERENCES_NOT_LIVE_DATA_PIPELINE");
  assert.equal(p.dataSources.find(x=>x.id==="local-protected")?.connection,"AUTHORIZED_EXCHANGE_NOT_CONNECTED");
  assert.ok(p.interpretationGuardrails.some(x=>x.includes("PLACES")));
  assert.ok(p.interpretationGuardrails.some(x=>x.includes("privacy")||x.includes("suppression")));
});
test("true exposure is the actual Council research and home routes, with zero network calls in client program",()=>{
  const page=readFileSync("app/research-program/page.tsx","utf8");
  const home=readFileSync("app/page.tsx","utf8");
  const research=readFileSync("app/consultation-studio.tsx","utf8");
  assert.match(page,/buildResearchProgram\(caseSpec\)/);
  assert.match(page,/Historical aggregate only/);
  assert.match(page,/What could explain late diagnosis/);
  assert.match(page,/Copy research and implementation brief/);
  assert.match(home,/href="\/research-program"/);
  assert.match(research,/Open the DIS Research-to-Implementation Studio/);
  assert.doesNotMatch(page,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|navigator.sendBeacon/);
});
test("source catalogue retains original public authority and historical reporting windows",()=>{
  assert.equal(JACKSON_CANCER_INDICATORS.length,6);
  const p=buildResearchProgram(jacksonCancerCase("colorectal"));
  assert.ok(p.dataSources.some(s=>s.id==="cdc-places"&&s.kind==="MODELED_ESTIMATE"&&s.prohibitedUse.includes("effect")));
  assert.ok(p.dataSources.some(s=>s.id==="hrsa-uds"&&s.granularity.includes("State")));
  assert.ok(p.dataSources.every(s=>s.url.startsWith("https://")));
  assert.ok(p.dataSources.every(s=>s.connection==="CURATED_REFERENCE_ONLY"||s.connection==="AUTHORIZED_EXCHANGE_NOT_CONNECTED"));
  assert.ok(p.interpretationGuardrails.some(x=>x.toLowerCase().includes("site")));
});
