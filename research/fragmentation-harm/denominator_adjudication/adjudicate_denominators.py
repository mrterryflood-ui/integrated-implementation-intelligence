"""Independent descriptive adjudication of retained public aggregate cancer data.

No imputation, case identification, patient-level reconstruction, causal estimate,
or clinical authorization. Integer examples are arithmetic witnesses, not data.
Python standard library only. The canonical archive is read without modification.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import itertools
import json
import math
import re
import statistics
import zipfile
from collections import Counter
from decimal import Decimal
from fractions import Fraction
from html.parser import HTMLParser
from pathlib import Path

ARCHIVE_SHA = 'ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a'
SCIENCE_SHA = '18823969ffee9f6eb393891f65e00941e102b9d6'
TABLES = {'hinds_all': ('MS', 'all'), 'hinds_late': ('MS', 'late'),
          'harris_all': ('TX', 'all'), 'harris_late': ('TX', 'late')}
STANDARD_TOTAL = 274633642
STANDARD_85 = 2678567
STANDARD_90 = 1580606


class TableParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows, self.row, self.cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        if tag in ('td', 'th') and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()))
            self.cell = None
        if tag == 'tr' and self.row is not None:
            if self.row:
                self.rows.append(self.row)
            self.row = None


def canonical(value):
    return ' '.join(value.replace(',', '').split())


def county_name(value):
    return re.sub(r'\s+\d+$', '', canonical(value))


def read_rate(value):
    if value.strip() == '*':
        return None, None, None
    match = re.fullmatch(r'([\d.]+)\s*\(\s*([\d.]+),\s*([\d.]+)\s*\)', value.strip())
    if not match:
        raise ValueError('Unexpected rate representation')
    estimate, low, high = map(Decimal, match.groups())
    if not 0 <= low <= estimate <= high:
        raise ValueError('Invalid rate interval')
    return estimate, low, high


def read_count(value):
    clean = value.replace(',', '').strip()
    if clean == '3 or fewer':
        return None, 'SUPPRESSED'
    if not clean.isdigit():
        raise ValueError('Unexpected count representation')
    return int(clean), 'OBSERVED_PRESENT' if int(clean) else 'OBSERVED_ZERO'


def load_archive(path):
    raw = Path(path).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != ARCHIVE_SHA:
        raise ValueError('Archive differs from retained original')
    rows, source_receipts, verified_cells = {}, {}, 0
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        manifest = json.loads(archive.read('MANIFEST_SHA256.json'))
        if len(manifest) != 18:
            raise ValueError('Unexpected manifest length')
        if set(archive.namelist()) != set(manifest) | {'MANIFEST_SHA256.json', 'readiness.json'}:
            raise ValueError('Unexpected archive members')
        for name, expected in manifest.items():
            if hashlib.sha256(archive.read(name)).hexdigest() != expected:
                raise ValueError('Corrupt original: ' + name)
        acquisition = json.loads(archive.read('acquisition_receipt.json'))
        for stem, (state, stage) in TABLES.items():
            original = archive.read(f'originals/{stem}.html')
            parser = TableParser()
            parser.feed(original.decode())
            original_rows = {county_name(row[0]): row for row in parser.rows
                             if row and ' County' in row[0]}
            extracted = list(csv.reader(io.StringIO(archive.read(f'extracted/{stem}_table_0.csv').decode('utf-8-sig'))))
            extracted_rows = {county_name(row[0]): row for row in extracted[1:] if row and ' County' in row[0]}
            if original_rows.keys() != extracted_rows.keys():
                raise ValueError('HTML/CSV frames differ')
            for county, raw_row in original_rows.items():
                if list(map(canonical, raw_row)) != list(map(canonical, extracted_rows[county])):
                    raise ValueError('HTML/CSV cells differ')
                verified_cells += len(raw_row)
                record = rows.setdefault((state, county), {'state': state, 'county': county, 'ruralurban': raw_row[1]})
                if record['ruralurban'] != raw_row[1]:
                    raise ValueError('Rural/urban classification changed across same-period tables')
                rate, lo, hi = read_rate(raw_row[2])
                count, status = read_count(raw_row[4])
                if (rate is None) != (count is None):
                    raise ValueError('Unexpected rate/count missingness mismatch')
                record.update({f'{stage}_rate': rate, f'{stage}_lo': lo, f'{stage}_hi': hi,
                               f'{stage}_annual_count': count, f'{stage}_count_state': status,
                               f'{stage}_count_raw': raw_row[4]})
                if stage == 'late':
                    record['share'] = None if raw_row[5] == '*' else Decimal(raw_row[5])
                    record['share_state'] = 'SUPPRESSED' if raw_row[5] == '*' else 'OBSERVED_PRESENT'
                    if record['share'] is not None and not 0 <= record['share'] <= 100:
                        raise ValueError('Invalid share')
                    if (rate is None) != (record['share'] is None):
                        raise ValueError('Unexpected rate/share missingness mismatch')
            source_receipts[stem] = {'sha256': hashlib.sha256(original).hexdigest(), 'county_rows': len(original_rows)}
    if Counter(r['state'] for r in rows.values()) != Counter({'MS': 82, 'TX': 254}):
        raise ValueError('Unexpected county frame')
    for row in rows.values():
        row['complete'] = all(row[key] is not None for key in ['all_rate', 'late_rate', 'share'])
        row['missingness_pattern'] = ('COMPLETE' if row['complete'] else
                                     'ALL_AND_LATE_SUPPRESSED' if row['all_rate'] is None else
                                     'LATE_ONLY_SUPPRESSED')
    return sorted(rows.values(), key=lambda r: (r['state'], r['county'])), {
        'archive_sha256': digest, 'manifest_entries_verified': len(manifest),
        'html_csv_cells_verified': verified_cells, 'source_receipts': source_receipts,
        'archive_reported_acquisition_revision': acquisition['revision'],
        'acquisition_runtime_revision_adjudicated_by_this_script': False,
        'sources_acquired_at': acquisition['finished_at']}


def pair_summary(rows, share_window):
    near, hits, robust, disjoint, unique = 0, 0, 0, 0, set()
    records = []
    for a, b in itertools.combinations(rows, 2):
        sd = abs(a['share'] - b['share'])
        if sd > share_window:
            continue
        near += 1
        rd = abs(a['late_rate'] - b['late_rate'])
        if rd < 5:
            continue
        hits += 1
        unique.update([a['county'], b['county']])
        rr = sd + Decimal('0.1') <= share_window and rd - Decimal('0.1') >= 5
        dd = a['late_hi'] < b['late_lo'] or b['late_hi'] < a['late_lo']
        robust += rr
        disjoint += dd
        records.append({'county_a': a['county'], 'county_b': b['county'], 'share_gap_pp': sd,
                        'late_rate_gap_per_100000': rd, 'rounding_robust': rr,
                        'disjoint_marginal_intervals': dd})
    return {'county_count': len(rows), 'rural_count': sum(r['ruralurban'] == 'Rural' for r in rows),
            'near_share_pairs': near, 'large_rate_gap_pairs': hits, 'unique_counties_in_large_gap_pairs': len(unique),
            'rounding_robust_large_gap_pairs': robust, 'large_gap_pairs_with_disjoint_intervals': disjoint,
            'independent_observations': False}, records


def county_selection(rows):
    completeness, sensitivity, retained_pairs = {}, {}, {}
    for state in ('MS', 'TX'):
        state_rows = [r for r in rows if r['state'] == state]
        groups = {}
        for geography in ('ALL', 'Rural', 'Urban'):
            subset = state_rows if geography == 'ALL' else [r for r in state_rows if r['ruralurban'] == geography]
            counts = Counter(r['missingness_pattern'] for r in subset)
            groups[geography] = {'eligible_counties': len(subset), 'complete_counties': counts['COMPLETE'],
                                 'incomplete_counties': len(subset) - counts['COMPLETE'],
                                 'incomplete_fraction': (len(subset) - counts['COMPLETE']) / len(subset),
                                 'all_and_late_suppressed': counts['ALL_AND_LATE_SUPPRESSED'],
                                 'late_only_suppressed': counts['LATE_ONLY_SUPPRESSED']}
        completeness[state] = groups
        complete = [r for r in state_rows if r['complete']]
        sensitivity[state] = {}
        for annual_threshold in (0, 4, 8, 10, 16, 25, 50):
            selected = [r for r in complete if r['late_annual_count'] >= annual_threshold]
            summary = {}
            for window in ('0.3', '0.5', '1.0'):
                summary[window], pair_records = pair_summary(selected, Decimal(window))
                if annual_threshold == 16 and window == '0.5':
                    retained_pairs[state] = pair_records
            sensitivity[state][str(annual_threshold)] = summary
    return completeness, sensitivity, retained_pairs


def integer_range(annual):
    if type(annual) is not int or annual < 3:
        raise ValueError('Use observed unsuppressed annual counts only')
    return range(max(16, math.ceil((Fraction(annual) - Fraction(1, 2)) * 5)),
                 math.ceil((Fraction(annual) + Fraction(1, 2)) * 5))


def rounding_witnesses(record, exclusions=False):
    if not record['complete']:
        raise ValueError('Suppressed counties are not reconstructed')
    low = Fraction(str(record['share'])) - Fraction(1, 20)
    high = Fraction(str(record['share'])) + Fraction(1, 20)
    matches = []
    for total in integer_range(record['all_annual_count']):
        for late in integer_range(record['late_annual_count']):
            denominators = range(late, total + 1) if exclusions else [total]
            for denominator in denominators:
                if late <= denominator and low <= 100 * Fraction(late, denominator) < high:
                    matches.append({'all_period_count': total, 'late_period_count': late,
                                    'share_denominator': denominator, 'excluded_count': total - denominator})
    return matches


def denominator_assessment(rows):
    complete = [r for r in rows if r['complete']]
    failures = []
    for row in complete:
        if not rounding_witnesses(row):
            failures.append({'state': row['state'], 'county': row['county']})
    targets = {}
    for row in rows:
        if (row['state'], row['county']) not in [('MS', 'Hinds County'), ('TX', 'Harris County')]:
            continue
        possibilities = rounding_witnesses(row, exclusions=True)
        no_exclusion = [m for m in possibilities if m['excluded_count'] == 0]
        exclusion = [m for m in possibilities if m['excluded_count'] > 0]
        targets[row['county']] = {
            'same_all_case_denominator_compatible_pairs': len(no_exclusion),
            'arithmetic_witness_without_exclusion': no_exclusion[0] if no_exclusion else None,
            'arithmetic_witness_with_exclusion': exclusion[0] if exclusion else None,
            'maximum_compatible_exclusion_under_assumptions': max(m['excluded_count'] for m in possibilities),
            'are_recovered_counts': False, 'are_estimated_unknown_stage_counts': False,
            'meaning': 'Nonidentification counterexample under shared numerator and nearest rounding, not a source selection rule'}
    return {'assumption': '5-year period; nearest integer annual average; nearest 0.1pp share; same numerator across tables',
            'complete_counties_checked': len(complete), 'same_denominator_rounding_incompatible_counties': failures,
            'unknown_stage_rule_identified': False, 'autopsy_or_dco_exclusion_rule_identified': False,
            'targets': targets}


def age_partition_assessment():
    w85, w90 = Fraction(STANDARD_85, STANDARD_TOTAL), Fraction(STANDARD_90, STANDARD_TOTAL)
    q = w85 / (w85 + w90)
    examples = []
    # These deliberately constructed numerical fixtures verify signs, not plausibility.
    for p, r85, r90 in [(Fraction(1, 2), 200, 100), (Fraction(4, 5), 200, 100),
                       (q, 200, 100), (Fraction(1, 2), 150, 150)]:
        separate = w85 * r85 + w90 * r90
        merged = (w85 + w90) * (p * r85 + (1 - p) * r90)
        formula = (w85 + w90) * (q - p) * (r85 - r90)
        if separate - merged != formula:
            raise AssertionError('Independent algebra mismatch')
        examples.append({'observed_85_89_person_time_fraction_fixture': float(p),
                         'rate85_fixture': r85, 'rate90_fixture': r90,
                         'R20_minus_R19': float(separate - merged), 'observed_patient_data': False})
    return {'standard_population_total': STANDARD_TOTAL, 'standard_85_89': STANDARD_85,
            'standard_90_plus': STANDARD_90, 'common_partition_specifiable': '19 groups, with 85+ merged',
            'county_common_partition_rates_identifiable_from_retained_tables': False,
            'required_data': ['Age-specific late-stage counts for all 20 groups',
                              'Matching age-specific person-years for the same county, race, sex and 2019–2023 period',
                              'Exact stage/exclusion and source revision definition',
                              'Agency uncertainty estimator and standard-population identity'],
            'collapse_rule': 'Sum 85–89 and 90+ event counts and person-years, then calculate the combined rate; never average their published rates',
            'necessary_abs_top_age_rate_gap_to_explain_6_only_by_partition': float(Fraction(6) / max(w85, w90)),
            'necessary_abs_top_age_rate_gap_for_5_9_rounding_infimum': float(Fraction(59, 10) / max(w85, w90)),
            'bound_is_sufficient_or_empirical': False, 'signed_fixtures': examples,
            'adjusted_hinds_rate': None, 'adjusted_harris_rate': None}


def serializable(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: serializable(val) for key, val in value.items()}
    if isinstance(value, (list, tuple)):
        return [serializable(val) for val in value]
    return value


def run(archive, output):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    rows, provenance = load_archive(archive)
    completeness, sensitivity, retained_pairs = county_selection(rows)
    result = serializable({'schema': 'dis-independent-denominator-adjudication-v1',
                           'analysis_scope': 'DESCRIPTIVE_PUBLIC_AGGREGATE_ONLY',
                           'provenance': provenance, 'denominator': denominator_assessment(rows),
                           'age_partition': age_partition_assessment(),
                           'completeness': completeness, 'annual_count_filter_sensitivity': sensitivity,
                           'retained_large_gap_pairs_at_annual16_sharewindow0_5': retained_pairs,
                           'suppression_imputed': False, 'patient_effect_estimated': False,
                           'clinical_acceptance': False})
    (output / 'independent_denominator_results.json').write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    with (output / 'county_missingness_audit.csv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(serializable(rows))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    result = run(args.archive, args.out)
    print(json.dumps({'provenance': result['provenance'], 'denominator': result['denominator'],
                      'completeness': result['completeness'],
                      'primary_window_sensitivity': {state: {threshold: windows['0.5']
                        for threshold, windows in series.items()} for state, series in
                        result['annual_count_filter_sensitivity'].items()}}, indent=2))
