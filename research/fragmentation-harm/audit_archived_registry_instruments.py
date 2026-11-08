"""Audit retained public NCI county-source instrument definitions; no patient data.

Usage: python audit_archived_registry_instruments.py path/to/retained_artifact.zip
This fails closed on ZIP/hash/CSV/HTML/footnote drift. The pinned 2025-source
archive cannot prove at-2023 availability or causal comparability.
"""
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from pathlib import Path

EXPECTED_ZIP_SHA256 = "ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a"
FOOTNOTE_AGE = "SEER areas use 20 age groups and NPCR areas use 19 age groups"
FOOTNOTE_STAGE = (
    "Combined Summary Stage with Expanded Regional Codes (2004+) is used for data from"
)
EXPECTED = {
    "hinds_all": ("Hinds County", "2", "46.4 (42.6, 50.5)", "118", None),
    "hinds_late": ("Hinds County", "2", "29.9 (26.8, 33.2)", "75", "63.7"),
    "harris_all": ("Harris County", "7", "38.0 (37.2, 38.9)", "1732", None),
    "harris_late": ("Harris County", "7", "23.9 (23.3, 24.6)", "1098", "63.4"),
}

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def parse_county_csv(data, county):
    rows = list(csv.DictReader(io.StringIO(data.decode("utf-8-sig"))))
    matches = [r for r in rows if r["County"].strip().startswith(county + "  ")]
    if len(matches) != 1:
        raise AssertionError(f"Expected exactly one {county} record, got {len(matches)}")
    return matches[0]

def audit(path):
    raw = Path(path).read_bytes()
    assert sha256(raw) == EXPECTED_ZIP_SHA256, "Artifact ZIP digest changed"
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        manifest = json.loads(z.read("MANIFEST_SHA256.json"))
        assert len(manifest) == 18, "Manifest entry count drift"
        for name, digest in manifest.items():
            assert sha256(z.read(name)) == digest, f"Internal digest mismatch {name}"
        results = {}
        for key, (county, mark, rate, count, share) in EXPECTED.items():
            html_name = f"originals/{key}.html"
            csv_name = f"extracted/{key}_table_0.csv"
            html_source = z.read(html_name).decode("utf-8", "replace")
            row = parse_county_csv(z.read(csv_name), county)
            assert FOOTNOTE_AGE in html_source, f"Age adjustment note absent: {key}"
            assert FOOTNOTE_STAGE in html_source, f"Stage coding note absent: {key}"
            assert "2019-2023" in html_source, f"Report period drift: {key}"
            assert row["County"].strip() == f"{county}  {mark}", f"Source marker drift: {key}"
            assert row["Age-Adjusted Incidence Rate † cases per 100,000 (95% Confidence Interval)"] == rate
            assert row["Average Annual Count"] == count
            if share is not None:
                assert row["Percent of Cases with Late Stage"] == share
            stripped = re.sub(r"<[^>]+>", " ", html_source)
            if mark == "2":
                assert re.search(r"2\s*Source:\s*National Program of Cancer Registries", stripped), "NPCR source note missing"
            else:
                assert re.search(r"7\s*Source:\s*SEER\s+November 2025 submission", stripped), "SEER source note missing"
            results[key] = {
                "rate_ci": rate,
                "average_annual_count": int(count),
                "late_stage_percent": float(share) if share else None,
                "source_marker": mark,
                "html_sha256": sha256(z.read(html_name)),
            }
    return {
        "zip_sha256": sha256(raw),
        "manifest_entries_verified": len(manifest),
        "incident_period": "2019-2023",
        "source_submission": "2025 (Hinds NPCR; Harris SEER Nov 2025)",
        "age_groups": {"Hinds_NPCR": 19, "Harris_SEER": 20},
        "stage_recode": {
            "Hinds_NPCR": "Merged Summary Stage",
            "Harris_SEER": "Combined Summary Stage with Expanded Regional Codes (2004+)",
        },
        "rate_difference_late_per_100k": 29.9 - 23.9,
        "late_case_share_difference_percentage_points": 63.7 - 63.4,
        "county_rows": results,
        "provenance_caveat": "Acquisition receipt revision != workflow head revision; do not reconcile by assertion",
        "counterfactual_caveat": "Finalized 2025 submissions not available at 2019-2023 historical decision dates",
        "unknown_stage_share_denominator": "NOT RESOLVED by county CSV or report footnotes",
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python audit_archived_registry_instruments.py retained_artifact.zip")
    print(json.dumps(audit(sys.argv[1]), indent=2, sort_keys=True))
