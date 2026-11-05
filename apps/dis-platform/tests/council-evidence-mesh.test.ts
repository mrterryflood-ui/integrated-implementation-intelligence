import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessEvidenceMesh} from '../lib/council-evidence-mesh';
import {councilEngagementAssurance} from '../lib/council-engagement-assurance';
import {convene} from '../lib/council-engine';
import {buildPackage,renderPackageMarkdown} from '../lib/consultation-package';
import {sanitizeIntake} from '../lib/consultation';
import type {EvidenceSource} from '../lib/evidence-integrity';

const now='2026-11-05T19:00:00Z';
const source=(id:string,rest:Partial<EvidenceSource>={}):EvidenceSource=>({
  id,title:'Synthetic source '+id,doi:null,url:'https://evidence.example.test/'+id,year:2025,
  abstract:'This synthetic excerpt describes an illustrative association, but does not establish local causal effect or a validated intervention.',
  evidenceKind:'SCHOLARLY_ABSTRACT',retrievedAt:'2026-11-05T18:30:00Z',
  referencePeriod:'2024',geography:'Travis County, TX',...rest
});
const issueCodes=(r:ReturnType<typeof assessEvidenceMesh>)=>r.issues.map(x=>x.code);
test('source audit is always explicitly unvalidated and never authorizes an EOC or clinical action',()=>{
  const result=assessEvidenceMesh([source('S1'),source('S2')],now);
  assert.equal(result.schemaVersion,'dis-source-triangulation-v1');
  assert.equal(result.sourceRecordCount,2);
  assert.equal(result.independentlyVerifiedSourceCount,0);
  assert.equal(result.numericalPoolingAuthorized,false);
  assert.equal(result.samePhenomenonVerified,false);
  assert.equal(result.geospatialTemporalAlignmentVerified,false);
  assert.equal(result.actionAuthorized,false);
  assert.equal(result.independentEvidenceConclusion,'NOT_ESTABLISHED');
  assert.deepEqual(result.repeatedReferenceGroups,[]);
});
test('two copied publisher pages are not independent measurement confirmations',()=>{
  const first=source('S1',{url:'https://www.evidence.example.test/study/?utm_source=email#summary'});
  const second=source('S2',{url:'https://evidence.example.test/study'});
  const result=assessEvidenceMesh([first,second],now);
  assert.deepEqual(result.repeatedReferenceGroups,[['S1','S2']]);
  assert.ok(issueCodes(result).includes('DUPLICATED_SOURCE_REFERENCE'));
  assert.equal(result.issues.find(x=>x.code==='DUPLICATED_SOURCE_REFERENCE')?.severity,'HOLD_INFERENCE');
});
test('same publication identifier across publishers is a single reference',()=>{
  const a=source('S1',{doi:'10.1234/fake.paper',url:'https://journals.example.test/a'});
  const b=source('S2',{doi:'https://doi.org/10.1234/fake.paper',url:'https://another.example.test/abstract'});
  const r=assessEvidenceMesh([a,b],now);
  assert.equal(r.repeatedReferenceGroups.length,1);
});
test('copy of substantial excerpt is called for investigation rather than certified as plagiarism or unique data',()=>{
  const a=source('S1'),b=source('S2',{abstract:a.abstract});
  const r=assessEvidenceMesh([a,b],now);
  assert.ok(issueCodes(r).includes('POSSIBLY_REPUBLISHED_EXCERPT'));
  assert.equal(r.independentlyVerifiedSourceCount,0);
});
test('the declared study period is not confused with retrieval year or decision timestamp',()=>{
  const r=assessEvidenceMesh([
    source('E1',{referencePeriod:'2021',geography:'Bexar County, TX',evidenceKind:'PLATFORM_PUBLIC_EXCERPT'}),
    source('S2',{referencePeriod:'2025',geography:'Travis County, TX'})
  ],now);
  assert.ok(issueCodes(r).includes('REFERENCE_PERIODS_DIFFER'));
  assert.ok(issueCodes(r).includes('GEOGRAPHIES_DIFFER'));
  assert.equal(r.sources[0].retrievalState,'RETRIEVED_BY_DECISION_TIME');
  assert.equal(r.geospatialTemporalAlignmentVerified,false);
});
test('unreported source reference periods and local scope remain visible, not zero or imputed',()=>{
  const r=assessEvidenceMesh([source('S1',{referencePeriod:null,geography:undefined})],now);
  assert.ok(issueCodes(r).includes('GEOGRAPHY_UNKNOWN'));
  assert.ok(issueCodes(r).includes('REFERENCE_PERIOD_UNKNOWN'));
  assert.equal(r.sources[0].declaredScope,null);
});
test('future retrieval is held and not backdated into an earlier decision',()=>{
  const r=assessEvidenceMesh([source('S1',{retrievedAt:'2026-11-05T19:01:00Z'})],now);
  assert.equal(r.sources[0].retrievalState,'AFTER_DECISION_TIME');
  assert.equal(r.issues.find(x=>x.code==='FUTURE_RECEIPT')?.severity,'HOLD_INFERENCE');
});
test('publication year cannot substitute for a missing timezone-bound retrieval time',()=>{
  const r=assessEvidenceMesh([source('S1',{retrievedAt:'2026-11-05T18:00:00'})],now);
  assert.equal(r.sources[0].retrievalTime,null);
  assert.ok(issueCodes(r).includes('SOURCE_TIME_UNVERIFIED'));
});
test('zero records is not described as a quiet or safe operational environment',()=>{
  const r=assessEvidenceMesh([],now);
  assert.equal(r.status,'NO_SOURCES');
  assert.equal(r.actionAuthorized,false);
  assert.equal(r.sourceRecordCount,0);
  assert.equal(r.independentEvidenceConclusion,'NOT_ESTABLISHED');
});
test('unsupported decision timestamp does not silently assume a clock or timezone',()=>{
  assert.throws(()=>assessEvidenceMesh([source('S1')],'2026-11-05T19:00:00'),/time zone/);
});
test('Council actual assurance contains the mesh review, independent of generated personas',()=>{
  const report={sources:[source('S1'),source('S2',{url:'https://evidence.example.test/S1'})],
    primary:[{id:'socrates',name:'Synthetic reasoning lens'}],red:[],
    deliberation:{synthesis:'Only exploratory source leads are available [S1].'}};
  const a=councilEngagementAssurance(report,'Assess a community service implementation plan');
  assert.equal(a.evidenceMesh.sourceRecordCount,2);
  assert.ok(issueCodes(a.evidenceMesh).includes('DUPLICATED_SOURCE_REFERENCE'));
  assert.equal(a.evidenceMesh.actionAuthorized,false);
  assert.equal(a.measured,false);
});
test('Council generated report exports source-limitations and instrument fitness rather than invented causal claims',()=>{
  const a=councilEngagementAssurance({sources:[source('S1'),source('S2',{url:'https://evidence.example.test/S1'})]},'Assess local implementation');
  const intake=sanitizeIntake({mission:'Assess local implementation'});
  const pkg=buildPackage(intake,'general',null,{engagementAssurance:a});
  const annex=pkg.documents.find(x=>x.id==='engagement-assurance');
  assert.ok(annex);
  assert.match(annex.body,/Federated DIS evidence check/);
  assert.match(annex.body,/DUPLICATED_SOURCE_REFERENCE/);
  assert.match(annex.body,/Fit-for-purpose decision/);
  assert.match(annex.body,/Zero independent measurements were verified/);
  assert.match(renderPackageMarkdown(pkg),/Source triangulation and comparability/);
});
test('Council UI actually exposes mesh checks and limitations rather than leaving a disconnected library',()=>{
  const ui=readFileSync('app/council-readiness.tsx','utf8');
  assert.match(ui,/assurance\.evidenceMesh/);
  assert.match(ui,/Federated evidence assurance/);
  assert.match(ui,/independent measurements, causal effects/);
  assert.match(ui,/Source-level provenance/);
});


