"""Synthetic parser safeguards plus optional exact original-source replay."""
import hashlib
import os
import tempfile
import unittest

from audit_archived_registry_instruments import (
    EXPECTED, EXPECTED_ZIP_SHA256, FOOTNOTE_AGE, FOOTNOTE_STAGE,
    audit, parse_county_csv, sha256,
)

class InstrumentAuditTests(unittest.TestCase):
    def test_sha256_is_byte_exact(self):
        self.assertEqual(sha256(b"abc"), hashlib.sha256(b"abc").hexdigest())

    def test_county_parser_preserves_source_superscript(self):
        data = b"County,Average Annual Count\nHinds County  2,118\nOther County  2,19\n"
        self.assertEqual(parse_county_csv(data, "Hinds County")["Average Annual Count"], "118")

    def test_county_parser_rejects_absent_or_duplicated_records(self):
        with self.assertRaises(AssertionError):
            parse_county_csv(b"County\nOther County\n", "Hinds County")
        with self.assertRaises(AssertionError):
            parse_county_csv(b"County\nHinds County  2\nHinds County  2\n", "Hinds County")

    def test_pinned_source_lineage_and_footnotes(self):
        self.assertEqual({k: v[1] for k, v in EXPECTED.items()}, {
            "hinds_all": "2", "hinds_late": "2",
            "harris_all": "7", "harris_late": "7",
        })
        self.assertIn("20 age groups", FOOTNOTE_AGE)
        self.assertIn("19 age groups", FOOTNOTE_AGE)
        self.assertIn("Combined Summary Stage", FOOTNOTE_STAGE)
        self.assertEqual(len(EXPECTED_ZIP_SHA256), 64)

    def test_retained_archive_when_available(self):
        path = os.environ.get("DIS_NCI_ARCHIVE_PATH")
        if not path:
            self.skipTest("External archive absent from CI; run with DIS_NCI_ARCHIVE_PATH")
        result = audit(path)
        self.assertEqual(result["manifest_entries_verified"], 18)
        self.assertEqual(result["age_groups"], {"Hinds_NPCR": 19, "Harris_SEER": 20})
        self.assertEqual(result["rate_difference_late_per_100k"], 6.0)
        self.assertEqual(round(result["late_case_share_difference_percentage_points"], 1), 0.3)
        self.assertEqual(result["unknown_stage_share_denominator"], "NOT RESOLVED by county CSV or report footnotes")

    def test_modified_archive_refused(self):
        with tempfile.NamedTemporaryFile(suffix=".zip") as t:
            t.write(b"corrupted/unsupported archive")
            t.flush()
            with self.assertRaisesRegex(AssertionError, "ZIP digest changed"):
                audit(t.name)

if __name__ == "__main__":
    unittest.main()
