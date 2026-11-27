import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const pw=await import(process.env.DIS_E2E_PLAYWRIGHT_MODULE||'playwright');
const {chromium}=pw.default||pw;
const base=process.env.DIS_E2E_BASE_URL||'http://127.0.0.1:3102';
const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/dis-audience-browser';
mkdirSync(out,{recursive:true});
let server,browser;
const receipts=[];
try{
 if(process.env.DIS_E2E_START_SERVER==='1'){
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',new URL(base).port],{stdio:['ignore','ignore','pipe']});
  let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500));}assert.ok(ready,'candidate server starts');
 }
 browser=await chromium.launch({headless:true,...(process.env.DIS_E2E_CHROMIUM_PATH?{executablePath:process.env.DIS_E2E_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 for(const viewport of [{width:1365,height:950},{width:390,height:844}]){
  const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'domcontentloaded'});assert.equal(response?.status(),200);
  await page.locator('#start').scrollIntoViewIfNeeded();const cards=page.locator('.audience-card');assert.equal(await cards.count(),5);
  for(const card of await cards.all())assert.match(await card.getAttribute('href'),/^\//,'each audience has a native destination');
  const dimensions=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(dimensions.document<=dimensions.width+1,'no horizontal page overflow');
  await page.screenshot({path:out+'/audiences-'+viewport.width+'.png',fullPage:false});
  await page.getByRole('link',{name:/Inquisitive people/}).click();
  await page.getByRole('region',{name:'Selected focus: Learning & everyday decisions'}).waitFor({state:'visible'});
  assert.match(page.url(),/focus=everyday-learning/);
  await page.goto(base);await page.getByRole('link',{name:/Committees and leaders/}).click();
  await page.waitForURL('**/planning?view=meetings');assert.equal(new URL(page.url()).searchParams.get('view'),'meetings');
  assert.deepEqual(errors,[]);
  receipts.push({viewport,status:response.status(),audiences:5,overflow:false,curiosityRoute:'PASSED',groupDecisionRoute:'PASSED',scope:'PUBLIC_NAVIGATION_NOT_AUTHENTICATED_ACCEPTANCE'});
  await page.close();
 }
}finally{await browser?.close();server?.kill('SIGTERM');writeFileSync(out+'/audience-home-receipt.json',JSON.stringify(receipts,null,2));}
console.log(JSON.stringify(receipts));
