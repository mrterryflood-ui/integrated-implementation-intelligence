import {NextResponse} from "next/server";
import {sanitizeIntake} from "../../../../lib/consultation";
import {investigate} from "../../../../lib/consultation-research";
import {buildPackage} from "../../../../lib/consultation-package";
export const runtime="nodejs";
export const maxDuration=60;
export const SCENARIO=sanitizeIntake({
 mission:"Design a homeowner-first Central Texas mortgage solutions and property acquisition platform. Verify pre-foreclosure records, compare lawful options to keep the home, purchase homes when sellers freely choose to sell, settle liens through title, renovate and resell. Also acquire vacant land and evaluate parcel GIS, flood, zoning, access, utility, easements, mineral rights, pricing, telephony and call-data permissions. Build an intuitive, map-first, photorealistic GIS CRM for Bell, McLennan, Williamson, Travis, Bexar, Harris and nearby counties.",
 organization:"Central Texas Mortgage Solutions & Property Acquisition Platform",
 audience:"Homeowners, voluntary sellers, independent HUD/VA counselors, title and escrow professionals, investor acquisitions and land-development teams",
 stage:"Pre-MVP concept; fictional sample cases only; property data and outreach not connected",
 alternatives:"House-flipping CRMs, direct cash buyers, licensed agents, foreclosure consulting firms, county land GIS, title companies",
 traction:"No verified customer demand, acquisition performance, licensing or ROI",
 resources:"Legal counsel, capital, title partners, operations, vendor permissions and property feeds not yet validated",
 geography:"Killeen, Temple, Waco, Austin, San Antonio, Houston, Central Texas",
 desiredOutcome:"Maximize homeowners' informed choices and net equity while enabling profitable compliant acquisition; include land due diligence, GIS maps, audit and human approval"
});
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
 const text=pkg.documents.map(x=>x.body).join(" ").toLowerCase();
 const checks=Object.fromEntries(rubric.map(term=>[term,text.includes(term.toLowerCase())]));
 const kinds:Record<string,number>={};for(const r of result.records)kinds[r.kind]=(kinds[r.kind]||0)+1;
 return NextResponse.json({scenario:"TEXAS_REALTY_SAFETY_EVALUATION",elapsedMs:Date.now()-started,retrieval:{query:result.query,count:result.records.length,byKind:kinds,coverage:result.coverage,errors:result.errors,examples:result.records.slice(0,8).map(x=>({kind:x.kind,title:x.title,url:x.url,match:x.queryMatchStatus}))},package:{documents:pkg.documents.map(d=>d.title),slides:pkg.slides.length,acceptanceGaps:pkg.quality.knownGaps},rubric:{checks,covered:Object.values(checks).filter(Boolean).length,total:rubric.length},note:"Keyword-presence audit only, not validated semantic or legal completeness. This is a preview test of the actual consultation research and package pipeline; no real homeowner data or outbound action."},{headers:{"cache-control":"no-store"}});
}
