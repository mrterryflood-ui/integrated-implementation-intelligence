"""Regression controls for actual published-study calibration and invalid inference."""
import unittest
from calibration_cycle1_published import calibration, percent, reuland_2024, kruse_2024, escaron_2022


class EmpiricalChainWebCalibration(unittest.TestCase):
    def test_reuland_rct_primary_arithmetic(self):
        r = reuland_2024()
        self.assertAlmostEqual(r["primary_difference_pp_recalculated"], 20.2899, places=3)
        self.assertAlmostEqual(r["primary_difference_pp_recalculated"], r["primary_difference_pp_published"], delta=0.005)
        self.assertTrue(r["primary_ci_95_published_pp"][0] > 0)

    def test_reuland_postrandomization_subgroup_invalid_for_causal_followup(self):
        r = reuland_2024()
        self.assertAlmostEqual(r["conditional_followup_difference_pp_recalculated"], 24.3056, places=3)
        self.assertLess(r["conditional_followup_ci_95_published_pp"][0], 0)
        self.assertGreater(r["conditional_followup_ci_95_published_pp"][1], 0)
        self.assertFalse(r["conditional_followup_causal_identified"])

    def test_neoplasia_detection_not_incidence_prevention(self):
        r = reuland_2024()
        self.assertAlmostEqual(r["advanced_neoplasia_count_difference_pp"], 0.6997, places=3)
        self.assertFalse(r["observed_mortality_or_prevented_cancer"])

    def test_kruse_crc_effect_and_sdoh_null_are_distinct(self):
        k = kruse_2024()
        self.assertEqual(k["eligible_population"], 34588)
        self.assertEqual(k["crc_average_marginal_effect_pp"], 1.4)
        self.assertEqual(k["crc_screening_aor"], 2.41)
        self.assertFalse(k["sdoh_screening_effect_established"])
        self.assertFalse(k["sdoh_screening_equivalence_established"])
        self.assertFalse(k["sdoh_screening_noninferiority_established"])

    def test_kruse_no_unmeasured_efficiency_claim(self):
        k = kruse_2024()
        self.assertFalse(k["cost_savings_proven"])
        self.assertFalse(k["reported_total_counts_are_intervention_attributable"])
        self.assertFalse(k["integration_only_effect_identified"])

    def test_escaron_not_documented_vs_not_done(self):
        e = escaron_2022()
        self.assertEqual(e["no_ehr_query_completion_evidence_count"], 231)
        self.assertEqual(e["additional_reported_extended_records"], 29)
        self.assertFalse(e["no_followup_proven_not_performed"])
        self.assertFalse(e["causal_intervention_comparison"])

    def test_escaron_horizon_and_origin_not_equivalent(self):
        e = escaron_2022()
        self.assertAlmostEqual(e["additional_12mo_documented_percentage_points_nominal"],4.6296,places=3)
        self.assertNotEqual(e["reported_total_within_12_months"],e["reported_total_extended_to_34_months"])
        self.assertFalse(e["coherent_source_by_time_breakdown_available"])
        self.assertTrue(e["time_horizon_reporting_discrepancy"])

    def test_no_cross_study_pooled_or_local_causal_claim(self):
        c=calibration()
        self.assertTrue(c["empirical_only"])
        self.assertTrue(c["no_cross_trial_pooled_estimate"])
        self.assertFalse(c["clinical_causality_in_hinds_harris_identified"])
        self.assertEqual(c["hypothesis_checks"]["bundle_automatically_improves_sdoh_screening"],"NOT_SUPPORTED")
        self.assertEqual(c["hypothesis_checks"]["Hinds_Harris_prevention_effect_or_transport"],"UNTESTED")

    def test_invalid_counts_rejected(self):
        for n,d in [(1,0),(-1,5),(6,5)]:
            with self.assertRaises(ValueError):
                percent(n,d)

    def test_reproducibility(self):
        self.assertEqual(calibration(),calibration())


if __name__ == "__main__":
    unittest.main()
