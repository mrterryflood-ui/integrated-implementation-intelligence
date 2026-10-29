import {getVercelOidcToken} from "@vercel/oidc";
import {NextResponse} from "next/server";
export const runtime="nodejs";
export const maxDuration=35;
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||await getVercelOidcToken().catch(()=>null);
 if(!token)return NextResponse.json({status:"UNAVAILABLE",reason:"Missing Gateway credential"},{status:503});
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13500);
  let response;
  try{response=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",signal:controller.signal,headers:{"content-type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({model:process.env.AI_GATEWAY_MODEL||"nvidia/nemotron-3.5-lightning-free",max_completion_tokens:2400,reasoning:{effort:"none"},messages:[{role:"user",content:"Reply with one short sentence confirming that a test completed."}]})})}finally{clearTimeout(timer)}
  const j:any=await response.json().catch(()=>({}));
  const choice=j.choices?.[0]||{},message=choice.message||{},content=message.content;
  return NextResponse.json({status:response.status,model:j.model||null,finishReason:choice.finish_reason||null,messageFields:Object.keys(message),contentType:typeof content,contentLength:typeof content==="string"?content.length:0,contentSample:typeof content==="string"?content.slice(0,140):null,reasoningLength:typeof message.reasoning_content==="string"?message.reasoning_content.length:null,usage:j.usage||null,errorCode:j.error?.code||null,errorMessage:String(j.error?.message||"").slice(0,170),previewOnly:true},{headers:{"cache-control":"no-store"}});
 }catch{return NextResponse.json({status:"REQUEST_FAILED",previewOnly:true})}
}
