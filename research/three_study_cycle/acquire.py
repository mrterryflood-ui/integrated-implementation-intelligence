#!/usr/bin/env python3
"""Original public-source cycle. No clinical action, model calls, secrets or outreach.
Outputs remain source-reported/independently unadjudicated. Acquisition failure is
retained, never replaced with fabricated data or a successful empty result.
"""
from __future__ import annotations
import argparse, hashlib, io, json, os, re, sys, time, zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, urlencode
import requests
import pandas as pd
import numpy as np
from scipy.stats import t as student_t

MAX_BYTES=32*1024*1024

def utc(): return datetime.now(timezone.utc).isoformat()
def digest(b): return hashlib.sha256(b).hexdigest()
def write_json(p,obj): p.write_text(json.dumps(obj,indent=2,allow_nan=False,default=str)+'\n')
def nci(cancer,sex,stage='211',state='00',area='state'):
    return 'https://statecancerprofiles.cancer.gov/incidencerates/index.php?'+urlencode(dict(age='001',areatype=area,cancer=cancer,datatype='01',race='00',ruralurban='0',sex=sex,sortOrder='asc',sortVariableName='name',stage=stage,statefips=state,type='incd',year='0'))
SOURCES={
 'nsfg_female':('https://ftp.cdc.gov/pub/Health_Statistics/NCHS/NSFG/NSFG-2022-2023-FemRespPUFData.zip','zip'),
 'nsfg_codebook':('https://www.cdc.gov/nchs/data/nsfg/codebooks/2022-2023-NSFG-FemRespPUFCodebook.pdf','pdf'),
 'nsfg_published':('https://www.cdc.gov/nchs/data/hestat/hestat121.htm','html'),
 'colorectal_states':(nci('020','0'),'html'),
 'lung_states':(nci('047','0'),'html'),
 'breast_states':(nci('055','2'),'html'),
 'hinds_all':(nci('020','0','999','28','county'),'html'),
 'hinds_late':(nci('020','0','211','28','county'),'html'),
 'harris_all':(nci('020','0','999','48','county'),'html'),
 'harris_late':(nci('020','0','211','48','county'),'html')}

def acquire(name,url,kind,out):
    rec={'id':name,'url':url,'started_at':utc(),'status':'ACQUISITION_FAILED','analysis_release':'NOT_ADJUDICATED'}
    try:
        with requests.get(url,timeout=(12,35),stream=True,headers={'User-Agent':'DIS-Public-Research-Reproducibility/0.1'}) as r:
            rec.update(http_status=r.status_code,final_url=r.url,content_type=r.headers.get('content-type'),last_modified=r.headers.get('last-modified'),etag=r.headers.get('etag'))
            host=urlparse(r.url).hostname or ''
            if not(host.endswith('.cdc.gov') or host.endswith('.cancer.gov')): raise ValueError('Unexpected public-source redirect origin')
            r.raise_for_status(); chunks=[]; size=0
            for c in r.iter_content(65536):
                size+=len(c)
                if size>MAX_BYTES: raise ValueError('Source exceeds bounded acquisition capacity')
                chunks.append(c)
            data=b''.join(chunks)
        if kind=='zip' and not data.startswith(b'PK'): raise ValueError('Expected original ZIP bytes')
        if kind=='pdf' and not data.startswith(b'%PDF'): raise ValueError('Expected original PDF bytes')
        if kind=='html' and b'<html' not in data.lower(): raise ValueError('Expected source HTML')
        p=out/'originals'/f'{name}.{kind}'; p.write_bytes(data)
        rec.update(status='ORIGINAL_BYTES_RETAINED',sha256=digest(data),bytes=len(data),path=str(p.relative_to(out)),finished_at=utc())
        if kind=='html':
            text=data.decode('utf-8',errors='replace')
            rec['reported_period_candidates']=sorted(set(re.findall(r'20\d{2}\s*[-–]\s*20\d{2}',re.sub('<[^>]+>',' ',text))))
            try:
                tables=pd.read_html(io.StringIO(text)); rec['tables']=[]
                for i,tab in enumerate(tables):
                    if len(tab)<3: continue
                    fn=f'{name}_table_{i}.csv'; tab.to_csv(out/'extracted'/fn,index=False)
                    rec['tables'].append({'path':'extracted/'+fn,'rows':len(tab),'columns':[str(c) for c in tab.columns]})
            except ValueError: rec['table_note']='No parseable table; original remains retained'
        return rec
    except Exception as e:
        rec.update(error=type(e).__name__+': '+str(e)[:600],finished_at=utc()); return rec

