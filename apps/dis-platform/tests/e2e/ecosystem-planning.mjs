import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const base=(process.env.DIS_E2E_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/dis-candidate-browser';mkdirSync(out,{recursive:true});
const receipts=[];
for(const [name,engine]of [['chromium',chromium],['iphone-webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext(name==='iphone-webkit'?devices['iPhone 13']:{viewport:{width:1280,height:900}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/#consult',{waitUntil:'networkidle'});
  await page.locator('#ci-mission').fill('Assess community impact, CEDS alignment and economic development funding.');
  const panel=page.getByRole('region',{name:'Coordinate the ecosystem'});
  await panel.getByLabel('Public place name').fill('Manor');
  await panel.getByLabel('State FIPS',{exact:true}).fill('48');
  await panel.getByLabel('County FIPS for regional context').fill('48453');
  const pending=page.waitForResponse(r=>r.url().endsWith('/api/mcp')&&r.request().method()==='POST');
  await panel.getByRole('button',{name:'Show the capability plan'}).click();
  const response=await pending,body=await response.json();
  assert.equal(response.status(),200);const plan=JSON.parse(body.result.content[0].text);
  assert.equal(plan.state,'PLAN_ONLY');assert.equal(plan.networkRequests,0);assert.equal(plan.question,null);
  for(const id of ['community','civic','funding','business','research'])assert.ok(plan.selected.some(c=>c.platformId===id),id+' coverage');
  assert.equal(await panel.getByRole('button',{name:'Retrieve evidence and update the package'}).isEnabled(),false);
  await panel.getByRole('checkbox').check();
  assert.equal(await panel.getByRole('button',{name:'Retrieve evidence and update the package'}).isEnabled(),false);
  await panel.getByLabel('Public place name').fill('Hutto');
  assert.equal(await panel.getByRole('checkbox').isChecked(),false);
  const protectedCall=await context.request.post(base+'/api/capability-fabric',{data:{mode:'ecosystem-invoke',engagement:plan.input||{problem:'Assess community impact',geography:{kind:'city',label:'Manor',stateFips:'48',countyFips:'48453'},externalConsent:true}}});
  assert.ok([401,503].includes(protectedCall.status()),'private execution remains gated');
  const untrusted=await context.request.post(base+'/api/mcp',{data:{jsonrpc:'2.0',id:9,method:'tools/call',params:{name:'dis_ecosystem_plan',arguments:{problem:'Assess community impact',token:'not-accepted'}}}});
  assert.ok((await untrusted.json()).error);
  assert.deepEqual(errors,[]);await page.screenshot({path:join(out,'ecosystem-'+name+'.png'),fullPage:true});
  receipts.push({engine:name,sourceRevision:process.env.GITHUB_SHA||'local-working-tree',state:'PUBLIC_PLANNING_AND_IDENTITY_DENIAL_PASSED',privateSignedInAcceptance:false,partnerRoundTrip:false,observedAt:new Date().toISOString(),checks:9});
  await context.close();
 }finally{await browser.close();}
}
writeFileSync(join(out,'ecosystem-planning-receipts.json'),JSON.stringify(receipts,null,2));console.log(JSON.stringify(receipts));
