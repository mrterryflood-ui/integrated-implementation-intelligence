/**
 * DIS owned-ecosystem routing baseline: 1,000 synthetic trials, 10 gold-labeled
 * problem archetypes x 100 deterministic context variants.
 *
 * IMPORTANT: these are deterministic router / permission-boundary evaluations;
 * ZERO model syntheses, live partner round trips, research results, or scientific
 * outcome validations. Never add this count to authenticated synthesis totals.
 * No user-specific data, paid inference, remote calls or seeded DB writes.
 *
 * Run with npm test in apps/dis-platform. Logs include operational evidence.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {performance} from "node:perf_hooks";
import {CAPABILITIES,planOwnedCapabilities,invokeOwnedCapabilities} from "../lib/owned-capability-fabric";

const archetypes=[
 {id:"community-workforce",problem:"Assess community workforce employment outcome impact for a local program",expected:"community-impact",domain:"community"},
 {id:"implementation-methodology",problem:"Evaluate research implementation methodology CFIR science framework fidelity",expected:"implementation-methodology",domain:"implementation"},
 {id:"ms-organizations",problem:"Investigate multiple sclerosis neurology care research providers",expected:"health-ms-public-organizations",domain:"health"},
 {id:"social-health",problem:"Evaluate food housing transportation social health resources and assistance",expected:"social-benefits-programs",domain:"social_health"},
 {id:"community-intervention",problem:"Review community intervention implementation program strategy and evidence",expected:"intervention-evidence",domain:"implementation"},
 {id:"civic-protected",problem:"Evaluate civic policy city county governance decisions",expected:null,domain:"civic"},
 {id:"grantpath-protected",problem:"Compare funding grants procurement RFP contract options",expected:null,domain:"business"},
 {id:"veteran-protected",problem:"Plan veteran military transition caregiver employment services",expected:null,domain:"veterans"},
 {id:"behavioral-protected",problem:"Assess behavioral mental health crisis suicide prevention pathways",expected:null,domain:"health"},
 {id:"hazard-protected",problem:"Compare wildfire hazard disaster flood weather response",expected:null,domain:"hazards"}
] as const;
const contexts=["rural cohort","urban cohort","regional cohort","startup team","public agency","academic team","nonprofit team","local workshop","pilot team","cross-sector team"];
const periods=["one","two","three","four","five","six","seven","eight","nine","ten"];
test("DIS ecosystem baseline: 1,000 deterministic synthetic decisions, deny unapproved integrations, zero egress",async()=>{
 assert.equal(CAPABILITIES.length,21,"Review corpus and declared count together when registry changes");
 const start=performance.now(),counts:Record<string,number>={},failures:string[]=[];
 let trials=0,matched=0,blocked=0,network=0,denied=0;
 const fetcher=(async()=>{network++;throw new Error("No upstream calls permitted in synthetic benchmark")}) as typeof fetch;
 for(const archetype of archetypes){
  for(const context of contexts){
   for(const period of periods){
    const problem=archetype.problem+". Synthetic setting "+context+"; observation series "+period+".";
    const plan=planOwnedCapabilities(problem,{max:3});
    const ids=plan.selected.map(s=>s.id);
    trials++;
    counts[archetype.id]=(counts[archetype.id]||0)+1;
    if(archetype.expected){
     if(!ids.includes(archetype.expected))failures.push(archetype.id+": expected "+archetype.expected+" for "+problem);
     else matched++;
    }else{
     if(ids.length)failures.push(archetype.id+": disallowed selection "+ids.join(","));
     else blocked++;
     if(!plan.deferredDomains.includes(archetype.domain as any))failures.push(archetype.id+": missing disclosed capability gap");
    }
    if(ids.length>3)failures.push(archetype.id+": max-invocation budget exceeded");
    if(plan.selected.some(s=>s.execution!=="CANDIDATE"))failures.push(archetype.id+": unauthorized routed invocation");
    const receipt=await invokeOwnedCapabilities(ids,{},fetcher);
    if(receipt.some(r=>r.state==="RETURNED_UNVERIFIED"||r.value!==null))failures.push(archetype.id+": invented source result");
    const unsafe=CAPABILITIES.filter(c=>c.execution==="NOT_AUTHORIZED");
    const deniedReceipt=await invokeOwnedCapabilities(unsafe.slice((trials%7)*2,(trials%7)*2+4).map(c=>c.id),{},fetcher);
    if(deniedReceipt.some(r=>r.state!=="CONTRACT_ONLY"||r.value!==null))failures.push(archetype.id+": unauthorized adapter not denied");
    denied+=deniedReceipt.length;
   }
  }
 }
 const elapsedMs=Math.round(performance.now()-start);
 const summary={testKind:"SYNTHETIC_ROUTING_ONLY",trials,archetypes:archetypes.length,expectedEnabledMatched:matched,expectedUnapprovedBlocked:blocked,unauthorizedAttemptsDenied:denied,realModelSyntheses:0,livePartnerRoundTrips:0,externalNetworkCalls:network,elapsedMs,byArchetype:counts,failures:failures.slice(0,12)};
 console.log("DIS_SYNTHETIC_ROUTING_BENCHMARK="+JSON.stringify(summary));
 assert.equal(trials,1000);
 assert.equal(matched,500);
 assert.equal(blocked,500);
 assert.ok(denied>=1000);
 assert.equal(network,0,"No remote data should be used in a synthetic authorization test");
 assert.deepEqual(failures,[], "Routing must reproduce expert-authored expected capability/no-capability labels");
});
