"""Reproduce published aggregates and reject invalid counterfactual interpretations."""
import unittest
from datetime import date
from decimal import Decimal
from primary_upstream_counts import fraction,compare,available_at_decision

class PrimaryUpstreamEvidence(unittest.TestCase):
    def test_registry_capture_differential(self):
        x=compare()["BLOODTRACC"]
        self.assertEqual((x["n"],x["NCRAS_crc_cases"],x["expanded_crc_cases"]),(6518326,24517,26342))
        self.assertEqual((x["additional_men"],x["additional_women"],x["additional_records"]),(845,980,1825))
        self.assertAlmostEqual(x["relative_increment_percent"],7.443,places=2)

    def test_lookahead_washout_and_discrimination_not_causal(self):
        x=compare()["BLOODTRACC"]
        self.assertEqual(x["main_c_statistic"],{"men":0.73,"women":0.74})
        self.assertEqual(x["no_two_year_exclusion_c_statistic"],{"men":0.84,"women":0.91})
        self.assertFalse(x["outcome_anchored_index_is_ordinary_prospective_replay"])
        self.assertFalse(x["model_outperformed_abnormal_blood_count_overall"])
        self.assertFalse(x["care_or_mortality_effect_proven"])

    def test_high_risk_one_percent_misses_most_cases(self):
        a=compare()["BLOODTRACC"]["top_one_percent_sensitivity_percent"]
        self.assertTrue(all(v<6 for v in a.values()))

    def test_randomized_trial_raw_vs_adjusted(self):
        x=compare()["FHT_trial"]
        self.assertAlmostEqual(x["raw_difference_pp"],6.01,places=2)
        self.assertEqual(x["primary_cluster_modeled_difference_pp"],2.6)
        self.assertLess(x["primary_ci95_pp"][0],0)
        self.assertGreater(x["primary_ci95_pp"][1],0)
        self.assertFalse(x["clinical_causal_effect_proven"])

    def test_unresolved_primary_outcome_arithmetic(self):
        x=compare()["FHT_trial"]
        self.assertEqual(x["reported_pooled_followup_count"],5507)
        self.assertEqual(x["sum_arm_followup_counts"],5513)
        self.assertEqual(x["unreconciled_six_record_total"],6)

    def test_sensitivity_cannot_replace_primary(self):
        x=compare()["FHT_trial"]
        self.assertTrue(x["secondary_ci95_pp"][0]>0)
        self.assertLess(x["secondary_OR_ci95"][0],1)
        self.assertGreater(x["secondary_OR_ci95"][1],1)

    def test_endometrial_temporal_definition_changes_denominators(self):
        a=compare()["Postmenopausal_bleeding"]
        p=a["not_prompt_biopsy_inclusive"]
        q=a["not_prompt_biopsy_after_only"]
        self.assertAlmostEqual(float(100*fraction(*p["thick"])),18.37,places=2)
        self.assertAlmostEqual(float(100*fraction(*p["poorly_visible"])),32.90,places=2)
        self.assertAlmostEqual(float(100*fraction(*q["thick"])),23.31,places=2)
        self.assertAlmostEqual(float(100*fraction(*q["poorly_visible"])),44.14,places=2)
        self.assertEqual(a["competing_4mm_vs_5mm_guideline_explanation"],{"radiology_cases":17,"radiology_errors":19})
        self.assertFalse(a["clinical_benefit_of_change_proven"])

    def test_lung_observational_rr_not_causal(self):
        x=compare()["Lung_nodule_tracking"]
        self.assertAlmostEqual(x["observed_rr"],1.492,places=2)
        self.assertFalse(x["randomized"])
        self.assertFalse(x["mortality_effect_proven"])

    def test_hindsight_information_excluded(self):
        self.assertTrue(available_at_decision(date(2016,1,1),date(2016,2,1),date(2016,3,1),date(2016,4,1)))
        self.assertFalse(available_at_decision(date(2016,1,1),date(2016,2,1),date(2026,5,14),date(2016,4,1)))

    def test_counts_validated(self):
        for p in [(-1,3),(5,4),(1,0)]:
            with self.assertRaises(ValueError): fraction(*p)
        with self.assertRaises(TypeError): fraction(0.5,1)

    def test_no_local_causal_or_transfer_claim(self):
        a=compare()["scope"]
        self.assertTrue(a["uses_actual_published_aggregates"])
        self.assertFalse(a["Hinds_Harris_patient_level_causal_effect_identified"])
        self.assertFalse(a["cross_disease_transfer_established"])

if __name__=="__main__":
    unittest.main()
