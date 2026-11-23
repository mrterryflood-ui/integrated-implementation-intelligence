// Synthetic engineering fixtures. These tests are not product/device acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as gate from './gate.mjs';
import { setupFixture, put, evidenceFixture } from './fixture.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const schema=JSON.parse(fs.readFileSync(path.join(here,'../../schemas/iss-manifest.schema.json'),'utf8'));
const V3='1.1.0-evidence.3-validation';
const inventory=(root,m)=>gate.inventoryValidationInputs(root,m);
const check=(r,id)=>r.checks.find(c=>c.id===id);

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'iss-validation-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const m=setupFixture(root,schema);
  m.interpretationVersion=V3;
  m.traceability.validationInputs=['tests','package-lock.json','.github/workflows'];
  // Copy a fresh tool snapshot into each synthetic root; never run its workflow.
  for(const name of ['gate.mjs','fixture.mjs','package.json','package-lock.json'])
    put(root,'tools/iss-ebeas/'+name,fs.readFileSync(path.join(here,name),'utf8'));
  put(root,'tests/e2e/browser.test.ts','// Synthetic browser-test inventory fixture, not executed browser evidence.\n');
  put(root,'package-lock.json',{name:'synthetic-inventory-only',lockfileVersion:3,packages:{}});
  put(root,'.github/workflows/iss-ebeas-release.yml','name: Synthetic inventory fixture only\non: workflow_dispatch\njobs: {}\n');
  put(root,'client/src/protocol.rs','// Synthetic Rust source, never compiled by this test.\n');
  put(root,'iss-manifest.json',m);
  return {root,m};
}
function prepareEvidence(root,m) {
  const now=new Date(), revision='a'.repeat(40);
  const e=evidenceFixture(root,m,revision,now);
  put(root,'iss-manifest.json',m);
  e.sourceDigest=gate.scanRoots(root,m.platform.sourceRoots).sourceDigest;
  e.validationDigest=inventory(root,m).validationDigest;
  put(root,m.traceability.evidencePath,e);
  return {e,now,revision};
}

test('validation inventory binds required anchors and every extension without claiming execution',async t=>{
  const {root,m}=fixture(t), first=inventory(root,m);
  for(const anchor of ['iss-manifest.json','schemas/iss-manifest.schema.json','tools/iss-ebeas',
    m.traceability.e2eSuitePath,m.traceability.checklistPath,'.github/workflows/iss-ebeas-release.yml',...m.platform.sourceRoots])
    assert.ok(first.inputs.includes(anchor),anchor);
  assert.ok(first.filesInventoried>10);
  assert.match(first.validationDigest,/^[a-f0-9]{64}$/);
  assert.deepEqual(first.exclusions,[]);
  const r=await gate.evaluate({root,stage:'build',env:{}});
  assert.equal(check(r,'G4-VALIDATION-INPUTS').status,'PASSED');
  assert.equal(check(r,'G4-VALIDATION-INPUTS').detail.executedByThisCheck,false);
  assert.equal(r.releaseReadiness,'NOT_EVALUATED');
  assert.equal(r.signature,'UNSIGNED_LOCAL_RECEIPT');
});

for(const file of ['tests/e2e/browser.test.ts','.github/workflows/iss-ebeas-release.yml','package-lock.json',
  'schemas/iss-manifest.schema.json','iss-manifest.json','tools/iss-ebeas/gate.mjs','client/src/protocol.rs'])
  test('validation digest changes when only '+file+' changes',t=>{
    const {root,m}=fixture(t), before=inventory(root,m).validationDigest;
    fs.appendFileSync(path.join(root,file),'\n ');
    assert.notEqual(inventory(root,m).validationDigest,before);
  });

