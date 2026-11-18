import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { observeGitRevision } from './revision.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const site=path.join(here,'site');
const server=http.createServer(async(req,res)=>{
  const known={ '/':'index.html', '/fixture.js':'fixture.js', '/fixture.css':'fixture.css' };
  const file=known[req.url];
  if(!file){res.writeHead(404);res.end();return;}
  res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
  res.end(await fs.readFile(path.join(site,file)));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
let browser;
const receipts=[];
let activeCase='Browser setup';
const gitRevision=observeGitRevision();
const sourceSha256=Object.fromEntries(await Promise.all(['../src/components/iss-hig/Primitives.tsx','../styles/iss-hig-tokens.css','../package-lock.json','./browser.mjs','./fixture.tsx','./revision.mjs'].map(async file=>[file,crypto.createHash('sha256').update(await fs.readFile(new URL(file,import.meta.url))).digest('hex')])));
const test=async(name,fn)=>{activeCase=name;await fn();receipts.push({name,status:'PASS'});console.log('PASS',name);};
const axe=path.join(here,'../node_modules/axe-core/axe.min.js');
const checkAxe=async(page)=>{
  // Scan the actual rendered resting state, never a partially transparent entry
  // frame. Keep contrast rules enabled; do not hide/disable production animation.
  await page.waitForFunction(()=>{
    const surfaces=[...document.querySelectorAll('.iss-card, dialog[open] .iss-primer-content')];
    return surfaces.length>0 && surfaces.every(element=>{
      const style=getComputedStyle(element);
      const transform=style.transform==='none' || new DOMMatrixReadOnly(style.transform).isIdentity;
      return Number(style.opacity)===1 && transform && element.getAnimations({subtree:true}).every(animation=>animation.playState==='finished' || animation.playState==='idle');
    });
  },undefined,{timeout:10000,polling:'raf'});
  await page.addScriptTag({path:axe});
  const result=await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  assert.deepEqual(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),[]);
};
try{
 browser=await chromium.launch({headless:true, ...(process.env.ISS_TEST_CHROMIUM ? {executablePath:process.env.ISS_TEST_CHROMIUM} : {})});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.getByRole('heading',{name:'Your next step'}).waitFor();
 await test('light desktop accessibility scan',()=>checkAxe(page));
 await test('empty-state CTA is an explicit button action',async()=>{
  await page.getByRole('button',{name:'Explore community resources'}).click();
  assert.equal(await page.evaluate(()=>window.actionCalls),1);
 });
 await test('opening explanation never requests device permission; unique labelled dialog focuses heading',async()=>{
  await page.locator('#open-web').click();
  const dialog=page.getByRole('dialog',{name:'Use Location'});await dialog.waitFor();
  assert.equal(await page.evaluate(()=>window.permissionCalls),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Use Location');
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
  assert.match(await dialog.getAttribute('aria-describedby'),/\S+ \S+/);
  await checkAxe(page);
 });
 await test('native modal contains keyboard focus and makes background inert',async()=>{
  for(const key of ['Tab','Shift+Tab']){
   for(let i=0;i<7;i++){
    await page.keyboard.press(key);
    assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open]')),true,`${key} step ${i+1} escaped the modal`);
   }
  }
  await page.locator('#outside').click({force:true});
  assert.equal(await page.evaluate(()=>window.outsideCalls),0);
 });
 await test('Escape closes and restores triggering control',async()=>{
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'open-web');
 });
 await test('web optional explanation defers with no permission request',async()=>{
  await page.locator('#open-web').click();await page.getByRole('button',{name:'Not now',exact:true}).click();
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.evaluate(()=>window.permissionCalls),0);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'open-web');
 });
 await test('Continue preserves user activation and suppresses duplicate pending requests',async()=>{
  await page.locator('#open-web').click();await page.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.permissionCalls),1);assert.equal(await page.evaluate(()=>window.activationSeen),true);
  assert.equal(await page.getByRole('button',{name:'Opening system prompt…'}).isDisabled(),true);
  await page.getByRole('button',{name:'Opening system prompt…'}).dispatchEvent('click');
  assert.equal(await page.evaluate(()=>window.permissionCalls),1);
  await page.evaluate(()=>window.finishPermission());
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
 });
 await test('rejected request reports error without announcing permission success',async()=>{
  await page.locator('#open-web').click();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.evaluate(()=>window.rejectPermission());
  await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').textContent(),/did not open/);
  assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).isEnabled(),true);
  await page.keyboard.press('Escape');
 });
 await test('essential native explanation has a single Continue button',async()=>{
  await page.locator('#open-native').click();
  const dialog=page.getByRole('dialog',{name:'Use Camera'});assert.equal(await dialog.getByRole('button').count(),1);
  assert.equal(await dialog.getByRole('button').textContent(),'Continue');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Continue');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Continue');
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement?.id),'open-native');
 });
 await test('dark theme accessibility and button contrast scan',async()=>{await page.getByRole('button',{name:'Toggle theme'}).click();await checkAxe(page);await page.locator('#open-web').click();await checkAxe(page);await page.keyboard.press('Escape');});
 await test('320px viewport and doubled text reflow without horizontal page scroll',async()=>{
  await page.setViewportSize({width:320,height:740});await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.locator('#open-web').click();
  assert.equal(await page.evaluate(()=>{const d=document.querySelector('dialog[open]');return d.scrollWidth<=d.clientWidth+1;}),true);
  await checkAxe(page);await page.screenshot({path:path.join(here,'mobile-dark-200-percent.png'),fullPage:true});await page.keyboard.press('Escape');
  await page.evaluate(()=>document.documentElement.style.fontSize='');
 });
 await test('reduced motion disables transform animation including interaction',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  const button=page.getByRole('button',{name:'Explore community resources'});await button.hover();
  assert.equal(await button.evaluate(el=>getComputedStyle(el).transform),'none');
  await page.locator('#open-web').click();
  assert.equal(await page.locator('.iss-primer-content').evaluate(el=>getComputedStyle(el).transform),'none');
  await page.keyboard.press('Escape');
 });
 await test('forced colors keeps controls visible and distinct',async()=>{
  await page.emulateMedia({forcedColors:'active'});
  assert.equal(await page.locator('#open-web').evaluate(el=>getComputedStyle(el).borderStyle),'solid');
  await page.locator('#open-web').click();await checkAxe(page);await page.keyboard.press('Escape');
 });
 await test('no browser runtime errors',async()=>assert.deepEqual(errors,[]));
 await fs.writeFile(path.join(here,'browser-receipt.json'),JSON.stringify({status:'PASS',gitRevision,sourceSha256,scope:'Synthetic Chromium component fixture; no production/user/store acceptance claim',timestamp:new Date().toISOString(),browser:browser.version(),passed:receipts.length,cases:receipts},null,2)+'\n');
}catch(error){
 await fs.writeFile(path.join(here,'browser-receipt.json'),JSON.stringify({status:'FAIL',gitRevision,sourceSha256,timestamp:new Date().toISOString(),scope:'Synthetic browser fixture; setup or assertion failure is not a pass.',failedCase:activeCase,completedCases:receipts,error:String(error)},null,2)+'\n');
 throw error;
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
