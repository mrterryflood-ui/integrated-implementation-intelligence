"""Causal comparator audit: actual positive-FIT navigation randomization (PRECISE).

Coronado et al., Ann Intern Med 2025; DOI 10.7326/ANNALS-24-01885.
Comparison: Reuland 2024 conditions on positive FIT after assignment to screening
outreach, so its follow-up subgroup cannot inherit randomized interpretation.
All published treatment effects below are adjusted estimates, not patient counts.
"""
from decimal import Decimal
import json


def navigation_rct():
    randomized_total=985
    originally_navigation=489
    originally_usual=496
    exclusions_navigation=10
    exclusions_usual=8
    analytic_navigation=originally_navigation-exclusions_navigation
    analytic_usual=originally_usual-exclusions_usual
    intervention_receivers=242
    return {
        "source":"Coronado_2025_PRECISE",
        "eligibility":"abnormal FIT in prior month, before treatment assignment",
        "randomization_unit":"individual",
        "randomized_total":randomized_total,
        "randomized_arm_size":[originally_navigation,originally_usual],
        "excluded_after_randomization":[exclusions_navigation,exclusions_usual],
        "modified_itt_arm_size":[analytic_navigation,analytic_usual],
        "modified_itt_n":analytic_navigation+analytic_usual,
        "primary_endpoint":"colonoscopy completed within 12 months of abnormal FIT",
        "adjusted_completion_percent":[55.1,42.1],
        "adjusted_risk_difference_pp":13.0,
        "adjusted_risk_difference_ci95_pp":[6.5,19.4],
        "adjusted_odds_ratio":1.69,
        "randomized_offer_effect_on_followup_supported":True,
        "intervention_receivers":intervention_receivers,
        "receiver_percent_original_randomized_denominator":round(
            float(Decimal(100)*Decimal(intervention_receivers)/Decimal(originally_navigation)),4),
        "receiver_percent_modified_itt_denominator":round(
            float(Decimal(100)*Decimal(intervention_receivers)/Decimal(analytic_navigation)),4),
        "receiver_percentage_published":49.5,
        "receipt_denominator_note":"49.5 percent uses 489 originally allocated, while intervention receipt text mentions 479 in modified ITT",
        "receiver_per_protocol_effect_identified":False,
        "integration_only_effect_identified":False,
        "clinical_stage_or_mortality_effect_identified":False,
    }


def causal_gate():
    r=navigation_rct()
    return {
        "direct_post_positive_test_randomization":"SUPPORTED_BY_PRECISE",
        "positive_test_selected_after_upstream_assignment":"NOT_RANDOMIZED_NAVIGATION_ESTIMAND_IN_REULAND",
        "equate_offered_package_with_received_component":False,
        "derive_case_counts_from_adjusted_percentages":False,
        "estimate_crc_mortality_reduction":False,
        "source":r,
    }


if __name__=="__main__":
    print(json.dumps(causal_gate(),indent=2,sort_keys=True))
