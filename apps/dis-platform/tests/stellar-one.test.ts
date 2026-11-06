import test from "node:test";
import assert from "node:assert/strict";
import {assessStellarOne,type StellarOneInput} from "../lib/stellar-one";
const base:StellarOneInput={
 question:"How might a community program reduce late-stage disease?",
 whatDoing:"Investigate upstream and downstream care opportunities",
 forWhom:"People at risk in a declared city boundary",
 understandOrDeliver:"Independent evidence and a testable implementation plan",
 where:"Specific city boundary pending independent source",
 howLong:"Multi-year observation, pilot, sustainment and successor horizon",
 intendedChange:"Verified patient-relevant outcomes, without overdiagnosis",
 counterfactual:"Competent current screening and follow-up compared with feasible alternative",
 centerOfInquiry:"Diagnosis and journey",
 stakeholders:["Patients","Clinical owners","Registry and evaluator"],
 demographicDimensions:["Age","Appropriate disease site and stratification"],
 historicalContext:["Dated registry series","Prior community programs to audit"],
 perspectives:["Consent-based lived experience","Independent method challenge"],
 elements:[
  {id:"CLINIC",name:"Clinic pathway",level:"ORGANIZATION",role:"Screening and referral"},
  {id:"LAB",name:"Laboratory",level:"ORGANIZATION",role:"Test processing"},
  {id:"UTILITY",name:"Parallel community infrastructure",level:"LOCAL",role:"Potential resource overlap"}
 ],
 connections:[
  {from:"MISSION_CENTER",to:"CLINIC",relation:"INTERSECTS"},
  {from:"CLINIC",to:"LAB",relation:"DEPENDS_ON"},
  {from:"MISSION_CENTER",to:"UTILITY",relation:"PARALLEL_WITH"}
 ]
};
test("STELLAR 1 includes what-for-whom-where-when-change-counterfactual and center before later work",()=>{
 const r=assessStellarOne(base);
 assert.equal(r.stage,"STELLAR_1");
 assert.equal(r.orientation.counterfactual,base.counterfactual);
 assert.equal(r.orientation.howLong,base.howLong);
 assert.equal(r.orientation.center,base.centerOfInquiry);
 assert.equal(r.questions.filter(q=>q.priority==="ESSENTIAL").length,0);
 assert.equal(r.fullEnvironmentalUnderstandingClaimed,false);
 assert.equal(r.decisionAuthorized,false);
 assert.equal(r.environment.completeness,"NOT_ESTABLISHED");
 assert.equal(r.environment.verifiedConnections,0);
 assert.equal(r.perspectivesAreActualConsultations,false);
});
test("a blank STELLAR 1 must ask for evidence, not auto-complete a framework",()=>{
 const x=assessStellarOne({question:"What changes?"});
 assert.ok(x.questions.filter(q=>q.priority==="ESSENTIAL").length>=9);
 assert.equal(x.environment.nodes.length,1);
 assert.equal(x.environment.causalGraphValidated,false);
 assert.ok(x.questions.some(q=>q.code==="OPEN_WORLD_UNKNOWNS"));
});
test("distance is declared graph hops, not causal strength; parallel branch is distinct",()=>{
 const x=assessStellarOne(base);
 const rows=Object.fromEntries(x.environment.nodes.map(n=>[n.id,n]));
 assert.equal(rows.MISSION_CENTER.distanceFromCenter,0);
 assert.equal(rows.CLINIC.distanceFromCenter,1);
 assert.equal(rows.LAB.distanceFromCenter,2);
 assert.equal(rows.UTILITY.distanceFromCenter,null);
 assert.equal(rows.UTILITY.relationToCenter,"PARALLEL_DECLARED");
 assert.equal(rows.LAB.relationshipValidation,"NOT_INDEPENDENTLY_ESTABLISHED");
 assert.equal(x.declaredChainDistanceIsCausalEffect,false);
 assert.equal(x.environment.unverifiedConnections,3);
});
test("repeated system names, illegal IDs and dangling edges cannot invent network relations",()=>{
 const x=assessStellarOne({...base,elements:[...base.elements!,
  {id:"LAB",name:"Duplicate",level:"OTHER",role:"Invalid"},
  {id:"Bad id",name:"Invalid",level:"OTHER",role:"Invalid"}],
  connections:[...base.connections!,{from:"MISSING",to:"CLINIC",relation:"INTERSECTS"}]});
 assert.equal(x.environment.nodes.length,4);
 assert.equal(x.environment.declaredEdges.length,3);
 assert.equal(x.environment.verifiedConnections,0);
});
test("declaring stakeholder categories does not create consented human representation or measured disparities",()=>{
 const x=assessStellarOne({...base,perspectives:["A public advocate is likely to disagree"],demographicDimensions:["Race","Income"]});
 assert.equal(x.perspectivesAreActualConsultations,false);
 assert.equal(x.environment.demographicDimensionsToValidate.length,2);
 assert.equal(x.fullEnvironmentalUnderstandingClaimed,false);
 assert.equal(x.decisionAuthorized,false);
});