test('raw bytes, not lossy UTF-8 conversion, determine the validation digest',t=>{
  const {root,m}=fixture(t), file=path.join(root,'tests/e2e/fixture.bin');
  fs.writeFileSync(file,Buffer.from([0x80]));const before=inventory(root,m).validationDigest;
  fs.writeFileSync(file,Buffer.from([0x81]));assert.notEqual(inventory(root,m).validationDigest,before);
});
for(const extension of ['rs','go','unknown-format']) test('v3 inventories a '+extension+'-only root without claiming semantic scanning',async t=>{
  const {root,m}=fixture(t);
  fs.rmSync(path.join(root,'client/src'),{recursive:true});
  put(root,'client/src/implementation.'+extension,'Synthetic unfamiliar-language source.\n');
  const r=await gate.evaluate({root,stage:'build',env:{}});
  assert.equal(r.status,'PASS');
  const source=check(r,'G3-SOURCE-SCOPE').detail;
  assert.equal(source.filesScanned,0);
  assert.equal(source.heuristicStatus,'NOT_EVALUATED_NO_RECOGNIZED_FILES');
  assert.deepEqual(source.unrecognizedSourceRoots,['client/src']);
  assert.equal(check(r,'G4-VALIDATION-INPUTS').status,'PASSED');
  const before=inventory(root,m).validationDigest;
  fs.appendFileSync(path.join(root,'client/src/implementation.'+extension),'Changed bytes.\n');
  assert.notEqual(inventory(root,m).validationDigest,before);
});
test('v3 still blocks a truly empty unfamiliar-language source root',async t=>{
  const {root}=fixture(t);
  fs.rmSync(path.join(root,'client/src'),{recursive:true});
  fs.mkdirSync(path.join(root,'client/src'));
  const r=await gate.evaluate({root,stage:'build',env:{}});
  assert.equal(r.status,'FAIL');
  assert.equal(check(r,'G4-VALIDATION-INPUTS').detail,'EMPTY_VALIDATION_INPUT');
});
test('literal tilde filenames remain inventoried without expansion or silent exclusion',t=>{
  const {root,m}=fixture(t), before=inventory(root,m);
  const file='client/src/.training-trends.html.7bZ9vuF8gJmZEJULbpu1C~';
  put(root,file,'Synthetic tracked file with a literal tilde.\n');
  const after=inventory(root,m);
  assert.equal(after.filesInventoried,before.filesInventoried+1);
  assert.notEqual(after.validationDigest,before.validationDigest);
  m.traceability.validationInputs.push(file);
  assert.equal(inventory(root,m).validationDigest,after.validationDigest);
  assert.equal(gate.safePath(root,file,{file:true}),path.join(root,file));
  assert.throws(()=>gate.safePath(root,'client/src/~/../../outside',{exists:false}),/UNSAFE_PATH/);
});
test('legitimate nested empty marker files remain inventoried and hash-bound',t=>{
  const {root,m}=fixture(t), before=inventory(root,m);
  put(root,'client/src/__init__.py','');
  const after=inventory(root,m);
  assert.equal(after.filesInventoried,before.filesInventoried+1);
  assert.notEqual(after.validationDigest,before.validationDigest);
});

test('input order and overlapping roots do not change inventory identity',t=>{
  const {root,m}=fixture(t), before=inventory(root,m);
  const reordered=structuredClone(m);reordered.traceability.validationInputs.reverse();
  assert.deepEqual(inventory(root,reordered),before);
  const overlap=structuredClone(m);overlap.traceability.validationInputs.push('tests/e2e');
  assert.equal(inventory(root,overlap).validationDigest,before.validationDigest);
  assert.equal(inventory(root,overlap).filesInventoried,before.filesInventoried);
});

test('nested dependency/generated directories are disclosed exclusions, never executed or inventoried',t=>{
  const {root,m}=fixture(t), before=inventory(root,m).validationDigest;
  put(root,'tools/iss-ebeas/node_modules/synthetic-dependency/index.js','// Synthetic excluded dependency.\n');
  put(root,'tests/coverage/report.json',{synthetic:true});
  const after=inventory(root,m);
  assert.equal(after.validationDigest,before);
  assert.deepEqual(after.exclusions,[
    {path:'tests/coverage',reason:'GENERATED_OR_DEPENDENCY_DIRECTORY'},
    {path:'tools/iss-ebeas/node_modules',reason:'GENERATED_OR_DEPENDENCY_DIRECTORY'},
  ]);
});

