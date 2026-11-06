import test from "node:test";
import assert from "node:assert/strict";
import {NATIONAL_THREE_CANCER_ROWS,nationalStateRows,pearsonNationalCancerCorrelation,nationalThreeCancerReference} from "../lib/national-three-cancer-reference";
test("all 50 states are present in the three-cancer national published reference",()=>{
 assert.equal(NATIONAL_THREE_CANCER_ROWS.length,53);
 assert.equal(nationalStateRows().length,50);
 assert.equal(new Set(NATIONAL_THREE_CANCER_ROWS.map(x=>x.geography)).size,53);
 const ms=NATIONAL_THREE_CANCER_ROWS.find(x=>x.geography==="Mississippi")!;
 assert.equal(ms.lung.lateStageIncidencePer100k,44.2);
 assert.equal(ms.breast.lateStageSharePercent,35.1);
});
test("national 3-cancer correlation preserves rate-versus-share distinction",()=>{
 const rate=pearsonNationalCancerCorrelation("colorectal","lung","lateStageIncidencePer100k");
 const share=pearsonNationalCancerCorrelation("colorectal","lung","lateStageSharePercent");
 assert.ok(Math.abs(rate-0.73451)<0.0001);
 assert.ok(Math.abs(share-0.12875)<0.0001);
 const source=nationalThreeCancerReference();
 assert.equal(source.states,50);
 assert.match(source.measurementLimits.join(" "),/not estimates of causal effects/i);
 assert.ok(source.sourceUrls.breast.includes("cancer=055"));
});