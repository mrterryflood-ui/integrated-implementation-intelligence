/** Actual case-editor components with explicit synthetic HTTP fixtures.
 * This proves browser behavior, not Clerk sign-in or a production database journey.
 */
import assert from "node:assert/strict";
import {chromium,webkit,devices} from "playwright";
import {build} from "esbuild";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";
const out=process.env.DIS_E2E_ARTIFACT_DIR||"test-results/dis-candidate-browser";
mkdirSync(out,{recursive:true});
const caseId="10000000-0000-4000-8000-000000000001",eventId="20000000-0000-4000-8000-000000000001";
const bundled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import CaseClient from './app/workspace/case/case-client';const root=createRoot(document.getElementById('root'));window.__renderFixtureCase=id=>root.render(<CaseClient caseId={id}/>);window.__renderFixtureCase("${caseId}");`,resolveDir:process.cwd(),loader:"tsx"},bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},plugins:[{name:"fixture-next-link",setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:"next-link",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:`import React from 'react';export default function Link({href,children,...p}){return React.createElement('a',{href,...p},children)}`,loader:"js",resolveDir:process.cwd()}));}}]});
const bundle=bundled.outputFiles[0].text,bundleSha256=createHash("sha256").update(bundle).digest("hex");
const original={state:"REVIEW",deliberation:{synthesis:"Synthetic archived assessment retained exactly."}};
const current={state:"REVIEW",deliberation:{synthesis:"Synthetic current assessment before recovery."}};
const playbook={objective:"Fixture",decision:"Review",assumptions:[],alternatives:[],tasks:[{id:"t1",phase:"Review",title:"Review the source",why:"Retain evidence",success:"Complete report retained",owner:"Saved owner",due:null,done:false,evidence:"",review:null}],metrics:[],nextReview:"Next review",progressNotes:[],evidenceLevel:"SYNTHETIC",version:1};
for(const[label,engine,device]of[["desktop",chromium,{viewport:{width:1280,height:850}}],["iphone",webkit,devices["iPhone 13"]]]){
 const browser=await engine.launch({headless:true}),context=await browser.newContext(device),page=await context.newPage();
 const errors=[],restoreRequests=[],checks=[];page.on("pageerror",e=>errors.push(e.message));
 let item,history,mode="success",gets=0,releaseRestore,restoreStarted;
 const otherCaseId="10000000-0000-4000-8000-000000000002";
 const reset=()=>{item={id:caseId,title:"Synthetic recovery case",question:"Can the earlier assessment be restored safely?",version:3,status:"REVIEW",playbook:structuredClone(playbook),report:structuredClone(current),updated_at:"2026-01-02T00:00:00Z"};history=[{id:eventId,event_type:"REASSESSMENT",created_at:"2026-01-02T00:00:00Z",payload:{previousVersion:1,newVersion:3,previousReport:original}}];gets=0;};reset();
 const payload=()=>({case:item,history,historyPage:{hasMore:false,isFirstPage:true,incompleteCoverage:false,caseVersion:item.version,returnedCount:history.length,limit:250,order:"created_at_desc_id_desc",maxResponseBytes:3145728,nextCursor:null}});
 await context.route("https://case-fixture.test/**",async route=>{
  const request=route.request(),url=new URL(request.url());
  const json=(body,status=200)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
  if(url.pathname==="/")return route.fulfill({contentType:"text/html",body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'});
  if(url.pathname==="/fixture.js")return route.fulfill({contentType:"text/javascript",body:bundle});
  if(url.pathname==="/api/cases"&&request.method()==="GET"){if(url.searchParams.get("id")===otherCaseId){const p=payload();return json({...p,case:{...p.case,id:otherCaseId,title:"Other synthetic case",version:1},history:[],historyPage:{...p.historyPage,caseVersion:1,returnedCount:0}});}gets++;return mode==="history-failure"&&gets>1?json({error:"Synthetic history unavailable"},503):json(payload());}
  if(url.pathname==="/api/cases/restore"&&request.method()==="POST"){
   const body=request.postDataJSON();restoreRequests.push(body);assert.deepEqual(body,{id:caseId,version:3,eventId});
   if(mode==="conflict")return json({error:"The case changed. Reload before restoring."},409);
   if(mode.startsWith("navigation")){restoreStarted();await new Promise(resolve=>{releaseRestore=resolve});}
   const previousReport=item.report;item={...item,version:4,report:structuredClone(original)};
   history.unshift({id:"20000000-0000-4000-8000-000000000002",event_type:"REASSESSMENT",created_at:"2026-01-03T00:00:00Z",payload:{previousVersion:3,newVersion:4,previousReport,revisionAction:"RESTORE_PRIOR_ASSESSMENT"}});
   return json({case:item,historyRecorded:true,note:"Assessment restored as a new review revision."});
  }
  throw Error("Unexpected fixture request "+request.method()+" "+url.pathname);
 });
 const openArchive=async()=>{await page.getByText("Earlier assessments and their retained source evidence",{exact:true}).click();await page.locator("summary").filter({hasText:"Archived assessment before revision 3"}).click();};
 try{
  await page.goto("https://case-fixture.test/");await page.getByRole("heading",{name:"Synthetic recovery case"}).waitFor();
  await page.getByLabel("Responsible person").fill("Unsaved owner survives");await openArchive();
  await page.getByRole("button",{name:"Restore this assessment",exact:true}).click();await page.getByRole("button",{name:"Cancel restoration"}).click();assert.equal(restoreRequests.length,0);checks.push("cancel_does_not_write");
  await page.getByRole("button",{name:"Restore this assessment",exact:true}).click();await page.getByRole("button",{name:"Confirm assessment restoration"}).click();
  await page.getByText("DIS decision workspace · Version 4",{exact:true}).waitFor();await page.getByRole("status").filter({hasText:"Unsaved action-plan edits are retained"}).waitFor();assert.equal(await page.getByLabel("Responsible person").inputValue(),"Unsaved owner survives");assert.equal(restoreRequests.length,1);assert.equal(gets,2);checks.push("restore_uses_only_ids_and_expected_version","new_revision_and_history_refresh","unsaved_action_plan_preserved");
  await page.getByText("Read the council's latest preliminary assessment",{exact:true}).click();await page.getByText(original.deliberation.synthesis,{exact:true}).first().waitFor();checks.push("selected_assessment_is_current");
  await page.screenshot({path:join(out,"case-recovery-"+label+".png"),fullPage:false});
  mode="conflict";reset();await page.reload();await page.getByLabel("Responsible person").fill("Conflict draft retained");await openArchive();await page.getByRole("button",{name:"Restore this assessment",exact:true}).click();await page.getByRole("button",{name:"Confirm assessment restoration"}).click();await page.getByRole("status").filter({hasText:"The case changed"}).waitFor();assert.equal(await page.getByLabel("Responsible person").inputValue(),"Conflict draft retained");assert.equal(item.version,3);checks.push("conflict_preserves_current_assessment_and_draft");
  mode="history-failure";reset();await page.reload();await page.getByRole("heading",{name:"Synthetic recovery case"}).waitFor();await openArchive();await page.getByRole("button",{name:"Restore this assessment",exact:true}).click();await page.getByRole("button",{name:"Confirm assessment restoration"}).click();await page.getByRole("status").filter({hasText:"History refresh was not confirmed: Synthetic history unavailable"}).waitFor();await page.getByText("DIS decision workspace · Version 4",{exact:true}).waitFor();checks.push("successful_restore_with_failed_history_is_explicit");
  for(const back of [false,true]){
   mode="navigation-race";reset();await page.reload();await page.getByRole("heading",{name:"Synthetic recovery case"}).waitFor();await openArchive();await page.getByRole("button",{name:"Restore this assessment",exact:true}).click();
   const started=new Promise(resolve=>{restoreStarted=resolve});await page.getByRole("button",{name:"Confirm assessment restoration"}).click();await started;
   await page.evaluate(id=>window.__renderFixtureCase(id),otherCaseId);await page.getByRole("heading",{name:"Other synthetic case"}).waitFor();
   if(back){await page.evaluate(id=>window.__renderFixtureCase(id),caseId);await page.getByRole("heading",{name:"Synthetic recovery case"}).waitFor();}
   await page.getByLabel("Responsible person").fill("New editor draft");const done=page.waitForResponse(r=>r.url().endsWith("/api/cases/restore"));releaseRestore();const restoredResponse=await done;await restoredResponse.finished();
   // Follow a browser rendering turn after delivery of the delayed response.
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await page.getByRole("heading",{level:1}).textContent(),back?"Synthetic recovery case":"Other synthetic case");
   await page.getByText("DIS decision workspace · Version "+(back?3:1),{exact:true}).waitFor();assert.equal(await page.getByLabel("Responsible person").inputValue(),"New editor draft");checks.push(back?"late_response_cannot_replace_returned_case_generation":"late_response_cannot_replace_other_case");
  }
  assert.deepEqual(errors,[]);writeFileSync(join(out,"case-recovery-"+label+".json"),JSON.stringify({kind:"SYNTHETIC_COMPONENT_BROWSER_FIXTURE",revision:process.env.GITHUB_SHA||null,device:label,bundleSha256,checks,clientErrors:errors,clerkSignInVerified:false,productionDatabaseUsed:false},null,2));console.log("PASS case recovery "+label+": "+checks.length+" component behavior checks");
 }finally{await context.close();await browser.close();}
}
