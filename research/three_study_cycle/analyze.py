#!/usr/bin/env python3
"""Replayable public-source analysis; no model calls, clinical action or publication.
All results are descriptive and externally unadjudicated. Acquisition manifests
are verified before calculation. Unknown release/scope fails rather than blends.
"""
from __future__ import annotations
import argparse,hashlib,io,itertools,json,math,re,zipfile
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats
from lxml import html
CANCERS=('colorectal','lung','breast')
EXCLUDE={'District of Columbia','Puerto Rico','United States'}
REQUIRED={c+'_states' for c in CANCERS}|{'hinds_all','hinds_late','harris_all','harris_late','nsfg_female'}

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def save(p,x):Path(p).write_text(json.dumps(x,indent=2,allow_nan=False)+'\n')
def clean_name(x):
    n=re.sub(r'\s+\d+$','',str(x)).strip()
    return 'United States' if n=='US (SEER+NPCR)' else n

def rate_interval(x):
    m=re.fullmatch(r'\s*([\d.]+)\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)\s*',str(x))
    if not m:raise ValueError('Unparseable rate or uncertainty: '+str(x))
    r,lo,hi=map(float,m.groups())
    if not 0<=lo<=r<=hi:raise ValueError('Inconsistent rate and interval')
    return r,lo,hi

def verify_inputs(root):
    manifest=json.loads((root/'MANIFEST_SHA256.json').read_text())
    for name,h in manifest.items():
        p=root/name
        if not p.resolve().is_relative_to(root.resolve()) or sha(p)!=h:raise ValueError('Original artifact integrity mismatch: '+name)
    receipt=json.loads((root/'acquisition_receipt.json').read_text());ids=[x['id'] for x in receipt['sources']]
    if len(ids)!=len(set(ids)):raise ValueError('Ambiguous source IDs')
    sources={x['id']:x for x in receipt['sources']}
    if not REQUIRED.issubset(sources):raise ValueError('Required analytic source missing')
    semantics={}
    for name in REQUIRED:
        s=sources[name]
        if s['status']!='ORIGINAL_BYTES_RETAINED':raise ValueError('Required source failed: '+name)
        if sha(root/s['path'])!=s['sha256']:raise ValueError('Source receipt/hash disagreement: '+name)
        if name=='nsfg_female':continue
        text=(root/s['path']).read_text();tree=html.fromstring(text)
        heading=' '.join(' '.join(tree.xpath('//h2//text()')).split())
        if '2019-2023' not in heading or s.get('reported_period_candidates')!=['2019-2023']:raise ValueError('Source release changed; adjudication required: '+name)
        cancer='047' if name.startswith('lung') else '055' if name.startswith('breast') else '020'
        expected={'cancer':cancer,'sex':'2' if cancer=='055' else '0','stage':'999' if name.endswith('_all') else '211','age':'001','race':'00','year':'0','statefips':'28' if name.startswith('hinds') else '48' if name.startswith('harris') else '00','areatype':'county' if name.startswith(('hinds','harris')) else 'state'}
        actual={}
        for k,v in expected.items():
            selected=tree.xpath('//select[translate(@name,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")="'+k+'"]/option[@selected]/@value')
            if selected!=[v]:raise ValueError('Source-selected scope differs: '+name+' '+k+' '+str(selected))
            actual[k]=v
        semantics[name]={'heading':heading,'selected_scope':actual}
    return receipt,sources,semantics

def nci_frame(root):
    allrows=None
    for cancer in CANCERS:
        t=pd.read_csv(root/f'extracted/{cancer}_states_table_0.csv');r=t.iloc[:,1].map(rate_interval)
        frame=pd.DataFrame({'geography':t.iloc[:,0].map(clean_name),cancer+'_rate':r.map(lambda x:x[0]),cancer+'_rate_lo':r.map(lambda x:x[1]),cancer+'_rate_hi':r.map(lambda x:x[2]),cancer+'_share':pd.to_numeric(t['Percent of Cases with Late Stage']),cancer+'_count':pd.to_numeric(t['Average Annual Count'])})
        if len(frame)!=53 or frame.geography.nunique()!=53:raise ValueError('Unexpected source geography frame')
        if not frame[cancer+'_share'].between(0,100).all():raise ValueError('Invalid case percentage')
        allrows=frame if allrows is None else allrows.merge(frame,on='geography',validate='one_to_one')
    return allrows

