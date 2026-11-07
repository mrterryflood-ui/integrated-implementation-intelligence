#!/usr/bin/env python3
"""Offline audit of retained originals. No retrieval, patient linkage or causal claims.
Read source bytes, validate their hashes and query contracts, reproduce descriptive
measurements, and benchmark survey standard errors against official NCHS output.
"""
from __future__ import annotations
import argparse, hashlib, io, json, re, subprocess, zipfile
from itertools import combinations
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import numpy as np
import pandas as pd
from lxml import html
from scipy.stats import pearsonr, spearmanr

STATES = frozenset('Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|'))
BENCHMARK_URL = 'https://www.cdc.gov/nchs/data/nsfg/varest/2022-2023-NSFG-VarEst-all.pdf'
AGE_RULE_URL = 'https://www.cdc.gov/nchs/data/nsfg/recodespecs/2022-2023-NSFG-FemResp-RecodeSpecs.pdf'
REPORT_URL = 'https://www.cdc.gov/nchs/data/hestat/hestat121.htm'
BENCHMARK = [(15,19,730,14.2348,1.6792),(20,24,606,18.9586,2.0226),(25,29,803,14.6057,1.8889),(30,34,1028,10.1973,1.3836),(35,39,928,7.8114,1.1050),(40,50,1491,6.8632,.7961)]

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def save(path: Path, value) -> None:
    path.write_text(json.dumps(value, indent=2, allow_nan=False)+'\n', encoding='utf-8')

