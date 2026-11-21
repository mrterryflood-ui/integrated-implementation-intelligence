"""Bounded public-data reanalysis, not linked patient inference or clinical authorization.
Uses only Python standard library. No network, records, proprietary data or reserved cases.
"""
from pathlib import Path
from decimal import Decimal as D
import csv,json,hashlib,argparse
ROOT=Path(__file__).resolve().parent
EXPECTED={'hrsa_state_2023_2024.csv': '49dbb14fe850f087b9190d64b6e05b20d9c726d01756d21da42f9f8b94130838', 'primary_study_contrasts.json': 'fe30d67f163d3c1c6d3dda333539fb7766dc30f36a86e470d8e34e080b681fcd', 'va_rci_within_va_table2.csv': '6b128d44437b6a5dfd02d5fb3dba1344033224ad59335cf39481965418bb2397'} # Curated transcription identity only, not independent source acceptance.
COUNTS='total_patients income_known low_income_le200 uninsured medicaid_chip_primary medicare_primary dual_medicare_medicaid other_insurance'.split()
RATES='low_income_known_pct uninsured_pct medicaid_primary_pct crc_screen_pct bp_control_pct diabetes_poor_or_missing_pct'.split()
STATE_SET={'TX','MS','CO','NC','NY','CA'}

def require(condition,message):
    if not condition:raise ValueError(message)

def checked_bytes(name):
    raw=(ROOT/'health_wealth_sources'/name).read_bytes()
    require(hashlib.sha256(raw).hexdigest()==EXPECTED[name],f'transcription digest mismatch: {name}')
    return raw

def load_states():
    return list(csv.DictReader(checked_bytes('hrsa_state_2023_2024.csv').decode().splitlines()))

def validate_row(row):
    require(row['state'] in STATE_SET,'unregistered geography')
    require(row['year'] in ('2023','2024') and row['observed_year_column']==row['year'],'wrong year column')
    require(row['source_unit']=='state_aggregate_H80_awardee_reporting','wrong reporting unit')
    counts={key:int(row[key]) for key in COUNTS}
    require(all(v>=0 for v in counts.values()),'negative count')
    n=counts['total_patients']; known=counts['income_known']; low=counts['low_income_le200']
    require(0<low<=known<=n,'invalid income denominator')
    require(sum(counts[k] for k in ('uninsured','medicaid_chip_primary','medicare_primary','other_insurance'))==n,'primary coverage not partition')
    require(counts['dual_medicare_medicaid']<=counts['medicare_primary'],'dual is not independent primary category')
    rates={k:D(row[k]) for k in RATES}
    require(all(v.is_finite() and 0<=v<=100 for v in rates.values()),'invalid rate')
    for name,num,den in [('low_income_known_pct',low,known),('uninsured_pct',counts['uninsured'],n),('medicaid_primary_pct',counts['medicaid_chip_primary'],n)]:
        require(abs(D(num)*100/D(den)-rates[name])<=D('0.0051'),'reported percentage/count discrepancy: '+name)
    return counts,rates

def profile(row):
    c,p=validate_row(row);n=c['total_patients'];unknown=n-c['income_known']
    ratio=lambda a,b:float(D(a)*100/D(b))
    return dict(state=row['state'],year=int(row['year']),total_reported_patients=n,
      low_income_known_pct=float(p['low_income_known_pct']),income_unknown_count=unknown,
      income_unknown_pct=ratio(unknown,n),low_income_all_reported_lower_pct=ratio(c['low_income_le200'],n),
      low_income_all_reported_upper_pct=ratio(c['low_income_le200']+unknown,n),
      uninsured_pct=float(p['uninsured_pct']),medicaid_primary_pct=float(p['medicaid_primary_pct']),
      reported_medicaid_chip_or_dual_pct=ratio(c['medicaid_chip_primary']+c['dual_medicare_medicaid'],n),
      crc_screen_pct=float(p['crc_screen_pct']),bp_control_pct=float(p['bp_control_pct']),
      diabetes_poor_or_missing_pct=float(p['diabetes_poor_or_missing_pct']),
      evidence_status='UNADJUSTED_STATE_AGGREGATE_NOT_PATIENT_CAUSAL',source=row['source_url'])

def compare(a,b,measure,requested_level='descriptive'):
    validate_row(a);validate_row(b)
    require(a['year']==b['year'],'different years require version harmonization')
    require(measure in RATES,'unknown measure')
    require(requested_level=='descriptive','aggregate cannot establish patient or institutional causal effect')
    return {'measure':measure,'difference_pp':float(D(a[measure])-D(b[measure])),
            'status':'DESCRIPTIVE_ONLY','case_mix_adjusted':False,'clinical_benefit_established':False}

