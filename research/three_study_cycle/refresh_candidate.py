#!/usr/bin/env python3
"""Audit a fresh source attempt without changing the accepted application baseline.

Unavailable originals yield an explicit no-candidate receipt. Integrity, revision,
scope and calculation failures remain errors; platform_snapshot stays strict.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from verify_retained import MANDATORY, assess, load_json

BASELINE = Path(__file__).resolve().parents[2] / 'apps/dis-platform/data/pilot-calibration-20261108.json'


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project(root: Path, output: Path) -> None:
    subprocess.run([
        sys.executable, str(Path(__file__).with_name('platform_snapshot.py')),
        '--input', str(root), '--output', str(output),
    ], check=True)


def run(root: Path, expected_revision: str, baseline: Path = BASELINE) -> dict:
    root = Path(root)
    output = root / 'platform-calibration-supplement.json'
    status_output = root / 'refresh_candidate_status.json'
    if any(path.exists() or path.is_symlink() for path in (output, status_output)):
        raise ValueError('Fresh candidate output already exists; preserve it and use a new cycle directory')
    receipt_path = root / 'acquisition_receipt.json'
    receipt = load_json(receipt_path)
    admission = assess(receipt, {}, root=root, expected_revision=expected_revision)
    if receipt.get('schema') != 'dis-three-study-original-cycle-v1':
        raise ValueError('Unexpected acquisition receipt schema')
    rows = receipt['sources']
    if {row['id'] for row in rows} != MANDATORY:
        raise ValueError('Acquisition receipt must record all ten requested source attempts')
    if any(row.get('status') not in ('ORIGINAL_BYTES_RETAINED', 'ACQUISITION_FAILED') for row in rows):
        raise ValueError('Unknown acquisition status')
    if any(row.get('status') == 'ACQUISITION_FAILED' and
           (not isinstance(row.get('error'), str) or not row['error'].strip()) for row in rows):
        raise ValueError('Failed acquisition must retain its error')
    if admission['integrity_rejected_source_ids']:
        raise ValueError('Retained source integrity failure: ' + ', '.join(admission['integrity_rejected_source_ids']))
    if admission['revision_binding']['state'] != 'MATCHES_DECLARED_EXPECTATION':
        raise ValueError('Acquisition producer revision does not match the checked-out revision')
    baseline_before = digest(baseline)
    failed = [
        {key: row[key] for key in ('id', 'url', 'http_status', 'error') if key in row}
        for row in rows if row['status'] == 'ACQUISITION_FAILED'
    ]
    result = {
        'schema': 'dis-source-refresh-candidate-v1',
        'recordedAt': datetime.now(timezone.utc).isoformat(),
        'producerRevision': receipt['revision'],
        'acquisitionReceiptSha256': digest(receipt_path),
        'requiredSources': len(MANDATORY),
        'byteAdmittedSources': admission['byte_checked_required_sources'],
        'failedSourceIds': sorted(row['id'] for row in failed),
        'acquisitionFailures': failed,
        'baselineSha256Before': baseline_before,
        'baselineWriteAttempted': False,
        'scientificReleaseAuthorized': False,
    }
    if failed:
        result.update(state='NO_REFRESH_CANDIDATE', reason='SOURCE_ADMISSION_INCOMPLETE', projectionCreated=False)
    else:
        # Do not catch projection errors: its original-source, scope, numerical,
        # provenance and capacity checks must still fail this workflow.
        project(root, output)
        if not output.is_file():
            raise ValueError('Projection returned without creating a candidate')
        result.update(state='REFRESH_CANDIDATE_CREATED', reason='ALL_ORIGINALS_ADMITTED_AND_PROJECTED',
                      projectionCreated=True, projectionSha256=digest(output))
    result['baselineSha256After'] = digest(baseline)
    if result['baselineSha256After'] != baseline_before:
        raise ValueError('Accepted baseline changed during refresh attempt')
    status_output.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--expected-revision', required=True)
    args = parser.parse_args()
    print(json.dumps(run(args.input, args.expected_revision), allow_nan=False))


if __name__ == '__main__':
    main()
