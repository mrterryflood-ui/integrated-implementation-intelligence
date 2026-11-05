/** Research-only Decision Lab acceptance: no source or persona is auto-verified.
 * Runs against the candidate HTTP server already started in DIS browser CI.
 */
import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {mkdirSync} from "node:fs";
import {join} from "node:path";

const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/decision-lab-browser";
mkdirSync(out,{recursive:true});
for(const [engine,label] of [[chromium,"desktop"],[webkit,"iphone"]]){
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext(label==="iphone"?devices["iPhone 13"]:{viewport:{width:1280,height:800}});
  const page=await context.newPage();
  const errors=[],writes=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>{if(r.method()!=="GET" && r.method()!=="HEAD")writes.push(r.method()+" "+r.url());});
  try {
    const response=await page.goto(base+"/decision-lab",{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200);
    await page.getByRole("heading",{name:/See the evidence. Challenge the inference./}).waitFor({state:"visible"});
    await page.getByText("RESEARCH PROTOTYPE — NOT SCIENTIFICALLY VALIDATED").waitFor({state:"visible"});
    const selector=page.getByRole("combobox",{name:"Choose a synthetic research vignette"});
    await selector.selectOption("F02");
    await page.getByText("Sources are not independent confirmations").waitFor({state:"visible"});
    await page.getByText(/1 distinct declared measurement origin/).waitFor({state:"visible"});
    await selector.selectOption("F03");
    await page.getByText("Different constructs cannot be averaged").waitFor({state:"visible"});
    await page.getByText("Units cannot be pooled as stated").waitFor({state:"visible"});
    await selector.selectOption("L05");
    await page.getByText("Original objective needs explicit reconsideration").waitFor({state:"visible"});
    await page.getByRole("button",{name:"Use this example as an editable packet"}).click();
    assert.equal(await selector.inputValue(),"custom");
    await page.getByRole("button",{name:"Show all 8 review lenses"}).click();
    await page.getByText("Measurement scientist").waitFor({state:"visible"});
    await page.getByText("Future steward",{exact:true}).waitFor({state:"visible"});
    const newTime="2026-11-05T09:20:00Z";
    await page.getByRole("textbox",{name:"Decision-as-of time (ISO with Z or offset)"}).fill(newTime);
    await page.getByRole("button",{name:"Add evidence"}).click();
    await page.getByRole("combobox",{name:"Proposed evidence operation"}).selectOption("CORROBORATE");
    await page.getByRole("checkbox",{name:"Claim these sources are independent"}).check();
    assert.equal(await page.getByText(/scientific validation not established/i).count()>0,true);
    await page.screenshot({path:join(out,"research-decision-lab-"+label+".png"),fullPage:false});
    const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(widths.scroll<=widths.client+3,"no mobile horizontal overflow: "+JSON.stringify(widths));
    assert.deepEqual(errors,[],"no unhandled browser errors");
    assert.deepEqual(writes,[],"the research route must not send mutations");
    console.log("PASS decision lab "+label+": route, three falsification cases, editable source, perspectives, no network mutations");
  } finally {await context.close();await browser.close();}
}
