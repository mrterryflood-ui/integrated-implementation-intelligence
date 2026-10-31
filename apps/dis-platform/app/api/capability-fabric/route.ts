import {parseEngagement,ContractError} from '../../../lib/ecosystem/contracts';
import {publicPlan} from '../../../lib/ecosystem/planner';
import {executeEngagement} from '../../../lib/ecosystem/orchestrator';
import {buildEngagementPackage,evidenceBundle} from '../../../lib/ecosystem/deliverables';
import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {productionIdentityBlocked} from "../../../lib/release-gates";
import {planOwnedCapabilities,invokeOwnedCapabilities} from "../../../lib/owned-capability-fabric";
export const runtime="nodejs";
export const maxDuration=35;

/**
 * Server-only private orchestration of owned aggregate intelligence.
 * This is not a public catalog, advertisement, open MCP proxy or agent write
 * surface. Prompt is used for local deterministic routing only.
 */
export async function POST(request:Request){
 if(productionIdentityBlocked(process.env))return Response.json({error:"Private identity not released"},{status:503});
 let userId:string|null;
 try{({userId}=await auth())}catch{return Response.json({error:"Identity service unavailable"},{status:503})}
 if(!userId)return Response.json({error:"Authentication required"},{status:401});
 const origin=request.headers.get("origin");
 if(origin){try{if(new URL(origin).host!==new URL(request.url).host)return Response.json({error:"Origin mismatch"},{status:403})}catch{return Response.json({error:"Invalid origin"},{status:403})}}
 if(Number(request.headers.get("content-length")||0)>4000)return Response.json({error:"Request too large"},{status:413});
 let body:unknown;
 try{const raw=await request.text();if(raw.length>4000)return Response.json({error:"Request too large"},{status:413});body=JSON.parse(raw)}catch{return Response.json({error:"Invalid request JSON"},{status:400})}
 if(!body||typeof body!=="object"||Array.isArray(body))return Response.json({error:"Invalid request"},{status:400});
 const b=body as Record<string,unknown>;
 const ecosystem=b.mode==='ecosystem-plan'||b.mode==='ecosystem-invoke';
 let engagement;
 let plan:ReturnType<typeof planOwnedCapabilities>|null=null;
 if(ecosystem){
  if(Object.keys(b).some(k=>!['mode','engagement'].includes(k)))return Response.json({error:'Unsupported ecosystem field'},{status:400});
  try{engagement=parseEngagement(b.engagement)}catch(e){return Response.json({error:e instanceof ContractError?e.message:'Invalid engagement'},{status:400});}
  if(b.mode==='ecosystem-plan')return Response.json(publicPlan(engagement),{headers:{'Cache-Control':'private, no-store'}});
  if(!engagement.externalConsent)return Response.json({error:'Approve the described external public/aggregate queries before retrieval.'},{status:403});
 }else{
 if(typeof b.problem!=="string"||b.problem.trim().length<8||b.problem.length>1200)return Response.json({error:"A bounded question is required"},{status:400});
 if(b.mode!=="plan"&&b.mode!=="invoke")return Response.json({error:"Choose plan or invoke"},{status:400});
 if(Object.keys(b).some(k=>!["problem","mode","externalConsent"].includes(k)))return Response.json({error:"Unsupported request field"},{status:400});
 plan=planOwnedCapabilities(b.problem,{max:3});
 if(b.mode==="plan")return Response.json({mode:"PLAN_ONLY",plan,invocations:[],notice:"Routing is a proposed plan; no upstream data was accessed.",sourceState:"CONTRACT_VERIFIED_ONLY"},{headers:{"Cache-Control":"no-store"}});
 if(b.externalConsent!==true)return Response.json({error:"Consent required before querying partner aggregate intelligence"},{status:403});
 }
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Private usage quota is unavailable"},{status:503});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const rows=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_consult_usage(subject_id,calls) VALUES(${userId},1)
      ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_consult_usage.calls+1
      WHERE dis_consult_usage.calls<20 RETURNING calls`
  ]);
  if(!rows[1]?.length)return Response.json({error:"Daily protected-intelligence request limit reached"},{status:429});
 }catch{return Response.json({error:"Usage authorization unavailable"},{status:503})}
 if(ecosystem&&engagement){
  const result=await executeEngagement(engagement,{kind:'AUTHENTICATED_AGGREGATE',subjectId:userId});
  return Response.json({result,package:buildEngagementPackage(result),intelligence:evidenceBundle(result)},{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(!plan)return Response.json({error:'No validated routing plan'},{status:400});
 const ids=plan.selected.map(x=>x.id);
 const invocations=await invokeOwnedCapabilities(ids,process.env);
 return Response.json({
  mode:"AUTHORIZED_READ_ONLY",plan,invocations,
  outcome:"Evidence contributions are descriptive and partner-reported. DIS must assess source quality, missing data, context and alternatives before any conclusion.",
  transferred:"Only fixed read-only scope requests. No user question, tenant identity, health details, or cross-platform credentials transmitted.",
  successful:invocations.filter(r=>r.state==="RETURNED_UNVERIFIED").length,
  unavailable:invocations.filter(r=>r.state!=="RETURNED_UNVERIFIED").length
 },{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
