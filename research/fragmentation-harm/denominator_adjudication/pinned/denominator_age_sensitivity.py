"""S1c: public-aggregate rounding and conditional age-partition audit.

No patient data, source requests, outcome predictions, or clinical actions.
Standard weights: https://seer.cancer.gov/stdpopulations/stdpop.20ages.html
All count pairs are possibilities under stated rounding, NOT recovered counts.
"""
from __future__ import annotations
import csv
import hashlib
import io
import json
import math
import re
import sys
import zipfile
from fractions import Fraction
from html.parser import HTMLParser
from pathlib import Path

ARCHIVE_SHA256 = 'ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a'
CHECKOUT_SHA = '312577b8e43efadaceb4b834dc524dc11368d3fe'
STD_TOTAL, STD_85_89, STD_90_PLUS = 274633642, 2678567, 1580606
W85, W90 = Fraction(STD_85_89, STD_TOTAL), Fraction(STD_90_PLUS, STD_TOTAL)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def finite_nonnegative(value: float) -> float:
    require(not isinstance(value, bool), 'Boolean is not a measurement')
    value = float(value)
    require(math.isfinite(value) and value >= 0, 'Expected finite nonnegative measurement')
    return value


def compatible_counts(all_annual: int, late_annual: int, share: str, years: int = 5) -> list[dict]:
    """Enumerate nearest-integer annual counts and nearest-0.1 percent share.

    Half-open rounding intervals; not a claim about agency tie-breaking rules.
    Scope deliberately limited to unsuppressed aggregate five-year reports.
    """
    require(type(all_annual) is int and type(late_annual) is int, 'Counts must be integers')
    require(type(years) is int and years == 5, 'Only audited five-year report supported')
    require(16 <= late_annual <= all_annual, 'Only unsuppressed large aggregates supported')
    p = Fraction(str(share))
    require(0 <= p <= 100, 'Share must be between 0 and 100')
    totals = range(math.ceil((Fraction(all_annual) - Fraction(1, 2))*years),
                   math.ceil((Fraction(all_annual) + Fraction(1, 2))*years))
    late_totals = range(math.ceil((Fraction(late_annual) - Fraction(1, 2))*years),
                        math.ceil((Fraction(late_annual) + Fraction(1, 2))*years))
    return [{'late': late, 'all': total, 'percent': float(100*Fraction(late, total))}
            for total in totals for late in late_totals
            if late <= total and p-Fraction(1, 20) <= 100*Fraction(late, total) < p+Fraction(1, 20)]


def age_split_delta(rate85: float, rate90: float, py85: float, py90: float) -> float:
    """R20 - R19 when ONLY 85+ partition changes; rates are per 100,000.

    Rates, case selection, all younger bands, and standard weights otherwise fixed.
    Person-years must match the county/race/sex/period defining those rates.
    """
    r85, r90, n85, n90 = map(finite_nonnegative, (rate85, rate90, py85, py90))
    require(n85 > 0 and n90 > 0, 'Both age-band person-years must be positive')
    w = float(W85+W90)
    q = float(W85/(W85+W90))
    p = n85/(n85+n90)
    return w*(q-p)*(r85-r90)


def necessary_top_rate_gap(target_change: float) -> float:
    """Necessary, NOT sufficient, minimum |r85-r90| over unknown age mix.

    |delta| <= max(w85,w90)*|r85-r90|. This is an analytical bound, not
    an empirical adjustment to any county and not a plausibility judgment.
    """
    return finite_nonnegative(target_change)/float(max(W85, W90))


def provenance_state(receipt_sha: str, checkout_sha: str, acquisition_env_sha: str) -> str:
    for sha in (receipt_sha, checkout_sha, acquisition_env_sha):
        require(isinstance(sha, str) and re.fullmatch(r'[0-9a-f]{40}', sha) is not None,
                'Expected full commit SHA')
    if receipt_sha == checkout_sha == acquisition_env_sha:
        return 'MATCHED_REPORTED_REVISIONS_NOT_FULL_ATTESTATION'
    return 'CONTRADICTORY_REVISION_EVIDENCE_REQUIRES_ADJUDICATION'


class TableRows(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows, self.row, self.cell = [], None, None
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        elif tag in ('td', 'th') and self.row is not None:
            self.cell = []
    def handle_data(self, text):
        if self.cell is not None:
            self.cell.append(text)
    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()))
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def canonical_cell(value: str) -> str:
    return ' '.join(value.replace(',', '').split())


