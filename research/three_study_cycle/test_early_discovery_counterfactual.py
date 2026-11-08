import unittest
from early_discovery_counterfactual import evaluate, rehearsal, shift_threshold, sensitivity_envelope


class CounterfactualTests(unittest.TestCase):
    def setUp(self):
        self.scenarios = rehearsal()['scenarios']
        self.base = self.scenarios['baseline_pathway']['assumptions']

    def test_missing_data_yields_next_test_without_fabricated_projection(self):
        r = evaluate({'population': 100000})
        self.assertEqual(r['state'], 'SYNTHESIS_AND_NEXT_TEST_PLAN')
        self.assertIsNone(r['projection'])
        self.assertIn('sensitivity', r['missing_parameters'])
        self.assertTrue(r['next_tests'])

    def test_invalid_values_reject_even_in_partial_inputs(self):
        for x in ({'sensitivity': float('nan')}, {'reach': True}, {'specificity': 1.01}, {'population': 0}, {'age_gate': 45}):
            with self.assertRaises(ValueError): evaluate(x)

    def test_counts_conserve_and_no_scenario_becomes_clinical_evidence(self):
        for r in self.scenarios.values():
            p = r['projection']
            self.assertAlmostEqual(p['early_cases'] + p['late_cases'] + p['prevented_cases'], 100)
            self.assertFalse(r['patient_benefit_established'])
            self.assertFalse(r['clinical_use_authorized'])
            self.assertGreaterEqual(p['uncompleted_referrals'], 0)

    def test_synchronizing_mechanisms_changes_the_synthetic_counterfactual(self):
        p = {k: v['projection'] for k, v in self.scenarios.items()}
        self.assertFalse(p['instrument_only']['early_exceeds_late'])
        self.assertTrue(p['synchronized_pathway']['early_exceeds_late'])
        self.assertLess(p['synchronized_pathway']['late_cases'], p['instrument_only']['late_cases'])

    def test_capacity_and_specificity_can_defeat_the_stage_shift(self):
        for key in ('synchronized_but_capacity_constrained', 'synchronized_but_low_specificity'):
            p = self.scenarios[key]['projection']
            self.assertTrue(p['capacity_limited'])
            self.assertFalse(p['early_exceeds_late'])

    def test_no_efficacy_does_not_manufacture_stage_shift(self):
        p = self.scenarios['no_effect_of_earlier_action']['projection']
        self.assertEqual(p['shifted_from_late_to_early'], 0)
        self.assertEqual(p['late_cases'], 60)

    def test_prevention_improves_burden_without_flipping_stage_share(self):
        p = self.scenarios['uniform_prevention_without_stage_shift']['projection']
        self.assertEqual(p['late_cases'], 48)
        self.assertEqual(p['late_fraction'], .6)
        self.assertEqual(p['prevented_cases'], 20)

    def test_threshold_is_algebra_not_achievable_effect(self):
        self.assertAlmostEqual(shift_threshold(.6)['fraction_of_baseline_late_cases_to_shift_for_equality'], 1/6)
        self.assertTrue(shift_threshold(.6)['strictly_more_than_threshold_required_to_flip'])
        self.assertTrue(shift_threshold(.4)['already_early_majority'])

    def test_zero_referrals_zero_cases_and_full_prevention(self):
        for changes in ({'reach': 0}, {'incident_cases': 0, 'specificity': 1}, {'prevented_fraction': 1, 'specificity': 1}):
            p = evaluate({**self.base, **changes})['projection']
            self.assertEqual(p['completed_confirmatory_actions'], 0)
            self.assertIsNone(p['referral_ppv'])

    def test_unknown_range_not_accepted_as_confidence_interval(self):
        fixed = {k:v for k,v in self.base.items() if k != 'reach'}
        r = sensitivity_envelope(fixed, {'reach': [0., 1.]})
        self.assertEqual(r['state'], 'SYNTHETIC_CORNER_SWEEP')
        self.assertEqual(len(r['corners']), 2)
        for bad in ({'reach': [1., 0.]}, {'reach': [None, 1.]}, {'reach': [0., 1.], 'bad': [0,1]}):
            with self.assertRaises((ValueError, TypeError)): sensitivity_envelope(fixed, bad)

    def test_extreme_finite_inputs_cannot_emit_infinite_ratios(self):
        with self.assertRaisesRegex(ValueError,'overflow'):
            evaluate({**self.base,'population':1e308,'incident_cases':1e308,'late_fraction':1e-320,'reach':0})


if __name__ == '__main__': unittest.main()
