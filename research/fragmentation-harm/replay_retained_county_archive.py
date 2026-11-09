#!/usr/bin/env python3
"""Independent-by-implementation (not independent-agent) replay from retained NCI originals.

python research/fragmentation-harm/replay_retained_county_archive.py archive.zip
Public aggregate evidence only; no clinical or counterfactual outcome inference.
"""
from __future__ import annotations
import csv
import hashlib
from html.parser import HTMLParser
import io
import json
import re
import sys
from zipfile import ZipFile

EXPECTED_ZIP_SHA256 = "ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a"
COUNTIES = {
    "hinds_all": ("Hinds County", "All Stages"),
    "hinds_late": ("Hinds County", "Late Stage"),
    "harris_all": ("Harris County", "All Stages"),
    "harris_late": ("Harris County", "Late Stage"),
}

class Rows(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows, self.row, self.depth, self.buf = [], None, 0, []
    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.depth += 1
            if self.depth == 1:
                self.buf = []
    def handle_data(self, data):
        if self.depth:
            self.buf.append(data)
    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.depth:
            self.depth -= 1
            if self.depth == 0:
                self.row.append(" ".join("".join(self.buf).split()))
        elif tag == "tr" and self.row is not None:
            if self.row:
                self.rows.append(self.row)
            self.row = None

def county_row(archive, key, county, stage):
    raw = archive.read(f"originals/{key}.html").decode("utf-8")
    text = " ".join(re.sub(r"<[^>]+>", " ", raw).split())
    header = rf"Colon\s*&\s*Rectum\s*\({re.escape(stage)}\s*\^?\),\s*2019-2023"
    if not re.search(header, text):
        raise ValueError(f"Incorrect disease, stage or observation window: {key}")
    parser = Rows()
    parser.feed(raw)
    matching = [row for row in parser.rows if row and row[0].startswith(county + " ")]
    if len(matching) != 1:
        raise ValueError(f"Ambiguous county original row: {key}")
    row = matching[0]
    m = re.fullmatch(r"([0-9.]+)\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)", row[2])
    if not m:
        raise ValueError(f"Malformed rate: {key}")
    rate, lo, hi = map(float, m.groups())
    if not lo <= rate <= hi:
        raise ValueError(f"Invalid uncertainty: {key}")
    count = int(row[4].replace(",", ""))
    csv_text = archive.read(f"extracted/{key}_table_0.csv").decode("utf-8-sig")
    matched = [r for r in list(csv.reader(io.StringIO(csv_text)))[1:] if r and r[0].startswith(county + " ")]
    if len(matched) != 1 or matched[0][2] != row[2] or int(matched[0][4].replace(",", "")) != count:
        raise ValueError(f"Archived CSV differs from original HTML row: {key}")
    result = {"annual_age_adjusted_rate_per_100k": rate, "lower95": lo, "upper95": hi,
              "average_annual_count": count}
    if stage == "Late Stage":
        share = float(row[5])
        if float(matched[0][5]) != share:
            raise ValueError(f"Stage-share extraction differs from original: {key}")
        result["reported_case_share_late_stage_pct"] = share
    return result

def replay(path):
    with open(path, "rb") as f:
        digest = hashlib.file_digest(f, "sha256").hexdigest()
    if digest != EXPECTED_ZIP_SHA256:
        raise ValueError("ZIP hash mismatch; archive replacement rejected")
    with ZipFile(path) as archive:
        manifest = json.loads(archive.read("MANIFEST_SHA256.json"))
        # readiness.json is in the ZIP but absent from its internal manifest. The
        # whole-ZIP digest covers it; do not falsely describe it as manifest checked.
        if set(archive.namelist()) != set(manifest) | {"MANIFEST_SHA256.json", "readiness.json"}:
            raise ValueError("Unexpected/missing ZIP entry")
        for filename, expected in manifest.items():
            if hashlib.sha256(archive.read(filename)).hexdigest() != expected:
                raise ValueError(f"Manifest source mismatch: {filename}")
        acquisition = json.loads(archive.read("acquisition_receipt.json"))
        by_id = {s["id"]: s for s in acquisition["sources"]}
        for key in COUNTIES:
            source = by_id.get(key)
            if not source or source.get("status") != "ORIGINAL_BYTES_RETAINED":
                raise ValueError(f"Original not retained: {key}")
            if source["sha256"] != hashlib.sha256(archive.read(f"originals/{key}.html")).hexdigest():
                raise ValueError(f"Original conflicts with acquisition receipt: {key}")
        records = {key: county_row(archive, key, *details) for key, details in COUNTIES.items()}
    ha, hl = records["hinds_all"], records["hinds_late"]
    ra, rl = records["harris_all"], records["harris_late"]
    h_rate, r_rate = hl["annual_age_adjusted_rate_per_100k"], rl["annual_age_adjusted_rate_per_100k"]
    h_share, r_share = hl["reported_case_share_late_stage_pct"], rl["reported_case_share_late_stage_pct"]
    comparison = {
        "late_rate_difference_per_100k": round(h_rate - r_rate, 6),
        "late_rate_relative_excess_pct": round((h_rate / r_rate - 1) * 100, 6),
        "all_rate_difference_per_100k": round(ha["annual_age_adjusted_rate_per_100k"] - ra["annual_age_adjusted_rate_per_100k"], 6),
        "late_stage_case_share_difference_pp": round(h_share - r_share, 6),
        "hinds_rate_quotient_not_case_share_pct": round(100*h_rate / ha["annual_age_adjusted_rate_per_100k"], 6),
        "harris_rate_quotient_not_case_share_pct": round(100*r_rate / ra["annual_age_adjusted_rate_per_100k"], 6),
    }
    if comparison["late_rate_difference_per_100k"] != 6 or comparison["late_stage_case_share_difference_pp"] != 0.3:
        raise ValueError("Accepted baseline comparison no longer reproduces")
    return {
        "schema": "chainweb-county-archived-original-replay-v1",
        "zip_sha256": digest, "github_artifact_id": 13589404488, "github_run_id": 42411939810,
        "manifest_entries_hashed": len(manifest), "original_county_html_rows_checked": 4,
        "period": "2019-2023", "acquisition_receipt_revision": acquisition["revision"],
        "artifact_workflow_head": "312577b8e43efadaceb4b834dc524dc11368d3fe",
        "revision_binding_state": "MISMATCH_RETAIN_BOTH_NOT_SILENTLY_CORRECTED",
        "results": records, "comparisons": comparison,
        "scientific_claim_boundary": "Ecological public cancer incidence; source integrity and arithmetic verified. No local recommendation, patient history, counterfactual or prevention effect.",
    }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: replay_retained_county_archive.py archive.zip")
    print(json.dumps(replay(sys.argv[1]), sort_keys=True, indent=2))
