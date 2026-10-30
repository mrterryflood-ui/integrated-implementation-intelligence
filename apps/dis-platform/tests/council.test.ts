import test from "node:test";
import assert from "node:assert/strict";
import {selectCouncil,MEMBERS} from "../lib/council";
import {reconstruct,citationAudit,convene,parseActionPlan,infer} from "../lib/council-engine";
test("council registry has unique IDs and requested limits",()=>{
 assert.equal(new Set(MEMBERS.map(m=>m.id)).size,MEMBERS.length);
 assert.equal(selectCouncil("health and clinical study",6).length,6);
 assert.equal(selectCouncil("some question",50).length,16);
 assert.equal(selectCouncil("some question",1).length,2);
});
test("explicit member remains present and duplicates are removed",()=>{
 const selected=selectCouncil("engineering problem",5,["marian-croak","marian-croak"]);
 assert.equal(selected[0].id,"marian-croak");
 assert.equal(new Set(selected.map(x=>x.id)).size,selected.length);
});
test("abstract reassembly is deterministic",()=>{
 assert.equal(reconstruct({Good:[0],evidence:[1],matters:[2]}),"Good evidence matters");
 assert.equal(reconstruct(null),null);
});
test("citation register rejects invented references",()=>{
 const audit=citationAudit("A claim [S1], and unsupported [S99]",[{id:"S1",title:"Test",doi:null,url:"https://example.org",year:2024,abstract:"A claim"}]);
 assert.deepEqual(audit.unknownIds,["S99"]);
 assert.equal(audit.claimSupport,"NOT INDEPENDENTLY VERIFIED");
});
test("actual deliberation invokes separate research, primary and challenge passes",async()=>{
 const calls:string[]=[];
 const research=async()=>({status:"ABSTRACT_AND_METADATA",sources:[{id:"S1",title:"Title",doi:null,url:"https://example.org",year:2024,abstract:"One useful abstract."}]});
 const infer=async(system:string,prompt:string)=>{calls.push(system);return {ok:true,text:"Preliminary assessment [S1]"}};
 const result=await convene({prompt:"How can a community improve?",count:4,redCount:3,selected:[],redSelected:[],depth:"Standard"},{research,infer});
 assert.equal(calls.length,5);
 assert.ok(calls.some(x=>x.includes("challenge")));
 assert.equal(result.state,"PRELIMINARY_DELIBERATION");
 assert.equal(result.citations?.claimSupport,"NOT INDEPENDENTLY VERIFIED");
});
test("failure prevents fabricated council consensus",async()=>{
 const result=await convene({prompt:"How can our organization improve?",count:4,redCount:3,selected:[],redSelected:[],depth:"Standard"},{research:async()=>({sources:[],status:"UNAVAILABLE"}),infer:async()=>({ok:false,text:"",error:"offline"})});
 assert.equal(result.state,"INCOMPLETE");
 assert.ok(result.error?.includes("incomplete"));
});

test("proposed action plans require structured tasks and measures",()=>{
 const plan=parseActionPlan(JSON.stringify({tasks:[{title:"Pilot the service",why:"Test an alternative",success:"Observed outcomes reported"},{title:"Validate costs",why:"Control spend",success:"Cost estimate verified"}],metrics:[{label:"Adoption",baseline:"Unknown",target:"To agree",unit:"%"}]}));
 assert.equal(plan?.status,"MODEL_PROPOSED_UNVERIFIED");
 assert.equal(plan?.tasks.length,2);
 assert.equal(parseActionPlan("not json"),null);
 assert.equal(parseActionPlan(JSON.stringify({tasks:[],metrics:[]})),null);
});

test("turning off challenge council does not invoke adversarial model",async()=>{
 const calls:string[]=[];
 const result=await convene({prompt:"How might we improve a grant platform?",count:4,redCount:3,selected:[],redSelected:[],depth:"Standard",challengeEnabled:false},{research:async()=>({sources:[],status:"NO_RESULTS"}),infer:async(system:string)=>{calls.push(system);return {ok:true,text:"Working hypothesis"};}});
 assert.equal(result.red?.length,0);
 assert.equal(calls.filter(x=>x.includes("Independent challenge strand")).length,0);
});

test("AI inference fallback uses an allowed model and records actual response provider",async()=>{
 const key=process.env.AI_GATEWAY_API_KEY,defaultModel=process.env.AI_GATEWAY_MODEL;
 process.env.AI_GATEWAY_API_KEY="test-only";process.env.AI_GATEWAY_MODEL="nvidia/nemotron-3.5-lightning-free";
 const attempts:string[]=[];
 try{
  const fetcher=async(_url:RequestInfo|URL,opts?:RequestInit)=>{
   const model=JSON.parse(String(opts?.body||"{}")).model;
   attempts.push(model);
   if(attempts.length===1)return new Response(JSON.stringify({error:{code:"no_providers_available"}}),{status:403});
   return new Response(JSON.stringify({model:"nvidia/nemotron-3.5-lightning-free",choices:[{finish_reason:"stop",message:{content:"A cautious preliminary answer."}}]}),{status:200});
  };
  const result=await infer("Test evidence","A short question", "google/gemini-3.5-flash-lite",fetcher as typeof fetch);
  assert.equal(result.ok,true);
  assert.equal(result.fallbackUsed,true);
  assert.deepEqual(attempts,["google/gemini-3.5-flash-lite","nvidia/nemotron-3.5-lightning-free"]);
  assert.equal(result.model,"nvidia/nemotron-3.5-lightning-free");
 }finally{if(key===undefined)delete process.env.AI_GATEWAY_API_KEY;else process.env.AI_GATEWAY_API_KEY=key;if(defaultModel===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=defaultModel}
});

test("free-model beta is explicitly non-independent and uses one real model call",async()=>{
 const prior=process.env.AI_GATEWAY_MODEL,force=process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 process.env.AI_GATEWAY_MODEL="nvidia/nemotron-3.5-lightning-free";delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;
 try{
  let calls=0;
  const result=await convene({prompt:"How should a clinic test its scheduling prototype?",count:5,redCount:3,selected:[],redSelected:[],depth:"Deep"},{
   research:async()=>({sources:[],status:"NO_RESULTS"}),
   infer:async()=>{calls++;return {ok:true,text:"Pilot: measure baseline, errors, user completion and uncertainty.",model:"nvidia/nemotron-3.5-lightning-free"}}
  });
  assert.equal(calls,1);
  assert.equal(result.state,"SINGLE_MODEL_BETA_UNVERIFIED");
  assert.equal(result.modelProvenance?.independentSystemsVerified,false);
  assert.match(result.limitations||"",/one real model inference/);
 }finally{if(prior===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=prior;if(force===undefined)delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;else process.env.AI_GATEWAY_FORCE_MULTIPROVIDER=force}
});