for(const [name,change,error] of [
  ['missing declared input',({m})=>m.traceability.validationInputs.push('missing.toml'),'MISSING_PATH'],
  ['empty required E2E directory',({root,m})=>fs.rmSync(path.join(root,m.traceability.e2eSuitePath),{recursive:true})||fs.mkdirSync(path.join(root,m.traceability.e2eSuitePath)),'EMPTY_VALIDATION_INPUT'],
  ['empty required file',({root})=>fs.truncateSync(path.join(root,'package-lock.json'),0),'EMPTY_VALIDATION_INPUT'],
  ['traversal',({m})=>m.traceability.validationInputs.push('../outside'),'UNSAFE_PATH'],
  ['explicit excluded directory',({root,m})=>{put(root,'tests/dist/fixture.txt','Synthetic only.\n');m.traceability.validationInputs.push('tests/dist');},'EXCLUDED_VALIDATION_INPUT'],
  ['explicit descendant of excluded directory',({root,m})=>{put(root,'tests/dist/fixture.txt','Synthetic only.\n');m.traceability.validationInputs.push('tests/dist/fixture.txt');},'EXCLUDED_VALIDATION_INPUT'],
  ['evidence path',({m})=>m.traceability.validationInputs.push(m.traceability.evidencePath),'SELF_REFERENTIAL_VALIDATION_INPUT'],
  ['receipt path',({m})=>m.traceability.validationInputs.push(m.traceability.attestationOutputPath),'SELF_REFERENTIAL_VALIDATION_INPUT'],
  ['evidence parent directory',({m})=>m.traceability.validationInputs.push('audit'),'SELF_REFERENTIAL_VALIDATION_INPUT'],
  ['source root containing evidence output',({m})=>{m.traceability.evidencePath='client/src/generated-evidence.json';},'SELF_REFERENTIAL_VALIDATION_INPUT'],
  ['duplicate explicit input',({m})=>m.traceability.validationInputs.push('tests'),'INVALID_VALIDATION_INPUTS'],
  ['empty explicit list',({m})=>m.traceability.validationInputs=[],'INVALID_VALIDATION_INPUTS'],
  ['foreign signer workflow',({m})=>m.traceability.signerWorkflow='other/repository/.github/workflows/release.yml','UNTRUSTED_SIGNER_SCOPE'],
]) test('validation inventory rejects '+name,t=>{
  const f=fixture(t);change(f);assert.throws(()=>inventory(f.root,f.m),new RegExp(error));
});

test('source links cannot escape validation scope',t=>{
  const {root,m}=fixture(t);
  fs.symlinkSync('/etc/passwd',path.join(root,'tests/e2e/linked.fixture'));
  assert.throws(()=>inventory(root,m),/SYMLINK_PATH/);
});
test('hardlinked validation files are rejected',t=>{
  const {root,m}=fixture(t);
  fs.linkSync(path.join(root,'package-lock.json'),path.join(root,'tests/e2e/hardlink.fixture'));
  assert.throws(()=>inventory(root,m),/HARDLINK_FILE/);
});
test('oversized validation files are rejected before content reads',t=>{
  const {root,m}=fixture(t), large=path.join(root,'tests/e2e/oversized.fixture');
  fs.writeFileSync(large,'');fs.truncateSync(large,25_000_001);
  assert.throws(()=>inventory(root,m),/OVERSIZED_FILE/);
});
test('special validation files are rejected before content reads on the POSIX assurance runner',t=>{
  const {root,m}=fixture(t), fifo=path.join(root,'tests/e2e/special.fifo');
  const result=spawnSync('mkfifo',[fifo],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,0,'The POSIX negative-test fixture requires mkfifo.');
  assert.throws(()=>inventory(root,m),/SPECIAL_FILE/);
});

