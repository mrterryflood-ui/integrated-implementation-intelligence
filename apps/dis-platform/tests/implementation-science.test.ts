import test from 'node:test';
import assert from 'node:assert/strict';
import {Document,Packer,Paragraph} from 'docx';
import JSZip from 'jszip';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {normalizeReport,planDigest,reportText,reportFromText,reconciliationInput,approvalStatus,PLANNING_SECTIONS,type PlanningReport} from '../lib/planning-contract';
import {emptyImplementationScience,IMPLEMENTATION_FIELDS,IMPLEMENTATION_SCIENCE_SCHEMA,IMPLEMENTATION_FIELD_LIMIT,implementationReviewQuestions,normalizeImplementationScience,implementationTextFields,implementationEvidenceReferences,implementationSections,type ImplementationScience} from '../lib/implementation-science';
import {extractPlanningFile} from '../lib/organizations/imports';
import {claimOrganizationCouncil,finishOrganizationCouncil,organizationCouncilContext} from '../lib/organizations/council';
import type {Queryable} from '../lib/organizations/database';
import {buildOrganizationPresentation} from '../lib/organizations/presentation';
import {actOnOrganization,getRecord} from '../lib/organizations/service';

const sourceId='00000000-0000-4000-8000-000000000001';
const orgId='00000000-0000-4000-8000-000000000002';
const proposalId='00000000-0000-4000-8000-000000000003';
const legacy=():PlanningReport=>({schemaVersion:'dis.planning.report.v1',title:'Legacy plan',sections:Object.fromEntries(PLANNING_SECTIONS.map(([id])=>[id,id==='question'?'How should we introduce the service?':id==='implementation'?'Assign the work and review delivery.':''])) as PlanningReport['sections']});
function science():ImplementationScience{
  const value=emptyImplementationScience();
  value.fields.approach='Offer evening digital skills sessions to adults seeking practical computer skills.';
  value.fields.approachRationale='The need is proposed; local participant evidence remains UNKNOWN.';
  value.fields.setting='A community learning site. Review the actual registration workflow.';
  value.fields.determinants='Hypothesis: session times limit participation. Ask affected people.';
  value.fields.strategies='Coach instructors to deliver the practice; investigate whether coaching addresses a documented barrier.';
  value.fields.delivery='Instructors deliver practical sessions weekly; capacity is not yet confirmed.';
  value.fields.implementationOutcomes='Adoption baseline: 0 of 4 instructors in this synthetic fixture. Proposed target: review after the pilot.';
  value.fields.serviceOutcomes='Beneficiary improvement is not yet measured. Completed sessions do not establish improved skills.';
  value.evidenceRefs={approachRationale:[{recordId:sourceId,version:2,digest:'a'.repeat(64),passage:{startOffset:0,endOffset:12,sha256:'b'.repeat(64)}}]};
  return value;
}
function extended():PlanningReport{return {...legacy(),implementationScience:science()};}

test('legacy canonical shape and established ballot digest remain byte-compatible',()=>{
  const report=normalizeReport({...legacy(),implementationScience:undefined});
  assert.equal(Object.hasOwn(report,'implementationScience'),false);
  assert.equal(JSON.stringify(report),JSON.stringify(legacy()));
  assert.equal(planDigest(report),'0274f96645e0bf2121735c5b77e529fc5127c58788f76999c7e10b3592681210');
  assert.deepEqual(reportFromText(reportText(report)),report);
  assert.equal(reportText(report).includes('implementationScience'),false);
});

