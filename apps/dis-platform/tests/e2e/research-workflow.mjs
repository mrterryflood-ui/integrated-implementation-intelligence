/** Actual research editors with an explicit synthetic HTTP/storage boundary.
 * Route SQL/RLS is tested separately. This fixture never claims Clerk sign-in. */
import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';
import {build} from 'esbuild';
import {mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const out=process.env.DIS_E2E_ARTIFACT_DIR||'test-results/dis-candidate-browser';mkdirSync(out,{recursive:true});
const temporary=mkdtempSync(join(resolve(out),'workflow-fixture-'));
const helpers=join(temporary,'helpers.cjs');
await build({stdin:{contents:`export {buildResearchWorkflowCase,reviseResearchWorkflowReport} from './lib/research-workflow';export {colorectalEvidenceAction} from './lib/evidence-action-colorectal';`,resolveDir:process.cwd(),loader:'ts'},outfile:helpers,bundle:true,platform:'node',format:'cjs',packages:'external'});
const api=createRequire(import.meta.url)(helpers);
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Editor from './app/research-program/evidence-action/evidence-action-client';const root=createRoot(document.getElementById('root'));window.__renderResearch=id=>root.render(<Editor caseId={id}/>);window.__renderResearch(new URL(location.href).searchParams.get('caseId')||'');`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixture-link',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'next-link',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`import React from 'react';export default function Link({href,children,...props}){return React.createElement('a',{href,...props},children)}`,loader:'js',resolveDir:process.cwd()}));}}]});
const bundle=compiled.outputFiles[0].text,bundleSha256=createHash('sha256').update(bundle).digest('hex');
const caseId='1a000000-0b00-4c00-8d00-00000000000e',otherCaseId='10000000-0000-4000-8000-000000000002',workspaceId='20000000-0000-4000-8000-000000000001';
assert.notEqual(caseId.toUpperCase(),caseId,'The uppercase-resume fixture must contain alphabetic UUID digits');
try{for(const [label,engine,device] of [['desktop',chromium,{viewport:{width:1280,height:850}}],['iphone',webkit,devices['iPhone 13']]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext(device),page=await context.newPage();
 let saved=null,mode='normal',phase='fixture setup';const posts=[],caseGets=[],archives=[],errors=[],checks=[],consoleErrors=[],requestFailures=[],fixtureFailures=[];
 let reportFatal;const fatal=new Promise(resolve=>{reportFatal=resolve});
 const failFixture=(kind,error)=>{fixtureFailures.push({kind,message:error instanceof Error?error.message:String(error)});reportFatal(error instanceof Error?error:Error(String(error)));};
 let delaySearch=false,searchStarted,releaseSearch,delayNextLoad=false,loadStarted,releaseLoad,loadCompleted,badLoadId=false;
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const render=async id=>{await page.evaluate(id=>window.__renderResearch(id),id);await settle();};
 page.on('pageerror',error=>{errors.push(error.message);failFixture('pageerror',error);});
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 page.on('requestfailed',request=>requestFailures.push({method:request.method(),url:request.url(),error:request.failure()?.errorText||'Unknown request failure'}));
 await context.route('https://research-fixture.test/**',async route=>{try{
  const request=route.request(),url=new URL(request.url());
  const json=(value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  if(url.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript',body:bundle});
  if(url.pathname==='/'||url.pathname==='/resume')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;line-height:1.5;margin:16px}main{max-width:1000px;margin:auto}button,select,input,textarea{font:inherit;max-width:100%;box-sizing:border-box}label{display:block;margin:12px 0}textarea{width:100%}button{margin:6px;padding:7px}fieldset{min-width:0}table{border-collapse:collapse}td,th{padding:5px}a,p{overflow-wrap:anywhere}.rp-table-wrap{overflow-x:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'});
  if(url.pathname==='/api/workspaces')return json({workspaces:[{id:workspaceId,title:'SYNTHETIC private workspace'}]});
  if(url.pathname==='/api/research-program/evidence-search'){
   if(delaySearch){searchStarted();await new Promise(resolve=>{releaseSearch=resolve});delaySearch=false;}
   return json({status:'SYNTHETIC_FIXTURE',leads:[{id:'synthetic-source',kind:'SCHOLARLY',title:'SYNTHETIC colorectal discovery lead',summary:'Synthetic metadata fixture, not a real article',source:'Synthetic index',url:'https://example.org/synthetic-study',retrievedAt:'2026-11-08T12:00:00Z',sourceStatus:'DISCOVERY_ONLY'}]});
  }
  if(url.pathname==='/api/cases'&&request.method()==='GET'){
   caseGets.push(url.searchParams.get('id'));
   if(!saved)return json({error:'No saved fixture'},404);const reading=structuredClone(saved);
   if(url.searchParams.get('id')===otherCaseId){reading.id=otherCaseId;reading.report.workflow.narrative.setting='SYNTHETIC other case B';}
   const delayed=delayNextLoad;if(delayed){delayNextLoad=false;loadStarted();await new Promise(resolve=>{releaseLoad=resolve});}
   if(badLoadId)reading.id=otherCaseId;
   try{return await json({case:reading,history:[]});}catch(error){if(!delayed)throw error;}finally{if(delayed)loadCompleted();}return;
  }
  if(url.pathname==='/api/cases'){
   const input=request.postDataJSON();posts.push(input);
   if(mode==='conflict')return json({error:'Case changed or access denied. Reload before retrying.'},409);
   try{
    if(request.method()==='POST'){
     assert.deepEqual(Object.keys(input).sort(),['researchWorkflow','workspaceId']);assert.equal(input.workspaceId,workspaceId);
     const handoff=api.buildResearchWorkflowCase(input.researchWorkflow);saved={...handoff,id:caseId,version:1,status:'ACTIVE'};
    }else{
     assert.deepEqual(Object.keys(input).sort(),['id','researchWorkflow','version']);assert.equal(input.id,caseId);assert.equal(input.version,saved.version);
     archives.push(structuredClone(saved));saved={...saved,report:api.reviseResearchWorkflowReport(saved.report,input.researchWorkflow),version:saved.version+1,status:'REVIEW'};
    }
    return json({case:saved,historyRecorded:true},request.method()==='POST'?201:200);
   }catch(e){return json({error:e.message},e.status||400);}
  }
  throw Error('Unexpected fixture request '+request.method()+' '+url.pathname);
 }catch(error){failFixture('fixture-route',error);await route.abort().catch(()=>{});}});
 try{await Promise.race([(async()=>{
  phase='initial mount and exact textbox labels';
  await page.goto('https://research-fixture.test/');await page.getByRole('heading',{name:'Define this project',exact:true}).waitFor();
  assert.equal(posts.length,0);
  // Match the textbox’s exact accessible name. An implicit label’s textContent
  // also contains its textarea default text, so exact getByLabel can miss it.
  await page.getByRole('textbox',{name:'Problem and decision to support',exact:true}).fill('SYNTHETIC CRC: which pathway gap should this setting test?');
  await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).fill('SYNTHETIC clinic network A; source counties retained separately');
  await page.getByRole('textbox',{name:'Population, eligibility and exclusions',exact:true}).fill('SYNTHETIC eligible population; no patient records');
  await page.getByRole('textbox',{name:'First warning sign and time-zero definition',exact:true}).fill('SYNTHETIC first recorded warning; definition requires review');
  await page.getByRole('checkbox',{name:'CFIR — implementation determinants',exact:true}).check();
  await page.getByRole('checkbox',{name:/RE-AIM — reach/}).check();
  await page.getByRole('textbox',{name:'Roles of the selected frameworks and why they fit',exact:true}).fill('SYNTHETIC rationale: examine determinants and evaluate implementation outcomes');
  phase='complete research editor inputs and preview';
  await page.getByRole('checkbox',{name:'Appropriate screening access and completion',exact:true}).check();
  await page.getByRole('button',{name:'Search published research',exact:true}).click();await page.getByRole('heading',{name:'SYNTHETIC colorectal discovery lead'}).waitFor();
  await page.getByRole('button',{name:'Load existing NCI exercise source',exact:true}).click();await page.getByRole('button',{name:'Review cross-study measurements',exact:true}).click();
  await page.getByText(/Shared original-source lineage/).first().waitFor();
  await page.getByRole('button',{name:'Load synthetic teaching panel',exact:true}).click();await page.getByRole('button',{name:'Check counterfactual readiness',exact:true}).click();await page.getByText(/Raw difference in differences: 1.000/).waitFor();
  const action=api.colorectalEvidenceAction().bridge.corrections[0];
  const receiptText=JSON.stringify({proposedActionId:action.id,deliveryRecordedAt:'2026-11-07T12:00:00Z',sourceUrl:'https://example.org/synthetic-receipt',eligibleDenominator:100,completedNumerator:75,coreFunctionChecked:true,balancingHarmsReviewed:true,comparisonRecorded:true,reviewerIdentity:'Synthetic reviewer, no actual delivery'});
  await page.getByRole('textbox',{name:/Aggregate delivery receipt JSON/}).fill(receiptText);
  await page.getByRole('button',{name:'Audit reported correction',exact:true}).click();
  await page.getByRole('button',{name:'Stage synthetic subgroup challenge',exact:true}).click();
  const confirmation=()=>page.getByRole('checkbox',{name:/I reviewed this investigation and supplement/});
  await confirmation().check();await page.getByRole('button',{name:'Preview complete investigation record',exact:true}).click();
  const preview=JSON.parse(await page.locator('#private-case-heading').locator('..').locator('pre').innerText());
  assert.deepEqual(preview.workflow.frameworks,['CFIR','RE_AIM']);assert.ok(preview.workflow.studyText.length);assert.equal(preview.workflow.correctionReceiptText,receiptText);assert.equal(preview.noPatientData,null);assert.equal(preview.independentOutcomeVerified,false);
  checks.push('all_editors_in_complete_preview_without_authority_promotion');
  phase='typed create and normal saved-case resume';
  await page.getByRole('button',{name:'Load my private DIS workspaces',exact:true}).click();await page.getByRole('button',{name:'Create research case and dated baseline',exact:true}).click();await page.getByText('Saved case revision 1.',{exact:false}).waitFor();
  assert.equal(posts.length,1);assert.equal(saved.report.workflow.narrative.population,'SYNTHETIC eligible population; no patient records');const original=structuredClone(saved);
  checks.push('typed_create_records_entire_workflow_after_explicit_confirmation');
  await page.goto('https://research-fixture.test/resume?caseId='+caseId);await page.getByText('Editing saved case revision 1.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:/Aggregate delivery receipt JSON/}).inputValue(),receiptText);
  assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),original.report.workflow.narrative.setting);
  assert.equal(await page.getByRole('checkbox',{name:/RE-AIM — reach/}).isChecked(),true);assert.equal(await confirmation().isChecked(),false);
  await page.getByRole('button',{name:'Check counterfactual readiness',exact:true}).click();await page.getByText(/Raw difference in differences: 1.000/).waitFor();
  checks.push('reopen_restores_input_values_and_recomputes_descriptive_checks');
  phase='uppercase UUID resume';
  await page.goto('https://research-fixture.test/resume?caseId='+caseId.toUpperCase());await page.getByText('Editing saved case revision 1.',{exact:false}).waitFor();
  assert.equal(caseGets.at(-1),caseId,'Uppercase navigation must request the canonical stored UUID');assert.equal(saved.id,caseId);
  assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),original.report.workflow.narrative.setting);
  assert.equal(await page.getByRole('textbox',{name:/Aggregate delivery receipt JSON/}).inputValue(),receiptText);
  assert.equal(await page.getByRole('checkbox',{name:/RE-AIM — reach/}).isChecked(),true);assert.equal(await confirmation().isChecked(),false);
  checks.push('uppercase_uuid_resumes_canonical_saved_case_and_exact_inputs');
  phase='explicit revision and conflict preservation';
  await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).fill('SYNTHETIC revised clinic setting');
  await page.getByRole('button',{name:'Save research revision',exact:true}).click();await page.getByText(/Explicit public-aggregate confirmation is required/).waitFor();assert.equal(posts.length,1);
  await confirmation().check();await page.getByRole('button',{name:'Save research revision',exact:true}).click();await page.getByText('Saved case revision 2.',{exact:false}).waitFor();
  assert.deepEqual(saved.report.calibratedEvidence,original.report.calibratedEvidence);assert.deepEqual(archives[0].report,original.report);assert.equal(saved.report.workflow.narrative.setting,'SYNTHETIC revised clinic setting');
  checks.push('new_edit_requires_confirmation_and_preserves_original_source_revision');
  mode='conflict';await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).fill('SYNTHETIC unsaved draft retained after conflict');await confirmation().check();await page.getByRole('button',{name:'Save research revision',exact:true}).click();await page.getByText(/Case changed or access denied/).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),'SYNTHETIC unsaved draft retained after conflict');assert.equal(saved.version,2);
  checks.push('version_conflict_preserves_unsaved_editor_inputs');
  phase='delayed evidence-search identity';
  delaySearch=true;await page.getByRole('textbox',{name:'Public literature research question',exact:true}).fill('Synthetic query one for colorectal');
  const pendingSearch=new Promise(resolve=>{searchStarted=resolve});await page.getByRole('button',{name:'Search published research',exact:true}).click();await pendingSearch;
  await page.getByRole('textbox',{name:'Public literature research question',exact:true}).fill('Synthetic query two for colorectal');
  const searched=page.waitForResponse(r=>r.url().endsWith('/api/research-program/evidence-search'));releaseSearch();await (await searched).finished();await settle();
  await confirmation().check();await page.getByRole('button',{name:'Preview complete investigation record',exact:true}).click();
  const searchedPreview=JSON.parse(await page.locator('#private-case-heading').locator('..').locator('pre').innerText());
  assert.equal(searchedPreview.workflow.searchQuery,'Synthetic query two for colorectal');assert.equal(searchedPreview.workflow.retrievalQuery,'Synthetic query one for colorectal');
  checks.push('delayed_search_keeps_actual_retrieval_query_separate_from_new_editor_query');
  phase='case navigation and delayed response isolation';
  mode='normal';await render('');delayNextLoad=true;const completedLoad=new Promise(resolve=>{loadCompleted=resolve}),pendingLoad=new Promise(resolve=>{loadStarted=resolve});await render(caseId);await pendingLoad;
  await render(otherCaseId);await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),'SYNTHETIC other case B');
  saved={...saved,version:3,report:{...saved.report,workflow:{...saved.report.workflow,narrative:{...saved.report.workflow.narrative,setting:'SYNTHETIC newer persisted A'}}}};
  await render(caseId);await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),'SYNTHETIC newer persisted A');
  await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).fill('SYNTHETIC unsaved edits in returned case A');releaseLoad();await completedLoad;await settle();
  assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).inputValue(),'SYNTHETIC unsaved edits in returned case A');await page.getByText('Editing saved case revision 3.',{exact:false}).waitFor();
  checks.push('late_A_response_cannot_replace_returned_A_revision_or_unsaved_edits_after_B');
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert.ok(dims.scroll<=dims.client+3,'No horizontal overflow '+JSON.stringify(dims));assert.deepEqual(errors,[]);
  await page.getByRole('heading',{name:'Define this project',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(out,'research-workflow-'+label+'.png'),fullPage:false});
  phase='mismatched case response denial';
  await render('');badLoadId=true;await render(caseId);await page.getByText('Saved investigation response did not match the requested case and version.',{exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Setting, services and geography',exact:true}).count(),0);
  checks.push('mismatched_saved_case_response_does_not_open_an_editor');
  assert.deepEqual(errors,[]);assert.deepEqual(fixtureFailures,[]);
  writeFileSync(join(out,'research-workflow-'+label+'.json'),JSON.stringify({kind:'SYNTHETIC_COMPONENT_BROWSER_FIXTURE',bundleSha256,checks,clientErrors:errors,recordedVersion:saved.version,clerkSignInVerified:false,liveDatabaseUsed:false,modelCalls:0},null,2));
  console.log('PASS research workflow '+label+': '+checks.length+' connected editor checks');
 })(),fatal.then(error=>{throw error;})]);
 }catch(error){
  // Capture the mounted DOM and native label/control associations before cleanup.
  // Only synthetic fixture content and public reference material can enter this page.
  const [html,dom,screenshot]=await Promise.allSettled([
   page.content(),
   page.evaluate(()=>({url:location.href,title:document.title,readyState:document.readyState,bodyText:(document.body?.innerText||'').slice(0,16000),controls:Array.from(document.querySelectorAll('input,textarea,select')).slice(0,100).map(element=>({tag:element.tagName,id:element.id,type:element.getAttribute('type'),ariaLabel:element.getAttribute('aria-label'),value:String(element.value||'').slice(0,600),defaultValue:String(element.defaultValue||'').slice(0,600),visible:element.getClientRects().length>0,labels:Array.from(element.labels||[]).map(label=>({htmlFor:label.htmlFor,textContent:(label.textContent||'').slice(0,1200),caption:Array.from(label.childNodes).filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim()}))}))})),
   page.screenshot({path:join(out,'research-workflow-'+label+'-failure.png'),fullPage:false,timeout:5000})
  ]);
  const diagnostic={kind:'SYNTHETIC_COMPONENT_BROWSER_FAILURE',revision:process.env.GITHUB_SHA||null,device:label,phase,bundleSha256,error:error instanceof Error?{name:error.name,message:error.message,stack:error.stack}:String(error),completedChecks:checks,clientErrors:errors,fixtureFailures,consoleErrors,requestFailures,postCount:posts.length,caseGets,dom:dom.status==='fulfilled'?dom.value:{captureError:String(dom.reason)},htmlCapture:html.status==='fulfilled'?{file:'research-workflow-'+label+'-failure.html',characters:html.value.length,truncated:html.value.length>400000}:{captureError:String(html.reason)},screenshot:screenshot.status==='fulfilled'?'research-workflow-'+label+'-failure.png':{captureError:String(screenshot.reason)},clerkSignInVerified:false,liveDatabaseUsed:false,modelCalls:0};
  if(html.status==='fulfilled')writeFileSync(join(out,'research-workflow-'+label+'-failure.html'),html.value.slice(0,400000));
  writeFileSync(join(out,'research-workflow-'+label+'-failure.json'),JSON.stringify(diagnostic,null,2));
  console.error('FAIL research workflow '+label+' during '+phase+'; diagnostics: '+join(out,'research-workflow-'+label+'-failure.json'));
  console.error(JSON.stringify({clientErrors:errors,fixtureFailures,controls:dom.status==='fulfilled'?dom.value.controls.slice(0,5):String(dom.reason)},null,2));
  throw error;
 }finally{await context.close();await browser.close();}
}}finally{rmSync(temporary,{recursive:true,force:true});}
