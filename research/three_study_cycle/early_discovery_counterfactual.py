#!/usr/bin/env python3
"""Synthetic CRC pathway rehearsal, not a clinical prediction or screening rule.

The model asks which jointly specified mechanisms could change discovery timing.
Inputs are explicit assumptions, never inferred efficacy from ecological rates.
Missing inputs create a next-test plan. They do not become zero or invented data.
No age threshold, ordering, patient selection, diagnosis or external action occurs.
"""
from __future__ import annotations
import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path

PROBABILITIES = ('late_fraction', 'prevented_fraction', 'actionable_fraction',
                 'reach', 'sensitivity', 'specificity', 'follow_through',
                 'stage_change_given_timely_action')
REQUIRED = ('population', 'incident_cases', 'confirmatory_capacity') + PROBABILITIES
LIMITS = [
    'All supplied values are scenario assumptions, not validated clinical parameters.',
    'Fixed-horizon expected counts, not sampled persons, age-adjusted rates or causal effects.',
    'Assumes equal reach and follow-through across case status and stage; capacity is allocated proportionally to referrals.',
    'Assumes prevention reduces early and late incidence proportionally; no overlap or lag model is identified.',
    'Assumes an actionable prediagnostic window and a chance that timely completed action changes recorded stage; neither proves patient benefit.',
    'No overdiagnosis, stage migration, treatment effects or mortality model. Those require separate evidence and outcomes.',
    'Sensitivity and specificity require population-, modality-, threshold- and pathway-specific validation; screening and symptomatic workup cannot share them by assumption in practice.',
]


def evaluate(inputs: dict) -> dict:
    if not isinstance(inputs, dict) or set(inputs) - set(REQUIRED):
        raise ValueError('Use the declared bounded scenario parameters only')
    missing = [k for k in REQUIRED if k not in inputs or inputs[k] is None]
    result = {'schema': 'dis-early-discovery-counterfactual-v1',
              'evidence_class': 'SYNTHETIC_ASSUMPTION_BASED',
              'clinical_use_authorized': False, 'patient_benefit_established': False,
              'limits': LIMITS, 'missing_parameters': missing}
    # Validate provided values even when other fields are missing.
    for k, v in inputs.items():
        if v is None:
            continue
        if type(v) not in (int, float) or not math.isfinite(v):
            raise ValueError('Finite numeric parameter required: ' + k)
        if k in PROBABILITIES and not 0 <= v <= 1:
            raise ValueError('Probability outside [0,1]: ' + k)
        if k not in PROBABILITIES and v < 0:
            raise ValueError('Negative count/capacity: ' + k)
    if inputs.get('population') is not None and inputs['population'] <= 0:
        raise ValueError('Positive population required')
    if all(inputs.get(k) is not None for k in ('population', 'incident_cases')) and inputs['incident_cases'] > inputs['population']:
        raise ValueError('One-episode model requires cases <= population')
    if missing:
        return {**result, 'state': 'SYNTHESIS_AND_NEXT_TEST_PLAN', 'projection': None,
                'next_tests': [{'parameter': k, 'action': 'Obtain a source-aligned estimate or explicitly justified sensitivity range before numerical projection'} for k in missing]}
    n, cases, late = inputs['population'], inputs['incident_cases'], inputs['late_fraction']
    surviving = cases * (1 - inputs['prevented_fraction'])
    true_referrals = surviving * inputs['actionable_fraction'] * inputs['reach'] * inputs['sensitivity']
    false_referrals = (n - surviving) * inputs['reach'] * (1 - inputs['specificity'])
    referrals = true_referrals + false_referrals
    intended_completions = referrals * inputs['follow_through']
    completions = min(intended_completions, inputs['confirmatory_capacity'])
    completion_probability = completions / referrals if referrals else 0.
    shifted = true_referrals * completion_probability * late * inputs['stage_change_given_timely_action']
    early_count = surviving * (1 - late) + shifted
    late_count = surviving * late - shifted
    if not all(math.isfinite(v) for v in (surviving, referrals, completions, shifted, early_count, late_count)):
        raise ValueError('Numerical overflow')
    early_late_ratio = early_count / late_count if late_count else None
    if early_late_ratio is not None and not math.isfinite(early_late_ratio):
        raise ValueError('Numerical overflow in early-to-late ratio')
    return {**result, 'state': 'SYNTHETIC_PROJECTION_ONLY', 'assumptions': dict(inputs),
            'projection': {
                'baseline_early_cases': cases * (1 - late), 'baseline_late_cases': cases * late,
                'prevented_cases': cases - surviving,
                'early_cases': early_count, 'late_cases': late_count,
                'early_fraction': early_count / surviving if surviving else None,
                'late_fraction': late_count / surviving if surviving else None,
                'early_to_late_ratio': early_late_ratio,
                'early_exceeds_late': early_count > late_count if surviving else None,
                'shifted_from_late_to_early': shifted,
                'true_signal_referrals': true_referrals, 'false_positive_referrals': false_referrals,
                'referral_ppv': true_referrals / referrals if referrals else None,
                'completed_confirmatory_actions': completions,
                'false_positive_completed_actions': false_referrals * completion_probability,
                'uncompleted_referrals': referrals - completions,
                'capacity_limited': intended_completions > inputs['confirmatory_capacity'],
                'effective_completion_probability': completion_probability,
            }}


