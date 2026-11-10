import assert from "node:assert/strict";
import test from "node:test";
import {
  PARALLAX_EVIDENCE_STATE, RpliceBridgeError,
  compareRpliceParallax, readRpliceContract, validatePerspectives,
} from "../lib/rplice-adapter";

const perspectives = [
  { id: "patient", name: "Program recipient", visible: ["transport access"], unknownKnowns: ["appointments require cars"] },
  { id: "manager", name: "Program manager", visible: ["program budget"], pricesWhom: ["patient"] },
];
const key = "rplice_" + "a".repeat(64);
test("bridge rejects missing, malformed or duplicate perspectives", () => {
  assert.throws(() => validatePerspectives([]), /two to twelve/);
  assert.throws(() => validatePerspectives([perspectives[0], perspectives[0]]), /unique/);
  assert.throws(() => validatePerspectives([{id:"bad!",name:"X"}, perspectives[1]]), /valid identifier/);
});
test("bridge uses only server-provided HTTPS origins and rejects SSRF-like URLs", async () => {
  await assert.rejects(readRpliceContract({RPLICE_BASE_URL:"http://127.0.0.1:80/"}), /HTTPS origin/);
  await assert.rejects(readRpliceContract({RPLICE_BASE_URL:"https://www.bettersciencelab.com/evil"}), /HTTPS origin/);
});
test("bridge verifies only public contract shape; it does not claim private access", async () => {
  const fetcher = async (_input: RequestInfo | URL) =>
    new Response(JSON.stringify({contractVersion:"2026-10-18",surfaces:{publicMethodology:{}},mcp:{catalog:"https://example.org/tools"}}),{status:200});
  const status = await readRpliceContract({},fetcher as typeof fetch);
  assert.equal(status.state,"CONTRACT_DISCOVERED_NOT_USER_AUTHORIZED");
  assert.equal(status.supportsParallax,false);
});
test("bridge fails closed if key is missing or malformed", async () => {
  await assert.rejects(compareRpliceParallax({stakeholders:perspectives},{RPLICE_API_KEY:""}),/not configured/);
});
test("bridge sends only bounded user-declared data and validates source metadata", async () => {
  let seen:any;
  const mock = async (input:RequestInfo|URL,init?:RequestInit) => {
    seen={url:String(input),method:init?.method,body:JSON.parse(String(init?.body)),authorization:new Headers(init?.headers).get("authorization")};
    return new Response(JSON.stringify({result:{
      state:PARALLAX_EVIDENCE_STATE,displacement:[{aName:"Program recipient",bName:"Program manager",band:"orthogonal"}],asymmetry:[{band:"b-over-a"}]
    },provenance:{model:"deterministic",runtime:"remote"}}),{status:200});
  };
  const output = await compareRpliceParallax({scenario:"Pilot",stakeholders:perspectives},{RPLICE_API_KEY:key},mock as typeof fetch);
  assert.equal(seen.method,"POST");
  assert.equal(seen.url,"https://www.bettersciencelab.com/api/v1/public/parallax/compare");
  assert.equal(seen.authorization,"Bearer "+key);
  assert.equal(seen.body.stakeholders.length,2);
  assert.equal(output.factState,PARALLAX_EVIDENCE_STATE);
});
test("bridge refuses a remote response that silently claims validation or drops provenance", async () => {
  const bad = async () => new Response(JSON.stringify({result:{state:"SCIENTIFICALLY_VALIDATED",displacement:[],asymmetry:[]}}),{status:200});
  await assert.rejects(compareRpliceParallax({stakeholders:perspectives},{RPLICE_API_KEY:key},bad as typeof fetch),/verifiable output metadata/);
});


test("selected SALP uses authenticated MCP and checks a deterministic provenance envelope", async()=>{
 const {runSelectedRpliceMcp}=await import("../lib/rplice-adapter");
 let seen:any;
 const mock=async (url:RequestInfo|URL,init?:RequestInit)=>{
  seen={url:String(url),headers:new Headers(init?.headers),body:JSON.parse(String(init?.body))};
  return new Response(JSON.stringify({jsonrpc:"2.0",id:"dis-hil-selection",result:{
   content:[{type:"text",text:JSON.stringify({result:{
    anchors:[{name:"referral capacity",weight:4,sensitivity:3}],sensors:[],center_of_gravity:"referral capacity"
   },provenance:{model:"deterministic",generated_at:"2026-11-06T12:00:00Z"},
    executionReceipt:{executionId:"rplice_exec_123e4567-e89b-12d3-a456-426614174000",tool:"rplice_run_salp",runtime:"remote",generatedAt:"2026-11-10T15:40:00Z",persisted:false,independentVerification:false}})}]}}),{status:200});
 };
 const input={method:"SALP" as const,scenario:"Improve care access in site",purpose:"Identify proposed constraints",
   anchors:[{name:"referral capacity",weight:4,sensitivity:3}]};
 const out=await runSelectedRpliceMcp(input,{RPLICE_API_KEY:"rplice_"+"a".repeat(64)},mock as typeof fetch);
 assert.equal(seen.url,"https://www.bettersciencelab.com/api/v1/connect/mcp");
 assert.equal(seen.body.params.name,"rplice_run_salp");
 assert.equal(seen.body.params.arguments.anchors.length,1);
 assert.equal(out.state,"HIL_SELECTED_PRELIMINARY_ANALYSIS");
 assert.equal(out.executionReceipt.executionId,"rplice_exec_123e4567-e89b-12d3-a456-426614174000");
 assert.equal(out.executionReceipt.persisted,false);
 assert.match(out.assurance,/not a persisted scientific run/i);
});
test("selected methods fail closed on invalid anchors, absent credentials, or missing provenance",async()=>{
 const {runSelectedRpliceMcp}=await import("../lib/rplice-adapter");
 const input={method:"SALP" as const,scenario:"Improve care access in site",purpose:"Identify proposed constraints",
  anchors:[{name:"Referral",weight:4,sensitivity:3}]};
 await assert.rejects(runSelectedRpliceMcp(input,{RPLICE_API_KEY:""}),/credential/);
 await assert.rejects(runSelectedRpliceMcp({...input,anchors:[{name:"bad",weight:18,sensitivity:9}]},
  {RPLICE_API_KEY:"rplice_"+"a".repeat(64)}),/hypothetical anchors/);
 const mock=async()=>new Response(JSON.stringify({result:{
  content:[{type:"text",text:JSON.stringify({result:{anchors:[],sensors:[]}})}]}}),{status:200});
 await assert.rejects(runSelectedRpliceMcp(input,{RPLICE_API_KEY:"rplice_"+"a".repeat(64)},mock as typeof fetch),/provenance|execution identity/);
 const missingReceipt=async()=>new Response(JSON.stringify({result:{
  content:[{type:"text",text:JSON.stringify({result:{anchors:[{name:"Referral",weight:4,sensitivity:3}],sensors:[]},
   provenance:{model:"deterministic",generated_at:"2026-11-10T15:40:00Z"}})}]}}),{status:200});
 await assert.rejects(runSelectedRpliceMcp(input,{RPLICE_API_KEY:"rplice_"+"a".repeat(64)},missingReceipt as typeof fetch),/execution identity/);
});
