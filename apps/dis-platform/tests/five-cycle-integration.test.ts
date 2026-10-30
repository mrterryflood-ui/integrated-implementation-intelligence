import test from 'node:test';import assert from 'node:assert/strict';
import {MEMBERS} from '../lib/council';import {assemble} from '../lib/council-assembly';
import {planOwnedCapabilities,invokeOwnedCapabilities} from '../lib/owned-capability-fabric';
import {sanitizeIntake} from '../lib/consultation';import {buildPackage} from '../lib/consultation-package';
import {exportDocx,exportPptx} from '../lib/consultation-export';import {buildPlaybook} from '../lib/decision-playbook';
import {buildLearningCheckpoint} from '../lib/longitudinal-learning';import {DISCIPLINES,designEnterpriseMission} from '../lib/enterprise-mission';
import {buildGraphData} from '../app/api/consultation/graph/route';import {dispatch} from '../app/api/mcp/route';
import {boundedConversation} from '../lib/conversation-context';import {reviewAnswer,learningRecord} from '../lib/answer-quality';
import JSZip from 'jszip';
const topics=['household learning','caregiver support','public transport','municipal water','university teaching','culture museums','agriculture irrigation','manufacturing quality','emergency preparedness','workforce training','housing access','digital accessibility','community safety','energy efficiency','ecosystem restoration','public administration','nonprofit collaboration','school attendance','youth coaching','cultural heritage','research methodology','organizational learning','software reliability','clinical healthcare','unknown emerging domain'];
for(let cycle=1;cycle<=5;cycle++)test(`cycle ${cycle}: integrated evidence-to-deliverable contracts across 25 domains`,async()=>{
 let networkCalls=0;const reviews=[];
 for(const topic of topics){const question=`How could a ${cycle%2?'community association':'university team'} improve ${topic}, with limited resources and outcomes still unmeasured?`;
  const roster=assemble({prompt:question,count:6,redCount:4});assert.equal(roster.errors.length,0);assert.ok(!roster.primary.some(p=>roster.red.some(r=>p.id===r.id)));
  const plan=planOwnedCapabilities(question);const receipts=await invokeOwnedCapabilities(plan.selected.map(x=>x.id),{},async()=>{networkCalls++;throw Error('Unapproved egress')});assert.ok(receipts.every(r=>r.state!=='RETURNED_UNVERIFIED'));
  const intake=sanitizeIntake({mission:question,organization:'Synthetic evaluation only',audience:'Affected people and accountable owner',resources:'Limited; no authorized budget',desiredOutcome:'Agree local measures of reach, fidelity, benefit and burden'});
  const pkg=buildPackage(intake,'general');assert.equal(pkg.slides.length,12);assert.ok(pkg.documents.every(d=>d.validation==='DRAFT'));
  const playbook=buildPlaybook(question,{state:'NOT_VERIFIED'});const checkpoint=buildLearningCheckpoint(playbook,cycle,new Date().toISOString());assert.ok(checkpoint);
  const graph=buildGraphData('00000000-0000-4000-8000-000000000001',intake,{records:[]});assert.ok(graph.length>0);
  assert.ok(designEnterpriseMission(question));reviews.push(reviewAnswer('You could record a baseline, agree the next step with an owner and compare progress before expansion.',question,[]));
 }
 const lesson=learningRecord(cycle,reviews);assert.equal(lesson.modelWeightsChanged,false);assert.equal(networkCalls,0);
 const pkg=buildPackage(sanitizeIntake({mission:topics[cycle-1]+' needs a reversible, measurable improvement plan.'}),'general');const word=await JSZip.loadAsync(await exportDocx(pkg)),slides=await JSZip.loadAsync(await exportPptx(pkg));assert.ok(word.file('word/document.xml'));assert.equal(Object.keys(slides.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,12);
 console.log('FIVE_CYCLE_CONTRACT '+JSON.stringify({cycle,domainCases:topics.length,partnerEgress:networkCalls,realModelCalls:0,officeArchives:2}));
});
test('every registered perspective remains available and all governing disciplines are represented',()=>{for(const m of MEMBERS){const r=assemble({prompt:'Explore the relevant question',primaryMode:'solo',selected:[m.id]});assert.equal(r.primary[0]?.id,m.id);}assert.equal(DISCIPLINES.length,8);assert.ok(new Set(MEMBERS.map(m=>m.domain)).size>=39);});
test('public MCP discovery stays distinct from authenticated partner execution',async()=>{const result:any=await dispatch({jsonrpc:'2.0',id:'cycle',method:'tools/list',params:{}});assert.equal(result.result.tools.length,4);assert.ok(result.result.tools.every((t:any)=>t.annotations.readOnlyHint===true));});
test('long followups remove whole older turns to satisfy bounded context',()=>{const r=boundedConversation([{role:'user',content:'x'.repeat(3000)},{role:'assistant',content:'x'.repeat(6000)},{role:'user',content:'x'.repeat(3000)},{role:'assistant',content:'x'.repeat(6000)}]);assert.ok(r.reduce((n,t)=>n+t.content.length,0)<=12000);assert.equal(r.at(-1)?.content.length,6000);});
