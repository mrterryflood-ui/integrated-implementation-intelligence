"""Conditional cross-source referral reconciliation for Escaron 2022, DOI 10.1177/21501319221138423.

The publication reports 80.9% GI referral among 324 abnormal FITs, but chart
abstraction of a selected 231 EHR-query-negative subgroup assigns 79 cases
to 'no referral.' These are distinct evidence sources; without identical
definition/time/source-level linkage no event-level misclassification is proven.
"""
from decimal import Decimal
import json


def escaron_referral_reconciliation():
    total = 324
    reported_referral_percent = Decimal("80.9")
    # All integer counts that round to the published 1-decimal rate.
    candidate_counts = [x for x in range(total+1)
                        if (Decimal(100)*Decimal(x)/Decimal(total))
                            .quantize(Decimal("0.1")) == reported_referral_percent]
    if not candidate_counts:
        raise AssertionError("published referral percentage cannot match integer count")
    no_referral_chart_subgroup = 79
    chart_reviewed_subset = 231
    hypothetical_max_referred_if_equal_definition = total - no_referral_chart_subgroup
    nominal_incompatibility_min = min(candidate_counts) - hypothetical_max_referred_if_equal_definition
    return {
        "source": "Escaron_2022_FQHC",
        "total_positive_fit": total,
        "published_referred_percent": float(reported_referral_percent),
        "referral_n_consistent_with_rounding": candidate_counts,
        "ehr_negative_chart_reviewed_n": chart_reviewed_subset,
        "chart_cases_no_referral_documented": no_referral_chart_subgroup,
        "hypothetical_max_referred_if_equal_definitions": hypothetical_max_referred_if_equal_definition,
        "hypothetical_minimum_count_discordance_if_same_definition_time_and_source": nominal_incompatibility_min,
        "definitions_and_time_windows_adjudicated": False,
        "record_level_error_confirmed": False,
        "finding_status": "CONDITIONAL_RECONCILIATION_FAILURE",
        "required_resolution": [
            "confirm whether overall referral rate and chart codes share event definition",
            "compare observation windows and referral-source coverage",
            "resolve patient overlap without identifying patients in public output",
            "distinguish referral ordered, authorized, delivered, attended, and GI consultation"
        ],
    }


if __name__ == "__main__":
    print(json.dumps(escaron_referral_reconciliation(),sort_keys=True,indent=2))
