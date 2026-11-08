import unittest
from rap_benchmark import benchmark


class RapBenchmarkTests(unittest.TestCase):
    def test_published_transform_rounding_and_scope(self):
        r=benchmark();self.assertEqual(r['status'],'PUBLISHED_TRANSFORMATION_DISCREPANCY')
        self.assertEqual(len(r['rows']),36)
        self.assertEqual(r['discrepant_cells'],9);self.assertEqual(r['matching_cells'],27)
        self.assertEqual(max(v['absolute_difference_years'] for v in r['rows']),1.1)
        self.assertFalse(r['cohort_model_refit']);self.assertFalse(r['new_starting_age_recommended'])
        self.assertAlmostEqual(r['tolerance_years'],.5+.05+.5*.05)
        top=next(v for v in r['rows'] if v['outcome']=='incidence' and v['model_sex_group']=='men' and v['prs_decile']=='10')
        self.assertAlmostEqual(top['calculated_age'],41.9)


if __name__=='__main__':unittest.main()
