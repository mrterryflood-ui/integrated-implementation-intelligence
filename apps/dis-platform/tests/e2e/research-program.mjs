import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {mkdirSync} from "node:fs";
import {join} from "node:path";

const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(out,{recursive:true});
for(const [label,engine,device] of [
  ["desktop",chromium,{viewport:{width:1280,height:850}}],
  ["iphone",webkit,devices["iPhone 13"]]
]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext(device);
 const page=await context.newPage();
 const errors=[],writes=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(r.method()!=="GET"&&r.method()!=="HEAD")writes.push(r.method()+" "+new URL(r.url()).pathname)});
 try{
  const response=await page.goto(base+"/research-program",{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200);
  await page.getByRole("heading",{name:/Understand the population. Investigate the causes./}).waitFor();
  await page.getByText("Research-stage program · Public aggregate evidence only.",{exact:false}).waitFor();
  await page.getByText("Hinds County only",{exact:true}).waitFor();
  // The program must begin at STELLAR 1, not a preselected intervention.
  await page.getByRole("heading",{name:/STELLAR 1 — begin with the question/}).waitFor();
  await page.getByRole("textbox",{name:"For how long?"}).fill("Baseline period, pilot, after-success and successor reassessment");
  await page.getByRole("textbox",{name:"Compared with what?"}).fill("Competent current diagnostic and screening pathways");
  await page.getByRole("textbox",{name:"System or stakeholder name"}).fill("Hypothetical referral clinic");
  await page.getByRole("button",{name:"Add candidate element"}).click();
  await page.getByText("Hypothetical referral clinic").last().waitFor();
  await page.getByRole("combobox",{name:"To"}).selectOption("S1");
  await page.getByRole("button",{name:"Add unverified relationship"}).click();
  await page.getByText("not independently established",{exact:true}).first().waitFor();
  await page.getByRole("button",{name:"Population and measures"}).click();
  const site=page.getByRole("combobox",{name:"Cancer site / analysis"});
  await page.getByText("30.4",{exact:true}).waitFor();
  await page.getByText("63.3",{exact:true}).waitFor();
  await site.selectOption("breast");
  await page.getByText("53.2",{exact:true}).waitFor();
  await page.getByText("37.7",{exact:true}).waitFor();
  assert.equal(await page.getByText("63.3",{exact:true}).count(),0,"CRC percentage does not contaminate female breast");
  await site.selectOption("general");
  await page.getByText("53.2",{exact:true}).waitFor();
  await page.getByText("30.4",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Competing explanations"}).click();
  await page.getByText("What could explain late diagnosis—and what would distinguish the explanations?").waitFor();
  await page.getByText("Abnormal-result follow-up and diagnostic closure").waitFor();
  await page.getByRole("button",{name:"Implementation pathway"}).click();
  await page.getByText("Screening completed",{exact:true}).waitFor();
  await page.getByText("Diagnostic assessment resolved",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Evaluate and adapt"}).click();
  await page.getByText(/The published county proxy is not a validated estimate/).waitFor();
  await page.getByRole("button",{name:"Sources and limits"}).click();
  await page.getByText("CDC PLACES 2025 screening estimates").waitFor();
  await page.getByRole("button",{name:"Full DIS lifecycle"}).click();
  await page.getByRole("heading",{name:/Stage-gated research, implementation/}).waitFor();
  await page.getByText("20",{exact:true}).first().waitFor();
  await page.getByRole("combobox",{name:"Rehearse a possible result (not a recorded outcome)"}).selectOption("SUCCESS");
  await page.getByText(/What happens tomorrow when demand/i).first().waitFor();

  await page.getByRole("combobox",{name:"Rehearse a possible result (not a recorded outcome)"}).selectOption("FAILURE");
  await page.getByText(/Did the intervention fail to reach people/i).first().waitFor();
  await page.getByRole("button",{name:"Transfer to Houston"}).click();
  await page.getByText(/hold pending local adaptation and validation/i).waitFor();
  const project=page.getByRole("combobox",{name:"Research scenario"});
  await project.selectOption("custom");
  await page.getByRole("textbox",{name:"Your research/implementation question"}).fill("How can a city improve access to public services?");
  await page.getByRole("textbox",{name:"Target population or geographic frame"}).fill("Synthetic City");
  await page.getByRole("button",{name:"Population and measures"}).click();
  await page.getByText(/No verified observed population values have been supplied/).waitFor();
  await page.getByText("Synthetic City",{exact:true}).first().waitFor();
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(dims.scroll<=dims.client+3,"no horizontal document overflow: "+JSON.stringify(dims));
  assert.deepEqual(errors,[],"no unexpected runtime client errors");
  assert.deepEqual(writes,[],"no external mutations or model calls from local research studio");
  await page.screenshot({path:join(out,"research-program-"+label+".png"),fullPage:false});
  console.log("PASS DIS research-to-implementation "+label+": sourced cancer splits, drivers, evaluation, custom unknowns, no network mutations");
 }finally{await context.close();await browser.close();}
}
