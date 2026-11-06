/**
 * DIS Inquiry ↔ Council bridge.
 *
 * The Council receives bibliographic/source excerpts, NOT original instrument
 * measurements or adjudicated clinical outcomes. We deliberately DO NOT
 * manufacture instruments, diagnoses, hypotheses, causal effects or a
 * ready-to-act finding from retrieved abstracts or platform summaries.
 * Owner and actual beneficiary decision must still be established.
 */
import {investigateMethod,type Inquiry,type MethodAssessment} from './dis-inquire';
import type {EvidenceSource} from './evidence-integrity';

export type CouncilInquiryReview={
  schemaVersion:'dis-council-inquiry-v1';
  decisionAsOf:string;
  assessment:MethodAssessment;
  sourceLeadIds:string[];
  sourceLeads:{id:string;kind:'BIBLIOGRAPHIC_LEAD'|'SOURCE_REPORTED_EXCERPT';title:string;originalUrl:string}[];
  actualInstrumentsValidated:0;
  alternativeExplanationsIndependentlyTested:0;
  effectOrTreatmentValidated:false;
  authorizedToAct:false;
  explanation:string;
};

/** A methodological preflight, not substantive evidence extraction or scoring. */
export function reviewCouncilInquiry(question:string,sources:readonly EvidenceSource[],decisionAsOf:string):CouncilInquiryReview{
  const asOf=Date.parse(decisionAsOf);
  if(!Number.isFinite(asOf)||!/(Z|[+-]\d{2}:\d{2})$/i.test(decisionAsOf))
    throw new Error('Council inquiry requires a timestamp with explicit time zone.');
  const input:Inquiry={
    id:'council-preliminary-method-review',
    decisionAsOf:new Date(asOf).toISOString(),
    question:question.slice(0,3000),
    intendedUse:'Preliminary research and decision-method review; source documents still require inspection.',
    decisionOwner:'',
    targetPopulation:'',
    targetOutcome:'',
    systemContext:'Council source discovery and analytical perspectives; not empirical instrument observations.',
    // Source abstracts cannot establish any of these on their own.
    searchFrame:undefined,
    hypotheses:[],
    instruments:[],
    evidence:[],
    proposedDecision:undefined
  };
  const assessment=investigateMethod(input);
  return {
    schemaVersion:'dis-council-inquiry-v1',
    decisionAsOf:input.decisionAsOf,
    assessment,
    sourceLeadIds:sources.slice(0,16).map(s=>s.id),
    sourceLeads:sources.slice(0,16).map(s=>({
      id:s.id,
      kind:s.evidenceKind==='SCHOLARLY_ABSTRACT'||!s.evidenceKind?'BIBLIOGRAPHIC_LEAD' as const:'SOURCE_REPORTED_EXCERPT' as const,
      title:s.title.slice(0,240),
      originalUrl:s.url
    })),
    actualInstrumentsValidated:0,
    alternativeExplanationsIndependentlyTested:0,
    effectOrTreatmentValidated:false,
    authorizedToAct:false,
    explanation:'The findings flag gaps in an initially framed investigation, not failed care, a false publication or a faulty product. The analyst must define the phenomenon, specify discriminating observations and compare alternatives. Bibliographic leads, narrative excerpts and simulated Council perspectives are not independently verified instruments, people or outcomes.'
  };
}
