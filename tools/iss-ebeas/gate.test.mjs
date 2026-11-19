import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { evaluate, writeReceipt, digest, canonical, safePath, validateEvidence, scanRoots } from './gate.mjs';
import { setupFixture, put, evidenceFixture } from './fixture.mjs';
// Keep the additive static-delivery contracts in every existing gate-test entrypoint.
import './static-delivery.test.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const schema=JSON.parse(fs.readFileSync(path.join(here,'../../schemas/iss-manifest.schema.json'),'utf8'));
function fixture(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'iss-ebeas-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,m:setupFixture(root,schema)};}
const check=(r,id)=>r.checks.find(c=>c.id===id);
test('valid multi-root build passes configuration and never grants release/store acceptance',async t=>{
  const {root}=fixture(t);const r=await evaluate({root,stage:'build',env:{}});
  assert.equal(r.status,'PASS');assert.equal(r.releaseReadiness,'NOT_EVALUATED');assert.equal(r.signature,'UNSIGNED_LOCAL_RECEIPT');assert.equal(r.storeApproval,'NOT_ESTABLISHED');
  assert.equal(check(r,'G4-TRACEABILITY').detail.e2eExecutedByThisCheck,false);
  const {sha256Attestation,...payload}=r;assert.equal(sha256Attestation,digest(canonical(payload)));
});
for(const [name,mutate,gate] of [
  ['negative performance budget',m=>m.experienceTrack.performanceBudgets.firstContentfulPaintMs=-1,'G1-MANIFEST'],
  ['zero first value',m=>m.experienceTrack.ucdNarrative.timeToFirstValueSeconds=0,'G1-MANIFEST'],
  ['duplicate targets',m=>m.platform.runtimeTargets.push('WEB_PWA'),'G1-MANIFEST'],
  ['unknown declaration property',m=>m.certified=true,'G1-MANIFEST'],
  ['traversal output',m=>m.traceability.attestationOutputPath='../overwrite.ts','G1-MANIFEST'],
  ['non-HTTPS policy',m=>m.assuranceTrack.storeCompliance.privacyPolicyUrl='javascript:alert(1)','G1-MANIFEST'],
  ['missing source root',m=>m.platform.sourceRoots=['src'],'G3-SOURCE-SCOPE'],
  ['missing E2E path',m=>m.traceability.e2eSuitePath='does-not-exist','G4-TRACEABILITY'],
  ['wrong owner',m=>m.platform.repoOwner='someone-else','G1-MANIFEST'],
  ['active/planned collision',m=>m.platform.plannedRuntimeTargets.push('WEB_PWA'),'G1-MANIFEST'],
  ['defense enum alone cannot pass risk profile',m=>m.platform.tier='TIER_3_DEFENSE_DDIL','G2-RISK-PROFILE'],
  ['iOS missing privacy artifact',m=>{m.platform.runtimeTargets.push('IOS_APP_STORE');m.platform.plannedRuntimeTargets=['ANDROID_PLAY_STORE'];},'G5-RUNTIME-ARTIFACTS'],
]) test(name,async t=>{const {root,m}=fixture(t);mutate(m);put(root,'iss-manifest.json',m);const r=await evaluate({root,stage:'build',env:{}});assert.equal(check(r,gate).status,'FAILED');assert.equal(r.status,'FAIL');});
for(const name of ['iss-manifest.json','schemas/iss-manifest.schema.json']) {
  test(`missing ${name} emits safe failure receipt`,async t=>{const {root}=fixture(t);fs.unlinkSync(path.join(root,name));const r=await evaluate({root,stage:'build',env:{}});writeReceipt(root,r);assert.equal(read(root,'audit/attestation.json').status,'FAIL');});
  test(`malformed ${name} emits safe failure receipt`,async t=>{const {root}=fixture(t);put(root,name,'{broken');const r=await evaluate({root,stage:'build',env:{}});writeReceipt(root,r);assert.equal(read(root,'audit/attestation.json').status,'FAIL');});
}
function read(root,p){return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));}
test('empty source root fails',async t=>{const {root}=fixture(t);fs.unlinkSync(path.join(root,'client/src/main.ts'));assert.equal(check(await evaluate({root,stage:'build',env:{}}),'G3-SOURCE-SCOPE').status,'FAILED');});
test('source symlink cannot escape scan',async t=>{const {root}=fixture(t);fs.symlinkSync('/etc/passwd',path.join(root,'client/src/linked.ts'));assert.equal(check(await evaluate({root,stage:'build',env:{}}),'G3-SOURCE-SCOPE').status,'FAILED');});
test('receipt directory symlink cannot overwrite outside root',async t=>{const {root}=fixture(t);const outside=fs.mkdtempSync(path.join(os.tmpdir(),'iss-outside-'));t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));fs.symlinkSync(outside,path.join(root,'audit'));assert.throws(()=>writeReceipt(root,{}),/SYMLINK_PATH/);assert.deepEqual(fs.readdirSync(outside),[]);});
test('hardlinked source/output are rejected',t=>{const {root}=fixture(t);fs.linkSync(path.join(root,'client/src/main.ts'),path.join(root,'hardlink.ts'));assert.throws(()=>safePath(root,'hardlink.ts'),/HARDLINK_FILE/);});
test('literal bracket route filenames are scanned and every changed route remains source-bound',async t=>{
  const {root,m}=fixture(t);
  const routes=['client/src/pages/cohorts/[cohortId]/page.tsx','client/src/pages/trade/[gameId]/page.tsx',
    'client/src/pages/goals/[goalId]/page.tsx','client/src/pages/social/[userId]/page.tsx'];
  for(const route of routes) put(root,route,'// Synthetic route source only; no runtime code or records.\n');
  const result=await evaluate({root,stage:'build',env:{}});
  assert.equal(result.status,'PASS');assert.equal(result.releaseReadiness,'NOT_EVALUATED');
  let prior=check(result,'G3-SOURCE-SCOPE').detail.sourceDigest;
  for(const route of routes) {
    assert.equal(safePath(root,route,{file:true}),path.join(root,route));
    fs.appendFileSync(path.join(root,route),'// Changed route source.\n');
    const next=scanRoots(root,m.platform.sourceRoots).sourceDigest;
    assert.notEqual(next,prior);prior=next;
  }
  assert.throws(()=>safePath(root,'client/src/pages/cohorts/[missing]/page.tsx',{file:true}),/MISSING_PATH/,
    'Literal brackets must not expand into a matching glob');
});
test('bracket path support preserves traversal, shell-character, symbolic-link and hard-link rejection',t=>{
  const {root}=fixture(t);
  for(const unsafe of ['client/src/[id]/../../outside.ts','client/src/[id]/./page.ts','client/src/[id]//page.ts',
    '/tmp/[id]/page.ts','client/src/[id]/page*.ts','client/src/[id]/page?.ts','client/src/[id]/$(command).ts',
    'client/src/[id]/page;command.ts','client/src/[id]/page\\\\other.ts','client/src/[id]/page\u0000.ts'])
    assert.throws(()=>safePath(root,unsafe,{exists:false}),/UNSAFE_PATH/);
  fs.symlinkSync(path.join(root,'client/src/main.ts'),path.join(root,'client/src/[linked].ts'));
  assert.throws(()=>safePath(root,'client/src/[linked].ts'),/SYMLINK_PATH/);
  fs.linkSync(path.join(root,'client/src/main.ts'),path.join(root,'client/src/[hardlinked].ts'));
  assert.throws(()=>safePath(root,'client/src/[hardlinked].ts'),/HARDLINK_FILE/);
});
test('potential secret is redacted and review required, not proof of no secrets',async t=>{const {root}=fixture(t);const fake='sk-'+('X'.repeat(40));put(root,'client/src/main.ts',`const synthetic = '${fake}';`);const r=await evaluate({root,stage:'build',env:{}});assert.equal(check(r,'G3-SOURCE-SCOPE').detail.heuristicStatus,'REVIEW_REQUIRED');assert.ok(!JSON.stringify(r).includes(fake));});
test('component name does not excuse a permission call',async t=>{const {root}=fixture(t);put(root,'client/src/main.ts','// PermissionPrimerSheet\nnavigator.geolocation.getCurrentPosition(()=>{});');const r=await evaluate({root,stage:'build',env:{}});assert.ok(check(r,'G3-SOURCE-SCOPE').detail.findings.some(f=>f.code==='PERMISSION_JOURNEY_REVIEW'));});
test('source binding distinguishes original invalid UTF-8 bytes',t=>{const {root,m}=fixture(t);const p=path.join(root,'client/src/main.ts');fs.writeFileSync(p,Buffer.from([0x80]));const a=scanRoots(root,m.platform.sourceRoots).sourceDigest;fs.writeFileSync(p,Buffer.from([0x81]));assert.notEqual(scanRoots(root,m.platform.sourceRoots).sourceDigest,a);});
test('firmware and deployment-shell roots are scanned and changes are hash-bound',async t=>{
  const {root,m}=fixture(t);m.platform.sourceRoots=['firmware','scripts'];
  for(const extension of ['c','cc','cpp','cxx','h','hh','hpp']) put(root,`firmware/controller.${extension}`,'// Synthetic source-scope fixture only.\n');
  const sketch='firmware/atlas-beacon/atlas-beacon.ino';
  put(root,sketch,'void setup() {}\nvoid loop() {}\n');
  put(root,'scripts/release.sh','#!/bin/sh\n# Synthetic shell source; never executed.\n');
  put(root,'scripts/build.bash','#!/bin/bash\n# Synthetic shell source; never executed.\n');
  put(root,'firmware/not-source.bin','Synthetic binary artifact remains outside source-format matching.');
  put(root,'iss-manifest.json',m);
  const result=await evaluate({root,stage:'build',env:{}}), scope=check(result,'G3-SOURCE-SCOPE');
  assert.equal(scope.status,'PASSED');assert.equal(scope.detail.filesScanned,10);
  assert.equal(result.releaseReadiness,'NOT_EVALUATED');
  fs.appendFileSync(path.join(root,sketch),'// Changed firmware source.\n');
  const changedFirmware=scanRoots(root,m.platform.sourceRoots).sourceDigest;
  assert.notEqual(changedFirmware,scope.detail.sourceDigest,'Arduino source changes must change the source receipt');
  fs.appendFileSync(path.join(root,'scripts/release.sh'),'# Changed deployment source.\n');
  assert.notEqual(scanRoots(root,m.platform.sourceRoots).sourceDigest,changedFirmware,'Deployment shell changes must change the source receipt');
});
test('firmware and shell secret-pattern findings are actionable without exposing their values',async t=>{
  const {root,m}=fixture(t);m.platform.sourceRoots=['firmware','scripts'];
  const firmwareValue='sk-'+('X'.repeat(40)), shellValue='AKIA'+('Z'.repeat(16));
  put(root,'firmware/atlas-beacon/atlas-beacon.ino',`const char* synthetic_key = "${firmwareValue}";\n`);
  put(root,'scripts/release.bash',`# Synthetic fixture, not a real credential.\nSYNTHETIC_KEY='${shellValue}'\n`);
  put(root,'iss-manifest.json',m);
  const result=await evaluate({root,stage:'build',env:{}}), scope=check(result,'G3-SOURCE-SCOPE');
  assert.equal(scope.status,'PASSED');assert.equal(scope.detail.heuristicStatus,'REVIEW_REQUIRED');
  assert.deepEqual(scope.detail.findings,[
    {code:'POTENTIAL_SECRET_REVIEW',path:'firmware/atlas-beacon/atlas-beacon.ino'},
    {code:'POTENTIAL_SECRET_REVIEW',path:'scripts/release.bash'},
  ]);
  const serialized=JSON.stringify(result);
  assert.ok(!serialized.includes(firmwareValue));assert.ok(!serialized.includes(shellValue));
});
test('extra mapped application control cannot disappear',t=>{const {root,m}=fixture(t);const now=new Date();const e=evidenceFixture(root,m,'a'.repeat(40),now);m.traceability.requirementsMapped.push('REQ-APP-SPECIFIC');assert.throws(()=>validateEvidence(root,e,m,'a'.repeat(40),now.getTime()),/CHECK_NOT_PASSED:REQ-APP-SPECIFIC/);});
test('release defaults fail closed without signed executed evidence',async t=>{const {root}=fixture(t);const r=await evaluate({root,env:{}});assert.equal(r.stage,'release');assert.equal(r.status,'FAIL');assert.equal(r.releaseReadiness,'BLOCKED');assert.equal(check(r,'G9-SIGNED-PROVENANCE').status,'FAILED');});
test('provider SHA cannot make missing evidence pass',async t=>{const {root}=fixture(t);const r=await evaluate({root,stage:'release',env:{GITHUB_SHA:'a'.repeat(40)}});assert.equal(r.revision,'a'.repeat(40));assert.equal(r.status,'FAIL');});
test('unknown stage cannot downgrade release',async t=>{const {root}=fixture(t);assert.equal((await evaluate({root,stage:'skip',env:{}})).status,'FAIL');});
test('runner repository mismatch fails',async t=>{const {root}=fixture(t);assert.equal((await evaluate({root,stage:'build',env:{GITHUB_REPOSITORY:'wrong/repository'}})).status,'FAIL');});
for(const [name,mutate,error] of [
  ['stale revision',e=>e.revision='b'.repeat(40),'EVIDENCE_REVISION_MISMATCH'],
  ['future timestamp',e=>e.createdAt='2999-01-01T00:00:00Z','STALE_OR_FUTURE_EVIDENCE'],
  ['missing checklist row',e=>delete e.checks['REQ-EBEAS-E2E'],'CHECK_NOT_PASSED'],
  ['skipped required check',e=>e.checks['REQ-EBEAS-JOURNEY'].status='SKIPPED','CHECK_NOT_PASSED'],
  ['static browser claim',e=>e.checks['REQ-EBEAS-JOURNEY'].mode='static','EXECUTED_JOURNEY_REQUIRED'],
  ['mismatched artifact hash',e=>e.checks['REQ-EBEAS-JOURNEY'].artifacts[0].sha256='0'.repeat(64),'ARTIFACT_HASH_MISMATCH'],
  ['unresolved findings',e=>e.unresolvedFindings.push('known finding'),'UNRESOLVED_FINDINGS'],
  ['slow FCP',e=>e.measurements.fcpMs=1201,'PERFORMANCE_BUDGET'],
  ['zero INP samples',e=>e.measurements.inpSampleCount=0,'MEASUREMENT_CONTEXT_REQUIRED'],
  ['high CVEs',e=>e.security.highOpen=1,'SECURITY_FINDINGS'],
  ['synthetic testers',e=>e.userAcceptance.actualHumans=false,'ACTUAL_USER_TESTS_REQUIRED'],
  ['too few testers',e=>e.userAcceptance.personas[0].attempts.pop(),'THREE_UNASSISTED_USERS'],
  ['self approval',e=>e.approval.approvedBy=e.builder,'RELEASE_AUTHORITY_REQUIRED'],
  ['invisible identity bypass',e=>e.approval.approvedBy=e.builder+'\u200b','RELEASE_AUTHORITY_REQUIRED'],
  ['static durable E2E',e=>e.checks['REQ-EBEAS-E2E'].mode='static','EXECUTED_JOURNEY_REQUIRED'],
  ['zero executed cases',e=>e.checks['REQ-EBEAS-E2E'].executedCases=0,'EXECUTED_RESULTS_REQUIRED'],
  ['synthetic human mode',e=>e.checks['REQ-EBEAS-COLD-USERS'].mode='synthetic','ACTUAL_USER_EVIDENCE_MODE'],
  ['wrong tested persona',e=>e.userAcceptance.personas[0].persona='An invented unrelated persona','PRIMARY_PERSONA_NOT_TESTED'],
  ['slow human attempts',e=>{for(const a of e.userAcceptance.personas[0].attempts) {a.firstValueSeconds=900;a.fullOutcomeSeconds=3600;}},'THREE_UNASSISTED_USERS'],
  ['false first-value summary',e=>e.measurements.firstValueSeconds=10,'FIRST_VALUE_SUMMARY_MISMATCH'],
  ['duplicate human participant',e=>e.userAcceptance.personas[0].attempts[1].participantId='fixture-0','DUPLICATE_OR_INVALID_PARTICIPANT'],
]) test(`rejects ${name}`,t=>{const {root,m}=fixture(t);const now=new Date();const e=evidenceFixture(root,m,'a'.repeat(40),now);mutate(e);assert.throws(()=>validateEvidence(root,e,m,'a'.repeat(40),now.getTime()),new RegExp(error));});
test('consistent fabricated metadata still cannot pass actual IRON or signature gate',async t=>{
  const {root,m}=fixture(t);const now=new Date();const revision='a'.repeat(40);const e=evidenceFixture(root,m,revision,now);
  assert.ok(validateEvidence(root,e,m,revision,now.getTime()).length>20);
  put(root,'iss-manifest.json',m);e.sourceDigest=scanRoots(root,m.platform.sourceRoots).sourceDigest;put(root,'audit/ebeas-evidence.json',e);
  put(root,'audit/ebeas-evidence.sigstore.jsonl',{sha256Attestation:'b'.repeat(64),signed:true});
  const r=await evaluate({root,stage:'release',env:{GITHUB_SHA:revision},now});
  assert.equal(check(r,'G8-IRON-ACCEPTANCE').status,'FAILED');assert.equal(check(r,'G9-SIGNED-PROVENANCE').status,'FAILED');assert.equal(r.status,'FAIL');
});
test('CLI unknown arguments emit receipt and nonzero exit',t=>{const {root}=fixture(t);const r=spawnSync(process.execPath,[path.join(here,'gate.mjs'),'--pretend-pass'],{cwd:root,encoding:'utf8'});assert.equal(r.status,1);assert.equal(read(root,'audit/attestation.json').status,'FAIL');});
