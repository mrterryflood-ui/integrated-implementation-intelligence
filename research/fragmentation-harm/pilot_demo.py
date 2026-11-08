"""Reproducible descriptive pilot demonstration; no patient data or clinical claims."""
import json
from pathlib import Path
from chainweb import validate_edges, downstream_hypotheses
from validate_contract import validate as validate_contract

ROOT = Path(__file__).resolve().parent

def build_demo():
    contract = json.loads((ROOT / "comparability-contract.v0.1.json").read_text())
    graph = json.loads((ROOT / "chainweb-hypotheses.v0.1.json").read_text())
    if validate_contract(contract):
        raise ValueError("invalid comparability contract")
    if validate_edges(graph["edges"]):
        raise ValueError("invalid ChainWeb graph")
    pilot = next(x for x in contract["records"] if x["comparison_id"] == "hinds-harris-crc-2019-2023")
    a,b=pilot["late_stage_rate_per_100k"]
    x,y=pilot["late_stage_share_percent"]
    return {
        "demo_type":"aggregate_descriptive_calibration",
        "case":"hinds-harris-crc-2019-2023",
        "period":"2019-2023",
        "late_stage_incidence_rate_difference_per_100k":round(a-b,1),
        "late_stage_share_difference_percentage_points":round(x-y,1),
        "comparison_status":pilot["comparison_status"],
        "source_validation":"accepted prior archive reproduction; no new source download performed",
        "individual_missed_opportunities_observed":None,
        "clinical_harms_prevented_observed":None,
        "causal_harm_established":False,
        "hypothesized_downstream_edges":downstream_hypotheses(graph["edges"],"abnormal_screening_signal"),
        "decision":"request harmonized process-level follow-up evidence before intervention claims",
        "limitations":[
            "Ecological rates cannot establish individual-level missed follow-up",
            "Conditional late-stage share and age-adjusted late-stage incidence measure different quantities",
            "Registry definitions and footnotes require comparability adjudication",
            "Graph edges do not estimate causal effects or transferability"
        ]
    }

if __name__=="__main__":
    print(json.dumps(build_demo(),indent=2,sort_keys=True))
