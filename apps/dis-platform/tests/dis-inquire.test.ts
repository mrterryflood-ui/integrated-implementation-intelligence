import test from 'node:test';
import assert from 'node:assert/strict';
import {investigateMethod,type Inquiry} from '../lib/dis-inquire';

const baseline=():Inquiry=>({
  id:'fictional-process-eval',decisionAsOf:'2026-11-06T10:00:00Z',
  question:'Does the revised service reduce harmful missed appointments?',
  intendedUse:'Research planning; no actual client decisions',
  decisionOwner:'Human quality-improvement lead',
  targetPopulation:'Synthetic outpatient service population',
  targetOutcome:'Missed appointments with material harm',
  systemContext:'Fictional quality-improvement service and human oversight',
  searchFrame:{
    phenomenon:'Why actual harmful missed appointments occur',
    constructsToDistinguish:['Recorded appointment misses','Harm experienced'],
    discriminatingObservation:'Independently adjudicated outcome and unchanged count definition',
    scopeAndBoundaries:'Fictional sample under specified period',
    unresolvedPossibilities:['Unmeasured access and scheduling effects']
  },
  hypotheses:[
    {id:'h1',explanation:'Earlier communication might reduce missed appointments',
      predictedObservations:['Fewer missed appointments on a matched comparator'],
      disconfirmingObservations:['No change after controlling for context and case mix'],
      alternativesConsidered:['Eligibility coding changed','Seasonality or staff behavior changed']},
    {id:'h2',explanation:'A coding change may create apparent improvement',
      predictedObservations:['Change in missingness or denominator after coding revision'],
      disconfirmingObservations:['Stable definitions with independently reviewed records'],
      alternativesConsidered:['Real behavioral change']}
  ],
  instruments:[{
    id:'source-1',name:'Fictional administrative system',
    construct:'Missed appointment count',unit:'count',
    intendedScope:'Synthetic outpatient service population',
    limitation:'Administrative coding may miss actual harm',
    sourceId:'official-register',originalLineage:'original-register-A',
    kind:'MEASUREMENT',observedAt:'2026-11-04T09:00:00Z',
    retrievedAt:'2026-11-05T09:00:00Z',
    validationEvidence:'Independent fictional recoding procedure',
    fitForUseJustification:'Used only as an operational count, not patient impact'
  }],
  evidence:[{
    id:'e1',claim:'Administrative missed visits fell',kind:'DESCRIPTIVE',
    instrumentIds:['source-1'],targetOutcome:'Count of missed visits',
    referencePopulation:'Fictional population',uncertaintyReported:true
  }],
  proposedDecision:{
    action:'Evaluate a reversible change in staff outreach',
    options:['Continue existing process','Limited supervised test'],
    currentPracticeComparator:'Current scheduling service',
    potentialHarms:['Excessive outreach workload','Unequal access'],
    measureOfSuccess:'Reduction in independently adjudicated harmful misses',
    futureOwner:'Quality lead',
    reviewOrStopTrigger:'Stop or revise if material harms increase'
  }
});
const codes=(x:Inquiry)=>investigateMethod(x).findings.map(f=>f.id);
test('complete method is still never clinical advice or certification of an effect',()=>{
  const r=investigateMethod(baseline());
  assert.equal(r.version,'dis-inquire-method-v0.1');
  assert.equal(r.state,'METHOD_REVIEW_REQUIRED');
  assert.equal(r.findings.length,0);
  assert.equal(r.evidenceLevels.studyEffectEstablished,false);
  assert.equal(r.evidenceLevels.clinicalRecommendationAuthorized,false);
  assert.equal(r.evidenceLevels.actionAuthorized,false);
  assert.equal(r.evidenceLevels.noUniversalConfidenceScore,true);
  assert.ok(r.methodologicalQuestions.some(q=>/refute/.test(q)));
});
test('do not prescribe a fixed test or foreclose open investigation',()=>{
  const r=investigateMethod(baseline());
  assert.ok(r.methodologicalQuestions.some(q=>/What does each instrument truly measure/.test(q)));
  assert.ok(!r.methodologicalQuestions.some(q=>/order .*lab|diagnos|take supplement|buy capsule/i.test(q)));
  assert.equal('recommendedDiagnosis' in r,false);
  assert.equal('recommendedTreatment' in r,false);
  assert.equal('truthScore' in r,false);
});
test('an appealing mechanism does not establish an improved beneficiary outcome',()=>{
  const x=baseline();
  x.evidence=[{id:'mechanism',claim:'Candidate mechanism appears plausible',kind:'MECHANISTIC',
    instrumentIds:['source-1'],targetOutcome:'Surrogate marker',referencePopulation:'Fictional sample',
    targetBenefitMeasured:true,uncertaintyReported:false},
    {id:'therapy',claim:'Treatment prevents harm',kind:'INTERVENTION_EFFECT',
      instrumentIds:['source-1'],targetOutcome:'Actual harm',referencePopulation:'Fictional sample',
      comparison:null,causalIdentification:null,targetBenefitMeasured:false,uncertaintyReported:false}];
  const r=investigateMethod(x);
  assert.equal(r.state,'NOT_READY_FOR_CLAIM');
  assert.ok(codes(x).includes('MECHANISM_VERSUS_OUTCOME'));
  assert.ok(codes(x).includes('BENEFIT_NOT_MEASURED'));
  assert.ok(codes(x).includes('CAUSAL_CLAIM_NO_COUNTERFACTUAL'));
  assert.ok(codes(x).includes('UNCERTAINTY_NOT_REPORTED'));
});
test('two instruments measuring different constructs must not be blindly pooled',()=>{
  const x=baseline();
  x.instruments.push({...x.instruments[0],id:'source-2',name:'Second measure',
    construct:'Participant experience',unit:'reported category',
    originalLineage:'distinct-sensor-B'});
  assert.ok(codes(x).includes('MULTIPLE_CONSTRUCTS'));
  assert.equal(investigateMethod(x).evidenceLevels.noUniversalConfidenceScore,true);
});
test('two displays from shared original lineage are not independent evidence',()=>{
  const x=baseline();x.instruments.push({...x.instruments[0],id:'screen-2',
    sourceId:'aggregator-B',originalLineage:'original-register-A'});
  const r=investigateMethod(x);
  assert.equal(r.state,'NOT_READY_FOR_CLAIM');
  const issue=r.findings.find(f=>f.id==='REUSED_ORIGINAL_LINEAGE');
  assert.deepEqual(issue?.relatedIds,['source-1','screen-2']);
});
test('future receipts cannot support earlier decisions',()=>{
  const x=baseline();
  x.instruments[0].retrievedAt='2026-11-06T10:00:01Z';
  assert.ok(codes(x).includes('NOT_KNOWN_AT_DECISION'));
  assert.equal(investigateMethod(x).state,'NOT_READY_FOR_CLAIM');
});
test('missing timezone and clock conflict are not converted into timestamps',()=>{
  const x=baseline();x.decisionAsOf='2026-11-06 10:00';x.instruments[0].observedAt='2026-11-07T10:00:00Z';
  const c=codes(x);
  assert.ok(c.includes('AS_OF_INVALID'));
  assert.ok(c.includes('TIME_SEQUENCE_CONTRADICTS'));
});
test('challenging a favored explanation is mandatory rather than a list of fashionable causes',()=>{
  const x=baseline();
  x.hypotheses=[{id:'one',explanation:'One attractive story',
    predictedObservations:[],disconfirmingObservations:[],alternativesConsidered:[]}];
  const c=codes(x);assert.ok(c.includes('HYPOTHESIS_NOT_TESTABLE'));
  assert.ok(c.includes('NO_FALSIFIER'));assert.ok(c.includes('ONE_STORY_ONLY'));
});
test('validation belongs to instrument and intended use, not numerical precision alone',()=>{
  const x=baseline();
  x.instruments[0].validationEvidence=null;x.instruments[0].fitForUseJustification=null;
  assert.ok(codes(x).includes('INSTRUMENT_FIT_UNSUPPORTED'));
});
test('effect claims need comparator, external population, and uncertainty',()=>{
  const x=baseline();
  x.evidence=[{id:'r1',kind:'PREDICTIVE',claim:'The model will predict risk',
    instrumentIds:['source-1'],targetOutcome:'Predicted count',
    referencePopulation:'Fictional service',uncertaintyReported:false}];
  const c=codes(x);assert.ok(c.includes('TRANSPORT_UNVERIFIED'));
  assert.ok(c.includes('UNCERTAINTY_NOT_REPORTED'));
});
test('an action has to be compared with competent practice and planned after success',()=>{
  const x=baseline();
  x.proposedDecision!.currentPracticeComparator=null;
  x.proposedDecision!.futureOwner=null;x.proposedDecision!.reviewOrStopTrigger=null;
  const c=codes(x);
  assert.ok(c.includes('DECISION_ALTERNATIVES_MISSING'));
  assert.ok(c.includes('DAY_AFTER_SUCCESS_UNPLANNED'));
});
test('empty evidence is a methodological gap, not a clean bill of health',()=>{
  const x=baseline();x.instruments=[];x.evidence=[];x.hypotheses=[];x.proposedDecision=undefined;
  const c=codes(x);
  assert.ok(c.includes('NO_ALTERNATIVE_EXPLANATIONS'));
  assert.ok(c.includes('INSTRUMENT_SELECTION_NOT_EXPLAINED'));
  assert.ok(c.includes('NO_DECISION_CONTRACT'));
  assert.equal(investigateMethod(x).evidenceLevels.studyEffectEstablished,false);
});
test('unreferenced claims are held for independent source and method inspection',()=>{
  const x=baseline();
  x.evidence[0].instrumentIds=['missing-id'];
  const r=investigateMethod(x);
  assert.equal(r.state,'NOT_READY_FOR_CLAIM');
  assert.ok(codes(x).includes('EVIDENCE_LINK_MISSING'));
});


