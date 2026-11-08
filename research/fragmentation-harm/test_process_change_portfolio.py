import unittest
from dataclasses import replace
from process_change_portfolio import CANDIDATES, portfolio, validate

class ProcessChangePortfolioTests(unittest.TestCase):
    def test_four_distinct_pathways(self):
        self.assertEqual(len(CANDIDATES),4)
        self.assertEqual(len({x.id for x in CANDIDATES}),4)
    def test_every_candidate_has_comparator_and_falsification(self):
        for item in CANDIDATES:
            with self.subTest(item=item.id):
                self.assertTrue(item.comparator)
                self.assertTrue(item.falsification_test)
                self.assertTrue(item.harm_or_spillover)
                self.assertTrue(item.rival_explanation)
                self.assertFalse(validate(item)['clinical_effect_established'])
    def test_all_are_review_candidates_not_proven(self):
        self.assertEqual(len(portfolio()),4)
        self.assertTrue(all(x['status']=='RESEARCH_CANDIDATE_REQUIRES_REVIEW' for x in portfolio()))
    def test_no_local_site_acceptance_claim(self):
        with self.assertRaisesRegex(ValueError,'site acceptance'):
            validate(replace(CANDIDATES[0],local_site_accepted=True))
    def test_no_causal_promotion(self):
        with self.assertRaisesRegex(ValueError,'local effect'):
            validate(replace(CANDIDATES[0],causal_status='PROVEN'))
    def test_missing_comparator_rejected(self):
        with self.assertRaisesRegex(ValueError,'comparator'):
            validate(replace(CANDIDATES[0],comparator=''))
    def test_missing_rival_rejected(self):
        with self.assertRaisesRegex(ValueError,'rival_explanation'):
            validate(replace(CANDIDATES[1],rival_explanation=' '))
    def test_nonstring_signal_rejected(self):
        with self.assertRaisesRegex(ValueError,'first_signal'):
            validate(replace(CANDIDATES[0],first_signal=None))
    def test_unrecognized_source_scheme_rejected(self):
        with self.assertRaisesRegex(ValueError,'source'):
            validate(replace(CANDIDATES[0],source_url='https://example.com/no-evidence'))
    def test_process_and_patient_outcomes_distinct(self):
        for item in CANDIDATES:
            self.assertNotEqual(item.process_outcome,item.patient_outcome)
    def test_no_observed_local_failure_invented(self):
        self.assertTrue(all(item.observed_failure is None for item in CANDIDATES))
    def test_appropriate_nonchange_comparator_preserved(self):
        self.assertIn('outreach alone',CANDIDATES[1].falsification_test)
        self.assertIn('appropriate nonreferrals',CANDIDATES[2].falsification_test)
if __name__=='__main__':unittest.main()