def estimate(d,y,domain,w):
    """Taylor-linearized ratio using ALL sampled PSUs; zero outside subpopulation.
    A t-logit interval is provided, not claimed identical to NCHS Korn-Graubard.
    """
    valid=domain & y.isin([1,5]); den=float(w[valid].sum())
    if den<=0: return {'status':'NO_VALID_DOMAIN'}
    binary=y.eq(1).astype(float); p=float((w[valid]*binary[valid]).sum()/den)
    z=w*valid.astype(float)*(binary-p)/den
    f=pd.DataFrame({'VEST':d['VEST'],'VECL':d['VECL'],'z':z})
    psu=f.groupby(['VEST','VECL'],dropna=False)['z'].sum()
    var=0.; df=0; singleton=[]
    for h,g in psu.groupby(level=0):
        m=len(g)
        if m<2: singleton.append(str(h)); continue
        var+=float(m/(m-1)*((g-g.mean())**2).sum());df+=m-1
    se=var**.5
    result={'status':'DESCRIPTIVE_REPRODUCTION','unweighted_valid_n':int(valid.sum()),'unweighted_yes_n':int((valid&y.eq(1)).sum()),'domain_missing_or_nonresponse_n':int((domain&~y.isin([1,5])).sum()),'percent':100*p,'taylor_se_percentage_points':100*se,'design_df':df,'singleton_strata':singleton}
    if singleton: result['status']='VARIANCE_REVIEW_REQUIRED'
    if 0<p<1 and df>0:
        a=np.log(p/(1-p));b=float(student_t.ppf(.975,df))*se/(p*(1-p))
        result['t_logit_95_percent']=[float(100/(1+np.exp(-(a-b)))),float(100/(1+np.exp(-(a+b))))]
    return result

def survey(out):
    p=out/'originals/nsfg_female.zip'
    if not p.exists(): return {'status':'NO_MICRODATA_ACQUIRED'}
    with zipfile.ZipFile(p) as z:
        names=[n for n in z.namelist() if n.lower().endswith('.csv')]
        if len(names)!=1: raise ValueError('Expected exactly one public female CSV')
        if z.getinfo(names[0]).file_size>200*1024*1024: raise ValueError('Unbounded ZIP member')
        b=z.read(names[0]); d=pd.read_csv(io.BytesIO(b),low_memory=False);d.columns=d.columns.str.upper()
    prof={'rows':len(d),'columns':list(d.columns),'original_member':names[0],'original_csv_sha256':digest(b),'selected_value_counts':{}}
    for c in ['AGER','AGE_R','ENDO','PCOS','UF','ENDOCURR','UFCURR','HISPRACE2','HISPRACE','RACE','HISPANIC','CURR_INS','CURRCOV','VEST','VECL']:
        if c in d: prof['selected_value_counts'][c]={str(k):int(v) for k,v in d[c].value_counts(dropna=False).items()}
    write_json(out/'survey_schema.json',prof)
    required=['ENDO','PCOS','UF','WGT2022_2023','VEST','VECL']
    if any(c not in d for c in required):return {'status':'SCHEMA_MISMATCH','missing':[c for c in required if c not in d]}
    agecol='AGER' if 'AGER' in d else 'AGE_R'
    if agecol not in d:return {'status':'AGE_VARIABLE_MISSING'}
    age=pd.to_numeric(d[agecol],errors='coerce');w=pd.to_numeric(d['WGT2022_2023'],errors='coerce')
    if w.isna().any() or (w<=0).any():raise ValueError('Missing/nonpositive survey weights')
    domain=age.between(20,49);result={'status':'INTERNAL_REPRODUCTION_NOT_INDEPENDENTLY_ADJUDICATED','age_variable':agecol,'age_domain_n':int(domain.sum()),'source_total_n':len(d),'coding':'1=yes;5=no; all other codes excluded and counted; review codebook excerpts before release','variance':'stratified Taylor-linearized ratio; full-sample PSU domain construction','interval':'t-logit, not asserted to reproduce NCHS published CI method','estimates':{}}
    for c in ['ENDO','PCOS','UF']:
        y=pd.to_numeric(d[c],errors='coerce');result['estimates'][c]={'overall':estimate(d,y,domain,w),'age_groups':{}}
        for lo,hi in [(20,29),(30,39),(40,49)]:result['estimates'][c]['age_groups'][f'{lo}-{hi}']=estimate(d,y,domain&age.between(lo,hi),w)
        for groupcol in ['HISPRACE2','HISPRACE','CURR_INS']:
            if groupcol in d:
                result['estimates'][c][groupcol]={str(k):estimate(d,y,domain&d[groupcol].eq(k),w) for k in sorted(d.loc[domain,groupcol].dropna().unique())}
    published={'ENDO':6.2,'PCOS':8.7,'UF':7.8}
    result['published_rounding_checks']={c:round(result['estimates'][c]['overall']['percent'],1)==v for c,v in published.items()}
    result['publication_gate']='SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY' if all(result['published_rounding_checks'].values()) and int(domain.sum())==4856 else 'DISCREPANCY_REQUIRES_REVIEW'
    return result

