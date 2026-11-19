// Synthetic gate-contract checks only; never product or human acceptance evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluate, validateEvidence, digest, canonical, scanRoots } from './gate.mjs';
import { setupFixture, put, evidenceFixture } from './fixture.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const schema=JSON.parse(fs.readFileSync(path.join(here,'../../schemas/iss-manifest.schema.json'),'utf8'));
const revision='a'.repeat(40);
const getCheck=(r,id)=>r.checks.find(c=>c.id===id);

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'iss-static-profile-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const m=setupFixture(root,schema);
  m.interpretationVersion='1.1.0-evidence.2-static';
  m.platform.runtimeTargets=['WEB_STATIC'];m.platform.plannedRuntimeTargets=[];
  m.platform.staticDelivery={kind:'ANONYMOUS_READ_ONLY',serverDataClassification:['PUBLIC'],
    inquiryProcessing:'LOCAL_DRAFT_ONLY',visitorAccounts:false,serverSubmission:false,
    applicationStorage:false,protectedPayloads:false,offlineRuntime:false,
    entrypoints:['client/src/main.ts']};
  m.experienceTrack.performanceBudgets.offlineFirstReady=false;
  m.assuranceTrack.cryptography={inTransit:'HTTPS_PROVIDER_MANAGED',atRest:'NO_APPLICATION_STORAGE',
    e2ePayloadEncryption:false,authMechanism:[]};
  m.assuranceTrack.auditAndSbom.complianceFrameworks=[];
  m.assuranceTrack.storeCompliance.accountCreation=false;
  m.assuranceTrack.storeCompliance.pwaManifestPath=null;
  m.traceability.requirementsMapped=m.traceability.requirementsMapped.filter(id=>!['REQ-EBEAS-PWA','REQ-EBEAS-DELETION'].includes(id));
  put(root,'iss-manifest.json',m);
  return {root,m};
}
function reviewedEvidence(root,m) {
  const now=new Date();const e=evidenceFixture(root,m,revision,now);
  e.sourceDigest=scanRoots(root,m.platform.sourceRoots).sourceDigest;
  const review={version:1,kind:'STATIC_DELIVERY_APPLICABILITY_REVIEW',disposition:'APPLICABLE_STATIC_DELIVERY',
    revision,repository:m.platform.repository,sourceDigest:e.sourceDigest,
    boundaryDigest:digest(canonical(m.platform.staticDelivery)),reviewedAt:now.toISOString(),
    reviewedBy:'independent-fixture-reviewer',rationale:'Synthetic scope-review fixture; no actual user or delivery acceptance.',
    unresolvedScopeFindings:[],sources:m.platform.staticDelivery.entrypoints.map(p=>({path:p,sha256:digest(fs.readFileSync(path.join(root,p)))})),
    evidenceRequirements:['REQ-EBEAS-E2E','REQ-EBEAS-IDENTITY-CONTINUITY','REQ-EBEAS-ENTITY-ISOLATION',
      'REQ-EBEAS-PERSISTENCE','REQ-EBEAS-PERMISSIONS','REQ-EBEAS-OFFLINE-DDIL','REQ-EBEAS-PRIVACY','REQ-EBEAS-CRYPTO']};
  m.assuranceTrack.applicability.reviewEvidencePath='audit/static-review.json';
  function saveReview() {
    put(root,'audit/static-review.json',review);
    e.checks['REQ-EBEAS-APPLICABILITY'].artifacts=[{path:'audit/static-review.json',sha256:digest(fs.readFileSync(path.join(root,'audit/static-review.json')))}];
  }
  saveReview();return {e,review,now,saveReview};
}

