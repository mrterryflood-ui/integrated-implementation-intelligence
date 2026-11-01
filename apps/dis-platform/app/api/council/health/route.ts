import {councilEngagementAssurance} from '../../../../lib/council-engagement-assurance';
import {NextResponse} from "next/server";
import {convene} from "../../../../lib/council-engine";
export const runtime="nodejs";
export const maxDuration=90;
export async function GET(){
 if(process.env.VERCEL_ENV!=="preview")return NextResponse.json({error:"Not found"},{status:404});
 const report=await convene({prompt:"How can an organization improve the quality and trustworthiness of grant proposals?",count:4,redCount:3,selected:[],redSelected:[],depth:"Standard"});
 return NextResponse.json({operatingContract:report.operatingContract,engagementAssurance:councilEngagementAssurance(report,"How can an organization improve the quality and trustworthiness of grant proposals?"),release:report.release,state:report.state,sourceCount:report.sources?.length||0,callStatuses:report.callStatuses||[],cited:report.citations?.citedIds||[],unknownCitations:report.citations?.unknownIds||[],synthesisPresent:Boolean(report.deliberation?.synthesis),limitations:report.limitations||report.error,previewOnly:true});
}
