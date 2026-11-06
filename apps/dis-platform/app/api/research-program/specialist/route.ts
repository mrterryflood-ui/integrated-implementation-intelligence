import {auth} from "@clerk/nextjs/server";
import {productionIdentityBlocked} from "../../../../lib/release-gates";
import {evaluateHIL} from "../../../../lib/whole-system-exercise";
import {runSelectedRpliceMcp,RpliceBridgeError,type SpecialistChoice} from "../../../../lib/rplice-adapter";
export const runtime="nodejs";
export const maxDuration=30;
/** Stateless specialist analysis; no database mutation, inferred approval or PHI access. */
export async function POST(request:Request){
 if(productionIdentityBlocked(process.env))return Response.json({error:"Production identity not configured"},{status:503});
 const {userId}=await auth();
 if(!userId)return Response.json({error:"Sign in required"},{status:401});
 if(Number(request.headers.get("content-length")||0)>14000)return Response.json({error:"Request too large"},{status:413});
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({error:"JSON required"},{status:415});
 const origin=request.headers.get("origin");
 if(origin)try{
   if(new URL(origin).origin!==new URL(request.url).origin)return Response.json({error:"Origin mismatch"},{status:403});
 }catch{return Response.json({error:"Invalid request origin"},{status:403});}
 const b=await request.json().catch(()=>null);
 if(!b||typeof b!=="object")return Response.json({error:"Invalid input"},{status:400});
 const method=b.method as SpecialistChoice;
 if(!["SALP","CFIR","RE_AIM"].includes(method))return Response.json({error:"Choose an available RPLICE method"},{status:400});
 const choice=evaluateHIL({method,humanSelected:b.humanSelected===true,
  explicitDataTransferConsent:b.externalConsent===true,intendedPurpose:typeof b.purpose==="string"?b.purpose:"",
  decisionOwner:userId});
 if(!choice.eligibleForExternalCall)return Response.json({error:"Human method selection and specific data transfer consent required"},{status:403});
 if(!process.env.RPLICE_API_KEY)return Response.json({error:"Private RPLICE MCP credential unavailable"},{status:503});
 try{
  const out=await runSelectedRpliceMcp({method,scenario:b.scenario,purpose:b.purpose,anchors:b.anchors},process.env);
  return Response.json(out,{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){
  return Response.json({error:e instanceof RpliceBridgeError?e.message:"RPLICE specialist unavailable"},
   {status:e instanceof RpliceBridgeError?e.statusCode:503,headers:{"Cache-Control":"no-store"}});
 }
}
