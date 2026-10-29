import {NextResponse} from "next/server";
import {getVercelOidcToken} from "@vercel/oidc";
export const runtime="nodejs";
export const maxDuration=45;
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const token=await getVercelOidcToken().catch(()=>null);
 if(!token)return NextResponse.json({configured:false},{status:503});
 const names=["nvidia/nemotron-3.5-lightning-free","reflection/beam-free"];
 const outputs=[];
 for(const model of names){
  try{
   const res=await fetch("https://ai-gateway.vercel.sh/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({model,max_completion_tokens:70,messages:[{role:"user",content:"Respond with the word ready."}]}),signal:AbortSignal.timeout(9000)});
   const data=await res.json().catch(()=>({}));
   outputs.push({model,status:res.status,code:data?.error?.code||"none",message:typeof data?.error?.message==="string"?data.error.message.slice(0,200):null});
  }catch(e){outputs.push({model,status:0,code:"REQUEST_ERROR"})}
 }
 return NextResponse.json({outputs,previewOnly:true});
}
