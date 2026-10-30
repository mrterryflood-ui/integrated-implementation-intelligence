/**
 * Independent real-browser, real-HTTP public DIS acceptance test.
 * This is NOT a test of authenticated private features, scientific validity
 * or real-person stakeholder evidence. It deliberately tests the user journey
 * that a real iPhone visitor reported as broken.
 *
 * Run from apps/dis-platform after installing Playwright browsers:
 *   DIS_E2E_BASE_URL=https://dynamicintel.io node tests/e2e/public-site.mjs
 */
import assert from "node:assert/strict";
import {chromium, webkit, devices} from "playwright";
import {mkdirSync} from "node:fs";
import {join} from "node:path";

const base=(process.env.DIS_E2E_BASE_URL||"https://dynamicintel.io").replace(/\/$/,"");
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-public-browser";
const sites=[
 ["funding-contracts","Funding & contracts"],
 ["research-healthcare","Research & healthcare"],
 ["clinical-health-systems","Healthcare & clinical systems"],
 ["social-health","Social health & whole-person care"],
 ["research-universities","Universities, research & implementation"],
 ["software-technology","Software & technology"],
 ["enterprise-leadership","Enterprise & leadership"],
 ["policy-community","Policy & community"],
 ["everyday-learning","Learning & everyday decisions"]
];
mkdirSync(out,{recursive:true});

async function clickAndObserve(page,locator,description){
 await locator.scrollIntoViewIfNeeded();
 assert.equal(await locator.isVisible(),true,description+" must be visible");
 await locator.click({timeout:12000});
}

