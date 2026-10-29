import {auth} from "@clerk/nextjs/server";
import {sanitizeIntake} from "../../../lib/consultation";
import {buildPackage,type SlideSpec} from "../../../lib/consultation-package";
import {exportPptx,exportDocx} from "../../../lib/consultation-export";
import type {IntelligenceBundle} from "../../../lib/consultation-research";
export const runtime="nodejs";
export const maxDuration=45;
function validSlide(x:any):x is SlideSpec{return x&&typeof x.id==="string"&&x.id.length<25&&typeof x.title==="string"&&x.title.length<=180&&typeof x.kicker==="string"&&x.kicker.length<=140&&Array.isArray(x.bullets)&&x.bullets.length<=6&&x.bullets.every((v:unknown)=>typeof v==="string"&&v.length<=500)&&typeof x.notes==="string"&&x.notes.length<=2000&&Array.isArray(x.sourceIds)&&x.sourceIds.every((v:unknown)=>typeof v==="string"&&v.length<50)}
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in to export Office documents"},{status:401});
 if(Number(req.headers.get("content-length")||0)>240000)return Response.json({error:"Export request too large"},{status:413});
 const origin=req.headers.get("origin");if(origin){try{if(new URL(origin).host!==new URL(req.url).host)return Response.json({error:"Origin mismatch"},{status:403})}catch{return Response.json({error:"Invalid origin"},{status:403})}}
 let input:any;try{input=await req.json()}catch{return Response.json({error:"Invalid JSON"},{status:400})}
 const format=input?.format==="pptx"?"pptx":input?.format==="docx"?"docx":null;
 if(!format)return Response.json({error:"Supported formats: pptx, docx"},{status:400});
 const intake=sanitizeIntake(input?.intake&&typeof input.intake==="object"?input.intake:{});
 if(intake.mission.length<8)return Response.json({error:"A problem statement is required"},{status:400});
 const mode=input.mode==="general"?"general":"startup";
 // Client-supplied source records cannot be promoted to official verification.
 let intelligence:IntelligenceBundle|null=null;
 const raw=input.intelligence;
 if(raw&&Array.isArray(raw.records)){
  const records=raw.records.slice(0,70).filter((r:any)=>r&&typeof r.title==="string"&&typeof r.url==="string"&&/^https:\/\//.test(r.url)&&r.url.length<=500).map((r:any,i:number)=>({
   id:"E"+(i+1),kind:["SCHOLARLY","OPEN_GRANT","PAST_AWARD","LANDSCAPE_LEAD","TECHNICAL_REPORT","REGULATION"].includes(r.kind)?r.kind:"LANDSCAPE_LEAD",
   title:r.title.slice(0,250),summary:String(r.summary||"").slice(0,500),source:String(r.source||"Unknown source").slice(0,90),
   url:r.url.slice(0,500),retrievedAt:String(r.retrievedAt||new Date().toISOString()).slice(0,40),sourceStatus:"DISCOVERY_ONLY" as const,eligibilityStatus:"UNVERIFIED" as const
  }));
  intelligence={query:String(raw.query||"").slice(0,160),retrievedAt:String(raw.retrievedAt||new Date().toISOString()).slice(0,40),records,coverage:{},errors:[],researchStandard:"Exported source metadata was supplied by the client and has not been independently verified by the export service."};
 }
 const pkg=buildPackage(intake,mode,intelligence);
 const theme=(["midnight","forest","slate"].includes(input.theme)?input.theme:"midnight") as "midnight"|"forest"|"slate";
 if(Array.isArray(input.slides)){
  if(input.slides.length!==12||!input.slides.every(validSlide))return Response.json({error:"Invalid slide design"},{status:400});
  // Only verified source IDs already in the normalized draft can be referenced.
  const allowed=new Set(intelligence?.records.map(x=>x.id)||[]);
  pkg.slides=input.slides.map((s:SlideSpec)=>({...s,sourceIds:s.sourceIds.filter(id=>allowed.has(id))}));
 }
 try{
  const buffer=format==="pptx"?await exportPptx(pkg,theme):await exportDocx(pkg);
  const filename="DIS-"+(format==="pptx"?"pitch-deck.pptx":"consultation-report.docx");
  return new Response(new Uint8Array(buffer),{status:200,headers:{"content-type":format==="pptx"?"application/vnd.openxmlformats-officedocument.presentationml.presentation":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","content-disposition":'attachment; filename="'+filename+'"',"cache-control":"no-store","x-content-type-options":"nosniff"}});
 }catch{return Response.json({error:"Document generation failed"},{status:503})}
}
