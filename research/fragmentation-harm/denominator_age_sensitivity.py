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


def compatible_counts(all_annual: int, late_annual: int, share: str, years: int = 5,
                      *, allow_denominator_exclusions: bool = False) -> list[dict]:
    """Enumerate nearest-integer annual counts and nearest-0.1 percent share.

    Half-open rounding intervals; not a claim about agency tie-breaking rules.
    Scope deliberately limited to unsuppressed aggregate five-year reports.
    With exclusions enabled, the displayed share denominator D may be any integer
    from the late numerator L through the all-stage total N. The same L must occur
    in both tables. N-D is a mathematical possibility, not an unknown-stage count.
    """
    require(type(all_annual) is int and type(late_annual) is int, 'Counts must be integers')
    require(type(years) is int and years == 5, 'Only audited five-year report supported')
    require(type(allow_denominator_exclusions) is bool, 'Exclusion flag must be boolean')
    require(16 <= late_annual <= all_annual, 'Only unsuppressed large aggregates supported')
    p = Fraction(str(share))
    require(0 <= p <= 100, 'Share must be between 0 and 100')
    totals = range(math.ceil((Fraction(all_annual) - Fraction(1, 2))*years),
                   math.ceil((Fraction(all_annual) + Fraction(1, 2))*years))
    late_totals = range(math.ceil((Fraction(late_annual) - Fraction(1, 2))*years),
                        math.ceil((Fraction(late_annual) + Fraction(1, 2))*years))
    matches = []
    for total in totals:
        for late in late_totals:
            denominators = range(late, total + 1) if allow_denominator_exclusions else (total,)
            for denominator in denominators:
                percent = 100 * Fraction(late, denominator)
                if late <= denominator and p-Fraction(1, 20) <= percent < p+Fraction(1, 20):
                    row = {'late': late, 'all': total, 'percent': float(percent)}
                    if allow_denominator_exclusions:
                        row.update(share_denominator=denominator, excluded_count=total-denominator,
                                   all_case_percent=float(100 * Fraction(late, total)))
                    matches.append(row)
    return matches


def _rational(value: Fraction) -> dict:
    """Exact arithmetic and a display approximation; neither is a recovered count."""
    return {'numerator': value.numerator, 'denominator': value.denominator,
            'decimal': float(value)}


def _bounds(lower: Fraction, upper: Fraction, *, lower_attained=True, upper_attained=True) -> dict:
    return {'lower': _rational(lower), 'upper': _rational(upper),
            'lower_attained': lower_attained, 'upper_attained': upper_attained}


def _share_interval(share_percent) -> tuple[Fraction, Fraction, bool]:
    require(not isinstance(share_percent, bool), 'Boolean is not a share')
    share = Fraction(str(share_percent))
    require(0 <= share <= 100, 'Share must be between 0 and 100')
    require((10 * share).denominator == 1, 'Reported share must be on the 0.1 percentage-point grid')
    return max(Fraction(0), share-Fraction(1, 20)), min(Fraction(100), share+Fraction(1, 20)), share == 100


def unknown_stage_models(share_percent, unknown_fraction, late_fraction_unknown=0) -> dict:
    """Two distinct hypothetical estimands, starting from L/N including unknowns.

    u=U/N is the unknown-stage fraction of that same case universe. Removing U
    changes the denominator: 100L/(N-U). Reclassifying a fraction z of U as late
    keeps N fixed: 100(L+zU)/N. Neither operation is an observed correction, and
    these formulas cannot be applied to a share already excluding unknown stage.
    """
    require(not any(isinstance(x, bool) for x in (share_percent, unknown_fraction, late_fraction_unknown)),
            'Boolean is not a measurement')
    p, u, z = (Fraction(str(x)) for x in (share_percent, unknown_fraction, late_fraction_unknown))
    require(0 <= p <= 100 and 0 <= u < 1 and 0 <= z <= 1, 'Invalid share or sensitivity fraction')
    require(p/100 + u <= 1, 'Unknown and observed late-stage cases cannot exceed the all-case total')
    return {'scope': 'HYPOTHETICAL_SAME_CASE_UNIVERSE_NOT_AN_OBSERVED_CORRECTION',
            'input_all_case_percent': _rational(p), 'unknown_fraction': _rational(u),
            'late_fraction_among_unknown': _rational(z),
            'denominator_removal_percent': _rational(p/(1-u)),
            'unknown_reclassification_percent': _rational(p+100*z*u)}


