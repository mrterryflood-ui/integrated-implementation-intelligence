import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from refresh_candidate import run
from verify_retained import KINDS

REVISION = 'a' * 40


class RefreshCandidateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'cycle'
        (self.root / 'originals').mkdir(parents=True)
        self.baseline = Path(self.tmp.name) / 'accepted-baseline.json'
        self.baseline.write_text('{"accepted": true}\n')
        rows = []
        for source, kind in KINDS.items():
            data = {'zip': b'PK-synthetic-only', 'pdf': b'%PDF-synthetic-only', 'html': b'<html>synthetic-only</html>'}[kind]
            path = self.root / 'originals' / f'{source}.{kind}'
            path.write_bytes(data)
            rows.append({'id': source, 'status': 'ORIGINAL_BYTES_RETAINED', 'path': str(path.relative_to(self.root)),
                         'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        self.receipt = {'schema': 'dis-three-study-original-cycle-v1', 'revision': REVISION, 'sources': rows}
        self.write_receipt()

    def write_receipt(self):
        (self.root / 'acquisition_receipt.json').write_text(json.dumps(self.receipt))

    def unavailable_docs(self):
        for row in self.receipt['sources']:
            if row['id'] in ('nsfg_codebook', 'nsfg_published'):
                (self.root / row['path']).unlink()
                row.update(status='ACQUISITION_FAILED', http_status=403, error='HTTPError: 403 Forbidden', url='https://www.cdc.gov/synthetic-test')
        self.write_receipt()

    def test_recorded_403s_emit_no_candidate_and_preserve_sources_and_baseline(self):
        self.unavailable_docs()
        before = {p: p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        with patch('refresh_candidate.project') as project:
            result = run(self.root, REVISION, self.baseline)
            project.assert_not_called()
        self.assertEqual(result['state'], 'NO_REFRESH_CANDIDATE')
        self.assertEqual(result['byteAdmittedSources'], 8)
        self.assertEqual(result['requiredSources'], 10)
        self.assertEqual(result['failedSourceIds'], ['nsfg_codebook', 'nsfg_published'])
        self.assertEqual([r['http_status'] for r in result['acquisitionFailures']], [403, 403])
        self.assertFalse(result['projectionCreated'])
        self.assertFalse((self.root / 'platform-calibration-supplement.json').exists())
        self.assertEqual(before, {p: p.read_bytes() for p in before})
        self.assertEqual(result['baselineSha256Before'], result['baselineSha256After'])
        self.assertEqual(self.baseline.read_text(), '{"accepted": true}\n')

    def test_incomplete_acquisition_does_not_hide_corrupted_retained_bytes(self):
        self.unavailable_docs()
        (self.root / 'originals/hinds_all.html').write_text('<html>tampered</html>')
        with self.assertRaisesRegex(ValueError, 'integrity failure'):
            run(self.root, REVISION, self.baseline)
        self.assertFalse((self.root / 'refresh_candidate_status.json').exists())

    def test_complete_admission_calls_existing_projection(self):
        def synthetic_projection(root, output):
            output.write_text('{"synthetic_controller_test": true}\n')
        with patch('refresh_candidate.project', side_effect=synthetic_projection) as project:
            result = run(self.root, REVISION, self.baseline)
            project.assert_called_once_with(self.root, self.root / 'platform-calibration-supplement.json')
        self.assertEqual(result['state'], 'REFRESH_CANDIDATE_CREATED')
        self.assertTrue(result['projectionCreated'])
        self.assertEqual(result['byteAdmittedSources'], 10)

    def test_complete_admission_does_not_hide_calculation_failure(self):
        with patch('refresh_candidate.project', side_effect=subprocess.CalledProcessError(1, 'projection')):
            with self.assertRaises(subprocess.CalledProcessError):
                run(self.root, REVISION, self.baseline)
        self.assertFalse((self.root / 'refresh_candidate_status.json').exists())

    def test_duplicate_missing_or_unknown_source_records_are_fatal(self):
        original = json.loads(json.dumps(self.receipt))
        for mutate in (lambda rows: rows.append(rows[0]), lambda rows: rows.pop(), lambda rows: rows[0].update(status='READY')):
            self.receipt = json.loads(json.dumps(original))
            mutate(self.receipt['sources'])
            self.write_receipt()
            with self.assertRaises(ValueError):
                run(self.root, REVISION, self.baseline)

    def test_wrong_revision_is_fatal_even_when_documents_unavailable(self):
        self.unavailable_docs()
        with self.assertRaisesRegex(ValueError, 'revision'):
            run(self.root, 'b' * 40, self.baseline)

    def test_stale_projection_is_preserved_and_cannot_look_new(self):
        self.unavailable_docs()
        output = self.root / 'platform-calibration-supplement.json'
        output.write_text('prior projection')
        with self.assertRaisesRegex(ValueError, 'already exists'):
            run(self.root, REVISION, self.baseline)
        self.assertEqual(output.read_text(), 'prior projection')

    def test_stale_refresh_receipt_is_preserved_and_cannot_look_new(self):
        self.unavailable_docs()
        output = self.root / 'refresh_candidate_status.json'
        output.write_text('{"state": "NO_REFRESH_CANDIDATE", "prior": true}')
        prior = output.read_bytes()
        with self.assertRaisesRegex(ValueError, 'already exists'):
            run(self.root, REVISION, self.baseline)
        self.assertEqual(output.read_bytes(), prior)

    def test_baseline_mutation_is_detected(self):
        def changing_projection(root, output):
            output.write_text('{}')
            self.baseline.write_text('changed')
        with patch('refresh_candidate.project', side_effect=changing_projection):
            with self.assertRaisesRegex(ValueError, 'baseline changed'):
                run(self.root, REVISION, self.baseline)


if __name__ == '__main__':
    unittest.main()
