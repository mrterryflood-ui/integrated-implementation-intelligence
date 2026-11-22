"""Replay retained CRC county sources and bounded descriptive calculations.

The small ZIP is a derived, byte-preserving subset, not the original full archive.
Checks run offline against pinned public aggregate sources. No synthetic positive
source, inferred exact stage count, or scientific-equivalence acceptance is used.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import sys
import zipfile
from fractions import Fraction
from html import unescape
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from denominator_age_sensitivity import (
    ARCHIVE_SHA256, CHECKOUT_SHA, TableRows, bounded_share_comparison,
    canonical_cell, provenance_state, require,
)

ROOT = Path(__file__).resolve().parent / 'source_reconciliation'
DEFAULT_ARCHIVE = ROOT / 'retained_crc_county_sources.zip'
DEFAULT_RESULTS = ROOT / 'results.json'
DERIVED_ZIP_SHA256 = '39b339425f7bbba4dac5e4278d8ae43dd289b4fd74a9e3eec2d41ccae8578e66'
CDC_ROWS_SHA256 = '8305e091c852676b7126b0c1207825719bbc21470beebd821aec9965693e4e74'
CDC_RECEIPT_SHA256 = '61564d5c0f4ddc149c862adb1232deab05f825a55d29f0f042a89d6576885091'
CDC_ZIP_SHA256 = '291765c997e59cddc7bc9bdd5852ea18f52696a58e2c212f5eb6b72c680b6df7'
SOURCE_HASHES = {
    'originals/hinds_all.html': '83484db2208ea5914aa588e19118ca150645d69fba35316aa9688198ce2f1aa6',
    'originals/hinds_late.html': '130843a055b089fb0471ab559fb214ee3b7efda90b18f94727ef8e09d64226ca',
    'originals/harris_all.html': 'aec6d2b4d7e9c7ac7ddbf2a30c7d700286ac6eab4e8a0ff88ca4a1c983feb456',
    'originals/harris_late.html': 'a04b3b49759d680ccd4bb508e5bd68713e1a6516bb9c8c951c5c21a623522af3',
    'extracted/hinds_all_table_0.csv': '795efc6a7a1583d5c772a52e9217fa6bf2c2615e110458b420595b52e2cdde1d',
    'extracted/hinds_late_table_0.csv': 'fb4e76663a9081ccbe7e8bbbd72d743c615cdf96aa33068ad4af64503d3d1456',
    'extracted/harris_all_table_0.csv': '97e1e3e0f87c31db81682c2d789dc642cce4c3f870b07778ca9d3050e0431d33',
    'extracted/harris_late_table_0.csv': '1d1f4822473e05c0a9b73c354bcddb8721a389cfe856f9b946fb95516e597453',
}
COUNTIES = {
    'hinds': {'county': 'Hinds County', 'state': 'Mississippi', 'state_fips': '28', 'marker': '2', 'county_count': 82},
    'harris': {'county': 'Harris County', 'state': 'Texas', 'state_fips': '48', 'marker': '7', 'county_count': 254},
}
STEMS = ('hinds_all', 'hinds_late', 'harris_all', 'harris_late')


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _cell(value: str) -> str:
    return re.sub(r'\s*([()])\s*', r'\1', canonical_cell(unescape(value)))


def parse_county_table(stem: str, html: bytes, extracted_csv: bytes) -> dict:
    """Compare every table cell, then extract the explicitly scoped county row."""
    require(stem in STEMS, 'Unknown source table')
    county_key, stage = stem.split('_')
    spec = COUNTIES[county_key]
    stage_name = 'All Stages' if stage == 'all' else 'Late Stage'
    source = html.decode('utf-8')
    text = ' '.join(unescape(re.sub(r'<[^>]+>', ' ', source)).split())
    scope = (f"Incidence Rate Report for {spec['state']} by County Colon & Rectum ({stage_name}^), 2019-2023 "
             'All Races (includes Hispanic), Both Sexes, All Ages')
    require(text.count(scope) == 1, 'Source report scope differs: ' + stem)
    rows = list(csv.reader(io.StringIO(extracted_csv.decode('utf-8-sig'))))
    parser = TableRows()
    parser.feed(source)
    normalized = lambda table: [[_cell(cell) for cell in row] for row in table]
    csv_cells, html_cells = normalized(rows), normalized(parser.rows)
    reference_names = {spec['state'] + ' ' + spec['marker'], 'US (SEER+NPCR) 1'}
    reference_na_cells = 0
    # The archived extraction renders these nonmeasurement N/A cells as blank.
    # Do not apply this rule to county rows, suppression tokens, counts or rates.
    for row_index, (csv_row, html_row) in enumerate(zip(csv_cells[1:], html_cells[1:]), start=1):
        if csv_row and html_row and canonical_cell(rows[row_index][0]) in reference_names:
            for column in (1, 3):
                if len(csv_row) > column and len(html_row) > column and csv_row[column] == '' and html_row[column] == 'N/A':
                    csv_row[column] = 'N/A'
                    reference_na_cells += 1
    require(csv_cells == html_cells, 'HTML/CSV table cells differ: ' + stem)
    require(len(rows) == spec['county_count'] + 3, 'Unexpected county table coverage: ' + stem)
    header, data = rows[0], rows[1:]
    require(len(header) == (7 if stage == 'all' else 6) and len(set(header)) == len(header),
            'Ambiguous table headers: ' + stem)
    require(all(len(row) == len(header) for row in data), 'Malformed table row: ' + stem)
    identities = [canonical_cell(row[0]) for row in data]
    require(len(set(identities)) == len(identities), 'Duplicate table identity: ' + stem)
    county_rows = [row for row in data if re.fullmatch(r'.+ County ' + spec['marker'], canonical_cell(row[0]))]
    require(len(county_rows) == spec['county_count'], 'County/source-marker frame differs: ' + stem)
    require(set(identities) - {canonical_cell(row[0]) for row in county_rows} ==
            {spec['state'] + ' ' + spec['marker'], 'US (SEER+NPCR) 1'}, 'Unexpected reference geography: ' + stem)
    target = spec['county'] + ' ' + spec['marker']
    matches = [row for row in data if canonical_cell(row[0]) == target]
    require(len(matches) == 1, 'Target county/source marker missing or duplicated: ' + stem)
    row = dict(zip(header, matches[0]))
    rate_keys = [key for key in header if key.startswith('Age-Adjusted Incidence Rate')]
    require(len(rate_keys) == 1 and 'Average Annual Count' in row, 'Rate/count headers missing: ' + stem)
    rate_match = re.fullmatch(r'([0-9.]+)\s*\(\s*([0-9.]+),\s*([0-9.]+)\s*\)', row[rate_keys[0]])
    require(rate_match is not None, 'Target rate or confidence interval malformed: ' + stem)
    rate, lower, upper = map(float, rate_match.groups())
    require(0 <= lower <= rate <= upper, 'Target rate interval invalid: ' + stem)
    count = int(row['Average Annual Count'].replace(',', ''))
    require(count >= 16, 'Target annual count outside the bounded-analysis scope: ' + stem)
    observation = {'county': spec['county'], 'state': spec['state'], 'source_marker': spec['marker'],
                   'stage': stage_name, 'period': '2019-2023', 'race': 'All Races (includes Hispanic)',
                   'sex': 'Both Sexes', 'age': 'All Ages', 'site': 'Colon & Rectum',
                   'annual_age_adjusted_incidence_per_100000': rate,
                   'source_reported_rate_95pct_ci': [lower, upper], 'average_annual_count': count,
                   'average_annual_count_is_unrounded_period_count': False}
    if stage == 'late':
        share = row['Percent of Cases with Late Stage']
        require(0 <= Fraction(share) <= 100, 'Target published share invalid: ' + stem)
        observation['published_late_stage_share_percent'] = share
    return {'observation': observation, 'data_rows_compared': len(data),
            'county_rows_compared': len(county_rows), 'data_cells_compared': sum(map(len, data)),
            'county_cells_compared': sum(map(len, county_rows)), 'header_cells_compared': len(header),
            'reference_na_cells_normalized': reference_na_cells}


def load_retained_sources(path: Path) -> tuple[dict, dict]:
    raw = Path(path).read_bytes()
    require(sha256(raw) == DERIVED_ZIP_SHA256, 'Derived CRC package SHA-256 mismatch')
    metadata_names = {'DERIVATION.json', 'MANIFEST_SHA256.json',
                      'provenance/full_archive_MANIFEST_SHA256.json',
                      'provenance/full_archive_acquisition_receipt.json'}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)) and set(names) == set(SOURCE_HASHES) | metadata_names,
                'Derived package has missing, duplicate, or unexpected members')
        manifest = json.loads(archive.read('MANIFEST_SHA256.json'))
        require(isinstance(manifest, dict) and set(manifest) == set(names) - {'MANIFEST_SHA256.json'},
                'Derived manifest coverage differs')
        for name, expected in manifest.items():
            require(sha256(archive.read(name)) == expected, 'Derived manifest hash mismatch: ' + name)
        derivation = json.loads(archive.read('DERIVATION.json'))
        require(derivation['package_kind'] == 'DERIVED_COUNTY_ONLY_SUBSET_NOT_ORIGINAL_WHOLE_ARCHIVE' and
                derivation['parent_archive']['sha256'] == ARCHIVE_SHA256 and
                set(derivation['selected_source_paths']) == set(SOURCE_HASHES), 'Derived-parent binding differs')
        original_manifest = json.loads(archive.read('provenance/full_archive_MANIFEST_SHA256.json'))
        receipt_bytes = archive.read('provenance/full_archive_acquisition_receipt.json')
        require(sha256(receipt_bytes) == original_manifest['acquisition_receipt.json'], 'Original receipt binding differs')
        receipt = json.loads(receipt_bytes)
        sources = {source['id']: source for source in receipt['sources']}
        for name, expected in SOURCE_HASHES.items():
            require(original_manifest.get(name) == expected and sha256(archive.read(name)) == expected,
                    'Pinned original source hash mismatch: ' + name)
        tables = {}
        for stem in STEMS:
            county_key, stage = stem.split('_')
            spec, source = COUNTIES[county_key], sources[stem]
            html_name, csv_name = 'originals/' + stem + '.html', 'extracted/' + stem + '_table_0.csv'
            require(source['status'] == 'ORIGINAL_BYTES_RETAINED' and source['sha256'] == SOURCE_HASHES[html_name],
                    'Original acquisition source differs: ' + stem)
            url = urlsplit(source['final_url'])
            query = parse_qs(url.query)
            expected_query = {'areatype': 'county', 'cancer': '020', 'race': '00', 'sex': '0', 'age': '001',
                              'statefips': spec['state_fips'], 'stage': '999' if stage == 'all' else '211', 'year': '0'}
            require(url.scheme == 'https' and url.netloc == 'statecancerprofiles.cancer.gov' and
                    all(query.get(key) == [value] for key, value in expected_query.items()),
                    'Original source query scope differs: ' + stem)
            tables[stem] = parse_county_table(stem, archive.read(html_name), archive.read(csv_name))
        verification = {
            'derived_package_sha256': DERIVED_ZIP_SHA256, 'derived_package_bytes': len(raw),
            'package_kind': derivation['package_kind'], 'package_entries_verified': len(names),
            'derived_manifest_entries_verified': len(manifest), 'selected_original_source_hashes': SOURCE_HASHES,
            'selected_original_entries_verified': len(SOURCE_HASHES),
            'parent_original_archive_sha256': ARCHIVE_SHA256,
            'parent_original_archive_replayed_by_this_consumer': False,
            'original_acquisition_revision': receipt['revision'], 'reported_workflow_head': CHECKOUT_SHA,
            'revision_binding_state': provenance_state(receipt['revision'], CHECKOUT_SHA, CHECKOUT_SHA),
            'tables_compared': len(tables),
            'all_table_data_cells_compared': sum(t['data_cells_compared'] for t in tables.values()),
            'county_data_cells_compared': sum(t['county_cells_compared'] for t in tables.values()),
            'county_rows_compared_across_all_and_late_tables': sum(t['county_rows_compared'] for t in tables.values()),
            'reference_na_cells_normalized': sum(t['reference_na_cells_normalized'] for t in tables.values()),
            'normalization_scope': 'Whitespace, HTML entities and thousands separators; CSV blank versus HTML N/A only in state/U.S. rural-urban and CI*Rank reference cells. No county suppression or zero normalization.',
            'distinct_counties': sum(spec['county_count'] for spec in COUNTIES.values()),
            'scope': 'Pinned subset source integrity and table reproduction; no stage-equivalence authentication.',
        }
    return tables, verification


def verify_cdc_original_archive(path: Path, expected_rows: list[dict]) -> None:
    """Stream the official public county table and reproduce the two exact rows."""
    with Path(path).open('rb') as handle:
        require(hashlib.file_digest(handle, 'sha256').hexdigest() == CDC_ZIP_SHA256,
                'Original CDC ZIP SHA-256 mismatch')
    selected = []
    expected_by_identity = {(row['STATE'], row['AREA']): row for row in expected_rows}
    scope_fields = ('EVENT_TYPE', 'RACE', 'SEX', 'SITE', 'YEAR')
    with zipfile.ZipFile(path) as archive:
        require(archive.namelist().count('BYAREA_COUNTY.TXT') == 1, 'Original CDC county member missing or duplicated')
        with archive.open('BYAREA_COUNTY.TXT') as handle:
            reader = csv.DictReader(io.TextIOWrapper(handle, encoding='utf-8-sig'), delimiter='|')
            require(reader.fieldnames is not None and len(set(reader.fieldnames)) == len(reader.fieldnames) and
                    set(reader.fieldnames) == set(expected_rows[0]), 'Original CDC county schema differs')
            for row in reader:
                expected = expected_by_identity.get((row['STATE'], row['AREA']))
                if expected is not None and all(row[key] == expected[key] for key in scope_fields):
                    selected.append(row)
    require(len(selected) == 2 and all(row in selected for row in expected_rows),
            'Original CDC selection does not reproduce retained county rows exactly')


def load_cdc_comparison(rows_path: Path, receipt_path: Path, original_archive=None) -> dict:
    rows_bytes, receipt_bytes = Path(rows_path).read_bytes(), Path(receipt_path).read_bytes()
    require(sha256(rows_bytes) == CDC_ROWS_SHA256, 'CDC extracted rows SHA-256 mismatch')
    require(sha256(receipt_bytes) == CDC_RECEIPT_SHA256, 'CDC download receipt SHA-256 mismatch')
    extract, receipt = json.loads(rows_bytes), json.loads(receipt_bytes)
    require(receipt['sha256'] == CDC_ZIP_SHA256 and receipt['status'] == 200 and
            extract['source_file'] == 'BYAREA_COUNTY.TXT' and
            extract['stage_specific_counts_available_in_table'] is False and
            extract['same_original_scp_case_universe_established'] is False, 'CDC source scope differs')
    expected = [('MS', 'MS: Hinds County (28049)'), ('TX', 'TX: Harris County (48201)')]
    rows = extract['rows']
    require(len(rows) == 2 and [(r['STATE'], r['AREA']) for r in rows] == expected, 'CDC county identities differ')
    scope = {'EVENT_TYPE': 'Incidence', 'RACE': 'All Races', 'SEX': 'Male and Female',
             'SITE': 'Colon and Rectum', 'YEAR': '2019-2023'}
    require(all(all(row.get(key) == value for key, value in scope.items()) for row in rows), 'CDC cohort scope differs')
    if original_archive is not None:
        verify_cdc_original_archive(original_archive, rows)
    rates = [Fraction(row['AGE_ADJUSTED_RATE']) for row in rows]
    require(all(rate > 0 for rate in rates), 'CDC incidence rates must be positive')
    counts, populations = [int(row['COUNT']) for row in rows], [int(row['POPULATION']) for row in rows]
    require(all(count > 0 for count in counts) and all(population > 0 for population in populations),
            'CDC count/population denominators must be positive')
    crude_rates = [100000 * Fraction(count, population) for count, population in zip(counts, populations)]
    return {'scope': 'SEPARATE_COMMON_USCS_ALL_STAGE_DESCRIPTIVE_COMPARISON',
            'source_url': receipt['url'], 'source_zip_sha256': CDC_ZIP_SHA256,
            'retained_extract_sha256': CDC_ROWS_SHA256, 'retained_receipt_sha256': CDC_RECEIPT_SHA256,
            'source_member': extract['source_file'], 'rows': rows,
            'age_standard': '2000 U.S. standard population, 19 age groups',
            'age_standard_reference': {
                'url': 'https://www.cdc.gov/united-states-cancer-statistics/technical-notes/pdf/uscs-data-visualizations-tool-technical-notes-2023-june-508-final.pdf',
                'physical_page': 16},
            'reproduction': 'Default replay verifies the pinned compact extract and download receipt; optional --cdc-archive verifies the full original ZIP and streams the county table. Execution mode is recorded by the command receipt, not inferred from this deterministic result.',
            'basis': 'Difference and ratio of published USCS age-adjusted rates; no age-specific rate re-estimation.',
            'difference_direction': 'Hinds_minus_Harris',
            'all_stage_rate_difference_per_100000': float(rates[0]-rates[1]),
            'all_stage_rate_ratio_Hinds_over_Harris': float(rates[0]/rates[1]),
            'crude_all_stage_incidence': {
                'formula': '100000 * period incidence COUNT / supplied pooled-period POPULATION',
                'denominator_scope': 'The supplied 2019-2023 pooled population denominator is used as a person-year approximation, not a count of unique residents. It already spans the five-year period; do not divide the rate by five again.',
                'rows': [{'county': row['AREA'], 'period_incident_cancers': count,
                          'pooled_population_denominator': population,
                          'crude_annual_rate_per_100000': float(rate)}
                         for row, count, population, rate in zip(rows, counts, populations, crude_rates)],
                'rate_difference_per_100000': float(crude_rates[0]-crude_rates[1]),
                'rate_ratio_Hinds_over_Harris': float(crude_rates[0]/crude_rates[1]),
                'age_standardized': False, 'confidence_intervals_recalculated': False,
                'scope': 'Separate crude all-stage estimand; neither an age-specific re-estimation nor a stage-comparability result.'},
            'counts_are_incident_cancers_not_unique_people': True,
            'original_scp_case_universe_correspondence_established': False,
            'county_stage_counts_recovered': False, 'harmonized_late_stage_comparison_established': False}


def reconcile_sources(archive=DEFAULT_ARCHIVE, cdc_rows=ROOT / 'uscs_exact_allstage_county_rows.json',
                      cdc_receipt=ROOT / 'cdc_data_download_receipt.json', *, cdc_archive=None) -> dict:
    tables, verification = load_retained_sources(archive)
    observations = {stem: table['observation'] for stem, table in tables.items()}
    h_all, h_late = observations['hinds_all'], observations['hinds_late']
    r_all, r_late = observations['harris_all'], observations['harris_late']
    bounded = bounded_share_comparison(h_all['average_annual_count'], h_late['average_annual_count'],
                                       h_late['published_late_stage_share_percent'],
                                       r_all['average_annual_count'], r_late['average_annual_count'],
                                       r_late['published_late_stage_share_percent'])
    bounded['unknown_stage_sensitivity']['uncertainty_basis'] = (
        'Published-percentage rounding intervals plus independently chosen unknown-stage fractions; '
        'these envelopes are separate from, and not jointly sharpened by, the finite count configurations.')
    method_files = ('stage_selection_crosswalk.json', 'evidence_manifest.json', 'evidence_excerpts.json')
    method_bytes = {name: (ROOT / name).read_bytes() for name in method_files}
    method_hashes = {name: sha256(raw) for name, raw in method_bytes.items()}
    crosswalk = json.loads(method_bytes['stage_selection_crosswalk.json'])
    return {'schema': 'dis-crc-retained-source-reconciliation-v1',
            'source_verification': verification, 'published_observations': observations,
            'documented_methods': {
                'file_sha256': method_hashes, 'crosswalk_declared_status': crosswalk['status'],
                'category_crosswalk_executed_on_county_stage_counts': False,
                'scope': 'Binds the documented specification and evidence excerpts to this result; the aggregate inputs contain no category-level stage counts for executing that crosswalk.'},
            'bounded_late_stage_share_analysis': bounded,
            'separate_cdc_all_stage_comparison': load_cdc_comparison(cdc_rows, cdc_receipt, cdc_archive),
            'disposition': {
                'retained_source_replay': 'COMPLETED', 'bounded_arithmetic': 'COMPLETED_UNDER_EXPLICIT_ASSUMPTIONS',
                'harmonized_stage_comparison': 'NOT_ESTABLISHED', 'exact_original_stage_counts': 'NOT_RECOVERED',
                'registry_denominator_membership': 'NOT_IDENTIFIED', 'statistical_equivalence': 'NOT_ESTABLISHED',
                'clinical_causal_effect': 'NOT_ESTABLISHED',
                'claim_scope': 'Published descriptive context and conditional bounds; no harmonized-stage, equivalent-performance, or causal claim.',
                'bounds_are_sampling_confidence_intervals': False}}


def render_results(result: dict) -> str:
    return json.dumps(result, indent=2, sort_keys=True, allow_nan=False) + '\n'


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', nargs='?', type=Path, default=DEFAULT_ARCHIVE)
    parser.add_argument('--cdc-archive', type=Path, help='Also verify and stream the original CDC public-data ZIP')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--output', type=Path, help='Write deterministic result JSON')
    mode.add_argument('--check', nargs='?', const=DEFAULT_RESULTS, type=Path, metavar='RESULTS_JSON',
                      help='Compare with existing result bytes; defaults to source_reconciliation/results.json')
    args = parser.parse_args(argv)
    try:
        rendered = render_results(reconcile_sources(args.archive, cdc_archive=args.cdc_archive))
        if args.cdc_archive is not None:
            print('CDC_ORIGINAL_MATCH: original public ZIP and both selected county rows verified', file=sys.stderr)
        if args.check is not None:
            require(args.check.read_text(encoding='utf-8') == rendered, 'Existing results do not match deterministic source replay')
            print('MATCH: retained source replay and bounded results match; stage comparability remains unestablished')
        elif args.output is not None:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(rendered, encoding='utf-8')
            print('WROTE:', args.output)
        else:
            print(rendered, end='')
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        print('FAIL:', error, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
