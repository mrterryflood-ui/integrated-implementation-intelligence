"""Source-level CRC trend interpretation safeguards.

Do not equate the 2019-2023 incidence table period with the underlying
joinpoint AAPC regression years unless those years are documented.
"""
import re
import unittest

def compare_trends(a, b):
    for name, x in (("A", a), ("B", b)):
        if x.get("period") != "2019-2023":
            raise ValueError(f"{name} incidence period mismatch")
        if not x.get("source_sha256"):
            raise ValueError(f"{name} missing original source provenance")
    if not a.get("joinpoint_years") or not b.get("joinpoint_years"):
        return {"status":"CONDITIONAL_NOT_HARMONIZED", "reason":"joinpoint regression windows not established"}
    if a["joinpoint_years"] != b["joinpoint_years"]:
        return {"status":"INCOMPARABLE_WINDOW", "reason":"AAPC joinpoint years differ"}
    if not a.get("malignancy_standard") or a["malignancy_standard"] != b.get("malignancy_standard"):
        return {"status":"INCOMPARABLE_STANDARD", "reason":"malignancy standards not harmonized"}
    return {"status":"WINDOW_AND_STANDARD_COMPARABLE", "reason":"does not establish causation"}

class TrendComparabilityTests(unittest.TestCase):
    def setUp(self):
        self.a = dict(period="2019-2023",source_sha256="a"*64,aapc=-2.1)
        self.b = dict(period="2019-2023",source_sha256="b"*64,aapc=2.1)
    def test_real_archive_missing_joinpoint_window_blocks_comparison(self):
        self.assertEqual(compare_trends(self.a,self.b)["status"],"CONDITIONAL_NOT_HARMONIZED")
    def test_different_joinpoint_windows_rejected(self):
        self.a["joinpoint_years"]="2015-2023";self.b["joinpoint_years"]="2017-2023"
        self.assertEqual(compare_trends(self.a,self.b)["status"],"INCOMPARABLE_WINDOW")
    def test_different_malignancy_standards_rejected(self):
        self.a.update(joinpoint_years="2017-2023",malignancy_standard="X")
        self.b.update(joinpoint_years="2017-2023",malignancy_standard="Y")
        self.assertEqual(compare_trends(self.a,self.b)["status"],"INCOMPARABLE_STANDARD")
    def test_matching_metadata_only_qualifies_comparability(self):
        self.a.update(joinpoint_years="2017-2023",malignancy_standard="X")
        self.b.update(joinpoint_years="2017-2023",malignancy_standard="X")
        self.assertEqual(compare_trends(self.a,self.b)["status"],"WINDOW_AND_STANDARD_COMPARABLE")
    def test_missing_source_rejected(self):
        self.a["source_sha256"]=""
        with self.assertRaisesRegex(ValueError,"provenance"):
            compare_trends(self.a,self.b)

if __name__=="__main__":
    unittest.main()
