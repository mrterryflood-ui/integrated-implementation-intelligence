import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
export const runtime="nodejs";
export const maxDuration=25;
const clean=(x:unknown,n=350)=>typeof x==="string"?x.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,n):"";
export async function detail(opportunityId:number,fetcher:typeof fetch=fetch){
 if(!Number.isInteger(opportunityId)||opportunityId<1||opportunityId>99999999999)throw Error("Invalid opportunity ID");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8500);
 try{
  const res=await fetcher("https://api.grants.gov/v1/api/fetchOpportunity",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({opportunityId}),signal:controller.signal,cache:"no-store"});
  if(!res.ok)throw Error("Grants.gov unavailable (HTTP "+res.status+")");
  const body=await res.json();
  if(body.errorcode!==0||!body.data)throw Error("Grants.gov did not return a valid opportunity record");
  const d=body.data,s=d.synopsis||{};
  return {id:opportunityId,title:clean(d.opportunityTitle||s.opportunityTitle,240),number:clean(d.opportunityNumber,100),agency:clean(s.agencyName||d.agencyDetails?.agencyName,140),description:clean(s.synopsisDesc,2200),posted:clean(s.postingDate,70),closingDescription:clean(s.responseDateDesc||d.originalDueDateDesc,300),awardCeiling:clean(String(s.awardCeiling??""),40),awardFloor:clean(String(s.awardFloor??""),40),costSharing:s.costSharing===true,eligibleTypes:Array.isArray(s.applicantTypes)?s.applicantTypes.slice(0,30).map((x:any)=>clean(x.description,120)):[],activityCategories:Array.isArray(s.fundingActivityCategories)?s.fundingActivityCategories.slice(0,20).map((x:any)=>clean(x.description,100)):[],url:"https://www.grants.gov/search-results-detail/"+opportunityId,source:"Official Grants.gov fetchOpportunity",recordStatus:"OFFICIAL_DETAILS_OBSERVED",eligibilityAssessment:"UNVERIFIED_FOR_THIS_APPLICANT",note:"Official details are retrieved; interpretation of eligibility, deadline, fit, award suitability, completeness of attached instructions, and submission requirements still requires separate review."};
 }finally{clearTimeout(timer)}
}
export async function POST(req:Request){
 const {userId}=await auth();if(!userId)return Response.json({error:"Sign in required"},{status:401});
 const body=await req.json().catch(()=>null),id=Number(body?.opportunityId);
 if(!Number.isInteger(id)||id<1||id>99999999999)return Response.json({error:"Invalid Grants.gov ID"},{status:400});
 if(!process.env.DIS_DATABASE_URL)return Response.json({error:"Research authorization unavailable"},{status:503});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL),rows=await sql.transaction([sql`SELECT set_config('dis.subject_id',${userId},true)`,sql`INSERT INTO dis_consult_usage(subject_id,calls) VALUES(${userId},1) ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_consult_usage.calls+1 WHERE dis_consult_usage.calls<20 RETURNING calls`]);
  if(!rows[1]?.length)return Response.json({error:"Daily research limit reached"},{status:429});
  return Response.json(await detail(id),{headers:{"cache-control":"no-store"}});
 }catch{return Response.json({error:"Official opportunity details currently unavailable"},{status:503})}
}
