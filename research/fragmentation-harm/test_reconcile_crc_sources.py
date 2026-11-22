"""Real retained-source replay and rejection tests; no skipped positive fixtures."""
import csv
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import reconcile_crc_sources as replay


class RetainedSourceReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with zipfile.ZipFile(replay.DEFAULT_ARCHIVE) as archive:
            cls.entries = {name: archive.read(name) for name in archive.namelist()}
        cls.result = replay.reconcile_sources()

    def write_altered_package(self, path, mutate):
        entries = dict(self.entries)
        mutate(entries)
        with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
            for name, raw in entries.items():
                archive.writestr(name, raw)
        return replay.sha256(path.read_bytes())

    def test_real_source_frame_and_all_cells_are_verified(self):
        result = self.result['source_verification']
        self.assertEqual(result['selected_original_entries_verified'], 8)
        self.assertEqual(result['derived_manifest_entries_verified'], 11)
        self.assertEqual(result['tables_compared'], 4)
        self.assertEqual(result['all_table_data_cells_compared'], 4420)
        self.assertEqual(result['county_data_cells_compared'], 4368)
        self.assertEqual(result['county_rows_compared_across_all_and_late_tables'], 672)
        self.assertEqual(result['distinct_counties'], 336)
        self.assertEqual(result['reference_na_cells_normalized'], 16)
        self.assertFalse(result['parent_original_archive_replayed_by_this_consumer'])
        self.assertIn('CONTRADICTORY', result['revision_binding_state'])

    def test_actual_rows_drive_the_bounded_comparison(self):
        observed = self.result['published_observations']
        self.assertEqual([observed[key]['average_annual_count'] for key in replay.STEMS], [118, 75, 1732, 1098])
        self.assertEqual(observed['hinds_late']['published_late_stage_share_percent'], '63.7')
        self.assertEqual(observed['harris_late']['published_late_stage_share_percent'], '63.4')
        self.assertEqual(observed['hinds_all']['source_reported_rate_95pct_ci'], [42.6, 50.5])
        self.assertEqual(observed['harris_all']['source_reported_rate_95pct_ci'], [37.2, 38.9])
        bounded = self.result['bounded_late_stage_share_analysis']
        self.assertEqual(bounded['same_all_case_denominator']['joint_configuration_count'], 75)
        self.assertEqual(bounded['possible_denominator_exclusions']['joint_configuration_count'], 3600)
        self.assertAlmostEqual(bounded['possible_denominator_exclusions']['difference_pp']['lower']['decimal'], -0.4259066759066759)
        self.assertIn('not jointly sharpened', bounded['unknown_stage_sensitivity']['uncertainty_basis'])

    def test_separate_cdc_counts_do_not_replace_original_stage_denominators(self):
        cdc = self.result['separate_cdc_all_stage_comparison']
        self.assertEqual([int(row['COUNT']) for row in cdc['rows']], [589, 8661])
        self.assertEqual(cdc['all_stage_rate_difference_per_100000'], 8.4)
        self.assertAlmostEqual(cdc['all_stage_rate_ratio_Hinds_over_Harris'], 116/95)
        self.assertFalse(cdc['original_scp_case_universe_correspondence_established'])
        self.assertFalse(cdc['county_stage_counts_recovered'])
        bounded = self.result['bounded_late_stage_share_analysis']['same_all_case_denominator']
        self.assertEqual(len({row['all'] for row in bounded['second_configurations']}), 5)

    def test_result_keeps_scientific_limits_and_unexecuted_crosswalk_explicit(self):
        disposition = self.result['disposition']
        self.assertEqual(disposition['retained_source_replay'], 'COMPLETED')
        self.assertEqual(disposition['harmonized_stage_comparison'], 'NOT_ESTABLISHED')
        self.assertEqual(disposition['exact_original_stage_counts'], 'NOT_RECOVERED')
        self.assertFalse(disposition['bounds_are_sampling_confidence_intervals'])
        methods = self.result['documented_methods']
        self.assertFalse(methods['category_crosswalk_executed_on_county_stage_counts'])
        self.assertEqual(set(methods['file_sha256']), {'stage_selection_crosswalk.json', 'evidence_manifest.json', 'evidence_excerpts.json'})

    def test_crude_rates_use_the_pooled_denominator_without_dividing_by_five_again(self):
        crude = self.result['separate_cdc_all_stage_comparison']['crude_all_stage_incidence']
        self.assertAlmostEqual(crude['rows'][0]['crude_annual_rate_per_100000'], 53.00370845980582)
        self.assertAlmostEqual(crude['rows'][1]['crude_annual_rate_per_100000'], 36.256788990595254)
        self.assertAlmostEqual(crude['rate_difference_per_100000'], 16.746919469210567)
        self.assertAlmostEqual(crude['rate_ratio_Hinds_over_Harris'], 1.4618974800431057)
        self.assertFalse(crude['age_standardized'])
        self.assertFalse(crude['confidence_intervals_recalculated'])
        self.assertIn('person-year approximation', crude['denominator_scope'])

    def test_corrupted_derived_archive_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'changed.zip'
            path.write_bytes(replay.DEFAULT_ARCHIVE.read_bytes() + b'changed')
            with self.assertRaisesRegex(ValueError, 'package SHA-256 mismatch'):
                replay.reconcile_sources(path)

    def test_missing_member_is_rejected_independently_of_outer_pin(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'missing.zip'
            digest = self.write_altered_package(path, lambda entries: entries.pop('originals/hinds_late.html'))
            # Negative tests bypass only the outer pin to exercise inner guards.
            # No replacement archive is accepted as a positive scientific source.
            with patch.object(replay, 'DERIVED_ZIP_SHA256', digest):
                with self.assertRaisesRegex(ValueError, 'missing, duplicate, or unexpected'):
                    replay.load_retained_sources(path)

    def test_manifest_mismatch_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'changed.zip'
            name = 'originals/hinds_late.html'
            digest = self.write_altered_package(path, lambda entries: entries.update({name: entries[name] + b'\n'}))
            with patch.object(replay, 'DERIVED_ZIP_SHA256', digest):
                with self.assertRaisesRegex(ValueError, 'Derived manifest hash mismatch'):
                    replay.load_retained_sources(path)

    def test_rewritten_package_manifest_cannot_redefine_original_bytes(self):
        def mutate(entries):
            name = 'originals/hinds_late.html'
            entries[name] += b'\n'
            manifest = json.loads(entries['MANIFEST_SHA256.json'])
            manifest[name] = replay.sha256(entries[name])
            entries['MANIFEST_SHA256.json'] = json.dumps(manifest).encode()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'rebound.zip'
            digest = self.write_altered_package(path, mutate)
            with patch.object(replay, 'DERIVED_ZIP_SHA256', digest):
                with self.assertRaisesRegex(ValueError, 'Pinned original source hash mismatch'):
                    replay.load_retained_sources(path)

    def test_changed_period_population_stage_or_geography_scope_is_rejected(self):
        html = self.entries['originals/hinds_late.html']
        table = self.entries['extracted/hinds_late_table_0.csv']
        for before, after in [(b'2019-2023', b'2018-2022'), (b'Both Sexes', b'Females'),
                              (b'All Races (includes Hispanic)', b'White Non-Hispanic')]:
            with self.subTest(before=before):
                changed = html.replace(before, after)
                self.assertNotEqual(changed, html)
                with self.assertRaisesRegex(ValueError, 'report scope differs'):
                    replay.parse_county_table('hinds_late', changed, table)
        for wrong_stem in ('hinds_all', 'harris_late'):
            with self.subTest(wrong_stem=wrong_stem), self.assertRaisesRegex(ValueError, 'report scope differs'):
                replay.parse_county_table(wrong_stem, html, table)

    def test_county_suppression_cannot_be_normalized_to_zero(self):
        name = 'extracted/hinds_late_table_0.csv'
        rows = list(csv.reader(io.StringIO(self.entries[name].decode('utf-8-sig'))))
        suppressed = next(row for row in rows[1:] if '3 or fewer' in row)
        suppressed[suppressed.index('3 or fewer')] = '0'
        output = io.StringIO()
        csv.writer(output).writerows(rows)
        with self.assertRaisesRegex(ValueError, 'HTML/CSV table cells differ'):
            replay.parse_county_table('hinds_late', self.entries['originals/hinds_late.html'], output.getvalue().encode())

    def test_another_county_row_cannot_replace_the_named_target(self):
        html = self.entries['originals/hinds_late.html'].replace(b'Hinds County', b'Imaginary County')
        table = self.entries['extracted/hinds_late_table_0.csv'].replace(b'Hinds County', b'Imaginary County')
        with self.assertRaisesRegex(ValueError, 'Target county/source marker missing'):
            replay.parse_county_table('hinds_late', html, table)

    def test_changed_cdc_counts_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'cdc_rows.json'
            data = json.loads((replay.ROOT / 'uscs_exact_allstage_county_rows.json').read_text())
            data['rows'][1]['COUNT'] = '8660'
            path.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'CDC extracted rows SHA-256 mismatch'):
                replay.reconcile_sources(cdc_rows=path)


class ReplayCliTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(Path(replay.__file__)), *map(str, args)],
                              capture_output=True, text=True, timeout=10)

    def test_output_and_check_are_deterministic_and_check_never_overwrites(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'results.json'
            written = self.run_cli('--output', path)
            self.assertEqual(written.returncode, 0, written.stderr)
            self.assertEqual(path.read_text(), replay.render_results(replay.reconcile_sources()))
            matched = self.run_cli('--check', path)
            self.assertEqual(matched.returncode, 0, matched.stderr)
            self.assertIn('stage comparability remains unestablished', matched.stdout)
            changed = json.loads(path.read_text())
            changed['separate_cdc_all_stage_comparison']['all_stage_rate_difference_per_100000'] = 0
            path.write_text(json.dumps(changed))
            before = path.read_bytes()
            refused = self.run_cli('--check', path)
            self.assertEqual(refused.returncode, 1)
            self.assertIn('do not match deterministic source replay', refused.stderr)
            self.assertEqual(path.read_bytes(), before)

    def test_default_committed_result_reproduces(self):
        result = self.run_cli('--check')
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_bad_source_returns_failure_without_claim_output_or_traceback(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'not-original.zip'
            path.write_bytes(b'not retained sources')
            result = self.run_cli(path)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stdout, '')
            self.assertNotIn('Traceback', result.stderr)

    def test_requested_cdc_original_never_falls_back_to_compact_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'not-original-cdc.zip'
            path.write_bytes(b'not the original CDC data')
            result = self.run_cli('--cdc-archive', path, '--check')
            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stdout, '')
            self.assertIn('Original CDC ZIP SHA-256 mismatch', result.stderr)
            self.assertNotIn('CDC_ORIGINAL_MATCH', result.stderr)


if __name__ == '__main__':
    unittest.main()
