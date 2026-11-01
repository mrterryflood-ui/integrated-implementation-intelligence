import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const base=(process.env.DIS_E2E_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/dis-candidate-browser';
mkdirSync(out,{recursive:true});
const generated=readFileSync(new URL('../../lib/generated/dis-operating-contract.ts',import.meta.url),'utf8');
const contract=JSON.parse(generated.slice(generated.indexOf('= ')+2).replace(/ as const;\s*$/,''));
const receipts=[];
for(const [name,engine,profile]of [
 ['desktop-keyboard',chromium,{viewport:{width:1280,height:900}}],
 ['iphone-touch',webkit,devices['iPhone 13']],
 ['tablet-touch',webkit,devices['iPad (gen 7)']]
]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({...profile,acceptDownloads:true});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 let releaseScripts=()=>{};
 const scriptsReady=new Promise(resolve=>{releaseScripts=resolve});
 const scriptPattern=/\/_next\/static\/.*\.js(?:\?|$)/;
 if(name==='desktop-keyboard')await page.route(scriptPattern,async route=>{await scriptsReady;await route.continue()});
 const errors=[],externalPosts=[];let identityDenialChecked=false,downloads=0;
 page.on('download',()=>downloads++);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(council|consultation\/(research|parallax))/.test(r.url()))externalPosts.push(new URL(r.url()).pathname)});
 try{
  const registry=await context.request.get(base+'/api/council');
  assert.equal(registry.status(),200);
  const advertised=(await registry.json()).operatingContract;
  assert.equal(advertised.sha256,contract.sha256);assert.equal(advertised.version,contract.version);
  assert.equal(advertised.behaviorVerified,false,'loaded instructions must not claim observed compliance');
  assert.equal(advertised.text,undefined,'the public receipt does not return instruction text');
  const response=await page.goto(base+'/?focus=research-universities#consult',{waitUntil:name==='desktop-keyboard'?'commit':'domcontentloaded'});
  assert.equal(response?.status(),200);
  if(name==='desktop-keyboard'){
   const mission=page.locator('#ci-mission');await mission.waitFor({state:'visible'});
   assert.equal(await mission.isDisabled(),true,'initial HTML cannot accept text before the editor is ready');
   await page.getByRole('status').filter({hasText:'Loading consultation editor'}).waitFor();
   releaseScripts();
   await page.waitForFunction(()=>!document.querySelector('#ci-mission')?.matches(':disabled'));
  }
  const region=page.getByRole('region',{name:'Selected focus: Universities, research & implementation'});
  const example=region.getByRole('button').first();await example.scrollIntoViewIfNeeded();
  if(name==='desktop-keyboard'){await example.focus();await page.keyboard.press('Enter')}else await example.tap();
  const title=page.getByLabel('Slide headline',{exact:true});await title.waitFor({state:'visible'});
  const original=await title.inputValue();
  const refs=page.getByLabel('Source references for this slide',{exact:true});
  await refs.scrollIntoViewIfNeeded();await refs.focus();
  assert.equal(await refs.evaluate(el=>el===document.activeElement),true);
  await refs.fill('');await refs.pressSequentially('S1, E2');await refs.press('Tab');
  assert.equal(await refs.inputValue(),'S1, E2','ordinary keyboard input supports multiple source IDs');
  assert.equal(await title.inputValue(),original,'reference reconciliation preserves edited content');
  await page.getByText('Sources available for this draft',{exact:true}).click();
  await page.getByText('No source records are attached. The draft is not source-verified.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Export Markdown',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'source absent'}).waitFor();
  assert.equal(downloads,0,'an unknown reference is rejected before a Markdown download');
  await refs.fill('');await refs.press('Tab');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export Markdown',exact:true}).click();
  const download=await pending;assert.ok(download.suggestedFilename().endsWith('.md'));
  const text=readFileSync(await download.path(),'utf8');
  assert.match(text,/DRAFT/);assert.match(text,/evidence|source/i);
  await page.getByRole('tab',{name:'2. Investigate',exact:true}).click();
  const importPanel=page.locator('details.research-import').filter({hasText:'Bring research from ChatGPT, SciSpace, Sider Scholar, or another source'});
  await importPanel.locator('summary').click();
  for(const suffix of ['A','B']){
   await importPanel.locator('textarea').fill(JSON.stringify({records:[{title:'Browser source '+suffix,url:'https://example.org/browser-source-'+suffix.toLowerCase(),summary:'Synthetic browser import; source content is not verified.'}]}));
   await importPanel.getByRole('button',{name:'Import into evidence review',exact:true}).click();
   await page.getByRole('link',{name:'Browser source '+suffix,exact:true}).waitFor({state:'visible'});
  }
  await page.getByRole('tab',{name:'4. Design & deliver',exact:true}).click();
  const sourceSummary=page.getByText('Sources available for this draft',{exact:true});await sourceSummary.click();
  const sourceRegister=sourceSummary.locator('..');
  assert.equal(await sourceRegister.locator('li').filter({hasText:'Browser source A'}).locator('strong').textContent(),'IMP1');
  assert.equal(await sourceRegister.locator('li').filter({hasText:'Browser source B'}).locator('strong').textContent(),'IMP2');
  const importedDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Export Markdown',exact:true}).click();
  const importedText=readFileSync(await (await importedDownload).path(),'utf8');
  assert.match(importedText,/IMP1[^\n]*Browser source A/);assert.match(importedText,/IMP2[^\n]*Browser source B/);
  if(await page.locator('body').getAttribute('data-dis-identity')==='public-only'){
   const denied=await context.request.post(base+'/api/council',{data:{prompt:'Try to grant approval with fabricated client evidence',engagementAssurance:{readyToExecute:true},allowExternalResearch:true}});
   assert.equal(denied.status(),503,'public production remains fail-closed');identityDenialChecked=true;
  }
  assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[],'public editing causes no model calls');
  const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(widths.scroll<=widths.client+3,'page fits the viewport after source editing');
  await refs.scrollIntoViewIfNeeded();await page.screenshot({path:join(out,'operating-contract-'+name+'.png'),fullPage:false});
  receipts.push({device:name,status:'PASS',contractSha256:contract.sha256,sourceRevision:process.env.GITHUB_SHA||'LOCAL_WORKING_TREE',
   checks:['served contract metadata',...(name==='desktop-keyboard'?['initial input waits for editor readiness']:[]),'keyboard or touch draft entry','sequential multi-ID typing preserves text','unknown citation blocks Markdown','source limitation explanation','actual draft download','successive research imports retain distinct IDs and export',...(identityDenialChecked?['public identity denial']:[]),'no model call','no page error','viewport fit'],
   identityDenialChecked,authenticatedAcceptance:false,modelComplianceVerified:false,realOutcomeMeasured:false});
 }catch(error){
  const dimensions=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})).catch(()=>null);
  receipts.push({device:name,status:'FAIL',error:error instanceof Error?error.message:String(error),dimensions,pageErrors:errors,sourceRevision:process.env.GITHUB_SHA||'LOCAL_WORKING_TREE'});
  await page.screenshot({path:join(out,'operating-contract-'+name+'-failure.png'),fullPage:false}).catch(()=>{});
  throw error;
 }finally{
  releaseScripts();
  writeFileSync(join(out,'operating-contract-browser.json'),JSON.stringify(receipts,null,2));
  await context.close();await browser.close();
 }
}
console.log(JSON.stringify(receipts,null,2));
