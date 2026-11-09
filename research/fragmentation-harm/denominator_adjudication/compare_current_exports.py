"""Compare current report exports with archived measurements, preserving chronology.

The current response is not an archived historical dictionary. This comparison
does not prove the contemporaneous availability of its definitions or boundaries.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from decimal import Decimal
from pathlib import Path
import re

import adjudicate_denominators as audit


def parse_export(raw, expected_state):
    text = raw.decode('utf-8-sig')
    if '2019-2023' not in text or 'All Races (includes Hispanic), Both Sexes, All Ages' not in text:
        raise ValueError('Unexpected report period or population')
    lines = list(csv.reader(io.StringIO(text)))
    headers = [i for i, line in enumerate(lines) if line[:2] == ['County', 'FIPS']]
    if len(headers) != 1:
        raise ValueError('Unexpected CSV header')
    table, fips_seen = {}, set()
    for cells in lines[headers[0] + 1:]:
        match = re.fullmatch(r'(.+ County)\((\d+)\)', cells[0]) if cells else None
        if not match:
            continue
        county, source_marker = match.groups()
        if len(cells) < 11 or county in table:
            raise ValueError('Malformed or duplicate county row')
        fips = cells[1].strip()
        if not re.fullmatch(expected_state + r'\d{3}', fips) or fips in fips_seen:
            raise ValueError('Unexpected or duplicate county FIPS')
        fips_seen.add(fips)
        rate = tuple(None if cells[i].strip() == '*' else Decimal(cells[i].strip()) for i in (3, 4, 5))
        count, count_state = audit.read_count(cells[9])
        table[county] = {'fips': fips, 'ruralurban': cells[2].strip(), 'source_marker': source_marker,
                         'rate': rate[0], 'lo': rate[1], 'hi': rate[2], 'annual_count': count,
                         'count_state': count_state, 'share_raw': cells[10].strip()}
    return table


def run(archive, sources, output):
    rows, provenance = audit.load_archive(archive)
    archive_rows = {(r['state'], r['county']): r for r in rows}
    receipts = {r['id']: r for r in json.loads((sources / 'export_and_standard_retrieval_receipt.json').read_text())}
    result, fips_rows, fips_registry, compared = {}, {}, {}, 0
    for stem, (state, stage) in audit.TABLES.items():
        receipt = receipts[stem + '_export']
        raw = (sources / receipt['path']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != receipt['sha256']:
            raise ValueError('Retrieved export digest mismatch')
        expected_state = {'MS': '28', 'TX': '48'}[state]
        table = parse_export(raw, expected_state)
        expected = {county for s, county in archive_rows if s == state}
        if table.keys() != expected:
            raise ValueError('Current and archived county frames differ')
        for county, current in table.items():
            old = archive_rows[(state, county)]
            if current['source_marker'] != {'MS': '2', 'TX': '7'}[state]:
                raise ValueError('Source marker changed')
            pairs = [(current['ruralurban'], old['ruralurban'])]
            pairs += [(current[field], old[stage + '_' + field]) for field in ('rate', 'lo', 'hi', 'annual_count')]
            if stage == 'late':
                share = None if current['share_raw'] == '*' else Decimal(current['share_raw'])
                pairs.append((share, old['share']))
            if any(a != b for a, b in pairs):
                raise ValueError('Current core measurement changed: ' + state + '/' + county + '/' + stage)
            compared += len(pairs)
            key = state, county
            if key in fips_rows and fips_rows[key]['fips'] != current['fips']:
                raise ValueError('FIPS differs across stage exports')
            if current['fips'] in fips_registry and fips_registry[current['fips']] != key:
                raise ValueError('FIPS has multiple county names')
            fips_registry[current['fips']] = key
            fips_rows[key] = {'state': state, 'county': county, 'fips': current['fips'],
                              'ruralurban_2023': current['ruralurban'],
                              'identity_source': 'CURRENT_REPORT_EXPORT_MATCHED_TO_ARCHIVED_PRINTED_MEASUREMENTS',
                              'historical_boundary_vintage_established': False}
        result[stem] = {'county_rows_matched': len(table), 'retrieval': receipt,
                        'historical_dictionary_availability_proven': False}
    report = {'schema': 'dis-current-report-alignment-v1', 'archived_source': provenance,
              'current_exports': result, 'core_measurement_cells_matched': compared,
              'county_identity_rows': len(fips_rows), 'rank_and_trend_cells_compared': False,
              'unknown_stage_membership_identified': False,
              'dco_autopsy_membership_identified': False,
              'historical_dictionary_availability_proven': False,
              'geographic_boundary_vintage_established': False,
              'claim': 'Current exports match all retained county core measurements; later retrieval is not historical availability proof.'}
    output.mkdir(parents=True, exist_ok=True)
    (output / 'current_report_alignment.json').write_text(json.dumps(report, indent=2) + '\n')
    with (output / 'current_export_county_identity.csv').open('w', newline='') as handle:
        ordered = [fips_rows[key] for key in sorted(fips_rows)]
        writer = csv.DictWriter(handle, fieldnames=list(ordered[0]))
        writer.writeheader()
        writer.writerows(ordered)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    parser.add_argument('--sources', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    report = run(args.archive, args.sources, args.out)
    print(json.dumps({key: report[key] for key in ('core_measurement_cells_matched', 'county_identity_rows',
                       'unknown_stage_membership_identified', 'historical_dictionary_availability_proven')}, indent=2))
