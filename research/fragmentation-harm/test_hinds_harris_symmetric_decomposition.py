#!/usr/bin/env python3
"""Independent arithmetic check of symmetric decomposition; no external packages or patient data.

Inputs are accepted 2019-2023 project-archive county aggregate rates, NOT freshly
downloaded registry records. Rate quotient is NOT case-based stage share.
"""
from math import isclose
import unittest

def decompose(all_a, late_a, all_b, late_b):
    if min(all_a, all_b) <= 0 or min(late_a, late_b) < 0:
        raise ValueError("invalid nonpositive all-stage or negative late-stage rates")
    qa, qb = late_a / all_a, late_b / all_b
    incidence = (all_a - all_b) * (qa + qb) / 2
    quotient = (qa - qb) * (all_a + all_b) / 2
    assert isclose(incidence + quotient, late_a - late_b, abs_tol=1e-12)
    return incidence, quotient, qa, qb

class SymmetricDecompositionTests(unittest.TestCase):
    def test_accepted_inputs(self):
        incidence, quotient, qa, qb = decompose(46.4, 29.9, 38.0, 23.9)
        assert isclose(incidence, 5.348044464609798, abs_tol=1e-12)
        assert isclose(quotient, 0.6519555353902002, abs_tol=1e-12)
        assert isclose(qa * 100, 64.4396551724138, abs_tol=1e-12)
        assert isclose(qb * 100, 62.89473684210526, abs_tol=1e-12)
        # Reported case-based late-stage shares are 63.7% and 63.4%.
        assert not isclose(qa * 100, 63.7, abs_tol=0.1)
        assert not isclose(qb * 100, 63.4, abs_tol=0.1)

    def test_identity_other_inputs(self):
        for a, la, b, lb in [(50, 20, 40, 15), (1, 0, 2, 1), (100, 60, 100, 50)]:
            x, y, _, _ = decompose(a, la, b, lb)
            assert isclose(x + y, la - lb, abs_tol=1e-12)


if __name__ == "__main__":
    unittest.main()
