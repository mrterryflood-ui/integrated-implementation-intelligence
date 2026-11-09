"""Tests enforce a conditional audit, NOT a claim of proven patient misclassification."""
import unittest
from referral_semantics_reconciliation import escaron_referral_reconciliation


class ReferralSourceReconciliationTests(unittest.TestCase):
    def test_rounding_implied_referral_count(self):
        x=escaron_referral_reconciliation()
        self.assertEqual(x["referral_n_consistent_with_rounding"],[262])
    def test_conditional_denominator_discrepancy(self):
        x=escaron_referral_reconciliation()
        self.assertEqual(x["hypothetical_max_referred_if_equal_definitions"],245)
        self.assertEqual(x["hypothetical_minimum_count_discordance_if_same_definition_time_and_source"],17)
    def test_do_not_call_published_aggregate_audit_patient_level_error(self):
        x=escaron_referral_reconciliation()
        self.assertFalse(x["definitions_and_time_windows_adjudicated"])
        self.assertFalse(x["record_level_error_confirmed"])
        self.assertEqual(x["finding_status"],"CONDITIONAL_RECONCILIATION_FAILURE")

if __name__=="__main__":
    unittest.main()
