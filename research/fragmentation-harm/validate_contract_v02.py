"""Fail-closed comparability contract validator, schema 0.2. Python 3.11+; no dependencies.

Authored as an AI review by the DIS-RPLICE campaign loop (sprint 92, ledger item Q04).
Not qualified human scientific acceptance, not clinical acceptance, and no patient benefit
is claimed or implied. Companion contract: comparability-contract.v0.2.json.
Negative and positive fixtures: comparability-contract.v0.2.controls.json.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

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
ALLOWED_ENFORCEMENT = {"advisory", "strict"}
UNDISCLOSED_PREFIX = "UNDISCLOSED"


def _num(value) -> bool:
    try:
        return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
    except OverflowError:
        return False


def _tolerance(contract: dict) -> float:
    value = contract.get("share_rate_tolerance_pp")
    if not _num(value) or value <= 0:
        return 0.0
    return float(value)


def _text(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _sha256(value) -> bool:
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value) is not None


def _digest(value) -> str:
    """Canonical content binding, not a signature or proof that a source is true."""
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=False, allow_nan=False).encode()).hexdigest()


def comparison_digest(record: dict) -> str:
    """Bind the review to the complete record except its review and explanatory note."""
    payload = dict(record)
    evidence = dict(payload.get("stage_comparability") or {})
    evidence.pop("review", None)
    payload["stage_comparability"] = evidence
    payload.pop("stage_construct_equivalence_note", None)
    return _digest(payload)


def review_digest(review: dict) -> str:
    """Digest for a review already accepted outside this input document."""
    return _digest(review)


def assess_comparability(record: dict, accepted_review_sha256=None) -> dict:
    """Check source-linked mappings and arithmetic, keeping authority separate.

    This does not fetch/authenticate sources, establish reviewer identity, or infer
    scientific truth. The external pin is an operator trust decision about an
    already reviewed artifact; the contract cannot supply its own trust pin.
    Synthetic records can exercise consistency checks but cannot pass the claim gate.
    """
    result = {"evidence_status": "NOT_ESTABLISHED", "calculation_status": "NOT_REPRODUCED",
              "review_status": "NOT_ACCEPTED", "claim_gate": "BLOCKED", "errors": []}
    errors = result["errors"]
    if not isinstance(record, dict):
        errors.append("comparison must be an object")
        return result
    evidence = record.get("stage_comparability")
    if not isinstance(evidence, dict) or evidence.get("status") != "EVIDENCE_RECORDED":
        errors.append("structured stage_comparability evidence is not established; labels and notes do not establish equivalence")
        return result
    sites = record.get("sites")
    mappings = evidence.get("site_mappings")
    target = evidence.get("target")
    if not isinstance(sites, list) or len(sites) != 2 or not all(isinstance(s, dict) for s in sites):
        errors.append("reproduced comparison requires exactly two site objects")
        return result
    labels = [s.get("label") for s in sites]
    if not all(_text(label) for label in labels) or len(set(labels)) != len(labels):
        errors.append("site labels must be nonempty and unique")
        return result
    if not isinstance(target, dict) or not isinstance(mappings, list):
        errors.append("target and site_mappings are required")
        return result
    categories = {"localized", "regional", "distant", "unknown", "excluded"}
    late = target.get("late_stage_categories")
    if (not isinstance(late, list) or not late or not all(isinstance(x, str) for x in late)
            or len(set(late)) != len(late) or not set(late) <= {"regional", "distant"}):
        errors.append("target late_stage_categories must explicitly select regional and/or distant")
    denominator = target.get("denominator_policy")
    unknown = target.get("unknown_stage_policy")
    if not isinstance(denominator, str) or denominator not in {"all_eligible", "known_stage"}:
        errors.append("target denominator_policy must be all_eligible or known_stage")
    expected_unknown = "include_denominator" if denominator == "all_eligible" else "exclude_denominator"
    if unknown != expected_unknown:
        errors.append("unknown-stage policy must agree with the denominator")
    for key in ("case_definition", "population", "exclusions"):
        value = target.get(key)
        if key == "exclusions":
            if not isinstance(value, list) or not all(_text(x) for x in value) or len(set(value)) != len(value):
                errors.append("target exclusions must be an explicit unique list (empty is allowed)")
        elif not _text(value):
            errors.append("target requires " + key)
    if not isinstance(evidence.get("data_kind"), str) or evidence["data_kind"] not in {"observed", "synthetic"}:
        errors.append("data_kind must distinguish observed from synthetic evidence")
    if (len(mappings) != len(sites) or not all(isinstance(m, dict) for m in mappings)
            or sorted(str(m.get("site_label")) for m in mappings) != sorted(labels)):
        errors.append("site_mappings must cover each site exactly once")
        return result
    by_label = {m["site_label"]: m for m in mappings}
    definitions = record.get("dimensions", {})
    for key in ("case_definition", "population"):
        dimension = definitions.get(key) if isinstance(definitions, dict) else None
        if not isinstance(dimension, dict) or dimension.get("state") != "VALUED" or dimension.get("value") != target.get(key):
            errors.append("record dimension must agree with target " + key)
    periods = [s.get("period") for s in sites]
    if not all(_text(p) for p in periods) or len(set(periods)) != 1:
        errors.append("site periods must be disclosed and match")
    for site in sites:
        label = site["label"]
        mapping = by_label[label]
        provenance = site.get("stage_provenance")
        if not isinstance(provenance, dict):
            errors.append(label + " requires stage_provenance")
            continue
        if provenance.get("stage_variable_state") != "ATTESTED_PER_EXTRACT":
            errors.append(label + " stage variable requires ATTESTED_PER_EXTRACT evidence")
        for key, expected in (("stage_variable", provenance.get("stage_variable")),
                              ("stage_version", provenance.get("stage_version")),
                              ("source_release", provenance.get("release")),
                              ("period", site.get("period")),
                              ("stage_definition", site.get("stage_definition"))):
            if not _text(expected) or expected.strip().upper().startswith(UNDISCLOSED_PREFIX) or mapping.get(key) != expected:
                errors.append(label + " mapping must bind the disclosed " + key)
        if provenance.get("diagnosis_years") != site.get("period"):
            errors.append(label + " provenance diagnosis_years must match its period")
        for key in ("case_definition", "population", "denominator_policy", "unknown_stage_policy", "exclusions"):
            if mapping.get(key) != target.get(key):
                errors.append(label + " mapping disagrees with target " + key)
        refs = mapping.get("source_references")
        if not isinstance(refs, dict):
            errors.append(label + " requires definition and extract source references")
        else:
            for kind in ("definition", "extract"):
                ref = refs.get(kind)
                url = ref.get("url") if isinstance(ref, dict) else None
                try:
                    parts = urlsplit(url) if isinstance(url, str) else None
                    valid_url = bool(parts and parts.scheme == "https" and parts.hostname and not parts.username and not parts.password)
                except ValueError:
                    valid_url = False
                if not valid_url or not _sha256(ref.get("sha256") if isinstance(ref, dict) else None):
                    errors.append(label + " requires a source URL and SHA-256 for " + kind)
        codes = mapping.get("source_codes")
        crosswalk = mapping.get("category_mapping")
        if (not isinstance(codes, list) or not codes or not all(_text(c) for c in codes)
                or len(set(codes)) != len(codes) or not isinstance(crosswalk, dict)
                or set(crosswalk) != set(codes)
                or not all(isinstance(c, str) and c in categories for c in crosswalk.values())):
            errors.append(label + " category_mapping must cover every declared source code exactly once")
    if errors:
        return result
    result["evidence_status"] = "RECORDED_NOT_AUTHENTICATED"
    calculation = evidence.get("calculation")
    if not isinstance(calculation, dict) or calculation.get("status") != "REPRODUCED":
        errors.append("calculation is not reproduced from exact source category counts")
        return result
    rows = calculation.get("sites")
    if (not isinstance(rows, list) or len(rows) != 2 or not all(isinstance(row, dict) for row in rows)
            or sorted(str(row.get("site_label")) for row in rows) != sorted(labels)):
        errors.append("calculation must cover each site exactly once")
        return result
    shares = {}
    for row in rows:
        label = row["site_label"]
        mapping = by_label[label]["category_mapping"]
        counts = row.get("counts")
        if (row.get("count_basis") != "exact_source_counts" or not isinstance(counts, dict)
                or set(counts) != set(mapping)
                or not all(isinstance(n, int) and not isinstance(n, bool) and 0 <= n <= 2**53 - 1 for n in counts.values())):
            errors.append(label + " calculation needs exact nonnegative counts for every source code; reconstructed rounded totals are insufficient")
            continue
        numerator = sum(n for code, n in counts.items() if mapping[code] in late)
        total = sum(n for code, n in counts.items() if mapping[code] != "excluded" and
                    (denominator == "all_eligible" or mapping[code] != "unknown"))
        share = 100.0 * numerator / total if total else None
        if (not total or not _num(row.get("numerator")) or not _num(row.get("denominator"))
                or row.get("numerator") != numerator or row.get("denominator") != total
                or not _num(row.get("share_percent")) or abs(row["share_percent"] - share) > 1e-9):
            errors.append(label + " reproduced numerator, denominator or share does not reconcile")
        else:
            shares[label] = share
    difference = calculation.get("difference_pp")
    if len(shares) == 2 and (not _num(difference) or abs(difference - (shares[labels[0]] - shares[labels[1]])) > 1e-9):
        errors.append("difference_pp must equal the first site's share minus the second site's share")
    if errors:
        return result
    result["calculation_status"] = "REPRODUCED_FROM_DECLARED_COUNTS"
    review = evidence.get("review")
    if not isinstance(review, dict):
        errors.append("independent source-methods review is not recorded")
        return result
    if (review.get("decision") != "ACCEPTED_FOR_DESCRIPTIVE_COMPARISON"
            or review.get("reviewer_kind") != "qualified_human"
            or not all(_text(review.get(key)) for key in ("reviewer", "reviewer_role", "reviewed_at", "evidence_ref"))):
        errors.append("qualified human source-methods review must be recorded with its scope and evidence")
    try:
        reviewed_at = datetime.fromisoformat(review.get("reviewed_at", "").replace("Z", "+00:00"))
        if reviewed_at.tzinfo is None:
            raise ValueError("timezone absent")
    except (ValueError, TypeError, AttributeError):
        errors.append("reviewed_at must be an ISO timestamp with timezone")
    try:
        if review.get("comparison_sha256") != comparison_digest(record):
            errors.append("review is stale or not bound to this comparison specification and calculation")
    except (ValueError, TypeError):
        errors.append("comparison cannot be canonically bound")
    if errors:
        return result
    result["review_status"] = "RECORDED_NOT_AUTHENTICATED"
    if not _sha256(accepted_review_sha256) or accepted_review_sha256 != review_digest(review):
        errors.append("operator must supply the accepted review SHA-256 outside the contract")
    if evidence.get("data_kind") != "observed":
        errors.append("synthetic evidence cannot authorize a real-data comparison claim")
    if not errors:
        result["review_status"] = "MATCHES_OPERATOR_ACCEPTED_DIGEST"
        result["claim_gate"] = "EVIDENCE_GATE_PASSED"
    return result


def validate(contract: dict, strict_provenance=None, *, require_comparable=False,
             accepted_review_sha256=None) -> list[str]:
    errors: list[str] = []
    if not isinstance(contract, dict):
        return ["contract must be an object"]
    if contract.get("schema_version") != "0.2":
        errors.append("unexpected schema_version")
    dimensions = contract.get("required_dimensions")
    if not isinstance(dimensions, list) or len(dimensions) != len(DIMENSIONS) or set(dimensions) != set(DIMENSIONS):
        errors.append("required_dimensions must be exactly the 0.2 dimension set")
    tolerance = _tolerance(contract)
    if tolerance == 0.0:
        errors.append("share_rate_tolerance_pp must be a positive number")
    enforcement = contract.get("provenance_enforcement", "advisory")
    if not isinstance(enforcement, str) or enforcement not in ALLOWED_ENFORCEMENT:
        errors.append("provenance_enforcement must be one of: " + ", ".join(sorted(ALLOWED_ENFORCEMENT)))
        enforcement = "advisory"
    if strict_provenance is None:
        strict = enforcement == "strict"
    else:
        strict = bool(strict_provenance)
    tolerance_kind = contract.get("share_rate_tolerance_kind")
    if tolerance_kind is not None and (not isinstance(tolerance_kind, str) or not tolerance_kind.strip()):
        errors.append("share_rate_tolerance_kind must be a non-empty string when present")
    tolerance_basis = contract.get("share_rate_tolerance_basis")
    if tolerance_basis is not None and (not isinstance(tolerance_basis, str) or not tolerance_basis.strip()):
        errors.append("share_rate_tolerance_basis must be a non-empty string when present")
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
        # Display/record status cannot waive the explicit downstream claim gate.
        if require_comparable or (strict and status in {"PASS", "CONDITIONAL"}):
            assessment = assess_comparability(record, accepted_review_sha256)
            errors.extend(path + " " + error for error in assessment["errors"])
        if len(periods) > 1 and status in {"PASS", "CONDITIONAL"}:
            errors.append(path + " sites carry more than one period (" + ", ".join(sorted(periods)) + ") yet status is " + str(status))
    return errors


def main(argv: list[str]) -> int:
    paths: list[str] = []
    strict_override = None
    require_comparable = False
    accepted_review_sha256 = None
    for arg in argv[1:]:
        if arg == "--strict-provenance":
            strict_override = True
        elif arg == "--advisory-provenance":
            strict_override = False
        elif arg == "--require-comparable":
            require_comparable = True
        elif arg.startswith("--accepted-review-sha256="):
            accepted_review_sha256 = arg.split("=", 1)[1]
            if not _sha256(accepted_review_sha256):
                print("INVALID: accepted review SHA-256 must contain 64 lowercase hexadecimal characters", file=sys.stderr)
                return 2
        elif arg in {"-h", "--help"}:
            print("usage: validate_contract_v02.py [--strict-provenance|--advisory-provenance] [--require-comparable] [--accepted-review-sha256=HEX] [contract.json ...]")
            print("Default checks structure only; --require-comparable also requires source-linked mappings, reproduced arithmetic and an externally accepted review digest. A digest is not source/reviewer authentication or scientific truth.")
            return 0
        elif arg.startswith("-"):
            print("FAIL: unknown option", arg, file=sys.stderr)
            return 2
        else:
            paths.append(arg)
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
        errors = validate(contract, strict_override, require_comparable=require_comparable,
                          accepted_review_sha256=accepted_review_sha256)
        if errors:
            status = 1
            for error in errors:
                print("FAIL:", path, error, file=sys.stderr)
        else:
            print("STRUCTURE_VALID:", path, "contract 0.2; scientific comparability is a separate assessment")
        if isinstance(contract, dict) and isinstance(contract.get("records"), list):
            for record in contract["records"]:
                assessment = assess_comparability(record, accepted_review_sha256)
                label = record.get("comparison_id", "unnamed") if isinstance(record, dict) else "invalid"
                print(json.dumps({"comparison_id": label, **assessment}, sort_keys=True))
        print("LIMIT: consistency and arithmetic checks do not authenticate sources or reviewer identity, establish scientific truth, or authorize external publication.")
    return status


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
