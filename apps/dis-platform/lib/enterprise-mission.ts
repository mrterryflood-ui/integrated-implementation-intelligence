/**
 * DIS enterprise mission architecture.
 *
 * Eight discipline end states are GOVERNING INTENT, not eight deployed apps.
 * The native DIS method is independent of every partner tool. A mission may
 * recruit only purpose-cleared relevant specialists; no private client asset,
 * university account or dataset becomes accessible merely by being listed.
 */
export const DISCIPLINES=[
 {id:"research-universities",label:"Research, universities and convergence",endState:"Transform consequential questions into rigorous, multidisciplinary and testable investigations.",cues:["university","research","study","scientific","scholarly","epidemiology","genetics","professor","faculty","cancer","hypothesis","academic","collaboration","laboratory"],objectives:["Define a falsifiable question with stakeholder context","Retrieve and critically appraise primary evidence with contradictory findings","Identify required disciplines, study design and expertise gaps without implying university agreements"],measure:"Protocol readiness, evidence traceability, reproducible analysis and confirmed partner participation",method:"Problem-driven convergence, evidence appraisal, preregistration where appropriate, research ethics review"},
 {id:"implementation-systems",label:"Implementation science and systems engineering",endState:"Convert defensible knowledge into adopted, feasible, measurable and sustainable practice.",cues:["implementation","adoption","fidelity","sustainability","scale","systems","strategy","reaim","cfir","adaptation","workflow","engineering"],objectives:["Identify contextual determinants and alternative explanations","Design a bounded implementation strategy with owners and resources","Measure fidelity, adoption, adaptation, reach and sustainability"],measure:"Observed implementation outcomes against an approved local baseline",method:"Contextual determinants, logic model, implementation strategies, outcome evaluation"},
 {id:"community-civic-policy",label:"Community, civic and public policy",endState:"Help institutions understand local conditions and improve accountable public value.",cues:["community","civic","policy","government","neighborhood","municipal","population","equity","housing","public","county"],objectives:["Frame people and place at appropriate geographic resolution","Examine policy mechanisms, lived experience and data contradictions","Evaluate impact, equity, distribution and unintended consequences"],measure:"Community-defined outcomes and policy implementation evidence",method:"Systems mapping, geography, policy evaluation, stakeholder engagement"},
 {id:"health-wellbeing",label:"Healthcare and human well-being",endState:"Improve population and service outcomes through safe, context-aware evidence-informed implementation.",cues:["health","healthcare","hospital","clinic","prevention","patient","cancer","care","clinical","epidemiology"],objectives:["Clarify care or prevention problem and population","Check intervention evidence, access barriers and clinical governance","Propose adoption and outcome measures without processing unauthorized records"],measure:"Ethically approved service and population measures with privacy protections",method:"Implementation research, service evaluation, human-subjects and clinical safety review"},
 {id:"veterans-workforce",label:"Veterans, workforce and human development",endState:"Improve equitable transitions, service coordination and durable opportunity.",cues:["veteran","military","transition","employment","workforce","education","training","caregiver","job"],objectives:["Map transition and service-navigation barriers","Compare feasible training, employment and support strategies","Measure continuity, uptake and sustained outcomes"],measure:"Verified transition, employment, access and support milestones",method:"Journey mapping, vocational evidence, human-centered service implementation"},
 {id:"business-organizations",label:"Business, economics and organizational development",endState:"Increase organizational capability and sustainable economic opportunity without unsubstantiated claims.",cues:["business","market","enterprise","funding","grant","contract","procurement","organization","revenue","operations","leadership"],objectives:["Diagnose operational and market constraints","Compare alternatives, cost, capability and resource requirements","Develop an accountable decision and implementation plan"],measure:"Observed service, capability, cost and sustainability improvements",method:"Business intelligence, process improvement, economic evaluation, organizational development"},
 {id:"environment-resilience",label:"Environment, resilience and operational intelligence",endState:"Improve contextual understanding of hazards and cascading risks while preserving decision authority.",cues:["weather","flood","wildfire","hazard","climate","resilience","disaster","environment","emergency"],objectives:["Identify verified hazard sources, locations and freshness","Model interdependencies and competing scenarios","Specify operational escalation thresholds and reversible actions"],measure:"Source-verified detection, decision and recovery performance",method:"Risk analysis, scenario planning, systems interdependency, operational assessment"},
 {id:"governance-assurance",label:"Governance, security and assurance",endState:"Sustain a trustworthy, authorized and adaptable multi-domain intelligence system.",cues:["security","privacy","audit","governance","agent","risk","compliance","permission","ethics","tenant"],objectives:["Preserve tenant and legal-entity separation","Require source receipts, approvals, privacy controls and independent challenge","Test failures, drift, recovery, learning and rollback"],measure:"Zero unauthorized disclosure, reproducible decision and release evidence",method:"Threat modeling, assurance cases, source governance, independent verification"}
] as const;
export type DisciplineId=(typeof DISCIPLINES)[number]["id"];
export const FIVE_OBJECTIVES=[
 {id:"O1",label:"Understand the real problem",proof:"A confirmed problem statement, stakeholders, context, baseline and unresolved uncertainty"},
 {id:"O2",label:"Select and evaluate the right intelligence",proof:"Source-to-claim trail, recency, permissions, relevant tool selection and meaningful exclusions"},
 {id:"O3",label:"Develop defensible options",proof:"Alternatives, contradictions, feasibility, comparative risks and challenged assumptions"},
 {id:"O4",label:"Implement responsibly and measure",proof:"Owners, resources, milestones, consent, measures, operating plan and human go/no-go"},
 {id:"O5",label:"Learn, adapt and sustain",proof:"Dated follow-up, outcome comparison, corrective action and reviewed knowledge revision"}
] as const;
export const PROGRAM_MILESTONES=[
 {id:"M0",phase:"Scope",ownerRole:"Mission owner and affected stakeholders",artifact:"Mission charter and domain selection",gate:"Problem, end state, users, authority and required disciplines confirmed; irrelevant tools excluded",status:"NOT_VERIFIED"},
 {id:"M1",phase:"Validate",ownerRole:"Research and independent evidence reviewer",artifact:"Research protocol, source register, methods and ethics appraisal",gate:"Baseline and research design defensible; critical claims individually sourced; privacy/IRB determination made",status:"NOT_VERIFIED"},
 {id:"M2",phase:"Integrate",ownerRole:"Integration engineer and data steward",artifact:"Scoped capability contracts and acceptance receipts",gate:"Only authorized, mission-fit APIs/MCP tools connected; negative, tenant isolation and failure tests passed",status:"NOT_VERIFIED"},
 {id:"M3",phase:"Demonstrate",ownerRole:"User researcher and operational mission owner",artifact:"End-to-end user workflow and comparison report",gate:"Real representative users complete a complete workflow unaided; result is reproducible, accessible and sourced",status:"NOT_VERIFIED"},
 {id:"M4",phase:"Measure",ownerRole:"Implementation and evaluation lead",artifact:"Baseline, fidelity, implementation and outcome measurement register",gate:"Actual outputs and outcomes adjudicated against baseline or suitable comparison; no causal overstatement",status:"NOT_VERIFIED"},
 {id:"M5",phase:"Expand",ownerRole:"Governance board and owning specialists",artifact:"Controlled scaling and sustainment decision",gate:"Effectiveness, equity, security, operating cost, adaptations and rollback reviewed; formal human release approval",status:"NOT_VERIFIED"}
] as const;
const clean=(s:string,n=1200)=>s.replace(/[\u0000-\u001F]/g," ").trim().slice(0,n);
const tokens=(s:string)=>new Set(s.toLowerCase().replace(/[^a-z0-9]+/g," ").split(" ").filter(Boolean));
export type EnterpriseMission={
 state:"DESIGN_PROPOSAL_NOT_EXECUTED";
 problem:string;
 primary:{id:DisciplineId;label:string;endState:string;method:string}|null;
 contributing:Array<{id:DisciplineId;label:string;role:string}>;
 objectives:typeof FIVE_OBJECTIVES;
 milestones:typeof PROGRAM_MILESTONES;
 researchQuestions:string[];
 universityResearch:{role:string;requiredProof:string;status:"NOT_ENGAGED"|"PUBLIC_DISCOVERY_ONLY"}[];
 measures:string[];
 limitations:string[];
};
/** Honest deterministic candidate selection; no live specialist calls, no invented partners. */
export function designEnterpriseMission(raw:string,focus?:DisciplineId):EnterpriseMission{
 const problem=clean(raw),terms=tokens(problem);
 const ranked=DISCIPLINES.map((d,i)=>({d,i,score:d.cues.filter(c=>terms.has(c)).length})).sort((a,b)=>b.score-a.score||a.i-b.i);
 const chosen=focus?DISCIPLINES.find(d=>d.id===focus)??null:ranked[0]?.score>0?ranked[0].d:null;
 const others=ranked.filter(x=>x.score>0&&x.d.id!==chosen?.id).slice(0,3);
 return {
  state:"DESIGN_PROPOSAL_NOT_EXECUTED",problem,
  primary:chosen?{id:chosen.id,label:chosen.label,endState:chosen.endState,method:chosen.method}:null,
  contributing:others.map(({d})=>({id:d.id,label:d.label,role:d.objectives[0]})),
  objectives:FIVE_OBJECTIVES,milestones:PROGRAM_MILESTONES,
  researchQuestions:[
   "What precisely must change, for whom, and how is the local baseline established?",
   "Which competing explanations would lead to different decisions?",
   "Which original sources, disciplines and stakeholder experiences are essential, and what is missing?",
   "What comparison, observation or experiment would distinguish improvement from ordinary variation?",
   "What implementation strategy can be adopted safely, measured and revised?"
  ],
  universityResearch:[
   {role:"Scholarly evidence and methods",requiredProof:"Source/DOI, study design, population, validity, date and conflicting evidence",status:"PUBLIC_DISCOVERY_ONLY"},
   {role:"University expertise or collaboration",requiredProof:"Identified researcher and research fit, expressed interest, agreed role, university authorization, IRB/DUA/IP as applicable",status:"NOT_ENGAGED"},
   {role:"RPLICE or related implementation methods",requiredProof:"Approved scope, verified server identity, current contract, reproducible analytic output",status:"NOT_ENGAGED"}
  ],
  measures:[
   "User comprehension and task completion: baseline and observed user test required",
   "Tool relevance: accepted versus rejected invocations, with rationale",
   "Evidence: material claims with exact source support and freshness",
   "Implementation: reach, adoption, fidelity, feasibility, cost and sustainability as appropriate",
   "Outcomes: valid baseline/comparison, uncertainty, unintended effects and follow-up",
   "Security: unauthorized scope/tenant disclosure threshold = 0"
  ],
  limitations:[
   "This is a proposed problem-specific mission design, not a literature review, partnership, approved research protocol, or executed intervention.",
   "No university, research participant, institution or partner is enrolled by this document.",
   "No tool is entitled to private client information because it appears in the company repository.",
   "No milestones are marked done without independent, source-linked acceptance receipts.",
   "Expansion follows observed value, technical/security readiness and human authority—not the total number of software platforms."
  ]
 };
}
export function renderEnterpriseMission(m:EnterpriseMission):string{
 const intro=["DIS / ENTERPRISE MISSION DESIGN — WORKING DRAFT","State: "+m.state,"Problem: "+(m.problem||"[DEFINE THE PROBLEM]"),
 "Primary discipline: "+(m.primary?.label??"UNRESOLVED — ask user to confirm"),"Proposed end state: "+(m.primary?.endState??"Confirm a locally valid end state"),
 "Method: "+(m.primary?.method??"Select appropriate methods after understanding the problem")];
 return [
  intro.join("\n"),"\nCONTRIBUTING DISCIPLINES\n"+(m.contributing.map(x=>x.label+" — "+x.role).join("\n")||"No contributing discipline yet evidenced"),
  "\nFIVE SHARED OBJECTIVES\n"+m.objectives.map(x=>x.id+" "+x.label+" | Proof: "+x.proof).join("\n"),
  "\nSCOPE → VALIDATE → INTEGRATE → DEMONSTRATE → MEASURE → EXPAND\n"+m.milestones.map(x=>x.id+" "+x.phase+" | Owner role: "+x.ownerRole+" | Artifact: "+x.artifact+" | Gate: "+x.gate+" | "+x.status).join("\n"),
  "\nRESEARCH AND CONVERGENCE QUESTIONS\n"+m.researchQuestions.map((x,i)=>(i+1)+". "+x).join("\n"),
  "\nUNIVERSITIES AND RESEARCH / IMPLEMENTATION CAPABILITIES\n"+m.universityResearch.map(x=>x.role+" | "+x.status+" | Required proof: "+x.requiredProof).join("\n"),
  "\nMEASURES TO ESTABLISH\n"+m.measures.map(x=>"- "+x).join("\n"),
  "\nLIMITS\n"+m.limitations.map(x=>"- "+x).join("\n"),
  "\nMethodological starting points (NOT mission-specific evidence): NSF convergence research: https://www.nsf.gov/funding/learn/research-types/learn-about-convergence-research ; NIH dissemination and implementation: https://research.nih.gov/research-at-nih/dissemination-implementation-research ; NCATS CTSA partnerships: https://ncats.nih.gov/research/research-activities/ctsa"
 ].join("\n");
}
