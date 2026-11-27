/**
 * Native React terminal + real organization services + persistent PGlite/RLS.
 * Run from apps/dis-platform: node --import tsx tests/e2e/organization-native.mjs
 * FIXTURE_AUTH_NOT_CLERK_ACCEPTANCE: this test-only loopback server supplies
 * synthetic identities. It neither modifies nor exercises production sign-in.
 * No live provider, shared drive, deployment, or private customer data is used.
 */
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,mkdtempSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {chromium,devices} from 'playwright';
import {PGlite} from '@electric-sql/pglite';
import JSZip from 'jszip';
import {actOnOrganization,getRecord,listOrganizations,membership,organizationSnapshot,recordHistory,OrganizationError} from '../../lib/organizations/service.ts';
import {prepareOrganizationAsk} from '../../lib/organizations/knowledge.ts';
import {knowledgeProviderStatus} from '../../lib/organizations/knowledge-provider.ts';
import {buildOrganizationPresentation} from '../../lib/organizations/presentation.ts';
import {IMPLEMENTATION_FIELDS,IMPLEMENTATION_GROUPS} from '../../lib/implementation-science.ts';

const appRoot=fileURLToPath(new URL('../../',import.meta.url));
const repoRoot=resolve(appRoot,'../..');
const out=resolve(appRoot,process.env.DIS_E2E_ARTIFACT_DIR||'test-results/organization-native');
mkdirSync(out,{recursive:true});
const dbPath=mkdtempSync(join(out,'pglite-'));
const authBoundary='FIXTURE_AUTH_NOT_CLERK_ACCEPTANCE';
const sha256=value=>createHash('sha256').update(value).digest('hex');
const sourceFiles=[
  'app/planning/terminal.tsx','app/planning/meeting-workspace.tsx','app/planning/implementation-editor.tsx',
  'app/planning/knowledge-panel.tsx','app/planning/decisions-connection.tsx','app/planning/planning.css','app/home.css','app/persistent-search.tsx',
  'lib/organizations/service.ts','lib/organizations/council.ts','lib/organizations/knowledge.ts',
  'lib/organizations/knowledge-passages.ts','lib/organizations/knowledge-provider.ts','lib/organizations/presentation.ts',
  'lib/implementation-science.ts','lib/meeting-guide.ts','lib/planning-contract.ts','lib/planning-fields.ts','db/003_organization_workflow.sql','package.json',
  'tests/e2e/organization-native.mjs',
];
const inputs=Object.fromEntries(sourceFiles.map(path=>[path,sha256(readFileSync(join(appRoot,path)))]));
const sourceRevision=execFileSync('git',['rev-parse','HEAD'],{cwd:repoRoot,encoding:'utf8'}).trim();
const ironHash=sha256(readFileSync(join(repoRoot,'docs/engineering/IRON-ENG-001.md')));
assert.equal(ironHash,'60301dc8d8dd2443443e7afdffd8f1c33e199309668e7e8e6ebdc77932ac4c8b');
const bundled=await build({
  stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Terminal from './app/planning/terminal';import Search from './app/persistent-search';const session=JSON.parse(document.getElementById('fixture-session').textContent);createRoot(document.getElementById('root')).render(<><Search/><Terminal subject={session.subject} displayName={session.displayName}/></>);`,resolveDir:appRoot,loader:'tsx'},
  bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
});
const bundle=bundled.outputFiles[0].text;
const css=readFileSync(join(appRoot,'app/home.css'),'utf8')+'\n'+readFileSync(join(appRoot,'app/planning/planning.css'),'utf8');
let db=new PGlite(dbPath),queue=Promise.resolve();
// One PGlite connection cannot overlap transactions or per-subject SET LOCAL.
const serialized=work=>{const next=queue.then(work);queue=next.catch(()=>{});return next;};
const as=async(subject,work)=>serialized(async()=>{
  await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
  try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[subject]);const result=await work(db);await db.exec('COMMIT');return result;}
  catch(error){await db.exec('ROLLBACK');throw error;}
});
await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');
await db.exec(readFileSync(join(appRoot,'db/003_organization_workflow.sql'),'utf8'));
const sessions=new Map(),requests=[],receipts=[],unexpected=[],serverErrors=[];
const noProviders={};
function session(subject,displayName){const token=randomBytes(24).toString('hex');sessions.set(token,{subject,displayName});return token;}
async function seed(label){
  const owner='fixture-'+label+'-owner',voter='fixture-'+label+'-voter';
  const ownerName='Synthetic facilitator '+label,voterName='Synthetic approver '+label;
  const org=await as(owner,d=>actOnOrganization(d,owner,{action:'create',name:'Synthetic native journey '+label,displayName:ownerName}));
  await as(voter,d=>actOnOrganization(d,voter,{action:'request-membership',organizationId:org.id,displayName:voterName,note:'Synthetic browser acceptance participant'}));
  await as(owner,d=>actOnOrganization(d,owner,{action:'admit-member',organizationId:org.id,subject:voter,role:'contributor'}));
  // Test setup only: the application role cannot grant its own authority.
  for(const [actor,scope]of [[owner,'governance'],[owner,'approve_plan'],[voter,'approve_plan']]){
    await db.query('INSERT INTO dis_organization_authority(organization_id,subject_id,scope,authority_reference,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,now())',[org.id,actor,scope,'SYNTHETIC TEST DELEGATION — no real organization authority','fixture-verifier']);
  }
  return{org,owner,voter,ownerName,voterName,ownerCookie:session(owner,ownerName),voterCookie:session(voter,voterName)};
}
const scenarios=[
  {label:'desktop',context:{viewport:{width:1440,height:1000}},fixture:await seed('desktop')},
  {label:'mobile',context:{...devices['Pixel 7']},fixture:await seed('mobile')},
];
const server=createServer(async(req,res)=>{
  const send=(body,status=200,type='application/json',extra={})=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...extra});res.end(type==='application/json'?JSON.stringify(body):body);};
  try{
    const url=new URL(req.url,'http://127.0.0.1'),token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('fixture_session='))?.slice('fixture_session='.length);
    const current=sessions.get(token);if(!current)return send({error:authBoundary+': missing synthetic session'},401);
    const actor=current.subject;
    if(url.pathname==='/planning')return send(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>DIS native journey — synthetic acceptance fixture</title><link rel="stylesheet" href="/fixture.css"></head><body style="font-family:system-ui;margin:0;background:#f6f8fc;color:#1b3048"><div role="note" style="padding:8px 16px;background:#fff4d8;font-size:12px;overflow-wrap:anywhere">${authBoundary} · Synthetic organization · No external services</div><div id="root"></div><script id="fixture-session" type="application/json">${JSON.stringify(current)}</script><script src="/fixture.js"></script></body></html>`,200,'text/html');
    if(url.pathname==='/fixture.js')return send(bundle,200,'text/javascript');
    if(url.pathname==='/fixture.css')return send(css,200,'text/css');
    if(url.pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
    let input;
    if(req.method==='POST'){let body='';for await(const chunk of req){body+=chunk;if(body.length>1048576)throw new OrganizationError('Fixture request too large',413);}input=JSON.parse(body);}
    const org=url.searchParams.get('organizationId');
    if(url.pathname==='/api/organizations'){
      if(req.method==='GET')return send(await as(actor,async d=>{
        if(!org)return{organizations:await listOrganizations(d)};
        await membership(d,org,actor);
        if(url.searchParams.has('recordId'))return{record:await getRecord(d,org,url.searchParams.get('recordId'))};
        if(url.searchParams.has('historyId'))return{history:await recordHistory(d,org,url.searchParams.get('historyId'),url.searchParams.has('version')?Number(url.searchParams.get('version')):undefined)};
        return organizationSnapshot(d,org,actor,{kind:url.searchParams.get('kind')||undefined,q:url.searchParams.get('q')||undefined,after:url.searchParams.get('after')||undefined});
      }));
      if(req.method==='POST'){
        const event={subject:actor,action:input.action,org:input.organizationId};requests.push(event);
        try{const result=await as(actor,d=>actOnOrganization(d,actor,input));event.status=200;event.recordId=result.id;return send({result});}
        catch(error){event.status=error.status||500;throw error;}
      }
    }
    if(url.pathname==='/api/organizations/ask'){
      if(req.method==='GET')return send(await as(actor,async d=>{await membership(d,org,actor);return{providers:['gpt','gemini'].map(p=>knowledgeProviderStatus(p,noProviders))};}));
      if(req.method==='POST'&&input.action==='prepare'){
        requests.push({subject:actor,action:'ask-prepare',org:input.organizationId,provider:input.provider});
        return send({preview:await as(actor,d=>prepareOrganizationAsk(d,actor,input.organizationId,input.targetId,input.version,input.question,input.provider,noProviders))});
      }
      throw new OrganizationError('Live provider execution is outside this synthetic fixture',503);
    }
    if(url.pathname==='/api/organizations/export'&&url.searchParams.get('format')==='pptx'){
      const data=await as(actor,async d=>{
        await membership(d,org,actor);const record=await getRecord(d,org,url.searchParams.get('id'));
        if(record.version!==Number(url.searchParams.get('version')))throw new OrganizationError('Saved version changed',409);
        const sources=[];for(const id of record.body.sourceIds||[]){const source=await getRecord(d,org,id);if(source.visibility!=='organization')throw new OrganizationError('Source unavailable',409);sources.push(source);}
        return{record,sources};
      });
      // The native presentation helper is real; this fixture is not route/Clerk acceptance.
      const bytes=await buildOrganizationPresentation(data.record,data.sources,JSON.stringify(data,null,2));
      return send(Buffer.from(bytes),200,'application/vnd.openxmlformats-officedocument.presentationml.presentation',{'Content-Disposition':'attachment; filename="synthetic-decision-brief.pptx"'});
    }
    unexpected.push(req.method+' '+url.pathname);return send({error:'Unexpected test-only endpoint'},404);
  }catch(error){if(!(error instanceof OrganizationError))serverErrors.push(error.stack||String(error));send({error:error.message},error.status||500);}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base='http://127.0.0.1:'+server.address().port;
const executablePath=process.env.DIS_E2E_CHROMIUM_PATH||(existsSync(chromium.executablePath())?undefined:'/usr/bin/chromium');
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const outsideRequests=[];
async function contextFor(fixture,role,options){
  const context=await browser.newContext({...options,acceptDownloads:true});
  await context.addCookies([{name:'fixture_session',value:fixture[role+'Cookie'],url:base,httpOnly:true,sameSite:'Strict'}]);
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===base)return route.continue();
    outsideRequests.push(new URL(route.request().url()).origin);return route.abort();
  });
  return context;
}
async function organizationAction(page,name,expected=200,click){
  const [response]=await Promise.all([
    page.waitForResponse(r=>new URL(r.url()).pathname==='/api/organizations'&&r.request().method()==='POST'&&r.request().postDataJSON()?.action===name),
    click(),
  ]);
  const data=await response.json();assert.equal(response.status(),expected,JSON.stringify(data));
  await page.waitForFunction(()=>!document.querySelector('fieldset.org-main')?.disabled);
  return data.result||data;
}
async function overflow(page,label){
  const dimensions=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert.ok(dimensions.document<=dimensions.width+1&&dimensions.body<=dimensions.width+1,label+' page overflow: '+JSON.stringify(dimensions));
  return dimensions;
}
const itemTitle=label=>'Synthetic '+label+' — digital skills adoption';
const implementationValues={
  approach:'Offer four digital skills sessions for participating residents; benefit is not established.',
  approachRationale:'Resident requests suggest a possible need; compare alternatives before wider adoption.',
  setting:'Community learning room with existing instructors and uneven evening transport.',
  determinants:'Instructor time and transport could limit uptake; interview instructors and residents.',
  strategies:'Coach instructors on the delivery workflow and rehearse referral handoffs.',
  delivery:'The learning coordinator invites residents; instructors deliver one session weekly for four weeks.',
  feasibility:'Confirm room access, two instructor hours weekly, accessibility support and proposed resources.',
  fidelityAdaptation:'Retain assisted practice; adjust session timing with a documented rationale and review.',
  implementationOutcomes:'Record instructor adoption, attendance reach and delivery fidelity; current levels UNKNOWN.',
  serviceOutcomes:'Assess participant task completion separately from adoption; measured benefit UNKNOWN.',
  sustainment:'The learning coordinator owns the recurring review and resource handoff after the pilot.',
  reviewTriggers:'Pause if access barriers persist; adapt delivery after the second session review.',
};
try{
  for(const {label,context:options,fixture}of scenarios){
    const checks=[],clientErrors=[],screenshots=[],dimensions=[];
    const ownerContext=await contextFor(fixture,'owner',options),voterContext=await contextFor(fixture,'voter',options);
    const page=await ownerContext.newPage(),voterPage=await voterContext.newPage();
    for(const p of [page,voterPage]){p.setDefaultTimeout(15000);p.on('pageerror',e=>clientErrors.push(e.message));}
    const workspace=page.getByRole('region',{name:'Connected decision workspace'});
    try{
      const navigation=await page.goto(base+'/planning?view=meetings&organizationId='+fixture.org.id,{waitUntil:'domcontentloaded'});
      assert.equal(navigation.status(),200);await page.getByRole('heading',{name:'Meetings & decisions',exact:true}).waitFor();
      await workspace.getByRole('button',{name:'Start with a question',exact:true}).click();
      await workspace.getByLabel('Agenda item or question title',{exact:true}).fill(itemTitle(label));
      await workspace.getByLabel('What are we deciding?',{exact:false}).fill('Should we run a four-session digital skills pilot? The working group needs a decision before scheduling.');
      await workspace.getByLabel('What does success look like?',{exact:false}).fill('Residents can complete useful digital tasks; test the approach before claiming benefit.');
      await workspace.getByLabel('Where and for whom?',{exact:false}).fill('Participating residents and instructors in the community learning room.');
      await workspace.getByLabel('What are we using to inform the discussion?',{exact:false}).fill('Synthetic resident requests and instructor availability are planning inputs; their accuracy is unverified.');
      dimensions.push(await overflow(page,label+' prepare'));
      await workspace.getByRole('button',{name:'Discuss',exact:true}).click();
      await workspace.getByLabel('What choices are on the table?',{exact:false}).fill('Pilot with existing staff, collaborate with a partner, or defer until transport is addressed.');
      await workspace.getByLabel('What is the proposed choice?',{exact:false}).fill('Propose a bounded digital skills pilot after confirming instructor and access capacity.');
      await workspace.getByLabel('Discussion readout and different perspectives',{exact:false}).fill('Instructors prioritize capacity; residents prioritize access. No consensus is inferred.');
      await workspace.getByLabel('Questions and stop points',{exact:false}).fill('Who confirms access, staffing and continuation criteria? Stop if essential support is unavailable.');
      await workspace.getByRole('button',{name:'Before the decision',exact:true}).click();
      await workspace.getByRole('heading',{name:'What should we ask before deciding?',exact:true}).waitFor();
      await workspace.getByLabel('Resources and commitments',{exact:false}).fill('Proposed instructor time and room access still require confirmation; no expenditure is authorized.');
      await workspace.getByLabel('Consequences and safeguards',{exact:false}).fill('Transport and accessibility gaps could exclude residents. Retain a pause and adaptation option.');
      assert.ok(await workspace.locator('.meeting-review-list li').count()>0);
      await workspace.getByRole('button',{name:'Discuss',exact:true}).click();
      checks.push('before_decision_questions_resources_and_safeguards_are_visible');
      const draft=await organizationAction(page,'save-draft',200,()=>workspace.getByRole('button',{name:'Save private draft',exact:true}).click());
      assert.equal(draft.kind,'draft');assert.equal(draft.visibility,'private');assert.equal(draft.version,1);
      const hidden=await voterContext.request.get(base+'/api/organizations?'+new URLSearchParams({organizationId:fixture.org.id,recordId:draft.id}));
      assert.equal(hidden.status(),404);checks.push('question_discussion_saved_as_private_draft','second_member_cannot_read_private_draft');
      await workspace.getByLabel('Questions and stop points',{exact:false}).fill('The facilitator confirms instructor capacity by review day; pause scheduling if the check remains unresolved.');
      assert.equal(await workspace.getByRole('button',{name:'Submit this version for discussion',exact:true}).isDisabled(),true);
      const saved=await organizationAction(page,'save-draft',200,()=>workspace.getByRole('button',{name:'Save private draft',exact:true}).click());
      assert.equal(saved.version,2);checks.push('unsaved_change_blocks_submission','explicit_save_creates_next_version');
      const submission=await organizationAction(page,'submit',200,()=>workspace.getByRole('button',{name:'Submit this version for discussion',exact:true}).click());
      assert.equal(submission.kind,'submission');assert.equal(submission.visibility,'organization');
      const submissionRow=page.locator('.org-table-wrap tr').filter({has:page.locator('small').filter({hasText:/^submission$/})});
      await submissionRow.getByRole('checkbox',{name:'Select '+submission.title,exact:true}).check();
      const proposal=await organizationAction(page,'reconcile',200,()=>page.getByRole('button',{name:'Reconcile reports',exact:true}).click());
      assert.equal(proposal.kind,'proposal');assert.ok(proposal.body.sourceIds.includes(submission.id));
      assert.ok(proposal.body.report.sections.dissent.includes('No consensus is inferred.'));checks.push('submit_exact_version','reconciliation_retains_source_and_dissent');
      await workspace.getByRole('button',{name:'Edit this item',exact:true}).click();
      await workspace.getByRole('button',{name:'Put it into practice',exact:true}).click();
      await workspace.getByRole('button',{name:'Add an implementation plan',exact:true}).click();
      for(const group of IMPLEMENTATION_GROUPS){
        const card=workspace.locator('details').filter({has:page.locator('summary').filter({hasText:group.title})}).first();
        if(!await card.evaluate(el=>el.open))await card.locator('summary').first().click();
        for(const id of group.fields){const field=IMPLEMENTATION_FIELDS.find(f=>f.id===id);await workspace.getByLabel(field.question,{exact:true}).fill(implementationValues[id]);}
      }
      await workspace.getByLabel('Sequence, owners, and handoffs',{exact:false}).fill('The coordinator confirms resources, instructors rehearse, then the working group reviews the bounded pilot.');
      await workspace.getByLabel('Test, learn, and revisit',{exact:false}).fill('Four weeks, with an interim review after session two and a final sustainment decision.');
      const edited=await organizationAction(page,'save-proposal',200,()=>workspace.getByRole('button',{name:'Save proposed revision',exact:true}).click());
      assert.equal(edited.version,proposal.version+1);assert.deepEqual(edited.body.report.implementationScience.fields,implementationValues);
      assert.notEqual(edited.digest,proposal.digest);checks.push('all_twelve_implementation_fields_persist','implementation_and_beneficiary_outcomes_remain_distinct');
      await workspace.getByRole('heading',{name:'Make the approach work here',exact:true}).scrollIntoViewIfNeeded();
      dimensions.push(await overflow(page,label+' implementation'));
      const implementationImage='native-'+label+'-implementation.png';await page.screenshot({path:join(out,implementationImage),fullPage:false});screenshots.push(implementationImage);
      const detail=page.locator('.org-detail');
      const [download]=await Promise.all([page.waitForEvent('download'),detail.getByRole('link',{name:'Export Presentation',exact:true}).click()]);
      const pptxPath=join(out,'native-'+label+'-decision-brief.pptx');await download.saveAs(pptxPath);
      const pptx=await JSZip.loadAsync(readFileSync(pptxPath));
      const xml=(await Promise.all(Object.values(pptx.files).filter(f=>/^ppt\/(slides|notesSlides)\/.*\.xml$/.test(f.name)).map(f=>f.async('string')))).join('\n');
      for(const value of [edited.id,edited.digest,implementationValues.strategies,implementationValues.serviceOutcomes,submission.id])assert.ok(xml.includes(value),'Presentation preserves '+value);
      checks.push('real_presentation_helper_download_preserves_version_sources_and_implementation');
      // Governance is configured through the real UI; verified authority is fixture setup.
      await page.getByRole('navigation',{name:'Organization views'}).getByRole('button',{name:'Governance & access',exact:true}).click();
      await page.getByLabel('Decision body',{exact:true}).fill('Synthetic working group — two authorized approvers');
      await page.getByRole('checkbox',{name:fixture.ownerName,exact:true}).check();
      await page.getByRole('checkbox',{name:fixture.voterName,exact:true}).check();
      await page.getByLabel('Required approvals',{exact:true}).fill('2');
      const policy=await organizationAction(page,'confirm-governance',200,()=>page.getByRole('button',{name:'Record authorized policy',exact:true}).click());
      assert.equal(policy.body.quorum,2);
      await page.getByRole('navigation',{name:'Organization views'}).getByRole('button',{name:'Meetings & decisions',exact:true}).click();
      await page.locator('.org-table-wrap').getByRole('button',{name:edited.title,exact:true}).click();
      await organizationAction(page,'publish-baseline',409,()=>detail.getByRole('button',{name:'Publish only if quorum is satisfied',exact:true}).click());
      await page.getByRole('alert').filter({hasText:'quorum has not approved'}).waitFor();
      await organizationAction(page,'vote',200,()=>detail.getByRole('button',{name:'approve',exact:true}).click());
      await organizationAction(page,'publish-baseline',409,()=>detail.getByRole('button',{name:'Publish only if quorum is satisfied',exact:true}).click());
      checks.push('zero_ballots_cannot_publish','one_ballot_cannot_satisfy_two_person_quorum');
      await voterPage.goto(base+'/planning?view=meetings&organizationId='+fixture.org.id,{waitUntil:'domcontentloaded'});
      await voterPage.locator('.org-table-wrap').getByRole('button',{name:edited.title,exact:true}).click();
      await organizationAction(voterPage,'vote',200,()=>voterPage.locator('.org-detail').getByRole('button',{name:'approve',exact:true}).click());
      const baseline=await organizationAction(page,'publish-baseline',200,()=>detail.getByRole('button',{name:'Publish only if quorum is satisfied',exact:true}).click());
      assert.equal(baseline.kind,'baseline');assert.equal(baseline.body.proposalDigest,edited.digest);assert.equal(baseline.body.proposalVersion,edited.version);
      assert.equal(baseline.body.ballots.length,2);assert.deepEqual(baseline.body.report.implementationScience.fields,implementationValues);
      checks.push('two_browser_members_cast_exact_proposal_ballots','authorized_quorum_creates_immutable_baseline');
      await voterContext.close();
      // Persisted disk state is reopened before the browser reload; no in-memory store substitutes.
      await serialized(async()=>{await db.close();db=new PGlite(dbPath);await db.waitReady;});
      await page.reload({waitUntil:'domcontentloaded'});
      const baselineRow=page.locator('.org-table-wrap tr').filter({has:page.locator('small').filter({hasText:/^baseline$/})});
      await baselineRow.getByRole('button',{name:edited.title,exact:true}).click();
      await workspace.getByRole('button',{name:'Put it into practice',exact:true}).click();
      await workspace.getByText(implementationValues.approach,{exact:true}).waitFor();
      const persisted=await as(fixture.owner,d=>getRecord(d,fixture.org.id,baseline.id));
      assert.equal(persisted.digest,baseline.digest);assert.deepEqual(persisted.body.report,baseline.body.report);
      const history=await as(fixture.owner,d=>recordHistory(d,fixture.org.id,edited.id));assert.equal(history.length,2);
      assert.equal(await workspace.getByRole('button',{name:'Save proposed revision',exact:true}).count(),0);
      dimensions.push(await overflow(page,label+' persisted baseline'));checks.push('database_restart_and_page_reload_preserve_baseline_and_proposal_history','baseline_is_read_only_in_native_workflow');
      const baselineImage='native-'+label+'-baseline.png';await page.screenshot({path:join(out,baselineImage),fullPage:false});screenshots.push(baselineImage);
      await workspace.getByRole('button',{name:'Open work and measures',exact:true}).click();
      await page.getByRole('heading',{name:'Create a work item',exact:true}).waitFor();
      await page.getByText('Connected planning sources',{exact:true}).waitFor();
      const workTitle='Synthetic '+label+' — instructor rehearsal';
      await page.getByLabel('Work item',{exact:true}).fill(workTitle);
      await page.getByLabel('Line of effort',{exact:true}).last().fill('Instructor adoption and delivery');
      await page.getByLabel('Line of operation',{exact:true}).last().fill('Rehearsal before session one');
      await page.getByLabel('Success measure and data source',{exact:true}).fill('Coordinator records whether instructors rehearse the agreed workflow.');
      await page.getByLabel('Measured baseline or UNKNOWN',{exact:true}).fill('UNKNOWN');
      await page.getByLabel('Proposed target',{exact:true}).fill('Both proposed instructors complete a supported rehearsal.');
      await page.getByLabel('Review / due date',{exact:true}).fill('2027-01-08');
      await page.getByRole('combobox',{name:/^Responsible member/}).selectOption(fixture.owner);
      const work=await organizationAction(page,'save-task',200,()=>page.getByRole('button',{name:'Save work item',exact:true}).click());
      assert.equal(work.kind,'task');assert.deepEqual(work.body.sourceIds,[baseline.id]);assert.equal(work.body.baseline,'UNKNOWN');assert.equal(work.body.status,'planned');
      await page.reload({waitUntil:'domcontentloaded'});
      await page.getByRole('navigation',{name:'Organization views'}).getByRole('button',{name:'Operations & measures',exact:true}).click();
      await page.locator('.org-table-wrap').getByRole('button',{name:workTitle,exact:true}).click();
      await page.locator('.org-detail').getByRole('button',{name:'Edit task',exact:true}).click();
      await page.getByText('Connected planning sources',{exact:true}).waitFor();
      assert.equal(await page.getByLabel('Measured baseline or UNKNOWN',{exact:true}).inputValue(),'UNKNOWN');
      assert.equal(await page.getByRole('combobox',{name:/^Responsible member/}).inputValue(),fixture.owner);
      await page.getByLabel('Progress, barriers and receipts',{exact:true}).fill('Instructor rehearsal scheduled; no completion or benefit established.');
      const changedWork=await organizationAction(page,'save-task',200,()=>page.getByRole('button',{name:'Save work item',exact:true}).click());
      assert.equal(changedWork.version,2);assert.deepEqual(changedWork.body.sourceIds,[baseline.id]);
      assert.deepEqual((await as(fixture.owner,d=>getRecord(d,fixture.org.id,work.id))).body.sourceIds,[baseline.id]);
      dimensions.push(await overflow(page,label+' linked work'));
      checks.push('baseline_handoff_creates_work_linked_to_immutable_source','reload_and_edit_preserve_work_source_and_unknown_baseline');
      await page.getByRole('navigation',{name:'Organization views'}).getByRole('button',{name:'Ask our knowledge',exact:true}).click();
      await page.getByRole('combobox',{name:/^Shared plan or decision/}).selectOption(baseline.id);
      await page.getByLabel('Your question',{exact:true}).fill('What digital skills adoption and delivery barriers should we review?');
      for(const provider of ['gpt','gemini']){
        await page.getByRole('combobox',{name:/^Answer with/}).selectOption(provider);
        const [response]=await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname==='/api/organizations/ask'&&r.request().method()==='POST'),page.getByRole('button',{name:'Find supporting sources',exact:true}).click()]);
        assert.equal(response.status(),200);const {preview}=await response.json();assert.equal(preview.retrieval.layer,'PASSAGES');assert.equal(preview.provider.configured,false);assert.equal(preview.canExecute,false);
        await page.getByRole('heading',{name:'Source passages found',exact:true}).waitFor();
        await page.getByRole('checkbox',{name:/Send this exact question and source selection/}).check();
        assert.equal(await page.getByRole('button',{name:'Ask '+preview.provider.label,exact:true}).isDisabled(),true);
        assert.ok(preview.retrieval.passages.some(p=>p.recordId===baseline.id));
        assert.ok(preview.retrieval.passages.every(p=>[baseline.id,submission.id].includes(p.recordId)));
        for(const passage of preview.retrieval.passages){
          const content=passage.text.replaceAll('Perspective — '+submission.title,'').trim();
          assert.ok(content&&!/^(UNKNOWN|NOT SUPPLIED)$/i.test(content),'Provenance-only reconciliation text must not count as supporting content: '+passage.field);
        }
        assert.ok(preview.retrieval.passages.some(p=>p.field.startsWith('implementationScience.')),'A question about adoption and delivery must retrieve substantive implementation content present in this saved plan.');
        const excerpt=page.locator('.knowledge-passages details').first();await excerpt.locator('summary').click();
        assert.equal(await excerpt.locator('blockquote').textContent(),preview.retrieval.passages[0].text);
        assert.ok((await excerpt.locator('small').textContent()).includes(preview.retrieval.passages[0].sha256));
      }
      dimensions.push(await overflow(page,label+' knowledge'));checks.push('gpt_and_gemini_source_preview_uses_real_authorized_retrieval','provenance_only_sections_do_not_displace_substantive_implementation_passages','unconfigured_provider_remains_disabled_after_consent');
      await page.getByRole('heading',{name:'Source passages found',exact:true}).scrollIntoViewIfNeeded();
      const knowledgeImage='native-'+label+'-knowledge.png';await page.screenshot({path:join(out,knowledgeImage),fullPage:false});screenshots.push(knowledgeImage);
      assert.deepEqual(clientErrors,[]);assert.deepEqual(serverErrors,[]);assert.deepEqual(outsideRequests,[]);assert.deepEqual(unexpected,[]);
      receipts.push({label,state:'PASSED',authBoundary,engine:'chromium',device:label==='mobile'?'Pixel 7 emulation':'desktop',checks,dimensions,screenshots,proposal:{id:edited.id,version:edited.version,digest:edited.digest},baseline:{id:baseline.id,version:baseline.version,digest:baseline.digest},clientErrors});
      console.log('PASS native '+label+': '+checks.length+' journey assertions');
    }catch(error){
      await page.screenshot({path:join(out,'native-'+label+'-failure.png'),fullPage:false}).catch(()=>{});
      receipts.push({label,state:'FAILED',authBoundary,checks,error:error.stack||String(error),clientErrors,serverErrors});throw error;
    }finally{await ownerContext.close();await voterContext.close();}
  }
}finally{
  writeFileSync(join(out,'organization-native-receipt.json'),JSON.stringify({
    authBoundary,sourceRevision,workingTreeInputs:inputs,iron:{version:'1.0.0',sha256:ironHash},bundleSha256:sha256(bundle),
    observedAt:new Date().toISOString(),clerkAcceptance:false,productionDeploymentAcceptance:false,liveDatabase:false,
    database:'Persistent synthetic PGlite with schema003 and SET LOCAL ROLE dis_app_safe',providerCalls:0,
    outsideRequests,unexpected,serverErrors,requests,receipts,
  },null,2));
  await browser.close();await new Promise(resolve=>server.close(resolve));await queue;await db.close();rmSync(dbPath,{recursive:true,force:true});
}
