"""Synthetic computational tests; never field validation or source certification."""
import json,hashlib,tempfile,unittest
from pathlib import Path
import numpy as np
import pandas as pd
from analyze import rate_column,rate_interval,rank_sensitivity,ratio,variance,verify_inputs,clean_name

class AnalysisTests(unittest.TestCase):
    def test_county_column_shift_is_not_a_rate(self):
        name='Age-Adjusted Incidence Rate cases per 100,000 (95% Confidence Interval)'
        t=pd.DataFrame({'County':['Hinds County 6'],'Rural-Urban':['Urban'],name:['46.4 (42.6, 50.5)']})
        self.assertEqual(rate_interval(t[rate_column(t)].iloc[0]),(46.4,42.6,50.5))
        with self.assertRaises(ValueError):rate_interval(t.iloc[0,1])
        self.assertEqual(rate_column(t[[name,'County','Rural-Urban']]),name)
    def test_ambiguous_or_missing_rate_is_rejected(self):
        with self.assertRaises(ValueError):rate_column(pd.DataFrame({'Rate':[2]}))
        with self.assertRaises(ValueError):rate_column(pd.DataFrame({'Age-Adjusted Incidence Rate A':[1],'Age-Adjusted Incidence Rate B':[2]}))
    def test_interval_must_contain_estimate(self):
        with self.assertRaises(ValueError):rate_interval('10 (11, 12)')
        with self.assertRaises(ValueError):rate_interval('*')
    def test_ascending_and_descending_order(self):
        x=np.arange(5);r=rank_sensitivity(x,x[::-1]);self.assertEqual(r['discordant'],10);self.assertEqual(r['discordant_percent_of_untied_pairs'],100)
        self.assertEqual(rank_sensitivity(x,x)['discordant'],0)
    def test_ties_are_not_arbitrary_disagreements(self):
        r=rank_sensitivity(np.array([1,1,2]),np.array([1,2,3]));self.assertEqual(r['ties_on_either_metric'],1);self.assertEqual(r['concordant'],2)
        r=rank_sensitivity(np.ones(3),np.arange(3));self.assertIsNone(r['discordant_percent_of_untied_pairs'])
    def test_nonfinite_measures_reject(self):
        with self.assertRaises(ValueError):rank_sensitivity(np.array([1,np.nan]),np.array([1,2]))
    def test_geographic_labels_do_not_merge_cities_and_counties(self):
        self.assertEqual(clean_name('Hinds County 6'),'Hinds County');self.assertEqual(clean_name('US (SEER+NPCR) 1'),'United States')
        self.assertNotEqual(clean_name('Jackson County 6'),'Hinds County')
    def test_survey_ratio_uses_weights_and_excludes_nonresponses(self):
        d=pd.DataFrame({'VEST':[1,1,2,2],'VECL':[1,2,1,2]});y=pd.Series([1,5,1,9]);w=pd.Series([1.,3.,2.,9.]);domain=pd.Series([True]*4)
        p,z,r=ratio(d,y,domain,w);self.assertAlmostEqual(p,.5);self.assertEqual(r['n_excluded'],1);self.assertEqual(r['n_valid'],3);self.assertAlmostEqual(z.sum(),0)
    def test_domain_retains_zero_psus_outside_domain(self):
        d=pd.DataFrame({'VEST':[1,1,2,2],'VECL':[1,2,1,2]});y=pd.Series([1,5,5,5]);w=pd.Series([1.]*4);domain=pd.Series([True,True,False,False])
        p,z,r=ratio(d,y,domain,w);self.assertEqual(r['design_df'],2);self.assertTrue(np.array_equal(z[2:],np.zeros(2)));self.assertEqual(p,.5)
    def test_variance_retains_between_group_covariance(self):
        d=pd.DataFrame({'VEST':[1,1,2,2],'VECL':[1,2,1,2]});a=np.array([.1,-.1,.2,-.2]);b=a.copy();v,df=variance(a-b,d)
        self.assertEqual(v,0);self.assertGreater(variance(a,d)[0]+variance(b,d)[0],0)
    def test_singleton_needs_review(self):
        d=pd.DataFrame({'VEST':[1,2],'VECL':[1,1]})
        with self.assertRaises(ValueError):variance(np.array([.1,-.1]),d)
    def test_tampered_original_fails_before_analysis(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td);(p/'source.txt').write_text('changed');(p/'MANIFEST_SHA256.json').write_text(json.dumps({'source.txt':hashlib.sha256(b'original').hexdigest()}))
            with self.assertRaisesRegex(ValueError,'integrity'):verify_inputs(p)
    def test_archive_path_escape_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td);(p/'MANIFEST_SHA256.json').write_text(json.dumps({'../escape':'x'}))
            with self.assertRaisesRegex(ValueError,'integrity'):verify_inputs(p)

if __name__=='__main__':unittest.main()
