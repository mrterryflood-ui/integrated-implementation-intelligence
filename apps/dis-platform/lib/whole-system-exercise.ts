/**
 * DIS: domain-agnostic whole-system exercise. Consumes the existing 19-phase
 * research-to-implementation journey; it does not replace specialist methods.
 * Completion is a claim requiring real external evidence, not a stage index.
 */
import type {ResearchProgram} from "./research-program";
import type {FullImplementationFlow} from "./implementation-journey";

export type DddCell = {
  treatment:boolean; post:boolean; focusGroup:boolean;
  value:number; n:number; unit:string; populationDefinition:string;
};
export type DddResult = {
  status:"INSUFFICIENT_PANEL"|"DESCRIPTIVE_TRIPLE_DIFFERENCE";
  estimate:number|null; unit:string|null; missing:string[]; interpretation:string;
};
export function assessDDD(rows:readonly DddCell[]=[]):DddResult {
  const missing:string[]=[];const keys=new Map<string,DddCell>();
  for(const r of rows){
    const k=[Number(r.treatment),Number(r.post),Number(r.focusGroup)].join("");
    if(keys.has(k))missing.push("Duplicate DDD cell: "+k);
    keys.set(k,r);
    if(!Number.isFinite(r.value)||!Number.isInteger(r.n)||r.n<=0)
      missing.push("Each DDD cell must have an observed finite value and positive sample count.");
  }
  for(let t=0;t<2;t++)for(let p=0;p<2;p++)for(let g=0;g<2;g++)
    if(!keys.has(""+t+p+g))missing.push("Missing treatment="+t+", post="+p+", focus="+g);
  const units=new Set(rows.map(x=>x.unit)),populations=new Set(rows.map(x=>x.populationDefinition));
  if(units.size!==1||![...units][0]?.trim())missing.push("Common measurement unit not established.");
  if(populations.size!==1||![...populations][0]?.trim())missing.push("Comparable population frame not established.");
  if(missing.length)return{status:"INSUFFICIENT_PANEL",estimate:null,unit:null,missing,
    interpretation:"County cross-sections and hypotheses do not provide a valid DDD estimate. Require a treatment/comparator, pre/post periods and a subgroup split."};
  const change=(t:number,g:number)=>keys.get(""+t+1+g)!.value-keys.get(""+t+0+g)!.value;
  const estimate=(change(1,1)-change(0,1))-(change(1,0)-change(0,0));
  return {status:"DESCRIPTIVE_TRIPLE_DIFFERENCE",estimate,unit:[...units][0],missing:[],
    interpretation:"Arithmetic triple difference only. Causal attribution requires design, pre-trend checks, standard errors, spillover assessment, concurrent interventions and outcome measurement validation."};
}
export type HILMethod="SALP"|"CFIR"|"RE_AIM"|"PARALLAX"|"NONE";
export type MethodSelection={
  method:HILMethod; humanSelected:boolean; explicitDataTransferConsent:boolean;
  intendedPurpose:string; decisionOwner:string;
};
export function evaluateHIL(selection:MethodSelection){
  const recognized=new Set<HILMethod>(["SALP","CFIR","RE_AIM","PARALLAX","NONE"]);
  if(!recognized.has(selection.method))throw Error("Specialist method not recognized.");
  const selected=selection.method!=="NONE"&&selection.humanSelected&&Boolean(selection.intendedPurpose.trim())&&Boolean(selection.decisionOwner.trim());
  return {method:selection.method,eligibleForExternalCall:selected&&selection.explicitDataTransferConsent,
    state:selected?(selection.explicitDataTransferConsent?"HUMAN_SELECTED_WITH_TRANSFER_CONSENT":"HUMAN_SELECTED_LOCAL_ONLY"):"NO_HUMAN_SELECTION",
    approvalScope:"METHOD_AND_DECLARED_INPUTS_ONLY",
    note:"Selecting an analytical method does not validate its assumptions, record an institutional approval, or authorize field action."};
}
export function exerciseResearchToAction(program:ResearchProgram,journey:FullImplementationFlow,
  selection:MethodSelection,dddRows:readonly DddCell[]=[]){
  const hil=evaluateHIL(selection);const ddd=assessDDD(dddRows);
  const phaseReceipts=journey.nodes.map(node=>({
    id:node.id,title:node.title,owner:node.gates.map(g=>g.ownerRole).join("; "),
    questions:node.gates.map(g=>g.question),
    evidenceRequired:node.gates.map(g=>g.artifact+" — "+g.acceptance),
    observedAcceptance:false,
    status:node.id==="SALP"&&hil.state==="NO_HUMAN_SELECTION"?"AWAITING_HIL_METHOD_SELECTION":"EXERCISED_AS_DESIGN_NOT_FIELD_EXECUTED"
  }));
  return {
    version:"dis-whole-system-exercise-v1",caseId:program.caseId,domainAgnostic:true,
    statementOfReality:{
      designed:"Study and implementation workflow defined in research protocol; outputs remain proposals.",
      operational:"Actual screening, referral, staffing, partner capacity and budgets are not established by historical aggregate cancer statistics.",
      experienced:"Conversations with patients, community workers and clinicians must occur with consent; hypothetical perspectives are not testimony."
    },
    phaseReceipts,hil,ddd,
    sourceEvidence:program.indicators.map(i=>({
      id:i.id,what:i.label,geography:i.geography,period:i.period,value:i.value,
      unit:i.unit,url:i.sourceUrl,claimClass:i.evidenceState,limitation:i.sourceLimit
    })),
    interpretationGaps:program.issues.map(i=>({id:i.code,gap:i.finding,closureEvidence:i.nextEvidence})),
    stakeholderPerspectives:journey.collaborationRoles.map(x=>({
      role:x.role,scope:x.responsibility,source:"PROPOSED_ROLE_NOT_ENGAGED",participation:x.participationState
    })),
    interventionFit:journey.crossSiteTransport,
    logicModel:journey.logicModel,
    learningScenarios:journey.longitudinal.cases.map(x=>({path:x.path,
      status:"REHEARSED_NOT_OBSERVED",evidenceToResolve:x.evidenceRequired,
      adaptationsToTest:x.responsesToTest})),
    dayAfterSuccess:journey.longitudinal.ownerQuestions,
    historicalAndFuture:journey.longitudinal.triggers,
    finalState:"ANALYTICAL_END_TO_END_EXERCISE_COMPLETE_FIELD_OUTCOMES_UNKNOWN",
    nextEvidence:"Authorize research and local partner engagement; obtain valid target-site baseline, human-reviewed adaptation, field receipts and independent outcome evaluation."
  };
}
