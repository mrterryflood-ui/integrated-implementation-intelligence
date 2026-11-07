import unittest
from early_action_exercise import audit,fixtures

class EarlyActionTests(unittest.TestCase):
    def setUp(self):self.base=fixtures()[0];self.now='2026-11-07T12:00:00Z'
    def test_normal_imaging_does_not_close_persistent_concern(self):
        x=audit({**self.base,'request_close':True},self.now)
        self.assertIn('NORMAL_IMAGING_CANNOT_ALONE_CLOSE_PERSISTENT_CONCERN',x['issues'])
        self.assertFalse(x['case_closed'])
    def test_surgery_is_not_required_to_start_care_pathway(self):
        x=audit({**self.base,'surgery_required_before_care':True},self.now)
        self.assertIn('SURGERY_ONLY_GATE_REQUIRES_CLINICAL_PROTOCOL_REVIEW',x['issues'])
    def test_sent_accepted_and_attended_are_not_reviewed_resolution(self):
        for stage in ['SENT','ACCEPTED','ATTENDED']:
            x=audit({**self.base,'referral_status':stage,'request_close':True},self.now)
            self.assertIn('REFERRAL_OR_ATTENDANCE_IS_NOT_REVIEWED_RESOLUTION',x['issues'])
    def test_explicit_due_date_controls_operational_overdue(self):
        self.assertIn('OPERATIONAL_REVIEW_OVERDUE',audit({**self.base,'review_due_at':'2026-11-01T12:00:00Z'},self.now)['issues'])
        self.assertNotIn('OPERATIONAL_REVIEW_OVERDUE',audit(self.base,self.now)['issues'])
    def test_owner_and_review_plan_required_for_open_pathway(self):
        x=audit({**self.base,'owner_role':'','review_due_at':''},self.now)
        self.assertIn('NO_ACCOUNTABLE_OWNER',x['issues']);self.assertIn('NO_EXPLICIT_REASSESSMENT_PLAN',x['issues'])
    def test_declined_is_preference_not_inferred_noncompliance(self):
        x=audit({**self.base,'patient_choice':'DECLINED','request_close':True},self.now)
        self.assertIn('DOCUMENT_PREFERENCE_AND_RETURN_PLAN_NOT_NONCOMPLIANCE',x['issues'])
    def test_missing_safety_review_is_exposed_not_a_triage_claim(self):
        self.assertIn('MISSING_HUMAN_SAFETY_AND_DIFFERENTIAL_REVIEW',audit({**self.base,'safety_review_recorded':False},self.now)['issues'])
    def test_well_documented_scenario_still_does_not_claim_diagnosis_or_benefit(self):
        x=audit(self.base,self.now);self.assertEqual(x['status'],'DOCUMENTED_WORKFLOW_ONLY')
        for field in ['diagnosis_established','test_or_treatment_ordered','outreach_sent','primary_prevention_established','beneficiary_outcome_verified']:
            self.assertIs(x[field],False)
    def test_real_records_unknown_fields_and_false_strings_rejected(self):
        for edit in [{'evidence_class':'REAL'},{'patient_name':'test'},{'ongoing_concern':'false'}]:
            with self.assertRaises(ValueError):audit({**self.base,**edit},self.now)
    def test_invalid_and_naive_timestamps_rejected(self):
        for due in ['bad','2026-11-07T12:00:00']:
            with self.assertRaises(ValueError):audit({**self.base,'review_due_at':due},self.now)

if __name__=='__main__':unittest.main()
