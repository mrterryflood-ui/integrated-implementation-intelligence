"""Replay retained public county tables; descriptive, not a causal comparison.

No private clinical records or held-out cases. The original archive is read-only.
Pair counts share counties and must not be treated as independent observations.
"""
from __future__ import annotations
import argparse, csv, hashlib, io, itertools, json, re
from collections import Counter
from decimal import Decimal as D
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZipFile

PIN = 'ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a'
SOURCES = {'hinds_all': ('MS','all'), 'hinds_late': ('MS','late'),
           'harris_all': ('TX','all'), 'harris_late': ('TX','late')}
class TableRows(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=None; self.parts=None
    def handle_starttag(self,tag,attrs):
        if tag=='tr': self.row=[]
        if tag in ('td','th') and self.row is not None: self.parts=[]
    def handle_data(self,data):
        if self.parts is not None: self.parts.append(data)
    def handle_endtag(self,tag):
        if tag in ('td','th') and self.parts is not None:
            self.row.append(' '.join(''.join(self.parts).split()));self.parts=None
        if tag=='tr' and self.row is not None:
            if self.row:self.rows.append(self.row)
            self.row=None

def name(s):return re.sub(r'\s+\d+$','',s).strip()
def normalized(s):return ' '.join(s.split()).replace(',','')
def rate(s):
    if s.strip()=='*':return (None,None,None)
    m=re.fullmatch(r'([\d.]+)\s*\(([\d.]+),\s*([\d.]+)\)',s.strip())
    if not m:raise ValueError('Unknown rate encoding')
    value,lo,hi=map(D,m.groups())
    if not 0<=lo<=value<=hi:raise ValueError('Invalid source rate')
    return value,lo,hi

def load(path):
    raw=Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=PIN:raise ValueError('Archive hash mismatch')
    result={};cells=0;checked_rows=0
    with ZipFile(io.BytesIO(raw)) as z:
        manifest=json.loads(z.read('MANIFEST_SHA256.json'))
        if len(manifest)!=18:raise ValueError('Manifest count mismatch')
        for file,digest in manifest.items():
            if hashlib.sha256(z.read(file)).hexdigest()!=digest:raise ValueError('Manifest mismatch')
        for key,(state,stage) in SOURCES.items():
            parser=TableRows();text=z.read(f'originals/{key}.html').decode();parser.feed(text)
            if '2019-2023' not in text:raise ValueError('Period not confirmed')
            original={name(r[0]):r for r in parser.rows if r and ' County' in r[0]}
            extracted=list(csv.reader(io.StringIO(z.read(f'extracted/{key}_table_0.csv').decode('utf-8-sig'))))[1:]
            rows=[r for r in extracted if r and ' County' in r[0]]
            if len(original)!=len(rows):raise ValueError('Frame mismatch')
            for row in rows:
                county=name(row[0]);orig=original[county]
                if len(orig)!=len(row) or any(normalized(a)!=normalized(b) for a,b in zip(orig,row)):
                    raise ValueError('HTML/CSV disagreement')
                cells+=len(row);checked_rows+=1
                r=result.setdefault((state,county),{'state':state,'county':county,'geography':row[1]})
                if r['geography']!=row[1]:raise ValueError('Geography drift')
                r[stage+'_rate'],r[stage+'_lo'],r[stage+'_hi']=rate(row[2])
                r[stage+'_annual_count']=int(row[4].replace(',','')) if row[4].replace(',','').isdigit() else None
                if stage=='late':r['share']=D(row[5]) if row[5]!='*' else None
    if Counter(r['state'] for r in result.values())!={'MS':82,'TX':254}:raise ValueError('County frame incomplete')
    return list(result.values()),{'archive_sha256':PIN,'manifest_files_verified':18,
          'original_rows_replayed':checked_rows,'original_cells_matched':cells}

def summary(rows):
    complete=[r for r in rows if all(r[k] is not None for k in ('all_rate','late_rate','share'))]
    retained=[r for r in complete if r['late_annual_count']>=16]
    def profile(group):
        return {g:sum(r['geography']==g for r in group) for g in ('Urban','Rural')}
    def contrasts(group):
        near=[]
        for a,b in itertools.combinations(group,2):
            if abs(a['share']-b['share'])<=D('0.5'):
                near.append((a,b))
        large=[(a,b) for a,b in near if abs(a['late_rate']-b['late_rate'])>=D('5')]
        strict=[(a,b) for a,b in large if a['late_lo']>b['late_hi'] or b['late_lo']>a['late_hi']]
        return {'near_share_pairs':len(near),'large_rate_gap_pairs':len(large),
                'also_disjoint_marginal_intervals':len(strict),
                'unique_counties_in_large_gap_pairs':len({r['county'] for p in large for r in p}),
                'independent_pair_observations':False}
    return {'all_counties':len(rows),'complete_counties':len(complete),
       'incomplete_counties':len(rows)-len(complete),'all_geography':profile(rows),
       'complete_geography':profile(complete),'retained_annual_count_ge16':len(retained),
       'retained_geography':profile(retained),'complete_removed_by_annual_filter':len(complete)-len(retained),
       'unfiltered_contrasts':contrasts(complete),'filtered_contrasts':contrasts(retained),
       'filter_is_not_original_suppression_rule':True}

def run(archive,out):
    rows,receipt=load(archive)
    result={'schema':'chainweb-state-sensitivity-replay-v1','receipt':receipt,
        'by_state':{s:summary([r for r in rows if r['state']==s]) for s in ('MS','TX')},
        'limits':['Exploratory descriptive thresholds, not prespecified inferential testing.',
          'Annual count >=16 is not the disclosure rule of fewer than 16 cases across the full reporting period.',
          'Published average annual counts are rounded; no exact five-year case totals reconstructed.',
          'County-weighted coverage is not population-weighted access.',
          'Pairs share counties; no independence, causal effect or multiplicity-adjusted inference.',
          'Differences in retained samples cannot alone establish why state patterns differ.',
          'Original stage-denominator, age-harmonization and runtime-provenance questions remain open.'],
        'clinical_benefit_observed':False}
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    (out/'state_sensitivity_results.json').write_text(json.dumps(result,indent=2)+'\n')
    return result
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('archive');ap.add_argument('--out',required=True)
    args=ap.parse_args();print(json.dumps(run(args.archive,args.out),indent=2))
