import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewCouncilInquiry} from '../lib/council-inquiry-bridge';
import {councilEngagementAssurance} from '../lib/council-engagement-assurance';
import {convene} from '../lib/council-engine';
import {buildPackage,renderPackageMarkdown} from '../lib/consultation-package';
import {sanitizeIntake} from '../lib/consultation';
import type {EvidenceSource} from '../lib/evidence-integrity';

const asOf="2026-11-06T15:00:00Z";
const src=(id:string,over:Partial<EvidenceSource>={}):EvidenceSource=>({
  id,title:"Synthetic study title "+id,url:"https://example.test/study-"+id,
  doi:null,year:2025,abstract:"Research lead only; a plausible physiological or social mechanism is not proof of beneficiary-level intervention success.",
  source:"Synthetic registry",retrievedAt:"2026-11-06T14:00:00Z",
  evidenceKind:"SCHOLARLY_ABSTRACT",referencePeriod:"2024",geography:"Synthetic County",
  ...over
});

test('research bridge never interprets abstract text as calibrated instrument, hypothesis or treatment effect',()=>{
  const r=reviewCouncilInquiry('What caused the reported improvement?',[src('S1')],asOf);
  assert.equal(r.schemaVersion,'dis-council-inquiry-v1');
  assert.equal(r.sourceLeadIds.length,1);
  assert.equal(r.sourceLeads[0].kind,'BIBLIOGRAPHIC_LEAD');
  assert.equal(r.actualInstrumentsValidated,0);
  assert.equal(r.alternativeExplanationsIndependentlyTested,0);
  assert.equal(r.effectOrTreatmentValidated,false);
  assert.equal(r.authorizedToAct,false);
  assert.equal(r.assessment.evidenceLevels.studyEffectEstablished,false);
  assert.ok(r.assessment.findings.some(f=>f.id==='NO_ALTERNATIVE_EXPLANATIONS'));
  assert.ok(r.assessment.findings.some(f=>f.id==='INSTRUMENT_SELECTION_NOT_EXPLAINED'));
  assert.ok(r.assessment.methodologicalQuestions.some(q=>q.includes('phenomenon')));
});
test('a copied source is not elevated to a distinct observation or proof of source independence',()=>{
  const first=src('S1',{url:'https://example.test/single'});
  const second=src('S2',{url:'https://example.test/single'});
  const r=reviewCouncilInquiry('Evaluate whether these references independently validate an outcome',[first,second],asOf);
  assert.equal(r.sourceLeadIds.length,2);
  assert.equal(r.actualInstrumentsValidated,0);
  assert.equal(r.assessment.evidenceLevels.allPossibleExplanationsConsidered,false);
});
test('source-reported platform excerpt stays distinct from empirical instrument',()=>{
  const r=reviewCouncilInquiry('Can this intervention be shown to help?',[src('E1',{evidenceKind:'PLATFORM_PUBLIC_EXCERPT'})],asOf);
  assert.equal(r.sourceLeads[0].kind,'SOURCE_REPORTED_EXCERPT');
  assert.equal(r.effectOrTreatmentValidated,false);
});
test('decision time requires explicit timezone and no default historical revision is fabricated',()=>{
  assert.throws(()=>reviewCouncilInquiry('Any inquiry?',[], '2026-11-06T14:00:00'),/time zone/);
  const r=reviewCouncilInquiry('Any inquiry?',[],asOf);
  assert.equal(r.decisionAsOf,new Date(asOf).toISOString());
  assert.equal(r.assessment.state,'METHOD_REVIEW_REQUIRED');
});
test('the actual Council adds instrument-fit and causal-discrimination questions to each of its existing inference strands',async()=>{
  const old=process.env.AI_GATEWAY_MODEL;
  process.env.AI_GATEWAY_MODEL='synthetic-no-cost';
  const prompts:string[]=[];
  try{
    const report=await convene({
      prompt:'Evaluate the independent validity of a proposed service outcome.',
      count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'
    },{
      research:async()=>({sources:[src('S1')],status:'ABSTRACT_AND_METADATA'}),
      infer:async(system,prompt)=>{
        prompts.push(prompt);
        return {ok:true,text:system.includes('Return ONLY a JSON object')?
          JSON.stringify({tasks:[{title:'Investigate original measurements',success:'Evidence gap recorded'}],metrics:[]}):
          'This claim remains a research lead and independent validation is needed [S1].',model:'synthetic-no-cost'};
      }
    });
    assert.equal(prompts.length,5);
    for(const p of prompts){
      assert.match(p,/DIS_INQUIRY_PRELIMINARY_METHOD_NOT_CONTENT_VALIDATION/);
      assert.match(p,/NO_ALTERNATIVE_EXPLANATIONS/);
      assert.match(p,/INSTRUMENT_SELECTION_NOT_EXPLAINED/);
      assert.match(p,/SOURCE_MESH_PREFLIGHT/);
      assert.match(p,/independentInstrumentValidation":false/);
    }
    assert.equal(report.operatingContract.inferenceInvocationCount,5);
    assert.equal(report.operatingContract.behaviorVerified,false);
  }finally{
    if(old===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=old;
  }
});
test('Council assurance and draft export actually include the inquiry methodology and its limitations',()=>{
  const review=councilEngagementAssurance({sources:[src('S1')]},
    'Investigate whether an intervention caused an independently measured benefit');
  assert.equal(review.inquiryMethod.schemaVersion,'dis-council-inquiry-v1');
  assert.equal(review.inquiryMethod.actualInstrumentsValidated,0);
  assert.ok(review.inquiryMethod.assessment.findings.length>0);
  const pkg=buildPackage(sanitizeIntake({
    mission:'Investigate whether an intervention caused a sustainable benefit.',
    organization:'Fictional research partner'
  }),'general',null,{engagementAssurance:review});
  const annex=pkg.documents.find(d=>d.id==='engagement-assurance');
  assert.ok(annex);
  assert.match(annex.body,/Question-first inquiry/);
  assert.match(annex.body,/Falsification and measurement prompts/);
  assert.match(annex.body,/NO_ALTERNATIVE_EXPLANATIONS/);
  assert.match(annex.body,/No independent test, causal effect, or intervention benefit established/);
  assert.match(renderPackageMarkdown(pkg),/Investigation-method gaps/);
});
test('the Council UI and research tab both offer real method review, not a disconnected documentation link',()=>{
  const component=readFileSync('app/inquiry-method-studio.tsx','utf8');
  const consult=readFileSync('app/consultation-studio.tsx','utf8');
  const council=readFileSync('app/council-readiness.tsx','utf8');
  assert.match(component,/investigateMethod\(packet\)/);
  assert.match(component,/discriminatingObservation/);
  assert.match(component,/disconfirmingObservations/);
  assert.match(component,/local browser-only methodological exercise/);
  assert.doesNotMatch(component,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.match(consult,/data-testid="dis-inquiry-workflow"/);
  assert.match(consult,/<InquiryMethodStudio/);
  assert.match(council,/assurance\.inquiryMethod/);
  assert.match(council,/Question-first scientific method review/);
});
