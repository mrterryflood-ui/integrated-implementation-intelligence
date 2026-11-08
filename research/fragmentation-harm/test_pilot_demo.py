"""Reproducibility and non-causality regression checks for aggregate pilot."""
import unittest
from pilot_demo import build_demo

class PilotDemoTests(unittest.TestCase):
    def test_repeatable(self):
        self.assertEqual(build_demo(),build_demo())
    def test_descriptive_contrast(self):
        x=build_demo()
        self.assertEqual(x["late_stage_incidence_rate_difference_per_100k"],6.0)
        self.assertEqual(x["late_stage_share_difference_percentage_points"],0.3)
    def test_no_patient_harm_claim(self):
        x=build_demo()
        self.assertIsNone(x["individual_missed_opportunities_observed"])
        self.assertIsNone(x["clinical_harms_prevented_observed"])
        self.assertFalse(x["causal_harm_established"])
    def test_hypotheses_only(self):
        x=build_demo()
        self.assertEqual(len(x["hypothesized_downstream_edges"]),4)
        self.assertTrue(all(e["status"]=="hypothesis_only" for e in x["hypothesized_downstream_edges"]))
    def test_no_comparability_overclaim(self):
        self.assertEqual(build_demo()["comparison_status"],"CONDITIONAL")

if __name__=="__main__":
    unittest.main()
