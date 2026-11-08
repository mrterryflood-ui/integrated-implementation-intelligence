"""Independent-formula numerical cross-check, not independent-investigator replication."""
from fractions import Fraction as F
from pathlib import Path
import hashlib, json, math
root=Path(__file__).resolve().parent
fixtures=json.loads((root/'fixtures.json').read_text())
results=json.loads((root/'results/results.json').read_text())
for p,h in results['inputHashes'].items():
    assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h, f'Changed input: {p}'
def close(a,b):
    assert math.isclose(float(a),float(b),rel_tol=1e-12,abs_tol=1e-10), (a,b)
def slope(xs,ys):
    n=len(xs)
    return (n*sum(x*y for x,y in zip(xs,ys))-sum(xs)*sum(ys))/(n*sum(x*x for x in xs)-sum(xs)**2)
checked=0
for case,reported in zip(fixtures['pretrends'],results['pretrends']):
    assert case['id']==reported['id']
    out=reported['output']; inp=case['input']
    if case['expected'].get('state')=='INVALID_PANEL':
        assert out['state']=='INVALID_PANEL' and out['gapSlopePerYear'] is None
    else:
        a={r['year']:F(str(r['value'])) for r in inp['treated']['observations'] if r['year']<inp['interventionYear']}
        b={r['year']:F(str(r['value'])) for r in inp['comparator']['observations'] if r['year']<inp['interventionYear']}
        years=sorted(a.keys() & b.keys()); xs=[F(y) for y in years]
        gaps=[a[y]-b[y] for y in years]
        close(out['treatedSlopePerYear'],slope(xs,[a[y] for y in years]))
        close(out['comparatorSlopePerYear'],slope(xs,[b[y] for y in years]))
        close(out['gapSlopePerYear'],slope(xs,gaps))
        close(out['gapRange'],max(gaps)-min(gaps))
        n=len(xs); mx=sum(xs)/n; my=sum(gaps)/n; gs=slope(xs,gaps)
        rss=sum((g-my-gs*(x-mx))**2 for x,g in zip(xs,gaps))/n
        close(out['linearGapResidualRms'],math.sqrt(float(rss)))
    assert not out['parallelTrendsEstablished'] and not out['causalEffectEstablished']
    checked+=1
for case,reported in zip(fixtures['equity'],results['equity']):
    assert case['id']==reported['id']; out=reported['output']; cells=case['input']['cells']
    if case['expected']['overallChange'] is None:
        assert out['overallChange'] is None and out['state']==case['expected']['state']
    else:
        b=F(sum(c['baselineNumerator'] for c in cells),sum(c['baselineDenominator'] for c in cells))*100
        f=F(sum(c['followupNumerator'] for c in cells),sum(c['followupDenominator'] for c in cells))*100
        close(out['overallChange'],f-b)
        for c,g in zip(cells,out['groupChanges']):
            close(g['change'],100*(F(c['followupNumerator'],c['followupDenominator'])-F(c['baselineNumerator'],c['baselineDenominator'])))
    assert not out['equitableSuccessEstablished'] and not out['causalEffectEstablished']
    checked+=1
assert checked==9 and len(results['pretrends'])==5 and len(results['equity'])==4
print(f'PASS: {checked} synthetic scenarios cross-checked with Python rational arithmetic; source hashes match.')
