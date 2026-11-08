import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosePretrends} from '../lib/evidence-action-pretrend';
const row=(year:number,value:unknown,denominator:unknown=100)=>({year,value,denominator});
const panel=(a:unknown[]=[10,12,14],b:unknown[]=[9,9,9],ys:number[]=[2018,2019,2020])=>({unit:'synthetic units',interventionYear:2021,
 treated:{observations:a.map((v,i)=>row(ys[i],v))},comparator:{observations:b.map((v,i)=>row(ys[i],v))}});
const near=(a:number|null,b:number|null)=>assert.ok(a!==null&&b!==null&&Math.abs(a-b)<1e-10,`${a} != ${b}`);
const auditInvalid=(p:unknown)=>{const d=diagnosePretrends(p);assert.equal(d.state,'INVALID_PANEL');assert.equal(d.gapSlopePerYear,null);return d;};
test('divergent pretrends: +2 versus 0 are computed, not accepted as causal',()=>{
 const d=diagnosePretrends(panel());near(d.treatedSlopePerYear,2);near(d.comparatorSlopePerYear,0);near(d.gapSlopePerYear,2);
 assert.deepEqual(d.points.map(p=>p.gap),[1,3,5]);near(d.gapRange,4);near(d.endpointGapChange,4);
 assert.ok(d.warnings.some(x=>x.startsWith('OBSERVED_PREPERIOD_GAP_VARIES')));
 assert.equal(d.parallelTrendsEstablished,false);assert.equal(d.statisticalTestPerformed,false);assert.equal(d.causalEffectEstablished,false);
});
test('constant observed gap never proves parallel post-treatment counterfactual',()=>{
 const d=diagnosePretrends(panel([10,11,12],[9,10,11]));near(d.gapSlopePerYear,0);near(d.gapRange,0);
 assert.equal(d.parallelTrendsEstablished,false);assert.ok(d.warnings.some(x=>x.startsWith('CONSTANT_OBSERVED_GAP')));
});
test('nonlinear U pattern with zero linear slope remains visible',()=>{
 const d=diagnosePretrends(panel([10,14,10],[9,9,9]));near(d.gapSlopePerYear,0);near(d.gapRange,4);
 assert.ok(d.linearGapResidualRms!==null&&d.linearGapResidualRms>1.8);assert.ok(d.warnings.includes('LINEAR_SLOPE_DOES_NOT_CAPTURE_ALL_PREPERIOD_PATTERN'));
});
test('unequally spaced years use actual elapsed time',()=>{
 const d=diagnosePretrends({...panel([10,14,20],[9,9,9],[2010,2012,2015]),interventionYear:2016});
 near(d.treatedSlopePerYear,2);assert.ok(d.warnings.includes('NONANNUAL_SPACING_PRESERVED_IN_SLOPE'));
});
test('unmatched years are reported, never fabricated',()=>{const p=panel();p.treated.observations.unshift(row(2017,8));
 const d=diagnosePretrends(p);assert.deepEqual(d.unmatchedPreYears.treatedOnly,[2017]);assert.equal(d.points.length,3);});
test('input ordering is immaterial and input is never mutated',()=>{const p=panel();const before=JSON.stringify(p);
 const d=diagnosePretrends(p);assert.equal(JSON.stringify(p),before);p.treated.observations.reverse();assert.deepEqual(diagnosePretrends(p),d);});
test('postperiod values cannot contaminate pretrend slopes',()=>{const p=panel();p.treated.observations.push(row(2021,999));
 p.comparator.observations.push(row(2021,1));near(diagnosePretrends(p).gapSlopePerYear,2);});
test('three preperiod minimum is disclosed as local screen, not validity proof',()=>{
 const d=diagnosePretrends(panel([10,12],[9,9],[2019,2020]));assert.equal(d.state,'INSUFFICIENT_PREPERIODS');assert.equal(d.gapSlopePerYear,null);
 assert.match(d.errors[0],/NOT_A_VALIDITY_STANDARD/);
});
test('null missing measurement is not zero',()=>{const p=panel();p.treated.observations[0].value=null;auditInvalid(p);});
test('zero is a valid observation when denominator is positive',()=>{const d=diagnosePretrends(panel([0,0,0],[0,0,0]));near(d.gapSlopePerYear,0);});
test('zero denominator is rejected',()=>{const p=panel();p.treated.observations[0].denominator=0;auditInvalid(p);});
test('missing denominator is rejected',()=>{const p=panel();p.comparator.observations[0].denominator=undefined;auditInvalid(p);});
test('numeric strings are not coerced',()=>{const p=panel();p.treated.observations[0].value='10';auditInvalid(p);});
test('duplicate years cannot be overwritten',()=>{const p=panel();p.treated.observations.push(row(2018,90));
 assert.ok(auditInvalid(p).errors.some(e=>e.includes('DUPLICATE_YEAR')));});
test('NaN and Infinity never enter computations',()=>{for(const value of [NaN,Infinity,-Infinity]){const p=panel();p.treated.observations[0].value=value;auditInvalid(p);}});
test('missing, fractional and string intervention years are rejected',()=>{for(const y of [null,2020.5,'2021',undefined])auditInvalid({...panel(),interventionYear:y});});
test('nonobject input cannot crash the assessor',()=>{for(const p of [null,undefined,[],true,'invalid',4])auditInvalid(p);});
test('malformed arms and rows cannot crash the assessor',()=>{for(const p of [{...panel(),treated:null},{...panel(),comparator:{observations:'oops'}},{...panel(),treated:{observations:[null]}}])auditInvalid(p);});
test('work is bounded at 200 rows per arm',()=>{const p=panel();p.treated.observations=Array.from({length:201},()=>row(2000,1));
 assert.ok(auditInvalid(p).errors.some(e=>e.includes('LIMIT_EXCEEDED')));});
test('unit omission remains a measurement error',()=>{auditInvalid({...panel(),unit:''});auditInvalid({...panel(),unit:25});});
test('numeric overflow is not presented as infinite diagnostic evidence',()=>{const p=panel([1e308,-1e308,1e308],[-1e308,1e308,-1e308]);
 assert.ok(auditInvalid(p).errors.includes('NUMERIC_OVERFLOW'));});
test('descriptive slopes are translation invariant across generated cases',()=>{for(let k=0;k<30;k++){
 const p=panel([k,k+1,k+2],[2*k,2*k+2,2*k+4]);const q=structuredClone(p);
 for(const arm of [q.treated,q.comparator])for(const r of arm.observations)r.value=Number(r.value)+1000;
 near(diagnosePretrends(p).gapSlopePerYear,diagnosePretrends(q).gapSlopePerYear);
}});
test('declared units scale the numbers, never scientific authority',()=>{const p=panel();const q=structuredClone(p);
 for(const arm of [q.treated,q.comparator])for(const r of arm.observations)r.value=Number(r.value)*100;
 near(diagnosePretrends(q).gapSlopePerYear,diagnosePretrends(p).gapSlopePerYear!*100);
 assert.equal(diagnosePretrends(q).causalEffectEstablished,false);
});
test('arbitrary parallel-trends prose cannot change the numeric diagnostics',()=>{
 const p=panel();assert.deepEqual(diagnosePretrends({...p,parallelTrendsEvidence:'A long confident claim of verified parallel trends'}),diagnosePretrends(p));
});