test('real Council inference strands receive server-computed duplicate-source and time-scope challenge',async()=>{
  const old=process.env.AI_GATEWAY_MODEL;
  process.env.AI_GATEWAY_MODEL='synthetic-no-provider';
  const prompts:string[]=[];
  try{
    const first=source('S1',{url:'https://evidence.example.test/shared',referencePeriod:'2020',geography:'Travis County, TX'});
    const second=source('S2',{url:'https://evidence.example.test/shared',referencePeriod:'2024',geography:'Bexar County, TX'});
    const result=await convene({prompt:'Analyze a multi-jurisdiction public-service decision',count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'},{
      research:async()=>({sources:[first,second],status:'ABSTRACT_AND_METADATA'}),
      infer:async(system,prompt)=>{
        prompts.push(prompt);
        return{ok:true,text:system.includes('Return ONLY a JSON object')?
          JSON.stringify({tasks:[{title:'Audit source lineage',success:'Source linkage inspected'}],metrics:[]}):
          'The sources may be duplicated and geographically different. Original-source validation is necessary [S1].',model:'synthetic-no-provider'};
      }
    });
    assert.equal(prompts.length,5);
    for(const prompt of prompts){
      assert.match(prompt,/DIS_SOURCE_MESH_PREFLIGHT/);
      assert.match(prompt,/DUPLICATED_SOURCE_REFERENCE/);
      assert.match(prompt,/REFERENCE_PERIODS_DIFFER/);
      assert.match(prompt,/GEOGRAPHIES_DIFFER/);
      assert.match(prompt,/NOT_ESTABLISHED/);
    }
    assert.equal(result.operatingContract.inferenceInvocationCount,5);
    assert.equal(result.operatingContract.behaviorVerified,false);
  }finally{
    if(old===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=old;
  }
});
