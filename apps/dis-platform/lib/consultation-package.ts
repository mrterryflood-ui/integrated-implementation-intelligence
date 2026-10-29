import {generateUnknowns} from "./unknowns-radar";
import {realtyDocuments} from "./realty-consultation";
import type {Intake,Deliverable} from "./consultation";
import {deliverables,packageMarkdown} from "./consultation";
import type {IntelligenceBundle,IntelligenceRecord} from "./consultation-research";
export type SlideSpec={id:string,title:string,kicker:string,bullets:string[],notes:string,sourceIds:string[]};
export type ConsultationPackage={mode:"startup"|"general",intake:Intake,documents:Deliverable[],slides:SlideSpec[],intelligence:IntelligenceBundle|null,quality:{grade:string,knownGaps:string[],releases:string[],sources:number,activeOpportunityCandidates:number,historicalAwards:number,marketLeads:number},createdAt:string};
const text=(v:string,max=240)=>v.trim().slice(0,max);
const fallback=(v:string,why:string)=>text(v)||"[VALIDATE "+why+"]";
const outline=(records:IntelligenceRecord[],kind:IntelligenceRecord["kind"],n=5)=>records.filter(x=>x.kind===kind).slice(0,n);
const refs=(records:IntelligenceRecord[])=>records.map(r=>r.id);
const sourceRow=(x:IntelligenceRecord)=>`[${x.id}] ${x.title} — ${x.source}; ${x.url}; ${x.retrievedAt}; ${x.sourceStatus}. ${x.summary}`;
export function buildPackage(intake:Intake,mode:"startup"|"general"="startup",intelligence:IntelligenceBundle|null=null,council?:{deliberation?:{synthesis?:string,challenge?:string}}):ConsultationPackage{
 const radar=generateUnknowns(intake,intelligence);
 const realty=radar.mode==="REAL_ESTATE";
 const records=intelligence?.records||[];
 const potentiallyRelevant=records.filter(x=>x.queryMatchStatus==="MULTI_TERM_CANDIDATE");
 const conditionalGrants=realty?potentiallyRelevant.filter(x=>/housing|homeowner|mortgage|property|foreclosure|land use|revitalization|neighborhood|community development/i.test(x.title)):potentiallyRelevant;
 const prospects=outline(conditionalGrants,"OPEN_GRANT",8),historical=outline(potentiallyRelevant,"PAST_AWARD",8),landscape=outline(records,"LANDSCAPE_LEAD",6);
 const scientific=records.filter(x=>x.kind==="SCHOLARLY"||x.kind==="TECHNICAL_REPORT").slice(0,7);
 const regulation=outline(records,"REGULATION",5);
 const documents=deliverables(intake,council,mode);
 const company=fallback(intake.organization,"identity"),mission=fallback(intake.mission,"the problem"),audience=fallback(intake.audience,"the audience/customer");
 const places=fallback(intake.geography,"geography/market"),outcome=fallback(intake.desiredOutcome,"the desired outcome");
 const sourceDisplay=(list:IntelligenceRecord[],none:string)=>list.length?list.map(sourceRow).join("\n\n"):"No "+none+" records retrieved or verified in this consultation. Do not represent an inferred match as an existing opportunity.";
 const competition=documents.find(x=>x.id==="competition");
 if(competition)competition.body+=`\n\nDISCOVERED MARKET / ALTERNATIVE LEADS — NOT VERIFIED DIRECT COMPETITORS\n${sourceDisplay(landscape,"landscape")}\n\nCompetitive evidence workflow: identify customers, category overlap, pricing from original supplier pages, distribution, switching cost, buyer interviews and cited proof. For each assumption, record an owner and falsification test.`;
 const funding=documents.find(x=>x.id==="funding");
 if(funding)funding.body+=`\n\nCURRENT/FORECAST GRANTS.GOV RECORDS — ELIGIBILITY NOT VERIFIED\n${sourceDisplay(prospects,"active federal opportunity")}\n\nHISTORICAL AWARDS — SIGNALS OF PAST FUNDING, NOT OFFERS\n${sourceDisplay(historical,"historical award")}\n\nDiscovery relevance: candidates with no visible keyword overlap are excluded from the proposed funding-fit shortlist, but remain in the source register for reviewer inspection.\n\nResearch rule: no funding match is claimed until verified against official solicitation, awardee requirements, current deadline, exclusions and fit to this company.`;
 const brief=documents.find(x=>x.id==="brief");
 if(brief)brief.body+=`\n\nEvidence leads (not claim-level verified):\n${sourceDisplay(scientific,"scholarly or technical")}\n\nApplicable regulatory/notice discovery leads:\n${sourceDisplay(regulation,"regulatory")}`;
 const sourceDoc:Deliverable={id:"sources",title:"Source register, provenance, and unresolved research",body:`Research retrieval: ${intelligence?.retrievedAt||"Not yet run"}\nResearch query: ${intelligence?.query||"Not yet run"}\n\n${records.length?records.map(sourceRow).join("\n\n"):"No independent retrieval was performed."}\n\nUpstream failures:\n${intelligence?.errors.join("\n")||"None reported; not a guarantee of completeness."}\n\n${intelligence?.researchStandard||"External source verification has not occurred."}`,validation:"DRAFT",note:"A source ID establishes provenance, not that a claim is supported by a full-text passage."};
 documents.push(sourceDoc);
 const riskDoc:Deliverable={id:"risk",title:"Decision and risk register",body:`Five key risks requiring verification:\n1. Problem-market fit — validate actual buyer demand and alternatives.\n2. Funding feasibility — official grants and historical awards do not establish eligibility, investor interest or award probability.\n3. Implementation feasibility — test user tasks, technical dependencies and security.\n4. Financial sustainability — baseline pricing, unit economics and adoption must be measured.\n5. Epistemic integrity — retain conflicts and avoid turning exploratory assumptions into facts.\n\nAction–reaction–counteraction: define who changes behavior following launch, how rivals or regulators might react, and what safe response would work.\n\nDecision state: INVESTIGATE ONLY; no commitments, outreach or production changes authorized.`,validation:"DRAFT",note:"Risks are candidate hypotheses until assessed in the domain context."};documents.push(riskDoc);
 const designDoc:Deliverable={id:"design",title:"User-centered design and product validation plan",body:`Primary users: ${audience}\nObjective: ${outcome}\nTask to observe: Ask a representative user to complete the core workflow unaided; measure success, time, clarity, accessibility, trust and errors.\nUX benchmark: Test existing alternatives and your MVP using the same task and comparable participants.\nBrand positioning: State the problem, distinctive value and credible proof in the user's own language; validate comprehension with non-experts.\nResearch method: conduct interviews; synthesize journey map; prioritize pain points; test prototypes; document before/after outcomes.\nExit criteria: user task acceptance thresholds, security review, measurable value, training/support plan and post-launch observation.\nCurrent state: NO USER TEST OBSERVATIONS VERIFIED.`,validation:"DRAFT",note:"This is a research and implementation plan, not proof of user adoption."};documents.push(designDoc);
 documents.push(...realtyDocuments(intake,radar));
 const sources=records.slice(0,9),evidence=refs(sources);
 const slides:SlideSpec[]=[
 {id:"01",kicker:"THE OPPORTUNITY",title:company,bullets:[mission,outcome],notes:"Introduce the venture/project accurately and state the customer problem, not an unproven market-size claim.",sourceIds:[]},
 {id:"02",kicker:"THE PROBLEM",title:"A problem worth understanding",bullets:[mission,"Current baseline: "+fallback(intake.traction,"measured evidence"),"Proof required: interviews and observed pain"],notes:"Use an identifiable user scenario based on consented research; avoid invented testimonials.",sourceIds:[]},
 {id:"03",kicker:"WHO IT MATTERS TO",title:"The audience and decision makers",bullets:[audience,"Primary geography: "+places,"Buying process and decision authority: [RESEARCH REQUIRED]"],notes:"Distinguish user, buyer, funder and beneficiary. Cite market evidence before publication.",sourceIds:[]},
 {id:"04",kicker:"WHY THIS MATTERS NOW",title:"Change, context, and timing",bullets:["Industry drivers: [VERIFY WITH AUTHORITATIVE DATA]","Current regulation or funding signals: "+(regulation[0]?.title||"no verified regulatory match"),"Timing hypothesis: [TEST]"],notes:"Do not infer causality from the presence of a rule or research paper.",sourceIds:refs(regulation.slice(0,1))},
 {id:"05",kicker:"YOUR SOLUTION",title:"The product or intervention",bullets:[fallback(intake.stage,"solution design"),"Core user task: [DEMONSTRATE]","Success metric: "+outcome],notes:"Insert real screenshots and prototype evidence after review.",sourceIds:[]},
 {id:"06",kicker:"COMPETITIVE CONTEXT",title:"Know the alternatives",bullets:[fallback(intake.alternatives,"known alternatives"),"Independent landscape leads: "+(landscape[0]?.title||"none verified"),"Compare price, workflow, audience, trust, measurable value"],notes:"The listed external leads are not verified direct competitors. Validate category and original pricing sources.",sourceIds:refs(landscape.slice(0,2))},
 {id:"07",kicker:"BLUE OCEAN",title:"Differentiate with evidence",bullets:["Eliminate unnecessary steps (hypothesis)","Reduce cost and cognitive burden (hypothesis)","Raise transparency, trust and task success (hypothesis)","Create verifiable new customer value (hypothesis)"],notes:"Use the ERRC framework and test all claims with prospective customers. A blue ocean has not been established.",sourceIds:[]},
 {id:"08",kicker:"EXPERIMENTAL VALIDATION",title:"Prove the value",bullets:["Current traction: "+fallback(intake.traction,"verified measurements"),"Customer interview and usability pilot: [PLAN]","Baseline vs. pilot performance: [MEASURE]"],notes:"Do not substitute code-test success for demonstrated business value.",sourceIds:[]},
 {id:"09",kicker:"GO TO MARKET",title:"From pilot to adoption",bullets:["First market segment: "+audience,"Acquisition and partners: [VALIDATE]","Pricing and unit economics: [TEST]"],notes:"Present assumptions as assumptions. No unsupported TAM or projected ROI.",sourceIds:[]},
 {id:"10",kicker:"FUNDING LANDSCAPE",title:"Know who funds adjacent work",bullets:[prospects[0]?"Grants.gov candidate: "+prospects[0].title:"No confirmed active grant candidate",historical[0]?"Historical award: "+historical[0].title:"No historical award signals retrieved","Eligibility and investor fit: [REQUIRES VERIFICATION]"],notes:"An award is not a new funding opportunity. Review official solicitations and investor theses before outreach.",sourceIds:refs([...prospects.slice(0,1),...historical.slice(0,1)])},
 {id:"11",kicker:"DELIVERY AND RISK",title:"90 days to measurable progress",bullets:["30 days: investigate demand and evidence","60 days: test and refine solution and story","90 days: pilot, measure, decide and document dissent"],notes:"Owners, funding, operating capacity and acceptance thresholds must be approved.",sourceIds:[]},
 {id:"12",kicker:"THE ASK",title:"A specific next step",bullets:["Resources: "+fallback(intake.resources,"budget/team/capacity"),"Desired outcome: "+outcome,"Ask and terms: [FOUNDER/USER AUTHORIZATION REQUIRED]"],notes:"Never represent investor interest, capital commitments or user approval without evidence.",sourceIds:[]}
 ];
 const knownGaps=[
 !intake.audience?"Customer/audience not established":null,
 !intake.traction?"No verified traction or baseline":null,
 !intake.alternatives?"Competitors/substitutes not independently confirmed":null,
 !prospects.length?"No active federal opportunity matched":null,
 !council?.deliberation?.synthesis?"No completed council deliberation attached":null,
 "Every cited market/funder claim requires exact source-passage validation",
 ...radar.questions.filter(x=>x.priority==="RELEASE_BLOCKER"&&x.status==="NOT_ASKED").slice(0,6).map(x=>"Unasked release gate: "+x.area),
 "Designed slides are editable; pitch outcome and investor conversion remain untested"
 ].filter((x):x is string=>Boolean(x));
 return {mode,intake,documents,slides,intelligence,quality:{grade:"DRAFT / GATES OPEN",knownGaps,releases:["Research and compliance review","Independent challenge/dissent review","Customer acceptance","Export packaging","User approval before external distribution"],sources:records.length,activeOpportunityCandidates:prospects.length,historicalAwards:historical.length,marketLeads:landscape.length},createdAt:new Date().toISOString()};
}
export function renderPackageMarkdown(p:ConsultationPackage){return packageMarkdown(p.intake,p.documents)+"\n\n## Presentation storyboard\n\n"+p.slides.map(s=>"### "+s.id+". "+s.title+"\n\n"+s.bullets.map(x=>"- "+x).join("\n")+"\n\nSpeaker notes: "+s.notes+"\nSources: "+s.sourceIds.join(", ")).join("\n\n")+"\n\n## Validation gates\n\n"+p.quality.knownGaps.map(x=>"- "+x).join("\n");}