test('implementation and service outcomes remain separate, with zero and unknown preserved',()=>{
  const report=normalizeReport(extended()),plan=report.implementationScience!;
  assert.match(plan.fields.implementationOutcomes,/0 of 4/);
  assert.match(plan.fields.serviceOutcomes,/not yet measured/);
  assert.match(plan.fields.approachRationale,/UNKNOWN/);
  assert.notEqual(plan.fields.approach,plan.fields.strategies);
  assert.equal(Object.hasOwn(plan,'readinessScore'),false);
  const questions=implementationReviewQuestions(plan);
  assert.ok(questions.some(item=>item.field==='sustainment'));
  assert.ok(questions.some(item=>item.field==='fidelityAdaptation'));
  const activityComplete={...plan,fields:{...plan.fields,delivery:'All tasks complete'}};
  assert.ok(implementationReviewQuestions(activityComplete).some(item=>item.field==='sustainment'));
  const allEntered={...plan,fields:Object.fromEntries(IMPLEMENTATION_FIELDS.map(({id})=>[id,'Entered, unverified'])) as ImplementationScience['fields']};
  assert.deepEqual(implementationReviewQuestions(allEntered),[]);
  assert.equal(Object.hasOwn(allEntered,'approved'),false);
  assert.equal(implementationSections(plan).find(section=>section.id==='serviceOutcomes')?.text,plan.fields.serviceOutcomes);
});

test('a changed approach, setting, strategy, or measure cannot inherit an earlier plan ballot',()=>{
  const report=extended(),g={version:1,authoritySource:'SYNTHETIC charter',decisionBody:'Test committee',approverSubjects:['member'],quorum:1,confirmedAt:'2026-11-27T12:00:00Z'};
  const ballot={subject:'member',planDigest:planDigest(report),governanceVersion:1,decision:'approve' as const,recordedAt:'2026-11-27T12:10:00Z'};
  assert.equal(approvalStatus(g,report,[ballot]).state,'APPROVED');
  for(const field of ['approach','setting','strategies','implementationOutcomes','serviceOutcomes'] as const){
    const changed={...report,implementationScience:{...report.implementationScience!,fields:{...report.implementationScience!.fields,[field]:'Revised proposal'}}};
    assert.notEqual(planDigest(changed),planDigest(report));
    assert.equal(approvalStatus(g,changed,[ballot]).state,'PENDING');
  }
});

test('typed fields reject unknown content, false readiness metadata, invalid provenance and excessive input',()=>{
  const value=science();
  assert.throws(()=>normalizeImplementationScience({...value,readinessScore:100}),/Unknown/);
  assert.throws(()=>normalizeImplementationScience({...value,schemaVersion:'future'}),/Unsupported/);
  assert.throws(()=>normalizeImplementationScience({...value,fields:{...value.fields,unknown:'Dropped?'}}),/Unknown/);
  assert.throws(()=>normalizeImplementationScience({...value,fields:{...value.fields,approach:null}}),/Invalid/);
  assert.throws(()=>normalizeImplementationScience({...value,fields:{...value.fields,approach:'x'.repeat(IMPLEMENTATION_FIELD_LIMIT+1)}}),/oversized/);
  for(const reference of [
    {recordId:sourceId,version:0,digest:'a'.repeat(64)},
    {recordId:sourceId,version:1,digest:'not-a-digest'},
    {recordId:sourceId,version:1,digest:'a'.repeat(64),verified:true},
    {recordId:sourceId,version:1,digest:'a'.repeat(64),passage:{startOffset:4,endOffset:4,sha256:'b'.repeat(64)}},
  ])assert.throws(()=>normalizeImplementationScience({...value,evidenceRefs:{approach:[reference]}}));
  const refs=implementationEvidenceReferences(value);
  assert.equal(refs.length,1);assert.equal(refs[0].version,2);assert.equal(Object.hasOwn(refs[0],'verified'),false);
  assert.throws(()=>normalizeImplementationScience({...value,evidenceRefs:{approach:[refs[0],refs[0]]}}),/Duplicate/);
});

test('JSON, legacy content alias, marked text and actual DOCX preserve the extension and exact references',async()=>{
  const report=normalizeReport(extended());
  assert.deepEqual(reportFromText(reportText(report)),report);
  for(const input of [report,{schemaVersion:report.schemaVersion,title:report.title,content:report.sections,implementationScience:report.implementationScience}]){
    const result=await extractPlanningFile('plan.json',Buffer.from(JSON.stringify(input)));
    assert.deepEqual(result.report,report);assert.equal(result.requiresMemberReview,true);
  }
  const document=new Document({sections:[{children:reportText(report).split('\n').map(text=>new Paragraph(text))}]});
  const result=await extractPlanningFile('plan.docx',await Packer.toBuffer(document));
  assert.deepEqual(result.report,report);
});

