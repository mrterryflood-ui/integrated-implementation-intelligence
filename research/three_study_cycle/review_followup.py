#!/usr/bin/env python3
"""Review-driven descriptive follow-up on retained public-source bytes.
Each study can progress independently; unavailable inputs remain explicit.
Conditional IID intervals/permutations and regional deletion are sensitivities,
not spatially valid confirmation, biological prevalence or causal identification.
"""
from __future__ import annotations
import argparse
import hashlib
import io
import itertools
import json
import math
from pathlib import Path
import zipfile
import numpy as np
import pandas as pd
from scipy import stats
from mechanism_sensitivity import ratio_influence, design_variance, holm
from reference_audit import STATES, base_query, parse_nci, retained_source

# Official Census grouping corroborated against BLS LAU FAQ on 2026-11-07.
REGIONS = {
    'Northeast': 'Connecticut|Maine|Massachusetts|New Hampshire|Rhode Island|Vermont|New Jersey|New York|Pennsylvania'.split('|'),
    'South': 'Delaware|Florida|Georgia|Maryland|North Carolina|South Carolina|Virginia|West Virginia|Alabama|Kentucky|Mississippi|Tennessee|Arkansas|Louisiana|Oklahoma|Texas'.split('|'),
    'Midwest': 'Illinois|Indiana|Michigan|Ohio|Wisconsin|Iowa|Kansas|Minnesota|Missouri|Nebraska|North Dakota|South Dakota'.split('|'),
    'West': 'Arizona|Colorado|Idaho|Montana|Nevada|New Mexico|Utah|Wyoming|Alaska|California|Hawaii|Oregon|Washington'.split('|'),
}
GROUPS = {1: 'Hispanic', 2: 'non_Hispanic_White', 3: 'non_Hispanic_Black', 4: 'non_Hispanic_other_or_multiple'}


def correlation_sensitivity(x, y, permutations=20000, seed=20261107):
    x, y = np.asarray(x, float), np.asarray(y, float)
    if x.ndim != 1 or y.shape != x.shape or len(x) < 5 or not np.isfinite(x).all() or not np.isfinite(y).all():
        raise ValueError('Finite aligned vectors with at least five units required')
    if type(permutations) is not int or not 100 <= permutations <= 100000:
        raise ValueError('Bound permutation count')
    x, y = x - x.mean(), y - y.mean()
    den = np.linalg.norm(x) * np.linalg.norm(y)
    if not math.isfinite(den) or den <= 0:
        raise ValueError('Finite nonzero variances required')
    r = float(np.clip(x @ y / den, -1, 1))
    if abs(r) == 1:
        interval = [r, r]
    else:
        z = np.arctanh(r); width = stats.norm.ppf(.975) / math.sqrt(len(x) - 3)
        interval = [float(np.tanh(z-width)), float(np.tanh(z+width))]
    rng = np.random.default_rng(seed)
    extreme = sum(abs(float(x @ rng.permutation(y) / den)) >= abs(r)-1e-14 for _ in range(permutations))
    p = (extreme + 1) / (permutations + 1)
    return {'pearson': r, 'conditional_iid_fisher_95': interval,
            'conditional_exchangeable_permutation_p': p, 'permutations': permutations,
            'monte_carlo_se_approx': math.sqrt(p*(1-p)/(permutations+1)), 'seed': seed,
            'interpretation': 'Finite-state descriptive coefficient. Interval assumes IID random-unit model; permutation assumes exchangeability. Neither accounts for registry-estimate uncertainty or spatial dependence. An interval including zero does not establish equivalence or no association.'}


def national(root, receipt):
    order = sorted(STATES); frames = {}; periods = []
    for c, code, sex in [('colorectal','020','0'),('lung','047','0'),('breast','055','2')]:
        period, frame = parse_nci(root, receipt, c+'_states', base_query(code, sex))
        if not STATES <= set(frame.index): raise ValueError('Incomplete state frame')
        frames[c] = frame.loc[order]; periods.append(period)
    if len(set(periods)) != 1: raise ValueError('Unmatched cancer periods')
    rows = []
    for measure in ('rate','share'):
        for a,b in itertools.combinations(frames,2):
            x, y = frames[a][measure].to_numpy(float), frames[b][measure].to_numpy(float)
            r = correlation_sensitivity(x,y)
            r['regional_deletion'] = {}
            for region, names in REGIONS.items():
                keep = np.array([state not in names for state in order])
                r['regional_deletion'][region] = {'remaining_states':int(keep.sum()), 'pearson':float(stats.pearsonr(x[keep],y[keep]).statistic)}
            rows.append({'measure':measure,'pair':[a,b],**r})
    return {'status':'EXPLORATORY_SENSITIVITIES', 'period':periods[0], 'rows':rows,
            'region_definition_source':'https://www.bls.gov/lau/laurdqa.htm',
            'spatial_limit':'Deleting one Census region tests regional influence only. It does not estimate spatial covariance, prove independence, or validate a spatial p-value.'}


