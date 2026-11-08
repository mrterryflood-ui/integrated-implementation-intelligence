#!/usr/bin/env python3
"""Reproduce Chen et al's published RAP-to-age transformation, not their Cox fit.
This is a published-parameter arithmetic benchmark, never a screening prescription.
No clinical risk factors from separate models are added together.
"""
import argparse
import hashlib
import json
from pathlib import Path
from decimal import Decimal

SOURCE = 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2810996'
DOI = '10.1001/jamanetworkopen.2023.39670'
# Tables 2/3 (RAP) and 4 (reported illustrative starting ages); inspected 2026-11-07.
INPUTS = {
    'incidence': {'sex_rap': '5.6', 'decile_rap': ['-8.4','-3.2','-3.2','0.2','0','2.8','4.4','6.0','10.3'],
                  'published_women': [66,61,61,58,58,55,54,52,48], 'published_men': [60,55,55,52,52,49,48,46,42]},
    'mortality': {'sex_rap': '4.8', 'decile_rap': ['-9.3','-4.2','-2.8','-2.5','0','0.7','3.3','4.8','7.9'],
                  'published_women': [67,62,61,61,58,57,55,53,50], 'published_men': [62,57,56,56,53,52,50,48,45]}}
DECILES = ['1','2','3','4','5_and_6','7','8','9','10']


def benchmark():
    rows=[]
    # +/-0.5 for integer published age + +/-0.05 RAP + half of +/-0.05 sex RAP.
    tolerance=Decimal('.575')
    for outcome, data in INPUTS.items():
        sex=Decimal(data['sex_rap'])
        for i,rap in enumerate(data['decile_rap']):
            for group, sign in [('women',1),('men',-1)]:
                age=Decimal(55)+sign*Decimal('.5')*sex-Decimal(rap)
                reported=data['published_'+group][i]
                delta=abs(age-Decimal(reported))
                rows.append({'outcome':outcome,'model_sex_group':group,'prs_decile':DECILES[i],
                             'calculated_age':float(age),'published_integer_age':reported,
                             'absolute_difference_years':float(delta),'within_rounding_envelope':delta<=tolerance})
    return {'schema':'dis-rap-published-transformation-v1','source':SOURCE,'doi':DOI,
            'input_provenance':'Manually transcribed published Tables 2-4, checked against publisher text; not a participant-data extract.',
            'input_sha256':hashlib.sha256(json.dumps(INPUTS,sort_keys=True).encode()).hexdigest(),
            'benchmark_type':'PUBLISHED_PARAMETER_TRANSFORMATION_ONLY',
            'status':'PASS_PUBLISHED_TRANSFORMATION' if all(r['within_rounding_envelope'] for r in rows) else 'PUBLISHED_TRANSFORMATION_DISCREPANCY',
            'matching_cells':sum(r['within_rounding_envelope'] for r in rows),
            'discrepant_cells':sum(not r['within_rounding_envelope'] for r in rows),
            'tolerance_years':float(tolerance),'rows':rows,
            'cohort_model_refit':False,'absolute_risk_calibration':False,'new_starting_age_recommended':False,
            'limits':['Published inputs and formula do not reproduce every published integer age under the declared rounding envelope. This is an unresolved reproduction discrepancy, not an adjudicated error in the paper. Check author code, full-precision coefficients and any erratum before promoting the benchmark.',
                      'The source used an illustrative reference age of 55; it is not imposed on any DIS user or symptomatic pathway.',
                      'Same fitted model terms are combined exactly as specified by the authors. Independent RAPs cannot simply be summed.',
                      'The source analyzed White British UK Biobank participants recruited at ages 40-69. Ancestry, selection, younger-age and geographic transportability remain unvalidated.',
                      'Underlying cohort fitting, individual prediction, net benefit, capacity and mortality improvement are not reproduced or established.']}


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    result=benchmark();(args.out/'rap_benchmark.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'status':result['status'],'comparisons':len(result['rows'])}))
