"""Supplied review metadata contract only; no reviewer authentication is claimed."""
import copy
import unittest
from intelligence_contract import validate_connection


def connection():
    return dict(edge_type="validated_causal_effect", source_id="synthetic-test-only",
                evidence_grade="verified", disconfirmation_test="synthetic rival",
                identification_design="synthetic randomized comparison", population="synthetic cohort",
                time_window="12 months", effect_estimate=0.0, effect_measure="risk_difference",
                uncertainty={"lower": -0.1, "upper": 0.1}, result="null",
                independent_review={"status": "approved", "reviewer_id": "synthetic-reviewer",
                    "artifact_ref": "synthetic://review-only", "reviewed_at": "2026-11-08T16:00:00Z"})


class ReviewMetadataTests(unittest.TestCase):
    def test_valid_review_timestamps(self):
        for value in ("2026-11-08T16:00:00Z", "2026-11-08T10:00:00-06:00",
                      "2028-02-29T16:00:00.123456+05:30"):
            with self.subTest(value=value):
                edge=connection(); edge["independent_review"]["reviewed_at"]=value
                self.assertTrue(validate_connection(edge))

    def test_review_date_required_and_typed(self):
        for value in (None, "", " ", 123, False, [], {}):
            with self.subTest(value=value):
                edge=connection(); edge["independent_review"]["reviewed_at"]=value
                with self.assertRaisesRegex(ValueError, "reviewed_at"):
                    validate_connection(edge)
        edge=connection(); del edge["independent_review"]["reviewed_at"]
        with self.assertRaisesRegex(ValueError, "reviewed_at"):
            validate_connection(edge)

    def test_invalid_or_ambiguous_review_dates_rejected(self):
        for value in ("2026-02-30T16:00:00Z", "2026-11-08T16:00:00", "2026-11-08",
                      "2026-11-08T24:00:00Z", "2026-11-08T16:60:00Z",
                      "2026-11-08T16:00:00+00:60", "2026-11-08T16:00:00+24:00"):
            with self.subTest(value=value):
                edge=connection(); edge["independent_review"]["reviewed_at"]=value
                with self.assertRaisesRegex(ValueError, "reviewed_at"):
                    validate_connection(edge)

    def test_named_reviewer_required(self):
        for value in (None, "", " \t ", 123, False):
            with self.subTest(value=value):
                edge=connection(); edge["independent_review"]["reviewer_id"]=value
                with self.assertRaises(ValueError): validate_connection(edge)
        edge=connection(); del edge["independent_review"]["reviewer_id"]
        with self.assertRaises(ValueError): validate_connection(edge)

    def test_unapproved_status_rejected(self):
        for value in (None, "", "pending", "rejected", "unreviewed", True):
            with self.subTest(value=value):
                edge=connection(); edge["independent_review"]["status"]=value
                with self.assertRaises(ValueError): validate_connection(edge)
        edge=connection(); del edge["independent_review"]["status"]
        with self.assertRaises(ValueError): validate_connection(edge)

    def test_prior_grade_and_zero_guards_preserved(self):
        self.assertTrue(validate_connection(connection()))
        for grade in ("not-a-grade", "hypothesis", "supported"):
            with self.subTest(grade=grade):
                edge=connection(); edge["evidence_grade"]=grade
                with self.assertRaises(ValueError): validate_connection(edge)


if __name__=="__main__": unittest.main()
