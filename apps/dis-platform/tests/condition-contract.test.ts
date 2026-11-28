/**
 * G13 condition contract conformance (AI review, unverified by human — not scientific acceptance,
 * not clinical acceptance, no patient benefit claimed or measured).
 *
 * These assertions exist because the medical obligations used to follow a site literal: a clinical condition
 * entered under the overloaded literal "general" with nothing declared lost all three obligations. Each test
 * below is one of the four assertions the G13 closure condition names, plus the registry-to-facade agreement
 * that keeps the contract load-bearing rather than decorative.
 *
 * No network, no data collection, no patient data. Deterministic and re-runnable at any head.
 */
import {test} from "node:test";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase,unsourcedResearchCase} from "../lib/jackson-cancer-case";
import {reviewEvidenceToAction} from "../lib/evidence-action-bridge";
import type {MeasureBinding} from "../lib/evidence-action-bridge-core";
import {
  CONDITION_PROFILES,MEDICAL_OBLIGATION_IDS,UnknownConditionError,
  declaresMedicalObligations,resolveConditionProfile,tryResolveConditionProfile
} from "../lib/condition-contract";

const expect=(condition:boolean,message:string):void=>{if(!condition)throw new Error(message);};

test("G13 (iv) an unknown condition identifier is refused by name",()=>{
  let thrown:unknown=null;
  try{resolveConditionProfile("lung");}catch(error){thrown=error;}
  expect(thrown instanceof UnknownConditionError,"resolveConditionProfile must throw UnknownConditionError for an undeclared condition");
  const refusal=thrown as UnknownConditionError;
  expect(refusal.conditionId==="lung","the refusal must carry the refused identifier");
  expect(refusal.message.includes('"lung"'),"the refusal must name the refused identifier in its message");
  expect(tryResolveConditionProfile("lung")===null,"the non-throwing lookup must return null, never guess a profile");
  expect(tryResolveConditionProfile("   ")===null,"a blank identifier must not resolve to a profile");
  expect(tryResolveConditionProfile("colorectal")!==null,"a declared identifier must resolve");
});

test("G13 (i) a clinical non-colorectal condition keeps all three obligations",()=>{
  const program=buildResearchProgram(jacksonCancerCase("breast"));
  const review=reviewEvidenceToAction(program,[]);
  const ids=review.gaps.map(g=>g.id);
  for(const id of MEDICAL_OBLIGATION_IDS)
    expect(ids.includes(id),"a breast case with no admitted measure must still carry the obligation "+id);
});

test("G13 (ii) a generic service study keeps none of the three obligations",()=>{
  const program=buildResearchProgram(unsourcedResearchCase("Which service study is this?","Population not yet defined"));
  const review=reviewEvidenceToAction(program,[]);
  const ids=review.gaps.map(g=>g.id);
  for(const id of MEDICAL_OBLIGATION_IDS)
    expect(!ids.includes(id),"a no-condition service study must not inherit the obligation "+id);
});

test("G13 (iii) a quarantined colorectal binding reopens its obligation",()=>{
  const program=buildResearchProgram(jacksonCancerCase("colorectal"));
  const indicator=program.indicators.find(i=>i.site==="colorectal"&&i.evidenceState==="PUBLISHED_AGGREGATE"&&i.value!==null&&i.sourceUrl.startsWith("https://"));
  expect(indicator!==undefined,"the colorectal case must carry at least one traceable observed colorectal indicator");
  if(!indicator)return;
  const binding:MeasureBinding={
    indicatorId:indicator.id,condition:indicator.site,construct:"DISEASE_INCIDENCE",
    denominatorClass:"DECLARED_TEST_DENOMINATOR",populationFrame:"DECLARED_TEST_FRAME",methodVersion:"TEST_BINDING_V1"
  };
  const admitted=reviewEvidenceToAction(program,[binding]);
  expect(!admitted.gaps.some(g=>g.id==="all-stage-incidence"),"an admitted incidence binding must not raise the incidence obligation");
  const quarantined=reviewEvidenceToAction(program,[binding,binding]);
  expect(quarantined.gaps.some(g=>g.id==="all-stage-incidence"),"a quarantined incidence binding must reopen the incidence obligation");
});

test("G13 the overloaded general literal is named as ambiguous, never as an exemption",()=>{
  const profile=resolveConditionProfile("general");
  expect(profile.conditionClass==="AMBIGUOUS","the overloaded literal must be classified AMBIGUOUS");
  expect(profile.obligationBasis==="DECLARED_MEASUREMENT","the overloaded literal must defer to the declared-measurement test");
});

test("G13 the registry and the shipped facade agree on every profile",()=>{
  expect(CONDITION_PROFILES.length>=2,"the contract requires at least two profiles");
  expect(new Set(CONDITION_PROFILES.map(p=>p.id)).size===CONDITION_PROFILES.length,"profile identifiers must be unique");
  for(const profile of CONDITION_PROFILES){
    for(const id of profile.obligationIds)
      expect(MEDICAL_OBLIGATION_IDS.includes(id),"profile "+profile.id+" declares an obligation the facade does not raise: "+id);
    if(profile.obligationBasis==="NEVER")
      expect(profile.obligationIds.length===0,"a NEVER profile must declare no obligation: "+profile.id);
    if(profile.obligationBasis==="ALWAYS")
      expect(profile.obligationIds.length===MEDICAL_OBLIGATION_IDS.length,"an ALWAYS profile must carry every obligation: "+profile.id);
  }
  expect(declaresMedicalObligations(["colorectal"],false),"colorectal must keep its obligations whatever else is declared");
  expect(declaresMedicalObligations(["breast"],false),"a clinical non-colorectal condition must keep its obligations");
  expect(!declaresMedicalObligations(["custom-unsourced-method"],true),"a service study must not inherit the obligations");
  expect(declaresMedicalObligations(["general"],true),"the overloaded literal with declared measurement is clinical");
  expect(!declaresMedicalObligations(["general"],false),"the overloaded literal without declared measurement is a service study");
  expect(declaresMedicalObligations(["not-a-declared-condition"],false),"an unrecognised condition must fail closed, keeping its obligations");
  expect(declaresMedicalObligations(["jackson-ms-late-stage-general","general"],true),"a case identity without a profile must fall through to the site profile");
});
