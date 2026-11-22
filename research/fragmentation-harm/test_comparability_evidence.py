"""Research-claim boundary regressions. All positive evidence below is synthetic.

These fixtures exercise consistency and arithmetic. They are not agency records,
qualified human reviews, clinical evidence or permission to publish a real claim.
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import validate_contract_v02 as guard

ROOT = Path(__file__).resolve().parent


def reference_contract():
    return json.loads((ROOT / "comparability-contract.v0.2.json").read_text())


def refresh_review(record):
    review = record["stage_comparability"]["review"]
    review["comparison_sha256"] = guard.comparison_digest(record)
    return guard.review_digest(review)


def evidence_fixture(*, observed_declaration=False, different_codes=False):
    """An invented test dataset, including when simulating an observed declaration."""
    contract = reference_contract()
    record = copy.deepcopy(contract["records"][0])
    record["comparison_id"] = "SYNTHETIC-claim-boundary-test"
    record["comparison_status"] = "CONDITIONAL"
    record["reason"] = "SYNTHETIC software fixture; no real agency data or human review"
    record["sources"] = ["Synthetic source A", "Synthetic source B"]
    record["dimensions"]["case_definition"] = {"state": "VALUED", "why": "synthetic fixture", "value": "invasive colorectal cancer"}
    record["dimensions"]["population"] = {"state": "VALUED", "why": "synthetic fixture", "value": "synthetic all-age population"}
    target = {"late_stage_categories": ["regional", "distant"],
              "denominator_policy": "known_stage", "unknown_stage_policy": "exclude_denominator",
              "case_definition": "invasive colorectal cancer", "population": "synthetic all-age population",
              "exclusions": ["in situ", "death-certificate-only", "autopsy-only"]}
    mappings = []
    rows = []
    for index, site in enumerate(record["sites"]):
        label = "Synthetic site " + str(index + 1)
        site.update({"label": label, "fips": None, "stage_definition": "localized/regional/distant/unknown"})
        provenance = {"stage_variable": "Summary stage" if index == 0 or not different_codes else "Other registry stage",
                      "stage_version": "2018", "stage_variable_state": "ATTESTED_PER_EXTRACT",
                      "diagnosis_years": site["period"], "release": "synthetic release"}
        site["stage_provenance"] = provenance
        codes = ["1", "2", "7", "9"] if index == 0 or not different_codes else ["L", "R", "D", "U"]
        code_map = dict(zip(codes, ["localized", "regional", "distant", "unknown"]))
        mappings.append({"site_label": label, "stage_variable": provenance["stage_variable"],
                         "stage_version": "2018", "source_release": "synthetic release",
                         "period": site["period"], "stage_definition": site["stage_definition"],
                         **{k: v for k, v in target.items() if k != "late_stage_categories"},
                         "source_codes": codes, "category_mapping": code_map,
                         "source_references": {
                             "definition": {"url": "https://example.invalid/synthetic-definition", "sha256": "a" * 64},
                             "extract": {"url": "https://example.invalid/synthetic-extract-" + str(index), "sha256": "b" * 64}}})
        counts = dict(zip(codes, [36, 24, 36, 4] if index == 0 else [50, 30, 20, 0]))
        rows.append({"site_label": label, "counts": counts, "count_basis": "exact_source_counts",
                     "numerator": 60 if index == 0 else 50, "denominator": 96 if index == 0 else 100,
                     "share_percent": 62.5 if index == 0 else 50.0})
    record["stage_comparability"] = {
        "status": "EVIDENCE_RECORDED", "data_kind": "observed" if observed_declaration else "synthetic",
        "target": target, "site_mappings": mappings,
        "calculation": {"status": "REPRODUCED", "sites": rows, "difference_pp": 12.5},
        "review": {"decision": "ACCEPTED_FOR_DESCRIPTIVE_COMPARISON", "reviewer_kind": "qualified_human",
                   "reviewer": "SIMULATED reviewer (not a real person)", "reviewer_role": "SIMULATED source-methods review",
                   "reviewed_at": "2026-11-21T18:00:00-06:00", "evidence_ref": "synthetic:test-only",
                   "comparison_sha256": ""}}
    contract["records"] = [record]
    return contract, refresh_review(record)


class ComparabilityEvidenceTests(unittest.TestCase):
    def assertBlocked(self, record, fragment, pin=None):
        result = guard.assess_comparability(record, pin)
        self.assertEqual(result["claim_gate"], "BLOCKED")
        self.assertTrue(any(fragment in e for e in result["errors"]), result)
        return result

    def test_real_record_is_inspectable_but_not_comparable(self):
        contract = reference_contract()
        self.assertEqual(guard.validate(contract), [])
        record = contract["records"][0]
        self.assertBlocked(record, "not established")
        self.assertTrue(guard.validate(contract, require_comparable=True))

    def test_notes_and_matching_names_cannot_replace_evidence(self):
        for same_name in (True, False):
            contract = reference_contract()
            record = contract["records"][0]
            record["comparison_status"] = "CONDITIONAL"
            record.pop("stage_comparability", None)
            record["stage_construct_equivalence_note"] = "x"
            for index, site in enumerate(record["sites"]):
                site["stage_definition"] = "regional+distant" if index == 0 else "distant only"
                site["stage_provenance"] = {"stage_variable": "Summary Stage" if same_name or index == 0 else "Other Stage",
                                            "stage_variable_state": "ATTESTED_PER_EXTRACT", "stage_version": str(2018 + index)}
            with self.subTest(same_name=same_name):
                self.assertBlocked(record, "not established")
                self.assertTrue(guard.validate(contract, True))

    def test_complete_identity_mapping_is_recorded_not_authentication(self):
        contract, pin = evidence_fixture()
        result = self.assertBlocked(contract["records"][0], "synthetic", pin)
        self.assertEqual(result["evidence_status"], "RECORDED_NOT_AUTHENTICATED")
        self.assertEqual(result["calculation_status"], "REPRODUCED_FROM_DECLARED_COUNTS")

    def test_different_source_codes_can_have_supported_crosswalk(self):
        contract, pin = evidence_fixture(different_codes=True)
        result = self.assertBlocked(contract["records"][0], "synthetic", pin)
        self.assertEqual(result["evidence_status"], "RECORDED_NOT_AUTHENTICATED")
        self.assertEqual(result["calculation_status"], "REPRODUCED_FROM_DECLARED_COUNTS")

    def test_simulated_observed_record_requires_out_of_band_review_pin(self):
        contract, pin = evidence_fixture(observed_declaration=True)
        record = contract["records"][0]
        self.assertBlocked(record, "operator")
        record["accepted_review_sha256"] = pin
        record["stage_comparability"]["accepted_review_sha256"] = pin
        refresh_review(record)
        self.assertBlocked(record, "operator")

    def test_simulated_observed_gate_success_is_scope_limited(self):
        contract, pin = evidence_fixture(observed_declaration=True, different_codes=True)
        result = guard.assess_comparability(contract["records"][0], pin)
        self.assertEqual(result["errors"], [])
        self.assertEqual(result["claim_gate"], "EVIDENCE_GATE_PASSED")
        self.assertEqual(result["review_status"], "MATCHES_OPERATOR_ACCEPTED_DIGEST")
        self.assertEqual(guard.validate(contract, require_comparable=True, accepted_review_sha256=pin), [])

    def test_tampered_version_definition_population_and_count_invalidate_review(self):
        changes = [
            lambda r: r["sites"][0]["stage_provenance"].update(stage_version="2026"),
            lambda r: r["sites"][0].update(stage_definition="distant only"),
            lambda r: r["dimensions"]["population"].update(value="a different population"),
            lambda r: r["stage_comparability"]["calculation"]["sites"][0]["counts"].update({"2": 25}),
            lambda r: r["sites"][0].update(late_stage_share_percent=70.0),
        ]
        for change in changes:
            contract, pin = evidence_fixture(observed_declaration=True)
            record = contract["records"][0]
            change(record)
            self.assertEqual(guard.assess_comparability(record, pin)["claim_gate"], "BLOCKED")

    def test_same_label_cannot_hide_new_specification(self):
        contract, pin = evidence_fixture(observed_declaration=True)
        record = contract["records"][0]
        record["sites"][0]["stage_provenance"]["stage_version"] = "2026"
        record["stage_comparability"]["site_mappings"][0]["stage_version"] = "2026"
        self.assertBlocked(record, "stale", pin)

    def test_incomplete_or_duplicated_crosswalk_is_rejected(self):
        for mutation in (lambda m: m["category_mapping"].pop("9"),
                         lambda m: m["source_codes"].append("9"),
                         lambda m: m["category_mapping"].update({"9": "mystery"})):
            contract, pin = evidence_fixture()
            record = contract["records"][0]
            mutation(record["stage_comparability"]["site_mappings"][0])
            self.assertBlocked(record, "category_mapping", pin)

    def test_unknown_stage_denominator_disagreement_is_rejected(self):
        contract, pin = evidence_fixture()
        record = contract["records"][0]
        record["stage_comparability"]["site_mappings"][0]["unknown_stage_policy"] = "include_denominator"
        self.assertBlocked(record, "unknown_stage_policy", pin)

    def test_unknown_stage_can_be_included_with_reproduced_denominator(self):
        contract, _ = evidence_fixture()
        record = contract["records"][0]
        evidence = record["stage_comparability"]
        for item in [evidence["target"], *evidence["site_mappings"]]:
            item.update(denominator_policy="all_eligible", unknown_stage_policy="include_denominator")
        evidence["calculation"]["sites"][0].update(denominator=100, share_percent=60.0)
        evidence["calculation"]["difference_pp"] = 10.0
        pin = refresh_review(record)
        result = self.assertBlocked(record, "synthetic", pin)
        self.assertEqual(result["calculation_status"], "REPRODUCED_FROM_DECLARED_COUNTS")

    def test_rounded_reconstructed_counts_cannot_claim_reproduction(self):
        contract, pin = evidence_fixture()
        record = contract["records"][0]
        record["stage_comparability"]["calculation"]["sites"][0]["count_basis"] = "reconstructed_from_rounded_annual_means"
        self.assertBlocked(record, "reconstructed rounded totals", pin)

    def test_bad_counts_and_difference_fail(self):
        for value in (None, -1, True, 2.5, float("nan")):
            contract, pin = evidence_fixture()
            record = contract["records"][0]
            record["stage_comparability"]["calculation"]["sites"][0]["counts"]["2"] = value
            self.assertBlocked(record, "exact nonnegative counts", pin)
        contract, pin = evidence_fixture()
        record = contract["records"][0]
        record["stage_comparability"]["calculation"]["difference_pp"] = 0.0
        self.assertBlocked(record, "difference_pp", pin)

    def test_source_reference_tampering_and_missing_digest_reject(self):
        contract, pin = evidence_fixture(observed_declaration=True)
        record = contract["records"][0]
        ref = record["stage_comparability"]["site_mappings"][0]["source_references"]["definition"]
        ref["sha256"] = "c" * 64
        self.assertBlocked(record, "stale", pin)
        ref.pop("sha256")
        self.assertBlocked(record, "source URL and SHA-256", pin)

    def test_unknown_or_advisory_status_cannot_bypass_explicit_claim_gate(self):
        for status in ("UNKNOWN", "FAIL", "CONDITIONAL", "PASS"):
            contract = reference_contract()
            contract["provenance_enforcement"] = "advisory"
            contract["records"][0]["comparison_status"] = status
            self.assertTrue(guard.validate(contract, False, require_comparable=True), status)

    def test_missing_review_and_wrong_pin_reject(self):
        contract, _ = evidence_fixture(observed_declaration=True)
        record = contract["records"][0]
        self.assertBlocked(record, "operator", "f" * 64)
        record["stage_comparability"].pop("review")
        self.assertBlocked(record, "review is not recorded")

    def test_non_object_and_nonfinite_values_fail_without_false_pass(self):
        for value in ([], None, "x"):
            self.assertTrue(guard.validate(value))
        contract = reference_contract()
        contract["records"][0]["sites"][0]["late_stage_share_percent"] = float("nan")
        self.assertTrue(guard.validate(contract))


class ComparabilityCliTests(unittest.TestCase):
    def run_cli(self, contract=None, *flags):
        with tempfile.TemporaryDirectory() as directory:
            path = ROOT / "comparability-contract.v0.2.json"
            if contract is not None:
                path = Path(directory) / "contract.json"
                path.write_text(json.dumps(contract))
            return subprocess.run([sys.executable, str(ROOT / "validate_contract_v02.py"), *flags, str(path)],
                                  capture_output=True, text=True, timeout=10)

    def test_default_cli_identifies_structure_and_unresolved_science(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("STRUCTURE_VALID:", result.stdout)
        self.assertNotIn("PASS:", result.stdout)
        self.assertIn('"claim_gate": "BLOCKED"', result.stdout)
        self.assertIn('"evidence_status": "NOT_ESTABLISHED"', result.stdout)

    def test_real_claim_gate_is_nonzero_even_with_advisory_override(self):
        result = self.run_cli(None, "--require-comparable", "--advisory-provenance")
        self.assertEqual(result.returncode, 1)
        self.assertIn("not established", result.stderr)

    def test_simulated_claim_gate_positive_requires_external_pin(self):
        contract, pin = evidence_fixture(observed_declaration=True)
        self.assertEqual(self.run_cli(contract, "--require-comparable").returncode, 1)
        result = self.run_cli(contract, "--require-comparable", "--accepted-review-sha256=" + pin)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('"claim_gate": "EVIDENCE_GATE_PASSED"', result.stdout)
        self.assertIn("do not authenticate", result.stdout)

    def test_malformed_pin_is_usage_error(self):
        self.assertEqual(self.run_cli(None, "--accepted-review-sha256=x").returncode, 2)


if __name__ == "__main__":
    unittest.main()
