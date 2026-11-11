"""Executable arithmetic/semantic checks; not independent source or clinical acceptance."""
import copy,json,hashlib,tempfile,unittest
from pathlib import Path
from decimal import Decimal as D
import health_wealth_public_analysis as h

class HealthWealthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=h.load_states();cls.current={r['state']:r for r in cls.rows if r['year']=='2024'}
    def test_exact_transcriptions_bound(self):
        for name in h.EXPECTED:self.assertTrue(h.checked_bytes(name))
    def test_twelve_unique_state_years(self):
        self.assertEqual(len(self.rows),12);self.assertEqual(len({(r['state'],r['year']) for r in self.rows}),12)
    def test_all_twelve_original_rows_pass(self):
        for r in self.rows:h.validate_row(r)
    def test_main_difference(self):
        self.assertEqual(h.compare(self.current['NC'],self.current['TX'],'crc_screen_pct')['difference_pp'],14.2)
    def test_noncausal_scope_preserved(self):
        r=h.compare(self.current['MS'],self.current['NC'],'bp_control_pct')
        self.assertFalse(r['case_mix_adjusted']);self.assertFalse(r['clinical_benefit_established'])
    def test_crossyear_rejected(self):
        with self.assertRaises(ValueError):h.compare(self.rows[0],self.current['TX'],'crc_screen_pct')
    def test_patient_effect_rejected(self):
        with self.assertRaises(ValueError):h.compare(self.current['NC'],self.current['TX'],'crc_screen_pct','patient_causal')
    def test_ownership_effect_rejected(self):
        with self.assertRaises(ValueError):h.compare(self.current['NC'],self.current['TX'],'crc_screen_pct','ownership_effect')
    def test_unregistered_measure_rejected(self):
        with self.assertRaises(ValueError):h.compare(self.current['NC'],self.current['TX'],'mortality')
    def test_year_column_mismatch_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['observed_year_column']='2025'
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_site_relabel_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['source_unit']='individual_clinic'
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_negative_count_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['uninsured']='-1'
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_dual_doublecount_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['medicaid_chip_primary']=str(int(r['medicaid_chip_primary'])+int(r['dual_medicare_medicaid']))
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_dual_subset_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['dual_medicare_medicaid']=str(int(r['medicare_primary'])+1)
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_income_denominator_rejected(self):
        r=copy.deepcopy(self.current['TX']);r['income_known']=str(int(r['low_income_le200'])-1)
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_income_not_silently_zero_filled(self):
        p=h.profile(self.current['TX']);self.assertEqual(p['income_unknown_count'],632030)
        self.assertAlmostEqual(p['low_income_all_reported_lower_pct'],60.827722946964364)
        self.assertGreater(p['low_income_all_reported_upper_pct'],p['low_income_all_reported_lower_pct'])
    def test_bounds_width_is_missing_fraction(self):
        for row in self.current.values():
            p=h.profile(row);self.assertAlmostEqual(p['low_income_all_reported_upper_pct']-p['low_income_all_reported_lower_pct'],p['income_unknown_pct'])
    def test_rounding_consistency(self):
        r=copy.deepcopy(self.current['TX']);r['uninsured_pct']='99.99'
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_nonfinite_rate(self):
        r=copy.deepcopy(self.current['TX']);r['crc_screen_pct']='Infinity'
        with self.assertRaises(ValueError):h.validate_row(r)
    def test_scheduling_not_completion(self):
        with self.assertRaises(ValueError):h.forbid_wrong_stage('scheduled','completed_care')
    def test_closure_not_completed_care(self):
        with self.assertRaises(ValueError):h.forbid_wrong_stage('completed_or_canceled','completed_care')
    def test_diabetes_composite_not_measured_hba1c_only(self):
        with self.assertRaises(ValueError):h.forbid_wrong_stage('poor_or_missing','measured_poor_only')
    def test_valid_stage(self):h.forbid_wrong_stage('scheduled','scheduled')
    def test_reproduce_results(self):
        with tempfile.TemporaryDirectory() as t:
            a,b=h.run(t)
            self.assertEqual(b['RCI']['contrasts'],24);self.assertEqual(b['RCI']['intervals_including_zero'],24)
            self.assertFalse(b['RCI']['null_equivalence_proven'])
            self.assertEqual(a['ranges_pp']['crc_screen_pct'],14.2)
            self.assertTrue(b['VA']['direction_reversal']);self.assertFalse(b['VA']['same_estimand'])
            self.assertEqual(b['NYC']['completed_raw_change_pp'],-0.5)
            self.assertEqual(len(a['profiles']),6)
    def test_source_discrepancy_retained(self):
        s=json.loads(h.checked_bytes('primary_study_contrasts.json'))
        d=s['NYC_ECONSULT_2021']['source_discrepancy']
        self.assertEqual((d['pre_wait_table_days'],d['pre_wait_prose_days']),(60.1,61.0))
    def test_mutated_bytes_not_original_digest(self):
        raw=h.checked_bytes('primary_study_contrasts.json')
        self.assertNotEqual(hashlib.sha256(raw.replace(b'15.8',b'95.8')).hexdigest(),h.EXPECTED['primary_study_contrasts.json'])

if __name__=='__main__':unittest.main()
