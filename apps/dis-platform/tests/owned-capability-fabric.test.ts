import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {CAPABILITIES,planOwnedCapabilities,invokeOwnedCapabilities} from "../lib/owned-capability-fabric";

test("only one canonical id per specialist capability, and no public roster promotion",()=>{
 assert.equal(new Set(CAPABILITIES.map(x=>x.id)).size,CAPABILITIES.length);
 assert.ok(CAPABILITIES.length>=10);
 assert.ok(CAPABILITIES.every(x=>x.execution==="NOT_AUTHORIZED"||x.method==="GET"));
 assert.ok(CAPABILITIES.every(x=>x.state!=="E2E_ACCEPTED"&&x.state!=="RUNTIME_AUTHORIZED"));
});
test("different missions route to relevant capabilities without universal fan-out",()=>{
 const impact=planOwnedCapabilities("Community workforce program impact report and implementation outcomes");
 assert.ok(impact.selected.some(x=>x.id==="community-impact"));
 assert.ok(impact.selected.some(x=>x.id==="intervention-evidence"));
 assert.ok(impact.selected.length<=4);
 const veteran=planOwnedCapabilities("Veteran military transition planning and employment support");
 assert.ok(veteran.selected.some(x=>x.id==="veteran-transition"));
 const hazard=planOwnedCapabilities("Wildfire hazard and weather situation risks");
 assert.ok(hazard.selected.some(x=>x.id==="hazard-signals"));
 assert.ok(!hazard.selected.some(x=>x.id==="community-impact"));
 const funding=planOwnedCapabilities("Grant funding and RFP business decision");
 assert.ok(funding.selected.some(x=>x.id==="funding-qualification"));
});
test("arbitrary or empty questions never fabricate evidence or live integrations",()=>{
 const plan=planOwnedCapabilities("unclassifiableword");
 assert.equal(plan.selected.length,0);
 assert.equal(planOwnedCapabilities("Impact report community", {max:1}).selected.length,1);
 assert.equal(planOwnedCapabilities("Impact report community", {allowedDomains:["hazards"]}).selected.length,0);
 assert.ok(plan.selected.every(x=>x.state!=="E2E_ACCEPTED"));
});
test("absent scoped keys fail closed without ANY upstream network request",async()=>{
 let n=0;
 const mock=(async()=>{n++;throw Error("must not be called")}) as typeof fetch;
 const result=await invokeOwnedCapabilities(["community-impact","community-system-context","intervention-evidence","local-civic-context"],{},mock);
 assert.equal(n,0);
 assert.equal(result.length,4);
 assert.ok(result.every(x=>x.state==="CONTRACT_ONLY"&&x.evidenceClass==="NONE"&&x.value===null));
});
test("read-only upstream call uses fixed origin, path and scope key, never user question",async()=>{
 const calls:Array<{url:string;headers:Record<string,string>;method:string}>=[];
 const mock=(async (url:RequestInfo|URL,opt?:RequestInit)=>{
  const headers=opt?.headers as Record<string,string>;
  calls.push({url:String(url),headers,method:String(opt?.method)});
  return new Response(JSON.stringify({count:1,totals:{participantsServed:32,enteredEmployment:9,credentialsAttained:3},medianEarnings:1500,exportedAt:"2026-10-30T00:00:00Z",outcomes:[{orgName:"PRIVATE CUSTOMER NAME"}]}),{status:200});
 }) as typeof fetch;
 const results=await invokeOwnedCapabilities(["community-impact"],{DIS_THRIVEUP_IMPACT_KEY:"test-scope-key-1234567890"},mock);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,"https://thrivingcommunitiesforall.com/api/partner/v1/impact?limit=15");
 assert.equal(calls[0].method,"GET");
 assert.equal(calls[0].headers["x-partner-key"],"test-scope-key-1234567890");
 assert.equal(results[0].state,"RETURNED_UNVERIFIED");
 assert.equal(results[0].evidenceClass,"PARTNER_REPORTED_UNVERIFIED");
 assert.equal((results[0].value as any).participantsServed,32);
 assert.ok(!JSON.stringify(results).includes("PRIVATE CUSTOMER NAME"),"raw client records must be dropped");
});
test("upstream failure, malformed data and large payloads never become valid findings",async()=>{
 const env={DIS_THRIVEUP_IMPACT_KEY:"test-scope-key-1234567890"};
 for(const mock of [
  (async()=>new Response("unauthorized",{status:401})) as typeof fetch,
  (async()=>new Response("invalid json",{status:200})) as typeof fetch,
  (async()=>new Response("a".repeat(128001),{status:200})) as typeof fetch,
  (async()=>{throw Error("timeout")}) as typeof fetch
 ]){
  const result=await invokeOwnedCapabilities(["community-impact"],env,mock);
  assert.equal(result[0].state,"UNAVAILABLE");
  assert.equal(result[0].value,null);
 }
});
test("duplicates, unknown capabilities and privileged writes never invoke a partner",async()=>{
 let n=0;const mock=(async()=>{n++;return new Response("{}")}) as typeof fetch;
 const response=await invokeOwnedCapabilities(["local-civic-context","funding-qualification","unknown-tool","local-civic-context"],{},mock);
 assert.equal(n,0);
 assert.equal(response.length,3);
 assert.equal(response[2].state,"UNAVAILABLE");
});
test("private server endpoint is behind identity, quota, origin and separate consent gates",()=>{
 const route=readFileSync(join(process.cwd(),"app/api/capability-fabric/route.ts"),"utf8");
 const proxy=readFileSync(join(process.cwd(),"proxy.ts"),"utf8");
 const studio=readFileSync(join(process.cwd(),"app/consultation-studio.tsx"),"utf8");
 assert.match(proxy,/\/api\/capability-fabric\(\.\*\)/);
 assert.match(route,/productionIdentityBlocked\(process\.env\)/);
 assert.match(route,/await auth\(\)/);
 assert.match(route,/Origin mismatch/);
 assert.match(route,/externalConsent!==true/);
 assert.match(route,/dis_consult_usage/);
 assert.match(studio,/Check permitted intelligence/);
 assert.match(studio,/disabled=\{working\|\|!privateReady\|\|!allowOwnedIntel/);
 assert.ok(!route.includes("NEXT_PUBLIC_DIS_THRIVEUP"));
});