for(const [name,value] of [['missing',undefined],['mismatched','0'.repeat(64)]])
  test(name+' validation digest blocks executed-evidence acceptance',async t=>{
    const {root,m}=fixture(t), {e,now,revision}=prepareEvidence(root,m);
    if(value===undefined)delete e.validationDigest;else e.validationDigest=value;
    put(root,m.traceability.evidencePath,e);
    const r=await gate.evaluate({root,stage:'evidence',env:{GITHUB_SHA:revision},now});
    assert.equal(check(r,'G7-EXECUTED-EVIDENCE').status,'FAILED');
    assert.equal(check(r,'G7-EXECUTED-EVIDENCE').detail,'VALIDATION_DIGEST_MISMATCH');
    assert.equal(r.releaseReadiness,'BLOCKED');
  });

test('matching validation inventory passes consistency only; forged IRON and absent provenance still block release',async t=>{
  const {root,m}=fixture(t), {now,revision}=prepareEvidence(root,m);
  const r=await gate.evaluate({root,stage:'release',env:{GITHUB_SHA:revision},now});
  assert.equal(check(r,'G7-EXECUTED-EVIDENCE').status,'PASSED');
  assert.equal(check(r,'G8-IRON-ACCEPTANCE').status,'FAILED');
  assert.equal(check(r,'G9-SIGNED-PROVENANCE').status,'FAILED');
  assert.equal(r.status,'FAIL');assert.equal(r.storeApproval,'NOT_ESTABLISHED');
});

test('failed inventory cannot be replaced by a matching caller digest',async t=>{
  const {root,m}=fixture(t), {now,revision}=prepareEvidence(root,m);
  fs.rmSync(path.join(root,'package-lock.json'));
  const r=await gate.evaluate({root,stage:'evidence',env:{GITHUB_SHA:revision},now});
  assert.equal(check(r,'G4-VALIDATION-INPUTS').status,'FAILED');
  assert.equal(check(r,'G7-EXECUTED-EVIDENCE').detail,'VALIDATION_INVENTORY_REQUIRED');
});

test('legacy source scanner digest semantics remain unchanged by validation-only files',t=>{
  const {root,m}=fixture(t), before=gate.scanRoots(root,m.platform.sourceRoots).sourceDigest;
  fs.appendFileSync(path.join(root,'tests/e2e/browser.test.ts'),'// changed synthetic fixture\n');
  assert.equal(gate.scanRoots(root,m.platform.sourceRoots).sourceDigest,before);
});

test('new interpretation preserves static-delivery restrictions and executed evidence boundaries',async t=>{
  const {root,m}=fixture(t);
  m.platform.runtimeTargets=['WEB_STATIC'];
  m.platform.staticDelivery={kind:'ANONYMOUS_READ_ONLY',serverDataClassification:['PUBLIC'],inquiryProcessing:'NONE',visitorAccounts:false,serverSubmission:false,applicationStorage:false,protectedPayloads:false,offlineRuntime:false,entrypoints:['client/src/index.html']};
  m.experienceTrack.performanceBudgets.offlineFirstReady=false;
  Object.assign(m.assuranceTrack.cryptography,{inTransit:'HTTPS_PROVIDER_MANAGED',atRest:'NO_APPLICATION_STORAGE',e2ePayloadEncryption:false,authMechanism:[]});
  Object.assign(m.assuranceTrack.storeCompliance,{accountCreation:false,pwaManifestPath:null});
  put(root,'client/src/index.html','<!doctype html><title>Synthetic static inventory fixture</title>\n');
  put(root,'iss-manifest.json',m);
  const r=await gate.evaluate({root,stage:'build',env:{}});
  assert.equal(r.status,'PASS');assert.equal(r.releaseReadiness,'NOT_EVALUATED');
  m.platform.staticDelivery.serverSubmission=true;put(root,'iss-manifest.json',m);
  assert.equal(check(await gate.evaluate({root,stage:'build',env:{}}),'G1-MANIFEST').status,'FAILED');
});