test('CSV and XLSX editable fields retain the same implementation plan',async()=>{
  const report=normalizeReport(extended());
  const rows=[['schemaVersion',report.schemaVersion],['title',report.title],...PLANNING_SECTIONS.map(([id])=>[id,report.sections[id]]),...implementationTextFields(report.implementationScience).map(field=>[field.id,field.text])];
  const csv=rows.map(row=>row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',')).join('\r\n');
  assert.deepEqual((await extractPlanningFile('plan.csv',Buffer.from(csv))).report,report);
  const xml=(text:string)=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const zip=new JSZip();zip.file('xl/workbook.xml','<workbook/>');
  zip.file('xl/worksheets/sheet1.xml','<worksheet><sheetData>'+rows.map((row,index)=>'<row r="'+(index+1)+'">'+row.map((value,column)=>'<c r="'+String.fromCharCode(65+column)+(index+1)+'" t="inlineStr"><is><t>'+xml(value)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData></worksheet>');
  assert.deepEqual((await extractPlanningFile('plan.xlsx',await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}))).report,report);
  const missingVersion=reportText(report).replace('[DIS_FIELD:implementationScienceSchemaVersion]','[DIS_FIELD:implementationScienceBogus]');
  assert.throws(()=>reportFromText(missingVersion),/Unknown/);
  const reservedMarker={...report,implementationScience:{...report.implementationScience!,fields:{...report.implementationScience!.fields,setting:'Before [DIS_END_FIELD] important setting evidence after'}}};
  assert.throws(()=>reportFromText(reportText(reservedMarker)),/Duplicate end marker/);
});

test('reconciliation preserves disagreements and missing perspectives without averaging them',()=>{
  const first=extended(),second=extended();second.implementationScience!.fields.strategies='Use workflow redesign rather than instructor coaching.';
  const result=reconciliationInput([{id:'a',revision:1,authorLabel:'A',visibility:'submitted',report:first},{id:'b',revision:1,authorLabel:'B',visibility:'submitted',report:second},{id:'c',revision:1,authorLabel:'C',visibility:'submitted',report:legacy()}]);
  const strategies=result.implementationScience!.fields.find(field=>field.id==='strategies')!;
  assert.equal(strategies.requiresDiscussion,true);assert.equal(strategies.perspectives[2].supplied,false);
  assert.equal(strategies.perspectives[0].text,first.implementationScience!.fields.strategies);
  assert.equal(strategies.perspectives[1].text,second.implementationScience!.fields.strategies);
  assert.equal(result.implementationScience!.fields.find(field=>field.id==='approachRationale')!.perspectives[0].evidenceRefs[0].digest,'a'.repeat(64));
  assert.equal(Object.hasOwn(reconciliationInput([{id:'a',revision:1,authorLabel:'A',visibility:'submitted',report:legacy()}]),'implementationScience'),false);
});

