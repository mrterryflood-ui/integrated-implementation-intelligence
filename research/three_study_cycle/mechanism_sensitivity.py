#!/usr/bin/env python3
"""Exploratory rival-explanation tests on the existing frozen public-source cycle.
No new retrieval, intervention, clinical inference or independent human review.
Reuses reference_audit's original-source admission and NCI selector validation.
"""
from __future__ import annotations
import argparse, hashlib, io, itertools, json, math, zipfile
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats
from reference_audit import STATES, base_query, parse_nci, retained_source

CONDITIONS = ('ENDO', 'PCOS', 'UF')
CANCERS = ('colorectal', 'lung', 'breast')

def save(p, value):
    Path(p).write_text(json.dumps(value, indent=2, allow_nan=False)+'\n', encoding='utf-8')

def symmetric_split(all_h, late_h, all_t, late_t):
    if not all(math.isfinite(v) and v > 0 for v in (all_h,late_h,all_t,late_t)) or late_h>all_h or late_t>all_t:
        raise ValueError('Require positive compatible all/late rates')
    qh,qt=late_h/all_h,late_t/all_t
    a=(all_h-all_t)*(qh+qt)/2
    b=(qh-qt)*(all_h+all_t)/2
    return {'late_rate_difference':late_h-late_t,'all_stage_rate_component':a,'derived_multiplier_component':b,
            'derived_late_all_rate_ratio_hinds':qh,'derived_late_all_rate_ratio_harris':qt,
            'component_fraction':a/(late_h-late_t) if late_h!=late_t else None,
            'interpretation':'Exact arithmetic on rounded adjusted rates. Not a causal decomposition, mediation estimate, crude stage share, or preventable fraction.'}

def pair_audit(frame):
    required={'rate','share','ci_low','ci_high'}
    if not required<=set(frame) or len(frame)<2 or frame.index.has_duplicates:
        raise ValueError('Unique paired observations and rate intervals required')
    a=frame[list(sorted(required))].to_numpy(float)
    if not np.isfinite(a).all() or not frame['share'].between(0,100).all() or not ((frame.ci_low<=frame.rate)&(frame.rate<=frame.ci_high)).all():
        raise ValueError('Invalid measures or intervals')
    reversed_n=untied=robust=0; separated=separated_reversed=0; examples=[]
    for i,j in itertools.combinations(range(len(frame)),2):
        x,y=frame.iloc[i],frame.iloc[j]
        dx,dy=float(x.rate-y.rate),float(x['share']-y['share'])
        if abs(dx)<1e-12 or abs(dy)<1e-12:continue
        untied+=1;reverse=dx*dy<0
        if reverse:
            reversed_n+=1
            if abs(dx)>0.1000000001 and abs(dy)>0.1000000001:robust+=1
        disjoint=bool(x.ci_low>y.ci_high or y.ci_low>x.ci_high)
        if disjoint and abs(dy)>=5-1e-10:
            separated+=1
            if reverse:
                separated_reversed+=1
                examples.append({'unit_a':str(frame.index[i]),'unit_b':str(frame.index[j]),'rate_difference':dx,'share_difference_pp':dy,'rate_intervals_disjoint':True})
    return {'all_pairs':len(frame)*(len(frame)-1)//2,'untied_pairs':untied,'reversed_pairs':reversed_n,
            'reversal_percent':100*reversed_n/untied if untied else None,
            'reversed_pairs_robust_to_both_one_decimal_rounding_envelopes':robust,
            'disjoint_rate_intervals_and_at_least_5pp_share_gap':{'pairs':separated,'reversed':separated_reversed,'reversal_percent':100*separated_reversed/separated if separated else None},
            'examples':sorted(examples,key=lambda x:abs(x['share_difference_pp']),reverse=True)[:3],
            'limits':['Rounding envelope assumes nearest tenth (each reported value +/-0.05); not sampling uncertainty.',
                      'Disjoint marginal rate intervals are a descriptive screen, not a simultaneous test of all state pairs.',
                      'Case-share uncertainty and between-state spatial dependence are not incorporated. The 5pp threshold is an explicit exploratory sensitivity threshold.']}