def audit_archive(path: str | Path) -> dict:
    raw = Path(path).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == ARCHIVE_SHA256, 'Wrong archive SHA256')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        manifest = json.loads(z.read('MANIFEST_SHA256.json'))
        require(len(manifest) == 18, 'Unexpected manifest coverage')
        for name, expected in manifest.items():
            require(hashlib.sha256(z.read(name)).hexdigest() == expected, 'Manifest mismatch: '+name)
        receipt = json.loads(z.read('acquisition_receipt.json'))
        outputs = {}
        for county, marker in [('hinds', '2'), ('harris', '7')]:
            stages = {}
            for stage in ('all', 'late'):
                key = county+'_'+stage
                html_name, csv_name = f'originals/{key}.html', f'extracted/{key}_table_0.csv'
                source = z.read(html_name).decode('utf-8')
                require('2019-2023' in source, 'Period missing')
                require('SEER areas use 20 age groups and NPCR areas use 19 age groups' in source,
                        'Age partition footnote missing')
                rows = list(csv.DictReader(io.StringIO(z.read(csv_name).decode('utf-8-sig'))))
                name = county.title()+' County'
                matches = [row for row in rows if canonical_cell(row['County']) == name+' '+marker]
                require(len(matches) == 1, 'County/source marker missing or duplicated')
                row = matches[0]
                parser = TableRows(); parser.feed(source)
                html_rows = [r for r in parser.rows if r and canonical_cell(r[0]) == name+' '+marker]
                require(len(html_rows) == 1, 'Original county HTML row missing or duplicated')
                require([canonical_cell(v) for v in row.values()] ==
                        [canonical_cell(v) for v in html_rows[0]], 'CSV differs from original HTML')
                rate_key = next(k for k in row if k.startswith('Age-Adjusted Incidence Rate'))
                stages[stage] = {'rate': float(row[rate_key].split()[0]),
                                 'annual_count': int(row['Average Annual Count']),
                                 'html_sha256': hashlib.sha256(z.read(html_name)).hexdigest()}
                if stage == 'late':
                    stages[stage]['share_percent'] = row['Percent of Cases with Late Stage']
            pairs = compatible_counts(stages['all']['annual_count'], stages['late']['annual_count'],
                                      stages['late']['share_percent'])
            outputs[county] = {'source_marker': marker, 'stages': stages,
                               'compatible_pair_count': len(pairs), 'compatible_pairs': pairs,
                               'selected_true_pair': None}
    return {'schema': 'dis-s1c-rounding-age-sensitivity-v1', 'zip_sha256': ARCHIVE_SHA256,
            'manifest_entries_verified': 18, 'original_html_csv_rows_matched': 4,
            'count_rounding_assumption': 'Five years; nearest integer annual mean; nearest 0.1 percentage point share; same all-case denominator',
            'county_results': outputs,
            'age_partition': {'standard_total': STD_TOTAL, 'standard_85_89': STD_85_89,
                              'standard_90_plus': STD_90_PLUS, 'weight_85_plus': float(W85+W90),
                              'required_age_specific_difference_for_6': necessary_top_rate_gap(6),
                              'required_age_specific_difference_for_5_9': necessary_top_rate_gap(5.9),
                              'county_adjusted_rate': None, 'grade': 'CONDITIONAL_ALGEBRA_NOT_EMPIRICAL_EFFECT'},
            'provenance': {'receipt_revision': receipt['revision'], 'logged_checkout_revision': CHECKOUT_SHA,
                           'logged_acquisition_env_revision': CHECKOUT_SHA, 'job_id': 128521759514,
                           'state': provenance_state(receipt['revision'], CHECKOUT_SHA, CHECKOUT_SHA),
                           'receipt_revision_is_merge_parented_by_checkout': True,
                           'acquisition_blob_at_both_commits': 'a21c038476807262db6122d09593afcdb2387205',
                           'code_blob_equivalence_is_not_runtime_attestation': True},
            'unknown_stage_denominator': 'SOURCE_SPECIFIC_MEMBERSHIP_NOT_VERIFIED',
            'clinical_causal_effect': None, 'prevented_harm': None}


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python denominator_age_sensitivity.py ORIGINAL_ARCHIVE.zip')
    print(json.dumps(audit_archive(sys.argv[1]), indent=2, sort_keys=True, allow_nan=False))

