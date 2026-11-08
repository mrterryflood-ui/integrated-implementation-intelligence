/** A hypothesis graph, not an inferred causal graph.
 * No graph edge is promoted from correlation to causation by this module.
 */
export type MechanismNode={id:string;kind:"PHENOMENON"|"MEASUREMENT"|"MECHANISM"|"CONTEXT"|"SELECTION"|"OUTCOME";label:string;definition:string};
export type MechanismEdge={from:string;to:string;relation:"MEASURES"|"ASSOCIATED_WITH"|"PROPOSED_CAUSAL"|"CONFOUNDS"|"SELECTS_INTO"|"MEDIATES"|"COMPETES_WITH";evidenceIds:string[];test:string;status:"UNTESTED"|"DESCRIPTIVE"|"INDEPENDENTLY_ADJUDICATED"};
export type MechanismGraph={studyId:string;nodes:MechanismNode[];edges:MechanismEdge[];sourceIds:string[]};
export type MechanismGraphAudit={valid:boolean;issues:string[];unresolvedTests:string[];causalIdentificationEstablished:false};
export function auditMechanismGraph(graph:MechanismGraph):MechanismGraphAudit{
 const issues:string[]=[],tests:string[]=[];
 if(!graph||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges)||!Array.isArray(graph.sourceIds))return {valid:false,issues:["Malformed graph"],unresolvedTests:[],causalIdentificationEstablished:false};
 const ids=new Set<string>();for(const n of graph.nodes){
  if(!n.id||ids.has(n.id)||!n.label?.trim()||!n.definition?.trim())issues.push("Node identity or definition missing or duplicated");
  ids.add(n.id);
 }
 const sources=new Set(graph.sourceIds);
 for(const e of graph.edges){
  if(!ids.has(e.from)||!ids.has(e.to)||e.from===e.to)issues.push("Edge has missing endpoint or self-loop");
  if(!["MEASURES","ASSOCIATED_WITH","PROPOSED_CAUSAL","CONFOUNDS","SELECTS_INTO","MEDIATES","COMPETES_WITH"].includes(e.relation))issues.push("Unsupported relationship");
  if(!Array.isArray(e.evidenceIds)||e.evidenceIds.some(id=>!sources.has(id)))issues.push("Edge evidence must exist in source ledger");
  if(e.relation==="PROPOSED_CAUSAL"&&(!e.test?.trim()||e.status==="DESCRIPTIVE"))issues.push("A causal proposal needs a discriminating test; descriptive association cannot establish causality");
  if(e.relation==="MEASURES"&&graph.nodes.find(n=>n.id===e.from)?.kind!=="MEASUREMENT")issues.push("Measurement relation must originate at an instrument/construct node");
  if(e.status!=="INDEPENDENTLY_ADJUDICATED"||e.relation==="PROPOSED_CAUSAL")tests.push((e.test||"Unspecified test")+" ["+e.from+" → "+e.to+"]");
 }
 if(graph.edges.length===0)issues.push("No relationships have been specified");
 return {valid:issues.length===0,issues:[...new Set(issues)],unresolvedTests:[...new Set(tests)],causalIdentificationEstablished:false};
}
/** An explicit, revisable competing explanation for the county contrast. */
export const CRC_MECHANISM_EXERCISE:MechanismGraph={
 studyId:"CRC_COUNTIES",sourceIds:["NCI-COUNTY-LATE-STAGE-2019-2023","NCI-CRC-SCREENING-FACT-SHEET"],
 nodes:[
  {id:"stage-share",kind:"MEASUREMENT",label:"Published late-stage case share",definition:"Provider-defined diagnosed-case percentage; do not assume staged-only exclusions or substitute an adjusted-rate ratio. Unknown-stage handling requires source-method review."},
  {id:"late-rate",kind:"MEASUREMENT",label:"Late-stage age-adjusted rate",definition:"Age-standardized population rate"},
  {id:"late-stage-burden",kind:"PHENOMENON",label:"Population late-stage burden",definition:"Incident late-stage colorectal disease per resident population"},
  {id:"screening",kind:"MECHANISM",label:"Screening pathway",definition:"Eligible population through completed screening"},
  {id:"polypectomy",kind:"MECHANISM",label:"Precursor lesion removal",definition:"Prevention pathway through appropriately indicated polyp removal and surveillance; historical exposure and latency matter"},
  {id:"all-stage-occurrence",kind:"PHENOMENON",label:"Incident colorectal diagnoses",definition:"New recorded colorectal cancers, distinct from biological onset and detection intensity"},
  {id:"diagnostic-resolution",kind:"MECHANISM",label:"Abnormal result resolution",definition:"Timely definitive evaluation after actionable abnormal result"},
  {id:"staging",kind:"SELECTION",label:"Stage ascertainment",definition:"Selection of incident cases with recorded stage"},
  {id:"care-capacity",kind:"CONTEXT",label:"Diagnostic service capacity",definition:"Available appointments, referral throughput and coverage"}
 ],
 edges:[
  {from:"stage-share",to:"staging",relation:"MEASURES",evidenceIds:["NCI-COUNTY-LATE-STAGE-2019-2023"],test:"Verify stage completeness and denominator definition",status:"UNTESTED"},
  {from:"late-rate",to:"late-stage-burden",relation:"MEASURES",evidenceIds:["NCI-COUNTY-LATE-STAGE-2019-2023"],test:"Reextract age-specific all-stage and late-stage rates",status:"UNTESTED"},
  {from:"screening",to:"polypectomy",relation:"PROPOSED_CAUSAL",evidenceIds:["NCI-CRC-SCREENING-FACT-SHEET"],test:"Compare indicated screening completion, polyp detection/removal and surveillance; challenge the county hypothesis if historical exposure and timing cannot precede the observed contrast",status:"UNTESTED"},
  {from:"polypectomy",to:"all-stage-occurrence",relation:"PROPOSED_CAUSAL",evidenceIds:["NCI-CRC-SCREENING-FACT-SHEET"],test:"Test lagged incidence under a credible comparison with underlying risk, ascertainment and case-mix controls; equal preventive exposure with persistent adjusted contrast would weaken this explanation",status:"UNTESTED"},
  {from:"care-capacity",to:"diagnostic-resolution",relation:"PROPOSED_CAUSAL",evidenceIds:[],test:"Compare authorized appointment capacity and resolution intervals under a credible design",status:"UNTESTED"},
  {from:"screening",to:"diagnostic-resolution",relation:"ASSOCIATED_WITH",evidenceIds:[],test:"Check screening and follow-up cohorts separately, with denominators",status:"UNTESTED"}
 ]};
