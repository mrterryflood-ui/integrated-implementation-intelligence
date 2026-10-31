import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const base=(process.env.DIS_E2E_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/dis-candidate-browser';mkdirSync(out,{recursive:true});
const receipts=[];
for(const [name,engine]of [['chromium',chromium],['iphone-webkit',webkit]]){
 const browser=await engine.launch({headless:true});let context,page;
 const pendingRequests=new Set(),errors=[],unexpectedInvocations=[];
 try{
  context=await browser.newContext(name==='iphone-webkit'?devices['iPhone 13']:{viewport:{width:1280,height:900}});page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{pendingRequests.add(r.url());if(r.method()==='POST'&&/\/api\/(capability-fabric|council|consultation\/(research|parallax))/.test(r.url()))unexpectedInvocations.push(new URL(r.url()).pathname);});
  page.on('requestfinished',r=>pendingRequests.delete(r.url()));page.on('requestfailed',r=>pendingRequests.delete(r.url()));
  // Readiness is the visible usable journey, not global network silence.
  // The previous CI run completed 18 public journeys then timed out on networkidle here.
  const navigation=await page.goto(base+'/#consult',{waitUntil:'domcontentloaded',timeout:30000});assert.equal(navigation?.status(),200);
  const mission=page.locator('#ci-mission');await mission.waitFor({state:'visible'});
  await mission.fill('Assess community impact, CEDS alignment and economic development funding.');
  const panel=page.getByRole('region',{name:'Coordinate the ecosystem'});await panel.waitFor({state:'visible'});
  await panel.getByLabel('Public place name').fill('Manor');
  await panel.getByLabel('State FIPS',{exact:true}).fill('48');
  await panel.getByLabel('County FIPS for regional context').fill('48453');
  const pending=page.waitForResponse(r=>r.url().endsWith('/api/mcp')&&r.request().method()==='POST');
  await panel.getByRole('button',{name:'Show the capability plan'}).click();
  const response=await pending,body=await response.json();
  assert.equal(response.status(),200);const plan=JSON.parse(body.result.content[0].text);
  assert.equal(plan.state,'PLAN_ONLY');assert.equal(plan.networkRequests,0);assert.equal(plan.question,null);
  for(const id of ['community','civic','funding','business','research'])assert.ok(plan.selected.some(c=>c.platformId===id),id+' coverage');
  await panel.getByText('Funding and readiness intelligence',{exact:true}).waitFor({state:'visible'});
  assert.equal(await panel.getByRole('button',{name:'Retrieve evidence and update the package'}).isEnabled(),false);
  await panel.getByRole('checkbox').check();
  assert.equal(await panel.getByRole('button',{name:'Retrieve evidence and update the package'}).isEnabled(),false);
  await panel.getByLabel('Public place name').fill('Hutto');
  await page.waitForFunction(()=>!document.querySelector('[aria-label="Coordinate the ecosystem"] input[type="checkbox"]')?.checked);
  assert.equal(await panel.getByRole('checkbox').isChecked(),false);
  const protectedCall=await context.request.post(base+'/api/capability-fabric',{data:{mode:'ecosystem-invoke',engagement:{problem:'Assess community impact',geography:{kind:'city',label:'Manor',stateFips:'48',countyFips:'48453'},externalConsent:true}}});
  assert.ok([401,503].includes(protectedCall.status()),'private execution remains gated');
  const untrusted=await context.request.post(base+'/api/mcp',{data:{jsonrpc:'2.0',id:9,method:'tools/call',params:{name:'dis_ecosystem_plan',arguments:{problem:'Assess community impact',token:'not-accepted'}}}});
  assert.ok((await untrusted.json()).error);assert.deepEqual(unexpectedInvocations,[]);assert.deepEqual(errors,[]);
  await panel.getByRole('heading',{name:'Bring the right capabilities together'}).scrollIntoViewIfNeeded();
  const pageDimensions=await page.evaluate(()=>({documentHeight:document.documentElement.scrollHeight,documentWidth:document.documentElement.scrollWidth,viewportHeight:innerHeight,viewportWidth:innerWidth}));
  // This long-form studio can exceed browser full-page image limits. Capture
  // the tested panel's viewport without changing any functional assertions.
  await page.screenshot({path:join(out,'ecosystem-'+name+'.png'),fullPage:false});
  receipts.push({engine:name,sourceRevision:process.env.GITHUB_SHA||'local-working-tree',state:'PUBLIC_PLANNING_AND_IDENTITY_DENIAL_PASSED',privateSignedInAcceptance:false,partnerRoundTrip:false,observedAt:new Date().toISOString(),checks:11,screenshotScope:'tested-panel-viewport',pageDimensions});
 }catch(error){receipts.push({engine:name,state:'FAILED',error:error instanceof Error?error.message:String(error),pageErrors:errors,pendingRequests:[...pendingRequests].map(u=>{const v=new URL(u);return v.origin+v.pathname}),observedAt:new Date().toISOString()});await page?.screenshot({path:join(out,'ecosystem-'+name+'-failure.png'),fullPage:false}).catch(()=>{});throw error;}
 finally{writeFileSync(join(out,'ecosystem-planning-receipts.json'),JSON.stringify(receipts,null,2));await context?.close();await browser.close();}
}
console.log(JSON.stringify(receipts));