def nci_tests(root,receipt):
    frames={};periods=[];audit={}
    for c,code,sex in [('colorectal','020','0'),('lung','047','0'),('breast','055','2')]:
        period,f=parse_nci(root,receipt,c+'_states',base_query(code,sex));periods.append(period)
        if not STATES<=set(f.index):raise ValueError('Missing state')
        frames[c]=f.loc[sorted(STATES)];audit[c]=pair_audit(frames[c])
    counties={}
    for name,state,label in [('hinds','28','Hinds County'),('harris','48','Harris County')]:
        counties[name]={}
        for suffix,stage in [('all','999'),('late','211')]:
            period,f=parse_nci(root,receipt,name+'_'+suffix,base_query(stage=stage,state=state,area='county'));periods.append(period)
            counties[name][suffix]=float(f.loc[label,'rate'])
    if len(set(periods))!=1:raise ValueError('Mixed observation windows')
    ratex,ratey=frames['colorectal'].rate.to_numpy(),frames['lung'].rate.to_numpy()
    sharex,sharey=frames['colorectal']['share'].to_numpy(),frames['lung']['share'].to_numpy()
    loo=[]
    for i,s in enumerate(sorted(STATES)):
        k=np.arange(50)!=i
        rr=float(stats.pearsonr(ratex[k],ratey[k]).statistic);rs=float(stats.pearsonr(sharex[k],sharey[k]).statistic)
        loo.append({'excluded_state':s,'rate_pearson':rr,'share_pearson':rs,'difference':rr-rs})
    k=np.array([s not in {'Mississippi','Texas','Colorado'} for s in sorted(STATES)])
    return {'period':periods[0],'county_arithmetic':symmetric_split(counties['hinds']['all'],counties['hinds']['late'],counties['harris']['all'],counties['harris']['late']),
            'ranking_robustness':audit,'colorectal_lung_leave_one_state_out':{'rate_range':[min(v['rate_pearson'] for v in loo),max(v['rate_pearson'] for v in loo)],'share_range':[min(v['share_pearson'] for v in loo),max(v['share_pearson'] for v in loo)],'paired_difference_range':[min(v['difference'] for v in loo),max(v['difference'] for v in loo)],'rows':loo},
            'exclude_initial_three_states':{'remaining':47,'rate_pearson':float(stats.pearsonr(ratex[k],ratey[k]).statistic),'share_pearson':float(stats.pearsonr(sharex[k],sharey[k]).statistic)},
            'inference':'Finite-state descriptive sensitivity. No random-state superpopulation, causality or validated allocation claim.'}

def design_variance(scores,d):
    v=np.asarray(scores,dtype=float)
    if len(v)!=len(d) or not np.isfinite(v).all() or d[['VEST','VECL']].isna().any().any():raise ValueError('Invalid full-sample influence vector')
    cells=pd.DataFrame({'stratum':d.VEST.to_numpy(),'psu':d.VECL.to_numpy(),'score':v}).groupby(['stratum','psu']).score.sum()
    var=0.;df=0
    for _,g in cells.groupby(level=0):
        m=len(g)
        if m<2:raise ValueError('Singleton variance stratum')
        var+=m/(m-1)*float(((g-g.mean())**2).sum());df+=m-1
    return var,df

def ratio_influence(d,y,domain):
    w=d.WGT2022_2023.to_numpy(float);y=np.asarray(y);domain=np.asarray(domain,dtype=bool)
    if len(y)!=len(d) or len(domain)!=len(d) or not np.isfinite(w).all() or np.any(w<=0):raise ValueError('Invalid ratio inputs')
    valid=domain&np.isin(y,[1,5]);den=w[valid].sum()
    if den<=0:raise ValueError('Empty observed domain')
    p=float(w[valid&(y==1)].sum()/den)
    influence=np.where(valid,w*((y==1).astype(float)-p)/den,0.)
    return p,influence,int(valid.sum()),int((domain&~valid).sum())

