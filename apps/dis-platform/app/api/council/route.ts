import {NextResponse} from "next/server";
import {auth} from "@clerk/nextjs/server";
import {MEMBERS,selectCouncil,councilBrief,DEFAULT_RED} from "../../../lib/council";
import {convene} from "../../../lib/council-engine";
export const runtime="nodejs";
export const maxDuration=90;
export async function GET(){return NextResponse.json({members:[...new Map(MEMBERS.map(m=>[m.id,m])).values()],defaultRed:DEFAULT_RED})}
export async function POST(req:Request){
 let body:any;try{body=await req.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
 if(prompt.length<5||prompt.length>3000)return NextResponse.json({error:"Question must be 5–3000 characters"},{status:400});
 const chosen=Array.isArray(body.selected)?body.selected.filter((x:unknown)=>typeof x==="string").slice(0,16):[];
 const redSelected=Array.isArray(body.redSelected)?body.redSelected.filter((x:unknown)=>typeof x==="string").slice(0,16):[];
 const count=Math.max(2,Math.min(16,Math.floor(Number(body.count)||6)));
 const redCount=Math.max(2,Math.min(16,Math.floor(Number(body.redCount)||4)));
 const depth=["Quick","Standard","Deep","Research"].includes(body.depth)?body.depth:"Standard";
 const {userId}=await auth();
 const primary=selectCouncil(prompt,count,chosen,false);
 const red=selectCouncil(prompt,redCount,redSelected.length?redSelected:DEFAULT_RED,true);
 if(!userId)return NextResponse.json({...councilBrief(prompt,primary,red),state:"SIGN_IN_REQUIRED",notice:"Sign in to run model-based deliberation. Public preview does not consume paid inference."});
 const report=await convene({prompt,count,redCount,selected:chosen,redSelected,depth});
 return NextResponse.json({...councilBrief(prompt,primary,red),...report,assurance:report.limitations||report.error||"Independent execution was not completed."});
}
