"""Independent boundary regressions; synthetic contract examples only."""
import unittest
from intelligence_contract import validate_connection


def causal_edge():
    return dict(edge_type="validated_causal_effect", source_id="synthetic-fixture",
                evidence_grade="verified", disconfirmation_test="negative control",
                identification_design="randomized comparison", population="defined cohort",
                effect_estimate=0.2, uncertainty={"lower": -0.1, "upper": 0.5},
                time_window="12 months", independent_review={"status": "approved", "receipt": "fixture"})


class ConnectionBoundaryTests(unittest.TestCase):
    def test_structurally_complete_zero_effect_is_not_missing(self):
        for value in (0, 0.0):
            with self.subTest(value=value):
                self.assertTrue(validate_connection(causal_edge() | {"effect_estimate": value}))

    def test_unrecognized_evidence_grade_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "evidence grade"):
            validate_connection(causal_edge() | {"evidence_grade": "not-a-grade"})

    def test_incompatible_grade_cannot_be_validated_causal_effect(self):
        for grade in ("hypothesis", "inferred", "unknown", "contradicted"):
            with self.subTest(grade=grade):
                with self.assertRaisesRegex(ValueError, "evidence grade"):
                    validate_connection(causal_edge() | {"evidence_grade": grade})

    def test_nonzero_control_and_missing_estimate(self):
        self.assertTrue(validate_connection(causal_edge()))
        missing = causal_edge()
        del missing["effect_estimate"]
        with self.assertRaisesRegex(ValueError, "effect_estimate"):
            validate_connection(missing)


if __name__ == "__main__":
    unittest.main()
