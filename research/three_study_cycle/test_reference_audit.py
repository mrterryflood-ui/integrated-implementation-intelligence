import hashlib
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd

from reference_audit import period_from_html, retained_source, row_name, numeric, ratio_design, STATES


class ReferenceAuditTests(unittest.TestCase):
    def test_state_and_county_report_period_not_footer_dates(self):
        for title in ['Incidence Rate Report by State', 'Incidence Rate Report for Texas by County']:
            raw=f'<html><h2>Incidence Rates Table</h2><h2>{title} Colon &amp; Rectum (Late Stage), 2019-2023</h2><p>Prior 2018-2022</p></html>'.encode()
            self.assertEqual(period_from_html(raw), '2019-2023')

    def test_missing_or_multiple_report_periods_reject(self):
        for raw in [b'<html><p>2019-2023</p></html>', b'<h2>Incidence Rate Report by State, 2019-2023 / 2018-2022</h2>']:
            with self.assertRaises(ValueError): period_from_html(raw)

    def test_exact_county_identity_is_not_substring(self):
        self.assertEqual(row_name('Harris County 7'),'Harris County')
        self.assertNotEqual(row_name('Harrison County 7'),'Harris County')
        self.assertEqual(len(STATES),50)
        self.assertNotIn('District of Columbia',STATES)
        self.assertNotIn('United States',STATES)

    def test_suppressed_cells_are_not_zero(self):
        for value in ['*','N/A','3 or fewer']: self.assertIsNone(numeric(value))
        self.assertEqual(numeric('0'),0.)
        self.assertEqual(numeric('1,098'),1098.)
        for value in ['101','-1','Infinity']:
            with self.assertRaises(ValueError):numeric(value,percent=True)

    def test_exact_original_hash_and_length_enforced(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/'originals').mkdir();p=root/'originals/test.html';p.write_bytes(b'<html>original</html>')
            row={'id':'test','path':'originals/test.html','status':'ORIGINAL_BYTES_RETAINED','bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
            self.assertEqual(retained_source(root,{'sources':[row]},'test'),p.read_bytes())
            p.write_bytes(b'<html>tampered</html>')
            with self.assertRaisesRegex(ValueError,'hash mismatch'):retained_source(root,{'sources':[row]},'test')

    def test_duplicate_identity_and_path_escape_reject(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);r={'id':'x','status':'ORIGINAL_BYTES_RETAINED','path':'../escape'}
            with self.assertRaisesRegex(ValueError,'Duplicate'):retained_source(root,{'sources':[r,r]},'x')
            with self.assertRaisesRegex(ValueError,'escapes'):retained_source(root,{'sources':[r]},'x')

    @staticmethod
    def design():
        return pd.DataFrame({'VEST':[1,1,2,2],'VECL':[1,2,1,2],'WGT2022_2023':[1.,1.,1.,1.]})

    def test_domain_variance_retains_all_psus_and_ignores_nan_outside_domain(self):
        d=self.design();y=pd.Series([1.,0.,np.nan,np.nan]);domain=pd.Series([True,True,False,False])
        r=ratio_design(d,y,domain)
        self.assertEqual(r['domain_n'],2);self.assertEqual(r['percent'],50.)
        self.assertEqual(r['psus'],4);self.assertEqual(r['strata'],2);self.assertEqual(r['design_df'],2)
        self.assertAlmostEqual(r['se_percentage_points'],50.)

    def test_nonpositive_weight_invalid_response_and_singleton_reject(self):
        d=self.design();y=pd.Series([1.,0.,1.,0.]);dom=pd.Series([True]*4)
        bad=d.copy();bad.loc[0,'WGT2022_2023']=0
        with self.assertRaisesRegex(ValueError,'weights'):ratio_design(bad,y,dom)
        with self.assertRaisesRegex(ValueError,'Nonbinary'):ratio_design(d,pd.Series([2.,0.,1.,0.]),dom)
        bad=d.copy();bad['VECL']=1
        with self.assertRaisesRegex(ValueError,'Singleton'):ratio_design(bad,y,dom)

    def test_vector_index_mismatch_cannot_silently_drop_rows(self):
        d=self.design()
        with self.assertRaisesRegex(ValueError,'indexes'):ratio_design(d,pd.Series([1.,0.,1.,0.],index=[1,2,3,4]),pd.Series([True]*4))

    def test_no_valid_denominator_reject(self):
        with self.assertRaisesRegex(ValueError,'denominator'):ratio_design(self.design(),pd.Series([1.,0.,1.,0.]),pd.Series([False]*4))


if __name__=='__main__': unittest.main()
