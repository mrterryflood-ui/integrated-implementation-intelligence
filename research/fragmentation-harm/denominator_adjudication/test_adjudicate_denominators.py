"""Meaningful failure-path and independent-replay checks for DEN adjudication."""
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest

import adjudicate_denominators as audit

ARCHIVE = os.environ.get('DIS_NCI_ARCHIVE_PATH')


class BoundaryChecks(unittest.TestCase):
    def test_suppressed_count_is_not_three_or_zero(self):
        self.assertEqual(audit.read_count('3 or fewer'), (None, 'SUPPRESSED'))

    def test_observed_zero_preserved(self):
        self.assertEqual(audit.read_count('0'), (0, 'OBSERVED_ZERO'))

    def test_malformed_rate_rejected(self):
        with self.assertRaises(ValueError):
            audit.read_rate('12.0 (15.0, 20.0)')

    def test_unknown_count_token_rejected(self):
        with self.assertRaises(ValueError):
            audit.read_count('not collected')

    def test_boolean_count_not_measurement(self):
        with self.assertRaises(ValueError):
            audit.integer_range(True)

    def test_period_threshold_differs_from_annual_filter(self):
        self.assertEqual(list(audit.integer_range(3)), [16, 17])
        self.assertIn(78, audit.integer_range(16))
        self.assertNotIn(16, audit.integer_range(16))

    def test_suppressed_denominator_not_reconstructed(self):
        with self.assertRaises(ValueError):
            audit.rounding_witnesses({'complete': False}, exclusions=True)

    def test_age_partition_can_have_either_sign_or_no_effect(self):
        report = audit.age_partition_assessment()
        effects = [row['R20_minus_R19'] for row in report['signed_fixtures']]
        self.assertGreater(effects[0], 0)
        self.assertLess(effects[1], 0)
        self.assertEqual(effects[2:], [0, 0])
        self.assertIsNone(report['adjusted_harris_rate'])


@unittest.skipUnless(ARCHIVE, 'Original archive required; never silently substitute fixtures')
class OriginalArchiveChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows, cls.provenance = audit.load_archive(ARCHIVE)

    def test_original_manifest_and_all_county_cells(self):
        self.assertEqual(self.provenance['manifest_entries_verified'], 18)
        self.assertEqual(self.provenance['html_csv_cells_verified'], 4368)
        self.assertEqual(len(self.rows), 336)

    def test_tampered_archive_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            altered = Path(directory) / 'altered.zip'
            altered.write_bytes(Path(ARCHIVE).read_bytes() + b'changed')
            with self.assertRaises(ValueError):
                audit.load_archive(altered)

    def test_two_denominator_conventions_fit_same_printed_counts(self):
        result = audit.denominator_assessment(self.rows)
        for county, count in [('Hinds County', 3), ('Harris County', 25)]:
            target = result['targets'][county]
            self.assertEqual(target['same_all_case_denominator_compatible_pairs'], count)
            self.assertEqual(target['arithmetic_witness_without_exclusion']['excluded_count'], 0)
            self.assertGreater(target['arithmetic_witness_with_exclusion']['excluded_count'], 0)
            self.assertFalse(target['are_recovered_counts'])
        self.assertEqual(result['same_denominator_rounding_incompatible_counties'], [])

    def test_source_suppression_and_county_selection_are_preserved(self):
        completeness, sensitivity, pairs = audit.county_selection(self.rows)
        self.assertEqual(completeness['MS']['ALL']['incomplete_counties'], 7)
        self.assertEqual(completeness['TX']['ALL']['incomplete_counties'], 75)
        self.assertEqual(completeness['TX']['Rural']['incomplete_counties'], 65)
        self.assertEqual(sensitivity['MS']['16']['0.5']['county_count'], 15)
        self.assertEqual(sensitivity['TX']['16']['0.5']['county_count'], 72)
        self.assertEqual(len(pairs['MS']), 0)
        self.assertEqual(len(pairs['TX']), 63)

    def test_independent_results_match_pinned_science_replay(self):
        reference_path = Path(__file__).parent / 'pinned' / 'expanded_county_test.py'
        spec = importlib.util.spec_from_file_location('pinned_expanded', reference_path)
        reference = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(reference)
        original_rows, _ = reference.load_counties(ARCHIVE)
        _, sensitivity, _ = audit.county_selection(self.rows)
        for state in ('MS', 'TX'):
            expected = reference.summarize([r for r in original_rows if r['state'] == state])
            for window in ('0.3', '0.5', '1.0'):
                got = sensitivity[state]['0'][window]
                want = expected['share_window_tests'][window]
                self.assertEqual(got['near_share_pairs'], want['near_share_pairs'])
                self.assertEqual(got['large_rate_gap_pairs'], want['late_rate_gap_at_least_5_pairs'])
                self.assertEqual(got['rounding_robust_large_gap_pairs'], want['rounding_robust_both_criteria'])
                self.assertEqual(got['large_gap_pairs_with_disjoint_intervals'], want['also_disjoint_marginal_rate_intervals'])


if __name__ == '__main__':
    unittest.main()