async function journey(browserType,label){
 const browser=await browserType.launch({headless:true});
 const profile=label==="webkit-iphone"?devices["iPhone 13"]: {viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true};
 const context=await browser.newContext({...profile,acceptDownloads:true});
 const page=await context.newPage();
 page.setDefaultTimeout(15000);
 const crashes=[];
 const outgoing=[];
 const devIdentityRequests=[];
 page.on("pageerror",e=>crashes.push(e.message));
 page.on("request",request=>{
  if(request.method()==="POST"&&/\/api\/(council|consultation\/research|consultation\/parallax)/.test(request.url()))outgoing.push(request.url());
  if(/https?:\/\/[^/]*\.clerk\.accounts\.dev\//.test(request.url()))devIdentityRequests.push(request.url());
 });
 try {
  for(const [id,name] of sites){
   const url=base+"/?focus="+id+"#consult";
   const res=await page.goto(url,{waitUntil:"domcontentloaded",timeout:40000});
   assert.ok(res && res.status()===200,"GET "+url+" must respond 200");
   const chosen=page.getByRole("region",{name:"Selected focus: "+name});
   await chosen.waitFor({state:"visible"});
   // The root layout must agree with the dynamic page on identity release.
   if(await page.getByText("Private workspace pending").count()>0){
    assert.equal(await page.locator("body").getAttribute("data-dis-identity"),"public-only","root layout must use production release gate");
   }
   const example=chosen.getByRole("button",{name:/Explore example:/}).first();
   await clickAndObserve(page,example,"example from "+name);
   const result=page.getByRole("heading",{name:"Design studio and finished draft package"});
   await result.waitFor({state:"visible",timeout:15000});
   assert.equal(await page.getByRole("tab",{name:"4. Design & deliver"}).getAttribute("aria-selected"),"true");
   assert.equal(await page.getByRole("status").filter({hasText:"editable preliminary package"}).count()>0,true);
   const slides=page.locator("#consult-workflow-panel .slide-list button");
   assert.equal(await slides.count(),12,"local draft has 12 editable slides");
   // No hidden interaction: the new panel is in the viewport after the click.
   // Check the observable mobile result after the browser's layout cycle.
   // A synchronous DOM query immediately after click can precede WebKit paint.
   await page.waitForFunction(()=>{
    const panel=document.querySelector("#consult-workflow-panel");
    if(!panel)return false;
    const r=panel.getBoundingClientRect();
    return r.top>=-5&&r.top<innerHeight-60;
   },null,{timeout:2500,polling:"raf"});
   if(id==="software-technology"){
    await page.screenshot({path:join(out,label+"-software-preview.png"),fullPage:false});
    const download=page.waitForEvent("download",{timeout:12000});
    await clickAndObserve(page,page.getByRole("button",{name:"Export Markdown"}),"Markdown export");
    const received=await download;
    assert.ok(received.suggestedFilename().endsWith(".md"),"Markdown file must actually download");
    await page.getByRole("tab",{name:"1. Consult"}).click();
    await page.locator("#ci-mission").waitFor({state:"visible"});
    const question=await page.locator("#ci-mission").inputValue();
    assert.ok(question.length>8&&question.toLowerCase().includes("platform"),"example must persist in editable question");
    await clickAndObserve(page,page.getByRole("tab",{name:"2. Investigate"}),"Investigate tab");
    const research=page.getByRole("button",{name:"Search live public records"});
    assert.equal(await research.isDisabled(),true,"unreleased research must not pretend it works");
    await clickAndObserve(page,page.getByRole("tab",{name:"3. Council review"}),"Council tab");
    assert.equal(await page.getByRole("button",{name:/Run council review/}).isDisabled(),true,"unreleased council must not pretend it works");
    await clickAndObserve(page,page.getByRole("tab",{name:"1. Consult"}),"Return to consultation");
    await page.locator("#ci-mission").waitFor({state:"visible"});
    await page.locator("#ci-mission").fill("Evaluate and improve a real multi-organization workflow with evidence");
    await clickAndObserve(page,page.getByRole("button",{name:"Build my first draft →"}),"custom question to draft");
    await result.waitFor({state:"visible"});
    await clickAndObserve(page,page.getByRole("button",{name:"New consultation"}),"reset consultation");
    await page.locator("#ci-mission").waitFor({state:"visible"});
    assert.equal(await page.locator("#ci-mission").inputValue(),"","reset clears the prior example");
   }
   console.log("PASS "+label+" "+id+": tap -> real draft -> visible output");
  }
  if(await page.locator("body").getAttribute("data-dis-identity")==="public-only"){
   // Bypassing Clerk's public handshake must NEVER unblock private endpoints.
   for(const route of ["/api/workspaces","/api/capability-fabric","/api/consultation/parallax"]){
    const response=await page.request.get(base+route);
    assert.equal(response.status(),503,route+" must remain fail-closed without production identity");
   }
   const council=await page.request.post(base+"/api/council",{data:{prompt:"Public-only gate test"}});
   assert.equal(council.status(),503,"council execution must remain fail-closed");
  }
  assert.deepEqual(outgoing,[],"offline example must not send prompts to external AI/research services");
  if(devIdentityRequests.length){
   // Only emit origins and paths, never credential-like URL query parameters.
   console.error("DEV CLERK REQUESTS "+label+" "+JSON.stringify(devIdentityRequests.slice(0,5).map(u=>{
    const requestUrl=new URL(u);
    return requestUrl.origin+requestUrl.pathname;
   })));
  }
  assert.deepEqual(devIdentityRequests,[],"public-only production must not initialize a development Clerk tenant in the browser");
  assert.deepEqual(crashes,[],"no unhandled browser page errors");
  const width=await page.evaluate(()=>{
    const root=document.documentElement,client=root.clientWidth,scroll=root.scrollWidth;
    const offenders=[...document.querySelectorAll("body *")].map(el=>{
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {tag:el.tagName,cls:typeof el.className==="string"?el.className.slice(0,90):"",right:Math.round(r.right),left:Math.round(r.left),width:Math.round(r.width),overflowX:cs.overflowX};
    }).filter(x=>x.right>client+3||x.left< -3).slice(0,25);
    return {client,scroll,offenders};
   });
   console.log("MOBILE WIDTH "+label+" "+JSON.stringify(width));
   assert.ok(width.scroll<=width.client+3,"mobile page must not cause horizontal document overflow: "+JSON.stringify(width));
  console.log("PASS "+label+": nine links, visible previews, Markdown, tabs, reset, negative auth checks, no external calls");
 }catch(error){
  const filename=join(out,label+"-failure.png");
  await page.screenshot({path:filename,fullPage:false}).catch(()=>{});
  const contextInfo=await page.evaluate(()=>({url:location.href,title:document.title,ready:document.readyState,
    bodyText:document.body?.innerText.slice(0,1400)||"",rootTags:Array.from(document.querySelectorAll("h1,h2,[role=region]")).slice(0,12).map(n=>n.textContent?.trim().slice(0,85))})).catch(()=>({url:page.url()}));
  console.error("PAGE STATE "+label+" "+JSON.stringify(contextInfo));
  console.error("BROWSER JS ERRORS "+label+" "+JSON.stringify(crashes.slice(0,10)));
  console.error("FAIL "+label+" "+String(error)+"; screenshot: "+filename);
  throw error;
 }finally{await context.close();await browser.close();}
}

let failures=0;
for(const [engine,name] of [[chromium,"chromium-mobile"],[webkit,"webkit-iphone"]]){
 try {await journey(engine,name)}catch(e){failures++;console.error(name+" failed:",e);}
}
if(failures)process.exitCode=1;
