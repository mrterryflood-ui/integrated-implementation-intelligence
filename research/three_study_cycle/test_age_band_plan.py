"""Plan-level falsification; sampling gaps cannot conceal invalid age bands."""
import unittest
from mechanism_sensitivity import standardized

class AgeBandPlanTests(unittest.TestCase):
    def test_unobserved_gaps_are_invalid_before_data_inspection(self):
        for plan in [[(20,24),(30,50)],[(21,29),(30,50)]]:
            with self.subTest(plan=plan):
                with self.assertRaises(ValueError):standardized(None,'ENDO',plan)
    def test_unobserved_overlap_is_invalid_before_data_inspection(self):
        for plan in [[(20,29),(25,50)],[(20,30),(30,50)]]:
            with self.subTest(plan=plan):
                with self.assertRaises(ValueError):standardized(None,'ENDO',plan)
    def test_noninteger_boolean_and_missing_endpoints_reject(self):
        for plan in [[],None,[(20.,50)],[(True,50)],[(20,)],[(20,49,50)]]:
            with self.subTest(plan=plan):
                with self.assertRaises(ValueError):standardized(None,'ENDO',plan)
    def test_undeclared_upper_boundary_rejects(self):
        for plan in [[(20,48)],[(20,51)],[(20,19)]]:
            with self.subTest(plan=plan):
                with self.assertRaises(ValueError):standardized(None,'ENDO',plan)

if __name__=='__main__':unittest.main()
