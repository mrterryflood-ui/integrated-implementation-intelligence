import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {mkdirSync} from "node:fs";
import {join} from "node:path";
const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(out,{recursive:true});
for(const [label,engine,device] of [["desktop",chromium,{viewport:{width:1280,height:850}}],["iphone",webkit,devices["iPhone 13"]]]){
 const browser=await engine.launch({headless:true});const context=await browser.newContext(device);const page=await context.newPage();const errors=[],mutations=[];
 page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))mutations.push(r.method()+" "+new URL(r.url()).pathname);});
 try{
  const first=await page.goto(base+"/research-program",{waitUntil:"domcontentloaded",timeout:45000});assert.equal(first?.status(),200);
  await page.getByRole("link",{name:/Open the evidence-to-action bridge/}).click();
  await page.getByRole("heading",{name:/What happens between discovering a difference and correcting it/}).waitFor();
  await page.getByText("30.4 cases per 100,000 annually").waitFor();await page.getByText("63.3 percent").waitFor();await page.getByText("76 average cases per year").waitFor();
  await page.getByText("Safe to pool: no.",{exact:false}).first().waitFor();await page.getByText(/Harris County, Texas/).first().waitFor();
  await page.getByRole("button",{name:"Load existing NCI exercise source"}).click();await page.getByRole("button",{name:"Review cross-study measurements"}).click();
  await page.getByRole("heading",{name:"Source report — not independently verified"}).waitFor();await page.getByText(/Shared original-source lineage/).first().waitFor();await page.getByText(/Pooled estimate: not allowed/).waitFor();
  await page.getByRole("button",{name:"Load synthetic teaching panel"}).click();await page.getByRole("button",{name:"Check counterfactual readiness"}).click();
  await page.getByText(/candidate for independent design review/i).first().waitFor();await page.getByText(/Raw difference in differences: 1.000/i).waitFor();await page.getByText("Causal effect established: no.",{exact:false}).waitFor();
  const panel=page.getByRole("textbox",{name:/Bounded aggregate design JSON/});
  const divergent=JSON.parse(await panel.inputValue());
  [10,12,14].forEach((value,i)=>{divergent.treated.observations[i].value=value;divergent.comparator.observations[i].value=9;});
  await panel.fill(JSON.stringify(divergent));await page.getByRole("button",{name:"Check counterfactual readiness"}).click();
  await page.getByText(/Observed preperiod slopes: treated 2, comparison 0, gap 2/).waitFor();
  await page.getByText(/descriptive diagnostics, not a statistical test or acceptance threshold/).waitFor();
  await panel.fill(JSON.stringify({condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic",interventionYear:null,commonMeasurementVersion:"",treated:{site:"A",populationFrame:"A",observations:[{year:2020,value:1,denominator:10}]},comparator:{site:"B",populationFrame:"B",observations:[{year:2020,value:2,denominator:10}]},comparisonRationale:"",parallelTrendsEvidence:"",competingChangesEvidence:"",spilloverAssessment:"",independentReviewer:""}));
  await page.getByRole("button",{name:"Check counterfactual readiness"}).click();await page.getByText(/insufficient for causal estimate/i).first().waitFor();
  const receipt=page.getByRole("textbox",{name:/Aggregate delivery receipt JSON/});
  await receipt.fill(JSON.stringify({proposedActionId:"WRONG",deliveryRecordedAt:"2026-11-07T14:00:00Z",sourceUrl:"https://example.org",eligibleDenominator:0,completedNumerator:5,coreFunctionChecked:false,balancingHarmsReviewed:false,comparisonRecorded:false,reviewerIdentity:""}));
  await page.getByRole("button",{name:"Audit reported correction"}).click();await page.getByText(/independent external verification required/i).first().waitFor();await page.getByText(/Evidence fields missing or conflicting/i).waitFor();
  // New exercise: an improving average must not erase an adverse group signal.
  await page.getByRole("button",{name:"Stage synthetic subgroup challenge"}).click();
  await page.getByText("subgroup adverse signal",{exact:true}).waitFor();
  await page.getByText("Group B (synthetic): -10.0 pp",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Preview complete investigation record"}).click();
  await page.getByText(/Explicit public-aggregate confirmation is required/).waitFor();
  await page.getByRole("checkbox",{name:/I reviewed this supplement/}).check();
  await page.getByRole("button",{name:"Preview complete investigation record"}).click();
  const archive=page.locator("#private-case-heading").locator("..").locator("pre");
  const snapshot=JSON.parse(await archive.innerText());
  assert.ok(snapshot.gapIDs.includes("synthetic-subgroup-signal"));assert.ok(snapshot.gapLedger.length>6);
  assert.equal(snapshot.investigation.notes[0].origin,"SYNTHETIC");assert.equal(snapshot.independentOutcomeVerified,false);
  const authRequest=page.waitForResponse(r=>r.url().endsWith("/api/workspaces")&&r.request().method()==="GET");
  await page.getByRole("button",{name:"Load my private DIS workspaces"}).click();const authResponse=await authRequest;
  assert.ok([401,503].includes(authResponse.status()),"private workspace must fail closed when unsigned or identity unavailable");
  const denial=await authResponse.json();assert.equal(Array.isArray(denial.workspaces),false,"denial cannot expose private workspaces");
  await page.getByText(/Sign in to use private DIS casework|Private workspace access is unavailable in this environment/).waitFor();
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert.ok(dims.scroll<=dims.client+3,"No horizontal viewport overflow "+JSON.stringify(dims));
  assert.deepEqual(errors,[],"No runtime client errors");assert.deepEqual(mutations,[],"No private save, model or RPLICE execution in this offline exercise");
  await page.screenshot({path:join(out,"evidence-action-"+label+".png"),fullPage:false});
  console.log("PASS evidence-to-action "+label+": source semantics, DID, corrections, equity signal, full-record preview, auth denial");
 }finally{await context.close();await browser.close();}
}
