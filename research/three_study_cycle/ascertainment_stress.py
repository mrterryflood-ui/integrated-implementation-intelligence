#!/usr/bin/env python3
"""Synthetic identification stress test: recorded diagnosis does not identify true prevalence.
No fitted parameters, clinical effect, or empirical population estimate.
"""
from __future__ import annotations
import argparse,json,math
from pathlib import Path

def reported_diagnosis(prevalence:float,sensitivity:float,specificity:float)->float:
    """P(reported positive)=Se*P(disease)+(1-Sp)*(1-P(disease))."""
    if any(not math.isfinite(x) or not 0<=x<=1 for x in (prevalence,sensitivity,specificity)):
        raise ValueError("All parameters must be finite probabilities")
    return prevalence*sensitivity+(1-specificity)*(1-prevalence)

def inverse_prevalence(observed:float,sensitivity:float,specificity:float)->float|None:
    """Only algebraic inverse conditional on externally known Se/Sp; not a prevalence estimate."""
    if any(not math.isfinite(x) or not 0<=x<=1 for x in (observed,sensitivity,specificity)):
        raise ValueError("Invalid probability")
    denominator=sensitivity+specificity-1
    if abs(denominator)<1e-12:return None
    value=(observed+specificity-1)/denominator
    return value if 0<=value<=1 else None

def stress_test(observed:float)->dict:
    if not 0<=observed<=1 or not math.isfinite(observed):raise ValueError("Invalid observed share")
    scenarios=[
        {"label":"perfect ascertainment","sensitivity":1.0,"specificity":1.0},
        {"label":"half of true cases recognized; no false positives","sensitivity":0.5,"specificity":1.0},
        {"label":"three quarters recognized; no false positives","sensitivity":0.75,"specificity":1.0},
        {"label":"low false-positive reporting, imperfect recognition","sensitivity":0.7,"specificity":0.99},
    ]
    rows=[]
    for s in scenarios:
        inferred=inverse_prevalence(observed,s["sensitivity"],s["specificity"])
        rows.append({**s,"conditional_prevalence":inferred,"reproduced_reported_share":reported_diagnosis(inferred,s["sensitivity"],s["specificity"]) if inferred is not None else None})
    return {"status":"SYNTHETIC_NONIDENTIFIABILITY_DEMONSTRATION","observed_reported_diagnosis":observed,"scenarios":rows,"causal_effect_established":False,"biological_prevalence_established":False,"warning":"Sensitivity and specificity are deliberately assumed, not measured. Conditional inverse values are not empirical prevalence or diagnosis accuracy estimates. The same reported share is consistent with multiple data-generating processes."}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--out",type=Path,required=True);a=ap.parse_args()
    a.out.mkdir(parents=True,exist_ok=True)
    results={"schema":"dis-ascertainment-stress-v1","studies":{name:stress_test(p/100) for name,p in (("endometriosis",6.2),("PCOS",8.7),("fibroids",7.8))}}
    (a.out/"synthetic_ascertainment.json").write_text(json.dumps(results,indent=2,allow_nan=False)+"\n")
    print(json.dumps({"status":"SYNTHETIC_ONLY","conditions":list(results["studies"]),"file":str(a.out/"synthetic_ascertainment.json")}))
if __name__=="__main__":main()
