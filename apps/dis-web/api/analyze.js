import { council, retrieve } from "./ask.js";
const text=x=>typeof x==="string"?x.trim():"";
export function analyze({question,company,rfp,action,depth="Standard",mode="auto"},sources=[]){
 const q=text(question), org=text(company), solicitation=text(rfp), scenario=text(action);
 const kind=mode==="auto"?(solicitation?"proposal":scenario?"systems":"research"):mode;
 const d=council([q,solicitation,scenario].join(" "));
 const facts=[],unknown=[],checks=[];
 const companyLabel=org||"[ORGANIZATION TO VERIFY]";
 const evidence=sources.map((s,i)=>({id:"S"+(i+1),title:s.title,url:s.url,year:s.year,role:"DISCOVERY ONLY — claim support not verified"}));
 let draft="",effects=[];
 if(kind==="proposal"){
  const requirements=solicitation.split(/\n/).map(x=>x.trim()).filter(x=>x.length>12).filter(x=>/shall|must|required|evaluation|criterion|deadline|submit|deliver|eligib|objective|scope|technical|budget/i.test(x)).slice(0,24);
  if(!solicitation)unknown.push("RFP text or extract is required to establish the actual solicitation requirements.");
  if(!org)unknown.push("Company legal identity, qualifications and verified past performance are required.");
  if(solicitation)facts.push("RFP text supplied by user (not independently authenticated).");
  if(org)facts.push("Company identifier supplied by user (not independently verified).");
  draft=`DRAFT — NOT SUBMISSION READY\nApplicant: ${companyLabel}\nOpportunity: [OFFICIAL SOLICITATION ID, AGENCY, DEADLINE TO VERIFY]\n\n1. Executive response\n${companyLabel} proposes to address the stated need through a scoped, measurable approach. [INSERT VERIFIED CAPABILITY AND FUNDER-SPECIFIC VALUE; DO NOT INVENT.]\n\n2. Understanding of requirement\n[MAP EACH OFFICIAL RFP REQUIREMENT TO ITS EXACT SECTION AND EVIDENCE.]\n\n3. Technical and implementation approach\nDiscovery and stakeholder validation → requirements traceability → controlled pilot → performance evaluation → sustainment. [REPLACE WITH SOLICITATION-RESPONSIVE APPROACH.]\n\n4. Personnel and past performance\n[REQUIRES VERIFIED STAFF, RESUMES, AUTHORIZED PARTNERS, AND CONTRACT REFERENCES.]\n\n5. Work plan, milestones and budget\n[REQUIRES APPROVED SCHEDULE, COST BASIS, ALLOWABILITY, AND CAPACITY.]\n\n6. Risk, ethics, security and quality\n[DOCUMENT APPLICABLE SOLICITATION AND REGULATORY REQUIREMENTS.]\n\n7. Evaluation and sustainability\n[PRE-SPECIFY BASELINE, MEASURES, TEST CONDITIONS, OWNERS, ADOPTION AND SUPPORT COSTS.]\n\nRelease status: BLOCKED pending solicitation authenticity, compliance matrix, eligibility, verified company facts, reviewer rubric and authorized signoff.`;
  checks.push(...requirements.map((x,i)=>({item:"R"+(i+1),requirement:x,verified:false})));
  if(!requirements.length)unknown.push("No explicit requirements extracted; obtain official full RFP and addenda.");
 } else if(kind==="systems"){
  const a=scenario||q;
  const lenses=[["Direct operational effects","Processes, staffing, capability and immediate costs"],["People and equity","Who benefits, who bears burdens, who is excluded"],["Economic spillovers","Suppliers, labor, incentives, public and private costs"],["Policy and governance","Authority, compliance, accountability and trust"],["Technology and environment","Infrastructure, dependencies, security, energy and resilience"],["Long-term feedback","Adaptation, displacement, unintended consequences and lock-in"]];
  effects=lenses.map(([name,dimension],i)=>({id:"H"+(i+1),dimension:name,hypothesis:`If "${a.slice(0,120)}" is implemented, examine possible changes in ${dimension.toLowerCase()}.`,status:"UNTESTED HYPOTHESIS",evidenceRequired:"Baseline, affected-population data, causal pathway, comparator, time horizon and uncertainty bounds"}));
  unknown.push("Location, population, intervention design, baseline, causal model and time horizon must be established before quantitative impact estimates.");
 } else {
  facts.push("The question has been received for evidence discovery.");
  unknown.push("Full-text source verification, contradictory evidence and domain-specific testing are still required.");
 }
 return {kind,domain:d.domain,perspectives:d.perspectives,questions:d.questions,company:org||null,known:facts,unknown,requirements:checks,draft,effects,evidence,consensus:"NOT CONVENED — perspectives are analytical lenses, not independent model runs.",verification:"NO CLAIM-LEVEL VERIFICATION COMPLETED",decision:"RESEARCH / DRAFT ONLY; NO EXTERNAL ACTION AUTHORIZED",depth};
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"POST required"});
 const body=req.body||{};
 const q=text(body.question),org=text(body.company),rfp=text(body.rfp),action=text(body.action);
 if([q,org,rfp,action].some(x=>x.length>16000))return res.status(413).json({error:"Input too long"});
 if(!q&&!rfp&&!action)return res.status(400).json({error:"Provide a question, RFP text, or proposed action"});
 if(body.mode&&!["auto","proposal","systems","research"].includes(body.mode))return res.status(400).json({error:"Invalid mode"});
 let query=(q||rfp.slice(0,220)||action).slice(0,250);
 const research=await retrieve(query);
 return res.status(200).json({...analyze(body,research.sources),retrievalErrors:research.errors,sourceStatus:research.sources.length?"DISCOVERY_ONLY":"NO_SOURCES",notice:"No verified company due diligence, official RFP authentication, independent council run, or causal effect estimation has been performed."});
}
