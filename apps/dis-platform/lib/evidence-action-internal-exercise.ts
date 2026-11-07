/**
 * Internal protocol exercise. No scientific adjudication, patient data, RPLICE
 * call, network access, or empirical intervention evaluation occurs here.
 * Each fixture is synthetic except the clearly marked curated NCI case.
 */
import {colorectalEvidenceAction} from "./evidence-action-colorectal";
import {reviewCounterfactual,reviewCrossStudyMeasurements,reviewCorrectionReceipt,
  type CounterfactualRequest,type CorrectionReceipt} from "./evidence-action-bridge";

export type ExerciseFinding={
 id:string;scenario:string;expected:string;observed:string;
 result:"PASS_CONTRACT"|"GAP_EXPOSED";
 nextEvidence:string;
};
const panel:CounterfactualRequest={
 condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",unit:"synthetic index units",
 interventionYear:2021,commonMeasurementVersion:"Declared same synthetic instrument and calibration for both groups",
 comparisonRationale:"Synthetic distinct comparison areas; actual covariate comparability has not been demonstrated",
 parallelTrendsEvidence:"Declared pretrend analysis; synthetic input is not an independent empirical assessment",
 competingChangesEvidence:"Declared examination of competing policies; actual events are not independently verified",
 spilloverAssessment:"Declared assessment of cross-area service use; no real interference data supplied",
 independentReviewer:"A reviewer label is self-reported and does not authenticate an independent assessment",
 treated:{site:"Synthetic A",populationFrame:"Same synthetic eligible frame",
  observations:[{year:2018,value:10,denominator:100},{year:2019,value:12,denominator:100},
    {year:2020,value:14,denominator:100},{year:2021,value:16,denominator:100},
    {year:2022,value:18,denominator:100}]},
 comparator:{site:"Synthetic B",populationFrame:"Same synthetic eligible frame",
  observations:[{year:2018,value:9,denominator:100},{year:2019,value:9,denominator:100},
    {year:2020,value:9,denominator:100},{year:2021,value:10,denominator:100},
    {year:2022,value:11,denominator:100}]}
};
export function exerciseEvidenceAction():{schema:"dis-internal-exercise-v1";findings:ExerciseFinding[];allContractChecksPassed:boolean;scientificValidityEstablished:false}{
 const findings:ExerciseFinding[]=[];
 const check=(id:string,scenario:string,expected:string,actual:boolean,observed:string,nextEvidence:string)=>{
  findings.push({id,scenario,expected,observed,result:actual?"PASS_CONTRACT":"GAP_EXPOSED",nextEvidence});
 };
 const {bridge,program}=colorectalEvidenceAction();
 check("EX-01","Curated NCI county incidence, stage share and annual case count",
  "Three different constructs remain nonpoolable",
  bridge.measures.length===3&&bridge.links.length===3&&bridge.links.every(l=>!l.safeToPool),
  bridge.measures.map(m=>m.construct+":"+m.indicator.value).join("; "),
  "Independently re-extract original NCI release, stage completeness and rate definitions.");
 check("EX-02","All-stage disease burden missing",
  "All-stage incidence remains a gap",
  bridge.gaps.some(g=>g.id==="all-stage-incidence"),
  "All-stage gap="+bridge.gaps.some(g=>g.id==="all-stage-incidence"),
  "Retrieve registry all-stage incidence and aligned longitudinal age-adjusted rates.");
 check("EX-03","Hinds source presented as a second independent study",
  "Shared source lineage is not counted as corroboration",
  reviewCrossStudyMeasurements([{
   id:"duplicate-nci",title:"Repeated original registry",sourceUrl:bridge.measures[0].indicator.sourceUrl,
   condition:"colorectal",construct:"LATE_STAGE_INCIDENCE",geography:"Hinds County, MS",
   populationFrame:bridge.measures[0].populationFrame,period:bridge.measures[0].indicator.period,
   numeratorDefinition:bridge.measures[0].indicator.numeratorDefinition,
   denominatorDefinition:bridge.measures[0].indicator.denominatorDefinition,
   unit:bridge.measures[0].indicator.unit,methodVersion:bridge.measures[0].methodVersion,
   value:bridge.measures[0].indicator.value
  }],bridge.measures).links.some(l=>l.issues.some(x=>x.includes("Shared original-source lineage"))),
  "Duplicate NCI record is explicitly linked to original source lineage",
  "Obtain independently sampled measurements rather than mirrored registry views.");
 const falsePretrend=reviewCounterfactual(panel);
 const preA=panel.treated.observations.filter(o=>o.year<2021);
 const preB=panel.comparator.observations.filter(o=>o.year<2021);
 const slopeA=(preA[2].value!-preA[0].value!)/(preA[2].year-preA[0].year);
 const slopeB=(preB[2].value!-preB[0].value!)/(preB[2].year-preB[0].year);
 check("EX-04","Synthetic groups have visibly divergent pre-intervention slopes",
  "A structural screen may return a candidate but cannot establish parallel trends or causality",
  falsePretrend.causalEffectEstablished===false,
  "Pretrend slopes "+slopeA+" vs "+slopeB+"; screen="+falsePretrend.gate+"; causal=false",
  "Add objective pretrend diagnostics, event-study plots, falsification tests and independent design review; do not claim a DID effect.");
 const incomplete=reviewCounterfactual({...panel,interventionYear:null,
  treated:{...panel.treated,observations:panel.treated.observations.slice(0,1)}});
 check("EX-05","Single observation and no documented intervention date",
  "DID calculation refused",
  incomplete.rawDifferenceInDifferences===null&&incomplete.gate==="INSUFFICIENT_FOR_CAUSAL_ESTIMATE",
  "gate="+incomplete.gate,
  "Acquire multiple common pre/post observations and intervention date.");
 const action=bridge.corrections[0];
 const claimed:CorrectionReceipt={proposedActionId:action.id,
  deliveryRecordedAt:"2026-11-07T14:00:00Z",sourceUrl:"https://example.org/synthetic-receipt",
  eligibleDenominator:100,completedNumerator:75,coreFunctionChecked:true,
  balancingHarmsReviewed:true,comparisonRecorded:true,reviewerIdentity:"Self-reported reviewer"};
 const audit=reviewCorrectionReceipt(action,claimed);
 check("EX-06","Self-reported completed correction with plausible counts",
  "Receipt cannot become independently verified outcome",
  audit.provisionalCompleteness===true&&audit.claimedOutcomeVerified===false&&audit.actionAuthorized===false,
  "provisional="+audit.provisionalCompleteness+" verified="+audit.claimedOutcomeVerified,
  "Add issuer authentication, owner approval, longitudinal observation and independent outcome adjudication.");
 check("EX-07","Local diagnostic follow-up absent despite screening intervention candidates",
  "Diagnostic resolution and actual delivery remain open",
  bridge.gaps.some(g=>g.id==="diagnostic-resolution")&&bridge.gaps.some(g=>g.id==="delivery-not-witnessed"),
  "diagnostic and delivery gaps remain open",
  "Obtain authorized abnormal-result cohorts, completion, time-to-resolution and harms.");
 check("EX-08","No patient, community or institutional testimony gathered",
  "No human consultation or specialist execution represented as completed",
  program.individualDataProcessed===false&&bridge.specialistExecution==="HUMAN_SELECTION_REQUIRED_NOT_INVOKED",
  "patient records=false; specialist execution="+bridge.specialistExecution,
  "Seek separate human approval and valid participant methods before fieldwork.");
 return {schema:"dis-internal-exercise-v1",findings,
  allContractChecksPassed:findings.every(f=>f.result==="PASS_CONTRACT"),
  scientificValidityEstablished:false};
}
