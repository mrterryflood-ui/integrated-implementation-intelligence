/**
 * A public-evidence-only bridge to the existing private DIS case workspace.
 *
 * This function generates the case seed, not a client-side database model.
 * The existing /api/cases route owns authentication, tenant RLS, atomic
 * event creation, versioning, user authority and longitudinal persistence.
 * It deliberately does not transfer free-form literature searches, pasted
 * study measurements, corrective receipts, PHI or third-party private data.
 */
import type {ResearchProgram} from "./research-program";
import type {EvidenceActionReview} from "./evidence-action-bridge";

export const EVIDENCE_ACTION_HANDOFF_VERSION="dis-evidence-action-case-v1" as const;
type TaskSeed={title:string;why:string;success:string};
type MetricSeed={label:string;baseline:string;target:string;unit:string};
type CaseHandoff={
  title:string;question:string;report:{
    state:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED";
    schemaVersion:typeof EVIDENCE_ACTION_HANDOFF_VERSION;
    sourceState:"CURATED_PUBLIC_REFERENCE_NOT_INDEPENDENTLY_REEXTRACTED";
    caseId:string;
    geography:string;
    condition:string;
    sourceIndicators:Array<{
      id:string;construct:string;value:number|null;unit:string;
      period:string;sourceUrl:string;denominator:string
    }>;
    gapIDs:string[];
    actionPlan:{status:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED";tasks:TaskSeed[];metrics:MetricSeed[]};
    independentOutcomeVerified:false;
    causalEffectEstablished:false;
    interventionAuthorized:false;
    externalCommunicationAuthorized:false;
    noPatientData:true;
  }
};
const prioritized=[
  "program:GEOGRAPHY_PROXY_NOT_CITY",
  "all-stage-incidence","screening-denominator","diagnostic-resolution",
  "counterfactual-unverified","delivery-not-witnessed"
];
export function buildEvidenceActionCaseHandoff(program:ResearchProgram,review:EvidenceActionReview):CaseHandoff{
  if(program.caseId!==review.caseId||review.schemaVersion!=="dis-evidence-action-v1")
    throw Error("Research bridge identity/version mismatch; refuse case seed.");
  if(review.measures.some(x=>x.indicator.evidenceState!=="PUBLISHED_AGGREGATE"||x.provenance!=="CURATED_PUBLIC_AGGREGATE_NOT_REEXTRACTED"))
    throw Error("Only curated public aggregate records can seed this case.");
  if(program.individualDataProcessed||program.interventionAuthorized||review.causalEffectEstablished||review.verifiedCorrections!==0)
    throw Error("A case seed cannot upgrade authorization or independently verified outcome claims.");
  const gaps=prioritized.flatMap(id=>review.gaps.filter(x=>x.id===id)).slice(0,6);
  const tasks=gaps.map(x=>({
    title:("Investigate: "+x.problem).slice(0,175),
    why:("Evidence gap "+x.id+". Proposed review owner: "+x.ownerRole+".").slice(0,340),
    success:x.nextEvidence.slice(0,340)
  }));
  const metrics:MetricSeed[]=[
    {label:"Site-matched all-stage incidence source",baseline:"Not established",target:"Source-verified compatible measure",unit:"research evidence"},
    {label:"Screening uptake in eligible population",baseline:"Not measured locally",target:"Site-defined before pilot",unit:"%"},
    {label:"Abnormal-result diagnostic resolution",baseline:"Not measured locally",target:"Site-defined before pilot",unit:"%"},
    {label:"Correction implementation and core fidelity",baseline:"No field delivery verified",target:"Site-defined; human authorized",unit:"%"},
    {label:"Source-supported competing mechanisms",baseline:"Not adjudicated locally",target:"Reviewers and disconfirming evidence",unit:"count"}
  ];
  const title="Colorectal evidence-to-action | Hinds–Harris internal research";
  const question=program.question+" [Internal evidence-to-action pilot: "+program.population.targetName+"; comparisons not yet validated]";
  return {
    title,question,
    report:{
      state:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",
      schemaVersion:EVIDENCE_ACTION_HANDOFF_VERSION,
      sourceState:"CURATED_PUBLIC_REFERENCE_NOT_INDEPENDENTLY_REEXTRACTED",
      caseId:review.caseId,geography:program.population.proxyUnit,condition:program.site,
      sourceIndicators:review.measures.map(x=>({
        id:x.id,construct:x.construct,value:x.indicator.value,unit:x.indicator.unit,
        period:x.indicator.period,sourceUrl:x.indicator.sourceUrl,
        denominator:x.indicator.denominatorDefinition
      })),
      gapIDs:gaps.map(x=>x.id),
      actionPlan:{status:"RESEARCH_GAP_SCAFFOLD_UNVERIFIED",tasks,metrics},
      independentOutcomeVerified:false,causalEffectEstablished:false,
      interventionAuthorized:false,externalCommunicationAuthorized:false,noPatientData:true
    }
  };
}
