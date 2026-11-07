import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(out,{recursive:true});
for(const [label,engine,device] of [["desktop",chromium,{viewport:{width:1280,height:850}}],["iphone",webkit,devices["iPhone 13"]]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext(device),page=await context.newPage();
 const errors=[],writes=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.method()+" "+new URL(r.url()).pathname);});
 try{
  const response=await page.goto(base+"/research-program/evidence-action",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200);
  await page.getByRole("button",{name:"Load existing NCI exercise source"}).click();
  const source=page.getByRole("textbox",{name:"Public aggregate measurement records (JSON)"});
  const original=JSON.parse(await source.inputValue())[0];
  await source.fill(JSON.stringify([{...original,value:140,unit:"%"}]));
  await page.getByRole("button",{name:"Review cross-study measurements"}).click();
  await page.getByText(/0 admitted for preliminary comparison; 1 rejected/).waitFor();
  await page.getByText("Rejected source records",{exact:true}).click();
  await page.getByText(/Percent cannot exceed 100/).waitFor();
  await source.fill(JSON.stringify([{...original,value:40},{...original,value:70}]));
  await page.getByRole("button",{name:"Review cross-study measurements"}).click();
  await page.getByText(/0 admitted for preliminary comparison; 2 rejected/).waitFor();
  await source.fill(JSON.stringify([{...original,causalEffectEstablished:true}]));
  await page.getByRole("button",{name:"Review cross-study measurements"}).click();
  await page.getByText(/0 admitted for preliminary comparison; 1 rejected/).waitFor();
  const actionId=await page.getByRole("combobox",{name:"Select a candidate strategy"}).inputValue();
  const receipt=page.getByRole("textbox",{name:/Aggregate delivery receipt JSON/});
  await receipt.fill(JSON.stringify({proposedActionId:actionId,deliveryRecordedAt:"2025-02-30T12:00:00Z",
   sourceUrl:"https://example.org/synthetic-receipt",eligibleDenominator:100,completedNumerator:60,
   coreFunctionChecked:true,balancingHarmsReviewed:true,comparisonRecorded:true,
   reviewerIdentity:"Synthetic declarant, not authenticated"}));
  await page.getByRole("button",{name:"Audit reported correction"}).click();
  await page.getByText(/Delivery time requires a real calendar date and explicit timezone/).waitFor();
  await page.getByText(/Evidence fields missing or conflicting/).waitFor();
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(dims.scroll<=dims.client+3,"No document overflow");
  assert.deepEqual(errors,[],"No client runtime error");assert.deepEqual(writes,[],"No remote writes, model or specialist calls");
  await page.screenshot({path:join(out,"evidence-action-boundaries-"+label+".png"),fullPage:false});
  writeFileSync(join(out,"evidence-action-boundaries-"+label+".json"),JSON.stringify({kind:"SYNTHETIC_BROWSER_INPUT_EXERCISE",revision:process.env.GITHUB_SHA||null,device:label,scenarios:["percent-alias","conflicting-source-identity","forged-trust-field","invalid-delivery-calendar"],clientErrors:errors,mutations:writes,clinicalOutcomeVerified:false},null,2));
  console.log("PASS evidence-action input boundaries "+label+": source identity, scale, trust fields and delivery calendar");
 }finally{await context.close();await browser.close();}
}
