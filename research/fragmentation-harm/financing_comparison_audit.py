"""Arithmetic and comparability checks for the financing evidence handoff.

Consumes a curated PUBLIC aggregate transcription, not patient records. This is
not source authentication, causal identification, independent review or a
production integration. Original source context must be appraised separately.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Any


def finite(value: Any) -> float:
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError('finite numeric value required; booleans are not estimates')
    return float(value)


def difference(a: Any, b: Any) -> float:
    return round(finite(a) - finite(b), 10)


def reference_difference(a: dict, b: dict) -> dict:
    """A shared reference permits subtraction, not an independent-sample SE."""
    for field in ('source_id', 'reference', 'endpoint', 'unit'):
        if not a.get(field) or a[field] != b.get(field):
            raise ValueError('reference contrasts have incompatible ' + field)
    return {'point_difference': difference(a['effect'], b['effect']),
            'direction': a['group'] + ' minus ' + b['group'],
            'unit': a['unit'], 'confidence_interval': None, 'p_value': None,
            'uncertainty_status': 'COVARIANCE_NOT_SUPPLIED',
            'causal_effect_established': False}


def subgroup_envelope(overall: Any, subgroups: list, *,
                      common_denominator_confirmed: bool = False,
                      rounding_tolerance: float = 0.1) -> dict:
    """Necessary mixture check; passing is not evidence of common denominators."""
    if not isinstance(subgroups, list) or not subgroups:
        raise ValueError('nonempty subgroup list required')
    values = [finite(v) for v in subgroups]
    value, tolerance = finite(overall), finite(rounding_tolerance)
    if not 0 <= value <= 100 or any(not 0 <= v <= 100 for v in values) or tolerance < 0:
        raise ValueError('percentages and tolerance outside domain')
    if type(common_denominator_confirmed) is not bool:
        raise ValueError('common-denominator status must be boolean')
    inside = min(values) - tolerance <= value <= max(values) + tolerance
    return {'within_subgroup_envelope': inside,
            'status': ('NECESSARY_CHECK_PASSES' if inside else
                       'INCOMPATIBLE_UNDER_COMMON_DENOMINATOR') if common_denominator_confirmed
                      else 'DENOMINATOR_REVIEW_REQUIRED',
            'source_error_proven': False, 'values_modified': False}


def require_same_endpoint(recorded: str, requested: str) -> None:
    """No semantic inference: caller supplies explicit endpoint identifiers."""
    if not isinstance(recorded, str) or not recorded.strip() or recorded != requested:
        raise ValueError('ENDPOINT_MISMATCH: administrative resolution is not completed care')


def interpret_design(design: str, *, same_time: bool, causal_claim: bool) -> str:
    if type(same_time) is not bool or type(causal_claim) is not bool:
        raise ValueError('design flags must be boolean')
    if design not in ('descriptive', 'adjusted_observational', 'difference_in_differences'):
        raise ValueError('unknown design')
    if design == 'difference_in_differences' and same_time:
        raise ValueError('DiD needs a time contrast, not only income strata')
    if causal_claim and design in ('descriptive', 'adjusted_observational'):
        raise ValueError('causal promotion not supported by this design label')
    return 'DESIGN_ASSUMPTIONS_REQUIRE_SEPARATE_REVIEW'


def _unique(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key')
        result[key] = value
    return result


def run(path: Path | str) -> dict:
    raw = Path(path).read_bytes()
    data = json.loads(raw, object_pairs_hook=_unique)
    if data.get('schema') != 'chainweb-financing-published-evidence-v1':
        raise ValueError('unexpected evidence schema')
    if data.get('patient_level_data_accessed') is not False:
        raise ValueError('this public aggregate audit does not admit patient-level data')
    ids = [s['id'] for s in data['sources']]
    if len(ids) != len(set(ids)):
        raise ValueError('duplicate source IDs')
    for group in ('access', 'hardship', 'matched', 'ratios', 'heterogeneity', 'observations'):
        for row in data[group]:
            if row['source_id'] not in ids:
                raise ValueError('unregistered source')
            if 'lower95' in row:
                if not finite(row['lower95']) <= finite(row['effect']) <= finite(row['upper95']):
                    raise ValueError('effect/interval mismatch')
            if group == 'access':
                if any(not 0 <= finite(row[k]) <= 100 for k in ('medicaid', 'private', 'uninsured')):
                    raise ValueError('access estimate outside percentage scale')
            if group == 'matched':
                for key in ('a', 'b'):
                    if not finite(row[key + '_lower95']) <= finite(row[key]) <= finite(row[key + '_upper95']):
                        raise ValueError('adjusted mean/interval mismatch')
    access = [{**r, 'medicaid_minus_private_pp': difference(r['medicaid'], r['private']),
               'medicaid_minus_uninsured_pp': difference(r['medicaid'], r['uninsured'])}
              for r in data['access']]
    shared = []
    for endpoint in dict.fromkeys(r['endpoint'] for r in data['hardship']):
        a = next(r for r in data['hardship'] if r['endpoint'] == endpoint and r['group'] == 'VA')
        b = next(r for r in data['hardship'] if r['endpoint'] == endpoint and r['group'] == 'Medicaid')
        shared.append({'endpoint': endpoint, **reference_difference(a, b)})
    matched = [{**r, 'b_minus_a': difference(r['b'], r['a']), 'difference_ci': None}
               for r in data['matched']]
    overall = next(r for r in access if r['cohort'] == 'All incomes')
    low = next(r for r in access if r['cohort'] == 'Income <=138% FPL'
               and r['endpoint'] == overall['endpoint'])
    return {'schema': 'chainweb-financing-arithmetic-receipt-v1',
            'input_sha256': hashlib.sha256(raw).hexdigest(),
            'source_count': len(ids), 'access': access,
            'shared_reference_point_contrasts': shared, 'matched': matched,
            'composition_contrast_change_pp': difference(low['medicaid_minus_private_pp'], overall['medicaid_minus_private_pp']),
            'composition_contrast_is_causal_DiD': False,
            'medical_bill_row_check': subgroup_envelope(12.2, [75.7, 64.6]),
            'care_completion_from_cancellation_inferred': False,
            'independent_scientific_acceptance': False,
            'clinical_benefit_of_DIS_established': False,
            'microdata_regressions_reestimated': False}


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('evidence', type=Path)
    ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args()
    result = run(args.evidence)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2, ensure_ascii=False, allow_nan=False) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ('access','matched','shared_reference_point_contrasts')}, indent=2))
