/**
 * DIS method selection over the existing STELLAR 1 chain-web.
 *
 * Selection is a local, human-declared methodological preference, NOT a
 * signed decision or permission to share records. RPLICE remains owner of all
 * specialist algorithms. No MCP tool is invoked by this module.
 */
import type {FullImplementationFlow,WorkflowPhase} from "./implementation-journey";

export const RPLICE_HIL_METHODS=[
 {id:"salp",label:"SALP — structural anchors and leverage",tool:"rplice_run_salp",
  phases:["SALP","EBI_FIT","PLAN","ADAPT"] as WorkflowPhase[],
  contextQuestion:"Which connected anchors, incentives, capacities and feedback loops could amplify, undermine or redistribute the intended change?"},
 {id:"parallax",label:"Parallax — stakeholder perspectives and power",tool:"rplice_compare_parallax",
  phases:["COMMUNITY","SALP","GOVERNANCE","COMMUNICATE"] as WorkflowPhase[],
  contextQuestion:"Whose account of the system is missing, who controls decisions and resources, and who carries downstream costs?"},
 {id:"framework",label:"Implementation framework analysis",tool:"rplice_analyze_framework",
  phases:["CAUSES","EBI_FIT","PILOT","EVALUATE"] as WorkflowPhase[],
  contextQuestion:"Which contextual determinants, existing service pathways and alternative mechanisms change implementation fit?"},
 {id:"fidelity",label:"Implementation fidelity assessment",tool:"rplice_score_fidelity",
  phases:["PILOT","MONITOR","EVALUATE","ADAPT"] as WorkflowPhase[],
  contextQuestion:"Which intended core functions and adaptations must be distinguished from delivery volume and measured beneficiary outcomes?"},
 {id:"adaptation",label:"Adaptation and cross-site transport appraisal",tool:null,
  phases:["EBI_FIT","ADAPT","SCALE","SUSTAIN"] as WorkflowPhase[],
  contextQuestion:"What should remain invariant, what can adapt, and what interconnected consequences change across sites and over time?"}
] as const;
export type RpliceHilMethodId=(typeof RPLICE_HIL_METHODS)[number]["id"];
export type ChainMethodSelection={
 schemaVersion:"dis-hil-chain-method-selection-v1";
 state:"AWAITING_HUMAN_METHOD_SELECTION"|"HUMAN_DECLARED_ANALYTICAL_METHODS";
 authority:"LOCAL_SELECTION_NOT_SIGNED_APPROVAL";
 selectedMethods:{
  id:RpliceHilMethodId;label:string;provider:"RPLICE";mcpTool:string|null;
  execution:"NOT_ATTEMPTED";purpose:string;
  stageEvidence:{phase:WorkflowPhase;artifact:string;ownerRole:string;acceptance:string}[];
  chainQuestion:string;
 }[];
 chainWeb:{
  origin:"STELLAR_1_DECLARED_GRAPH";
  center:string|null;sourceSite:string;destinationSite:string;
  nodes:{id:string;name:string;relation:string;distance:number|null}[];
  edges:{from:string;to:string;relation:string;evidenceRef?:string;explanation?:string}[];
  verifiedEdges:0;causalInterpretation:"NOT_VALIDATED";
  unresolvedNodes:string[];
  adjacentAndParallelSystemsRequireReview:boolean;
 };
 transport:{
  automaticReplicationAuthorized:false;
  requiredLocalComparisons:{dimension:string;state:string;proofNeeded:string}[];
 };
 temporal:{
  backward:"Examine at least the preceding decade, including inherited policies, program failures, structural changes and source timelines.";
  today:"Review current conditions, shared constraints, mechanisms, lived experience, uncertainty and evidence provenance.";
  afterSuccess:"Check the next-day handoff, capacity, maintenance, unintended burdens and successor authority.";
  forward:"Reassess effects, equity, resources, feedback and adaptability over the following decade.";
 };
 review:"Human selection permits a method to be considered. Execution is a separate authenticated MCP event, and consequential action needs its own approval.";
 noExternalCall:true;noPartnerResultClaimed:true;
};
export function buildChainMethodSelection(flow:FullImplementationFlow,rawSelection:readonly string[]):ChainMethodSelection{
 if(!Array.isArray(rawSelection)||rawSelection.length>RPLICE_HIL_METHODS.length)throw Error("Invalid method selection");
 const requested=[...new Set(rawSelection)];
 if(requested.length!==rawSelection.length)throw Error("Duplicate method selection");
 const selected=requested.map(id=>{
  const method=RPLICE_HIL_METHODS.find(m=>m.id===id);
  if(!method)throw Error("Unknown RPLICE methodology: "+id);
  return {
   id:method.id,label:method.label,provider:"RPLICE" as const,mcpTool:method.tool,
   execution:"NOT_ATTEMPTED" as const,purpose:method.contextQuestion,
   stageEvidence:method.phases.flatMap(phase=>flow.nodes
    .filter(node=>node.id===phase)
    .flatMap(node=>node.gates.map(g=>({phase,artifact:g.artifact,ownerRole:g.ownerRole,acceptance:g.acceptance})))),
   chainQuestion:method.contextQuestion
  };
 });
 const env=flow.stellarOne.environment;
 return {
  schemaVersion:"dis-hil-chain-method-selection-v1",
  state:selected.length?"HUMAN_DECLARED_ANALYTICAL_METHODS":"AWAITING_HUMAN_METHOD_SELECTION",
  authority:"LOCAL_SELECTION_NOT_SIGNED_APPROVAL",
  selectedMethods:selected,
  chainWeb:{
   origin:"STELLAR_1_DECLARED_GRAPH",
   center:flow.stellarOne.orientation.center,
   sourceSite:flow.crossSiteTransport.sourceSite,
   destinationSite:flow.crossSiteTransport.destinationSite,
   nodes:env.nodes.map(n=>({id:n.id,name:n.name,relation:n.relationToCenter,distance:n.distanceFromCenter})),
   edges:env.declaredEdges.map(e=>({from:e.from,to:e.to,relation:e.relation,evidenceRef:e.evidenceRef,explanation:e.explanation})),
   verifiedEdges:0,causalInterpretation:"NOT_VALIDATED",
   unresolvedNodes:env.nodes.filter(n=>n.relationToCenter==="UNMAPPED"||n.relationToCenter==="PARALLEL_DECLARED").map(n=>n.id),
   adjacentAndParallelSystemsRequireReview:true
  },
  transport:{
   automaticReplicationAuthorized:false,
   requiredLocalComparisons:flow.crossSiteTransport.tests.map(t=>({dimension:t.dimension,state:t.state,proofNeeded:t.requiredComparison}))
  },
  temporal:{
   backward:"Examine at least the preceding decade, including inherited policies, program failures, structural changes and source timelines.",
   today:"Review current conditions, shared constraints, mechanisms, lived experience, uncertainty and evidence provenance.",
   afterSuccess:"Check the next-day handoff, capacity, maintenance, unintended burdens and successor authority.",
   forward:"Reassess effects, equity, resources, feedback and adaptability over the following decade."
  },
  review:"Human selection permits a method to be considered. Execution is a separate authenticated MCP event, and consequential action needs its own approval.",
  noExternalCall:true,noPartnerResultClaimed:true
 };
}
