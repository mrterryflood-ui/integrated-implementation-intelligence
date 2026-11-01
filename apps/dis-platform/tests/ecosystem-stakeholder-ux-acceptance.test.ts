import test from 'node:test';import assert from 'node:assert/strict';
import {assessStakeholderUX,UX_PILLARS,type UXAcceptance} from '../lib/ecosystem/stakeholder-ux-acceptance';
const sample:UXAcceptance={pages:[{route:'/evaluate',persona:'VA evaluator',purpose:'Review synthetic cases',functionExplanation:'Evaluate',prerequisites:'Select a case',steps:['Select','Review'],resultInterpretation:'Synthetic only',expectedOutcome:'Draft decision',nextDecision:'Seek expert review',helpLocation:'/help',visuals:[{description:'Case',relevance:'Explains the case',caption:'Synthetic case',keyboardTouchDetails:true}],measures:[{name:'Agreement',unit:'%',source:'Synthetic fixture',date:'2026-10-31',denominator:'10',uncertainty:'Not established',status:'SYNTHETIC'}]}],council:[{discipline:'Human factors',reviewStatus:'SIMULATED_LENS',finding:'Needs user testing'}],checks:UX_PILLARS.map(pillar=>({pillar,name:'review',status:'PASS',proof:'test receipt'})),chromium:'PASS',iphoneWebkit:'PASS',tablet:'PASS',keyboard:'PASS',touch:'PASS',sourceRevision:'a'.repeat(40),productionRevision:'a'.repeat(40)};
test('complete evidence contract can be accepted without inventing metrics',()=>assert.equal(assessStakeholderUX(sample).accepted,true));
test('page with no explanation fails',()=>assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],resultInterpretation:''}]}).accepted,false));
test('hover-only visualization fails',()=>assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],visuals:[{...sample.pages[0].visuals[0],keyboardTouchDetails:false}]}]}).accepted,false));
test('measured meter without denominator fails',()=>assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],measures:[{...sample.pages[0].measures[0],status:'MEASURED',denominator:''}]}]}).accepted,false));
test('missing pillar, human expertise or test evidence fails',()=>{assert.equal(assessStakeholderUX({...sample,checks:[]}).accepted,false);assert.equal(assessStakeholderUX({...sample,council:[{discipline:'Clinical',reviewStatus:'MISSING',finding:''}]}).accepted,false);assert.equal(assessStakeholderUX({...sample,iphoneWebkit:'NOT_TESTED'}).accepted,false)});
test('different production revision fails',()=>assert.equal(assessStakeholderUX({...sample,productionRevision:'b'.repeat(40)}).accepted,false));

test('all pillars cannot be waived without verification or an inapplicability reason',()=>{
 const checks=sample.checks.map(c=>({...c,status:'NOT_APPLICABLE' as const,proof:''}));
 const result=assessStakeholderUX({...sample,checks});
 assert.equal(result.accepted,false);
 assert.match(result.gaps.join(' '),/Required pillar has no passed verification/);
 assert.match(result.gaps.join(' '),/unjustified not-applicable/);
});

test('marketing may be inapplicable with a recorded reason while mandatory pillars remain verified',()=>{
 const checks=sample.checks.map(c=>c.pillar==='marketing-revenue'?{...c,status:'NOT_APPLICABLE' as const,proof:'Internal evaluation workflow; no marketing, billing or revenue functions are in scope.'}:c);
 assert.equal(assessStakeholderUX({...sample,checks}).accepted,true);
 const noReason=checks.map(c=>c.pillar==='marketing-revenue'?{...c,proof:' '}:c);
 assert.equal(assessStakeholderUX({...sample,checks:noReason}).accepted,false);
});

test('a justified individual exception cannot replace all mandatory security checks',()=>{
 const exception={pillar:'security-access' as const,name:'Payment authorization',status:'NOT_APPLICABLE' as const,proof:'This release has no payment operation.'};
 assert.equal(assessStakeholderUX({...sample,checks:[...sample.checks,exception]}).accepted,true);
 assert.equal(assessStakeholderUX({...sample,checks:[...sample.checks.filter(c=>c.pillar!=='security-access'),exception]}).accepted,false);
});

test('whitespace cannot masquerade as a walkthrough, source or test receipt',()=>{
 assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],steps:[' ']}]}).accepted,false);
 assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],purpose:' '}]}).accepted,false);
 assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],visuals:[{...sample.pages[0].visuals[0],caption:' '}]}]}).accepted,false);
 assert.equal(assessStakeholderUX({...sample,pages:[{...sample.pages[0],measures:[{...sample.pages[0].measures[0],status:'MEASURED',source:' '}]}]}).accepted,false);
 assert.equal(assessStakeholderUX({...sample,checks:sample.checks.map(c=>({...c,proof:' '}))}).accepted,false);
});

test('human UX review requires identity and a documented finding',()=>{
 const human={discipline:'Human factors',reviewStatus:'VERIFIED_HUMAN' as const,finding:'Reviewed supplied journey receipts.'};
 assert.equal(assessStakeholderUX({...sample,council:[human]}).accepted,false);
 assert.equal(assessStakeholderUX({...sample,council:[{...human,expertId:'reviewer-1'}]}).accepted,true);
 assert.equal(assessStakeholderUX({...sample,council:[{...human,expertId:'reviewer-1',finding:' '}]}).accepted,false);
});
