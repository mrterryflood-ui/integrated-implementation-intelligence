import test from "node:test";
import assert from "node:assert/strict";
import {assessDDD,evaluateHIL,exerciseResearchToAction} from "../lib/whole-system-exercise";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";
import {buildResearchProgram} from "../lib/research-program";
import {buildImplementationJourney} from "../lib/implementation-journey";
test("cross-sectional comparison cannot masquerade as a DDD estimate",()=>{
 const x=assessDDD([]);
 assert.equal(x.status,"INSUFFICIENT_PANEL");
 assert.equal(x.estimate,null);assert.equal(x.missing.length,8+2);
});
test("complete eight-cell panel yields arithmetic, not causal, triple difference",()=>{
 const rows=[] as Array<{treatment:boolean;post:boolean;focusGroup:boolean;value:number;n:number;unit:string;populationDefinition:string}>;
 for(const treatment of [false,true])for(const post of [false,true])for(const focusGroup of [false,true]){
   rows.push({treatment,post,focusGroup,n:100,unit:"percentage points",populationDefinition:"defined eligible population",
     value:10+(treatment?2:0)+(post?3:0)+(focusGroup?4:0)+(treatment&&post&&focusGroup?5:0)});
 }
 const out=assessDDD(rows);
 assert.equal(out.status,"DESCRIPTIVE_TRIPLE_DIFFERENCE");
 assert.equal(out.estimate,5);
 assert.match(out.interpretation,/Causal attribution requires/);
});
test("human selection and separate data transfer consent are both required",()=>{
 const scope={method:"SALP" as const,humanSelected:true,explicitDataTransferConsent:false,
   intendedPurpose:"Identify plausible leverage points",decisionOwner:"local mission lead"};
 assert.equal(evaluateHIL(scope).eligibleForExternalCall,false);
 assert.equal(evaluateHIL({...scope,explicitDataTransferConsent:true}).eligibleForExternalCall,true);
 assert.equal(evaluateHIL({...scope,humanSelected:false,explicitDataTransferConsent:true}).eligibleForExternalCall,false);
});
test("real Jackson case traverses all existing lifecycle stages with truthful stage states",()=>{
 const p=buildResearchProgram(jacksonCancerCase("colorectal"));
 const j=buildImplementationJourney(p,"Houston, Texas");
 const run=exerciseResearchToAction(p,j,{method:"SALP",humanSelected:true,explicitDataTransferConsent:false,intendedPurpose:"Find candidate implementation leverage",decisionOwner:"mission lead"});
 assert.equal(run.phaseReceipts.length,j.nodes.length);
 assert.equal(run.hil.state,"HUMAN_SELECTED_LOCAL_ONLY");
 assert.equal(run.ddd.status,"INSUFFICIENT_PANEL");
 assert.ok(run.phaseReceipts.every(x=>x.observedAcceptance===false));
 assert.ok(run.stakeholderPerspectives.every(x=>x.source==="PROPOSED_ROLE_NOT_ENGAGED"));
 assert.equal(run.finalState,"ANALYTICAL_END_TO_END_EXERCISE_COMPLETE_FIELD_OUTCOMES_UNKNOWN");
});
test("same engine works for an unrelated and unsourced mission",()=>{
 const p=buildResearchProgram({ ...jacksonCancerCase("colorectal"),
  id:"workforce-case",question:"Improve youth workforce access",indicators:[],drivers:[],strategies:[],dataSources:[]});
 const j=buildImplementationJourney(p,"Different service district");
 const r=exerciseResearchToAction(p,j,{method:"NONE",humanSelected:false,explicitDataTransferConsent:false,intendedPurpose:"",decisionOwner:""});
 assert.equal(r.domainAgnostic,true);assert.equal(r.sourceEvidence.length,0);
 assert.equal(r.hil.state,"NO_HUMAN_SELECTION");
});
