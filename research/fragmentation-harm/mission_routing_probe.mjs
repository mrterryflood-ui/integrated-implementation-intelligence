/** Execute the real pinned planning selector; not a clinical/model performance study.
 * Usage: node mission_routing_probe.mjs path/to/enterprise-mission.ts output_dir
 * Requires the already-installed TypeScript compiler; no install/network/auth actions.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const [sourcePath,outArg]=process.argv.slice(2);
if(!sourcePath||!outArg) throw new Error('usage: source_path output_dir');
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const bytes=fs.readFileSync(sourcePath);
const blob=crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const expected='bc09094e44e146461183a5f8a7fca77c3b23e693';
assert.equal(blob,expected,'Source must match the observed Git blob, not a rewritten approximation');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'chainweb-actual-module-'));
const compile=spawnSync('tsc',[path.resolve(sourcePath),'--target','ES2022','--module','commonjs','--strict','--skipLibCheck','--outDir',temp],{encoding:'utf8'});
fs.writeFileSync(path.join(out,'typescript_compile.log'),compile.stdout+compile.stderr);
assert.equal(compile.status,0,'TypeScript compilation must succeed');
const require=createRequire(import.meta.url);
const {DISCIPLINES,designEnterpriseMission,renderEnterpriseMission}=require(path.join(temp,'enterprise-mission.js'));
const cases=[];
const anchors=[
 ['crc-first-signal','Recognize rectal bleeding and iron deficiency anemia before diagnosis.'],
 ['endometriosis','Recognize endometriosis after years of pelvic pain.'],
 ['autoimmune','Recognize autoimmune symptoms before organ damage.'],
 ['vaping','Reduce adolescent vaping before addiction develops.']
];
const disclaimer=' This is not a business, market, enterprise, funding, grant, contract, procurement, organization, revenue, operations, or leadership project.';
for(const [id,problem] of anchors){
 cases.push({id,kind:'plain_language_anchor',problem});
 cases.push({id:id+'-health-word',kind:'meaning_preserving_domain_word',problem:'Healthcare: '+problem});
 cases.push({id:id+'-excluded-admin',kind:'negated_irrelevant_context',problem:problem+disclaimer});
 cases.push({id:id+'-explicit-focus',kind:'human_selected_focus',problem,focus:'health-wellbeing'});
}
cases.push({id:'explicit-health-control',kind:'positive_control',problem:'Healthcare hospital clinic prevention patient'});
cases.push({id:'duplicate-tokens-control',kind:'duplicate_tokens',problem:'Healthcare hospital clinic prevention patient '.repeat(5)});
cases.push({id:'case-control',kind:'case_invariance',problem:'HEALTHCARE HOSPITAL CLINIC PREVENTION PATIENT'});
cases.push({id:'unrelated-control',kind:'negative_control',problem:'Uncategorized question needing clarification'});
cases.push({id:'tie-order-control',kind:'equal_cue_tie',problem:'cancer'});
const prefix='background '.repeat(112);
cases.push({id:'tail-information',kind:'over_limit_tail',problem:prefix+'healthcare endometriosis pelvic pain first warning sign'});
cases.push({id:'head-information',kind:'same_tokens_reordered',problem:'healthcare endometriosis pelvic pain first warning sign '+prefix});
// Freeze exact cases before execution. These are exploratory software challenge inputs.
fs.writeFileSync(path.join(out,'routing_casebook.json'),JSON.stringify({status:'EXPLORATORY_SOFTWARE_TEST_NOT_CLINICAL_COHORT',cases},null,2)+'\n');
const results=cases.map(c=>{
 const m=designEnterpriseMission(c.problem,c.focus);
 const terms=new Set(m.problem.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean));
 const ranked=DISCIPLINES.map((d,i)=>({id:d.id,order:i,matchedCues:d.cues.filter(v=>terms.has(v)),score:d.cues.filter(v=>terms.has(v)).length})).sort((a,b)=>b.score-a.score||a.order-b.order);
 return {...c,primary:m.primary?.id??null,contributing:m.contributing.map(x=>x.id),ranked,
  inputCharacters:c.problem.length,retainedCharacters:m.problem.length,
  problemRetainedExactly:m.problem===c.problem,hasTruncationField:Object.keys(m).some(k=>/truncat/i.test(k)),
  state:m.state,unverifiedMilestones:m.milestones.every(x=>x.status==='NOT_VERIFIED'),
  noPartnersEnrolled:m.universityResearch.every(x=>x.status==='NOT_ENGAGED'||x.status==='PUBLIC_DISCOVERY_ONLY'),
  unresolvedPromptVisible:renderEnterpriseMission(m).includes('UNRESOLVED'),
  actualFunctionExecuted:true,clinicalOutcomeEvaluated:false};
});
const by=Object.fromEntries(results.map(r=>[r.id,r]));
const checks=[];
function check(name,fn){try{fn();checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',message:e.message});}}
check('all outputs remain design proposals',()=>assert.ok(results.every(r=>r.state==='DESIGN_PROPOSAL_NOT_EXECUTED')));
check('all milestones remain unverified',()=>assert.ok(results.every(r=>r.unverifiedMilestones)));
check('no partnerships asserted',()=>assert.ok(results.every(r=>r.noPartnersEnrolled)));
check('unknown topic has visible unresolved fallback',()=>{assert.equal(by['unrelated-control'].primary,null);assert.ok(by['unrelated-control'].unresolvedPromptVisible)});
check('positive control classifies health',()=>assert.equal(by['explicit-health-control'].primary,'health-wellbeing'));
check('duplicate tokens do not inflate routing',()=>assert.equal(by['duplicate-tokens-control'].primary,by['explicit-health-control'].primary));
check('case does not change routing',()=>assert.equal(by['case-control'].primary,by['explicit-health-control'].primary));
check('human focus controls requested discipline',()=>assert.ok(anchors.every(([id])=>by[id+'-explicit-focus'].primary==='health-wellbeing')));
const observations={
 plain_language_anchors:anchors.map(([id])=>({id,primary:by[id].primary,withHealthcareWord:by[id+'-health-word'].primary,withExcludedAdminContext:by[id+'-excluded-admin'].primary})),
 unrecognized_anchor_count:anchors.filter(([id])=>by[id].primary===null).length,
 exclusion_ignored_count:anchors.filter(([id])=>by[id+'-excluded-admin'].primary==='business-organizations').length,
 equal_cue_tie:{primary:by['tie-order-control'].primary,ranked:by['tie-order-control'].ranked.slice(0,2)},
 truncation:{tail:{input:by['tail-information'].inputCharacters,retained:by['tail-information'].retainedCharacters,primary:by['tail-information'].primary,flag:by['tail-information'].hasTruncationField},head:{primary:by['head-information'].primary}}
};
const receipt={schema:'chainweb-actual-planner-boundary-audit-v1',observed_at_utc:new Date().toISOString(),
 repository:'mrterryflood-ui/integrated-implementation-intelligence',source_commit:'06f21b4ef5fa3007c22acfaee453f8ee0ef0d452',
 source_path:'apps/dis-platform/lib/enterprise-mission.ts',source_blob_sha:blob,
 source_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),node:process.version,
 compiler_exit:compile.status,test_input_count:cases.length,checks,observations,
 scope:'Real deterministic function executed locally with synthetic software challenge inputs; not user study, production-browser test or clinical evidence.',
 limits:['This selector routes optional planning lenses; it is not the unseen Agent2 complete scoring system.','Null routing is an explicit fallback, not proof that the broad intake rejects the issue.','Negation/order sensitivity is bounded to this function; downstream clinical consequences were not measured.','No scoring against competent current practice or independent adjudication occurred.','No live services, database, authentication, external actions or remote agents were invoked.']};
fs.writeFileSync(path.join(out,'routing_probe_results.json'),JSON.stringify(receipt,null,2)+'\n');
fs.writeFileSync(path.join(out,'routing_probe_case_outputs.json'),JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
fs.rmSync(temp,{recursive:true,force:true});
assert.ok(checks.every(x=>x.status==='PASS'),'Functional invariants failed');
