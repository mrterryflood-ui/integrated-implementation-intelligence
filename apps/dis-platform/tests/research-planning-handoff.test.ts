import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import JSZip from 'jszip';
import {colorectalEvidenceAction} from '../lib/evidence-action-colorectal';
import {buildEvidenceActionCaseHandoff} from '../lib/evidence-action-case-handoff';
import {buildPlaybook} from '../lib/decision-playbook';
import {retainResearchForReassessment} from '../lib/saved-research-evidence';
import {emptyResearchWorkflow,WORKFLOW_FIELDS} from '../lib/research-workflow';
import {buildResearchPlanningSnapshot,researchPlanningDigest,researchPlanningReport,researchPlanningSections,validateResearchPlanningSnapshot,wordPresentationText} from '../lib/research-planning-handoff';
import {actOnOrganization,getRecord,recordHistory} from '../lib/organizations/service';
import type {Queryable} from '../lib/organizations/database';

function source(){
 const {program,bridge}=colorectalEvidenceAction(),handoff=buildEvidenceActionCaseHandoff(program,bridge);
 const workflow=emptyResearchWorkflow();workflow.publicAggregateConfirmed=true;workflow.frameworks=['CFIR','RE_AIM'];
 for(const [key] of WORKFLOW_FIELDS)workflow.narrative[key]='SYNTHETIC '+key+' narrative retained for review';
 workflow.studyText=JSON.stringify({fixture:'SYNTHETIC retained workflow marker',status:'DRAFT'});
 workflow.counterfactualText=JSON.stringify({fixture:'SYNTHETIC counterfactual draft'});
 workflow.correctionReceiptText=JSON.stringify({fixture:'SYNTHETIC correction receipt draft'});
 workflow.retrievalQuery='SYNTHETIC actual retrieval query retained separately';
 workflow.supplementText=JSON.stringify({notes:[{id:'outcome-note-fixture',kind:'OUTCOME',text:'SYNTHETIC outcome marker',gapIds:[],origin:'SYNTHETIC'}]});
 const report:Record<string,unknown>={...handoff.report,workflow};
 const playbook=buildPlaybook(handoff.question,handoff.report);playbook.progressNotes=['SYNTHETIC learning note to preserve'];playbook.metrics[0].observed='SYNTHETIC reported value';playbook.metrics[0].verified=true;
 return {id:randomUUID(),workspace_id:randomUUID(),version:1,title:handoff.title,question:handoff.question,report,playbook};
}
test('fixed research snapshot survives JSON key reordering, retains inputs and does not promote reported verification',()=>{
 const row=source(),snapshot=buildResearchPlanningSnapshot(row);
 const reordered=JSON.parse(JSON.stringify(snapshot,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).reverse()):value));
 assert.deepEqual(validateResearchPlanningSnapshot(reordered),snapshot);
 assert.equal(snapshot.claimState,'RECORDED_NOT_INDEPENDENTLY_VERIFIED');assert.equal(snapshot.interventionAuthorized,false);
 assert.deepEqual(snapshot.report,row.report);assert.deepEqual(snapshot.playbook,row.playbook);
 row.playbook.progressNotes.push('Later unsaved note');assert.notDeepEqual(snapshot.playbook,row.playbook);
 const report=researchPlanningReport(snapshot);assert.equal(report.sections.recommendation,'UNKNOWN');assert.match(report.sections.question,/SYNTHETIC problem narrative/);
 const readable=researchPlanningSections(snapshot).map(section=>section.title+'\n'+section.text).join('\n');
 assert.match(readable,/SYNTHETIC retained workflow marker/);assert.match(readable,/SYNTHETIC outcome marker/);assert.match(readable,/SYNTHETIC learning note/);assert.match(readable,/does not independently verify/);assert.match(readable,/SYNTHETIC actual retrieval query retained separately/);
 assert.equal(researchPlanningDigest({b:1,a:[2,3]}),researchPlanningDigest({a:[2,3],b:1}));
});
test('legacy v1 and retainedResearch wrappers preserve complete assessments without rewriting the research source',()=>{
 const row=source();delete row.report.workflow;
 assert.deepEqual(buildResearchPlanningSnapshot(row).report,row.report);
 const wrapped=retainResearchForReassessment(row.report,{state:'PRELIMINARY_DELIBERATION',advice:'SYNTHETIC advice retained as recorded'});
 const snapshot=buildResearchPlanningSnapshot({...row,report:wrapped});assert.deepEqual(snapshot.report,wrapped);
 assert.match(researchPlanningSections(snapshot).map(section=>section.text).join('\n'),/SYNTHETIC advice/);
 assert.throws(()=>buildResearchPlanningSnapshot({...row,report:{state:'NOT_RUN'}}),/no supported retained research/);
});
test('tampered fingerprints, unbounded content and non-JSON values fail visibly',()=>{
 const row=source(),snapshot=buildResearchPlanningSnapshot(row);
 assert.throws(()=>validateResearchPlanningSnapshot({...snapshot,question:'A substituted research question'}),/fingerprint/);
 assert.throws(()=>validateResearchPlanningSnapshot({...snapshot,interventionAuthorized:true}),/Invalid retained/);
 assert.throws(()=>validateResearchPlanningSnapshot({...snapshot,added:'unbound'}),/fingerprint/);
 assert.throws(()=>buildResearchPlanningSnapshot({...row,report:{...row.report,padding:'x'.repeat(128001)}}),/bounded/);
 assert.throws(()=>researchPlanningDigest({value:Infinity}),/finite JSON/);
});
test('Word presentation escapes XML-invalid characters without changing valid Unicode or the supplied text',()=>{
 const text='A\uFFFE\uFFFF\uD800\u0003\t\n\r😀';
 assert.equal(wordPresentationText(text),'A\\uFFFE\\uFFFF\\uD800\\u0003\t\n\r😀');
 assert.equal(text,'A\uFFFE\uFFFF\uD800\u0003\t\n\r😀');
});

