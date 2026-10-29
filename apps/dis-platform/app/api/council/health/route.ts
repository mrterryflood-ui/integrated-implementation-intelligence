import {NextResponse} from "next/server";
import {infer} from "../../../../lib/council-engine";
export const runtime="nodejs";
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const response=await infer("Return one short confirmation sentence with no external citations.","Confirm the model inference service responds to this test request.");
 return NextResponse.json({ok:response.ok,error:response.error||null,method:"PREVIEW_ONLY_TEST",model:process.env.AI_GATEWAY_MODEL||null});
}