def forbid_wrong_stage(measured,claimed):
    require(measured==claimed,'outcome-stage substitution')

def run(out=None):
    out=Path(out) if out else ROOT/'analysis';out.mkdir(parents=True,exist_ok=True)
    rows=load_states(); require(len(rows)==12,'unexpected panel size')
    require(len({(r['state'],r['year']) for r in rows})==12,'duplicate state-year')
    for r in rows:validate_row(r)
    current=[r for r in rows if r['year']=='2024'];require({r['state'] for r in current}==STATE_SET,'incomplete selected frame')
    profiles=[profile(r) for r in current];by={r['state']:r for r in current}
    state_out={'analysis':'descriptive_2024_selected_state_aggregates','selection':'purposeful_6_state_frame_not_national_representative',
      'not_unique_patients_across_reporting_entities':True,'profiles':profiles,
      'contrasts':{'NC_minus_TX_CRC':compare(by['NC'],by['TX'],'crc_screen_pct'),
                   'NC_minus_MS_CRC':compare(by['NC'],by['MS'],'crc_screen_pct'),
                   'NC_minus_CA_CRC':compare(by['NC'],by['CA'],'crc_screen_pct'),
                   'NC_minus_CA_Medicaid':compare(by['NC'],by['CA'],'medicaid_primary_pct')},
      'ranges_pp':{k:float(max(D(r[k]) for r in current)-min(D(r[k]) for r in current)) for k in RATES},
      'patient_level_adjustment':False,'facility_ranking_established':False,'DiD_estimated':False,
      'year_change_policy':'2023 retained as source context, not estimated as causal panel; measure-version harmonization remains required',
      'unmeasured':['patient-level payer-outcome linkage','within-organization variation','risk adjustment','referral capacity','financial toxicity','local patient benefit']}
    contrasts=list(csv.DictReader(checked_bytes('va_rci_within_va_table2.csv').decode().splitlines()))
    for row in contrasts:
        lo,eff,hi=map(D,[row['ci95_low'],row['estimate_days'],row['ci95_high']])
        require(lo<=eff<=hi,'invalid interval')
        require(row['endpoint']=='request_to_completed_or_canceled','wrong wait clock')
    rci={'extraction':'published_Table2_not_reestimated_models','contrasts':len(contrasts),
         'intervals_including_zero':sum(D(r['ci95_low'])<=0<=D(r['ci95_high']) for r in contrasts),
         'null_equivalence_proven':False,'independent_trials':False,'clock_includes_canceled':True}
    studies=json.loads(checked_bytes('primary_study_contrasts.json'))
    e=studies['NYC_ECONSULT_2021'];v=studies['VA_DUAL_ELIGIBLE_2023'];f=studies['FQHC_LOOKALIKE_2023']
    outcomes={'NYC':{'scheduled_raw_change_pp':float(D(str(e['scheduled_after_pct']))-D(str(e['scheduled_before_pct']))),
       'completed_raw_change_pp':float(D(str(e['completed_90d_after_pct']))-D(str(e['completed_90d_before_pct']))),
       'resolved_without_visit_pct':e['post_resolved_without_visit']/e['post_requests']*100,
       'adjusted_completion_pp':e['completed_90d_adjusted_difference_pp'],
       'wait_source_disagreement_preserved':e['source_discrepancy']},
       'VA':{'spending_iv_percent_of_mean':v['spending_28d_iv_dollars']/v['spending_28d_mean_dollars']*100,
       'spending_ols_percent_of_mean':v['spending_28d_ols_dollars']/v['spending_28d_mean_dollars']*100,
       'direction_reversal':v['spending_28d_iv_dollars']<0<v['spending_28d_ols_dollars'],
       'same_estimand':False,'new_causal_estimate':False},
       'FQHC':{'initiation_medicaid_minus_private_pp':7.4-5.6,'initiation_medicaid_minus_selfpay_pp':7.4-3.8,
       'conditional_completion_range_pp':max(f['payer_conditional_completion_pct'].values())-min(f['payer_conditional_completion_pct'].values()),
       'equivalence_established':False,'wealth_measured':False},'RCI':rci}
    for name,data in [('state_results.json',state_out),('published_outcome_recalculation.json',outcomes)]:
        (out/name).write_text(json.dumps(data,indent=2,allow_nan=False)+'\n')
    with (out/'2024_state_results.csv').open('w',newline='') as h:
        w=csv.DictWriter(h,fieldnames=list(profiles[0]));w.writeheader();w.writerows(profiles)
    print(json.dumps({'profiles':profiles,'ranges':state_out['ranges_pp'],'published':outcomes},indent=2))
    return state_out,outcomes

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out');a=p.parse_args();run(a.out)
