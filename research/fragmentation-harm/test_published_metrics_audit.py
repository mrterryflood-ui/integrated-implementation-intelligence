"""Regression tests for real, published aggregate arithmetic (no synthetic clinical data)."""
import unittest

from published_metrics_audit import (
    audit, pct, publication_count_checks, rounding_ratio_range, stage_rate_audit
)


class PublishedMetricsAuditTests(unittest.TestCase):
    def test_accepted_baseline_retained(self):
        a = stage_rate_audit()
        self.assertEqual(a["archive_period"], "2019-2023")
        self.assertEqual(a["hinds_minus_harris_all_stage_per_100k"], 8.4)
        self.assertEqual(a["hinds_minus_harris_late_stage_per_100k"], 6.0)
        self.assertEqual(a["hinds_minus_harris_stage_share_percentage_points"], 0.3)

    def test_stage_share_is_not_rate_ratio(self):
        a = stage_rate_audit()["counties"]
        self.assertAlmostEqual(a["Hinds"]["ratio_of_age_adjusted_rates_percent"], 64.4397, places=4)
        self.assertAlmostEqual(a["Harris"]["ratio_of_age_adjusted_rates_percent"], 62.8947, places=4)
        self.assertNotEqual(a["Hinds"]["ratio_of_age_adjusted_rates_percent"], 63.7)
        self.assertNotEqual(a["Harris"]["ratio_of_age_adjusted_rates_percent"], 63.4)

    def test_rounding_alone_cannot_reconcile(self):
        for c in ("Hinds", "Harris"):
            self.assertFalse(stage_rate_audit()["counties"][c]["rounding_alone_sufficient"])

    def test_represented_case_proportions(self):
        p = publication_count_checks()
        self.assertAlmostEqual(p["hoopes_2021_registry_cases_with_no_ehr_cancer_history_percent"], 45.4351, delta=.01)
        self.assertAlmostEqual(p["thompson_2020_episode_ehr_capture_of_regional_cases_percent"], 25.893, delta=.02)

    def test_followup_record_addition_not_causal_effect(self):
        p = publication_count_checks()
        self.assertAlmostEqual(p["escaron_2022_additional_documented_completion_percentage_points"], 4.6296, places=3)
        self.assertFalse(p["clinical_effect_identified"])
        self.assertTrue(p["different_denominators_not_pooled"])

    def test_positivity(self):
        with self.assertRaises(ValueError):
            pct(10, 0)
        with self.assertRaises(ValueError):
            rounding_ratio_range("1.0", "0.0")

    def test_nocausal_claim(self):
        a = audit()
        self.assertFalse(a["patient_level_data_used"])
        self.assertFalse(a["stage_measures"]["statistical_equivalence_established"])
        self.assertFalse(a["stage_measures"]["causal_effect_identified"])
        self.assertFalse(a["published_counts"]["clinical_effect_identified"])

    def test_determinism(self):
        self.assertEqual(audit(), audit())


if __name__ == "__main__":
    unittest.main()
