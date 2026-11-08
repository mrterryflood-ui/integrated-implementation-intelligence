import hashlib,json,tempfile,unittest
from pathlib import Path
from marginal_snapshot import build

class MarginalAdmissionTest(unittest.TestCase):
    def fixture(self,root):
        (root/'originals').mkdir();records=[]
        for county in ('hinds','harris'):
            for dimension,codes in [('age',('009','136')),('race',('07','28'))]:
                for code in codes:
                    for stage in ('all','late'):
                        sid=f'{county}_{dimension}_{code}_{stage}';p=root/'originals'/f'{sid}.html'
                        # Signature-only negative fixture. Never a data source.
                        data=b'<html>synthetic admission test only</html>';p.write_bytes(data)
                        records.append({'id':sid,'path':str(p),'status':'ORIGINAL_BYTES_RETAINED','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'url':'https://statecancerprofiles.cancer.gov/incidencerates/index.php?synthetic=1','finished_at':'2026-11-08T00:00:00+00:00'})
        r={'records':records};(root/'marginal-acquisition-receipt.json').write_text(json.dumps(r));return r
    def test_duplicate_source_identity_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);r=self.fixture(p);r['records'][1]['id']=r['records'][0]['id'];(p/'marginal-acquisition-receipt.json').write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,'sixteen distinct'):build(p)
    def test_changed_original_cannot_reuse_prior_receipt(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);r=self.fixture(p);Path(r['records'][0]['path']).write_bytes(b'<html>tampered</html>')
            with self.assertRaisesRegex(ValueError,'byte mismatch'):build(p)
    def test_source_origin_cannot_be_swapped(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);r=self.fixture(p);r['records'][0]['url']='https://example.org/pretend-registry';(p/'marginal-acquisition-receipt.json').write_text(json.dumps(r))
            with self.assertRaisesRegex(ValueError,'origin changed'):build(p)
    def test_admitted_signatures_alone_cannot_create_empirical_output(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);self.fixture(p)
            with self.assertRaises(ValueError):build(p)

if __name__=='__main__':unittest.main()
