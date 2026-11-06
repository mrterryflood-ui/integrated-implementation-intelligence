#!/usr/bin/env python3
"""Reproducible nationwide State Cancer Profiles (SCP) county incidence intake.

Source: seandavi/state-cancer-profile-scraper release 2026-08-24 (a
secondary public extraction of NCI/CDC State Cancer Profiles; not SEER
user-restricted Research Data). This never uses a SEER account/credential.

Run offline against a verified release asset:
  python3 scripts/ingest_national_scp.py --input path/to/state_cancer_profiles_incidence.csv.gz --output-dir /tmp/scp
Or download the exact pinned public release, requiring explicit opt-in:
  python3 scripts/ingest_national_scp.py --download-public --output-dir /tmp/scp

The complete release SHA-256 must match the pinned GitHub asset metadata.
No small county is dropped: suppressed values remain null with a reason;
rates and conditional late-stage percentages are not conflated.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from urllib.request import Request, urlopen

RELEASE = "2026-08-24"
REPO = "seandavi/state-cancer-profile-scraper"
ASSET = "state_cancer_profiles_incidence.csv.gz"
SOURCE_URL = f"https://github.com/{REPO}/releases/download/{RELEASE}/{ASSET}"
EXPECTED_SHA256 = "db19dd080289c358946e82a9a8d16dfe7a392330f9c1ec8ff4ce31c45133cacd"
# Preserve exact archive version, do not infer the reference 5-year interval
# from the date the scraper ran.
SOURCE_CITATION = "NCI/CDC State Cancer Profiles, county incidence; independently packaged by Sean Davis (release 2026-08-24)"
MISSING = {"", r"\N", "*", "N/A", "NA", "SUPPRESSED", "DATA NOT AVAILABLE", "3 OR FEWER"}

DISEASE_PATTERNS = {
    "colorectal": r"(?:colon.*rectum|colon.*rectal|colorectal|colon\s*&\s*rectum)",
    "breast": r"(?:breast)",
    "lung": r"(?:lung|bronchus)",
    "cervical": r"(?:cervix|cervical)",
    "prostate": r"(?:prostate)",
    "ovary": r"(?:ovar)",
    "uterine": r"(?:corpus uteri|uterus|uterine)",
}
REQUIRED_FIELDS = {
    "fips", "cancer", "stage", "age", "sex", "race", "areatype",
    "age_adjusted_rate_per_100_000", "average_annual_count"
}


def numeric(value: str | None) -> float | None:
    raw = str(value or "").strip()
    if raw.upper() in MISSING or raw.lower().startswith("suppressed"):
        return None
    try:
        number = float(raw.replace(",", ""))
    except ValueError:
        return None
    return number if number == number and abs(number) != float("inf") else None


def full_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as src:
        for chunk in iter(lambda: src.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_public_asset(target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=target.parent, prefix=".scp-", delete=False) as out:
        temporary = Path(out.name)
        try:
            req = Request(SOURCE_URL, headers={"User-Agent": "DIS-public-source-ingestor/1.0"})
            with urlopen(req, timeout=120) as response:
                if not response.url.startswith("https://"):
                    raise ValueError("Public release redirect must remain HTTPS")
                shutil.copyfileobj(response, out, length=1024 * 1024)
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    if full_sha256(temporary) != EXPECTED_SHA256:
        temporary.unlink(missing_ok=True)
        raise ValueError("Public release checksum mismatch; refusing to import")
    temporary.replace(target)


def classify_cancer(value: str, allowed: set[str]) -> str | None:
    for canonical, pattern in DISEASE_PATTERNS.items():
        if canonical in allowed and re.search(pattern, value, flags=re.I):
            return canonical
    return None


def normalize_stage(value: str) -> str | None:
    s = value.casefold()
    if "all stages" in s:
        return "all-stages"
    if "late stage" in s or ("regional" in s and "distant" in s):
        return "late-stage-regional-distant"
    return None


def eligible_row(row: dict[str, str], allowed: set[str]) -> tuple[str, str] | None:
    if str(row.get("locale_type") or "county").casefold() != "county":
        return None
    if str(row.get("areatype") or "By County").casefold() != "by county":
        return None
    if str(row.get("age") or "").casefold() != "all ages":
        return None
    if not str(row.get("race") or "").casefold().startswith("all races"):
        return None
    if str(row.get("sex") or "").casefold() not in {"both sexes", "female", "male"}:
        return None
    disease = classify_cancer(str(row.get("cancer") or ""), allowed)
    stage = normalize_stage(str(row.get("stage") or ""))
    return (disease, stage) if disease and stage else None


def clean_fips(row: dict[str, str]) -> str | None:
    raw = str(row.get("fips") or "").strip()
    if raw.isdigit() and 1 <= len(raw) <= 5:
        fips = raw.zfill(5)
        if fips != "00000":
            return fips
    return None


def process(source: Path, destination: Path, *, cancers: str = "colorectal",
            sha256: str = EXPECTED_SHA256, min_rows: int = 1) -> dict:
    if not source.is_file():
        raise FileNotFoundError(source)
    observed_sha = full_sha256(source)
    if observed_sha.casefold() != sha256.casefold():
        raise ValueError("Input does not match declared SHA-256; no records imported")
    if cancers == "all":
        allowed = set(DISEASE_PATTERNS)
    else:
        allowed = {v.strip().lower() for v in cancers.split(",") if v.strip()}
    unknown = allowed - set(DISEASE_PATTERNS)
    if unknown or not allowed:
        raise ValueError("Unrecognized cancer categories: " + ",".join(sorted(unknown or {"NONE"})))
    output_name = "national_county_incidence_" + "-".join(sorted(allowed)) + "_" + RELEASE + ".jsonl.gz"
    destination.mkdir(parents=True, exist_ok=True)
    final = destination / output_name
    temporary = final.with_suffix(final.suffix + ".tmp")
    distinct_counties = set()
    states = set()
    counts: dict[str, int] = {}
    suppressed = 0
    rows_seen = 0
    rows_out = 0
    try:
        with gzip.open(source, "rt", newline="", encoding="utf-8-sig", errors="replace") as input_stream:
            reader = csv.DictReader(input_stream)
            missing = REQUIRED_FIELDS - set(reader.fieldnames or [])
            if missing:
                raise ValueError("Source schema is incompatible; missing " + ",".join(sorted(missing)))
            with gzip.open(temporary, "wt", encoding="utf-8", newline="") as output_stream:
                for row in reader:
                    rows_seen += 1
                    if row.get("measurement") not in {None, "", "incidence"}:
                        continue
                    kind = eligible_row(row, allowed)
                    fips = clean_fips(row)
                    if kind is None or fips is None:
                        continue
                    disease, stage = kind
                    rate = numeric(row.get("age_adjusted_rate_per_100_000"))
                    lower = numeric(row.get("lower_ci_rate"))
                    upper = numeric(row.get("upper_ci_rate"))
                    annual = numeric(row.get("average_annual_count"))
                    percent = numeric(row.get("percent_of_cases_with_late_stage"))
                    if rate is None:
                        suppressed += 1
                    if rate is not None and lower is not None and upper is not None and not lower <= rate <= upper:
                        raise ValueError("A source confidence interval excludes its own reported rate for FIPS " + fips)
                    value = {
                        "county_fips": fips,
                        "county_name": str(row.get("locale") or row.get("reported_locale") or "").strip(),
                        "state": str(row.get("state") or "").strip(),
                        "disease": disease,
                        "stage": stage,
                        "sex": str(row.get("sex") or ""),
                        "race": str(row.get("race") or ""),
                        "age": str(row.get("age") or ""),
                        "reported_period": str(row.get("year") or "SOURCE_PERIOD_NOT_REPORTED"),
                        "rate_per_100000_age_adjusted": rate,
                        "ci_low": lower,
                        "ci_high": upper,
                        "average_annual_count": annual,
                        "conditional_percent_late": percent if stage.startswith("late-stage") else None,
                        "is_suppressed_or_unavailable": rate is None,
                        "suppression_reason": str(row.get("suppression_reason") or "SOURCE_RATE_NOT_AVAILABLE" if rate is None else ""),
                        "source_url": str(row.get("url") or "").strip(),
                        "source_extracted_at": str(row.get("_extracted_at") or ""),
                        "source_release": RELEASE,
                        "source_kind": "SECONDARY_VERSIONED_EXTRACTION_OF_NCI_CDC_PUBLIC_TABLES",
                        "cancer_source_citation": SOURCE_CITATION,
                        "inference_limit": "COUNTY_AGGREGATE_DESCRIPTIVE_NOT_CAUSAL",
                    }
                    output_stream.write(json.dumps(value, separators=(",", ":"), ensure_ascii=False) + "\n")
                    rows_out += 1
                    distinct_counties.add(fips)
                    states.add(fips[:2])
                    counts[disease + "/" + stage] = counts.get(disease + "/" + stage, 0) + 1
        if rows_out < min_rows:
            raise ValueError("No accepted nationwide records; inspect field names and release vocabulary")
        temporary.replace(final)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    summary = {
        "schema_version": "dis-scp-national-v1",
        "source_release": RELEASE,
        "source_url": SOURCE_URL,
        "source_sha256_verified": observed_sha,
        "source_class": "SECONDARY_PUBLIC_REPRODUCIBLE",
        "source_citation": SOURCE_CITATION,
        "row_period_policy": "USE_PER_ROW_REPORTED_PERIOD_NOT_SCRAPE_DATE",
        "cancers_requested": sorted(allowed),
        "total_input_rows": rows_seen,
        "matched_rows": rows_out,
        "unique_counties_with_data_or_suppression": len(distinct_counties),
        "state_codes": len(states),
        "rates_missing_or_suppressed": suppressed,
        "by_disease_stage": dict(sorted(counts.items())),
        "published_artifact_name": output_name,
        "artifact_sha256": full_sha256(final),
        "data_caveats": [
            "No individual, restricted SEER or Research Plus data was read.",
            "Do not impute a suppressed county rate; do not treat rates as individual risk.",
            "Do not divide age-adjusted late-stage rates by unadjusted late-stage percentages to infer all-stage incidence.",
            "No county similarity is causal or a valid DiD/DDD result.",
            "Do not equate release date with original cancer-diagnosis interval.",
            "Use source county FIPS for polygon joins; preserve geographic boundary vintage.",
        ],
    }
    manifest = destination / (output_name.removesuffix(".jsonl.gz") + ".manifest.json")
    manifest.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Locally staged public incidence.csv.gz asset")
    parser.add_argument("--download-public", action="store_true", help="Explicitly download pinned release, checksum before processing")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--cancers", default="colorectal", help="Comma-separated: colorectal, breast, lung, cervical, prostate, ovary, uterine or all")
    parser.add_argument("--expected-sha256", default=EXPECTED_SHA256, help="Pinned public-release asset checksum, or verified local test fixture checksum")
    parser.add_argument("--min-rows", type=int, default=1, help="Require minimum accepted rows before publishing artifact")
    args = parser.parse_args()
    if args.input and args.download_public:
        parser.error("Select either --input or --download-public")
    if not args.input and not args.download_public:
        parser.error("Supply --input or explicitly choose --download-public")
    if args.download_public and args.expected_sha256 != EXPECTED_SHA256:
        parser.error("Do not replace the pinned public release checksum when downloading")
    source = args.input
    if args.download_public:
        source = args.output_dir / "raw" / ASSET
        if source.exists() and full_sha256(source) != EXPECTED_SHA256:
            source.unlink()
        if not source.exists():
            download_public_asset(source)
    summary = process(source, args.output_dir, cancers=args.cancers,
                      sha256=args.expected_sha256, min_rows=args.min_rows)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
