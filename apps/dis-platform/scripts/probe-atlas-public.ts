/**
 * Read-only, bounded, exact-origin production network witness.
 * Public interface metadata ONLY. Never sends a client identity or mission,
 * publishes a report, calls a private API or triggers an operational action.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {ECOSYSTEM_CAPABILITIES} from '../lib/ecosystem/catalog';
import {readAtlasPublicComposition} from '../lib/ecosystem/atlas-public-adapter';
import {NetworkBudget} from '../lib/ecosystem/transport';
const cap=ECOSYSTEM_CAPABILITIES.find(x=>x.id==='continuity-and-emergency-intelligence');
if(!cap)throw Error('MISSING_REVIEWED_ATLAS_CAPABILITY');
const stress=process.env.ATLAS_PUBLIC_STRESS==='1';
const count=stress?20:1;
const concurrency=stress?4:1;
const record:{contract:string;revision:string;scope:string;startedAt:string;finishedAt:string|null;
 expectedRequests:number;passed:number;failed:number;p95Ms:number|null;latenciesMs:number[];
 responseHashes:string[];failureCodes:string[];fieldAcceptance:false;recipientAcceptance:false;privateDataTransferred:false}={
 contract:'dis-atlas-public-witness.v1',revision:process.env.GITHUB_SHA||'unversioned',scope:'PUBLIC_INTERFACE_METADATA',
 startedAt:new Date().toISOString(),finishedAt:null,expectedRequests:count,passed:0,failed:0,p95Ms:null,
 latenciesMs:[],responseHashes:[],failureCodes:[],fieldAcceptance:false,recipientAcceptance:false,privateDataTransferred:false
};
const path='test-results/atlas-public-exchange/receipt.json';
function save(){mkdirSync('test-results/atlas-public-exchange',{recursive:true});writeFileSync(path,JSON.stringify(record,null,2)+'\n');}
async function one(){
 const start=performance.now();
 try{
  const r=await readAtlasPublicComposition(cap!,new NetworkBudget(1,7000,32000));
  if(r.state!=='RETURNED'||r.requestCount!==1||r.claimVerification!=='NOT_PERFORMED'||r.privateDataTransferred!==false||!r.responseSha256||r.items[0]?.data?.fieldAcceptanceProven!==false)throw Error('UNSAFE_PROOF_PROMOTION');
  record.passed++;record.responseHashes.push(r.responseSha256);record.latenciesMs.push(Math.round(performance.now()-start));
 }catch(e){
  record.failed++;record.failureCodes.push(e instanceof Error?e.name+':'+e.message.slice(0,120):'UNKNOWN_FAILURE');
 }
}
for(let i=0;i<count;i+=concurrency){
 await Promise.all(Array.from({length:Math.min(concurrency,count-i)},()=>one()));
 if(i+concurrency<count)await new Promise(resolve=>setTimeout(resolve,500));
}
const sorted=[...record.latenciesMs].sort((a,b)=>a-b);
record.p95Ms=sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null;
record.finishedAt=new Date().toISOString();save();
const output={...record,responseHashes:record.responseHashes.length?{count:record.responseHashes.length,unique:new Set(record.responseHashes).size}:[]};
console.log('DIS_ATLAS_PUBLIC_WITNESS='+JSON.stringify(output));
if(record.passed!==count||record.failed!==0||record.p95Ms===null||record.p95Ms>7000)process.exitCode=1;
