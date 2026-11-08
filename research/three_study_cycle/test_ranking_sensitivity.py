import unittest
import pandas as pd
from ranking_sensitivity import audit,interval_order,ci_order
def fixture():
 rows=[]
 for i in range(50):
  rows.append({"geography":"S"+str(i),"colorectal_rate":10+i,"colorectal_share":70-i,"colorectal_rate_lo":9+i,"colorectal_rate_hi":11+i,"lung_rate":10+i,"lung_share":70-i,"lung_rate_lo":9+i,"lung_rate_hi":11+i,"breast_rate":10+i,"breast_share":70-i,"breast_rate_lo":9+i,"breast_rate_hi":11+i})
 # Rate/share estimates are continuous, including fractional sensitivity inputs.
 # Declare their type instead of relying on pandas' removed int-to-float coercion.
 return pd.DataFrame(rows).astype({k:float for k in rows[0] if k!='geography'})
class SensitivityTests(unittest.TestCase):
 def test_interval_rounding_strict_order(self):
  self.assertEqual(interval_order(1.0,1.1,.05),0)
  self.assertEqual(interval_order(1.0,1.2,.05),-1)
  self.assertEqual(ci_order(1,2,3,4),-1)
  self.assertEqual(ci_order(1,3,2,4),0)
 def test_all_reversed_rankings_can_still_overlap_rate_intervals(self):
  r=audit(fixture())
  x=r["conditions"]["colorectal"]
  self.assertEqual(x["total_pairs"],1225)
  self.assertEqual(x["point_reversals"],1225)
  self.assertEqual(x["rounding_stable_reversals"],1225)
  self.assertGreater(x["rate_ci_overlap_among_rounding_stable_reversals"],0)
  self.assertFalse(r["policy_allocation_validated"])
 def test_rounding_ambiguous_reversal_not_overclaimed(self):
  f=fixture()
  f.loc[1,"colorectal_rate"]=f.loc[0,"colorectal_rate"]+.01
  f.loc[1,"colorectal_share"]=f.loc[0,"colorectal_share"]-.01
  r=audit(f);self.assertGreater(r["conditions"]["colorectal"]["rounding_indeterminate_point_reversals"],0)
 def test_incomplete_geographies_and_invalid_intervals_fail(self):
  with self.assertRaises(ValueError):audit(fixture().iloc[:-1])
  with self.assertRaises(ValueError):audit(pd.concat([fixture().iloc[:-1],fixture().iloc[[0]]]))
  with self.assertRaises(ValueError):ci_order(3,2,1,4)
if __name__=="__main__":unittest.main()
