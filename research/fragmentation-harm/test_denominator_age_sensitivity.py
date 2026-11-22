"""Mathematical/unit checks are fixtures; archive test requires real retained bytes."""
import math
import os
import tempfile
import unittest
from fractions import Fraction
from denominator_age_sensitivity import (
    W85, W90, CHECKOUT_SHA, compatible_counts, age_split_delta,
    necessary_top_rate_gap, provenance_state, audit_archive,
    bounded_share_comparison, unknown_stage_models,
)


def exact(quantity):
    return Fraction(quantity['numerator'], quantity['denominator'])


class BoundedComparisonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Source values are independently replayed in the real-archive tests.
        # These tests establish conditional arithmetic, not registry equivalence.
        cls.result = bounded_share_comparison(118, 75, '63.7', 1732, 1098, '63.4')

    def test_rounding_only_interval_is_open_and_not_sampling_uncertainty(self):
        bounds = self.result['published_share_rounding_difference_pp']
        self.assertEqual(exact(bounds['lower']), Fraction(1, 5))
        self.assertEqual(exact(bounds['upper']), Fraction(2, 5))
        self.assertFalse(bounds['lower_attained'])
        self.assertFalse(bounds['upper_attained'])
        self.assertIsNone(self.result['sampling_confidence_interval'])

    def test_same_case_denominator_has_75_combinations_and_sharp_bounds(self):
        result = self.result['same_all_case_denominator']
        self.assertEqual((result['first_configuration_count'], result['second_configuration_count']), (3, 25))
        self.assertEqual(result['joint_configuration_count'], 75)
        self.assertEqual(exact(result['difference_pp']['lower']), Fraction(598100, 2549781))
        self.assertEqual(exact(result['difference_pp']['upper']), Fraction(94960, 255529))
        self.assertTrue(result['difference_pp']['lower_attained'])
        self.assertTrue(result['difference_pp']['upper_attained'])
        self.assertEqual(result['extreme_witnesses']['lower']['first']['late'], 375)
        self.assertEqual(result['extreme_witnesses']['lower']['first']['all'], 589)
        self.assertEqual(result['extreme_witnesses']['lower']['second']['late'], 5492)
        self.assertEqual(result['extreme_witnesses']['lower']['second']['all'], 8658)

    def test_possible_exclusions_allow_sign_change_on_common_all_case_denominator(self):
        result = self.result['possible_denominator_exclusions']
        self.assertEqual((result['first_configuration_count'], result['second_configuration_count']), (18, 200))
        self.assertEqual(result['joint_configuration_count'], 3600)
        self.assertEqual((result['maximum_first_compatible_exclusion'], result['maximum_second_compatible_exclusion']), (6, 12))
        self.assertEqual(exact(result['difference_pp']['lower']), Fraction(-7375, 17316))
        self.assertEqual(exact(result['difference_pp']['upper']), Fraction(94960, 255529))
        witness = result['extreme_witnesses']['lower']['first']
        self.assertEqual((witness['late'], witness['all'], witness['share_denominator']), (373, 592, 586))
        self.assertFalse(result['exclusions_are_estimated_unknown_stage_counts'])

    def test_sensitivity_models_have_different_rounding_aware_envelopes(self):
        models = self.result['unknown_stage_sensitivity']
        removal = models['denominator_removal']['difference_pp_envelope']
        reclassification = models['unknown_reclassification']['difference_pp_envelope']
        self.assertEqual(exact(removal['lower']), Fraction(-97, 220))
        self.assertEqual(exact(removal['upper']), Fraction(689, 660))
        self.assertEqual(exact(reclassification['lower']), Fraction(-4, 5))
        self.assertEqual(exact(reclassification['upper']), Fraction(7, 5))
        self.assertFalse(removal['lower_attained'])
        self.assertFalse(reclassification['upper_attained'])

    def test_bounds_do_not_admit_equivalence_or_select_true_counts(self):
        self.assertFalse(self.result['exact_registry_counts_recovered'])
        self.assertFalse(self.result['registry_stage_comparability_established'])
        self.assertFalse(self.result['statistical_equivalence_established'])
        self.assertIsNone(self.result['clinical_causal_effect'])

    def test_incompatible_rounding_has_no_fabricated_zero_gap(self):
        result = bounded_share_comparison(118, 75, '40.0', 1732, 1098, '63.4')
        for model in ('same_all_case_denominator', 'possible_denominator_exclusions'):
            self.assertEqual(result[model]['status'], 'NO_COMPATIBLE_CONFIGURATION')
            self.assertEqual(result[model]['joint_configuration_count'], 0)
            self.assertIsNone(result[model]['difference_pp'])
            self.assertIsNone(result[model]['extreme_witnesses'])

    def test_invalid_rounding_or_unknown_fraction_is_rejected(self):
        for share, unknown in [('63.75', '0.01'), ('63.7', '1'), ('63.7', '-0.01'), ('63.7', '0.5'), ('63.7', True)]:
            with self.subTest(share=share, unknown=unknown), self.assertRaises(ValueError):
                bounded_share_comparison(118, 75, share, 1732, 1098, '63.4', max_unknown_fraction=unknown)

    def test_denominator_removal_and_reclassification_change_distinct_estimands(self):
        result = unknown_stage_models('50', '0.1', '0.5')
        self.assertEqual(exact(result['denominator_removal_percent']), Fraction(500, 9))
        self.assertEqual(exact(result['unknown_reclassification_percent']), Fraction(55))
        no_late_unknown = unknown_stage_models('50', '0.1', '0')
        self.assertEqual(exact(no_late_unknown['unknown_reclassification_percent']), Fraction(50))
        self.assertEqual(result['denominator_removal_percent'], no_late_unknown['denominator_removal_percent'])

    def test_hypothetical_half_percent_unknowns_can_reverse_center_gap(self):
        first = unknown_stage_models('63.7', '0')
        second = unknown_stage_models('63.4', '0.005')
        gap = exact(first['denominator_removal_percent']) - exact(second['denominator_removal_percent'])
        self.assertEqual(gap, Fraction(-37, 1990))

    def test_unknown_scenarios_reject_impossible_case_partitions(self):
        for args in [('90', '0.2', '0'), ('50', '1', '0'), ('50', '0.1', '1.1'), ('50', '0.1', '-0.1'), (True, '0.1', '0')]:
            with self.subTest(args=args), self.assertRaises(ValueError):
                unknown_stage_models(*args)


