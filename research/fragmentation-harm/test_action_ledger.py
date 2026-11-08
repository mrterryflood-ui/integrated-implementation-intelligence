"""Synthetic-only regression tests for research action ledger."""
import copy
import unittest
from action_ledger import validate, canonical_receipt, case_summary

def ev(kind, index, **extra):
    x = {"case_id":"synthetic-demo-001", "event_id":f"synthetic-{index}",
         "event_type":kind, "occurred_at":f"2026-11-08T{index:02d}:00:00Z",
         "recorded_at":f"2026-11-08T{index:02d}:01:00Z",
         "actor_role":"research_auditor", "evidence_refs":["synthetic://demo"],
         "source_type":"synthetic", "data_classification":"non_patient_research"}
    x.update(extra)
    return x

def fixture():
    return [
        ev("signal_detected",0),
        ev("comparability_reviewed",1,comparison_status="PASS"),
        ev("evidence_corroborated",2),
        ev("owner_assigned",3,decision_owner_role="research_lead"),
        ev("action_authorized",4,decision="monitor",human_approved=True),
        ev("action_recorded",5),
        ev("outcome_observed",6,outcome_status="unknown"),
        ev("case_closed",7,closure_basis="completed")
    ]

class LedgerTests(unittest.TestCase):
    def test_valid_synthetic(self):
        self.assertEqual(validate(fixture()), [])
    def test_receipt_deterministic(self):
        self.assertEqual(canonical_receipt(fixture()), canonical_receipt(fixture()))
    def test_interval_and_no_causal_claim(self):
        s=case_summary(fixture(),"synthetic-demo-001")
        self.assertEqual(s["signal_to_action_hours"],5)
        self.assertFalse(s["causal_harm_established"])
    def test_no_patient_fields(self):
        x=fixture();x[0]["patient_id"]="secret"
        self.assertTrue(validate(x))
    def test_no_action_without_owner(self):
        x=fixture();x.pop(3)
        self.assertTrue(validate(x))
    def test_no_action_without_comparability_pass(self):
        x=fixture();x[1]["comparison_status"]="UNKNOWN"
        self.assertTrue(validate(x))
    def test_no_action_without_human(self):
        x=fixture();x[4]["human_approved"]=False
        self.assertTrue(validate(x))
    def test_no_naive_timestamp(self):
        x=fixture();x[0]["occurred_at"]="2026-11-08T00:00:00"
        self.assertTrue(validate(x))
    def test_no_duplicate_event(self):
        x=fixture();x[1]["event_id"]=x[0]["event_id"]
        self.assertTrue(validate(x))
    def test_no_regression(self):
        x=fixture();x[4],x[5]=x[5],x[4]
        self.assertTrue(validate(x))
    def test_missing_action_is_not_zero(self):
        x=fixture()[:4]
        self.assertIsNone(case_summary(x,"synthetic-demo-001")["signal_to_action_hours"])
    def test_no_unrecorded_outcome_inference(self):
        x=fixture()[:6]
        self.assertEqual(case_summary(x,"synthetic-demo-001")["outcome"],"unknown")

if __name__=="__main__":
    unittest.main()
