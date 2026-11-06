import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {CURATED_COUNTIES,DISEASES,COMPARATOR_MIN_ANNUAL,comparisonCohort,findSimilarStageShares,evidenceGate,SOURCE_LINKS} from "../lib/population-health-atlas";

test("cancer county observations use consistent window and distinguish denominators",()=>{
 assert.ok(CURATED_COUNTIES.length>=12);
 const ids=CURATED_COUNTIES.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(CURATED_COUNTIES.every(x=>x.countyFips.length===5&&x.referencePeriod==="2018–2022"&&x.unit.includes("per 100,000")&&x.evidenceGrade==="OBSERVED_REGISTRY_AGGREGATE"));
 assert.ok(CURATED_COUNTIES.every(x=>x.ciLow!==null&&x.ciHigh!==null&&x.ciLow<=x.value&&x.value<=x.ciHigh));
 assert.ok(CURATED_COUNTIES.every(x=>x.sourceUrl.includes("statefips=")&&x.sourceUrl.includes("stage=211")));
 assert.ok(CURATED_COUNTIES.every(x=>x.denominator.includes("all newly diagnosed")));
});
test("comparison sample minimum excludes small counties, keeping separately labeled sentinel",()=>{
 assert.equal(COMPARATOR_MIN_ANNUAL,100);
 const cohort=comparisonCohort();
 assert.ok(cohort.every(x=>(x.averageAnnualCount||0)>=100));
 assert.equal(cohort.some(x=>x.id==="hinds"),false);
 assert.equal(CURATED_COUNTIES.find(x=>x.id==="hinds")?.averageAnnualCount,76);
});
test("same late-stage percentage can coexist with materially divergent incidence",()=>{
 const hinds=CURATED_COUNTIES.find(x=>x.id==="hinds")!;
 const matches=findSimilarStageShares(hinds);
 const harris=matches.find(x=>x.county.id==="harris")!;
 assert.ok(harris);assert.ok(harris.shareDifferencePP<=.11);
 assert.ok(harris.rateDifferencePercent<-20);
 assert.equal(harris.nonoverlappingRateCIs,true);
 assert.match(harris.interpretation,/not statistical equivalence/);
 assert.ok(matches.some(x=>x.county.id==="gwinnett"));
});
test("absence of disease-specific observations remains explicit, not imputed from colorectal",()=>{
 assert.equal(evidenceGate("colorectal","incident-late-stage").status,"READY_TO_COMPARE");
 assert.equal(evidenceGate("colorectal","incident-disease").status,"NO_VALID_OBSERVATIONS");
 assert.equal(evidenceGate("lung","incident-late-stage").status,"NO_VALID_OBSERVATIONS");
 assert.equal(DISEASES.find(x=>x.id==="lung")?.observedCountyData,false);
});
test("ECHO is environmental compliance context, not a cancer exposure inference",()=>{
 const echo=SOURCE_LINKS.find(x=>x.id==="epa-echo");
 assert.equal(echo?.grade,"DESCRIPTIVE_CONTEXT");
 assert.equal(echo?.status,"PUBLIC_MAP_OVERLAY_OPTIONAL");
 const src=readFileSync(join(process.cwd(),"app","population-health-atlas","atlas-client.tsx"),"utf8");
 assert.match(src,/proximity does not equal exposure or cause/i);
 assert.match(src,/DIS Research Program/);
 assert.ok(!src.includes("apiKey="));
});