test('anonymous static build uses honest application scope and cannot grant release acceptance',async t=>{
  const {root,m}=fixture(t);const r=await evaluate({root,stage:'build',env:{}});
  assert.equal(r.status,'PASS',JSON.stringify(r.checks));assert.equal(r.releaseReadiness,'NOT_EVALUATED');
  assert.equal(r.interpretation,'1.1.0-evidence.2-static');
  assert.equal(m.assuranceTrack.cryptography.e2ePayloadEncryption,false);
  assert.deepEqual(m.assuranceTrack.cryptography.authMechanism,[]);
  assert.equal(m.assuranceTrack.applicability.reviewStatus,'UNDETERMINED');
});
for(const [name,change] of [
  ['visitor accounts',m=>m.platform.staticDelivery.visitorAccounts=true],
  ['server submissions',m=>m.platform.staticDelivery.serverSubmission=true],
  ['application persistence',m=>m.platform.staticDelivery.applicationStorage=true],
  ['protected payloads',m=>m.platform.staticDelivery.protectedPayloads=true],
  ['offline runtime',m=>m.platform.staticDelivery.offlineRuntime=true],
  ['protected server data',m=>m.platform.staticDelivery.serverDataClassification=['PII']],
  ['health data classification',m=>m.assuranceTrack.dataClassification=['PHI_HIPAA']],
  ['health tier',m=>m.platform.tier='TIER_2_HEALTH_COMMUNITY'],
  ['defense tier',m=>m.platform.tier='TIER_3_DEFENSE_DDIL'],
  ['native runtime mixed into static scope',m=>m.platform.runtimeTargets.push('IOS_APP_STORE')],
  ['PWA runtime mixed into static scope',m=>m.platform.runtimeTargets.push('WEB_PWA')],
  ['account-creation contradiction',m=>m.assuranceTrack.storeCompliance.accountCreation=true],
  ['PWA artifact contradiction',m=>m.assuranceTrack.storeCompliance.pwaManifestPath='client/public/manifest.webmanifest'],
  ['missing scoped declaration',m=>delete m.platform.staticDelivery],
  ['unrecognized boundary state',m=>m.platform.staticDelivery.inquiryProcessing='UNDETERMINED'],
]) test(`static profile rejects ${name}`,async t=>{
  const {root,m}=fixture(t);change(m);put(root,'iss-manifest.json',m);
  const r=await evaluate({root,stage:'build',env:{}});assert.equal(getCheck(r,'G1-MANIFEST').status,'FAILED');
});
test('declared static entrypoints must be real files',async t=>{
  const {root,m}=fixture(t);m.platform.staticDelivery.entrypoints=['not-present.mjs'];put(root,'iss-manifest.json',m);
  assert.equal(getCheck(await evaluate({root,stage:'build',env:{}}),'G5-RUNTIME-ARTIFACTS').status,'FAILED');
});
for(const [name,change] of [
  ['no storage',m=>m.assuranceTrack.cryptography.atRest='NO_APPLICATION_STORAGE'],
  ['no authentication',m=>m.assuranceTrack.cryptography.authMechanism=[]],
  ['no payload encryption',m=>m.assuranceTrack.cryptography.e2ePayloadEncryption=false],
  ['empty framework target',m=>m.assuranceTrack.auditAndSbom.complianceFrameworks=[]],
  ['provider-managed transport declaration',m=>m.assuranceTrack.cryptography.inTransit='HTTPS_PROVIDER_MANAGED'],
]) test(`ordinary application profile cannot borrow static ${name} applicability`,async t=>{
  const {root}=fixture(t);const m=setupFixture(root,schema);change(m);put(root,'iss-manifest.json',m);
  assert.equal(getCheck(await evaluate({root,stage:'build',env:{}}),'G1-MANIFEST').status,'FAILED');
});
test('static release still rejects absent executed evidence, IRON acceptance and signature',async t=>{
  const {root}=fixture(t);const r=await evaluate({root,stage:'release',env:{GITHUB_SHA:revision}});
  for(const id of ['G7-EXECUTED-EVIDENCE','G8-IRON-ACCEPTANCE','G9-SIGNED-PROVENANCE']) assert.equal(getCheck(r,id).status,'FAILED');
  assert.equal(r.releaseReadiness,'BLOCKED');
});
test('review-record consistency keeps all mandatory requirement checks',t=>{
  const {root,m}=fixture(t);const {e,now}=reviewedEvidence(root,m);
  const required=validateEvidence(root,e,m,revision,now.getTime());
  for(const id of ['REQ-EBEAS-PERSISTENCE','REQ-EBEAS-CRYPTO','REQ-EBEAS-IDENTITY-CONTINUITY','REQ-EBEAS-COLD-USERS']) assert.ok(required.includes(id));
});
for(const [name,change,error] of [
  ['stale source',r=>r.revision='b'.repeat(40),'STATIC_REVIEW_SOURCE_MISMATCH'],
  ['different source digest',r=>r.sourceDigest='b'.repeat(64),'STATIC_REVIEW_SOURCE_MISMATCH'],
  ['changed boundary',r=>r.boundaryDigest='b'.repeat(64),'STATIC_REVIEW_BOUNDARY_MISMATCH'],
  ['builder self-review',r=>r.reviewedBy='fixture-builder','STATIC_INDEPENDENT_REVIEW_REQUIRED'],
  ['invisible reviewer identity',r=>r.reviewedBy='fixture-builder\u200b','STATIC_INDEPENDENT_REVIEW_REQUIRED'],
  ['unresolved applicability',r=>r.disposition='UNDETERMINED','STATIC_APPLICABILITY_REVIEW_REQUIRED'],
  ['unresolved scope finding',r=>r.unresolvedScopeFindings.push('Application persistence observed'),'STATIC_SCOPE_REVIEW_INCOMPLETE'],
  ['missing source artifacts',r=>r.sources=[],'STATIC_REVIEW_SOURCES_REQUIRED'],
  ['tampered reviewed source',r=>r.sources[0].sha256='0'.repeat(64),'ARTIFACT_HASH_MISMATCH'],
  ['missing absence checks',r=>r.evidenceRequirements=[],'STATIC_ABSENCE_EVIDENCE_UNMAPPED'],
]) test(`static evidence rejects ${name}`,t=>{
  const {root,m}=fixture(t);const {e,review,now,saveReview}=reviewedEvidence(root,m);
  change(review);saveReview();assert.throws(()=>validateEvidence(root,e,m,revision,now.getTime()),new RegExp(error));
});
for(const [name,change,error] of [
  ['missing real-user acceptance',e=>e.userAcceptance.actualHumans=false,'ACTUAL_USER_TESTS_REQUIRED'],
  ['high vulnerability',e=>e.security.highOpen=1,'SECURITY_FINDINGS'],
  ['skipped persistence cases',e=>e.checks['REQ-EBEAS-PERSISTENCE'].skippedCases=1,'EXECUTED_RESULTS_REQUIRED'],
  ['static-only identity assertion',e=>e.checks['REQ-EBEAS-IDENTITY-CONTINUITY'].mode='static','EXECUTED_JOURNEY_REQUIRED'],
]) test(`static profile preserves rejection of ${name}`,t=>{
  const {root,m}=fixture(t);const {e,now}=reviewedEvidence(root,m);change(e);
  assert.throws(()=>validateEvidence(root,e,m,revision,now.getTime()),new RegExp(error));
});
