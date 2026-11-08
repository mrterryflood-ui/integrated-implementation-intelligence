import unittest
from dataclasses import replace
from process_intervention_transport_guard import (
    PRECISE, NC_FQHC, INTEGRATED, compatibility, validate_trial
)

class ProcessInterventionTransportTests(unittest.TestCase):
    def test_primary_study_effects_are_distinct(self):
        self.assertEqual(PRECISE.effect_pp,13.0)
        self.assertEqual(NC_FQHC.effect_pp,30.3)
        self.assertEqual(INTEGRATED.effect_pp,11.0)
    def test_precise_interval(self):
        self.assertTrue(validate_trial(PRECISE))
        self.assertEqual((PRECISE.lower_pp,PRECISE.upper_pp),(6.5,19.4))
    def test_cross_fqhc_studies_not_directly_poolable(self):
        x=compatibility(PRECISE,NC_FQHC)
        self.assertEqual(x['status'],'NOT_DIRECTLY_POOLABLE')
        self.assertIn('population',x['differences'])
    def test_integrated_study_not_12_month_equivalent(self):
        x=compatibility(PRECISE,INTEGRATED)
        self.assertIn('followup_months',x['differences'])
        self.assertIn('setting',x['differences'])
    def test_identical_descriptors_do_not_prove_transport(self):
        x=compatibility(PRECISE,PRECISE)
        self.assertEqual(x['status'],'DESCRIPTORS_MATCH_NOT_META_ANALYSIS')
        self.assertFalse(x['causal_transfer_established'])
    def test_missing_trial_population_rejected(self):
        with self.assertRaisesRegex(ValueError,'missing'):
            validate_trial(replace(PRECISE,population=''))
    def test_effect_outside_interval_rejected(self):
        with self.assertRaisesRegex(ValueError,'interval'):
            validate_trial(replace(PRECISE,effect_pp=25.0))
    def test_incomplete_interval_rejected(self):
        with self.assertRaisesRegex(ValueError,'incomplete'):
            validate_trial(replace(PRECISE,upper_pp=None))
    def test_nonfinite_effect_rejected(self):
        with self.assertRaisesRegex(ValueError,'finite'):
            validate_trial(replace(PRECISE,effect_pp=float('nan')))
    def test_invalid_followup_rejected(self):
        with self.assertRaisesRegex(ValueError,'follow-up'):
            validate_trial(replace(PRECISE,followup_months=0))

if __name__=='__main__':
    unittest.main()