def standardized(d,outcome,bands,pooled=False):
    age=d.AGER.to_numpy();race=d.HISPRACE2.to_numpy();y=d[outcome].to_numpy();w=d.WGT2022_2023.to_numpy(float)
    domain=(age>=20)&(age<=bands[-1][1]);masks=[domain&(age>=lo)&(age<=hi) for lo,hi in bands]
    if np.any(sum(m.astype(int) for m in masks)!=domain.astype(int)):raise ValueError('Age strata do not partition the analytic domain')
    total=w[domain].sum()
    weights=np.array([w[m].sum()/total for m in masks]) if pooled else np.full(len(bands),1/len(bands))
    if abs(weights.sum()-1)>1e-12:raise ValueError('Age weights must sum to one')
    wp_influence=[np.where(domain,w*(m.astype(float)-weights[i])/total,0.) for i,m in enumerate(masks)] if pooled else [np.zeros(len(d)) for _ in bands]
    groups={};arrays={};bounds={}
    for code,label in [(2,'non_Hispanic_White'),(3,'non_Hispanic_Black')]:
        ps=[];lins=[];lo=hi=0.;counts=[]
        crude,_,_,_=ratio_influence(d,y,domain&(race==code))
        for i,mask in enumerate(masks):
            g=mask&(race==code);p,lin,n,missing=ratio_influence(d,y,g);ps.append(p);lins.append(lin)
            denominator=w[g].sum();yes=w[g&(y==1)].sum();miss=w[g&~np.isin(y,[1,5])].sum()
            lo+=weights[i]*yes/denominator;hi+=weights[i]*(yes+miss)/denominator
            counts.append({'band':list(bands[i]),'valid_n':n,'item_missing_n':missing})
        rate=float(weights@np.array(ps));influence=sum(weights[i]*lins[i]+ps[i]*wp_influence[i] for i in range(len(bands)))
        arrays[label]=(rate,influence);bounds[label]={'lower_percent':100*lo,'upper_percent':100*hi}
        groups[label]={'crude_percent':100*crude,'standardized_percent':100*rate,'age_cell_counts':counts}
    bp,bi=arrays['non_Hispanic_Black'];wp,wi=arrays['non_Hispanic_White'];diff=bp-wp
    v,df=design_variance(bi-wi,d);se=math.sqrt(v);tcrit=float(stats.t.ppf(.975,df))
    p=float(2*stats.t.sf(abs(diff/se),df)) if se>0 else (1. if diff==0 else 0.)
    b,w= bounds['non_Hispanic_Black'],bounds['non_Hispanic_White']
    return {'age_bands':[list(b) for b in bands],'standard_weights':weights.tolist(),'weights_estimated_from_sample':pooled,'estimated_weight_uncertainty_included':pooled,
            'groups':groups,'contrast':{'black_minus_white_pp':100*diff,'taylor_se_pp':100*se,'unadjusted_95_ci_pp':[100*(diff-tcrit*se),100*(diff+tcrit*se)],'p_two_sided':p,'design_df':df},
            'item_nonresponse_bounds':{'groups':bounds,'contrast_lower_pp':b['lower_percent']-w['upper_percent'],'contrast_upper_pp':b['upper_percent']-w['lower_percent'],'interpretation':'Adversarial coding of missing diagnosis items within observed respondents. Descriptive identification bounds, not confidence intervals; excludes misdiagnosis, nonparticipation and noncoverage.'}}

def holm(values):
    if not values or any(not math.isfinite(v) or not 0<=v<=1 for v in values):raise ValueError('Invalid p-values')
    adj=[0.]*len(values);last=0.
    for r,i in enumerate(np.argsort(values)):
        last=max(last,(len(values)-r)*values[i]);adj[int(i)]=min(1.,last)
    return adj

def survey_tests(root,receipt):
    raw=retained_source(root,receipt,'nsfg_female')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        members=[m for m in z.infolist() if m.filename.lower().endswith('.csv')]
        if len(members)!=1 or members[0].file_size>200*1024*1024:raise ValueError('Unexpected microdata archive')
        d=pd.read_csv(io.BytesIO(z.read(members[0])),usecols=['AGER','HISPRACE2','ENDO','PCOS','UF','WGT2022_2023','VEST','VECL'])
    if len(d)!=5586 or not d.AGER.between(15,50).all():raise ValueError('Survey scope drift')
    designs={'primary_equal_three':([(20,29),(30,39),(40,50)],False),'equal_six':([(20,24),(25,29),(30,34),(35,39),(40,44),(45,50)],False),'pooled_three':([(20,29),(30,39),(40,50)],True),'strict20_49_equal_three':([(20,29),(30,39),(40,49)],False)}
    runs={}
    for name,(bands,pooled) in designs.items():
        rows={c:standardized(d,c,bands,pooled) for c in CONDITIONS}
        ps=holm([rows[c]['contrast']['p_two_sided'] for c in CONDITIONS])
        for c,p in zip(CONDITIONS,ps):rows[c]['contrast']['holm_p_within_three_conditions']=p
        runs[name]=rows
    return {'source_rows':len(d),'eligible_20_to_screening49_n':int(d.AGER.between(20,50).sum()),'comparison':'Non-Hispanic Black versus non-Hispanic White, provider-defined HISPRACE2 codes 3 and 2','standardizations':runs,
            'limits':['Exploratory follow-up selected after prior descriptive results; not preregistered confirmation.','Fixed equal age weights are diagnostic comparisons, not estimates for the actual U.S. age population.','Pooled-age weights are estimated from all eligible female respondents; their Taylor influence is included.','Age bands retain residual age, cohort and history differences; no causal race or biology interpretation.','Intervals are unadjusted Taylor/t contrast intervals, not the report CI method. Holm adjustment controls the three primary condition contrasts; sensitivity runs are not independent confirmations.','Ever-reported diagnosis and present-day insurance/income lack time-aligned exposure histories.','Item bounds do not address people who never participated or diagnoses incorrectly recognized/reported.']}

