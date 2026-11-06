/**
 * DIS STELLAR 1: context-first, question-first inquiry.
 *
 * This is a portable, non-prescriptive orientation and declared-environment
 * graph, NOT an empirically validated causal model, independent environmental
 * scan, person-level demographic inference, or permission to operate.
 */
export type ChainRelation="UPSTREAM_OF"|"DOWNSTREAM_OF"|"DEPENDS_ON"|"INTERSECTS"|"PARALLEL_WITH";
export type EnvironmentElement={
  id:string;
  name:string;
  level:"PERSON"|"GROUP"|"ORGANIZATION"|"COMMUNITY"|"LOCAL"|"REGIONAL"|"STATE"|"NATIONAL"|"GLOBAL"|"OTHER";
  role:string;
  evidenceRef?:string;
};
export type ChainConnection={
  from:string;to:string;relation:ChainRelation;
  evidenceRef?:string;
  explanation?:string;
};
export type StellarOneInput={
  question:string;
  whatDoing?:string;
  forWhom?:string;
  understandOrDeliver?:string;
  where?:string;
  howLong?:string;
  intendedChange?:string;
  counterfactual?:string;
  centerOfInquiry?:string;
  stakeholders?:string[];
  demographicDimensions?:string[];
  historicalContext?:string[];
  perspectives?:string[];
  elements?:EnvironmentElement[];
  connections?:ChainConnection[];
};
export type StellarOneIssue={
  code:string;
  priority:"ESSENTIAL"|"DISCOVERY";
  question:string;
  proofNeeded:string;
};
export type ChainPosition={
  id:string;name:string;
  distanceFromCenter:number|null;
  relationToCenter:"CENTER"|"LINKED_DECLARED"|"PARALLEL_DECLARED"|"UNMAPPED";
  shortestDeclaredChain:string[];
  relationshipValidation:"NOT_INDEPENDENTLY_ESTABLISHED";
};
export type StellarOneAssessment={
  schemaVersion:"dis-stellar-one-v1";
  stage:"STELLAR_1";
  status:"FACT_FINDING_AND_CLARIFICATION";
  orientation:{
    whatDoing:string|null;
    forWhom:string|null;
    understandOrDeliver:string|null;
    where:string|null;
    howLong:string|null;
    intendedChange:string|null;
    counterfactual:string|null;
    center:string|null;
  };
  environment:{
    centralElementId:"MISSION_CENTER";
    nodes:ChainPosition[];
    declaredEdges:ChainConnection[];
    stakeholderProposals:string[];
    demographicDimensionsToValidate:string[];
    historicalContextLeads:string[];
    perspectiveLeads:string[];
    environmentDimensions:string[];
    unverifiedConnections:number;
    verifiedConnections:0;
    causalGraphValidated:false;
    completeness:"NOT_ESTABLISHED";
  };
  questions:StellarOneIssue[];
  nextRecommendedAction:string;
  decisionAuthorized:false;
  fullEnvironmentalUnderstandingClaimed:false;
  perspectivesAreActualConsultations:false;
  declaredChainDistanceIsCausalEffect:false;
};
const value=(s:string|undefined,max=800):string|null=>{
  const x=typeof s==="string"?s.trim().slice(0,max):"";
  return x||null;
};
const lines=(xs:string[]|undefined,max=14)=>(Array.isArray(xs)?xs:[])
  .filter((x):x is string=>typeof x==="string").map(x=>x.trim().slice(0,250))
  .filter(Boolean).slice(0,max);
