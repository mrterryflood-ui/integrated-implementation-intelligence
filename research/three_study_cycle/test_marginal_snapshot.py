import hashlib,json,shutil,tempfile,unittest
from pathlib import Path
from urllib.parse import urlencode
from marginal_snapshot import build
from reference_audit import base_query

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


class MarginalRestoreTest(unittest.TestCase):
    """Synthetic source documents exercise archive restoration and trust bounds."""
    def fixture(self,root):
        (root/'originals').mkdir(parents=True);records=[]
        for county,state,name,all_rate,late_rate in [('hinds','28','Hinds County',40,24),('harris','48','Harris County',30,18)]:
            for dimension,levels in [('age',[('009','<50'),('136','50+')]),('race',[('07','White (Non-Hispanic)'),('28','Black (Non-Hispanic)')])]:
                for code,label in levels:
                    for suffix,stage in [('all','999'),('late','211')]:
                        sid=f'{county}_{dimension}_{code}_{suffix}'
                        q=base_query(stage=stage,state=state,area='county');q.update({dimension:code,'year':'0','ruralurban':'0'})
                        controls=''.join(f'<select name="{key}"><option selected value="{value}">{label.replace("<","&lt;") if key==dimension else value}</option></select>' for key,value in q.items())
                        rate=late_rate if suffix=='late' else all_rate
                        share_header='<th>Percent of Cases with Late Stage</th>' if suffix=='late' else ''
                        share_cell='<td>60</td>' if suffix=='late' else ''
                        data=(f'<html><h2>Incidence Rate Report for Synthetic County Test, 2019-2023</h2><p>SYNTHETIC TEST ONLY</p>{controls}'
                              f'<table><tr><th>County</th><th>Age-Adjusted Incidence Rate</th><th>Average Annual Count</th>{share_header}</tr>'
                              f'<tr><td>{name}</td><td>{rate} ({rate-1}, {rate+1})</td><td>10</td>{share_cell}</tr></table></html>').encode()
                        p=root/'originals'/f'{sid}.html';p.write_bytes(data)
                        records.append({'id':sid,'path':str(p),'status':'ORIGINAL_BYTES_RETAINED','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),
                          'url':'https://statecancerprofiles.cancer.gov/incidencerates/index.php?'+urlencode(q),'finished_at':'2026-11-08T00:00:00+00:00',
                          'estimate':{'rate_per_100k':float(rate),'ci95':[float(rate-1),float(rate+1)],'average_annual_count':10.,'late_case_share_percent':60. if suffix=='late' else None}})
        receipt={'records':records};self.write_receipt(root,receipt);return receipt

    @staticmethod
    def write_receipt(root,receipt):
        (root/'marginal-acquisition-receipt.json').write_text(json.dumps(receipt))

    def test_restored_bundle_replays_after_acquisition_directory_is_removed(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'acquisition';restored=Path(d)/'restored';self.fixture(source)
            original=build(source);receipt_bytes=(source/'marginal-acquisition-receipt.json').read_bytes()
            shutil.copytree(source,restored);shutil.rmtree(source)
            replay=build(restored)
            self.assertEqual(replay,original)
            self.assertEqual(len(replay['sources']),16)
            self.assertEqual([s['lateRateDifference'] for s in replay['strata']],[6.,6.,6.,6.])
            self.assertEqual((restored/'marginal-acquisition-receipt.json').read_bytes(),receipt_bytes)

    def test_relative_source_paths_replay_without_changing_source_meaning(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);receipt=self.fixture(root);original=build(root)
            for row in receipt['records']:row['path']='originals/'+row['id']+'.html'
            self.write_receipt(root,receipt);replay=build(root)
            self.assertEqual(replay['sources'],original['sources'])
            self.assertEqual(replay['strata'],original['strata'])

    def test_two_registered_legacy_probe_names_survive_relocation(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'acquisition';restored=Path(d)/'restored';receipt=self.fixture(source)
            for county in ('hinds','harris'):
                row=next(r for r in receipt['records'] if r['id']==county+'_age_009_late')
                p=Path(row['path']);renamed=p.with_name('nci_'+county+'_under50_late_probe.html');p.rename(renamed);row['path']=str(renamed)
            self.write_receipt(source,receipt);original=build(source)
            shutil.copytree(source,restored);shutil.rmtree(source)
            self.assertEqual(build(restored),original)

    def test_legacy_probe_alias_is_bound_to_its_exact_source_identity(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);receipt=self.fixture(root)
            row=next(r for r in receipt['records'] if r['id']=='hinds_age_009_late')
            row['path']=str(root/'originals/nci_harris_under50_late_probe.html');self.write_receipt(root,receipt)
            with self.assertRaisesRegex(ValueError,'registered source identity'):build(root)

    def test_primary_and_legacy_originals_cannot_be_ambiguous(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);receipt=self.fixture(root)
            row=next(r for r in receipt['records'] if r['id']=='hinds_age_009_late')
            shutil.copyfile(row['path'],root/'originals/nci_hinds_under50_late_probe.html')
            with self.assertRaisesRegex(ValueError,'Ambiguous primary and legacy'):build(root)

    def test_missing_restored_file_never_reads_the_old_absolute_location(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/'acquisition';restored=Path(d)/'restored';receipt=self.fixture(source)
            shutil.copytree(source,restored)
            (restored/'originals'/Path(receipt['records'][0]['path']).name).unlink()
            self.assertTrue(Path(receipt['records'][0]['path']).is_file())
            with self.assertRaisesRegex(ValueError,'missing from the supplied'):build(restored)

    def test_path_must_match_registered_source_filename(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);receipt=self.fixture(root)
            receipt['records'][0]['path']=receipt['records'][1]['path'];self.write_receipt(root,receipt)
            with self.assertRaisesRegex(ValueError,'registered source identity'):build(root)

    def test_traversal_foreign_relative_and_non_posix_paths_are_rejected(self):
        paths=['originals/../originals/hinds_age_009_all.html','/prior/../originals/hinds_age_009_all.html',
               '../originals/hinds_age_009_all.html','elsewhere/hinds_age_009_all.html','originals\\hinds_age_009_all.html']
        for path in paths:
            with self.subTest(path=path),tempfile.TemporaryDirectory() as d:
                root=Path(d);receipt=self.fixture(root);receipt['records'][0]['path']=path;self.write_receipt(root,receipt)
                with self.assertRaisesRegex(ValueError,'path'):build(root)

    def test_symlinked_original_or_originals_directory_is_rejected(self):
        for kind in ('file','directory'):
            with self.subTest(kind=kind),tempfile.TemporaryDirectory() as d:
                root=Path(d);receipt=self.fixture(root)
                p=Path(receipt['records'][0]['path']) if kind=='file' else root/'originals'
                target=p.with_name(p.name+'-retained');p.rename(target);p.symlink_to(target,target_is_directory=kind=='directory')
                with self.assertRaisesRegex(ValueError,'Symlinked'):build(root)

    def test_portability_does_not_relax_source_query_scope(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);receipt=self.fixture(root)
            receipt['records'][0]['url']=receipt['records'][0]['url'].replace('age=009','age=001');self.write_receipt(root,receipt)
            with self.assertRaisesRegex(ValueError,'query does not match'):build(root)

if __name__=='__main__':unittest.main()
