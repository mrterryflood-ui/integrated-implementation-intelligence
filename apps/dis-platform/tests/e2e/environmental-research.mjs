import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {mkdirSync,readFileSync} from "node:fs";
import {join} from "node:path";

const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(out,{recursive:true});
for(const [label,engine,device] of [
  ["desktop",chromium,{viewport:{width:1280,height:850}}],
  ["iphone",webkit,devices["iPhone 13"]]
]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...device,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],mutations=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))mutations.push(r.method()+" "+new URL(r.url()).pathname);});
  try{
    const first=await page.goto(base+"/research-program/environmental",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(first?.status(),200);
    await page.getByRole("heading",{name:"Build the research case and test what changes."}).waitFor();
    await page.getByText(/0 observed local baseline measurements supplied/).waitFor();
    assert.equal(await page.getByRole("button",{name:"Run selected method"}).isDisabled(),true);
    await page.getByRole("button",{name:"Load synthetic example"}).click();
    await page.getByRole("button",{name:"Check replay evidence"}).click();
    await page.getByText("EVIDENCE_REVIEW_REQUIRED",{exact:true}).waitFor();
    await page.getByText(/Observed records: 0; modeled or synthetic records: 1/).waitFor();
    await page.getByRole("textbox",{name:"Owner-designated PI"}).fill("Synthetic owner");
    await page.getByRole("textbox",{name:"Prospective organization"}).fill("Synthetic candidate");
    await page.getByRole("textbox",{name:"Proposed role"}).fill("Evaluate a proposed local research role");
    await page.getByRole("button",{name:"Add prospective collaborator"}).click();
    const event=page.waitForEvent("download");
    await page.getByRole("button",{name:"Export research packet"}).click();
    const download=await event;
    const packet=JSON.parse(readFileSync(await download.path(),"utf8"));
    assert.equal(packet.studyResults,"NOT_COLLECTED");
    assert.equal(packet.externalSubmissionAuthorized,false);
    assert.equal(packet.externalCommitments,false);
    assert.equal(packet.partners[0].state,"PROSPECTIVE");
    assert.equal(packet.replayEvidence.input.records[0].kind,"SYNTHETIC");
    assert.equal(packet.replayEvidence.review.waterSafe,null);
    assert.equal(packet.specialistAnalysis.state,"NOT_EXECUTED");
    await page.getByRole("textbox",{name:"Replay JSON"}).fill("{}");
    await page.getByRole("button",{name:"Check replay evidence"}).click();
    await page.getByRole("status").filter({hasText:/Decision timestamp/}).waitFor();
    assert.equal(await page.getByText("EVIDENCE_REVIEW_REQUIRED",{exact:true}).count(),0,"Invalid input clears earlier review");
    await page.getByRole("button",{name:"NOAA hazard decisions"}).click();
    await page.getByRole("heading",{name:"Source-linked AI for flood decisions across fragmented local hazard systems"}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Remove Synthetic candidate"}).count(),0,"Candidate organizations cannot leak across studies");
    await page.getByText(/\$480,000/).waitFor();
    assert.equal(await page.getByRole("button",{name:"Run selected method"}).isDisabled(),true);
    const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
    assert.ok(dims.scroll<=dims.client+3,"No horizontal viewport overflow "+JSON.stringify(dims));
    assert.deepEqual(errors,[],"No browser runtime errors");
    assert.deepEqual(mutations,[],"Offline preparation cannot execute a model, database write or external submission");
    await page.screenshot({path:join(out,"environmental-research-"+label+".png"),fullPage:false});
    console.log("PASS environmental research "+label+": protocols, synthetic replay, bounded export, study isolation and no implicit execution");
  }finally{await context.close();await browser.close();}
}
