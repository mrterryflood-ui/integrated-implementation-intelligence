import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchProgram} from "../lib/research-program";
import {jacksonCancerCase} from "../lib/jackson-cancer-case";
import {buildImplementationJourney} from "../lib/implementation-journey";
import {RPLICE_HIL_METHODS,buildChainMethodSelection} from "../lib/chain-method-selection";

const program=()=>buildResearchProgram(jacksonCancerCase("colorectal"));
const journey=()=>buildImplementationJourney(program(),"Houston, Texas");

test("HIL selection starts without an automatic method or a blanket HOLD",()=>{
 const selection=buildChainMethodSelection(journey(),[]);
 assert.equal(selection.state,"AWAITING_HUMAN_METHOD_SELECTION");
 assert.deepEqual(selection.selectedMethods,[]);
 assert.equal(selection.authority,"LOCAL_SELECTION_NOT_SIGNED_APPROVAL");
 assert.equal(selection.noExternalCall,true);
 assert.equal(selection.noPartnerResultClaimed,true);
 assert.ok(RPLICE_HIL_METHODS.some(x=>x.id==="salp"));
});

test("HIL selects RPLICE-owned SALP and Parallax in a multi-method chain",()=>{
 const selection=buildChainMethodSelection(journey(),["salp","parallax"]);
 assert.equal(selection.state,"HUMAN_DECLARED_ANALYTICAL_METHODS");
 assert.deepEqual(selection.selectedMethods.map(x=>x.mcpTool),["rplice_run_salp","rplice_compare_parallax"]);
 assert.ok(selection.selectedMethods.every(x=>x.provider==="RPLICE"&&x.execution==="NOT_ATTEMPTED"));
 assert.ok(selection.selectedMethods.every(x=>x.stageEvidence.length>0));
 assert.equal(selection.transport.automaticReplicationAuthorized,false);
 assert.ok(selection.transport.requiredLocalComparisons.length>=8);
 assert.match(selection.temporal.afterSuccess,/next-day/);
 assert.match(selection.temporal.forward,/decade/);
});

test("declared chain relations carry provenance without upgrading to causal findings",()=>{
 const flow=buildImplementationJourney(program(),"Houston, Texas",{
  elements:[
   {id:"referral",name:"Referral system",level:"ORGANIZATION",role:"Specialty capacity"},
   {id:"transport",name:"Transport access",level:"COMMUNITY",role:"Access constraints"},
   {id:"policy",name:"Policy environment",level:"STATE",role:"Reimbursement decisions"}
  ],
  connections:[
   {from:"MISSION_CENTER",to:"referral",relation:"DEPENDS_ON",evidenceRef:"test:declared-only"},
   {from:"referral",to:"transport",relation:"INTERSECTS"},
   {from:"MISSION_CENTER",to:"policy",relation:"PARALLEL_WITH"}
  ]
 });
 const s=buildChainMethodSelection(flow,["salp"]);
 assert.equal(s.chainWeb.nodes.length,4);
 assert.equal(s.chainWeb.edges.length,3);
 assert.deepEqual(s.chainWeb.edges.map(x=>x.relation),["DEPENDS_ON","INTERSECTS","PARALLEL_WITH"]);
 assert.equal(s.chainWeb.edges[0].evidenceRef,"test:declared-only");
 assert.equal(s.chainWeb.verifiedEdges,0);
 assert.equal(s.chainWeb.causalInterpretation,"NOT_VALIDATED");
 assert.ok(s.chainWeb.unresolvedNodes.includes("policy"));
 assert.equal(s.chainWeb.destinationSite,"Houston, Texas");
});

test("unknown or duplicated method choices are not accepted",()=>{
 assert.throws(()=>buildChainMethodSelection(journey(),["salp","salp"]),/Duplicate/);
 assert.throws(()=>buildChainMethodSelection(journey(),["nonexistent"]),/Unknown/);
 assert.throws(()=>buildChainMethodSelection(journey(),["salp","parallax","framework","fidelity","adaptation","another"]),/Invalid/);
});

test("research UI exposes actual HIL controls and exports selection without remote calls",()=>{
 const ui=readFileSync("app/research-program/page.tsx","utf8");
 assert.match(ui,/RPLICE_HIL_METHODS\.map/);
 assert.match(ui,/checked=\{hilMethods\.includes\(method\.id\)\}/);
 assert.match(ui,/methodSelection\.selectedMethods/);
 assert.match(ui,/JSON\.stringify\(\{program,journey,methodSelection/);
 assert.match(ui,/No private material is sent to RPLICE/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage/);
});