def codebook(out):
    p=out/'originals/nsfg_codebook.pdf'
    if not p.exists():return
    import fitz
    doc=fitz.open(p);found={}
    names=['ENDO','UF','PCOS','AGER','AGE_R','HISPRACE2','CURR_INS']
    for i,page in enumerate(doc):
        text=page.get_text()
        for name in names:
            if re.search(r'(?:^|\n)'+re.escape(name)+r'\s*(?:\n|\()',text) and len(text)<18000:
                found.setdefault(name,[]).append({'page_one_based':i+1,'text':text})
        if all(n in found for n in ['ENDO','UF','PCOS','HISPRACE2','CURR_INS']):break
    write_json(out/'codebook_excerpts.json',found)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',default='research-results');args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    for x in ['originals','extracted']:(out/x).mkdir(exist_ok=True)
    receipt={'schema':'dis-three-study-original-cycle-v1','started_at':utc(),'revision':os.getenv('GITHUB_SHA','local'),'run_id':os.getenv('GITHUB_RUN_ID'),'mode':'PUBLIC_SOURCE_READ_ONLY','sources':[],'claim_limit':'Source reproduction is not mechanism identification or intervention effectiveness'}
    for name,(url,kind) in SOURCES.items():
        r=acquire(name,url,kind,out);receipt['sources'].append(r);write_json(out/'acquisition_receipt.json',receipt);print(name,r['status'],flush=True)
    try: codebook(out)
    except Exception as e:receipt['codebook_error']=type(e).__name__+': '+str(e)[:500]
    try: write_json(out/'nsfg_reproduction.json',survey(out))
    except Exception as e:write_json(out/'nsfg_reproduction.json',{'status':'ANALYSIS_FAILED','error':type(e).__name__+': '+str(e)[:700]})
    receipt.update(finished_at=utc(),originals_received=sum(s['status']=='ORIGINAL_BYTES_RETAINED' for s in receipt['sources']))
    write_json(out/'acquisition_receipt.json',receipt)
    write_json(out/'MANIFEST_SHA256.json',{str(p.relative_to(out)):digest(p.read_bytes()) for p in sorted(out.rglob('*')) if p.is_file() and p.name!='MANIFEST_SHA256.json'})
    print(json.dumps({'received':receipt['originals_received'],'requested':len(SOURCES),'out':str(out)}))
if __name__=='__main__':main()
