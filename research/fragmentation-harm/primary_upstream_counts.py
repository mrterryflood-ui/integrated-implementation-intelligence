"""Published empirical count reconciliation; no synthetic patient records.
Primary full texts:
Virdee 2026 https://doi.org/10.1186/s12885-026-16179-9
Chima 2024 https://doi.org/10.3399/BJGP.2024.0491
Atkins 2025 https://doi.org/10.1097/og9.0000000000000054
Lung Singh 2022 https://doi.org/10.1016/j.rmed.2022.106737 (abstract only)
"""
from datetime import date
from decimal import Decimal
import json

def fraction(a,b):
    if type(a) is not int or type(b) is not int: raise TypeError("integer counts required")
    if b <= 0 or a < 0 or a > b: raise ValueError("invalid count")
    return Decimal(a)/Decimal(b)

def compare():
    male, female = 2956977, 3561349
    registry = (12578,11939)
    expanded = (13423,12919)
    more = tuple(expanded[i]-registry[i] for i in (0,1))
    followup_raw_pp = 100*(fraction(2820,3709)-fraction(2693,3846))
    return {
      "BLOODTRACC":{
        "n":male+female,"NCRAS_crc_cases":sum(registry),
        "expanded_crc_cases":sum(expanded),"additional_records":sum(more),
        "additional_men":more[0],"additional_women":more[1],
        "relative_increment_percent":float(100*Decimal(sum(more))/Decimal(sum(registry))),
        "main_c_statistic":{"men":0.73,"women":0.74},
        "no_two_year_exclusion_c_statistic":{"men":0.84,"women":0.91},
        "top_one_percent_sensitivity_percent":{"men":3.56,"women":5.03},
        "outcomes_from_two_year_washout_cohort":True,
        "outcome_anchored_index_is_ordinary_prospective_replay":False,
        "model_outperformed_abnormal_blood_count_overall":False,
        "care_or_mortality_effect_proven":False
      },
      "FHT_trial":{
        "n":3709+3846,"arm_followup_counts":[2820,2693],
        "raw_difference_pp":float(followup_raw_pp),
        "primary_cluster_modeled_difference_pp":2.6,
        "primary_ci95_pp":[-2.8,7.9],"primary_pvalue":0.332,
        "reported_pooled_followup_count":5507,
        "sum_arm_followup_counts":2820+2693,
        "unreconciled_six_record_total":(2820+2693)-5507,
        "secondary_adjusted_sensitivity_pp":5.3,
        "secondary_ci95_pp":[0.1,10.4],
        "secondary_OR_ci95":[0.87,1.45],
        "clinical_causal_effect_proven":False
      },
      "Postmenopausal_bleeding":{
        "n":3369,
        "not_prompt_biopsy_inclusive":{"thick":[307,1671],"poorly_visible":[128,389]},
        "not_prompt_biopsy_after_only":{"thick":[307,1317],"poorly_visible":[128,290]},
        "competing_4mm_vs_5mm_guideline_explanation":{"radiology_cases":17,"radiology_errors":19},
        "clinical_benefit_of_change_proven":False
      },
      "Lung_nodule_tracking":{
        "tracked_followup":[408,523],"not_tracked_followup":[57,109],
        "observed_rr":float(fraction(408,523)/fraction(57,109)),
        "randomized":False,"mortality_effect_proven":False
      },
      "scope":{"uses_actual_published_aggregates":True,
               "Hinds_Harris_patient_level_causal_effect_identified":False,
               "cross_disease_transfer_established":False}
    }

def available_at_decision(event:date,recorded:date,available:date,decision:date):
    return event<=decision and recorded<=decision and available<=decision

if __name__ == "__main__":
    print(json.dumps(compare(),sort_keys=True,indent=2))