def all_group_contrasts(d, outcome):
    age = d.AGER.to_numpy(); race = d.HISPRACE2.to_numpy(); y = d[outcome].to_numpy()
    if not set(np.unique(race)) <= set(GROUPS): raise ValueError('Unexpected public race recode')
    domain = (age >= 20) & (age <= 50)
    bands = [(20,29),(30,39),(40,50)]
    masks = [domain & (age>=lo) & (age<=hi) for lo,hi in bands]
    overall, overall_lin, n, missing = ratio_influence(d,y,domain)
    def standard(mask):
        estimates = [ratio_influence(d,y,m & mask) for m in masks]
        return sum(v[0] for v in estimates)/3, sum(v[1] for v in estimates)/3
    overall_std, overall_std_lin = standard(domain)
    rows = []
    for code,label in GROUPS.items():
        group = domain & (race==code)
        try:
            crude, crude_lin, valid_n, missing_n = ratio_influence(d,y,group)
            standardized, std_lin = standard(group)
            variance, df = design_variance(std_lin-overall_std_lin,d)
            se = math.sqrt(variance); diff = standardized-overall_std
            critical = float(stats.t.ppf(.975,df))
            rows.append({'code':code,'label':label,'state':'COMPUTED_EXPLORATORY',
                         'crude_percent':100*crude,'valid_n':valid_n,'item_missing_n':missing_n,
                         'equal_band_standardized_percent':100*standardized,
                         'group_minus_overall_pp':100*diff,'taylor_se_pp':100*se,
                         'unadjusted_95_ci_pp':[100*(diff-critical*se),100*(diff+critical*se)],
                         'p_two_sided_unadjusted':float(2*stats.t.sf(abs(diff/se),df)) if se else (1. if diff==0 else 0.),
                         'design_df':df})
        except ValueError as e:
            rows.append({'code':code,'label':label,'state':'NOT_ESTIMABLE','reason':str(e)})
    return {'overall_crude_percent':100*overall,'overall_valid_n':n,'overall_item_missing_n':missing,
            'overall_equal_band_standardized_percent':100*overall_std,
            'age_bands':bands,'standard_weights':[1/3]*3,'rows':rows,
            'age_standard_status':'Equal-band sensitivity; not a US population standard and not a replacement for crude NCHS replication.',
            'public_detail_limit':'Code 4 is other or multiple races. No Asian-specific microdata estimate is identifiable here.',
            'variance_limit':'Full-sample Taylor influence contrast includes covariance with the overlapping overall group. Reliability/precision review is still required.'}


def survey(root, receipt):
    raw=retained_source(root,receipt,'nsfg_female')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        members=[m for m in z.infolist() if m.filename.lower().endswith('.csv')]
        if len(members)!=1 or members[0].file_size>200*1024*1024: raise ValueError('Unexpected archive')
        d=pd.read_csv(io.BytesIO(z.read(members[0])),usecols=['AGER','HISPRACE2','ENDO','PCOS','UF','WGT2022_2023','VEST','VECL'])
    rows={c:all_group_contrasts(d,c) for c in ('ENDO','PCOS','UF')}
    family=[v for r in rows.values() for v in r['rows'] if v['state']=='COMPUTED_EXPLORATORY']
    for row,p in zip(family,holm([v['p_two_sided_unadjusted'] for v in family])):
        row['holm_p_across_available_group_condition_contrasts']=p
    return {'status':'REPORTED_DIAGNOSIS_EXPLORATORY', 'original_archive_sha256':hashlib.sha256(raw).hexdigest(),
            'hash_meaning':'Original public archive bytes, not respondent-level output',
            'literal20_49_n':int(d.AGER.between(20,49).sum()),
            'screener_eligible20_49_at_interview_up_to50_n':int(d.AGER.between(20,50).sum()),
            'age50_aggregate_n':int(d.AGER.eq(50).sum()),'conditions':rows,
            'biological_prevalence_or_recognition_mechanism_established':False}


def execute(root, out):
    root, out = Path(root), Path(out)
    if out.resolve()==root.resolve() or out.resolve().is_relative_to((root/'originals').resolve()): raise ValueError('Preserve original evidence')
    receipt = json.loads((root/'acquisition_receipt.json').read_text())
    result={'schema':'dis-review-followup-v1','source_revision':receipt.get('revision'),
            'source_receipt_sha256':hashlib.sha256((root/'acquisition_receipt.json').read_bytes()).hexdigest(),
            'analysis_script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'causal_or_clinical_validation':False,'studies':{}}
    for name,fn in [('national',national),('survey',survey)]:
        try: result['studies'][name]=fn(root,receipt)
        except (ValueError,OSError,KeyError,zipfile.BadZipFile) as e:
            result['studies'][name]={'status':'INPUT_OR_METHOD_REVIEW_NEEDED','reason':str(e),
                                    'next_work':'Retain other results; synthesize rivals, test synthetic cases and acquire the missing source. No fabricated numerical substitute.'}
    out.mkdir(parents=True,exist_ok=True)
    (out/'review_followup.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    return result


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args()
    r=execute(args.input,args.out);print(json.dumps({k:v['status'] for k,v in r['studies'].items()}))
