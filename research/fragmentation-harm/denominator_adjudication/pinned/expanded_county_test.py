"""Exploratory measurement stress test from immutable public aggregate originals.
No patient records, clinical recommendation, causal effect, or new screening age.
Python 3.11+ standard library only. Scope: all counties in the retained MS/TX tables.
"""
from __future__ import annotations
import argparse, csv, hashlib, io, itertools, json, re
from collections import Counter
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZipFile

EXPECTED_ZIP_SHA256 = 'ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a'
SOURCE_MAP = {'hinds_all':('MS','All Stages'), 'hinds_late':('MS','Late Stage'),
              'harris_all':('TX','All Stages'), 'harris_late':('TX','Late Stage')}
# Exploratory, specified before this expanded analysis; no equivalence or power claim.
SHARE_WINDOWS_PP = (Decimal('0.3'), Decimal('0.5'), Decimal('1.0'))
RATE_GAP = Decimal('5.0')

class RowParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows=[]; self.row=None; self.cell=None; self.parts=[]
    def handle_starttag(self, tag, attrs):
        if tag=='tr': self.row=[]
        elif tag in ('td','th') and self.row is not None:
            self.cell=tag; self.parts=[]
    def handle_data(self, data):
        if self.cell: self.parts.append(data)
    def handle_endtag(self, tag):
        if tag in ('td','th') and self.cell:
            self.row.append(' '.join(''.join(self.parts).split())); self.cell=None
        elif tag=='tr' and self.row is not None:
            if self.row: self.rows.append(self.row)
            self.row=None; self.cell=None

def rate(cell):
    m=re.fullmatch(r'([\d.]+)\s*\(\s*([\d.]+),\s*([\d.]+)\s*\)',cell)
    if not m:
        if cell.strip()=='*': return None
        raise ValueError('Unexpected rate cell: '+cell)
    vals=tuple(Decimal(s) for s in m.groups())
    if not 0 <= vals[1] <= vals[0] <= vals[2]: raise ValueError('Invalid rate interval')
    return vals

def name(cell):
    return re.sub(r'\s+\d+$','',cell).strip()

def load_counties(path):
    raw=Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=EXPECTED_ZIP_SHA256: raise ValueError('Archive hash mismatch')
    county={}; sources={}; checked_cells=0; checked_rows=0
    with ZipFile(io.BytesIO(raw)) as z:
        m=json.loads(z.read('MANIFEST_SHA256.json'))
        if set(z.namelist()) != set(m)|{'MANIFEST_SHA256.json','readiness.json'}:
            raise ValueError('Unexpected archive membership')
        for p,digest in m.items():
            if hashlib.sha256(z.read(p)).hexdigest()!=digest: raise ValueError('Manifest mismatch: '+p)
        receipt=json.loads(z.read('acquisition_receipt.json'))
        receipt_sources={s['id']:s for s in receipt['sources']}
        for key,(state,stage) in SOURCE_MAP.items():
            blob=z.read(f'originals/{key}.html'); text=blob.decode('utf-8')
            digest=hashlib.sha256(blob).hexdigest()
            if receipt_sources[key]['sha256']!=digest: raise ValueError('Acquisition mismatch')
            flat=' '.join(re.sub(r'<[^>]*>',' ',text).split())
            if not re.search(r'Colon\s*&\s*Rectum\s*\('+stage+r'\^?\),\s*2019-2023',flat):
                raise ValueError('Observation/cancer/stage mismatch')
            if 'All Races (includes Hispanic), Both Sexes, All Ages' not in flat:
                raise ValueError('Population definition not admitted')
            parser=RowParser(); parser.feed(text)
            original={name(r[0]):r for r in parser.rows if r and ' County' in r[0]}
            rows=list(csv.reader(io.StringIO(z.read(f'extracted/{key}_table_0.csv').decode('utf-8-sig'))))[1:]
            selected=[r for r in rows if r and ' County' in r[0]]
            if len(original)!=len(selected): raise ValueError('Original/CSV county frame mismatch')
            for r in selected:
                nm=name(r[0]); o=original[nm]
                # Independent all-field extraction concordance; commas in count are cosmetic.
                if len(o)!=len(r): raise ValueError('Column count mismatch')
                for j,(a,b) in enumerate(zip(o,r)):
                    if ' '.join(a.split()).replace(',','')!=' '.join(b.split()).replace(',',''):
                        raise ValueError(f'Cell mismatch {key} {nm} column {j}: {a!r} != {b!r}')
                    checked_cells+=1
                checked_rows+=1
                rec=county.setdefault((state,nm),{'state':state,'county':nm,'ruralurban':r[1]})
                if rec['ruralurban']!=r[1]: raise ValueError('Geography covariate mismatch')
                v=rate(r[2]); prefix='all' if stage=='All Stages' else 'late'
                rec[prefix+'_rate']=v[0] if v else None
                rec[prefix+'_lo']=v[1] if v else None
                rec[prefix+'_hi']=v[2] if v else None
                rec[prefix+'_count']=int(r[4].replace(',','')) if r[4].replace(',','').isdigit() else None
                if stage=='Late Stage': rec['share']=None if r[5]=='*' else Decimal(r[5])
                else: rec['trend_label']=r[5]; rec['trend_cell']=r[6]
            sources[key]={'source_sha256':digest,'url':receipt_sources[key]['url'],
                          'county_rows':len(selected),'period':'2019-2023',
                          'stage_definition': 'all' if stage=='All Stages' else ['regional','distant']}
    expected={'MS':82,'TX':254}
    if dict(Counter(r['state'] for r in county.values()))!=expected: raise ValueError('County frame incomplete')
    return list(county.values()),{'archive_sha256':EXPECTED_ZIP_SHA256,'manifest_entries_checked':len(m),
        'original_county_rows_compared_with_csv':checked_rows,'original_cells_compared_with_csv':checked_cells,
        'acquisition_revision':receipt['revision'],'revision_lineage_adjudicated':False,'sources':sources}

