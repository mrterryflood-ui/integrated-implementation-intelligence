import {NextResponse} from "next/server";
import {MEMBERS,selectCouncil,councilBrief,DEFAULT_RED} from "../../../lib/council";
export async function GET(){return NextResponse.json({members:[...new Map(MEMBERS.map(m=>[m.id,m])).values()],defaultRed:DEFAULT_RED})}
export async function POST(req:Request){
 let body;try{body=await req.json()}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
 if(prompt.length<5||prompt.length>3000)return NextResponse.json({error:"Question must be 5–3000 characters"},{status:400});
 const primary=selectCouncil(prompt,Number(body.count||6),Array.isArray(body.selected)?body.selected:[]);
 const red=selectCouncil(prompt,Number(body.redCount||4),Array.isArray(body.redSelected)?body.redSelected:DEFAULT_RED,true);
 return NextResponse.json(councilBrief(prompt,primary,red));
}
