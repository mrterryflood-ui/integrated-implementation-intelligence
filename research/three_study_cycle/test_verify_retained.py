import hashlib, tempfile, unittest
from pathlib import Path
from verify_retained import assess,load_json,KINDS

def source(i,ok=True):return {'id':i,'status':'ORIGINAL_BYTES_RETAINED' if ok else 'ACQUISITION_FAILED'}
def bundle(root):
    (root/'originals').mkdir();rows=[]
    for i,kind in KINDS.items():
        data={'zip':b'PK\x03\x04synthetic fixture, not a government source','pdf':b'%PDF-1.7 synthetic fixture','html':b'<html><body>synthetic fixture</body></html>'}[kind]
        p=root/'originals'/(i+'.'+kind);p.write_bytes(data)
        rows.append({**source(i),'path':str(p.relative_to(root)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    return {'sources':rows,'revision':'a'*40}
def numeric_result():return {'publication_gate':'SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY','age_domain_n':4856,'published_rounding_checks':{'ENDO':True,'PCOS':True,'UF':True}}
class FileAdmissionTests(unittest.TestCase):
    def test_partial_sources_not_scientific_success(self):
        r=assess({'sources':[source(i,i not in ('nsfg_codebook','nsfg_published')) for i in KINDS]}, {})
        self.assertEqual(r['retained_required_sources'],8);self.assertEqual(r['source_coverage'],'INCOMPLETE');self.assertEqual(r['byte_checked_required_sources'],0);self.assertEqual(r['mechanism_identification'],'NOT_ESTABLISHED')
    def test_full_labels_are_not_byte_verification(self):
        r=assess({'sources':[source(i) for i in KINDS]},numeric_result())
        self.assertEqual(r['source_coverage'],'RETENTION_LABELS_UNVERIFIED');self.assertEqual(r['nsfg_reproduction'],'NUMERIC_MATCH_SOURCE_ADMISSION_REQUIRED');self.assertFalse(r['scientific_release_authorized'])
    def test_duplicate_source_fails(self):
        with self.assertRaisesRegex(ValueError,'Duplicate source'):assess({'sources':[source('nsfg_female'),source('nsfg_female')]},{})
    def test_matching_files_still_do_not_certify_science(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);r=assess(receipt,numeric_result(),root,expected_revision='a'*40)
            self.assertEqual(r['byte_checked_required_sources'],10);self.assertEqual(r['source_coverage'],'REQUESTED_ORIGINAL_BYTES_INTEGRITY_CHECKED');self.assertFalse(r['scientific_release_authorized']);self.assertEqual(r['nci_original_source_reconciliation'],'OPEN');self.assertEqual(r['revision_binding']['state'],'MATCHES_DECLARED_EXPECTATION')
    def test_same_length_tamper_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);p=root/receipt['sources'][0]['path'];data=p.read_bytes();p.write_bytes(data[:-1]+b'!')
            self.assertEqual(assess(receipt,{},root)['integrity_rejected_source_ids'],['nsfg_female'])
    def test_missing_file_not_retained(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);(root/receipt['sources'][1]['path']).unlink();self.assertEqual(assess(receipt,{},root)['byte_checked_required_sources'],9)
    def test_boolean_byte_count_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);receipt['sources'][0]['bytes']=True;self.assertEqual(assess(receipt,{},root)['byte_checked_required_sources'],9)
    def test_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);receipt['sources'][0]['path']='../outside.zip';self.assertEqual(assess(receipt,{},root)['original_integrity']['nsfg_female']['state'],'NOT_ADMITTED')
    def test_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);p=root/receipt['sources'][0]['path'];p.unlink();p.symlink_to(root/receipt['sources'][1]['path']);self.assertEqual(assess(receipt,{},root)['byte_checked_required_sources'],9)
    def test_duplicate_file_not_independent_source(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);receipt['sources'][1]['path']=receipt['sources'][0]['path'];self.assertEqual(assess(receipt,{},root)['byte_checked_required_sources'],8)
    def test_matching_hash_wrong_format_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);row=receipt['sources'][0];data=b'<html>access denied</html>';(root/row['path']).write_bytes(data);row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());self.assertEqual(assess(receipt,{},root)['byte_checked_required_sources'],9)
    def test_dependency_failure_does_not_disable_unrelated_studies(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);receipt['sources'][1]['status']='ACQUISITION_FAILED';r=assess(receipt,numeric_result(),root)
            self.assertEqual(r['study_source_gates']['gynecologic_diagnosis'],'SOURCE_ADMISSION_INCOMPLETE');self.assertEqual(r['study_source_gates']['county_colorectal'],'SOURCE_BYTES_AVAILABLE_METHOD_REVIEW_OPEN');self.assertEqual(r['nsfg_reproduction'],'NUMERIC_MATCH_SOURCE_ADMISSION_REQUIRED')
    def test_one_subject_domain_discrepancy_remains_open(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);receipt=bundle(root);n=numeric_result();n['age_domain_n']=4855;self.assertEqual(assess(receipt,n,root)['nsfg_reproduction'],'ANALYTIC_DOMAIN_DISCREPANCY_REVIEW_REQUIRED')
    def test_gate_string_is_not_reproduction(self):
        r=assess({'sources':[source(i) for i in KINDS]},{'publication_gate':'SOURCE_REPRODUCED_POINT_ESTIMATES_ONLY'});self.assertEqual(r['nsfg_reproduction'],'REVIEW_REQUIRED')
    def test_merge_revision_not_silently_equal_to_head(self):
        r=assess({'sources':[source(i) for i in KINDS],'revision':'b'*40},{},expected_revision='a'*40);self.assertEqual(r['revision_binding']['state'],'REVISION_MISMATCH_REVIEW_REQUIRED')
    def test_malformed_receipt_not_empty_success(self):
        for bad in [None,{}, {'sources':None},{'sources':['not a source']},{'sources':[{'id':None}]}]:
            with self.assertRaises(ValueError):assess(bad,{})
    def test_duplicate_json_keys_rejected(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'receipt.json';p.write_text('{"sources":[],"sources":[]}')
            with self.assertRaisesRegex(ValueError,'Duplicate JSON'):load_json(p)
    def test_missing_ids_explicit(self):
        r=assess({'sources':[]},{});self.assertEqual(len(r['missing_source_ids']),10);self.assertEqual(r['source_coverage'],'INCOMPLETE')
if __name__=='__main__':unittest.main()