def shift_threshold(late_fraction: float) -> dict:
    if type(late_fraction) not in (int, float) or not math.isfinite(late_fraction) or not 0 <= late_fraction <= 1:
        raise ValueError('Bounded baseline late fraction required')
    threshold = max(0., (2 * late_fraction - 1) / (2 * late_fraction)) if late_fraction else 0.
    return {'baseline_late_fraction': late_fraction,
            'fraction_of_baseline_late_cases_to_shift_for_equality': threshold,
            'strictly_more_than_threshold_required_to_flip': late_fraction >= .5,
            'already_early_majority': late_fraction < .5,
            'meaning': 'Algebra only, holding total incidence fixed. Prevention and patient benefit are separate.'}


def sensitivity_envelope(fixed: dict, ranges: dict) -> dict:
    if not isinstance(ranges, dict) or not 1 <= len(ranges) <= 8 or set(fixed) & set(ranges):
        raise ValueError('Declare 1-8 non-overlapping parameter ranges')
    keys = sorted(ranges)
    for k in keys:
        if k not in REQUIRED or not isinstance(ranges[k], (tuple, list)) or len(ranges[k]) != 2:
            raise ValueError('Unknown parameter or missing endpoint range')
        lo, hi = ranges[k]
        for v in (lo, hi):
            evaluate({**fixed, k: v})
        if lo > hi:
            raise ValueError('Unordered sensitivity endpoints')
    rows = []
    for values in itertools.product(*(ranges[k] for k in keys)):
        r = evaluate({**fixed, **dict(zip(keys, values))})
        if r['projection'] is None:
            raise ValueError('Sensitivity analysis still has unspecified parameters')
        rows.append({'parameters': dict(zip(keys, values)), 'projection': r['projection']})
    # This is explicitly a corner sweep; do not claim extrema over the full box.
    return {'state': 'SYNTHETIC_CORNER_SWEEP', 'ranges': ranges, 'corners': rows,
            'limits': ['Endpoints only; not a probability interval, full-domain extremum proof or independent replication.']}


def rehearsal() -> dict:
    base = dict(population=100000, incident_cases=100, late_fraction=.6,
                prevented_fraction=0., actionable_fraction=.8, reach=.8,
                sensitivity=.8, specificity=.99, follow_through=.4,
                stage_change_given_timely_action=.6, confirmatory_capacity=1000)
    variants = {
        'baseline_pathway': {},
        'instrument_only': {'sensitivity': .95},
        'navigation_only': {'follow_through': .9},
        'synchronized_pathway': {'sensitivity': .95, 'follow_through': .9},
        'synchronized_but_capacity_constrained': {'sensitivity': .95, 'follow_through': .9, 'confirmatory_capacity': 100},
        'synchronized_but_low_specificity': {'sensitivity': .95, 'specificity': .95, 'follow_through': .9},
        'clinic_only_reach': {'reach': .2, 'follow_through': .9},
        'no_effect_of_earlier_action': {'follow_through': .9, 'stage_change_given_timely_action': 0.},
        'uniform_prevention_without_stage_shift': {'prevented_fraction': .2, 'stage_change_given_timely_action': 0.},
    }
    fixed = {k: v for k, v in base.items() if k not in ('actionable_fraction', 'stage_change_given_timely_action')}
    return {'schema': 'dis-early-discovery-rehearsal-v1',
            'status': 'SYNTHETIC_EXPERIMENT_NOT_OBSERVED_EFFECT',
            'scenarios': {name: evaluate({**base, **change}) for name, change in variants.items()},
            'threshold': shift_threshold(.6),
            'unidentified_mechanism_sensitivity': sensitivity_envelope(fixed, {
                'actionable_fraction': [.1, .9], 'stage_change_given_timely_action': [0., .9]}),
            'missing_data_plan': evaluate({'population': 100000}),
            'research_to_implementation_bridge': [
                'Research: validate actionable windows and population-specific instrument performance.',
                'Implementation: measure reach, clinician-approved appropriate action, completed follow-up and capacity.',
                'Evaluation: compare competent existing care under equivalent resources; measure late-stage burden, function, mortality, harms and equity.',
                'Learning: revise assumptions from observed results; preserve null and adverse findings.'
            ]}


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args(); args.out.mkdir(parents=True, exist_ok=True)
    result = rehearsal()
    result['script_sha256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    (args.out / 'early_discovery_counterfactual.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'status': result['status'], 'scenarios': len(result['scenarios'])}))
