/** Runs the actual pure production modules; no package install, network or secrets. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {diagnosePretrends} from '../../apps/dis-platform/lib/evidence-action-pretrend.ts';
import {reviewOutcomeEquity} from '../../apps/dis-platform/lib/outcome-equity-assurance.ts';
const here=dirname(fileURLToPath(import.meta.url));
const fixture=readFileSync(resolve(here,'fixtures.json'));
const cases=JSON.parse(fixture.toString('utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const close=(a,b)=>a===null||b===null?assert.equal(a,b):assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const pretrends=cases.pretrends.map(c=>{
 const output=diagnosePretrends(c.input);
 for(const [k,v] of Object.entries(c.expected))typeof v==='number'||v===null?close(output[k],v):assert.equal(output[k],v);
 assert.equal(output.parallelTrendsEstablished,false);assert.equal(output.causalEffectEstablished,false);
 return {id:c.id,output};
});
const equity=cases.equity.map(c=>{
 const output=reviewOutcomeEquity(c.input);
 close(output.overallChange,c.expected.overallChange);assert.equal(output.state,c.expected.state);
 assert.equal(output.groupChanges.length,c.expected.groupChanges.length);
 output.groupChanges.forEach((x,i)=>close(x.change,c.expected.groupChanges[i]));
 assert.equal(output.equitableSuccessEstablished,false);assert.equal(output.causalEffectEstablished,false);
 return {id:c.id,output};
});
const inputHashes=Object.fromEntries(['fixtures.json','../../apps/dis-platform/lib/evidence-action-pretrend.ts','../../apps/dis-platform/lib/outcome-equity-assurance.ts'].map(p=>[p,sha(readFileSync(resolve(here,p)))]));
const output={schema:'dis-owner-reproduction-v1',fixtureOrigin:cases.origin,inputHashes,pretrends,equity,checksPassed:pretrends.length+equity.length,independentInvestigatorReplication:false,scientificSuperiorityEstablished:false};
mkdirSync(resolve(here,'results'),{recursive:true});
writeFileSync(resolve(here,'results/results.json'),JSON.stringify(output,null,2)+'\n');
console.log(`PASS: ${output.checksPassed} synthetic scenarios. No empirical superiority, equitable success or causal effect established.`);
