"""Evidence metadata checks, not proof of scientific truth or a privacy filter.

No storage, clinical action, production integration, or patient-data permission.
Accepted causal metadata remains subject to source verification and human review.
"""
from collections.abc import Mapping
from datetime import datetime
from math import isfinite
import re

EDGE_TYPES = {'observed_association','measurement_dependency','operational_dependency',
              'causal_hypothesis','validated_causal_effect','policy_constraint','transfer_hypothesis'}
GRADES = {'verified','supported','inferred','hypothesis','contradicted','unknown'}


def _text(x):
    return isinstance(x,str) and bool(x.strip())


def _dt(s):
    try:
        d=datetime.fromisoformat(s.replace('Z','+00:00'))
        if d.tzinfo is None or d.utcoffset() is None: raise ValueError('timezone required')
        return d
    except (AttributeError,ValueError,TypeError) as e:
        raise ValueError('invalid timestamp with timezone') from e


def validate_evidence_event(event: Mapping):
    if not isinstance(event,Mapping): raise ValueError('evidence must be a mapping')
    fields=('event_id','source_id','source_version','source_extract_sha256','construct_id',
            'denominator_definition','event_time','available_to_decision_time','decision_time','evidence_grade')
    missing=[k for k in fields if not _text(event.get(k))]
    if missing: raise ValueError('missing evidence fields: '+', '.join(missing))
    digest=event['source_extract_sha256']
    if len(digest)!=64 or any(c not in '0123456789abcdef' for c in digest):
        raise ValueError('source hash must be lowercase sha256')
    times=[_dt(event[k]) for k in ('event_time','available_to_decision_time','decision_time')]
    if not times[0]<=times[1]<=times[2]:
        raise ValueError('future-information leakage or impossible availability sequence')
    if event['evidence_grade'] not in GRADES: raise ValueError('unrecognized evidence grade')
    return True


def validate_connection(edge: Mapping):
    if not isinstance(edge,Mapping): raise ValueError('connection must be a mapping')
    if not _text(edge.get('edge_type')) or edge['edge_type'] not in EDGE_TYPES:
        raise ValueError('edge type unrecognized')
    for key in ('source_id','evidence_grade','disconfirmation_test'):
        if not _text(edge.get(key)): raise ValueError('missing connection field: '+key)
    if edge['evidence_grade'] not in GRADES: raise ValueError('unrecognized evidence grade')
    if edge['edge_type']=='validated_causal_effect':
        for key in ('identification_design','population','time_window'):
            if not _text(edge.get(key)): raise ValueError('causal effect missing validation: '+key)
        if edge['evidence_grade']!='verified': raise ValueError('causal edge requires verified evidence grade')
        effect=edge.get('effect_estimate')
        if isinstance(effect,bool) or not isinstance(effect,(int,float)) or not isfinite(effect):
            raise ValueError('effect_estimate must be finite numeric; zero is permitted')
        if not _text(edge.get('effect_measure')): raise ValueError('effect_measure required')
        interval=edge.get('uncertainty')
        if not isinstance(interval,Mapping): raise ValueError('structured uncertainty required')
        lo,hi=interval.get('lower'),interval.get('upper')
        if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not isfinite(v) for v in (lo,hi)):
            raise ValueError('finite uncertainty bounds required')
        if not lo<=effect<=hi: raise ValueError('effect must lie within ordered uncertainty bounds')
        review=edge.get('independent_review')
        if (not isinstance(review,Mapping) or review.get('status')!='approved'
                or not _text(review.get('reviewer_id')) or not _text(review.get('artifact_ref'))):
            raise ValueError('independent_review requires approved status, reviewer and receipt')
        reviewed_at=review.get('reviewed_at')
        if not isinstance(reviewed_at,str) or not re.fullmatch(
                r'\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d'
                r'(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)', reviewed_at):
            raise ValueError('independent_review requires valid timezone-aware reviewed_at')
        try:
            _dt(reviewed_at)
        except ValueError as exc:
            raise ValueError('independent_review requires valid timezone-aware reviewed_at') from exc
        if edge.get('result') not in {'supported','null','mixed','contradicted','inconclusive'}:
            raise ValueError('explicit result required; retain null and contradictory findings')
    return True


def compare_measurement_constructs(left: Mapping, right: Mapping):
    """Qualify a numerical comparison, without excluding complementary evidence."""
    fields=('cancer_sites','stage_components','measure','denominator_unit','age_standard',
            'sex_scope','age_scope','observation_period','reporting_delay_adjustment')
    missing=[k for k in fields if left.get(k) is None or right.get(k) is None
             or left.get(k)=='' or right.get(k)=='']
    if missing:
        return {'status':'INSUFFICIENT_METADATA','fields':missing,'contextual_use_allowed':True}
    differences=[]
    for key in fields:
        a,b=left[key],right[key]
        if key in ('cancer_sites','stage_components'):
            if (not isinstance(a,(list,tuple)) or not isinstance(b,(list,tuple))
                    or not a or not b or not all(_text(v) for v in list(a)+list(b))):
                return {'status':'INSUFFICIENT_METADATA','fields':[key],'contextual_use_allowed':True}
            a,b=sorted(a),sorted(b)
        if a!=b: differences.append(key)
    return {'status':'COMPLEMENTARY_NOT_POOLABLE' if differences else 'RECORDED_FIELDS_ALIGNED_ONLY',
            'fields':differences,'contextual_use_allowed':True,
            'causality_or_transportability_established':False}
