"""Dependency-free receipt consistency gate. Not a test runner or authenticity oracle.

Only runner-collected, independently reviewed artifacts are suitable release inputs.
This validator is fail-closed on missing checks, bad hashes and revision mismatch.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

POLICY_ID = 'IRON-ENG-001'
POLICY_VERSION = '1.0.0'
CANDIDATE_DOMAINS = (
    'requirements', 'build_types', 'data_semantics', 'security_privacy',
    'persistence_migrations', 'end_to_end_workflow', 'resilience',
    'user_interface', 'independent_review', 'documentation_claims',
)
REV = re.compile(r'^[a-f0-9]{40}$')
DIGEST = re.compile(r'^[a-f0-9]{64}$')
STAGES = ('candidate', 'deployed')

def principal(value: Any) -> str | None:
    """Normalize supplied stable principal IDs; this does not authenticate them."""
    if not isinstance(value, str) or not value.strip() or len(value) > 200:
        return None
    normalized = unicodedata.normalize('NFKC', value).strip().casefold()
    if not normalized or any(unicodedata.category(c).startswith('C') for c in normalized):
        return None
    return ' '.join(normalized.split())

def timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    match = re.fullmatch(
        r'(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](\d{2}):(\d{2}))', value
    )
    if not match:
        return None
    # Explicit bounds preserve the contract across Python runtime versions.
    _, _, _, hour, minute, second, offset_hour, offset_minute = match.groups()
    if int(hour) > 23 or int(minute) > 59 or int(second) > 59:
        return None
    if (offset_hour is not None and int(offset_hour) > 23) or (offset_minute is not None and int(offset_minute) > 59):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
    except ValueError:
        return None

def validate(manifest: Any, root: Path, expected_revision: str, stage: str = 'candidate') -> list[str]:
    """Return failures; empty means consistent receipts, NOT independently proven reality."""
    errors: list[str] = []
    if stage not in STAGES or not REV.fullmatch(expected_revision or ''):
        return ['Invalid expected stage or full revision']
    if not isinstance(manifest, dict):
        return ['Receipt manifest must be an object']
    if manifest.get('policyId') != POLICY_ID or manifest.get('policyVersion') != POLICY_VERSION:
        errors.append('Exact policy ID/version required')
    if manifest.get('revision') != expected_revision:
        errors.append('Manifest revision does not match expected candidate')
    if manifest.get('stage') != stage:
        errors.append('Manifest stage does not match requested gate')
    builder = principal(manifest.get('builder'))
    if builder is None:
        errors.append('Builder identity required')
    requirements = manifest.get('requirements')
    if not isinstance(requirements, list) or not requirements or len(requirements) > 1000:
        errors.append('Bounded nonempty requirement list required')
        requirements = []
    ids: set[str] = set()
    for r in requirements:
        if not isinstance(r, dict):
            errors.append('Invalid requirement'); continue
        rid = r.get('id')
        if not isinstance(rid, str) or not rid.strip() or rid in ids:
            errors.append('Missing/duplicate requirement ID')
        else:
            ids.add(rid)
        if r.get('status') != 'accepted':
            errors.append(f'Requirement not accepted: {rid}')
        for key in ('implementation', 'tests'):
            values = r.get(key)
            if not isinstance(values, list) or not values or not all(isinstance(v, str) and v.strip() for v in values):
                errors.append(f'Requirement {rid} lacks {key} traceability')
    if manifest.get('unresolvedBlockers') != []:
        errors.append('Explicit empty unresolvedBlockers list required')
    gates = manifest.get('checks')
    if not isinstance(gates, dict):
        return errors + ['Checks object required']
    required = CANDIDATE_DOMAINS + (('deployment',) if stage == 'deployed' else ())
    root = root.resolve()
    for name in required:
        c = gates.get(name)
        if not isinstance(c, dict):
            errors.append(f'Missing check: {name}'); continue
        if c.get('revision') != expected_revision:
            errors.append(f'{name}: wrong revision')
        result = c.get('result')
        if result == 'not_applicable':
            if name in ('requirements', 'security_privacy', 'independent_review', 'documentation_claims', 'deployment'):
                errors.append(f'{name}: cannot be omitted')
            rationale = c.get('rationale')
            approver = principal(c.get('reviewedBy'))
            if not isinstance(rationale, str) or len(rationale.strip()) < 20:
                errors.append(f'{name}: substantive applicability rationale required')
            if approver is None or approver == builder:
                errors.append(f'{name}: distinct applicability reviewer required')
        elif result != 'passed':
            errors.append(f'{name}: check did not pass')
        if not timestamp(c.get('executedAt')):
            errors.append(f'{name}: timezone-aware valid execution time required')
        if not isinstance(c.get('command'), str) or not c['command'].strip():
            errors.append(f'{name}: execution/review method required')
        if c.get('mode') not in ('synthetic', 'live', 'static', 'manual'):
            errors.append(f'{name}: evidence mode required')
        artifacts = c.get('artifacts')
        if not isinstance(artifacts, list) or not artifacts or len(artifacts) > 100:
            errors.append(f'{name}: bounded artifact evidence required'); continue
        for a in artifacts:
            if not isinstance(a, dict):
                errors.append(f'{name}: invalid artifact'); continue
            raw, digest = a.get('path'), a.get('sha256')
            if not isinstance(raw, str) or not raw or not isinstance(digest, str) or not DIGEST.fullmatch(digest):
                errors.append(f'{name}: invalid artifact reference'); continue
            relative = Path(raw)
            if relative.is_absolute() or '..' in relative.parts:
                errors.append(f'{name}: unsafe artifact path'); continue
            file = root / relative
            try:
                if not file.resolve().is_relative_to(root) or any((root / Path(*relative.parts[:i])).is_symlink() for i in range(1, len(relative.parts) + 1)):
                    errors.append(f'{name}: symlink/outside-root artifact'); continue
                if not file.is_file() or file.stat().st_size > 25_000_000:
                    errors.append(f'{name}: missing/oversized artifact'); continue
                actual = hashlib.sha256(file.read_bytes()).hexdigest()
                if actual != digest:
                    errors.append(f'{name}: artifact hash mismatch')
            except (OSError, ValueError, RuntimeError):
                errors.append(f'{name}: unreadable artifact')
        if name == 'independent_review':
            reviewer = principal(c.get('reviewer'))
            if reviewer is None or reviewer == builder:
                errors.append('independent_review: distinct reviewer required')
            if c.get('criticalOpen') != 0 or isinstance(c.get('criticalOpen'), bool) or c.get('highOpen') != 0 or isinstance(c.get('highOpen'), bool):
                errors.append('independent_review: unresolved or unknown critical/high findings')
            if principal(c.get('provider')) in ('cursor', 'cursor bugbot', 'bugbot'):
                errors.append('independent_review: retired provider cannot satisfy new audit contract')
        if name == 'deployment':
            if c.get('mode') != 'live' or c.get('deployedRevision') != expected_revision:
                errors.append('deployment: live exact-revision evidence required')
            if not all(isinstance(c.get(k), str) and c[k].strip() for k in ('deploymentId', 'environment', 'healthProbe', 'behavioralProbe', 'rollbackReference')):
                errors.append('deployment: deployment/probe/rollback identities required')
    return errors

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('manifest', type=Path)
    p.add_argument('--artifacts', type=Path, required=True)
    p.add_argument('--revision', required=True)
    p.add_argument('--stage', choices=STAGES, default='candidate')
    args = p.parse_args()
    try:
        if args.manifest.stat().st_size > 2_000_000:
            raise ValueError('Manifest exceeds 2 MB')
        data = json.loads(args.manifest.read_text())
        failures = validate(data, args.artifacts, args.revision, args.stage)
    except (OSError, ValueError, TypeError) as e:
        failures = [f'Cannot validate manifest: {type(e).__name__}']
    print(json.dumps({'policy': POLICY_ID, 'stage': args.stage, 'revision': args.revision,
        'receiptConsistency': 'failed' if failures else 'passed', 'errors': failures,
        'authenticityIndependentlyEstablished': False,
        'boundary': 'Artifact consistency is not proof that tests ran, a service is deployed, or a mission outcome occurred.'}, indent=2))
    return 1 if failures else 0

if __name__ == '__main__':
    sys.exit(main())