def rank_sensitivity(x,y):
    if len(x)!=len(y) or len(x)<2 or not np.isfinite(x).all() or not np.isfinite(y).all():raise ValueError('Invalid paired measures')
    concordant=discordant=ties=0
    for i,j in itertools.combinations(range(len(x)),2):
        a=np.sign(x[i]-x[j]);b=np.sign(y[i]-y[j])
        if not a or not b:ties+=1
        elif a==b:concordant+=1
        else:discordant+=1
    n=concordant+discordant
    return {'concordant':concordant,'discordant':discordant,'ties_on_either_metric':ties,'total_pairs':len(x)*(len(x)-1)//2,'discordant_percent_of_untied_pairs':100*discordant/n if n else None}

def national(d):
    s=d[~d.geography.isin(EXCLUDE)].reset_index(drop=True)
    if len(s)!=50:raise ValueError('Require 50 states, excluding US/DC/Puerto Rico')
    out={'period':'2019-2023','n_states':50,'within_cancer':{},'cross_cancer':{},'ranking_sensitivity':{},'limit':'Exploratory finite-state descriptions; no sampling-error or spatial adjustment, causal effect, validated ranking or optimal allocation claim.'}
    for c in CANCERS:
        x,y=s[c+'_rate'],s[c+'_share']
        out['within_cancer'][c]={'pearson':float(stats.pearsonr(x,y).statistic),'spearman':float(stats.spearmanr(x,y).statistic)}
        tops={}
        for met in ('rate','share'):
            cutoff=float(s[c+'_'+met].nlargest(10).iloc[-1]);members=sorted(s.loc[s[c+'_'+met]>=cutoff,'geography'])
            tops[met]={'cutoff':cutoff,'members_including_boundary_ties':members}
        overlap=sorted(set(tops['rate']['members_including_boundary_ties'])&set(tops['share']['members_including_boundary_ties']))
        out['ranking_sensitivity'][c]={**rank_sensitivity(x.to_numpy(),y.to_numpy()),'top_groups':tops,'overlap':overlap}
    for metric in ('rate','share'):
        out['cross_cancer'][metric]={a+'__'+b:{'pearson':float(stats.pearsonr(s[a+'_'+metric],s[b+'_'+metric]).statistic),'spearman':float(stats.spearmanr(s[a+'_'+metric],s[b+'_'+metric]).statistic)} for a,b in itertools.combinations(CANCERS,2)}
    out['Washington_breast_share_source_value']=float(s.loc[s.geography.eq('Washington'),'breast_share'].iloc[0])
    return out

def county(root):
    out={'period':'2019-2023','scope':'County; both sexes; all races including Hispanic; all ages','counties':{}}
    for key,label in [('hinds','Hinds County'),('harris','Harris County')]:
        vals={}
        for stage in ('all','late'):
            t=pd.read_csv(root/f'extracted/{key}_{stage}_table_0.csv');r=t.loc[t.iloc[:,0].map(clean_name).eq(label)]
            if len(r)!=1:raise ValueError('County not uniquely identified: '+label)
            r=r.iloc[0];rate,lo,hi=rate_interval(r.iloc[1]);v={'rate_per_100k':rate,'ci95':[lo,hi],'annual_count':int(r['Average Annual Count'])}
            if stage=='late':v['late_share_percent']=float(r['Percent of Cases with Late Stage'])
            vals[stage]=v
        out['counties'][label]=vals
    h=out['counties']['Hinds County'];t=out['counties']['Harris County']
    out['contrasts']={'all_stage_rate_ratio':h['all']['rate_per_100k']/t['all']['rate_per_100k'],'all_stage_rate_difference':h['all']['rate_per_100k']-t['all']['rate_per_100k'],'late_stage_rate_ratio':h['late']['rate_per_100k']/t['late']['rate_per_100k'],'late_stage_rate_difference':h['late']['rate_per_100k']-t['late']['rate_per_100k'],'share_difference_pp':h['late']['late_share_percent']-t['late']['late_share_percent']}
    out['limits']=['Diagnosed incidence does not identify latent biological incidence or a causal mechanism.','Same age standard does not align all other characteristics.','Source percent-late uses all-stage denominator; do not invent staged-only exclusions.','Do not divide an adjusted rate by a crude case percentage to estimate another adjusted rate.','Overlapping five-year vintages are not independent before/after observations.']
    return out

def survey_load(root):
    with zipfile.ZipFile(root/'originals/nsfg_female.zip') as z:
        names=[x for x in z.namelist() if x.lower().endswith('.csv')]
        if len(names)!=1 or z.getinfo(names[0]).file_size>200*1024*1024:raise ValueError('Unexpected public ZIP structure')
        b=z.read(names[0]);d=pd.read_csv(io.BytesIO(b),low_memory=False);d.columns=d.columns.str.upper()
    return d,hashlib.sha256(b).hexdigest()

def variance(z,d):
    p=pd.DataFrame({'s':d.VEST,'u':d.VECL,'z':z}).groupby(['s','u']).z.sum();v=0.;df=0
    for _,g in p.groupby(level=0):
        n=len(g)
        if n<2:raise ValueError('Singleton survey stratum requires declared treatment')
        v+=n/(n-1)*float(((g-g.mean())**2).sum());df+=n-1
    return v,df

def ratio(d,y,domain,w):
    valid=domain&y.isin([1,5]);den=float(w[valid].sum())
    if den<=0:raise ValueError('No valid weighted domain')
    yes=y.eq(1).astype(float);p=float((w[valid]*yes[valid]).sum()/den)
    lin=(w*valid.astype(float)*(yes-p)/den).to_numpy();v,df=variance(lin,d)
    return p,lin,{'n_valid':int(valid.sum()),'n_excluded':int((domain&~y.isin([1,5])).sum()),'percent':100*p,'taylor_se_pp':100*math.sqrt(v),'design_df':df}

def survey(root):
    d,h=survey_load(root);age=d.AGER;w=d.WGT2022_2023.astype(float)
    if not w.gt(0).all() or d[['VEST','VECL']].isna().any().any():raise ValueError('Invalid survey design')
    domain=age.between(20,49);ext=age.between(20,50)
    out={'source_csv_sha256':h,'total_n':len(d),'literal_20_49_n':int(domain.sum()),'eligible_age50_sensitivity_n':int(ext.sum()),'published_n':4856,'age_note':'Official recode specification: age 50 at interview was 49 at screening. Literal age domain and eligibility sensitivity are retained separately; author analysis code was not obtained.','estimates':{},'equal_age_standardized_black_white':{},'item_nonresponse_bounds':{},'methods':'Full-sample PSU domain ratio Taylor linearization. Fixed one-third weights for ages 20-29,30-39,40-49. Not a standard-US age population or causal adjustment. Exploratory, externally unadjudicated.','limits':['Race/Hispanic origin categories follow HISPRACE2; no biological attribution.','Residual within-band age differences, access, recognition, recall and selection remain.','Worst-case item bounds do not address nonparticipation or misdiagnosis.','Confidence intervals for differences are unadjusted t intervals; three contrast p-values also Holm adjusted.','No individual records are output.']}
    pubs={'ENDO':(6.2,.49),'PCOS':(8.7,.51),'UF':(7.8,.53)}
    pvalues=[]
    for c,(pub,sd) in pubs.items():
        y=d[c];p,_,allr=ratio(d,y,domain,w);pe,_,extended=ratio(d,y,ext,w)
        out['estimates'][c]={'literal_age_domain':allr,'eligible_age50_sensitivity':extended,'published_percent':pub,'published_se_pp':sd,'point_matches_published_rounding':round(p*100,1)==pub,'se_matches_published_rounding':round(allr['taylor_se_pp'],2)==sd,'age_boundary_sensitivity_pp':abs(pe-p)*100}
        groups={};influences={};bounds={}
        for code,label in [(2,'non_Hispanic_White_single_race'),(3,'non_Hispanic_Black_single_race')]:
            gdom=domain&d.HISPRACE2.eq(code);crude,_,cr=ratio(d,y,gdom,w);std=0.;lin=np.zeros(len(d));lower=upper=0.;cells=[]
            for lo,hi in [(20,29),(30,39),(40,49)]:
                a=gdom&age.between(lo,hi);q,l,qs=ratio(d,y,a,w);std+=q/3;lin+=l/3;cells.append({'age_band':f'{lo}-{hi}',**qs})
                total=float(w[a].sum());yes=float(w[a&y.eq(1)].sum());missing=float(w[a&~y.isin([1,5])].sum())
                lower+=yes/total/3;upper+=(yes+missing)/total/3
            v,df=variance(lin,d);groups[label]={'crude_percent':crude*100,'standardized_percent':std*100,'standardized_se_pp':100*math.sqrt(v),'n_valid':cr['n_valid'],'age_cells':cells};influences[label]=(std,lin);bounds[label]={'all_missing_no_percent':100*lower,'all_missing_yes_percent':100*upper}
        white=groups['non_Hispanic_White_single_race'];black=groups['non_Hispanic_Black_single_race'];wp,wl=influences['non_Hispanic_White_single_race'];bp,bl=influences['non_Hispanic_Black_single_race'];diff=bp-wp;v,df=variance(bl-wl,d);se=math.sqrt(v);crit=float(stats.t.ppf(.975,df));pv=float(2*stats.t.sf(abs(diff/se),df))
        out['equal_age_standardized_black_white'][c]={'groups':groups,'contrast':{'black_minus_white_pp':100*diff,'se_pp':100*se,'unadjusted_95_ci_pp':[100*(diff-crit*se),100*(diff+crit*se)],'p_unadjusted':pv,'design_df':df}};pvalues.append(pv);out['item_nonresponse_bounds'][c]=bounds
    adjusted=[0.]*3;running=0.
    for rank,i in enumerate(np.argsort(pvalues)):
        running=max(running,(3-rank)*pvalues[i]);adjusted[int(i)]=min(1.,running)
    for c,a in zip(pubs,adjusted):out['equal_age_standardized_black_white'][c]['contrast']['p_holm_3']=a
    return out

def compare_prior(d,path):
    old=pd.read_csv(path);m=d.merge(old,on='geography',validate='one_to_one',suffixes=('_now','_prior'));dif=[];n=0
    if len(m)!=53:raise ValueError('Prior/current scope differs')
    for c in CANCERS:
        for metric in ('rate','share','count'):
            for _,r in m.iterrows():
                n+=1;a=float(r[c+'_'+metric+'_now']);b=float(r[c+'_'+metric+'_prior'])
                if a!=b:dif.append({'geography':r.geography,'condition':c,'metric':metric,'now':a,'prior':b})
    return {'comparisons':n,'matches':n-len(dif),'differences':dif,'prior_sha256':sha(path)}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--prior',type=Path);a=ap.parse_args();a.out.mkdir(parents=True,exist_ok=True)
    try:
        receipt,sources,semantics=verify_inputs(a.input);d=nci_frame(a.input)
        result={'schema':'dis-original-empirical-cycle-v2','source_run_id':str(receipt.get('run_id')),'source_revision':receipt.get('revision'),'status':'DESCRIPTIVE_ANALYSES_COMPLETED_EXTERNAL_REVIEW_REQUIRED','source_semantics':semantics,'county_colorectal':county(a.input),'national_cancer':national(d),'nsfg':survey(a.input),'mechanism_established':False,'implementation_benefit_measured':False,'external_communication_authorized':False}
        if a.prior:result['prior_source_comparison']=compare_prior(d,a.prior)
        d.to_csv(a.out/'national_original_extract.csv',index=False);save(a.out/'results.json',result)
        save(a.out/'input_bindings.json',{'analysis_script_sha256':sha(__file__),'acquisition_manifest_sha256':sha(a.input/'MANIFEST_SHA256.json'),'sources':{k:v['sha256'] for k,v in sources.items() if v['status']=='ORIGINAL_BYTES_RETAINED'}})
        summary=['# Original-source evidence cycle','',result['status'],'','## County colorectal contrast','Matched 2019-2023 rate ratios (Hinds/Harris): all-stage %.4f; late-stage %.4f.'%(result['county_colorectal']['contrasts']['all_stage_rate_ratio'],result['county_colorectal']['contrasts']['late_stage_rate_ratio']),'','## Metric sensitivity']
        for c in CANCERS:summary.append('%s: %.2f%% of untied state pairs reverse order between late-stage rate and case percentage.'%(c,result['national_cancer']['ranking_sensitivity'][c]['discordant_percent_of_untied_pairs']))
        summary+=['','## Survey reproduction','Weighted point estimates and Taylor SE checks: '+str({c:(v['point_matches_published_rounding'],v['se_matches_published_rounding']) for c,v in result['nsfg']['estimates'].items()}),'','Original doc fetch failures and the 4,855/4,856 age-boundary issue remain visible in acquisition/readiness records. Age-standardized contrasts are exploratory, not biological or causal effects.','No continuous production service, participant intervention or organizational failure has been demonstrated.']
        (a.out/'REPORT.md').write_text('\n'.join(summary)+'\n');print(json.dumps({'status':result['status'],'out':str(a.out)}))
    except Exception as e:
        save(a.out/'analysis_failure.json',{'status':'NOT_COMPLETED','error':type(e).__name__+': '+str(e),'mechanism_established':False});raise
if __name__=='__main__':main()
