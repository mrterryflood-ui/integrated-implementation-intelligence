#!/usr/bin/env python3
"""Synthetic service-pathway rehearsal, not a diagnostic or treatment algorithm.
The input's concern status is an explicit scenario premise, never inferred from
symptoms. Clinical decisions, consent, deadlines and response times belong to
an independently approved local protocol and its authorized staff.
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime
from pathlib import Path

SOURCES = {
    'ACOG2026': 'https://www.acog.org/news/news-releases/2026/02/acog-publishes-new-endometriosis-clinical-guidance-aiming-shorten-time-diagnosis-improve-access-care',
    'NICE_NG73': 'https://www.nice.org.uk/guidance/ng73/chapter/Recommendations',
    'WHO2025': 'https://www.who.int/news-room/fact-sheets/detail/endometriosis',
}


def stamp(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError('Timezone-aware timestamp required')
    d = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if d.tzinfo is None:
        raise ValueError('Timezone-aware timestamp required')
    return d


def audit(scenario: dict, as_of: str) -> dict:
    """Check workflow promises in a synthetic scenario. No patient inference."""
    if not isinstance(scenario, dict) or scenario.get('evidence_class') != 'SYNTHETIC':
        raise ValueError('This rehearsal accepts explicitly synthetic scenarios only')
    allowed = {'id','evidence_class','ongoing_concern','imaging','surgery_required_before_care',
               'referral_status','barrier','patient_choice','owner_role','review_due_at',
               'next_step','request_close','safety_review_recorded'}
    if set(scenario) - allowed:
        raise ValueError('Unexpected field: no patient records or identifiers accepted')
    for key in ('ongoing_concern','surgery_required_before_care','request_close','safety_review_recorded'):
        if type(scenario.get(key)) is not bool:
            raise ValueError('Explicit Boolean required: '+key)
    enums = {'imaging': {'NOT_DONE','NORMAL','FINDING_REQUIRES_REVIEW','NOT_APPLICABLE'},
             'referral_status': {'NOT_NEEDED','PLANNED','SENT','ACCEPTED','ATTENDED','CLINICALLY_REVIEWED'},
             'patient_choice': {'CONTINUE','DECLINED','PAUSED'},
             'barrier': {'NONE_RECORDED','COST','TRANSPORT','CAPACITY','ACCESSIBILITY','OTHER'}}
    for k, values in enums.items():
        if scenario.get(k) not in values:
            raise ValueError('Unsupported workflow state: '+k)
    for k in ('id','owner_role','next_step','review_due_at'):
        if not isinstance(scenario.get(k),str) or len(scenario[k])>500:
            raise ValueError('Bounded string required: '+k)
    now=stamp(as_of)
    due=stamp(scenario['review_due_at']) if scenario['review_due_at'] else None
    issues=[]
    if scenario['ongoing_concern'] and scenario['imaging']=='NORMAL' and scenario['request_close']:
        issues.append('NORMAL_IMAGING_CANNOT_ALONE_CLOSE_PERSISTENT_CONCERN')
    if scenario['surgery_required_before_care']:
        issues.append('SURGERY_ONLY_GATE_REQUIRES_CLINICAL_PROTOCOL_REVIEW')
    if not scenario['safety_review_recorded']:
        issues.append('MISSING_HUMAN_SAFETY_AND_DIFFERENTIAL_REVIEW')
    active=scenario['ongoing_concern'] or scenario['referral_status'] in {'PLANNED','SENT','ACCEPTED','ATTENDED'}
    if active and not scenario['owner_role'].strip():
        issues.append('NO_ACCOUNTABLE_OWNER')
    if active and (due is None or not scenario['next_step'].strip()):
        issues.append('NO_EXPLICIT_REASSESSMENT_PLAN')
    if active and due is not None and now>due:
        issues.append('OPERATIONAL_REVIEW_OVERDUE')
    if scenario['request_close'] and scenario['referral_status'] in {'PLANNED','SENT','ACCEPTED','ATTENDED'}:
        issues.append('REFERRAL_OR_ATTENDANCE_IS_NOT_REVIEWED_RESOLUTION')
    if scenario['barrier']!='NONE_RECORDED':
        issues.append('ACCESS_BARRIER_NEEDS_OWNER_FOLLOW_THROUGH')
    if scenario['patient_choice'] in {'DECLINED','PAUSED'} and scenario['request_close'] and scenario['ongoing_concern']:
        issues.append('DOCUMENT_PREFERENCE_AND_RETURN_PLAN_NOT_NONCOMPLIANCE')
    if scenario['ongoing_concern'] and scenario['request_close']:
        issues.append('PERSISTENT_CONCERN_REQUIRES_REASSESSMENT_NOT_AUTO_CLOSURE')
    return {
        'scenario_id':scenario['id'], 'evidence_class':'SYNTHETIC',
        'status':'WORKFLOW_REVIEW_REQUIRED' if issues else 'DOCUMENTED_WORKFLOW_ONLY',
        'issues':issues, 'owner_role':scenario['owner_role'], 'review_due_at':scenario['review_due_at'],
        'diagnosis_established':False, 'test_or_treatment_ordered':False,
        'outreach_sent':False, 'case_closed':False, 'primary_prevention_established':False,
        'beneficiary_outcome_verified':False, 'source_refs':SOURCES,
        'boundary':'Operational pathway exercise only. Concern, safety review and due date are declared scenario inputs; no triage accuracy or reviewer authenticity is established.'
    }


def fixtures() -> list[dict]:
    base={'id':'synthetic-baseline','evidence_class':'SYNTHETIC','ongoing_concern':True,
          'imaging':'NORMAL','surgery_required_before_care':False,'referral_status':'PLANNED',
          'barrier':'NONE_RECORDED','patient_choice':'CONTINUE','owner_role':'Synthetic pathway reviewer',
          'review_due_at':'2026-11-10T12:00:00Z','next_step':'Human review of unresolved concern and appropriate care options',
          'request_close':False,'safety_review_recorded':True}
    return [base,
            {**base,'id':'normal-scan-premature-closure','request_close':True},
            {**base,'id':'surgery-only-wait','surgery_required_before_care':True},
            {**base,'id':'referral-sent-is-not-resolution','referral_status':'SENT','request_close':True},
            {**base,'id':'missed-operational-followup','review_due_at':'2026-11-01T12:00:00Z'},
            {**base,'id':'transport-barrier','barrier':'TRANSPORT'},
            {**base,'id':'patient-pauses-care','patient_choice':'PAUSED','request_close':True},
            {**base,'id':'no-owner-or-deadline','owner_role':'','review_due_at':''},
            {**base,'id':'safety-assessment-not-recorded','safety_review_recorded':False}]


def run(out: Path) -> dict:
    # These dates are fixed fixtures, not guideline-mandated service intervals.
    result={'schema':'dis-early-action-rehearsal-v1','clinical_protocol_status':'DRAFT_NOT_FIELD_VALIDATED',
            'as_of':'2026-11-07T12:00:00Z','clinical_action_authorized':False,
            'results':[audit(s,'2026-11-07T12:00:00Z') for s in fixtures()],
            'limits':['All cases are synthetic; no patient data or alerts are processed.',
                      'No guideline prescribes the fixture review dates. Local urgency/timing needs licensed clinical approval.',
                      'Current evidence supports evaluation before surgical confirmation; it does not prove prevention of disease onset.',
                      'No automated risk score, mass screening, imaging order, treatment or diagnosis is produced.']}
    out.mkdir(parents=True,exist_ok=True)
    (out/'early_action_rehearsal.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    return result


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True);args=ap.parse_args()
    result=run(args.out)
    print(json.dumps({'status':'SYNTHETIC_WORKFLOW_REHEARSAL','scenarios':len(result['results']),
                      'clinical_action_authorized':False}))
