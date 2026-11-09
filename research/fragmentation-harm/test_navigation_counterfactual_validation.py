"""Published PRECISE trial estimand, source denominator and causal claim guards."""
import unittest
from navigation_counterfactual_validation import navigation_rct, causal_gate


class NavigationCounterfactualEvidenceTests(unittest.TestCase):
    def test_actual_pre_navigation_randomization_population(self):
        r=navigation_rct()
        self.assertEqual(r["randomized_total"],985)
        self.assertEqual(r["modified_itt_arm_size"],[479,488])
        self.assertEqual(r["modified_itt_n"],967)
        self.assertTrue(r["randomized_offer_effect_on_followup_supported"])

    def test_published_adjusted_effect_positive_without_imputed_counts(self):
        r=navigation_rct()
        self.assertEqual(r["adjusted_risk_difference_pp"],13.0)
        self.assertEqual(r["adjusted_completion_percent"][0]-r["adjusted_completion_percent"][1],13.0)
        self.assertGreater(r["adjusted_risk_difference_ci95_pp"][0],0)
        self.assertFalse(causal_gate()["derive_case_counts_from_adjusted_percentages"])

    def test_receipt_denominator_disambiguation(self):
        r=navigation_rct()
        self.assertAlmostEqual(r["receiver_percent_original_randomized_denominator"],49.4888,delta=.001)
        self.assertAlmostEqual(r["receiver_percent_modified_itt_denominator"],50.5219,delta=.001)
        self.assertFalse(r["receiver_per_protocol_effect_identified"])

    def test_no_unobserved_causal_clinical_harm_claim(self):
        r=navigation_rct()
        self.assertFalse(r["clinical_stage_or_mortality_effect_identified"])
        self.assertFalse(r["integration_only_effect_identified"])
        self.assertEqual(causal_gate()["direct_post_positive_test_randomization"],"SUPPORTED_BY_PRECISE")

if __name__=="__main__":
    unittest.main()
