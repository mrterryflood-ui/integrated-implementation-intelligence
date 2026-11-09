import {generateUnknowns} from "../../../../lib/unknowns-radar";
import {NextResponse} from "next/server";
import {investigate} from "../../../../lib/consultation-research";
import {buildPackage} from "../../../../lib/consultation-package";
import {SCENARIO} from "./scenario";
export const runtime="nodejs";
export const maxDuration=60;
const rubric=[
 "foreclosure","homeowner","land","GIS","maps","regulatory","title","seller","mortgage","VA","TCPA","consent",
 "trustee","county","zoning","flood","soil","access","utilities","easement","mineral","environmental","tax","probate",
 "bankruptcy","military","loan payoff","costs","ARV","rehab","water","septic","privacy","recording","photo","parcel",
 "source license","call","retention","no purchase"
];
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const started=Date.now();
 const result=await investigate(SCENARIO);
 const pkg=buildPackage(SCENARIO,"startup",result);
 const radar=generateUnknowns(SCENARIO,result);
 const text=pkg.documents.map(x=>x.body).join(" ").toLowerCase();
 const checks=Object.fromEntries(rubric.map(term=>[term,text.includes(term.toLowerCase())]));
 const kinds:Record<string,number>={};for(const r of result.records)kinds[r.kind]=(kinds[r.kind]||0)+1;
 return NextResponse.json({scenario:"TEXAS_REALTY_SAFETY_EVALUATION",elapsedMs:Date.now()-started,retrieval:{query:result.query,count:result.records.length,byKind:kinds,coverage:result.coverage,errors:result.errors,examples:result.records.slice(0,8).map(x=>({kind:x.kind,title:x.title,url:x.url,match:x.queryMatchStatus}))},package:{documents:pkg.documents.map(d=>d.title),slides:pkg.slides.length,acceptanceGaps:pkg.quality.knownGaps},rubric:{checks,covered:Object.values(checks).filter(Boolean).length,total:rubric.length},radar:{mode:radar.mode,tracks:radar.assetTracks,askedButUnverified:radar.unanswered,notAsked:radar.notAsked,releaseBlockers:radar.questions.filter(x=>x.priority==="RELEASE_BLOCKER").map(x=>({id:x.id,area:x.area,status:x.status,question:x.question})),highPriority:radar.questions.filter(x=>x.priority==="HIGH").map(x=>({id:x.id,status:x.status,question:x.question})),noGo:radar.noGo},note:"Keyword-presence audit only, not validated semantic or legal completeness. This is a preview test of the actual consultation research and package pipeline; no real homeowner data or outbound action."},{headers:{"cache-control":"no-store"}});
}
