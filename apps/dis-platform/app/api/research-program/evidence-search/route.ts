import {auth} from "@clerk/nextjs/server";
import {productionIdentityBlocked} from "../../../../lib/release-gates";
import {research} from "../../../../lib/council-runtime";
import {looksLikePrivateRecord} from "../../../../lib/answer-release-policy";

export const runtime="nodejs";
export const maxDuration=15;

/** Reuses existing six-year OpenAlex discovery; metadata is never claim-level evidence. */
export async function POST(request:Request){
  const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
  if(productionIdentityBlocked(process.env))
    return Response.json({error:"Production identity is not configured."},{status:503,headers});
  const {userId}=await auth();
  if(!userId)return Response.json({error:"Sign in required for live scholarly discovery."},{status:401,headers});
  if(Number(request.headers.get("content-length")||0)>2000)
    return Response.json({error:"Research query too large."},{status:413,headers});
  if(!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({error:"JSON content required."},{status:415,headers});
  const origin=request.headers.get("origin");
  if(origin){
    try{if(new URL(origin).origin!==new URL(request.url).origin)
      return Response.json({error:"Request origin mismatch."},{status:403,headers});}
    catch{return Response.json({error:"Invalid request origin."},{status:403,headers});}
  }
  const body=await request.json().catch(()=>null);
  const query=body&&typeof body==="object"&&typeof body.query==="string"?body.query.trim():"";
  if(query.length<8||query.length>200||looksLikePrivateRecord(query))
    return Response.json({error:"Use an 8–200 character public research question, with no private or patient information."},{status:400,headers});
  const found=await research(query);
  if(found.status==="UNAVAILABLE")
    return Response.json({status:"PROVIDER_UNAVAILABLE",leads:[],error:found.error||"Scholarly index unavailable"},{status:503,headers});
  const leads=found.sources.slice(0,6).filter(s=>/^https:\/\//.test(s.url)).map((s,i)=>({
    id:"OPENALEX-"+(i+1),kind:"SCHOLARLY" as const,title:s.title.slice(0,260),
    summary:(s.abstract||"Abstract unavailable; inspect original source.").slice(0,600),
    source:"OpenAlex six-year discovery index",url:s.url,
    retrievedAt:new Date().toISOString(),sourceStatus:"DISCOVERY_ONLY" as const
  }));
  return Response.json({status:found.status,leads,limitations:
    "Discovery metadata only; full-text, measurement definitions, independent verification, causal interpretation and applicability require review. No source is automatically added to verified evidence."},{headers});
}
