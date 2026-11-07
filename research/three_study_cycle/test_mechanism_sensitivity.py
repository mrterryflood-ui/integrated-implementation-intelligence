"""Synthetic falsification and derivative checks, not human scientific acceptance."""
import unittest
from unittest.mock import patch
import numpy as np
import pandas as pd
import mechanism_sensitivity as m

class MechanismSensitivityTests(unittest.TestCase):
    def test_symmetric_decomposition_is_exact_and_reversible(self):
        x=m.symmetric_split(46.4,29.9,38,23.9)
        self.assertAlmostEqual(x['all_stage_rate_component']+x['derived_multiplier_component'],6)
        y=m.symmetric_split(38,23.9,46.4,29.9)
        self.assertAlmostEqual(x['all_stage_rate_component'],-y['all_stage_rate_component'])
        self.assertAlmostEqual(x['derived_multiplier_component'],-y['derived_multiplier_component'])
    def test_common_multiplier_not_a_causal_result(self):
        x=m.symmetric_split(50,30,40,24)
        self.assertAlmostEqual(x['derived_multiplier_component'],0)
        self.assertIn('Not a causal',x['interpretation'])
    def test_invalid_rates(self):
        for values in [(0,1,2,1),(10,11,2,1),(float('nan'),1,2,1)]:
            with self.assertRaises(ValueError):m.symmetric_split(*values)
    def test_rounding_boundary_and_disjoint_interval_screen(self):
        f=pd.DataFrame({'rate':[1,1.1,3],'share':[60,59.9,50],'ci_low':[.9,1,2.8],'ci_high':[1.05,1.2,3.2]},index=['A','B','C'])
        r=m.pair_audit(f)
        self.assertEqual(r['reversed_pairs'],3)
        self.assertEqual(r['reversed_pairs_robust_to_both_one_decimal_rounding_envelopes'],2)
        self.assertEqual(r['disjoint_rate_intervals_and_at_least_5pp_share_gap']['reversed'],2)
    def test_ties_do_not_become_reversals(self):
        f=pd.DataFrame({'rate':[1,1,3],'share':[60,60,60],'ci_low':[.9,.9,2.8],'ci_high':[1.2,1.2,3.2]})
        self.assertIsNone(m.pair_audit(f)['reversal_percent'])
    def test_bad_pair_data_fails(self):
        f=pd.DataFrame({'rate':[1,np.nan],'share':[60,50],'ci_low':[.9,2],'ci_high':[1.2,3]})
        with self.assertRaises(ValueError):m.pair_audit(f)
    @staticmethod
    def data():
        rows=[]
        for j,age in enumerate([22,32,42]):
            for r in [2,3]:
                for k in range(4):
                    rows.append(dict(AGER=age,HISPRACE2=r,ENDO=1 if k<(1 if r==2 else 2) else 5,PCOS=5,UF=5,WGT2022_2023=float(1+j+k+r/10),VEST=k//2,VECL=k%2))
        return pd.DataFrame(rows)
    def test_full_sample_psu_variance_includes_zeros(self):
        d=pd.DataFrame({'VEST':[1,1,2,2],'VECL':[1,2,1,2]})
        v,df=m.design_variance([.1,-.1,0,0],d)
        self.assertAlmostEqual(v,.04);self.assertEqual(df,2)
    def test_zero_same_group_difference_retains_covariance(self):
        d=self.data();z=np.ones(len(d))
        self.assertEqual(m.design_variance(z-z,d)[0],0)
    def test_singleton_stratum_rejected(self):
        with self.assertRaises(ValueError):m.design_variance([.1,.2],pd.DataFrame({'VEST':[1,2],'VECL':[1,1]}))
    def test_ratio_ignores_missing_item_not_other_psus(self):
        d=self.data();y=d.ENDO.copy();y.iloc[0]=9;domain=d.AGER.eq(22)
        p,z,n,missing=m.ratio_influence(d,y,domain)
        self.assertEqual(missing,1);self.assertEqual(n,7);self.assertAlmostEqual(z.sum(),0)
        self.assertTrue(np.all(z[~domain]==0))
    def test_same_age_cell_prevalence_removes_composition_effect(self):
        d=self.data();d.loc[d.HISPRACE2.eq(3),'ENDO']=d.loc[d.HISPRACE2.eq(2),'ENDO'].to_numpy()
        d.loc[d.HISPRACE2.eq(3),'WGT2022_2023']=d.loc[d.HISPRACE2.eq(2),'WGT2022_2023'].to_numpy()
        d.loc[d.HISPRACE2.eq(3)&d.AGER.eq(42),'WGT2022_2023']*=3
        r=m.standardized(d,'ENDO',[(20,29),(30,39),(40,50)])
        self.assertAlmostEqual(r['contrast']['black_minus_white_pp'],0)
    def test_influence_matches_numerical_derivative_including_pooled_weights(self):
        d=self.data();scores=[];real=m.design_variance
        def capture(z,data):scores.append(np.array(z));return real(z,data)
        with patch.object(m,'design_variance',side_effect=capture):
            result=m.standardized(d,'ENDO',[(20,29),(30,39),(40,50)],pooled=True)
        original=result['contrast']['black_minus_white_pp']/100
        for i in [0,5,13,23]:
            perturbed=d.copy();eps=1e-6;perturbed.loc[i,'WGT2022_2023']*=1+eps
            new=m.standardized(perturbed,'ENDO',[(20,29),(30,39),(40,50)],pooled=True)['contrast']['black_minus_white_pp']/100
            self.assertAlmostEqual((new-original)/eps,scores[0][i],delta=1e-7)
    def test_missing_item_bounds_contain_complete_case_estimand(self):
        d=self.data();d.loc[[0,7],'ENDO']=9
        r=m.standardized(d,'ENDO',[(20,29),(30,39),(40,50)])
        b=r['item_nonresponse_bounds'];est=r['contrast']['black_minus_white_pp']
        self.assertLessEqual(b['contrast_lower_pp'],est);self.assertGreaterEqual(b['contrast_upper_pp'],est)
    def test_age_domain_partition_cannot_overlap(self):
        with self.assertRaises(ValueError):m.standardized(self.data(),'ENDO',[(20,29),(25,50)])
    def test_holm_monotonic_and_capped(self):
        self.assertEqual(m.holm([.01,.04,.03]),[.03,.06,.06])
        self.assertEqual(m.holm([.9,.9,.9]),[1.,1.,1.])
        with self.assertRaises(ValueError):m.holm([float('nan')])

if __name__=='__main__':unittest.main()
