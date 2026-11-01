import copy
import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('gate',Path(__file__).resolve().parents[1]/'scripts/engineering_receipt_gate.py')
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
SHA='a'*40
class ReceiptGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        payload=b'SYNTHETIC policy-validator fixture; not application acceptance.'
        (self.root/'proof.txt').write_bytes(payload)
        artifact={'path':'proof.txt','sha256':hashlib.sha256(payload).hexdigest()}
        checks={n:{'revision':SHA,'result':'passed','executedAt':'2026-11-01T23:00:00Z','command':'fixture validation','mode':'synthetic','artifacts':[copy.deepcopy(artifact)]} for n in gate.CANDIDATE_DOMAINS}
        checks['independent_review'].update(reviewer='distinct-fixture-reviewer',provider='internal-audit',criticalOpen=0,highOpen=0)
        self.m={'policyId':gate.POLICY_ID,'policyVersion':gate.POLICY_VERSION,'revision':SHA,'stage':'candidate','builder':'fixture-builder','unresolvedBlockers':[], 'requirements':[{'id':'TEST-1','status':'accepted','implementation':['fixture'],'tests':['fixture']}], 'checks':checks}
    def tearDown(self): self.temp.cleanup()
    def validate(self,m=None,stage='candidate'): return gate.validate(self.m if m is None else m,self.root,SHA,stage)
    def test_consistent_fixture_is_not_application_proof(self): self.assertEqual(self.validate(),[])
    def test_every_required_gate_is_required(self):
        for n in gate.CANDIDATE_DOMAINS:
            with self.subTest(n=n):
                m=copy.deepcopy(self.m);del m['checks'][n];self.assertTrue(self.validate(m))
    def test_non_success_never_counts(self):
        for result in ['neutral','skipped','pending','failed','cancelled','timed_out','quota_limited',None]:
            with self.subTest(result=result):
                m=copy.deepcopy(self.m);m['checks']['independent_review']['result']=result;self.assertTrue(self.validate(m))
    def test_wrong_revision_at_any_gate_is_rejected(self):
        for n in gate.CANDIDATE_DOMAINS:
            m=copy.deepcopy(self.m);m['checks'][n]['revision']='b'*40;self.assertTrue(self.validate(m))
    def test_unresolved_requirement_and_unknown_blockers_fail(self):
        self.m['requirements'][0]['status']='implemented';self.assertTrue(self.validate())
        self.m['requirements'][0]['status']='accepted';self.m['unresolvedBlockers']=None;self.assertTrue(self.validate())
    def test_no_artifacts_is_not_evidence(self): self.m['checks']['resilience']['artifacts']=[];self.assertTrue(self.validate())
    def test_hash_tampering_is_detected(self): (self.root/'proof.txt').write_text('altered');self.assertTrue(self.validate())
    def test_traversal_and_absolute_path_are_rejected(self):
        for path in ['../proof.txt','/tmp/proof.txt']:
            m=copy.deepcopy(self.m);m['checks']['resilience']['artifacts'][0]['path']=path;self.assertTrue(self.validate(m))
    def test_symlink_is_rejected(self):
        (self.root/'alias.txt').symlink_to(self.root/'proof.txt');self.m['checks']['resilience']['artifacts'][0]['path']='alias.txt';self.assertTrue(self.validate())
    def test_builder_is_not_independent_reviewer(self): self.m['checks']['independent_review']['reviewer']='fixture-builder';self.assertTrue(self.validate())
    def test_retired_cursor_cannot_satisfy_new_contract(self):
        for provider in ['Cursor','Cursor Bugbot','Bugbot']:
            self.m['checks']['independent_review']['provider']=provider;self.assertTrue(self.validate())
    def test_findings_zero_must_be_explicit_numeric(self):
        for count in [None,False,1,-1,'0']:
            self.m['checks']['independent_review']['criticalOpen']=count;self.assertTrue(self.validate())
    def test_unreviewed_not_applicable_fails(self): self.m['checks']['persistence_migrations']['result']='not_applicable';self.assertTrue(self.validate())
    def test_documented_scoped_applicability(self):
        self.m['checks']['persistence_migrations'].update(result='not_applicable',rationale='Documentation-only change with no persistence or schema impact.',reviewedBy='distinct-fixture-reviewer');self.assertEqual(self.validate(),[])
    def test_review_itself_cannot_be_not_applicable(self):
        self.m['checks']['independent_review'].update(result='not_applicable',rationale='Attempt to omit an independent review.',reviewedBy='another-reviewer');self.assertTrue(self.validate())
    def test_candidate_never_implies_deployed(self): self.assertTrue(self.validate(stage='deployed'))
    def test_live_deployment_requires_identity_and_behavioral_receipts(self):
        self.m['stage']='deployed';self.m['checks']['deployment']=copy.deepcopy(self.m['checks']['requirements']);self.assertTrue(self.validate(stage='deployed'))
        self.m['checks']['deployment'].update(mode='live',deployedRevision=SHA,deploymentId='fixture-deploy',environment='fixture',healthProbe='fixture-health',behavioralProbe='fixture-behavior',rollbackReference='fixture-rollback');self.assertEqual(self.validate(stage='deployed'),[])
    def test_invalid_calendar_and_ambiguous_timestamps_fail(self):
        for date in ['2026-02-30T10:00:00Z','2026-11-01T23:00:00','2026-11-01T24:00:00Z',None]:
            self.m['checks']['resilience']['executedAt']=date;self.assertTrue(self.validate())
    def test_bad_root_manifest_is_handled(self): self.assertTrue(gate.validate([],self.root,SHA))
    def test_unknown_stage_and_short_sha_fail(self):
        self.assertTrue(gate.validate(self.m,self.root,SHA,'unknown'));self.assertTrue(gate.validate(self.m,self.root,'a'*7))
    def test_requirement_duplicates_and_no_traceability_fail(self):
        self.m['requirements'].append(copy.deepcopy(self.m['requirements'][0]));self.assertTrue(self.validate())
        self.m['requirements']=self.m['requirements'][:1];self.m['requirements'][0]['tests']=[];self.assertTrue(self.validate())
if __name__=='__main__':unittest.main()
