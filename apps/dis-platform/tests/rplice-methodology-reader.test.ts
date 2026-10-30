import test from "node:test";
import assert from "node:assert/strict";
import {readRpliceMethodology} from "../lib/rplice-methodology-reader";
import {planOwnedCapabilities,invokeOwnedCapabilities} from "../lib/owned-capability-fabric";

const validKey="rplice_"+"a".repeat(40);
const envelope={
 result:{count:53,frameworks:[{id:"cfir",name:"Consolidated Framework for Implementation Research",family:"implementation_science",citation:"Damschroder et al."},{id:"re-aim",name:"RE-AIM",family:"implementation_science",citation:"Glasgow et al.",protectedTenantRecord:"NEVER EXPORT"}]},
 provenance:{citations:["[catalog:is-catalog]"],generated_at:"2026-10-30T15:00:00Z",runtime:"remote",mode:"live",model:"deterministic",temperature:0},
 mode:"live"
};
test("RPLICE methodology missing or malformed partner key makes zero calls",async()=>{
 let calls=0;
 const mock=(async()=>{calls++;throw Error("should never call")}) as typeof fetch;
 for(const key of [undefined,"","sk_test_fixture","rplice_123","rplice_".concat("z".repeat(40))]){
  const r=await readRpliceMethodology(key,mock);
  assert.equal(r.ok,false);
  assert.equal(r.data,null);
 }
 assert.equal(calls,0);
});
test("RPLICE read only, fixed HTTPS endpoint, bearer and bounded projected evidence",async()=>{
 const seen:Array<{url:string;method:string;headers:Record<string,string>;body:unknown}>=[];
 const mock=(async(url:RequestInfo|URL,opts?:RequestInit)=>{
  seen.push({url:String(url),method:String(opts?.method),headers:opts?.headers as Record<string,string>,body:opts?.body});
  return new Response(JSON.stringify(envelope),{status:200});
 }) as typeof fetch;
 const x=await invokeOwnedCapabilities(["implementation-methodology"],{RPLICE_API_KEY:validKey},mock);
 assert.equal(seen.length,1);
 assert.equal(seen[0].url,"https://www.bettersciencelab.com/api/v1/public/frameworks");
 assert.equal(seen[0].method,"GET");
 assert.equal(seen[0].headers.Authorization,"Bearer "+validKey);
 assert.equal(seen[0].body,undefined,"no research query, identity or private case is sent");
 assert.equal(x[0].state,"RETURNED_UNVERIFIED");
 assert.equal(x[0].sourceTimestamp,"2026-10-30T15:00:00Z");
 const value=x[0].value as any;
 assert.equal(value.reportedFrameworkCount,53);
 assert.equal(value.frameworks[0].id,"cfir");
 assert.equal(value.frameworks[1].id,"re-aim");
 assert.ok(!JSON.stringify(value).includes("NEVER EXPORT"));
 assert.match(value.note,/NOT a research synthesis/);
});
test("RPLICE 200 errors, undocumented metadata, unauthorized access and oversized output fail closed",async()=>{
 const mocks=[
  (async()=>new Response(JSON.stringify({result:{error:"not provisioned"}}),{status:200})) as typeof fetch,
  (async()=>new Response(JSON.stringify({result:{frameworks:[],count:0},provenance:{}}),{status:200})) as typeof fetch,
  (async()=>new Response(JSON.stringify({...envelope,provenance:{}}),{status:200})) as typeof fetch,
  (async()=>new Response("Unauthorized",{status:401})) as typeof fetch,
  (async()=>new Response("a".repeat(128001),{status:200})) as typeof fetch,
  (async()=>{throw Error("network failure")}) as typeof fetch
 ];
 for(const mock of mocks){
  const r=await readRpliceMethodology(validKey,mock);
  assert.equal(r.ok,false);
  assert.equal(r.data,null);
 }
});
test("research convergence questions can select general methodology, not university data or client systems",()=>{
 const p=planOwnedCapabilities("University research collaboration on implementation science methods and frameworks");
 assert.ok(p.selected.some(x=>x.id==="implementation-methodology"));
 assert.ok(p.deferredDomains.includes("academic_research"));
 assert.ok(!p.selected.some(x=>x.id.startsWith("university")));
 assert.ok(!p.selected.some(x=>x.id==="health-implementation"||x.id==="funding-qualification"));
 const unrelated=planOwnedCapabilities("Flood disaster weather and infrastructure risks");
 assert.ok(!unrelated.selected.some(x=>x.id==="implementation-methodology"));
});
test("a strong question alone cannot call RPLICE without dedicated key",async()=>{
 let n=0;const mock=(async()=>{n++;throw Error("called")}) as typeof fetch;
 const result=await invokeOwnedCapabilities(["implementation-methodology"],{},mock);
 assert.equal(n,0);
 assert.equal(result[0].state,"CONTRACT_ONLY");
 assert.equal(result[0].evidenceClass,"NONE");
});
