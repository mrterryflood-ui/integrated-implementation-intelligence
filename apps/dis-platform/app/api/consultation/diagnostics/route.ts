import {NextResponse} from "next/server";
import {sanitizeIntake} from "../../../../lib/consultation";
import {investigate} from "../../../../lib/consultation-research";
import {buildPackage} from "../../../../lib/consultation-package";
import {exportPptx,exportDocx} from "../../../../lib/consultation-export";
export const runtime="nodejs";
export const maxDuration=60;
export async function GET(req:Request){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const scenario=new URL(req.url).searchParams.get("scenario")||"health";
 const sample=scenario==="procurement"?{mission:"Develop secure software for tracking public procurement contract compliance",organization:"DIS Demonstration",audience:"Federal contracting officers and small suppliers",stage:"Early prototype",geography:"United States",alternatives:"manual spreadsheets",traction:"Not verified",desiredOutcome:"Reduce procurement reporting errors"}:scenario==="aerospace"?{mission:"Improve NASA satellite telemetry and aerospace mission planning using geospatial data",organization:"DIS Demonstration",audience:"Aerospace engineers and agencies",stage:"Research concept",geography:"United States",alternatives:"legacy mission planning systems",traction:"Not verified",desiredOutcome:"Reduce analysis time and missed anomalies"}:{mission:"Improve access to rural primary care appointments through patient-centered scheduling",organization:"DIS Demonstration",audience:"Rural patients and clinics",stage:"Early prototype",geography:"United States",alternatives:"telephone scheduling",traction:"Not independently verified",desiredOutcome:"Reduce missed appointments"};
 const intake=sanitizeIntake(sample);
 const started=Date.now();
 let research:any=null,errors:string[]=[];
 try{research=await investigate(intake)}catch(e){errors.push("Research orchestration exception")}
 const pkg=buildPackage(intake,"startup",research);
 const formats:any={};
 try{const b=await exportPptx(pkg);formats.pptx={success:b.length>10000&&b.subarray(0,2).toString("ascii")==="PK",bytes:b.length,slides:pkg.slides.length}}catch(e){formats.pptx={success:false,error:String(e instanceof Error?e.message:e).slice(0,220)}}
 try{const b=await exportDocx(pkg);formats.docx={success:b.length>7000&&b.subarray(0,2).toString("ascii")==="PK",bytes:b.length,sections:pkg.documents.length}}catch(e){formats.docx={success:false,error:String(e instanceof Error?e.message:e).slice(0,220)}}
 const grouped:Record<string,number>={};
 for(const row of research?.records||[])grouped[row.kind]=(grouped[row.kind]||0)+1;
 return NextResponse.json({previewOnly:true,scenario,elapsedMs:Date.now()-started,sourceCount:research?.records?.length||0,byKind:grouped,coverage:research?.coverage||{},sourceErrors:research?.errors||errors,sourceExamples:(research?.records||[]).slice(0,8).map((s:any)=>({title:s.title,kind:s.kind,source:s.source,url:s.url})),formats,exportStatus:"FILE_BYTES_GENERATED_IN_PREVIEW_NOT_USER_AUTHENTICATED_ACCEPTANCE"},{headers:{"cache-control":"no-store"}});
}
