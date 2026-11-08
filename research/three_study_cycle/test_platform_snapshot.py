import hashlib,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from platform_snapshot import build
from verify_retained import KINDS

class PlatformSnapshotAdmissionTest(unittest.TestCase):
    def fixture(self,root):
        # Signature-only synthetic files test early denial. They must never
        # reach an estimate or become an empirical-data fixture.
        (root/'originals').mkdir()
        rows=[]
        for key,kind in KINDS.items():
            data={'zip':b'PK-synthetic-signature-only','pdf':b'%PDF-synthetic-signature-only','html':b'<html>synthetic-signature-only</html>'}[kind]
            p=root/'originals'/f'{key}.{kind}';p.write_bytes(data)
            rows.append({'id':key,'status':'ORIGINAL_BYTES_RETAINED','path':str(p.relative_to(root)),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
        receipt={'sources':rows};(root/'acquisition_receipt.json').write_text(json.dumps(receipt));return receipt
    def test_missing_original_is_rejected_before_analysis(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.fixture(root);(root/'originals/hinds_all.html').unlink()
            with patch('platform_snapshot.analyze.verify_inputs') as analysis:
                with self.assertRaisesRegex(ValueError,'byte admission'):build(root)
                analysis.assert_not_called()
    def test_byte_tampering_is_rejected_before_analysis(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.fixture(root);(root/'originals/harris_late.html').write_bytes(b'<html>changed</html>')
            with patch('platform_snapshot.analyze.verify_inputs') as analysis:
                with self.assertRaisesRegex(ValueError,'byte admission'):build(root)
                analysis.assert_not_called()
    def test_duplicate_source_identity_is_not_independent_evidence(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);r=self.fixture(root);r['sources'].append(r['sources'][0]);(root/'acquisition_receipt.json').write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,'Duplicate source'):build(root)
    def test_signature_only_files_cannot_generate_a_successful_snapshot(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);self.fixture(root)
            with self.assertRaises((OSError,ValueError)):build(root)

if __name__=='__main__':unittest.main()
