"""Fail-closed comparability contract validator. Python 3.11+; no dependencies."""
from __future__ import annotations
import json
import sys
from pathlib import Path

ALLOWED = {"PASS", "CONDITIONAL", "FAIL", "UNKNOWN"}
LEVELS = {"descriptive", "associational", "causal_candidate", "causal_supported"}
REQUIRED = {"source_steward", "canonical_url", "source_sha256", "extraction_timestamp",
"registry_submission", "geography", "population", "numerator", "denominator",
"age_adjustment", "case_definition", "stage_definition", "period", "subgroup_coding",
"suppression", "uncertainty", "publication_latency", "decision_owner", "actionability"}

def validate(contract: dict) -> list[str]:
    errors = []
    if contract.get("schema_version") != "0.1":
        errors.append("unexpected schema_version")
    dimensions = contract.get("required_dimensions")
    if not isinstance(dimensions, list) or set(dimensions) != REQUIRED or len(dimensions) != len(REQUIRED):
        errors.append("required dimensions must match the versioned contract exactly")
    records = contract.get("records")
    if not isinstance(records, list) or not records:
        return errors + ["records must be nonempty"]
    ids = set()
    for i, rec in enumerate(records):
        p = f"records[{i}]"
        if not isinstance(rec, dict):
            errors.append(p + " must be an object")
            continue
        rid = rec.get("comparison_id")
        if not isinstance(rid, str) or not rid.strip() or rid in ids:
            errors.append(p + " missing/duplicate comparison_id")
        ids.add(rid)
        if rec.get("comparison_status") not in ALLOWED:
            errors.append(p + " invalid comparison_status")
        if rec.get("claim_level") not in LEVELS:
            errors.append(p + " invalid claim_level")
        if rec.get("causal_harm_established") is not False:
            errors.append(p + " cannot assert causal harm in this unvalidated pilot")
        if rec.get("claim_level") == "causal_supported":
            errors.append(p + " causal_supported requires separate adjudicated evidence")
        if rec.get("comparison_status") in {"FAIL", "UNKNOWN"} and rec.get("claim_level") != "descriptive":
            errors.append(p + " unapproved comparisons cannot support inferential claims")
        if not isinstance(rec.get("reason"), str) or not rec["reason"].strip():
            errors.append(p + " requires a reason")
        if not isinstance(rec.get("sources"), list) or len(rec["sources"]) < 2:
            errors.append(p + " requires two sources")
        for field in ("all_stage_rate_per_100k", "late_stage_rate_per_100k", "late_stage_share_percent"):
            if field in rec:
                values = rec[field]
                if not isinstance(values, list) or len(values) != 2 or any(
                    isinstance(v, bool) or not isinstance(v, (int, float)) or v < 0 for v in values
                ):
                    errors.append(p + " invalid " + field)
                elif field == "late_stage_share_percent" and any(v > 100 for v in values):
                    errors.append(p + " share exceeds 100%")
    return errors

def main() -> int:
    path = Path(__file__).with_name("comparability-contract.v0.1.json")
    errors = validate(json.loads(path.read_text(encoding="utf-8")))
    if errors:
        for e in errors:
            print("FAIL:", e, file=sys.stderr)
        return 1
    print("PASS: comparability contract structural and claim-safety gates")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
