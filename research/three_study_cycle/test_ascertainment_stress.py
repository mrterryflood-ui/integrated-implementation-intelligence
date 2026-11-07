import unittest
from ascertainment_stress import reported_diagnosis,inverse_prevalence,stress_test
class AscertainmentTests(unittest.TestCase):
 def test_same_observed_diagnosis_can_arise_from_distinct_true_prevalence(self):
  observed=.062
  a=inverse_prevalence(observed,1,1)
  b=inverse_prevalence(observed,.5,1)
  self.assertAlmostEqual(a,.062);self.assertAlmostEqual(b,.124)
  self.assertAlmostEqual(reported_diagnosis(a,1,1),observed)
  self.assertAlmostEqual(reported_diagnosis(b,.5,1),observed)
  self.assertNotEqual(a,b)
 def test_three_conditions_are_not_identified_from_reported_diagnosis(self):
  for p in [.062,.087,.078]:
   r=stress_test(p)
   self.assertFalse(r['biological_prevalence_established'])
   self.assertFalse(r['causal_effect_established'])
   self.assertGreater(len(set(round(x['conditional_prevalence'],5) for x in r['scenarios'])),1)
 def test_no_inverse_when_instrument_is_uninformative(self):
  self.assertIsNone(inverse_prevalence(.062,.5,.5))
 def test_invalid_values_fail(self):
  for value in [-.1,1.1,float('nan')]:
   with self.assertRaises(ValueError):stress_test(value)
   with self.assertRaises(ValueError):reported_diagnosis(value,.5,1)
if __name__=="__main__":unittest.main()
