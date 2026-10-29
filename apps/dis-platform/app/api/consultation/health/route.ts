import {investigate} from "../../../../lib/consultation-research";
import {sanitizeIntake} from "../../../../lib/consultation";
export const runtime="nodejs";
export const maxDuration=45;
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return Response.json({error:"Not found"},{status:404});
 const result=await investigate(sanitizeIntake({mission:"improve rural health access and clinic scheduling",audience:"rural healthcare providers",geography:"United States"}));
 return Response.json({status:"PROVIDER_SMOKE_TEST",coverage:result.coverage,sourceKinds:[...new Set(result.records.map(x=>x.kind))],total:result.records.length,errors:result.errors,note:"A returned record demonstrates API access only, not grant suitability, causal evidence or competitive validation."},{headers:{"cache-control":"no-store"}});
}
