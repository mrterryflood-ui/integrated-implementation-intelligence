"""Mathematical/unit checks are fixtures; archive test requires real retained bytes."""
import math
import os
import tempfile
import unittest
from denominator_age_sensitivity import (
    W85, W90, CHECKOUT_SHA, compatible_counts, age_split_delta,
    necessary_top_rate_gap, provenance_state, audit_archive,
)

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
