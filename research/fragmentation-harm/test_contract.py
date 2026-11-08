"""Regression tests for the research comparability safety gate."""
import copy
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("validator", ROOT / "validate_contract.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)
BASE = json.loads((ROOT / "comparability-contract.v0.1.json").read_text())

class ContractTests(unittest.TestCase):
    def test_baseline(self):
        self.assertEqual(validator.validate(BASE), [])
    def test_missing_dimension(self):
        d = copy.deepcopy(BASE)
        d["required_dimensions"].remove("denominator")
        self.assertTrue(validator.validate(d))
    def test_unknown_inference_blocked(self):
        d = copy.deepcopy(BASE)
        d["records"][1]["claim_level"] = "associational"
        self.assertTrue(validator.validate(d))
    def test_causal_harm_claim_blocked(self):
        d = copy.deepcopy(BASE)
        d["records"][0]["causal_harm_established"] = True
        self.assertTrue(validator.validate(d))
    def test_invalid_share(self):
        d = copy.deepcopy(BASE)
        d["records"][0]["late_stage_share_percent"][0] = 102
        self.assertTrue(validator.validate(d))
    def test_duplicate_comparison_id(self):
        d = copy.deepcopy(BASE)
        d["records"][1]["comparison_id"] = d["records"][0]["comparison_id"]
        self.assertTrue(validator.validate(d))
    def test_hinds_harris_arithmetic(self):
        h = BASE["records"][0]
        self.assertAlmostEqual(h["late_stage_rate_per_100k"][0] - h["late_stage_rate_per_100k"][1], 6.0)
        self.assertAlmostEqual(h["late_stage_share_percent"][0] - h["late_stage_share_percent"][1], 0.3)

if __name__ == "__main__":
    unittest.main()