test('Holmes elimination never assumes the hypothesis list is exhaustive',()=>{
  const x=baseline();
  x.searchFrame!.unresolvedPossibilities=[];
  const r=investigateMethod(x);
  assert.ok(codes(x).includes('OPEN_WORLD_UNKNOWN'));
  assert.equal(r.evidenceLevels.allPossibleExplanationsConsidered,false);
  assert.equal(r.evidenceLevels.automatedHypothesisEliminationAuthorized,false);
});
test('what is being sought and what is being measured cannot be silently conflated',()=>{
  const x=baseline();
  x.searchFrame=undefined;
  assert.ok(codes(x).includes('SEARCH_FRAME_INCOMPLETE'));
  assert.ok(investigateMethod(x).methodologicalQuestions[0].includes('what is the phenomenon'));
});
test('a hypothesis is not eliminated because a hypothetical persona says so',()=>{
  const x=baseline();
  x.instruments[0].kind='PERSONA_PROMPT';
  x.hypotheses[0].proposedExclusion={
    status:'EXCLUDE_IN_DEFINED_SCOPE',evidenceIds:['e1'],
    distinguishingObservation:'A fictional observation did not occur',
    applicableScope:'Synthetic group',limitations:['Unmeasured alternatives']
  };
  const r=investigateMethod(x);
  assert.equal(r.state,'NOT_READY_FOR_CLAIM');
  assert.ok(codes(x).includes('UNSUPPORTED_HYPOTHESIS_EXCLUSION'));
  assert.equal(r.evidenceLevels.automatedHypothesisEliminationAuthorized,false);
});
test('eliminating an explanation without linked evidence, scope, or limitations is held',()=>{
  const x=baseline();
  x.hypotheses[0].proposedExclusion={
    status:'EXCLUDE_IN_DEFINED_SCOPE',evidenceIds:['unavailable'],
    distinguishingObservation:'',applicableScope:'',limitations:[]
  };
  assert.ok(codes(x).includes('UNSUPPORTED_HYPOTHESIS_EXCLUSION'));
});
test('even well-described proposed elimination requires independent evidence adjudication',()=>{
  const x=baseline();
  x.hypotheses[0].proposedExclusion={
    status:'EXCLUDE_IN_DEFINED_SCOPE',evidenceIds:['e1'],
    distinguishingObservation:'Independently measured count remains unchanged',
    applicableScope:'Fictional study population only',
    limitations:['Small case series','Incomplete follow-up']
  };
  const r=investigateMethod(x);
  assert.ok(r.findings.some(f=>f.id==='EXCLUSION_REQUIRES_ADJUDICATION'&&f.level==='INVESTIGATE'));
  assert.equal(r.evidenceLevels.allPossibleExplanationsConsidered,false);
  assert.equal(r.evidenceLevels.actionAuthorized,false);
});
