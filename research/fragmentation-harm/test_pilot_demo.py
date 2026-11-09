"""Reproducibility and non-causality regression checks for aggregate pilot."""
from contextlib import contextmanager
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import pilot_demo
from pilot_demo import build_demo

class PilotDemoTests(unittest.TestCase):
    def contract(self):
        return json.loads((Path(pilot_demo.__file__).parent / "comparability-contract.v0.1.json").read_text())

    @contextmanager
    def source_fixture(self, contract):
        # Exercise the real readers, validator, graph and CLI with only the
        # selected input metadata changed. No source download or archive replay.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = Path(pilot_demo.__file__).parent
            for name in ("pilot_demo.py", "validate_contract.py", "chainweb.py", "chainweb-hypotheses.v0.1.json"):
                shutil.copyfile(source / name, root / name)
            (root / "comparability-contract.v0.1.json").write_text(json.dumps(contract))
            yield root

    def test_period_tracks_selected_record(self):
        contract = self.contract()
        contract["records"][0]["period"] = "2018-2022"
        with self.source_fixture(contract) as root, patch.object(pilot_demo, "ROOT", root):
            result = build_demo()
        self.assertEqual(result["period"], "2018-2022")
        self.assertEqual(result["late_stage_incidence_rate_difference_per_100k"], 6.0)

    def test_missing_or_unusable_period_fails_without_default(self):
        for label, value in (("missing", None), ("null", None), ("empty", ""),
                             ("blank", " \t\n"), ("number", 2023), ("bool", False),
                             ("list", ["2019", "2023"]), ("object", {"start": 2019})):
            with self.subTest(period=label):
                contract = self.contract()
                if label == "missing":
                    contract["records"][0].pop("period")
                else:
                    contract["records"][0]["period"] = value
                with self.source_fixture(contract) as root, patch.object(pilot_demo, "ROOT", root):
                    with self.assertRaisesRegex(ValueError, "period"):
                        build_demo()

    def test_source_validation_describes_only_the_demo_action(self):
        result = build_demo()
        self.assertIn("local comparability contract read", result["source_validation"])
        self.assertIn("does not download or validate source archives", result["source_validation"])
        self.assertNotIn("accepted prior archive reproduction", result["source_validation"])

    def test_cli_preserves_selected_record_period(self):
        contract = self.contract()
        contract["records"][0]["period"] = "2018-2022"
        with self.source_fixture(contract) as root:
            result = subprocess.run([sys.executable, str(root / "pilot_demo.py")],
                                    capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)
        self.assertEqual(output["period"], "2018-2022")
        self.assertFalse(output["causal_harm_established"])

    def test_cli_missing_period_fails_before_emitting_demo(self):
        contract = self.contract()
        contract["records"][0].pop("period")
        with self.source_fixture(contract) as root:
            result = subprocess.run([sys.executable, str(root / "pilot_demo.py")],
                                    capture_output=True, text=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertIn("period", result.stderr)

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
