/** Actual handoff component; synthetic HTTP boundary, no live identity/database. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

const {chromium}=createRequire(import.meta.url)('playwright');

const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/research-planning-handoff';mkdirSync(out,{recursive:true});
const caseId='10000000-0000-4000-8000-000000000001',otherCaseId='10000000-0000-4000-8000-000000000002';
const orgA='20000000-0000-4000-8000-000000000001',orgB='20000000-0000-4000-8000-000000000002',draftId='30000000-0000-4000-8000-000000000001';
const bundled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Handoff from './app/workspace/case/research-planning-handoff';const root=createRoot(document.getElementById('root'));window.__renderHandoff=(caseId,caseVersion,disabled=false)=>root.render(<Handoff caseId={caseId} caseVersion={caseVersion} caseTitle="Synthetic research case" disabled={disabled}/>);window.__renderHandoff('${caseId}',1);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const bundle=bundled.outputFiles[0].text,bundleSha256=createHash('sha256').update(bundle).digest('hex');
const browser=await chromium.launch({headless:true,...(process.env.DIS_E2E_CHROMIUM_PATH?{executablePath:process.env.DIS_E2E_CHROMIUM_PATH}:{})}),context=await browser.newContext({viewport:{width:1280,height:850}}),page=await context.newPage();
const errors=[],checks=[],posts=[];let gets=0,mode='success',started,release;
page.on('pageerror',error=>errors.push(error.message));
await context.route('https://handoff-fixture.test/**',async route=>{
 const request=route.request(),url=new URL(request.url());
 const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:17px system-ui;margin:32px;max-width:1050px;line-height:1.5}button,select{font:inherit;margin:10px;padding:8px}label{display:block}a{margin-right:16px}code{overflow-wrap:anywhere}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'});
 if(url.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript',body:bundle});
 if(url.pathname==='/api/organizations'&&request.method()==='GET'){gets++;return json({organizations:[{id:orgA,name:'Synthetic organization A',role:'contributor'},{id:orgB,name:'Synthetic organization B',role:'admin'},{id:'20000000-0000-4000-8000-000000000003',name:'Read-only organization',role:'viewer'}]});}
 if(url.pathname==='/api/organizations'&&request.method()==='POST'){
  const input=request.postDataJSON();posts.push(input);assert.deepEqual(Object.keys(input).sort(),['action','caseId','caseVersion','confirmedPublicAggregate','organizationId'].sort());assert.equal(input.action,'import-research-case');assert.equal(input.confirmedPublicAggregate,true);
  if(mode==='conflict')return json({error:'This research case changed. Review its current saved version before copying it to planning.'},409);
  if(mode==='delayed'){started();await new Promise(resolve=>{release=resolve});}
  return json({result:{id:draftId,version:1,title:'Synthetic private planning draft',kind:'draft',visibility:'private',body:{researchSnapshot:{source:{caseId:input.caseId,caseVersion:input.caseVersion},sourceDigest:'a'.repeat(64)}}}});
 }
 throw Error('Unexpected fixture request '+request.method()+' '+url.pathname);
});
const prepare=async()=>{await page.getByRole('button',{name:'Choose a planning workspace',exact:true}).click();await page.getByLabel('Research planning destination').selectOption(orgA);};
const checkbox=()=>page.getByRole('checkbox');
const save=()=>page.getByRole('button',{name:'Create private planning draft',exact:true});
try{
 await page.goto('https://handoff-fixture.test/');await page.getByRole('heading',{name:'Continue this research in organization planning'}).waitFor();
 assert.equal(gets,0);assert.equal(posts.length,0);checks.push('no_fetch_or_write_before_user_action');
 await prepare();assert.equal(await page.getByRole('option',{name:'Read-only organization'}).count(),0);assert.equal(await save().isDisabled(),true);await checkbox().check();assert.equal(await save().isEnabled(),true);
 await page.getByLabel('Research planning destination').selectOption(orgB);assert.equal(await checkbox().isChecked(),false);assert.equal(await save().isDisabled(),true);await checkbox().check();
 checks.push('confirmation_required_and_destination_change_resets_it');
 await page.evaluate(id=>window.__renderHandoff(id,2),caseId);await page.getByRole('button',{name:'Choose a planning workspace',exact:true}).waitFor();assert.equal(await checkbox().count(),0);assert.equal(posts.length,0);checks.push('new_case_version_resets_entire_confirmation');
 await prepare();await checkbox().check();await save().click();await page.getByRole('status').waitFor();assert.equal(posts.length,1);assert.equal(posts[0].caseVersion,2);assert.equal(posts[0].organizationId,orgA);
 for(const format of ['JSON','MD','Word'])assert.ok((await page.getByRole('link',{name:'Download '+format}).getAttribute('href')).includes('id='+draftId));
 checks.push('explicit_copy_uses_ids_and_exact_version_only','saved_private_draft_receipt_and_exports_visible');
 await page.screenshot({path:join(out,'research-planning-handoff-desktop.png'),fullPage:true});
 mode='conflict';await page.reload();await prepare();await checkbox().check();await save().click();await page.getByRole('alert').filter({hasText:'This research case changed'}).waitFor();assert.equal(await page.getByRole('status').count(),0);checks.push('stale_version_error_has_no_success_receipt');
 mode='delayed';await page.reload();await prepare();await checkbox().check();const pending=new Promise(resolve=>{started=resolve});await save().click();await pending;
 await page.evaluate(id=>window.__renderHandoff(id,1),otherCaseId);await page.getByRole('button',{name:'Choose a planning workspace',exact:true}).waitFor();
 await page.evaluate(id=>window.__renderHandoff(id,1),caseId);await page.getByRole('button',{name:'Choose a planning workspace',exact:true}).waitFor();
 const responsePromise=page.waitForResponse(response=>response.url().endsWith('/api/organizations')&&response.request().method()==='POST');release();const response=await responsePromise;await response.finished();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.getByRole('status').count(),0);assert.equal(await checkbox().count(),0);checks.push('late_response_cannot_attach_to_returned_case_generation');
 await page.evaluate(id=>window.__renderHandoff(id,1,true),caseId);assert.equal(await page.getByRole('button',{name:'Choose a planning workspace',exact:true}).isDisabled(),true);checks.push('parent_unsaved_edit_gate_disables_transfer');
 assert.deepEqual(errors,[]);
 writeFileSync(join(out,'research-planning-handoff-browser.json'),JSON.stringify({kind:'SYNTHETIC_COMPONENT_BROWSER_FIXTURE',bundleSha256,checks,clientErrors:errors,postCount:posts.length,clerkSignInVerified:false,liveDatabaseUsed:false,modelCalls:0},null,2));
 console.log('PASS research planning handoff: '+checks.length+' browser behavior checks');
}finally{await context.close();await browser.close();}