const DIMENSIONS=[
  "People and differentiated experiences","Institutions, jurisdictions and decision authority",
  "Demography, population definition and eligibility","History, prior interventions and inherited conditions",
  "Geography, proximity, coverage and travel time","Culture, trust, values and stakeholder power",
  "Policy, regulation and incentives","Technology, instruments, measurement limits and data lineage",
  "Resources, workforce, budgets and dependencies","Upstream and downstream service chains",
  "Intersecting systems versus parallel pathways","Time horizon, lag, feedback and second-order effects",
  "Environmental and physical context","Risks, unintended consequences, exclusion and sustainment"
];
function graph(input:StellarOneInput,center:string|null){
  const raw=(input.elements||[]).slice(0,24);
  const nodes=new Map<string,EnvironmentElement>();
  nodes.set("MISSION_CENTER",{id:"MISSION_CENTER",name:center||"Unspecified target of inquiry",
    level:"OTHER",role:"Declared decision/phenomenon center; not a verified cause"});
  for(const n of raw){
    if(!n||typeof n.id!=="string"||!/^[-\w]{1,80}$/.test(n.id)||n.id==="MISSION_CENTER"||nodes.has(n.id))continue;
    nodes.set(n.id,{...n,name:String(n.name||"").slice(0,160),role:String(n.role||"").slice(0,250)});
  }
  const allowed=new Set<ChainRelation>(["UPSTREAM_OF","DOWNSTREAM_OF","DEPENDS_ON","INTERSECTS","PARALLEL_WITH"]);
  const edges=(input.connections||[]).slice(0,60).filter(e=>e&&nodes.has(e.from)&&nodes.has(e.to)
    &&e.from!==e.to&&allowed.has(e.relation));
  const adjacency=new Map<string,string[]>();
  for(const id of nodes.keys())adjacency.set(id,[]);
  const parallel=new Set<string>();
  for(const e of edges){
    if(e.relation==="PARALLEL_WITH"){
      if(e.from==="MISSION_CENTER")parallel.add(e.to);
      if(e.to==="MISSION_CENTER")parallel.add(e.from);
      continue;
    }
    adjacency.get(e.from)!.push(e.to);
    adjacency.get(e.to)!.push(e.from);
  }
  // Number of HOPS in a declared interdependency network. This is not
  // empirical causal distance, effect size, importance or actual connectivity.
  const predecessor=new Map<string,string|null>([["MISSION_CENTER",null]]);
  const queue=["MISSION_CENTER"];
  for(let i=0;i<queue.length;i++){
    for(const child of adjacency.get(queue[i])||[]){
      if(predecessor.has(child))continue;
      predecessor.set(child,queue[i]);queue.push(child);
    }
  }
  const positioned:ChainPosition[]=[...nodes.values()].map(n=>{
    const path:string[]=[];
    if(predecessor.has(n.id)){
      let cur:string|null=n.id;
      while(cur!==null){path.unshift(cur);cur=predecessor.get(cur)??null;}
    }
    return {
      id:n.id,name:n.name,
      distanceFromCenter:path.length?path.length-1:null,
      relationToCenter:n.id==="MISSION_CENTER"?"CENTER" as const:
        path.length?"LINKED_DECLARED" as const:parallel.has(n.id)?"PARALLEL_DECLARED" as const:"UNMAPPED" as const,
      shortestDeclaredChain:path,
      relationshipValidation:"NOT_INDEPENDENTLY_ESTABLISHED" as const
    };
  });
  return {nodes:positioned,edges,rawCount:raw.length,validEdgeCount:edges.length};
}
export function assessStellarOne(input:StellarOneInput):StellarOneAssessment{
  const orientation={
    whatDoing:value(input.whatDoing),
    forWhom:value(input.forWhom),
    understandOrDeliver:value(input.understandOrDeliver),
    where:value(input.where),
    howLong:value(input.howLong),
    intendedChange:value(input.intendedChange),
    counterfactual:value(input.counterfactual),
    center:value(input.centerOfInquiry)
  };
  const questions:StellarOneIssue[]=[];
  const ask=(code:string,priority:StellarOneIssue["priority"],question:string,proofNeeded:string)=>
    questions.push({code,priority,question,proofNeeded});
  const mandatory=[
    ["whatDoing","What exactly are we doing or investigating?","Observed problem, actual task and decision"],
    ["forWhom","For whom are we doing it, and who may be excluded?","Target population, eligibility and affected users"],
    ["understandOrDeliver","What must we understand or deliver?","Defined phenomenon and usable deliverable"],
    ["where","Where is the affected system, and what is its correct geographic boundary?","Location, context, denominator and jurisdiction"],
    ["howLong","Over what period, including lags and after success?","Evidence window, implementation period and reassessment horizon"],
    ["intendedChange","What specifically are we seeking to improve or change?","Direct beneficiary/system outcome and appropriate metric"],
    ["counterfactual","Compared with what competent existing practice or plausible alternative?","Current designed, actual and experienced process with suitable comparator"],
    ["center","What is the center of the system or causal inquiry?","Center of analysis and decision; not a convenient proxy"]
  ] as const;
  for(const [key,q,proof] of mandatory)if(!orientation[key])
    ask("MISSING_"+key.toUpperCase(),"ESSENTIAL",q,proof);
  const stakeholders=lines(input.stakeholders),demographics=lines(input.demographicDimensions);
  const histories=lines(input.historicalContext),perspectives=lines(input.perspectives);
  if(!stakeholders.length)ask("STAKEHOLDERS_UNKNOWN","DISCOVERY",
    "Who participates, decides, implements, funds and experiences the consequences?","Roles, consented participation, interest/power and decision rights; no invented endorsement.");
  if(!demographics.length)ask("DEMOGRAPHY_NOT_MAPPED","DISCOVERY",
    "Which relevant demographics, structural conditions and eligibility strata may change outcomes?","Source-specific denominator, subgroup coverage, privacy, suppressed cells and no assumed group cause.");
  if(!histories.length)ask("HISTORY_UNMAPPED","DISCOVERY",
    "What historically produced the present system and which prior attempts succeeded or failed?","Historical policy, events, source chronology, baseline and confounders.");
  if(!perspectives.length)ask("PERSPECTIVES_UNCOLLECTED","DISCOVERY",
    "Whose perspectives, lived experience, institutional interests or dissent are missing?","Actual participation and recorded consent; conceptual personas are not testimony.");
  const network=graph(input,orientation.center);
  if(network.nodes.length<2)ask("ENVIRONMENT_NOT_MAPPED","ESSENTIAL",
    "Which connected, adjacent and parallel systems operate around the center?","Source-owned system inventory, jurisdictions, interfaces, upstream/downstream and independent evidence.");
  if(!network.validEdgeCount)ask("RELATIONSHIPS_NOT_MAPPED","DISCOVERY",
    "How far from the center does each system sit, and which paths intersect or run in parallel?","Traceable evidence of direction, mechanisms, dependency, overlapping resources and unobserved links.");
  if(network.nodes.some(n=>n.relationToCenter==="UNMAPPED"||n.relationToCenter==="PARALLEL_DECLARED"))
    ask("UNRESOLVED_CHAIN_POSITION","DISCOVERY",
      "Which apparently parallel or distant actors actually intersect, and through what observable link?","Validate chain/interaction independently; a declared graph hop is not a causal effect.");
  ask("OPEN_WORLD_UNKNOWNS","DISCOVERY",
    "Which missing actors, data, systems, incentives and alternatives have we not yet considered?","Independent challenge and repeated environmental audit; completeness is never presumed.");
  return{
    schemaVersion:"dis-stellar-one-v1",
    stage:"STELLAR_1",status:"FACT_FINDING_AND_CLARIFICATION",
    orientation,
    environment:{
      centralElementId:"MISSION_CENTER",
      nodes:network.nodes,declaredEdges:network.edges,
      stakeholderProposals:stakeholders,demographicDimensionsToValidate:demographics,
      historicalContextLeads:histories,perspectiveLeads:perspectives,
      environmentDimensions:[...DIMENSIONS],
      unverifiedConnections:network.edges.length,verifiedConnections:0,
      causalGraphValidated:false,completeness:"NOT_ESTABLISHED"
    },
    questions,
    nextRecommendedAction:"Clarify missing purpose, people, place, time, intended change and competent-practice counterfactual; independently map the full environment, center/radial positions, intersecting/parallel chains, stakeholder perspectives, demographics and historical context before claiming a validated causal pathway.",
    decisionAuthorized:false,fullEnvironmentalUnderstandingClaimed:false,
    perspectivesAreActualConsultations:false,declaredChainDistanceIsCausalEffect:false
  };
}