def _configuration_comparison(first: list[dict], second: list[dict]) -> dict:
    """Recalculate both counties on each configuration's all-stage-table N."""
    def share(row):
        return 100 * Fraction(row['late'], row['all'])
    result = {'status': 'BOUNDED_UNDER_ASSUMPTIONS' if first and second else 'NO_COMPATIBLE_CONFIGURATION',
              'first_configurations': first, 'second_configurations': second,
              'first_configuration_count': len(first), 'second_configuration_count': len(second),
              'joint_configuration_count': len(first)*len(second),
              'first_all_case_percent_bounds': None, 'second_all_case_percent_bounds': None,
              'difference_pp': None, 'extreme_witnesses': None}
    for key, rows in (('first_all_case_percent_bounds', first), ('second_all_case_percent_bounds', second)):
        if rows:
            result[key] = _bounds(min(map(share, rows)), max(map(share, rows)))
    if first and second:
        first_min, first_max = min(first, key=share), max(first, key=share)
        second_min, second_max = min(second, key=share), max(second, key=share)
        result['difference_pp'] = _bounds(share(first_min)-share(second_max), share(first_max)-share(second_min))
        result['extreme_witnesses'] = {
            'lower': {'first': first_min, 'second': second_max},
            'upper': {'first': first_max, 'second': second_min}}
    return result


def bounded_share_comparison(first_all_annual: int, first_late_annual: int, first_share,
                             second_all_annual: int, second_late_annual: int, second_share,
                             *, max_unknown_fraction='0.01') -> dict:
    """Finite identification bounds and separate hypothetical unknown-stage models.

    Exact fractions describe conditional mathematics, not scientific precision.
    Each source must have the same period and late numerator across its own tables.
    This function does not establish cross-registry stage equivalence, historical
    denominator membership, empirical unknown-stage prevalence, or sampling error.
    """
    first_low, first_high, first_high_included = _share_interval(first_share)
    second_low, second_high, second_high_included = _share_interval(second_share)
    require(not isinstance(max_unknown_fraction, bool), 'Boolean is not an unknown-stage fraction')
    umax = Fraction(str(max_unknown_fraction))
    require(0 <= umax < 1, 'Unknown-stage fraction must be in [0, 1)')
    require(max(first_high, second_high)/100 + umax <= 1,
            'Unknown-stage scenario overlaps observed late-stage cases at the rounding boundary')
    first = compatible_counts(first_all_annual, first_late_annual, first_share)
    second = compatible_counts(second_all_annual, second_late_annual, second_share)
    first_exclusions = compatible_counts(first_all_annual, first_late_annual, first_share,
                                        allow_denominator_exclusions=True)
    second_exclusions = compatible_counts(second_all_annual, second_late_annual, second_share,
                                         allow_denominator_exclusions=True)
    same = _configuration_comparison(first, second)
    exclusions = _configuration_comparison(first_exclusions, second_exclusions)
    exclusions.update(
        assumption='The displayed share may use an integer D with L <= D <= N, retaining the same late numerator L; recalculate both shares as 100L/N.',
        maximum_first_compatible_exclusion=max((r['excluded_count'] for r in first_exclusions), default=None),
        maximum_second_compatible_exclusion=max((r['excluded_count'] for r in second_exclusions), default=None),
        exclusions_are_estimated_unknown_stage_counts=False)
    return {
        'schema': 'dis-bounded-stage-share-comparison-v1',
        'scope': 'CONDITIONAL_DESCRIPTIVE_IDENTIFICATION_AND_SENSITIVITY_ONLY',
        'difference_direction': 'first_minus_second',
        'assumptions': [
            'Five diagnosis years; nearest-integer average annual counts; half-open [display-0.5, display+0.5) annual intervals.',
            'Nearest-0.1 percentage-point published shares; half-open [display-0.05, display+0.05) intervals, intersected with [0,100].',
            'These rounding conventions are explicit assumptions, not independently established agency tie-breaking rules.',
            'Within each county, the late-stage count table and share calculation use the same late numerator and diagnosis period.',
            'All configurations are mathematical possibilities; no true count pair or exclusion count is selected.'
        ],
        'published_share_rounding_difference_pp': _bounds(
            first_low-second_high, first_high-second_low,
            lower_attained=second_high_included, upper_attained=first_high_included),
        'same_all_case_denominator': same,
        'possible_denominator_exclusions': exclusions,
        'unknown_stage_sensitivity': {
            'scope': 'HYPOTHETICAL_SCENARIOS_NOT_MEASURED_COUNTY_MISSINGNESS',
            'required_starting_estimand': 'Observed late-stage cases divided by all cases including unknown stage.',
            'unknown_fraction_each_county': {'minimum': _rational(Fraction(0)), 'maximum': _rational(umax)},
            'denominator_removal': {
                'formula': 'p_known = p_all / (1-u), with p in percent and u=U/N.',
                'difference_pp_envelope': _bounds(
                    first_low-second_high/(1-umax), first_high/(1-umax)-second_low,
                    lower_attained=second_high_included, upper_attained=first_high_included)},
            'unknown_reclassification': {
                'formula': 'p_complete = p_all + 100*z*u, with p in percent, u=U/N and z in [0,1].',
                'difference_pp_envelope': _bounds(
                    first_low-second_high-100*umax, first_high+100*umax-second_low,
                    lower_attained=second_high_included, upper_attained=first_high_included)}},
        'exact_registry_counts_recovered': False,
        'registry_stage_comparability_established': False,
        'statistical_equivalence_established': False,
        'sampling_confidence_interval': None,
        'clinical_causal_effect': None,
    }


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
