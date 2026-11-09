"""Real archive replay when explicitly supplied; no fabricated positive source."""
import json,os,tempfile,unittest
from pathlib import Path
from state_sensitivity_replay import load,run,summary
ARCHIVE=os.environ.get('CHAINWEB_ARCHIVE')

class ArchiveAdmissionTests(unittest.TestCase):
    def test_changed_archive_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'not-original.zip';p.write_bytes(b'software-negative-control')
            with self.assertRaisesRegex(ValueError,'hash mismatch'):load(p)

@unittest.skipUnless(ARCHIVE,'Authorized original archive required; not an empirical pass')
class OriginalStateReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows,cls.receipt=load(ARCHIVE)
        cls.states={s:summary([r for r in cls.rows if r['state']==s]) for s in ('MS','TX')}
    def test_original_cells(self):
        self.assertEqual(self.receipt['original_cells_matched'],4368)
        self.assertEqual(self.receipt['original_rows_replayed'],672)
        self.assertEqual(self.receipt['manifest_files_verified'],18)
    def test_complete_frames(self):
        self.assertEqual((self.states['MS']['complete_counties'],self.states['TX']['complete_counties']),(75,179))
    def test_count_filter_changes_samples(self):
        self.assertEqual((self.states['MS']['retained_annual_count_ge16'],self.states['TX']['retained_annual_count_ge16']),(15,72))
        self.assertTrue(self.states['MS']['filter_is_not_original_suppression_rule'])
    def test_state_patterns_remain_separate(self):
        self.assertEqual(self.states['MS']['filtered_contrasts']['large_rate_gap_pairs'],0)
        self.assertEqual(self.states['TX']['filtered_contrasts']['large_rate_gap_pairs'],63)
        self.assertEqual(self.states['TX']['filtered_contrasts']['also_disjoint_marginal_intervals'],33)
    def test_rural_representation_changes(self):
        self.assertEqual(self.states['MS']['complete_geography']['Rural'],57)
        self.assertEqual(self.states['MS']['retained_geography']['Rural'],6)
        self.assertEqual(self.states['TX']['complete_geography']['Rural'],103)
        self.assertEqual(self.states['TX']['retained_geography']['Rural'],16)
if __name__=='__main__':unittest.main()
