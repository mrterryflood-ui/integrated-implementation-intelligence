import test from "node:test";
import assert from "node:assert/strict";
import {dispatch} from "../app/api/mcp/dispatch";

const call=async(name:string,args:Record<string,unknown>)=>{
  const result=await dispatch({jsonrpc:"2.0",id:17,method:"tools/call",params:{name,arguments:args}});
  assert.equal((result as any)?.error,undefined);
  assert.equal((result as any)?.result?.isError,false);
  return JSON.parse((result as any).result.content[0].text);
};
test("DIS existing public MCP advertises only read-only STELLAR and implementation blueprints",async()=>{
  const r:any=await dispatch({jsonrpc:"2.0",id:1,method:"tools/list"});
  const names=r.result.tools.map((t:any)=>t.name);
  for(const name of ["dis_stellar_one","dis_research_implementation_blueprint"]){
    const tool=r.result.tools.find((t:any)=>t.name===name);
    assert.ok(tool,"missing "+name);
    assert.equal(tool.annotations.readOnlyHint,true);
    assert.equal(tool.annotations.destructiveHint,false);
    assert.equal(tool.annotations.openWorldHint,true);
  }
  assert.ok(names.includes("dis_select_council"));
  assert.ok(names.includes("dis_handoff_template"));
});
test("MCP STELLAR 1 preserves unknowns and requires full environmental fact-finding",async()=>{
  const x=await call("dis_stellar_one",{problem:"Reduce late-stage diagnoses in a community"});
  assert.equal(x.stage,"STELLAR_1");
  assert.equal(x.orientation.whatDoing,null);
  assert.ok(x.questions.some((q:any)=>q.code==="MISSING_HOWLONG"));
  assert.ok(x.questions.some((q:any)=>q.code==="MISSING_COUNTERFACTUAL"));
  assert.equal(x.environment.completeness,"NOT_ESTABLISHED");
  assert.equal(x.environment.causalGraphValidated,false);
  assert.equal(x.decisionAuthorized,false);
});
test("MCP planning returns 20 staged gates, 5 longitudinal paths, and unexecuted RPLICE proposal",async()=>{
  const global=globalThis.fetch;let calls=0;
  try{
    globalThis.fetch=(async()=>{calls++;throw Error("No upstream egress allowed");}) as typeof fetch;
    const r=await call("dis_research_implementation_blueprint",{
      problem:"How can we reduce late-stage colorectal cancer diagnoses in Jackson Mississippi?",
      example:"jackson-cancer",cancerSite:"colorectal",destination:"Houston, Texas"
    });
    assert.equal(r.schemaVersion,"dis-research-implementation-mcp-v1");
    assert.equal(r.study.population.proxyUnit,"Hinds County, MS");
    assert.equal(r.study.claimsOfCityData,false);
    assert.equal(r.journey.nodes.length,20);
    assert.equal(r.journey.nodes[0].id,"STELLAR_1");
    assert.equal(r.journey.longitudinal.cases.length,5);
    assert.equal(r.journey.longitudinal.actualResult,"NOT_OBSERVED");
    assert.equal(r.journey.crossSiteTransport.automaticReplicationAuthorized,false);
    assert.equal(r.rpliceMethodHandoff.status,"DRAFT_NOT_SENT");
    assert.equal(r.rpliceMethodHandoff.actualRpcMethod,"NOT_DISCOVERED_OR_AUTHORIZED");
    assert.equal(r.rpliceMethodHandoff.partnerExecutionVerified,false);
    assert.equal(r.journey.acceptance.stagesActuallyCompleted,0);
    assert.equal(r.externalCalls,0);
    assert.equal(r.individualRecordsAccessed,0);
    assert.equal(r.clinicalActions,0);
    assert.equal(calls,0);
  }finally{globalThis.fetch=global}
});
test("generic MCP question cannot inherit Jackson cancer denominators or interventions",async()=>{
  const r=await call("dis_research_implementation_blueprint",{
    problem:"How can a community transit agency improve rider access?",
    population:"Another City",destination:"Different County",example:"generic"
  });
  assert.equal(r.study.indicators.length,0);
  assert.equal(r.study.strategies.length,0);
  assert.equal(r.study.population.targetName,"Another City");
  assert.equal(r.journey.logicModel.smartObjectives[0].target,"NOT_PRESET");
  assert.ok(r.study.issues.some((x:any)=>x.code==="NO_MEASURED_BASELINE"));
  assert.equal(r.journey.longitudinal.scaleAuthorized,false);
  assert.equal(r.rpliceMethodHandoff.hasConsentToShareCase,false);
});
test("invalid MCP calls cannot invoke unknown services or accept new action parameters",async()=>{
  const x:any=await dispatch({jsonrpc:"2.0",id:9,method:"tools/call",params:{
    name:"dis_research_implementation_blueprint",
    arguments:{problem:"Try a new community problem",example:"generic",externalConsent:true}
  }});
  assert.equal(x.error.code,-32602);
});
