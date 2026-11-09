"""First full-path ChainWeb calibration using only published empirical study aggregates.

DOIs:
Kruse 2024: 10.1007/s11606-024-08654-5
Reuland 2024: 10.1001/jamanetworkopen.2024.46693
Escaron 2022: 10.1177/21501319221138423

The study's unit, timing, intervention and selection restrictions are explicit.
This file contains no synthetic patient data and does not estimate a local causal
effect in Hinds/Harris.
"""
from decimal import Decimal
import json


def percent(numerator, denominator):
    """Exact published-count proportion before display rounding."""
    if denominator <= 0 or numerator < 0 or numerator > denominator:
        raise ValueError("counts must satisfy 0 <= numerator <= denominator")
    return Decimal(100) * Decimal(numerator) / Decimal(denominator)


def reuland_2024():
    n = 2001
    intervention = 600
    control = 194
    positive_fit_intervention, positive_fit_control = 48, 18
    colonoscopy_intervention, colonoscopy_control = 33, 8
    return {
        "design": "individually_randomized_pragmatic_rct",
        "setting": "12 North Carolina FQHC delivery sites",
        "intervention": "centralized mailed FIT plus navigation after positive FIT",
        "primary_endpoint": "any CRC screening completed within 6 months",
        "primary_n_per_arm": n,
        "primary_count_intervention": intervention,
        "primary_count_control": control,
        "primary_difference_pp_recalculated": round(float(percent(intervention-control, n)), 4),
        "primary_difference_pp_published": 20.29,
        "primary_ci_95_published_pp": [17.85, 22.73],
        "primary_causal_interpretation": "assignment_to_outreach_plus_navigation_package",
        "conditional_positive_fit_n": [positive_fit_intervention, positive_fit_control],
        "conditional_colonoscopy_n": [colonoscopy_intervention, colonoscopy_control],
        "conditional_followup_difference_pp_recalculated": round(float(
            percent(colonoscopy_intervention,positive_fit_intervention)
            - percent(colonoscopy_control,positive_fit_control)), 4),
        "conditional_followup_ci_95_published_pp": [-2.13, 50.74],
        "conditional_followup_p_published": 0.07,
        "conditional_followup_causal_identified": False,
        "conditional_followup_reason": "positive FIT is post-randomization selection; different populations induced by intervention",
        "advanced_neoplasia_detected_by_arm": [29, 15],
        "advanced_neoplasia_count_difference_pp": round(float(percent(29-15, n)), 4),
        "advanced_neoplasia_difference_pp_published": 0.68,
        "advanced_neoplasia_difference_ci_95_published_pp": [0.05,1.35],
        "observed_mortality_or_prevented_cancer": False,
    }


def kruse_2024():
    return {
        "design": "four-cluster_randomized_stepped_wedge",
        "eligible_population": 34588,
        "reported_crc_screened": 3194,
        "reported_sdoh_screened": 16613,
        "crc_screening_aor": 2.41,
        "crc_screening_p": 0.005,
        "crc_average_marginal_effect_pp": 1.4,
        "crc_average_marginal_effect_ci95_pp": [0.3,2.3],
        "sdoh_screening_aor": 0.64,
        "sdoh_screening_p": 0.189,
        "sdoh_screening_effect_established": False,
        "sdoh_screening_equivalence_established": False,
        "sdoh_screening_noninferiority_established": False,
        "reported_total_counts_are_intervention_attributable": False,
        "integration_only_effect_identified": False,
        "person_level_patient_referral_outcomes": False,
        "measurement": "EHR_mapped_Azara_DRVS; outside care capture incomplete",
        "staff_burden_reported_calls_per_fit_return": 11.7,
        "staff_burden_sd": 7.43,
        "cost_savings_proven": False,
    }


def escaron_2022():
    return {
        "design": "observational_multisource_followup_ascertainment",
        "patient_count": 324,
        "positive_fit_cohort": True,
        "documented_gi_referral_proportion_published_percent": 80.9,
        "ehr_query_colonoscopies": 93,
        "reported_total_within_12_months": 108,
        "reported_total_extended_to_34_months": 122,
        "ehr_query_identification_percent": round(float(percent(93,324)),4),
        "within_12_months_multisource_percent": round(float(percent(108,324)),4),
        "extended_multisource_percent": round(float(percent(122,324)),4),
        "additional_12mo_documented_percentage_points_nominal": round(float(percent(108-93,324)),4),
        "additional_reported_extended_records": 122 - 93,
        "no_ehr_query_completion_evidence_count": 324 - 93,
        "no_documentation_after_referral_or_consultation": 96,
        "no_documented_gi_referral": 79,
        "no_followup_proven_not_performed": False,
        "coherent_source_by_time_breakdown_available": False,
        "time_origin_ambiguity": ["FIT_return","abnormal_result","referral"],
        "time_horizon_reporting_discrepancy": True,
        "causal_intervention_comparison": False,
    }


def calibration():
    return {
        "version": "2026-11-08-cycle-1",
        "empirical_only": True,
        "clinical_causality_in_hinds_harris_identified": False,
        "calibration_tracks": ["research_intelligence","documented_clinical_followup_pathway"],
        "studies": {"Reuland_2024":reuland_2024(),
                    "Kruse_2024":kruse_2024(),
                    "Escaron_2022":escaron_2022()},
        "hypothesis_checks":{
            "outreach_can_increase_crc_screening_in_tested_setting":"SUPPORTED",
            "bundle_automatically_improves_sdoh_screening":"NOT_SUPPORTED",
            "more_ehr_documented_followup_equals_more_care_delivered":"CONTRADICTED_BY_MULTISOURCE_ASCERTAINMENT",
            "navigation_or_data_integration_prevents_crc_death":"UNTESTED",
            "Hinds_Harris_prevention_effect_or_transport":"UNTESTED",
        },
        "no_cross_trial_pooled_estimate":True,
    }


if __name__ == "__main__":
    print(json.dumps(calibration(),sort_keys=True,indent=2))