class SensitivityTests(unittest.TestCase):
    def test_hinds_three_compatible_not_identified_pairs(self):
        pairs = compatible_counts(118, 75, '63.7')
        self.assertEqual([(p['late'],p['all']) for p in pairs], [(375,589),(376,590),(377,592)])
    def test_harris_twenty_five_compatible_pairs(self):
        self.assertEqual(len(compatible_counts(1732,1098,'63.4')), 25)
    def test_rounding_can_fail_without_inventing_counts(self):
        self.assertEqual(compatible_counts(118,75,'80.0'), [])
    def test_invalid_counts_rejected(self):
        for args in [(True,75,'63.7'),(118,119,'63.7'),(118,1,'63.7'),(118,75,'101')]:
            with self.subTest(args=args), self.assertRaises(ValueError): compatible_counts(*args)
    def test_unapproved_period_rejected(self):
        with self.assertRaises(ValueError): compatible_counts(118,75,'63.7',4)
    def test_identical_top_rates_no_difference(self):
        self.assertEqual(age_split_delta(200,200,300,100),0)
    def test_standard_top_age_mix_no_difference(self):
        self.assertAlmostEqual(age_split_delta(300,100,2678567,1580606),0)
    def test_direct_weighting_identity(self):
        r85,r90,n85,n90 = 350,100,600,400
        direct = float(W85)*r85+float(W90)*r90-float(W85+W90)*(r85*n85+r90*n90)/(n85+n90)
        self.assertAlmostEqual(age_split_delta(r85,r90,n85,n90),direct,12)
    def test_delta_can_be_positive_or_negative(self):
        self.assertGreater(age_split_delta(300,100,1,1),0)
        self.assertLess(age_split_delta(300,100,9,1),0)
    def test_official_nci_worked_example_not_county_effect(self):
        # NCI tutorial: Black female breast cancer, SEER21, 2018-2022.
        # Published all-age rates 130.934 vs 130.998; not Hinds/Harris CRC.
        delta = age_split_delta(1707/420278*100000,903/295130*100000,420278,295130)
        self.assertEqual(round(delta,3),0.064)
    def test_invalid_age_inputs_rejected(self):
        for args in [(math.nan,1,1,1),(1,1,0,1),(1,1,1,-1),(True,1,1,1),(math.inf,1,1,1)]:
            with self.subTest(args=args), self.assertRaises(ValueError): age_split_delta(*args)
    def test_unconditional_mix_bound(self):
        for r85,r90 in [(300,100),(100,300),(0,1000)]:
            for n85,n90 in [(1,999),(500,500),(999,1)]:
                self.assertLessEqual(abs(age_split_delta(r85,r90,n85,n90)),float(max(W85,W90))*abs(r85-r90)+1e-12)
    def test_six_unit_necessary_threshold(self):
        self.assertAlmostEqual(necessary_top_rate_gap(6),615.1803751782203)
        self.assertLess(necessary_top_rate_gap(5.9),necessary_top_rate_gap(6))
    def test_provenance_disagreement_not_auto_merge_excuse(self):
        self.assertEqual(provenance_state('73455a439f950ffa0644d5714843b06b173f029a', CHECKOUT_SHA,CHECKOUT_SHA),
                         'CONTRADICTORY_REVISION_EVIDENCE_REQUIRES_ADJUDICATION')
    def test_matched_revisions_not_full_attestation(self):
        self.assertEqual(provenance_state(CHECKOUT_SHA,CHECKOUT_SHA,CHECKOUT_SHA),
                         'MATCHED_REPORTED_REVISIONS_NOT_FULL_ATTESTATION')
    def test_malformed_revision_rejected(self):
        with self.assertRaises(ValueError): provenance_state('main',CHECKOUT_SHA,CHECKOUT_SHA)
    def test_corrupt_archive_rejected(self):
        with tempfile.NamedTemporaryFile() as f:
            f.write(b'not the original archive'); f.flush()
            with self.assertRaisesRegex(ValueError,'Wrong archive SHA256'): audit_archive(f.name)
    def test_original_archive_when_supplied(self):
        path = os.getenv('DIS_NCI_ARCHIVE_PATH')
        if not path: self.skipTest('Original archive absent; not a successful empirical replay')
        result = audit_archive(path)
        self.assertEqual(result['manifest_entries_verified'],18)
        self.assertEqual(result['original_html_csv_rows_matched'],4)
        self.assertEqual(result['county_results']['hinds']['compatible_pair_count'],3)
        self.assertEqual(result['county_results']['harris']['compatible_pair_count'],25)
        self.assertIsNone(result['age_partition']['county_adjusted_rate'])
        self.assertIsNone(result['clinical_causal_effect'])
        self.assertIsNone(result['prevented_harm'])

if __name__ == '__main__': unittest.main()