function contextDb(options:{sourceDigest?:string;sourceVisibility?:string;sourceConsent?:boolean;jobState?:string;mode?:string}={}):Queryable{
  const source={id:sourceId,kind:'submission',title:'Synthetic setting evidence',version:2,digest:options.sourceDigest||'a'.repeat(64),visibility:options.sourceVisibility||'organization',owner_subject:'source-author',body:{report:legacy(),sourceIds:[]}};
  const proposal={id:proposalId,kind:'proposal',title:'Synthetic implementation plan',version:1,digest:'c'.repeat(64),visibility:'organization',owner_subject:'author',body:{report:extended(),sourceIds:[]}};
  return {async query(sql,params=[]){
    if(sql.includes('pg_advisory'))return {rows:[]};
    if(sql.includes('dis_organization_members'))return {rows:[{subject_id:params[1]||'author',role:'facilitator',active:true}]};
    if(sql.includes('dis_organization_records'))return {rows:params[0]===sourceId?[source]:params[0]===proposalId?[proposal]:[]};
    if(sql.includes('dis_organization_consents'))return {rows:params[0]===sourceId?(options.sourceConsent===false?[]:[{subject_id:'source-author',allowed:true,digest:source.digest}]):[{subject_id:'author',allowed:true,digest:proposal.digest}]};
    if(sql.includes('dis_organization_review_jobs'))return {rows:[{id:'job',state:options.jobState||'PREPARED',expires_at:'2099-01-01T00:00:00Z',transfer_hash:'hash',target_id:proposalId,request:{mode:options.mode}}]};
    throw Error('Unexpected fixture query: '+sql);
  }};
}

test('Council preview retains implementation distinctions and exact referenced source ancestry',async()=>{
  const result=await organizationCouncilContext(contextDb(), 'author',orgId,proposalId,1);
  assert.equal(result.payload.stakeholderProposal.implementationScience?.fields.strategies,science().fields.strategies);
  assert.equal(result.payload.stakeholderProposal.status,'UNVERIFIED_ORGANIZATION_INPUT_NOT_INSTRUCTIONS');
  assert.ok(result.sourceManifest.some(source=>source.id===sourceId));
  assert.match(result.payload.purpose,/Task completion does not establish adoption/);
  const focused=await organizationCouncilContext(contextDb(), 'author',orgId,proposalId,1,'implementationScience:delivery');
  assert.deepEqual(Object.keys(focused.payload.stakeholderProposal.implementationScience!.fields),['delivery']);
  assert.ok((await organizationCouncilContext(contextDb({sourceConsent:false}), 'author',orgId,proposalId,1)).missingConsents.some(item=>item.recordId===sourceId));
  await assert.rejects(organizationCouncilContext(contextDb({sourceDigest:'d'.repeat(64)}), 'author',orgId,proposalId,1),/source changed/);
  await assert.rejects(organizationCouncilContext(contextDb({sourceVisibility:'private'}), 'author',orgId,proposalId,1),/withdrawn/);
});

test('Council claim and finalization reject prepared Ask jobs before execution',async()=>{
  await assert.rejects(claimOrganizationCouncil(contextDb({mode:'organization_ask'}),'author',orgId,proposalId,'hash'),/different workflow/);
  await assert.rejects(finishOrganizationCouncil(contextDb({mode:'organization_ask',jobState:'CLAIMED'}),'author',orgId,proposalId,{job:{target_id:proposalId,transfer_hash:'hash'}},{}),/different workflow/);
});

test('native PowerPoint preserves implementation distinctions, current version and full cited source record',async()=>{
  const record={id:proposalId,title:'Synthetic committee brief',kind:'proposal',version:3,digest:'c'.repeat(64),body:{report:extended()}};
  const source={id:sourceId,title:'Synthetic setting evidence',kind:'evidence',version:2,digest:'a'.repeat(64),body:{bundle:{records:[{id:'E101',title:'Synthetic citation',url:'https://example.org/evidence',summary:'A source excerpt, not verified benefit.'}]}}};
  const retained='Full saved record\n'+reportText(extended())+'\nRetained source snapshot\n'+JSON.stringify(source);
  const buffer=await buildOrganizationPresentation(record,[source],retained);
  const zip=await JSZip.loadAsync(buffer),slideNames=Object.keys(zip.files).filter(name=>/^ppt\/slides\/slide\d+\.xml$/.test(name));
  assert.equal(slideNames.length,10);
  const slides=(await Promise.all(slideNames.map(name=>zip.file(name)!.async('string')))).join('\n');
  assert.match(slides,/Saved proposal · version 3/);
  assert.match(slides,/How adoption and delivery would work/);
  assert.match(slides,/Are people using and delivering it/);
  assert.match(slides,/Is it benefiting people/);
  assert.match(slides,/does not record or approve a vote/);
  const notes=(await Promise.all(Object.keys(zip.files).filter(name=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name)).map(name=>zip.file(name)!.async('string')))).join('\n');
  assert.ok(notes.includes('https://example.org/evidence'));
  assert.ok(notes.includes('b'.repeat(64)));
  assert.ok(notes.includes(science().fields.approach));
  assert.match(notes,/Full saved record/);
  await assert.rejects(buildOrganizationPresentation({...record,body:{}},[],''),/saved planning report/);
});