test('actual service, SQL/RLS and export handler retain research through private draft, submission and reconciliation',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'dis-research-planning-'));
 let db=new PGlite(directory);await db.waitReady;
 await db.exec(readFileSync('tests/fixtures/casework-recovery-schema.sql','utf8'));
 await db.exec(readFileSync('db/003_organization_workflow.sql','utf8'));
 async function as<T>(actor:string,work:(q:Queryable)=>Promise<T>):Promise<T>{
  await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
  try{await db.query("SELECT set_config('dis.subject_id',$1,true)",[actor]);const result=await work(db as Queryable);await db.exec('COMMIT');return result;}
  catch(error){await db.exec('ROLLBACK');throw error;}
 }
 const act=(actor:string,input:unknown)=>as(actor,q=>actOnOrganization(q,actor,input));
 const row=source();
 async function seedCase(actor:string,value=source()){
  await db.query('INSERT INTO dis_subjects(subject_id) VALUES($1) ON CONFLICT DO NOTHING',[actor]);
  await db.query('INSERT INTO dis_workspaces(id,owner_subject,title) VALUES($1,$2,$3)',[value.workspace_id,actor,'Synthetic research workspace']);
  await db.query('INSERT INTO dis_casework(id,workspace_id,owner_subject,title,question,report,playbook) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)',[value.id,value.workspace_id,actor,value.title,value.question,JSON.stringify(value.report),JSON.stringify(value.playbook)]);
  return value;
 }
 const outDirParent=resolve('test-results');mkdirSync(outDirParent,{recursive:true});
 const bundleDir=mkdtempSync(join(outDirParent,'research-planning-export-'));
 const globalKey='__researchPlanningExport_'+randomUUID().replaceAll('-','');
 try{
  await seedCase('bob',row);const viewerCase=await seedCase('viewer');
  const org:any=await act('alice',{action:'create',name:'Synthetic research planning organization',displayName:'Alice'});
  for(const actor of ['bob','viewer']){await act(actor,{action:'request-membership',organizationId:org.id,displayName:actor,note:'Synthetic fixture'});await act('alice',{action:'admit-member',organizationId:org.id,subject:actor,role:actor==='viewer'?'viewer':'contributor'});}
  const request={action:'import-research-case',organizationId:org.id,caseId:row.id,caseVersion:1,confirmedPublicAggregate:true};
  const status=(expected:number)=>(error:unknown)=>Boolean(error)&&typeof error==='object'&&(error as {status?:number}).status===expected;
  await t.test('confirmation, current version and reference-only admission are required before writing',async()=>{
   await assert.rejects(act('bob',{...request,confirmedPublicAggregate:false}),status(400));
   await assert.rejects(act('bob',{...request,caseVersion:'1'}),status(400));
   await assert.rejects(act('bob',{...request,caseVersion:2}),status(409));
   await assert.rejects(act('bob',{...request,report:{state:'FORGED'}}),status(400));
   assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_organization_records WHERE kind='draft'")).rows[0].n,0);
  });
  await t.test('another case owner, nonmember and read-only member cannot import the case',async()=>{
   await assert.rejects(act('alice',request),status(404));
   await assert.rejects(act('outsider',request),status(404));
   await assert.rejects(act('viewer',{...request,caseId:viewerCase.id}),status(403));
  });
  const draft:any=await act('bob',request);
  await t.test('server copy is private, exact and grants no sharing or review consent',async()=>{
   assert.equal(draft.kind,'draft');assert.equal(draft.visibility,'private');assert.equal(draft.owner_subject,'bob');
   assert.deepEqual(draft.body.researchSnapshot,buildResearchPlanningSnapshot(row));
   assert.equal((await db.query<{n:number}>("SELECT count(*)::int AS n FROM dis_organization_records WHERE kind IN ('submission','council')")).rows[0].n,0);
   assert.equal((await db.query<{n:number}>('SELECT count(*)::int AS n FROM dis_organization_consents')).rows[0].n,0);
   await assert.rejects(as('alice',q=>getRecord(q,org.id,draft.id)),status(404));
   assert.equal((await as('alice',q=>q.query('SELECT * FROM dis_organization_versions WHERE record_id=$1',[draft.id]))).rows.length,0);
   await assert.rejects(act('bob',{action:'submit',organizationId:org.id,id:draft.id,version:draft.version}),/recommendation/);
  });
  const editedReport=structuredClone(draft.body.report);editedReport.sections.recommendation='SYNTHETIC human recommendation: compare the documented gaps before adopting any intervention.';
  const edited:any=await act('bob',{action:'save-draft',organizationId:org.id,id:draft.id,version:draft.version,report:editedReport,researchSnapshot:{forged:true}});
  await t.test('draft edits and repeated handoff preserve the source and do not overwrite planning work',async()=>{
   assert.deepEqual(edited.body.researchSnapshot,draft.body.researchSnapshot);
   const retry:any=await act('bob',request);assert.equal(retry.id,edited.id);assert.equal(retry.version,edited.version);assert.deepEqual(retry.body.report,editedReport);
   assert.equal((await as('bob',q=>recordHistory(q,org.id,edited.id))).length,2);
  });
  const changedReport={...row.report,revisionNote:'SYNTHETIC later source revision'};
  await as('bob',q=>q.query('UPDATE dis_casework SET report=$1::jsonb,version=version+1 WHERE id=$2',[JSON.stringify(changedReport),row.id]));
  await t.test('later case changes require a new explicit handoff and never rewrite a prior snapshot',async()=>{
   await assert.rejects(act('bob',request),status(409));
   const next:any=await act('bob',{...request,caseVersion:2});assert.notEqual(next.id,draft.id);assert.equal(next.body.researchSnapshot.source.caseVersion,2);
   assert.deepEqual((await as('bob',q=>getRecord(q,org.id,draft.id))).body.researchSnapshot,draft.body.researchSnapshot);
  });
  const submitted:any=await act('bob',{action:'submit',organizationId:org.id,id:edited.id,version:edited.version});
  const proposal:any=await act('alice',{action:'reconcile',organizationId:org.id,selected:[{id:submitted.id,version:submitted.version}],title:'Synthetic research proposal'});
  await t.test('explicit submission copies the frozen source and reconciliation retains its immutable submission reference',async()=>{
   assert.deepEqual(submitted.body.researchSnapshot,draft.body.researchSnapshot);assert.equal(submitted.visibility,'organization');
   assert.deepEqual(proposal.body.sourceIds,[submitted.id]);assert.equal(proposal.body.manifest.inputs[0].revision,submitted.version);
   assert.deepEqual((await as('alice',q=>getRecord(q,org.id,submitted.id))).body.researchSnapshot,draft.body.researchSnapshot);
   assert.equal((await db.query<{n:number}>('SELECT count(*)::int AS n FROM dis_organization_consents')).rows[0].n,0);
  });
  await t.test('new connection restores the exact private planning source and edited recommendation',async()=>{
   await db.close();db=new PGlite(directory);await db.waitReady;
   const restored=await as('bob',q=>getRecord(q,org.id,edited.id));assert.deepEqual(restored.body.researchSnapshot,draft.body.researchSnapshot);assert.deepEqual(restored.body.report,editedReport);
  });
  const state={actor:'bob',transaction:(callback:(q:Queryable)=>Promise<unknown>)=>as(state.actor,callback)};
  (globalThis as any)[globalKey]=state;
  const outfile=join(bundleDir,'export.mjs');
  await build({entryPoints:[resolve('app/api/organizations/export/route.ts')],outfile,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent',plugins:[{name:'isolated-export-boundary',setup(builder){
   builder.onResolve({filter:/lib\/organizations\/(http|database)$/},args=>({path:args.path.endsWith('/http')?'http':'database',namespace:'isolated-export'}));
   builder.onLoad({filter:/.*/,namespace:'isolated-export'},args=>({contents:args.path==='http'?`const state=globalThis[${JSON.stringify(globalKey)}];export async function organizationActor(){return state.actor;}export function organizationFailure(error){return Response.json({error:error.message},{status:error.status||503});}`:`const state=globalThis[${JSON.stringify(globalKey)}];export function inOrganizationTransaction(actor,work){if(actor!==state.actor)throw Error('Unexpected fixture actor');return state.transaction(work);}`,loader:'js'}));
  }}]});
  const route=await import(pathToFileURL(outfile).href);
  const exported=(record:any,format:string)=>route.GET(new Request('https://fixture.example/api/organizations/export?'+new URLSearchParams({organizationId:org.id,id:record.id,version:String(record.version),format}))) as Promise<Response>;
  await t.test('actual JSON, Markdown and Word export retain private snapshot and readable research appendix',async()=>{
   const json=await exported(edited,'json');assert.equal(json.status,200);assert.match(json.headers.get('cache-control')||'',/private, no-store/);
   assert.deepEqual((await json.json()).record.body.researchSnapshot,draft.body.researchSnapshot);
   const markdown=await exported(edited,'md');assert.equal(markdown.status,200);const content=await markdown.text();assert.match(content,/Research case provenance/);assert.match(content,/SYNTHETIC outcome marker/);assert.match(content,/SYNTHETIC learning note/);assert.ok(content.includes(draft.body.researchSnapshot.sourceDigest));for(const [key,label] of WORKFLOW_FIELDS){assert.ok(content.includes(label));assert.ok(content.includes('SYNTHETIC '+key+' narrative'));}assert.match(content,/Full retained research snapshot \(JSON\)/);
   const word=await exported(edited,'docx');assert.equal(word.status,200);const archive=await JSZip.loadAsync(await word.arrayBuffer());const document=await archive.file('word/document.xml')!.async('string');assert.match(document,/Research case provenance/);assert.match(document,/SYNTHETIC retained workflow marker/);assert.match(document,/SYNTHETIC outcome marker/);assert.match(document,/SYNTHETIC learning note/);assert.match(document,/First warning sign and time-zero definition/);assert.match(document,/SYNTHETIC funding narrative/);assert.match(document,/Full retained research snapshot/);
   const headings=[...document.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].filter(match=>/<w:pStyle w:val="(?:Title|Heading[12])"\s*\/>/.test(match[1]));
   assert.ok(headings.length>20,'The complete planning and research section headings are present');
   for(const heading of headings)assert.match(heading[1],/<w:keepNext\s*\/>/,'Every heading stays with its following content');
   assert.match(content,/No linked organizational source records were attached to this saved record\./);
   assert.match(document,/No linked organizational source records were attached to this saved record\./);
  });
  await t.test('actual reconciled export retains linked snapshot; inaccessible and stale exports fail',async()=>{
   state.actor='alice';
   const json=await exported(proposal,'json');assert.equal(json.status,200);const body=await json.json();assert.deepEqual(body.sources[0].body.researchSnapshot,draft.body.researchSnapshot);
   const markdown=await exported(proposal,'md');assert.equal(markdown.status,200);const text=await markdown.text();assert.match(text,/SYNTHETIC outcome marker/);assert.doesNotMatch(text,/No linked organizational source records were attached/);
   assert.equal((await exported(edited,'json')).status,404);
   assert.equal((await exported({...proposal,version:proposal.version+1},'json')).status,409);
  });
  await t.test('Word escapes accepted XML noncharacters while frozen JSON, Markdown and digest remain exact',async()=>{
   const unusual=source();unusual.title+='\uFFFE';unusual.question+='\uFFFF';
   (unusual.report.workflow as ReturnType<typeof emptyResearchWorkflow>).narrative.problem+='\uFFFE\uFFFF';
   unusual.playbook.progressNotes.push('SYNTHETIC text with \uFFFE and \uFFFF');
   await seedCase('bob',unusual);
   const retained:any=await act('bob',{...request,caseId:unusual.id,caseVersion:1});state.actor='bob';
   const original=buildResearchPlanningSnapshot(unusual),jsonResponse=await exported(retained,'json');assert.equal(jsonResponse.status,200);
   const downloaded=(await jsonResponse.json()).record.body.researchSnapshot;assert.deepEqual(downloaded,original);assert.equal(downloaded.sourceDigest,original.sourceDigest);
   const markdownResponse=await exported(retained,'md');assert.equal(markdownResponse.status,200);const markdown=await markdownResponse.text();assert.ok(markdown.includes('\uFFFE'));assert.ok(markdown.includes('\uFFFF'));
   const response=await exported(retained,'docx');assert.equal(response.status,200);const zip=await JSZip.loadAsync(await response.arrayBuffer()),xml=await zip.file('word/document.xml')!.async('string');
   assert.doesNotMatch(xml,/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/u);assert.match(xml,/\\uFFFE/);assert.match(xml,/\\uFFFF/);assert.match(xml,/Word presentation note/);assert.ok(xml.includes(original.sourceDigest));
   assert.deepEqual((await as('bob',q=>getRecord(q,org.id,retained.id))).body.researchSnapshot,original);
  });
  await act('bob',{action:'withdraw',organizationId:org.id,id:submitted.id,version:submitted.version});
  await t.test('withdrawn sources stop later proposal exports instead of silently disappearing',async()=>{
   state.actor='alice';const response=await exported(proposal,'md');assert.ok([404,409].includes(response.status));
  });
  await act('alice',{action:'revoke-member',organizationId:org.id,subject:'bob'});
  await t.test('revoked membership blocks a new handoff and access to the earlier private draft',async()=>{
   await assert.rejects(act('bob',{...request,caseVersion:2}),status(404));
   await assert.rejects(as('bob',q=>getRecord(q,org.id,draft.id)),status(404));
  });
 }finally{delete (globalThis as any)[globalKey];await db.close();rmSync(directory,{recursive:true,force:true});rmSync(bundleDir,{recursive:true,force:true});}
});
