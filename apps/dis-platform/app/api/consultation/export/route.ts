import {preserveDraftExportArtifacts,readBoundedOfficeRequest} from '../../../../lib/consultation-export-artifacts';
import {normalizeExportIntelligence,normalizeExportSlides} from '../../../../lib/consultation-export-sources';
import {auth} from "@clerk/nextjs/server";
import {sanitizeIntake} from "../../../../lib/consultation";
import {buildPackage,attachUnverifiedOwnedIntelAnnex} from "../../../../lib/consultation-package";
import {exportPptx,exportDocx} from "../../../../lib/consultation-export";
import type {IntelligenceBundle} from "../../../../lib/consultation-research";
export const runtime="nodejs";
export const maxDuration=45;
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in to export Office documents"},{status:401});
 if(Number(req.headers.get("content-length")||0)>240000)return Response.json({error:"Export request too large"},{status:413});
 const origin=req.headers.get("origin");if(origin){try{if(new URL(origin).host!==new URL(req.url).host)return Response.json({error:"Origin mismatch"},{status:403})}catch{return Response.json({error:"Invalid origin"},{status:403})}}
 let input:any;try{input=await readBoundedOfficeRequest(req)}catch(e){return Response.json({error:e instanceof Error?e.message:"Invalid export request"},{status:e instanceof Error&&e.message.includes("too large")?413:400})}
 const format=input?.format==="pptx"?"pptx":input?.format==="docx"?"docx":null;
 if(!format)return Response.json({error:"Supported formats: pptx, docx"},{status:400});
 const intake=sanitizeIntake(input?.intake&&typeof input.intake==="object"?input.intake:{});
 if(intake.mission.length<8)return Response.json({error:"A problem statement is required"},{status:400});
 const mode=input.mode==="general"?"general":"startup";
 // Client-supplied source records cannot be promoted to official verification.
 let intelligence:IntelligenceBundle|null=null;
 try{intelligence=normalizeExportIntelligence(input.intelligence)}catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid export source register'},{status:400})}
 let pkg=buildPackage(intake,mode,intelligence);
 try{pkg=attachUnverifiedOwnedIntelAnnex(pkg,format==="docx"?input?.ownedIntelAnnex:null)}catch{return Response.json({error:"Invalid unverified annex"},{status:400})}
 if(format==="docx"){try{pkg=preserveDraftExportArtifacts(pkg,input.artifacts)}catch(e){return Response.json({error:e instanceof Error?e.message:"Invalid draft artifacts"},{status:400})}}
 const theme=(["midnight","forest","slate"].includes(input.theme)?input.theme:"midnight") as "midnight"|"forest"|"slate";
 try{const slides=normalizeExportSlides(input.slides,intelligence);if(slides)pkg.slides=slides}catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid slide sources'},{status:400})}
 try{
  const buffer=format==="pptx"?await exportPptx(pkg,theme):await exportDocx(pkg);
  const filename="DIS-"+(format==="pptx"?"pitch-deck.pptx":"consultation-report.docx");
  return new Response(new Uint8Array(buffer),{status:200,headers:{"content-type":format==="pptx"?"application/vnd.openxmlformats-officedocument.presentationml.presentation":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","content-disposition":'attachment; filename="'+filename+'"',"cache-control":"no-store","x-content-type-options":"nosniff"}});
 }catch{return Response.json({error:"Document generation failed"},{status:503})}
}