def retained_source(root: Path, receipt: dict, source_id: str) -> bytes:
    rows = receipt.get('sources', [])
    ids = [r.get('id') for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate acquisition source identity')
    selected = [r for r in rows if r.get('id') == source_id]
    if len(selected) != 1 or selected[0].get('status') != 'ORIGINAL_BYTES_RETAINED':
        raise ValueError('Original not acquired: '+source_id)
    row = selected[0]
    path = (root / row['path']).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Source path escapes evidence root')
    if path.is_symlink() or not 0 < path.stat().st_size <= 32*1024*1024:
        raise ValueError('Invalid or unbounded original file')
    data = path.read_bytes()
    if not re.fullmatch(r'[0-9a-f]{64}', str(row.get('sha256',''))) or sha(data) != row['sha256']:
        raise ValueError('Original hash mismatch: '+source_id)
    if len(data) != row.get('bytes'):
        raise ValueError('Original length mismatch: '+source_id)
    return data

def row_name(value: str) -> str:
    return re.sub(r'\s+\d+\s*$', '', str(value)).strip()

def period_from_html(data: bytes) -> str:
    tree = html.fromstring(data)
    headings = [' '.join(' '.join(e.itertext()).split()) for e in tree.xpath('//h2')]
    headings = [s for s in headings if s.startswith(('Incidence Rate Report for ', 'Incidence Rate Report by State '))]
    if len(headings) != 1:
        raise ValueError('Missing or ambiguous incidence heading')
    periods = re.findall(r'\b(20\d{2})\s*[-–]\s*(20\d{2})\b', headings[0])
    if len(periods) != 1:
        raise ValueError('Missing or ambiguous observation window')
    return '-'.join(periods[0])

def numeric(value, percent: bool=False):
    s = str(value).strip().replace(',', '')
    if s in {'*','N/A','nan','3 or fewer'}:
        return None
    if not re.fullmatch(r'\d+(?:\.\d+)?', s):
        raise ValueError('Unrecognized source numeric value: '+s)
    v = float(s)
    if not np.isfinite(v) or v < 0 or (percent and v > 100):
        raise ValueError('Impossible source value')
    return v

def parse_nci(root: Path, receipt: dict, sid: str, expected: dict) -> tuple[str,pd.DataFrame]:
    rec = next((r for r in receipt['sources'] if r['id']==sid), {})
    u=urlparse(rec.get('url',''))
    if u.scheme!='https' or u.hostname not in {'statecancerprofiles.cancer.gov','www.statecancerprofiles.cancer.gov'}:
        raise ValueError('Unexpected NCI source origin')
    query = parse_qs(u.query)
    if any(query.get(k) != [v] for k,v in expected.items()):
        raise ValueError('Source query does not match declared study: '+sid)
    raw = retained_source(root,receipt,sid)
    period = period_from_html(raw)
    tree=html.fromstring(raw)
    for key,value in expected.items():
        selected=tree.xpath('//select[translate(@name,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")="'+key+'"]/option[@selected]/@value')
        if selected!=[value]:
            raise ValueError('Rendered source selector disagrees with requested scope: '+sid+' '+key)
    tables = pd.read_html(io.BytesIO(raw))
    key = 'State' if expected['areatype']=='state' else 'County'
    tables = [t for t in tables if key in t]
    if len(tables) != 1:
        raise ValueError('Source table ambiguous: '+sid)
    tab = tables[0].copy()
    tab['geography'] = tab[key].map(row_name)
    if tab['geography'].duplicated().any():
        raise ValueError('Duplicate geography after normalization')
    ratecols = [c for c in tab if str(c).startswith('Age-Adjusted Incidence Rate')]
    if len(ratecols)!=1:
        raise ValueError('Missing or ambiguous rate column')
    rates=[]; low=[]; high=[]
    for cell in tab[ratecols[0]].astype(str):
        if cell.strip()=='*':
            rates.append(None);low.append(None);high.append(None);continue
        m=re.fullmatch(r'\s*([\d.]+)\s*\(\s*([\d.]+),\s*([\d.]+)\s*\)\s*',cell)
        if not m: raise ValueError('Unrecognized rate and interval: '+cell)
        r,l,h=map(float,m.groups())
        if not 0<=l<=r<=h or not all(np.isfinite([r,l,h])):
            raise ValueError('Invalid rate interval')
        rates.append(r);low.append(l);high.append(h)
    out=pd.DataFrame({'geography':tab.geography,'rate':rates,'ci_low':low,'ci_high':high,
                      'count':tab['Average Annual Count'].map(numeric)})
    if expected['stage']=='211':
        out['share']=tab['Percent of Cases with Late Stage'].map(lambda v:numeric(v,True))
    return period,out.set_index('geography')

def base_query(cancer='020',sex='0',stage='211',state='00',area='state'):
    return dict(cancer=cancer,sex=sex,stage=stage,statefips=state,areatype=area,age='001',race='00')

def nci_replay(root:Path,receipt:dict,out:Path,prior:Path|None=None) -> dict:
    frames=[];periods=[]
    for condition,cancer,sex in [('colorectal','020','0'),('lung','047','0'),('breast','055','2')]:
        period,t=parse_nci(root,receipt,condition+'_states',base_query(cancer,sex))
        if not STATES.issubset(t.index): raise ValueError('Missing state; do not impute')
        periods.append(period)
        frames.append(t[['rate','count','share']].rename(columns=lambda c:condition+'_'+c))
    if len(set(periods))!=1: raise ValueError('Unmatched national source observation windows')
    panel=pd.concat(frames,axis=1).sort_index()
    states=panel.loc[sorted(STATES)]
    if not np.isfinite(states.to_numpy(dtype=float)).all(): raise ValueError('Missing/suppressed state measure')
    panel.to_csv(out/'nci_source_reextraction.csv',index_label='geography')
    correlations=[]
    for family in ['rate','share']:
        for a,b in combinations(['colorectal','lung','breast'],2):
            x,y=states[a+'_'+family],states[b+'_'+family]
            if x.nunique()<2 or y.nunique()<2:raise ValueError('Zero-variance correlation input')
            correlations.append(dict(construct=family,pair=[a,b],n=50,pearson=float(pearsonr(x,y).statistic),spearman=float(spearmanr(x,y).statistic)))
    county={};cperiods=[]
    for name,fips,label in [('hinds','28','Hinds County'),('harris','48','Harris County')]:
        county[name]={}
        for suffix,stage in [('all','999'),('late','211')]:
            period,t=parse_nci(root,receipt,name+'_'+suffix,base_query(stage=stage,state=fips,area='county'))
            if label not in t.index:raise ValueError('Exact county absent; no substring fallback')
            values=t.loc[label].to_dict()
            if not all(np.isfinite(v) for v in values.values()):raise ValueError('County values missing/suppressed')
            county[name][suffix]=values;cperiods.append(period)
    if len(set(cperiods))!=1:raise ValueError('Unmatched county observation windows')
    comparison={'period':cperiods[0],'counties':county,'late_rate_difference_per_100k':county['hinds']['late']['rate']-county['harris']['late']['rate'],
                'late_rate_ratio':county['hinds']['late']['rate']/county['harris']['late']['rate'],
                'all_stage_rate_ratio':county['hinds']['all']['rate']/county['harris']['all']['rate'],
                'late_share_difference_pp':county['hinds']['late']['share']-county['harris']['late']['share']}
    result={'status':'SOURCE_BYTES_REEXTRACTED_DESCRIPTIVE_ONLY','national_period':periods[0],'state_count':50,
            'excluded_geographies':sorted(set(panel.index)-STATES),'correlations':correlations,'county_comparison':comparison,
            'limits':['No causal effect, screening-performance or individual-level mechanism identified.','Female breast rates concern females; colorectal and lung rates concern both sexes.','Published rounded estimates are used; within-state uncertainty and spatial dependence are not modeled.','Stage-share denominator is provider-defined all-stage cases; unknown-stage handling still requires explicit source-method review.']}
    if prior:
        earlier=pd.read_csv(prior).set_index('geography').rename(index={'United States':'US (SEER+NPCR)'})
        if earlier.index.duplicated().any() or not STATES.issubset(earlier.index): raise ValueError('Prior geography contract invalid')
        if 'period' not in earlier or set(earlier.loc[sorted(STATES),'period'])!={periods[0]}: raise ValueError('Prior and current vintages differ')
        changes=[]
        for name in sorted(STATES):
            for col in states:
                a,b=float(earlier.loc[name,col]),float(states.loc[name,col])
                if not np.isfinite(a):raise ValueError('Invalid prior numeric value')
                if a!=b:changes.append({'geography':name,'field':col,'previous':a,'current':b})
        result['prior_curated_comparison']={'input_sha256':sha(prior.read_bytes()),'cells_compared':450,'differences':changes}
    return result

def ratio_design(data:pd.DataFrame,y:pd.Series,domain:pd.Series,valid:pd.Series|None=None) -> dict:
    w=pd.to_numeric(data.WGT2022_2023,errors='coerce')
    if (~np.isfinite(w)).any() or (w<=0).any() or data[['VEST','VECL']].isna().any().any():raise ValueError('Invalid survey weights/design')
    if not data.index.equals(y.index) or not data.index.equals(domain.index) or (valid is not None and not data.index.equals(valid.index)):
        raise ValueError('Survey vector indexes do not align')
    if domain.isna().any() or (valid is not None and valid.isna().any()):
        raise ValueError('Missing survey domain indicator')
    keep=domain.astype(bool) if valid is None else domain.astype(bool)&valid.astype(bool)
    den=float(w[keep].sum())
    if den<=0:raise ValueError('No valid outcome denominator')
    y=y.astype(float)
    if not y[keep].isin([0.,1.]).all():raise ValueError('Nonbinary observed outcome')
    p=float((w[keep]*y[keep]).sum()/den)
    scores=(w*(y-p)/den).where(keep,0.)
    clusters=pd.DataFrame({'h':data.VEST,'j':data.VECL,'score':scores}).groupby(['h','j'])['score'].sum()
    var=0.;df=0
    for _,g in clusters.groupby(level=0):
        if len(g)<2:raise ValueError('Singleton stratum requires explicit variance policy')
        var+=float(len(g)/(len(g)-1)*((g-g.mean())**2).sum());df+=len(g)-1
    return {'domain_n':int(domain.sum()),'valid_n':int(keep.sum()),'missing_n':int((domain&~keep).sum()),
            'percent':p*100,'se_percentage_points':float(np.sqrt(var)*100),'design_df':df,'strata':int(data.VEST.nunique()),'psus':int(len(clusters))}

def nsfg_replay(root:Path,receipt:dict) -> dict:
    raw=retained_source(root,receipt,'nsfg_female')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        members=[m for m in z.infolist() if m.filename.lower().endswith('.csv')]
        if len(members)!=1 or members[0].file_size>200*1024*1024:raise ValueError('Unbounded/ambiguous NSFG ZIP')
        data=pd.read_csv(io.BytesIO(z.read(members[0])),usecols=['AGER','ENDO','PCOS','UF','CONSTAT1','WGT2022_2023','VEST','VECL'],low_memory=False)
    if data.AGER.isna().any() or not data.AGER.between(15,50).all():raise ValueError('Unexpected survey age codes')
    strict=data.AGER.between(20,49);eligible=data.AGER.between(20,50)
    estimates={}
    published={'ENDO':(6.2,.49),'PCOS':(8.7,.51),'UF':(7.8,.53)}
    for name,(point,se) in published.items():
        y=data[name].eq(1).astype(float);valid=data[name].isin([1,5])
        a=ratio_design(data,y,strict,valid);b=ratio_design(data,y,eligible,valid)
        estimates[name]={'strict_interview_20_49':a,'documented_screener_boundary_included':b,
                         'point_matches_published_rounding':round(b['percent'],1)==point,'se_matches_published_rounding':round(b['se_percentage_points'],2)==se}
    benchmark=[]
    for lo,hi,n,p,se in BENCHMARK:
        calc=ratio_design(data,data.CONSTAT1.eq(6).astype(float),data.AGER.between(lo,hi))
        ok=calc['domain_n']==n and abs(calc['percent']-p)<=.000051 and abs(calc['se_percentage_points']-se)<=.000051 and calc['strata']==20 and calc['psus']==80 and calc['design_df']==60
        benchmark.append({'published_age_label':str(lo)+'-'+str(49 if hi==50 else hi),'calculated':calc,'published_percent':p,'published_se':se,'matches_printed_precision':ok})
    if int(eligible.sum())!=4856 or not all(b['matches_printed_precision'] for b in benchmark) or not all(e['point_matches_published_rounding'] and e['se_matches_published_rounding'] for e in estimates.values()):
        raise ValueError('Published sample/point/SE/variance benchmark failed; inspect source and domain')
    return {'status':'DESCRIPTIVE_REPLAY_NOT_INDEPENDENTLY_ADJUDICATED','source_n':len(data),'strict_interview_age_20_49_n':int(strict.sum()),
            'screener_eligible_boundary_domain_n':int(eligible.sum()),'age_rule_source':AGE_RULE_URL,'report_source':REPORT_URL,
            'age_rule':'AGER=50 is permitted: age 49 at household screening; preserve strict-age sensitivity rather than silently recode.',
            'estimates':estimates,'variance_benchmark':{'source':BENCHMARK_URL,'printed_pages':[1,2],'all_six_match':all(r['matches_printed_precision'] for r in benchmark),'groups':benchmark},
            'limits':['Benchmark agreement is computational calibration, not a human audit or evidence of a disease mechanism.','The published report code is not available here; screener-boundary inclusion is consistent with documented eligibility and reported n.','No claim of reproducing published confidence intervals; the original run used a different interval method.','Public-use data are used only for aggregate statistical analysis; no identification or record linkage.']}

def compare_implementation(result:dict,primary:dict) -> dict:
    checks=[]
    for row in result['nci']['correlations']:
        other=primary['national_cancer']['cross_cancer'][row['construct']]['__'.join(row['pair'])]
        for metric in ['pearson','spearman']:
            checks.append(abs(row[metric]-other[metric])<1e-12)
    for condition,values in result['nsfg']['estimates'].items():
        for ours,theirs in [('strict_interview_20_49','literal_age_domain'),('documented_screener_boundary_included','eligible_age50_sensitivity')]:
            a=values[ours];b=primary['nsfg']['estimates'][condition][theirs]
            checks.extend([abs(a['percent']-b['percent'])<1e-12,abs(a['se_percentage_points']-b['taylor_se_pp'])<1e-12])
    if len(checks)!=24 or not all(checks):
        raise ValueError('Independent numerical replay differs from the primary analysis')
    return {'contrasts_checked':24,'contrasts_passed':24,'tolerance':1e-12,'limit':'Computational cross-check; both implementations are assistant-authored, not independent human adjudication.'}

def execute(root:Path,out:Path,prior:Path|None=None,primary:Path|None=None) -> dict:
    receipt=json.loads((root/'acquisition_receipt.json').read_text())
    out.mkdir(parents=True,exist_ok=True)
    try:revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=Path(__file__).resolve().parents[2],stderr=subprocess.DEVNULL,text=True).strip()
    except (OSError,subprocess.CalledProcessError):revision=None
    result={'schema':'dis-offline-replay-v1','input_receipt_sha256':sha((root/'acquisition_receipt.json').read_bytes()),'input_run_id':receipt.get('run_id'),
            'acquisition_declared_revision':receipt.get('revision'),'replay_checkout_revision':revision,'replay_code_sha256':sha(Path(__file__).read_bytes()),
            'source_coverage':'UNCHANGED_SEE_ACQUISITION_RECEIPT','nci':nci_replay(root,receipt,out,prior),'nsfg':nsfg_replay(root,receipt),
            'mechanism_identified':False,'clinical_benefit_measured':False,'independent_human_review':'NOT_RECORDED'}
    if primary:
        result['primary_implementation_parity']=compare_implementation(result,json.loads(primary.read_text()))
        result['primary_result_sha256']=sha(primary.read_bytes())
    save(out/'audited_replay.json',result)
    return result

def main():
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('--out',type=Path);p.add_argument('--prior-csv',type=Path);p.add_argument('--seal',action='store_true');p.add_argument('--compare-analysis',type=Path);a=p.parse_args()
    if a.seal:
        save(a.root/'MANIFEST_SHA256.json',{str(f.relative_to(a.root)):sha(f.read_bytes()) for f in sorted(a.root.rglob('*')) if f.is_file() and f.name!='MANIFEST_SHA256.json'});return
    out=a.out or a.root/'audit'
    try:
        r=execute(a.root,out,a.prior_csv,a.compare_analysis)
        print(json.dumps({'status':'AUDITED_DESCRIPTIVE_REPLAY','county_period':r['nci']['county_comparison']['period'],'states':50,'nsfg_domain_n':r['nsfg']['screener_eligible_boundary_domain_n'],'nchs_six_group_benchmark_passed':r['nsfg']['variance_benchmark']['all_six_match']}))
    except Exception as e:
        out.mkdir(parents=True,exist_ok=True);save(out/'audited_replay.json',{'schema':'dis-offline-replay-v1','status':'FAILED_REPLAY','error':type(e).__name__+': '+str(e),'mechanism_identified':False});raise
if __name__=='__main__':main()
