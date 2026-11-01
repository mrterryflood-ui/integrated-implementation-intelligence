import {OPERATING_CONTRACT_RECEIPT} from '../../../lib/operating-contract';
import {withCouncilEvidenceSnapshot} from '../../../lib/council-evidence-snapshot';
import {runGroundedCouncil,validateCouncilEngagement} from '../../../lib/ecosystem/council-handoff';
import {readBoundedOfficeRequest} from '../../../lib/consultation-export-artifacts';
import {productionIdentityBlocked} from '../../../lib/release-gates';
import {sanitizeConversation} from '../../../lib/conversation-context';
import {assemble} from "../../../lib/council-assembly";
import {getVercelOidcToken} from "@vercel/oidc";
import {neon} from "@neondatabase/serverless";
import {NextResponse} from "next/server";
import {auth} from "@clerk/nextjs/server";
import {MEMBERS,selectCouncil,councilBrief,DEFAULT_RED} from "../../../lib/council";
import {convene} from "../../../lib/council-engine";
export const runtime="nodejs";
export const maxDuration=120;
export async function GET(){const oidc=await getVercelOidcToken().then(()=>true).catch(()=>false);return NextResponse.json({operatingContract:OPERATING_CONTRACT_RECEIPT,members:[...new Map(MEMBERS.map(m=>[m.id,m])).values()],defaultRed:DEFAULT_RED,runtime:{model:process.env.AI_GATEWAY_MODEL||null,gatewayConfigured:Boolean(process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||oidc)},notice:"Gateway connectivity requires live authenticated POST verification"})}
export async function POST(req:Request){
 if(productionIdentityBlocked(process.env))return NextResponse.json({error:"Private identity not released"},{status:503});
 const origin=req.headers.get("origin");if(origin){try{if(new URL(origin).origin!==new URL(req.url).origin)return NextResponse.json({error:"Origin mismatch"},{status:403})}catch{return NextResponse.json({error:"Invalid origin"},{status:403})}}
 let body:any;try{body=await readBoundedOfficeRequest(req,32000)}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
 if(prompt.length<5||prompt.length>3000)return NextResponse.json({error:"Question must be 5–3000 characters"},{status:400});
 let conversation;try{conversation=sanitizeConversation(body.conversation)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid conversation"},{status:400})}
 let engagement;
 if(body.providedEvidence!==undefined||body.evidence!==undefined)return NextResponse.json({error:'Browser-supplied source text is not accepted at the council boundary.'},{status:400});
 if(['sourceReceipts','engagementAssurance','operatingContract','completion','outcome','delivery','improvements'].some(key=>body[key]!==undefined))return NextResponse.json({error:'Browser-supplied acceptance assertions are not accepted at the council boundary.'},{status:400});
 if(body.ecosystemEngagement!==undefined&&body.ecosystemEngagement!==null){try{engagement=validateCouncilEngagement(body.ecosystemEngagement,prompt,body.allowEcosystemEvidenceTransfer)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid ecosystem context'},{status:400})}}
 const isCustom=body.selectionMode==="custom";
 const challengeEnabled=body.challengeEnabled!==false;
 const chosen=isCustom&&Array.isArray(body.selected)?body.selected.filter((x:unknown)=>typeof x==="string").slice(0,16):[];
 const redSelected=isCustom&&challengeEnabled&&Array.isArray(body.redSelected)?body.redSelected.filter((x:unknown)=>typeof x==="string").slice(0,16):[];
 const count=Math.max(2,Math.min(16,Math.floor(Number(body.count)||6)));
 const redCount=Math.max(2,Math.min(16,Math.floor(Number(body.redCount)||4)));
 const depth=["Quick","Standard","Deep","Research"].includes(body.depth)?body.depth:"Standard";
 const {userId}=await auth();
 const primaryMode=body.primaryMode==="solo"?"solo":isCustom?"manual":"auto";
 const redMode=body.redMode==="manual"?"manual":"auto";
 const roster=assemble({prompt,count,redCount,selected:chosen,redSelected,primaryMode,redMode});
 if(roster.errors.length)return NextResponse.json({error:roster.errors.join(" ")},{status:400});
 const {primary}=roster;
 const red=challengeEnabled?roster.red:[];
 const selection={primaryMode,redMode,reasons:roster.reasons,ancientPair:roster.ancientPair};
 const councilReport={...councilBrief(prompt,primary,red),selection};
 if(!userId)return NextResponse.json({...councilReport,state:"SIGN_IN_REQUIRED",notice:"Sign in to run model-based deliberation. Public preview does not consume paid inference."});
 if(body.allowExternalResearch!==true)return NextResponse.json({...councilReport,state:"CONSENT_REQUIRED",notice:"External scholarly search and AI provider transfer requires explicit consent."});
 if(!process.env.DIS_DATABASE_URL)return NextResponse.json({error:"Council quota service unavailable"},{status:503});
 try{
  const sql=neon(process.env.DIS_DATABASE_URL);
  const usage=await sql.transaction([
   sql`SELECT set_config('dis.subject_id',${userId},true)`,
   sql`INSERT INTO dis_council_usage(subject_id,usage_day,calls) VALUES(${userId},CURRENT_DATE,1)
      ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_council_usage.calls+1,last_called=now()
      WHERE dis_council_usage.calls<20 RETURNING calls`
  ]);
  if(!usage[1]?.length)return NextResponse.json({error:"Daily council beta limit reached (20 investigations)"},{status:429});
 }catch{return NextResponse.json({error:"Council quota authorization unavailable"},{status:503});}
 const councilInput={prompt,count,redCount,selected:chosen,redSelected,depth,challengeEnabled,primaryMembers:primary,redMembers:red,conversation};
 let report;try{report=engagement?await runGroundedCouncil(councilInput,engagement,{kind:'AUTHENTICATED_AGGREGATE',subjectId:userId}):withCouncilEvidenceSnapshot(await convene(councilInput),prompt)}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Council integration unavailable'},{status:503})}
 return NextResponse.json({...councilReport,...report,assurance:report.limitations||report.error||"Independent execution was not completed."},{headers:{"Cache-Control":"private, no-store"}});
}
