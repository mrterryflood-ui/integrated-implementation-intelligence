import test from "node:test";
import assert from "node:assert/strict";
import {NATIONAL_HEALTH_SOURCE_CONTRACTS,assessComparablePopulations,sourcesForRole,type CohortMeasurement} from "../lib/national-cancer-evidence-fabric";

const cohort: CohortMeasurement={
 condition:"colorectal",metric:"LATE_STAGE_CASE_SHARE",stageDefinition:"NCI summary stage regional+distant",
 periodStart:2018,periodEnd:2022,ageStratum:"all ages",sexStratum:"both sexes",raceEthnicityStratum:"all races/ethnicities",
 ascertainment:"population registry",geography:"Hinds County",sourceId:"nci-scp",
 numeratorDefinition:"incident colorectal diagnoses regional/distant",denominatorDefinition:"all staged incident colorectal diagnoses",
 annualCaseCount:76,rateCI:[57,70],standardPopulation:"none — percentage among incident diagnosed cases"
};
test("same outcome definition across county proxies is descriptively comparable but not causal",()=>{
 const b={...cohort,geography:"Harris County",annualCaseCount:1044,rateCI:[60,66] as const};
 const x=assessComparablePopulations(cohort,b,50);
 assert.equal(x.comparable,true);
 assert.equal(x.precisionWarning,null);
});
test("cross-period, cross-race and incidence/share changes cannot silently mix",()=>{
 assert.equal(assessComparablePopulations(cohort,{...cohort,periodStart:2019,periodEnd:2023}).comparable,false);
 assert.equal(assessComparablePopulations(cohort,{...cohort,raceEthnicityStratum:"Black non-Hispanic"}).comparable,false);
 assert.equal(assessComparablePopulations(cohort,{...cohort,metric:"LATE_STAGE_INCIDENCE"}).comparable,false);
 assert.equal(assessComparablePopulations(cohort,{...cohort,ageStratum:"45–64"}).comparable,false);
});
test("low case counts cannot appear as ranking-ready",()=>{
 const res=assessComparablePopulations({...cohort,annualCaseCount:5},{...cohort,annualCaseCount:15});
 assert.match(res.precisionWarning||"",/low-count/);
});
test("source catalog distinguishes national geography from separate registered SEER data",()=>{
 const uscs=NATIONAL_HEALTH_SOURCE_CONTRACTS.find(x=>x.id==="cdc-uscs")!;
 const seer=NATIONAL_HEALTH_SOURCE_CONTRACTS.find(x=>x.id==="nci-seer-research")!;
 const plus=NATIONAL_HEALTH_SOURCE_CONTRACTS.find(x=>x.id==="nci-seer-plus")!;
 assert.match(uscs.geographicUnit,/Nation, state, county/);
 assert.equal(seer.access,"INDIVIDUAL_REGISTRATION");
 assert.equal(seer.connection,"INDIVIDUAL_AUTHENTICATION_NOT_ESTABLISHED");
 assert.equal(plus.access,"SEPARATE_APPROVAL_REQUIRED");
 assert.match(seer.cannotInfer,/full national coverage/);
 assert.ok(sourcesForRole("ENVIRONMENTAL_EXPOSURE").length>=3);
});
