"""Regression tests compatible with stdlib unittest discovery in GitHub Actions."""
import unittest
from intelligence_contract import validate_evidence_event, validate_connection


def event():
    return dict(event_id="synthetic-1", source_id="published-aggregate", source_version="v1",
                source_extract_sha256="a" * 64, construct_id="late-stage-incidence",
                denominator_definition="age-adjusted rate per 100000",
                event_time="2023-12-31T00:00:00+00:00",
                available_to_decision_time="2024-12-12T00:00:00+00:00",
                decision_time="2025-01-01T00:00:00+00:00",
                evidence_grade="supported")


class IntelligenceContractTests(unittest.TestCase):
    def test_valid_event(self):
        self.assertTrue(validate_evidence_event(event()))

    def test_future_release_is_rejected(self):
        e = event()
        e["decision_time"] = "2023-12-31T00:00:00+00:00"
        with self.assertRaisesRegex(ValueError, "future-information"):
            validate_evidence_event(e)

    def test_missing_denominator_rejected(self):
        e = event()
        e["denominator_definition"] = ""
        with self.assertRaisesRegex(ValueError, "denominator_definition"):
            validate_evidence_event(e)

    def test_invalid_hash_rejected(self):
        e = event()
        e["source_extract_sha256"] = "not-a-sha"
        with self.assertRaisesRegex(ValueError, "hash"):
            validate_evidence_event(e)

    def test_timezone_required(self):
        e = event()
        e["event_time"] = "2023-12-31"
        with self.assertRaisesRegex(ValueError, "timezone"):
            validate_evidence_event(e)

    def test_hypothesis_edge(self):
        self.assertTrue(validate_connection(dict(
            edge_type="causal_hypothesis", source_id="doi:example",
            evidence_grade="hypothesis", disconfirmation_test="negative control")))

    def test_causal_edge_requires_evidence(self):
        e = dict(edge_type="validated_causal_effect", source_id="doi:example",
                 evidence_grade="verified", disconfirmation_test="negative control")
        with self.assertRaisesRegex(ValueError, "identification_design"):
            validate_connection(e)

    def test_invalid_edge_type(self):
        with self.assertRaisesRegex(ValueError, "edge type"):
            validate_connection(dict(edge_type="proven_benefit"))


if __name__ == "__main__":
    unittest.main()
