import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runEvaluation,EVALUATION_MODEL,evidenceReady} from '../scripts/run-synthesis-evaluation';
for(const status of [401,402,403,429])test(`source HTTP ${status} stops real evaluator before any model call`,async()=>{
 const cwd=process.cwd(),directory=mkdtempSync(join(tmpdir(),'dis-eval-stop-'));
 const oldFetch=globalThis.fetch;const before={...process.env};let modelCalls=0,sourceCalls=0;
 try{
  process.chdir(directory);process.env.VERCEL_OIDC_TOKEN='fixture-not-a-real-credential';
  globalThis.fetch=async(input)=>{const url=String(input);if(url.endsWith('/v1/models'))return new Response(JSON.stringify({data:[{id:EVALUATION_MODEL,type:'language',pricing:{input:'0',output:'0'}}]}),{status:200});if(url.startsWith('https://api.openalex.org/works')){sourceCalls++;return new Response('{}',{status});}modelCalls++;throw Error('Unexpected downstream invocation');};
  await runEvaluation({sha:'a'.repeat(40),count:1000,concurrency:4,deadline:Date.now()+5000});
  const receipt=JSON.parse(readFileSync('public/dis-evaluation/summary.json','utf8'));
  assert.equal(receipt.state,'STOPPED');assert.equal(receipt.stopReason,'SOURCE_AUTH_QUOTA_OR_BUDGET_HTTP_'+status);
  assert.equal(receipt.attempted,0);assert.equal(receipt.completedSyntheses,0);assert.deepEqual(receipt.observedResponseModels,[]);assert.equal(sourceCalls,1);assert.equal(modelCalls,0);
 }finally{globalThis.fetch=oldFetch;process.chdir(cwd);for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);rmSync(directory,{recursive:true,force:true});}
});
test('empty or unavailable evidence cannot support a source-grounded generation',()=>{
 assert.equal(evidenceReady({sources:[],status:'ABSTRACT_AND_METADATA'}),false);
 assert.equal(evidenceReady({sources:[{}],status:'UNAVAILABLE'}),false);
 assert.equal(evidenceReady({sources:[{}],status:'ABSTRACT_AND_METADATA'}),true);
});
