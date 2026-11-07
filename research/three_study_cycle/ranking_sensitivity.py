#!/usr/bin/env python3
"""Sensitivity of state-order reversals to reported rounding and rate uncertainty.

This is descriptive. State-level percent-late uncertainty intervals are not in
the source table. The 'rounding-stable' category is NOT a statistically
significant or causally meaningful reversal.
"""
from __future__ import annotations
import argparse,itertools,json,math
from pathlib import Path
import pandas as pd

CANCERS=("colorectal","lung","breast")
def interval_order(a:float,b:float,delta:float)->int:
    """Return certain strict order under independent +/- delta rounding."""
    if not all(math.isfinite(x) for x in (a,b,delta)) or delta<0:raise ValueError("Invalid interval")
    if a-delta>b+delta+1e-12:return 1
    if b-delta>a+delta+1e-12:return -1
    return 0

def ci_order(a_lo:float,a_hi:float,b_lo:float,b_hi:float)->int:
    if not all(math.isfinite(x) for x in (a_lo,a_hi,b_lo,b_hi)) or a_lo>a_hi or b_lo>b_hi:raise ValueError("Invalid confidence interval")
    if a_lo>b_hi:return 1
    if b_lo>a_hi:return -1
    return 0

def audit(frame:pd.DataFrame,rate_half_unit:float=.05,share_half_unit:float=.05)->dict:
    if len(frame)!=50 or frame.geography.nunique()!=50:raise ValueError("Exactly 50 unique state rows required")
    result={"schema":"dis-ranking-reversal-sensitivity-v1","n_states":50,"rate_rounding_half_unit":rate_half_unit,"share_rounding_half_unit":share_half_unit,"conditions":{},"interpretation":"Rounding-stable ordering is descriptive, not statistically significant. Rate confidence intervals are marginal, not simultaneous; percent-late confidence intervals unavailable. Nonoverlap is conservative for each pair but does not adjust for multiple comparisons or shared estimation.","causal_effect_established":False,"policy_allocation_validated":False}
    for cancer in CANCERS:
        required=[cancer+x for x in ("_rate","_share","_rate_lo","_rate_hi")]
        if any(k not in frame for k in required):raise ValueError("Missing measurement "+cancer)
        if frame[required].isna().any().any():raise ValueError("Missing value "+cancer)
        count={"total_pairs":0,"point_reversals":0,"point_ties":0,"rounding_stable_reversals":0,"rounding_indeterminate_point_reversals":0,"rate_ci_nonoverlap_among_rounding_stable_reversals":0,"rate_ci_overlap_among_rounding_stable_reversals":0}
        for i,j in itertools.combinations(range(50),2):
            a,b=frame.iloc[i],frame.iloc[j];count["total_pairs"]+=1
            rv=float(a[cancer+"_rate"])-float(b[cancer+"_rate"])
            sv=float(a[cancer+"_share"])-float(b[cancer+"_share"])
            if rv==0 or sv==0:count["point_ties"]+=1;continue
            if rv*sv>=0:continue
            count["point_reversals"]+=1
            rate_order=interval_order(float(a[cancer+"_rate"]),float(b[cancer+"_rate"]),rate_half_unit)
            share_order=interval_order(float(a[cancer+"_share"]),float(b[cancer+"_share"]),share_half_unit)
            if rate_order==0 or share_order==0 or rate_order==share_order:
                count["rounding_indeterminate_point_reversals"]+=1;continue
            count["rounding_stable_reversals"]+=1
            ci=ci_order(float(a[cancer+"_rate_lo"]),float(a[cancer+"_rate_hi"]),float(b[cancer+"_rate_lo"]),float(b[cancer+"_rate_hi"]))
            count["rate_ci_nonoverlap_among_rounding_stable_reversals" if ci else "rate_ci_overlap_among_rounding_stable_reversals"]+=1
        if count["point_reversals"]!=count["rounding_stable_reversals"]+count["rounding_indeterminate_point_reversals"]:raise AssertionError("Reversal partition failed")
        result["conditions"][cancer]=count
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--input",type=Path,required=True);ap.add_argument("--out",type=Path,required=True);args=ap.parse_args()
    result=audit(pd.read_csv(args.input));args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    print(json.dumps(result,allow_nan=False))
if __name__=="__main__":main()