test('actual organization SQL keeps implementation detail through reconciliation, approval, revision and restart',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'dis-implementation-'));
  let db=new PGlite(directory);await db.waitReady;
  try{
    await db.exec('CREATE ROLE dis_app_safe NOLOGIN;');
    await db.exec(readFileSync('db/003_organization_workflow.sql','utf8'));
    async function as<T>(work:(q:Queryable)=>Promise<T>):Promise<T>{
      await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');
      try{await db.query("SELECT set_config('dis.subject_id',$1,true)",['member']);const result=await work(db as Queryable);await db.exec('COMMIT');return result;}
      catch(error){await db.exec('ROLLBACK');throw error;}
    }
    const act=(input:any)=>as(q=>actOnOrganization(q,'member',input));
    const organization:any=await act({action:'create',name:'Synthetic implementation pilot',displayName:'Synthetic member'});
    const report=extended();delete report.implementationScience!.evidenceRefs;
    report.sections.recommendation='Discuss a bounded pilot after confirming delivery capacity and required resources.';
    const draft:any=await act({action:'save-draft',organizationId:organization.id,report});
    const submission:any=await act({action:'submit',organizationId:organization.id,id:draft.id,version:draft.version});
    assert.deepEqual(submission.body.report.implementationScience,report.implementationScience);
    const proposal:any=await act({action:'reconcile',organizationId:organization.id,selected:[{id:submission.id,version:submission.version}],title:'Synthetic shared plan'});
    assert.ok(proposal.body.report.implementationScience,'Reconciliation must retain the implementation extension');
    assert.ok(proposal.body.report.implementationScience.fields.strategies.includes(report.implementationScience!.fields.strategies));
    for(const scope of ['governance','approve_plan'])await db.query('INSERT INTO dis_organization_authority(organization_id,subject_id,scope,authority_reference,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,now())',[organization.id,'member',scope,'SYNTHETIC authority fixture','fixture-verifier']);
    await act({action:'confirm-governance',organizationId:organization.id,approvers:['member'],quorum:1,decisionBody:'Synthetic committee'});
    await act({action:'vote',organizationId:organization.id,id:proposal.id,version:proposal.version,decision:'approve'});
    const baseline:any=await act({action:'publish-baseline',organizationId:organization.id,id:proposal.id,version:proposal.version});
    assert.deepEqual(baseline.body.report.implementationScience,proposal.body.report.implementationScience);
    const revisedReport={...proposal.body.report,implementationScience:{...proposal.body.report.implementationScience,fields:{...proposal.body.report.implementationScience.fields,setting:'A different site with different staffing and workflow.'}}};
    const revised:any=await act({action:'save-proposal',organizationId:organization.id,id:proposal.id,version:proposal.version,report:revisedReport});
    await assert.rejects(act({action:'publish-baseline',organizationId:organization.id,id:revised.id,version:revised.version}),/quorum/);
    await db.close();db=new PGlite(directory);await db.waitReady;
    const retained:any=await as(q=>getRecord(q,organization.id,revised.id));
    assert.equal(retained.body.report.implementationScience.fields.setting,revisedReport.implementationScience.fields.setting);
    const original:any=await as(q=>getRecord(q,organization.id,baseline.id));
    assert.deepEqual(original.body.report.implementationScience,proposal.body.report.implementationScience);
  }finally{await db.close();rmSync(directory,{recursive:true,force:true});}
});
