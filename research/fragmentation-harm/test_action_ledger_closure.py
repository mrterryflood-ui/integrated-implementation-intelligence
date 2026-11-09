"""Closure regression controls only: no clinical records or independent acceptance."""
import copy, importlib.util, json, unittest
from pathlib import Path
from action_ledger import validate, canonical_receipt, case_summary
from test_action_ledger import fixture, ev

def bad_cases():
    cases={}
    cases['lone_completed']=[ev('case_closed',7,closure_basis='completed')]
    cases['missing_action']=[e for e in fixture() if e['event_type']!='action_recorded']
    cases['missing_outcome_status']=[e for e in fixture() if e['event_type']!='outcome_observed']
    cases['empty_action_evidence']=fixture();cases['empty_action_evidence'][5]['evidence_refs']=[]
    cases['empty_closure_evidence']=fixture();cases['empty_closure_evidence'][7]['evidence_refs']=[]
    cases['unapproved_no_action']=[ev('case_closed',7,closure_basis='no_action',closure_reason='test')]
    cases['unreviewed_insufficiency']=[ev('case_closed',7,closure_basis='insufficient_evidence',closure_reason='test')]
    cases['whitespace_owner']=fixture();cases['whitespace_owner'][3]['decision_owner_role']='  '
    return cases

class ClosureTests(unittest.TestCase):
    def test_completed_work_does_not_imply_benefit(self):
        result=case_summary(fixture(),'synthetic-demo-001')
        self.assertTrue(result['work_completion_recorded'])
        self.assertEqual(result['outcome'],'unknown')
        self.assertFalse(result['clinical_benefit_established'])
    def test_explicit_nonchange_valid(self):
        x=fixture()[:5]+[ev('case_closed',7,closure_basis='no_action',closure_reason='Test justified nonchange')]
        self.assertEqual(validate(x),[])
    def test_insufficient_evidence_not_forced_to_pass(self):
        x=fixture()[:4];x[1]['comparison_status']='UNKNOWN'
        x.append(ev('case_closed',7,closure_basis='insufficient_evidence',closure_reason='Test missing denominator'))
        self.assertEqual(validate(x),[])
        self.assertFalse(case_summary(x,'synthetic-demo-001')['work_completion_recorded'])
    def test_insufficiency_cannot_mask_action(self):
        x=fixture();x[-1].update(closure_basis='insufficient_evidence',closure_reason='test')
        self.assertTrue(validate(x))
    def test_no_action_cannot_mask_action(self):
        x=fixture();x[-1].update(closure_basis='no_action',closure_reason='test')
        self.assertTrue(validate(x))
    def test_no_action_proceed_conflict(self):
        x=fixture()[:5];x[4]['decision']='proceed'
        x.append(ev('case_closed',7,closure_basis='no_action',closure_reason='test'))
        self.assertTrue(validate(x))
    def test_reason_required(self):
        x=fixture()[:5]+[ev('case_closed',7,closure_basis='no_action')]
        self.assertTrue(validate(x))
    def test_other_case_cannot_supply_prerequisites(self):
        x=fixture()[:-1];x.append(ev('case_closed',7,case_id='other-case',closure_basis='completed'))
        self.assertTrue(validate(x))
    def test_open_partial_case_preserved(self):
        self.assertEqual(validate(fixture()[:1]),[])
    def test_receipt_version_change_visible(self):
        self.assertEqual(canonical_receipt(fixture())['schema_version'],'0.2')
    def test_invalid_closure_type_returns_errors(self):
        for value in (None, [], {}, True):
            with self.subTest(value=value):
                x=fixture();x[-1]['closure_basis']=value
                self.assertTrue(validate(x))
    def test_nonstrings_cannot_be_owner_roles(self):
        for value in (True, 123, ['role']):
            with self.subTest(value=value):
                x=fixture();x[3]['decision_owner_role']=value
                self.assertTrue(validate(x))
    def test_roundtrip_preserves_unknown(self):
        x=json.loads(json.dumps(fixture()))
        self.assertEqual(case_summary(x,'synthetic-demo-001')['outcome'],'unknown')

for name in bad_cases():
    def test(self,name=name):
        self.assertTrue(validate(bad_cases()[name]))
        with self.assertRaises(ValueError):canonical_receipt(bad_cases()[name])
    setattr(ClosureTests,'test_reject_'+name,test)

if __name__=='__main__':unittest.main()
