"""Fail-closed comparability contract validator, schema 0.2. Python 3.11+; no dependencies.

Authored as an AI review by the DIS-RPLICE campaign loop (sprint 92, ledger item Q04).
Not qualified human scientific acceptance, not clinical acceptance, and no patient benefit
is claimed or implied. Companion contract: comparability-contract.v0.2.json.
Negative and positive fixtures: comparability-contract.v0.2.controls.json.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ALLOWED = {"PASS", "CONDITIONAL", "FAIL", "UNKNOWN"}
LEVELS = ["descriptive", "associational", "causal_candidate", "causal_supported"]
LEVEL_RANK = {name: rank for rank, name in enumerate(LEVELS)}
DIMENSIONS = [
    "source_steward", "canonical_url", "source_sha256", "extraction_timestamp",
    "registry_submission", "geography", "population", "numerator", "denominator",
    "age_adjustment", "case_definition", "stage_definition", "period", "subgroup_coding",
    "suppression", "uncertainty", "publication_latency", "decision_owner", "actionability",
    "follow_up_completion_after_abnormal_test",
]
STATES = {"VALUED", "UNKNOWN", "NOT_APPLICABLE"}
SHARE_CONSTRUCTS = {"case_proportion", "age_weighted_rate_ratio_W"}
RATE_FIELDS = ("all_stage_rate_per_100k", "late_stage_rate_per_100k")


def _num(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _tolerance(contract: dict) -> float:
    value = contract.get("share_rate_tolerance_pp")
    if not _num(value) or value <= 0:
        return 0.0
    return float(value)


def validate(contract: dict) -> list[str]:
    errors: list[str] = []
    if contract.get("schema_version") != "0.2":
        errors.append("unexpected schema_version")
    dimensions = contract.get("required_dimensions")
    if not isinstance(dimensions, list) or len(dimensions) != len(DIMENSIONS) or set(dimensions) != set(DIMENSIONS):
        errors.append("required_dimensions must be exactly the 0.2 dimension set")
    tolerance = _tolerance(contract)
    if tolerance == 0.0:
        errors.append("share_rate_tolerance_pp must be a positive number")
    ceiling = contract.get("status_claim_ceiling")
    if not isinstance(ceiling, dict):
        errors.append("status_claim_ceiling must be an object")
        ceiling = {}
    records = contract.get("records")
    if not isinstance(records, list) or not records:
        return errors + ["records must be nonempty"]

    ids: set[str] = set()
    for index, record in enumerate(records):
        path = "records[" + str(index) + "]"
        if not isinstance(record, dict):
            errors.append(path + " must be an object")
            continue
        rid = record.get("comparison_id")
        if not isinstance(rid, str) or not rid.strip() or rid in ids:
            errors.append(path + " missing/duplicate comparison_id")
        if isinstance(rid, str):
            ids.add(rid)
        status = record.get("comparison_status")
        level = record.get("claim_level")
        if status not in ALLOWED:
            errors.append(path + " invalid comparison_status")
        if level not in LEVEL_RANK:
            errors.append(path + " invalid claim_level")
        if record.get("causal_harm_established") is not False:
            errors.append(path + " cannot assert causal harm in this unvalidated pilot")
        if level == "causal_supported":
            errors.append(path + " causal_supported requires separate adjudicated evidence")
        if status in ALLOWED and level in LEVEL_RANK and status in ceiling:
            cap = ceiling[status]
            if cap not in LEVEL_RANK:
                errors.append(path + " status_claim_ceiling has an invalid level for " + str(status))
            elif LEVEL_RANK[level] > LEVEL_RANK[cap]:
                errors.append(path + " claim_level " + level + " exceeds the ceiling " + cap + " for status " + status)
        if not isinstance(record.get("reason"), str) or not record["reason"].strip():
            errors.append(path + " requires a reason")
        if not isinstance(record.get("sources"), list) or len(record["sources"]) < 2:
            errors.append(path + " requires two sources")

        record_dimensions = record.get("dimensions")
        if not isinstance(record_dimensions, dict):
            errors.append(path + " dimensions must be an object")
            record_dimensions = {}
        else:
            missing = [key for key in DIMENSIONS if key not in record_dimensions]
            if missing:
                errors.append(path + " dimensions missing: " + ",".join(sorted(missing)))
            extra = [key for key in record_dimensions if key not in DIMENSIONS]
            if extra:
                errors.append(path + " dimensions not in the 0.2 set: " + ",".join(sorted(extra)))
            for key in DIMENSIONS:
                entry = record_dimensions.get(key)
                if entry is None:
                    continue
                if not isinstance(entry, dict):
                    errors.append(path + " dimension " + key + " must be an object")
                    continue
                if entry.get("state") not in STATES:
                    errors.append(path + " dimension " + key + " has no valid state")
                if not isinstance(entry.get("why"), str) or not entry["why"].strip():
                    errors.append(path + " dimension " + key + " requires a reason")
                if entry.get("state") == "VALUED":
                    value = entry.get("value")
                    if value is None or (isinstance(value, str) and not value.strip()):
                        errors.append(path + " dimension " + key + " is VALUED but carries no value")

        sites = record.get("sites")
        if not isinstance(sites, list) or len(sites) < 2:
            errors.append(path + " requires at least two sites")
            sites = []
        periods: set[str] = set()
        for site_index, site in enumerate(sites):
            node = path + ".sites[" + str(site_index) + "]"
            if not isinstance(site, dict):
                errors.append(node + " must be an object")
                continue
            if not isinstance(site.get("label"), str) or not site["label"].strip():
                errors.append(node + " requires a label")
            period = site.get("period")
            carries_numbers = any(field in site for field in RATE_FIELDS) or "late_stage_share_percent" in site
            if isinstance(period, str) and period.strip():
                periods.add(period)
            elif carries_numbers:
                errors.append(node + " carries a rate or share but no period")
            elif period is not None:
                errors.append(node + " invalid period")
            for field in RATE_FIELDS:
                if field in site and not (_num(site[field]) and site[field] >= 0):
                    errors.append(node + " invalid " + field)
            share = site.get("late_stage_share_percent")
            if share is not None:
                if not (_num(share) and 0 <= share <= 100):
                    errors.append(node + " invalid late_stage_share_percent")
                elif site.get("share_construct") not in SHARE_CONSTRUCTS:
                    errors.append(node + " late_stage_share_percent requires a share_construct")
                elif all(_num(site.get(field)) for field in RATE_FIELDS) and tolerance > 0:
                    all_stage = float(site["all_stage_rate_per_100k"])
                    if all_stage <= 0:
                        errors.append(node + " all_stage_rate_per_100k must be positive")
                    else:
                        implied = 100.0 * float(site["late_stage_rate_per_100k"]) / all_stage
                        gap = abs(float(share) - implied)
                        if gap > tolerance:
                            if site["share_construct"] == "age_weighted_rate_ratio_W":
                                errors.append(node + " W does not reconcile with the rate pair, gap " + format(gap, ".4f") + " pp exceeds tolerance")
                            else:
                                explained = record.get("share_rate_gap_explained") is True
                                note = record.get("share_rate_gap_note")
                                if not explained or not isinstance(note, str) or not note.strip():
                                    errors.append(node + " share/rate gap of " + format(gap, ".4f") + " pp is unexplained")
            ci = site.get("late_stage_ci")
            if ci is not None and (not isinstance(ci, list) or len(ci) != 2 or not all(_num(x) for x in ci)):
                errors.append(node + " invalid late_stage_ci")
            stage_definition = record_dimensions.get("stage_definition")
            if isinstance(stage_definition, dict) and stage_definition.get("state") == "UNKNOWN":
                if not isinstance(site.get("stage_definition"), str) or not site["stage_definition"].strip():
                    errors.append(node + " record-level stage_definition is UNKNOWN, so the site must name its stage definition")
        if len(periods) > 1 and status in {"PASS", "CONDITIONAL"}:
            errors.append(path + " sites carry more than one period (" + ", ".join(sorted(periods)) + ") yet status is " + str(status))
    return errors


def main(argv: list[str]) -> int:
    paths = argv[1:]
    if not paths:
        paths = [str(Path(__file__).with_name("comparability-contract.v0.2.json"))]
    status = 0
    for path in paths:
        try:
            contract = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print("FAIL:", path, "unreadable:", exc, file=sys.stderr)
            status = 1
            continue
        errors = validate(contract)
        if errors:
            status = 1
            for error in errors:
                print("FAIL:", path, error, file=sys.stderr)
        else:
            print("PASS:", path, "comparability contract 0.2 dimension, construct and claim gates")
    return status


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