def execute(root,out):
    root=Path(root);out=Path(out)
    if out.resolve()==root.resolve() or out.resolve().is_relative_to((root/'originals').resolve()):raise ValueError('Do not overwrite original evidence')
    receipt=json.loads((root/'acquisition_receipt.json').read_text());out.mkdir(parents=True,exist_ok=True)
    result={'schema':'dis-mechanism-sensitivity-v1','status':'EXPLORATORY_RIVAL_EXPLANATION_TESTS_NOT_CAUSAL','source_run_id':receipt.get('run_id'),'source_revision':receipt.get('revision'),'source_receipt_sha256':hashlib.sha256((root/'acquisition_receipt.json').read_bytes()).hexdigest(),'script_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'nci':nci_tests(root,receipt),'survey':survey_tests(root,receipt),'independent_human_review':'NOT_RECORDED','causal_mechanism_established':False,'implementation_outcome_measured':False}
    save(out/'mechanism_sensitivity.json',result)
    primary=result['survey']['standardizations']['primary_equal_three']
    verdicts={
        'schema':'dis-rival-explanation-register-v1','source_run_id':receipt.get('run_id'),
        'analysis_sha256':hashlib.sha256((out/'mechanism_sensitivity.json').read_bytes()).hexdigest(),
        'review_state':'COMPUTED_NOT_INDEPENDENTLY_ADJUDICATED','external_release_authorized':False,
        'entries':[
            {'id':'ROUNDING_ONLY','question':'Are all state-order reversals due only to one-decimal rounding?',
             'result':{c:result['nci']['ranking_robustness'][c]['reversed_pairs_robust_to_both_one_decimal_rounding_envelopes'] for c in CANCERS},
             'interpretation':'Rounding alone cannot remove these particular reversed pairs under the tested +/-0.05 envelope. Sampling uncertainty remains.',
             'next_evidence':'Provider uncertainty for stage shares and a joint state-estimate covariance model.'},
            {'id':'SINGLE_STATE_ONLY','question':'Does removing any one state erase the colorectal-lung correlation contrast?',
             'result':result['nci']['colorectal_lung_leave_one_state_out']['paired_difference_range'],
             'interpretation':'Observed leave-one-state-out ranges, not identification of a common mechanism.',
             'next_evidence':'Matched sex-specific and age-specific panels, spatial structure and prespecified alternative covariates.'},
            {'id':'COARSE_AGE_ONLY','question':'Do common age weights remove the diagnosis contrasts?',
             'result':{c:primary[c]['contrast'] for c in CONDITIONS},
             'interpretation':'These age-standardized descriptive contrasts remain; residual within-band age, historical care, recall and selection are not resolved.',
             'next_evidence':'Time-aligned symptom/recognition/care histories and condition-specific clinical ascertainment.'},
            {'id':'ITEM_MISSINGNESS_ONLY','question':'Can assigning every missing diagnosis item adversarially reverse the contrasts?',
             'result':{c:{k:v for k,v in primary[c]['item_nonresponse_bounds'].items() if k!='groups'} for c in CONDITIONS},
             'interpretation':'Bounds apply only to missing items among sampled respondents; no inference about nonparticipants or misclassification.',
             'next_evidence':'Survey nonparticipation, measurement-error and record-validation evidence.'}
        ]}
    save(out/'mechanism_journal.json',verdicts)
    return result

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args()
    try:
        r=execute(args.input,args.out);print(json.dumps({'status':r['status'],'source_run_id':r['source_run_id'],'out':str(args.out)}))
    except Exception as e:
        args.out.mkdir(parents=True,exist_ok=True);save(args.out/'mechanism_failure.json',{'status':'NOT_COMPLETED','error':type(e).__name__+': '+str(e),'causal_mechanism_established':False});raise
