"""Independent arithmetic audit of PUBLISHED aggregates. No synthetic cases or clinical inference.

Sources: accepted archival 2019-2023 county baseline in issue #81, NCI
State Cancer Profiles construct definitions, and peer-reviewed published counts.
The audit intentionally does NOT identify individual outcomes or causal effects.
"""
from __future__ import annotations

import json
from decimal import Decimal, ROUND_HALF_UP


BASELINE = {
    "Hinds": {"all_stage_rate": "46.4", "late_stage_rate": "29.9", "late_stage_percent": "63.7"},
    "Harris": {"all_stage_rate": "38.0", "late_stage_rate": "23.9", "late_stage_percent": "63.4"},
}
D = Decimal
ONE_DECIMAL_HALF_UNIT = D("0.05")


def pct(numerator: str | int, denominator: str | int) -> Decimal:
    den = D(str(denominator))
    if den <= 0:
        raise ValueError("denominator must be positive")
    return D("100") * D(str(numerator)) / den


def rounding_ratio_range(numerator: str, denominator: str) -> tuple[Decimal, Decimal]:
    """Extremal ratio consistent with separately rounded one-decimal positive rates."""
    n, d = D(numerator), D(denominator)
    h = ONE_DECIMAL_HALF_UNIT
    if n < h or d <= h:
        raise ValueError("rates must exceed the rounding half-unit")
    return pct(n - h, d + h), pct(n + h, d - h)


def stage_rate_audit() -> dict:
    rows = {}
    for county, r in BASELINE.items():
        ratio = pct(r["late_stage_rate"], r["all_stage_rate"])
        lower, upper = rounding_ratio_range(r["late_stage_rate"], r["all_stage_rate"])
        share = D(r["late_stage_percent"])
        share_lo, share_hi = share - ONE_DECIMAL_HALF_UNIT, share + ONE_DECIMAL_HALF_UNIT
        rows[county] = {
            "stage_share_published_percent": float(share),
            "ratio_of_age_adjusted_rates_percent": round(float(ratio), 4),
            "rate_ratio_rounding_bounds_percent": [round(float(lower), 4), round(float(upper), 4)],
            "reported_stage_share_rounding_bounds_percent": [round(float(share_lo), 4), round(float(share_hi), 4)],
            "rounding_alone_sufficient": not (upper < share_lo or lower > share_hi),
            "recorded_constructs_distinct": True,
        }
    all_diff = D(BASELINE["Hinds"]["all_stage_rate"]) - D(BASELINE["Harris"]["all_stage_rate"])
    late_diff = D(BASELINE["Hinds"]["late_stage_rate"]) - D(BASELINE["Harris"]["late_stage_rate"])
    share_diff = D(BASELINE["Hinds"]["late_stage_percent"]) - D(BASELINE["Harris"]["late_stage_percent"])
    return {
        "archive_period": "2019-2023",
        "source_status": "previously_archived_not_refetched_this_run",
        "source_definitions": "NCI State Cancer Profiles: percent of cases vs age-adjusted rates",
        "hinds_minus_harris_all_stage_per_100k": float(all_diff),
        "hinds_minus_harris_late_stage_per_100k": float(late_diff),
        "hinds_minus_harris_stage_share_percentage_points": float(share_diff),
        "late_stage_rate_ratio_hinds_harris": round(
            float(D(BASELINE["Hinds"]["late_stage_rate"]) / D(BASELINE["Harris"]["late_stage_rate"])),4),
        "all_stage_rate_ratio_hinds_harris": round(
            float(D(BASELINE["Hinds"]["all_stage_rate"]) / D(BASELINE["Harris"]["all_stage_rate"])),4),
        "counties": rows,
        "statistical_equivalence_established": False,
        "causal_effect_identified": False,
    }


def publication_count_checks() -> dict:
    """Proportions recalculated from published, study-specific counts; NOT pooled."""
    return {
        "hoopes_2021_registry_cases_with_no_ehr_cancer_history_percent":
            round(float(pct(23616, 51977)), 4),
        "hoopes_2021_registry_cases_with_ehr_history_percent":
            round(float(pct(51977 - 23616, 51977)),4),
        "thompson_2020_episode_ehr_capture_of_regional_cases_percent":
            round(float(pct(10659, 41165)),4),
        "escaron_2022_ehr_query_complete_as_reported_percent":
            round(float(pct(93,324)),4),
        "escaron_2022_multi_source_12_month_complete_as_reported_percent":
            round(float(pct(108,324)),4),
        "escaron_2022_additional_documented_completion_percentage_points":
            round(float(pct(108 - 93,324)),4),
        "escaron_time_horizon_warning": "source timing internally inconsistent; do not pool as an effect",
        "different_denominators_not_pooled": True,
        "clinical_effect_identified": False,
    }


def audit() -> dict:
    return {"schema_version":"1.0", "audit_type":"published_aggregate_reanalysis",
            "stage_measures":stage_rate_audit(), "published_counts":publication_count_checks(),
            "patient_level_data_used":False,
            "scope_excluded":["causal health effects", "independent source file refresh",
                              "Hinds/Harris service utilization estimates", "policy impact"]}


if __name__ == "__main__":
    print(json.dumps(audit(), sort_keys=True, indent=2))
