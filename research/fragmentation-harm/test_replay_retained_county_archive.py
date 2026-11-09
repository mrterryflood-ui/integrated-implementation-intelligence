"""Synthetic software-gate tests only; real science replay uses retained artifact #13589404488."""
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import replay_retained_county_archive as audit


def make_archive(path, *, altered_period=False, altered_csv=False, altered_manifest=False):
    names = audit.COUNTIES
    entries = {}
    sources = []
    for key, (county, stage) in names.items():
        rate = {"hinds_all":"46.4 (42.6, 50.5)", "hinds_late":"29.9 (26.8, 33.2)",
                "harris_all":"38.0 (37.2, 38.9)", "harris_late":"23.9 (23.3, 24.6)"}[key]
        count = {"hinds_all":"118", "hinds_late":"75", "harris_all":"1,732", "harris_late":"1,098"}[key]
        share = {"hinds_late":"63.7", "harris_late":"63.4"}.get(key)
        period = "2018-2022" if altered_period and key == "harris_late" else "2019-2023"
        cells = [county+" 2", "Urban", rate, "NA", count] + ([share] if share else [])
        html = ("<html><body>Incidence Rate Report for Mississippi by County "
                f"Colon & Rectum ({stage}^), {period}<table><tr>" +
                "".join(f"<td>{c}</td>" for c in cells) + "</tr></table></body></html>")
        html_path = f"originals/{key}.html"
        entries[html_path] = html.encode()
        csv_cells = list(cells)
        if altered_csv and key == "hinds_all":
            csv_cells[2] = "49.0 (47.0, 50.5)"
        import csv
        import io
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["County","Rural","Rate","Rank","Count","Share"])
        writer.writerow(csv_cells)
        entries[f"extracted/{key}_table_0.csv"] = output.getvalue().encode()
        sources.append({"id":key,"status":"ORIGINAL_BYTES_RETAINED",
                        "sha256": hashlib.sha256(entries[html_path]).hexdigest()})
    entries["acquisition_receipt.json"] = json.dumps({"revision":"declared-original-revision","sources":sources}).encode()
    entries["readiness.json"] = b"{}"
    manifest = {k:hashlib.sha256(v).hexdigest() for k,v in entries.items() if k != "readiness.json"}
    if altered_manifest:
        manifest["originals/hinds_all.html"] = "0"*64
    entries["MANIFEST_SHA256.json"] = json.dumps(manifest).encode()
    with zipfile.ZipFile(path,"w",compression=zipfile.ZIP_DEFLATED) as z:
        for k,v in entries.items():
            z.writestr(k,v)
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class OriginalArchiveContractTests(unittest.TestCase):
    def _run(self, **kwargs):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"evidence.zip"
            digest=make_archive(path,**kwargs)
            with patch.object(audit,"EXPECTED_ZIP_SHA256",digest):
                return audit.replay(path)

    def test_complete_manifest_and_same_period_rows_reproduce(self):
        out=self._run()
        self.assertEqual(out["manifest_entries_hashed"],9)
        self.assertEqual(out["original_county_html_rows_checked"],4)
        self.assertEqual(out["period"],"2019-2023")
        self.assertEqual(out["comparisons"]["late_rate_difference_per_100k"],6.0)
        self.assertEqual(out["comparisons"]["late_stage_case_share_difference_pp"],0.3)
        self.assertNotEqual(out["comparisons"]["hinds_rate_quotient_not_case_share_pct"],63.7)
        self.assertEqual(out["revision_binding_state"],"MISMATCH_RETAIN_BOTH_NOT_SILENTLY_CORRECTED")

    def test_period_drift_rejected(self):
        with self.assertRaisesRegex(ValueError,"Incorrect disease, stage or observation window"):
            self._run(altered_period=True)

    def test_original_to_csv_disagreement_rejected(self):
        with self.assertRaisesRegex(ValueError,"Archived CSV differs"):
            self._run(altered_csv=True)

    def test_manifest_content_conflict_rejected(self):
        with self.assertRaisesRegex(ValueError,"Manifest source mismatch"):
            self._run(altered_manifest=True)

    def test_zip_integrity_failure_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"evidence.zip"
            make_archive(path)
            with self.assertRaisesRegex(ValueError,"ZIP hash mismatch"):
                audit.replay(path)


if __name__ == "__main__":
    unittest.main()