def complete(r): return all(r.get(k) is not None for k in ('all_rate','late_rate','share'))

def pairs_for(rows, window):
    pairs=[]
    for a,b in itertools.combinations(rows,2):
        d=abs(a['share']-b['share'])
        if d <= window:
            gap=abs(a['late_rate']-b['late_rate'])
            pairs.append({'county_a':a['county'],'county_b':b['county'],
                          'state_a':a['state'],'state_b':b['state'],
                          'share_gap_pp':d,'late_rate_gap_per_100k':gap,
                          'rate_gap_at_least_5':gap>=RATE_GAP,
                          'rounding_robust_both_criteria':d+Decimal('0.1')<=window and gap-Decimal('0.1')>=RATE_GAP,
                          'published_rate_intervals_disjoint':a['late_lo']>b['late_hi'] or b['late_lo']>a['late_hi'],
                          'both_late_annual_counts_at_least_16':min(a['late_count'],b['late_count'])>=16})
    return pairs

def summarize(rows):
    result={'frame_counties':len(rows),'complete_counties':sum(complete(r) for r in rows),
            'incomplete_counties':sum(not complete(r) for r in rows),'by_geography':{},'share_window_tests':{}}
    for g in ('Rural','Urban'):
        rr=[r for r in rows if r['ruralurban']==g]
        result['by_geography'][g]={'total':len(rr),'complete':sum(complete(r) for r in rr),
                                     'incomplete':sum(not complete(r) for r in rr)}
    cc=[r for r in rows if complete(r)]
    for w in SHARE_WINDOWS_PP:
        pp=pairs_for(cc,w); big=[p for p in pp if p['rate_gap_at_least_5']]
        result['share_window_tests'][str(w)]={'near_share_pairs':len(pp),
            'late_rate_gap_at_least_5_pairs':len(big),
            'also_disjoint_marginal_rate_intervals':sum(p['published_rate_intervals_disjoint'] for p in big),
            'also_both_annual_late_counts_ge16':sum(p['both_late_annual_counts_at_least_16'] for p in big),
            'also_both_counts_ge16_and_disjoint_intervals':sum(p['both_late_annual_counts_at_least_16'] and p['published_rate_intervals_disjoint'] for p in big),
            'rounding_robust_both_criteria':sum(p['rounding_robust_both_criteria'] for p in pp)}
    return result

def jsonable(x):
    if isinstance(x,Decimal): return float(x)
    if isinstance(x,dict): return {k:jsonable(v) for k,v in x.items()}
    if isinstance(x,(list,tuple)): return [jsonable(v) for v in x]
    return x

def run(path,out):
    rows,provenance=load_counties(path); out=Path(out);out.mkdir(parents=True,exist_ok=True)
    report={'schema':'chainweb-expanded-county-stress-test-v1','analysis_type':'exploratory_archived_public_aggregate_reanalysis',
            'provenance':provenance,'primary_comparisons':'within-state; not independent pairs',
            'hypothesis':'Near-equal late-stage case shares need not imply similar population late-stage rates.',
            'thresholds_exploratory':True,'no_equivalence_or_causal_test':True,
            'by_state':{s:summarize([r for r in rows if r['state']==s]) for s in ('MS','TX')},
            'coverage_all_counties':summarize(rows)['by_geography'],
            'limits':['Shared surveillance lineage is not independent corroboration.',
                      'Within-state descriptive comparison does not establish identical age/case mix or mechanisms.',
                      'No stage-share uncertainty supplied; near point estimates are not equivalence.',
                      'Pairs share counties; disjoint marginal intervals are not multiplicity-adjusted inference.',
                      'Suppression is not zero; rural/urban coverage is county-weighted, not population-weighted.',
                      'No symptom timing, individual outcomes, early:late ratio, prevention effect, or optimal starting age is estimated.',
                      'Regional plus distant stage is not interchangeable with distant-only stage.']}
    report=jsonable(report)
    (out/'expanded_county_results.json').write_text(json.dumps(report,indent=2,allow_nan=False)+'\n')
    with (out/'county_extract.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(jsonable(rows))
    pp=[]
    for s in ('MS','TX'):
        pp.extend(pairs_for([r for r in rows if r['state']==s and complete(r)],Decimal('0.5')))
    with (out/'within_state_near_share_pairs.csv').open('w',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(pp[0]));writer.writeheader();writer.writerows(jsonable(pp))
    print(json.dumps(report,indent=2))
    return report

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('archive');ap.add_argument('--out',required=True)
    a=ap.parse_args();run(a.archive,a.out)

