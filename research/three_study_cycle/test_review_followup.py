import unittest
import numpy as np
import pandas as pd
from review_followup import REGIONS, STATES, correlation_sensitivity, all_group_contrasts


class ReviewFollowupTests(unittest.TestCase):
    def test_region_map_is_complete_nonoverlapping_50_state_frame(self):
        values=[s for states in REGIONS.values() for s in states]
        self.assertEqual(len(values),50);self.assertEqual(set(values),STATES)

    def test_conditional_interval_is_explicit_and_permutation_replays(self):
        x=np.arange(10);y=np.array([2,4,3,0,7,5,1,9,6,8])
        a=correlation_sensitivity(x,y,100)
        self.assertEqual(a,correlation_sensitivity(x,y,100))
        self.assertLess(a['conditional_iid_fisher_95'][0],a['pearson'])
        self.assertGreater(a['conditional_iid_fisher_95'][1],a['pearson'])
        self.assertGreater(a['conditional_exchangeable_permutation_p'],0)

    def test_degenerate_correlations_do_not_report_certainty(self):
        for x,y in (([1]*5,list(range(5))),([1,2,float('nan'),4,5],list(range(5)))):
            with self.assertRaises(ValueError):correlation_sensitivity(x,y,100)

    def test_group_vs_overall_covariance_and_public_recode_scope(self):
        rows=[]
        for age in (25,35,45):
            for group in (1,2,3,4):
                for psu in (1,2):
                    rows.append(dict(AGER=age,HISPRACE2=group,ENDO=1 if group==3 else 5,WGT2022_2023=1.,VEST=age,VECL=psu))
        d=pd.DataFrame(rows);r=all_group_contrasts(d,'ENDO')
        self.assertEqual(len(r['rows']),4)
        self.assertEqual(r['overall_crude_percent'],25)
        black=next(v for v in r['rows'] if v['code']==3)
        self.assertEqual(black['group_minus_overall_pp'],75)
        self.assertIn('other_or_multiple',r['rows'][-1]['label'])
        self.assertIn('No Asian-specific',r['public_detail_limit'])
        self.assertEqual(black['taylor_se_pp'],0)

    def test_missing_age_cell_is_not_zero_or_a_fabricated_group(self):
        d=pd.DataFrame([dict(AGER=25,HISPRACE2=2,ENDO=5,WGT2022_2023=1.,VEST=1,VECL=i) for i in (1,2)])
        with self.assertRaisesRegex(ValueError,'Empty observed domain'):all_group_contrasts(d,'ENDO')


if __name__=='__main__':unittest.main()
