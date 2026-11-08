#!/usr/bin/env python3
"""Replay the bounded CRC marginal study from retained original HTML.
No network calls. Marginal age/race estimates are not joint or causal effects.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path,PurePosixPath
from urllib.parse import urlsplit
import pandas as pd
from reference_audit import parse_nci,base_query
from verify_retained import load_json
from lxml import html

# Two originals were reused from the earlier availability probe. Preserve their
# archived filenames without making arbitrary receipt basenames authoritative.
LEGACY_ORIGINAL_NAMES={
    'hinds_age_009_late':'nci_hinds_under50_late_probe.html',
    'harris_age_009_late':'nci_harris_under50_late_probe.html',
}

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def number(x):return None if pd.isna(x) else float(x)

def retained_original(root:Path,source_id:str,recorded_path:object)->Path:
    """Resolve a registered original inside this bundle, never its former host.

    Older receipts retain the acquisition machine's absolute path. Its exact
    registered originals/<filename> suffix is provenance, not permission to
    read that location after an archive is restored. Do not rewrite the
    checksum-bound receipt or accept an arbitrary basename.
    """
    if not isinstance(recorded_path,str) or not recorded_path or '\\' in recorded_path or '\x00' in recorded_path:
        raise ValueError('Marginal source path must be a relative or legacy absolute POSIX path')
    if any(part in ('.','..') for part in recorded_path.split('/')):
        raise ValueError('Marginal source path traversal is not admitted')
    declared=PurePosixPath(recorded_path)
    names={source_id+'.html'}
    if source_id in LEGACY_ORIGINAL_NAMES:names.add(LEGACY_ORIGINAL_NAMES[source_id])
    relative=PurePosixPath('originals',declared.name)
    if declared.name not in names or (declared.parts[-2:]!=relative.parts if declared.is_absolute() else recorded_path!=str(relative)):
        raise ValueError('Marginal source path does not match its registered source identity')
    if (root/'originals').is_symlink():raise ValueError('Symlinked marginal originals are not admitted')
    if sum((root/'originals'/name).exists() or (root/'originals'/name).is_symlink() for name in names)>1:
        raise ValueError('Ambiguous primary and legacy marginal originals')
    p=root/str(relative)
    for candidate in (root/'originals',p):
        if candidate.is_symlink():raise ValueError('Symlinked marginal originals are not admitted')
    if not p.resolve().is_relative_to(root/'originals'):
        raise ValueError('Marginal source path escapes retained originals')
    if not p.is_file():raise ValueError('Marginal original is missing from the supplied evidence bundle')
    return p

def build(root:Path):
    root=Path(root).resolve();path=root/'marginal-acquisition-receipt.json';receipt=load_json(path)
    records=receipt.get('records',[])
    expected={f'{county}_{dimension}_{code}_{stage}' for county in ('hinds','harris') for dimension,codes in [('age',('009','136')),('race',('07','28'))] for code in codes for stage in ('all','late')}
    if len(records)!=16 or {x.get('id') for x in records}!=expected:raise ValueError('Exactly sixteen distinct authorized marginal scopes required')
    sources=[];normal=[]
    for r in records:
        sid=r['id'];p=retained_original(root,sid,r['path'])
        if r['status']!='ORIGINAL_BYTES_RETAINED' or not 0<p.stat().st_size<=32*1024*1024 or p.stat().st_size!=r['bytes'] or sha(p)!=r['sha256']:raise ValueError('Marginal source byte mismatch')
        normalized={**r,'path':str(p.relative_to(root))};normal.append(normalized)
        url=urlsplit(r['url'])
        if url.scheme+'://'+url.netloc+url.path!='https://statecancerprofiles.cancer.gov/incidencerates/index.php' or url.fragment:raise ValueError('Marginal source origin changed')
        sources.append({'id':sid,'query':url.query,'sha256':r['sha256'],'bytes':r['bytes'],
          'capturedAt':r.get('original_retrieved_at') or r['finished_at']})
    by={x['id']:x for x in records};norm={'sources':normal};strata=[]
    for dimension,levels in [('age',[('009','<50'),('136','50+')]),('race',[('07','White (Non-Hispanic)'),('28','Black (Non-Hispanic)')])]:
        for code,label in levels:
            result={'dimension':dimension,'code':code,'label':label,'age':'All ages' if dimension=='race' else label,
              'race':'All races including Hispanic' if dimension=='age' else label,'sex':'Both sexes','counties':[]}
            for county,state,fips,name in [('hinds','28','28049','Hinds County, MS'),('harris','48','48201','Harris County, TX')]:
                stages={}
                for suffix,stage in [('all','999'),('late','211')]:
                    sid=f'{county}_{dimension}_{code}_{suffix}';q=base_query(stage=stage,state=state,area='county');q.update({dimension:code,'year':'0','ruralurban':'0'})
                    period,frame=parse_nci(root,norm,sid,q)
                    if period!='2019-2023':raise ValueError('Marginal source period changed')
                    tree=html.fromstring((root/next(r['path'] for r in normal if r['id']==sid)).read_bytes())
                    labels=[' '.join(x.text_content().split()) for x in tree.xpath('//select[@name="'+dimension+'"]/option[@selected]')]
                    if labels!=[label]:raise ValueError('Published marginal label differs from the declared scope')
                    raw=frame.loc[name.rsplit(', ',1)[0]];v=by[sid]['estimate']
                    rate=number(raw['rate']);ci=None if rate is None else [number(raw['ci_low']),number(raw['ci_high'])]
                    share=number(raw['share']) if suffix=='late' else None;count=number(raw['count'])
                    if [rate,ci,count,share]!=[v['rate_per_100k'],v['ci95'],v['average_annual_count'],v['late_case_share_percent']]:raise ValueError('Marginal values differ from raw HTML replay')
                    stages[suffix]={'sourceId':sid,'ratePer100k':rate,'ci95':ci,'averageAnnualCount':count,'lateCaseSharePercent':share,
                      'state':'OBSERVED_SOURCE_AGGREGATE' if rate is not None else 'SUPPRESSED_OR_MISSING'}
                result['counties'].append({'name':name,'fips':fips,**stages})
            h,t=result['counties'];result['lateRateDifference']=None if h['late']['ratePer100k'] is None or t['late']['ratePer100k'] is None else h['late']['ratePer100k']-t['late']['ratePer100k']
            result['lateShareDifferencePp']=None if h['late']['lateCaseSharePercent'] is None or t['late']['lateCaseSharePercent'] is None else h['late']['lateCaseSharePercent']-t['late']['lateCaseSharePercent']
            strata.append(result)
    return {'schema':'dis-crc-marginal-supplement-v1','id':'crc-marginals-'+sha(path)[:12],'period':'2019-2023',
      'state':'DESCRIPTIVE_RESEARCH_CALIBRATION','sourceReceiptSha256':sha(path),'projectionScriptSha256':sha(__file__),
      'sourceEndpoint':'https://statecancerprofiles.cancer.gov/incidencerates/index.php',
      'sources':sources,'strata':strata,'sourceConfidenceIntervalsOnly':True,'jointAgeRaceAnalysis':False,
      'causalEffectEstablished':False,'under45InferenceSupported':False,'clinicalActionAuthorized':False,
      'limits':['The <50 band includes45–49; it cannot isolate under45 or routine-screening eligibility.',
        'Age and race comparisons are separate marginals; they cannot identify joint interactions or decompose the aggregate contrast.',
        'Point contrasts and equal rounded shares do not establish population differences or equivalence; no contrast interval is claimed.',
        'Source rates are age-adjusted within their published scope; average counts are rounded, and no individual risk, delay or preventable burden is observed.'],
      'nextTest':'Investigate group-specific risk/context, prevention, recognition, access, follow-through, capacity and measurement with finer age and joint strata plus time-aligned pathway evidence.'}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--input',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);ap.add_argument('--check',action='store_true');a=ap.parse_args()
    if a.output.resolve().is_relative_to(a.input.resolve()):raise ValueError('Preserve retained marginal evidence')
    obj=build(a.input);data=json.dumps(obj,indent=2,ensure_ascii=False,allow_nan=False)+'\n'
    packet=len(json.dumps(obj,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode())
    if packet>12000:raise ValueError('Marginal supplement exceeds its case budget')
    if a.check:
        if a.output.read_text()!=data:raise ValueError('Committed marginal snapshot differs from raw-source projection')
    else:a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(data)
    print(json.dumps({'state':'PROJECTION_MATCH' if a.check else 'PROJECTED','casePacketBytes':packet,'sha256':sha(a.output)}))
if __name__=='__main__':main()
