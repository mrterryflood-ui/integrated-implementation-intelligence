import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluationConfig,structuralScores,EVALUATION_MODEL} from '../scripts/run-synthesis-evaluation';
const now=1793399900000,sha='a'.repeat(40);
const valid={DIS_EVAL_ENABLE:'owner-approved-preview',VERCEL_ENV:'preview',VERCEL_PROJECT_ID:'prj_LVFxxat2yPL4kKgzB2xDNqaVlXAT',VERCEL_GIT_COMMIT_SHA:sha,DIS_EVAL_APPROVED_SHA:sha,DIS_EVAL_MAX_RUNS:'1000',DIS_EVAL_CONCURRENCY:'4',DIS_EVAL_DEADLINE:new Date(now+1800000).toISOString()};
test('real-model evaluation is inert without exact-head preview authority',()=>{
 assert.equal(evaluationConfig({},now),null);
 for(const altered of [{VERCEL_ENV:'production'},{VERCEL_ENV:'development'},{VERCEL_PROJECT_ID:'another-project'},{VERCEL_GIT_COMMIT_SHA:'b'.repeat(40)},{DIS_EVAL_APPROVED_SHA:'main'},{DIS_EVAL_ENABLE:'true'}])assert.equal(evaluationConfig({...valid,...altered},now),null);
 assert.equal(evaluationConfig(valid,now)?.count,1000);
 assert.equal(evaluationConfig(valid,now)?.deadline,now+900000);
});
test('expired, unbounded and malformed batches fail closed',()=>{
 for(const value of ['0','1001','NaN','1.5','Infinity'])assert.equal(evaluationConfig({...valid,DIS_EVAL_MAX_RUNS:value},now),null);
 for(const value of ['0','5','NaN','1.5'])assert.equal(evaluationConfig({...valid,DIS_EVAL_CONCURRENCY:value},now),null);
 for(const value of ['bad',new Date(now-1).toISOString(),new Date(now+3600001).toISOString()])assert.equal(evaluationConfig({...valid,DIS_EVAL_DEADLINE:value},now),null);
});
test('evaluation scores never equate cited IDs or text structure with claim truth',()=>{
 const score=structuralScores('An unverified hypothesis [S1] and invented identifier [S99]; consider alternatives, baseline, fidelity and an owner.',['S1']);
 assert.deepEqual(score.unknownCitationIds,['S99']);
 assert.equal(score.claimEntailment,'NOT_INDEPENDENTLY_SCORED');
 assert.ok(EVALUATION_MODEL.endsWith('-free'));
});
