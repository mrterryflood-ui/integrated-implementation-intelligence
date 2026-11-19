/** Real Chromium + iPhone WebKit candidate UI test; mocked AI reply is SYNTHETIC
 * and never establishes live model, human translation quality, or authenticated access.
 * The same exact candidate also proves anonymous private API denial without mocks.
 */
import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {readFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
const base=(process.env.DIS_E2E_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const dest=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(dest,{recursive:true});
for(const [browserType,label] of [[chromium,"chromium-desktop"],[webkit,"webkit-iphone"]]){
 const browser=await browserType.launch({headless:true});
 const context=await browser.newContext(label.includes("iphone")?{...devices["iPhone 13"],acceptDownloads:true}:{viewport:{width:1280,height:800},acceptDownloads:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on("pageerror",e=>errors.push(e.message));
 try{
  // A public-only production configuration cannot be tricked into calling the private model.
  const gate=await context.request.post(base+"/api/perspective-translation",{headers:{origin:base},data:{from:"Reader",to:"Neighbor",source:"Synthetic public test statement repeated.",depth:"Simple",direction:"One-way",consent:true}});
  assert.equal(gate.status(),503,"private model must deny public-only production identity");
  await page.route("**/api/perspective-translation",async route=>{
   const body=JSON.parse(route.request().postData()||"{}");requests.push(body);
   await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
    state:"DRAFT_REVIEW_REQUIRED",output:"SYNTHETIC FIXTURE OUTPUT — the date is 19 November 2026. No independent review.",
    acceptedSettings:{from:body.from,to:body.to,objective:body.objective,language:body.language,depth:body.depth,direction:body.direction,experience:body.experience||"",priorities:body.priorities||"",audienceStatements:body.audienceStatements||"",unknowns:body.unknowns||""},
    sourceSha256:"a".repeat(64),generatedAt:"2026-11-19T10:20:00.000Z",model:"synthetic-fixture",verified:false
   })});
  });
  const landing=await page.goto(base+"/#perspectives",{waitUntil:"domcontentloaded",timeout:40000});assert.equal(landing?.status(),200);
  const studio=page.locator("#perspectives");
  await studio.getByRole("textbox",{name:"Your role or perspective"}).fill("Custom neighborhood volunteer");
  await studio.getByRole("textbox",{name:"Receiving audience or perspective"}).fill("Custom municipal analyst");
  await studio.getByRole("button",{name:"Research",exact:true}).click();
  await studio.getByRole("combobox",{name:"Communication direction"}).selectOption("Bidirectional");
  await studio.getByRole("textbox",{name:"Output language"}).fill("Japanese");
  await studio.getByRole("textbox",{name:"What is the purpose?"}).fill("Clarify a synthetic disagreement");
  await studio.getByText("Make the explanation faithful to your lived experience and perspective (optional)").click();
  await studio.getByRole("textbox",{name:"Your experience or direct observations"}).fill("I saw the fictional bus leave early.");
  await studio.getByRole("textbox",{name:"What matters to you / constraints"}).fill("Keep the original schedule explanation accurate.");
  await studio.getByRole("textbox",{name:"What the receiving person actually said (if known)"}).fill("The transport manager wrote: 'The schedule is not final.'");
  await studio.getByRole("textbox",{name:"Unanswered questions or disagreements"}).fill("Unknown who approved the change.");
  const box=studio.getByRole("textbox",{name:"Your source text or report excerpt"});
  await box.fill("Fictional transit delay occurred on 19 November 2026.");
  await studio.getByRole("button",{name:"Translate perspectives"}).click();
  assert.equal(requests.length,0,"no model traffic without explicit consent");
  await studio.getByRole("checkbox",{name:/approve sending it to the configured AI service/}).check();
  await studio.getByRole("button",{name:"Translate perspectives"}).click();
  await studio.getByRole("heading",{name:"Reviewable communication draft"}).waitFor();
  const exportButton=studio.getByRole("button",{name:"Export text"});
  assert.equal(await exportButton.isEnabled(),true);
  const got=page.waitForEvent("download");await exportButton.click();
  const text=readFileSync(await (await got).path(),"utf8");
  assert.match(text,/Audience: Custom municipal analyst/);assert.match(text,/Language: Japanese/);
  assert.match(text,/Depth: Research/);assert.match(text,/Reported firsthand experience: I saw the fictional bus leave early/);assert.match(text,/Attributed recipient statements: The transport manager wrote/);assert.match(text,/Source SHA-256: a{64}/);
  await studio.getByRole("textbox",{name:"What the receiving person actually said (if known)"}).fill("Updated actual quote.");
  assert.equal(await exportButton.isDisabled(),true,"changing a reported statement must block stale export");
  await studio.getByRole("textbox",{name:"What the receiving person actually said (if known)"}).fill("The transport manager wrote: 'The schedule is not final.'");
  await studio.getByRole("textbox",{name:"Receiving audience or perspective"}).fill("Different recipient");
  assert.equal(await exportButton.isDisabled(),true,"changing audience must block stale export");
  await studio.getByRole("alert").filter({hasText:/settings changed/}).waitFor();
  await studio.getByRole("textbox",{name:"Receiving audience or perspective"}).fill("Custom municipal analyst");
  await studio.getByRole("textbox",{name:"Output language"}).fill("Spanish");
  assert.equal(await exportButton.isDisabled(),true,"changing language must block stale export");
  await studio.getByRole("textbox",{name:"Output language"}).fill("Japanese");
  await box.fill("漢".repeat(9000));
  assert.equal(await exportButton.isDisabled(),true,"source changes must block stale export");
  assert.equal(await studio.getByRole("checkbox",{name:/approve sending it to the configured AI service/}).isChecked(),false,"new source revokes earlier consent");
  await studio.getByRole("checkbox",{name:/approve sending it to the configured AI service/}).check();
  await studio.getByRole("button",{name:"Translate perspectives"}).click();
  await page.waitForFunction(()=>document.querySelector("#perspectives .perspective-output p")?.textContent?.includes("Settings match"));
  assert.equal(requests.length,2);
  assert.equal(requests[1].source.length,9000);
  assert.ok(Buffer.byteLength(JSON.stringify(requests[1]),"utf8")>26000,"legacy 26k cap would reject valid Japanese input");
  assert.equal(await exportButton.isEnabled(),true);
  await studio.getByRole("button",{name:/Swap perspectives/}).click();
  assert.equal(await exportButton.isDisabled(),true);
  const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(width.scroll<=width.client+3,"perspective UI must fit viewport: "+JSON.stringify(width));
  assert.deepEqual(errors,[],"no browser page errors");
  await studio.screenshot({path:join(dest,"perspective-"+label+".png")});
  console.log("PASS "+label+" generation snapshot, 9k Japanese, consent, stale export, swap, viewport; no real AI");
 }finally{await context.close();await browser.close();}
}
