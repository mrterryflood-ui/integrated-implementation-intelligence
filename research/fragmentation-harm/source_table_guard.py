"""Version-bound source-table admission, not scientific or reviewer authentication.

Load the expected hash from trusted application/review configuration, never from
an incoming claim. The manifest is a curated transcription, not publisher data.
No source, patient, reserve-case content or credentials are logged here.
"""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
from types import MappingProxyType
from typing import Mapping

SCHEMA = 'dis-rplice-bound-source-table-v1'
MAX_BYTES = 2_000_000


def _json_value(value: object, depth: int = 0) -> None:
    if depth > 64:
        raise ValueError('source context nesting exceeds limit')
    if value is None or type(value) in (str, bool, int):
        return
    if type(value) is float:
        if not math.isfinite(value):
            raise ValueError('source context needs finite JSON values')
        return
    if type(value) is list:
        for item in value:
            _json_value(item, depth + 1)
        return
    if type(value) is dict:
        if any(type(key) is not str for key in value):
            raise ValueError('source context keys must be strings')
        for item in value.values():
            _json_value(item, depth + 1)
        return
    raise ValueError('source context must use native JSON types')


def _canonical(value: object) -> str:
    _json_value(value)
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


def _index(records: object) -> dict[str, str]:
    if type(records) is not list or not records:
        raise ValueError('source table must be a nonempty list')
    index: dict[str, str] = {}
    for record in records:
        if type(record) is not dict:
            raise ValueError('each source must be a JSON object')
        source_id = record.get('id')
        if type(source_id) is not str or not source_id.strip():
            raise ValueError('each source needs a nonempty string id')
        if source_id in index:
            raise ValueError('duplicate source id')
        index[source_id] = _canonical(record)
    return index


def _unique_object(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON object key')
        result[key] = value
    return result


@dataclass(frozen=True)
class BoundSourceTable:
    version: str
    sha256: str
    canonical_sources: Mapping[str, str]


def load_bound_source_table(path: Path | str, expected_sha256: str) -> BoundSourceTable:
    """Read only the exact trusted manifest version; reject ambiguous JSON."""
    if (type(expected_sha256) is not str or len(expected_sha256) != 64
            or any(c not in '0123456789abcdef' for c in expected_sha256)):
        raise ValueError('trusted lowercase SHA256 required')
    with Path(path).open('rb') as handle:
        raw = handle.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError('source manifest exceeds size limit')
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expected_sha256:
        raise ValueError('trusted source manifest digest mismatch')
    try:
        value = json.loads(raw, object_pairs_hook=_unique_object)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError('invalid source manifest JSON') from exc
    if type(value) is not dict or value.get('schema') != SCHEMA:
        raise ValueError('source manifest schema mismatch')
    version = value.get('version')
    if type(version) is not str or not version.strip():
        raise ValueError('source manifest version required')
    _json_value(value)
    return BoundSourceTable(version, digest, MappingProxyType(_index(value.get('sources'))))


def require_bound_source_table(records: object, expected: BoundSourceTable) -> dict:
    """Require exact complete source identity/context; table order is immaterial."""
    if not isinstance(expected, BoundSourceTable):
        raise ValueError('trusted version-bound source table required')
    actual = _index(records)
    if actual.keys() != expected.canonical_sources.keys():
        raise ValueError('source identities differ from trusted manifest')
    if any(record != expected.canonical_sources[key] for key, record in actual.items()):
        raise ValueError('UNBOUND_SOURCE_CONTEXT')
    return {'sources_bound': len(actual), 'manifest_version': expected.version,
            'manifest_sha256': expected.sha256, 'scientific_acceptance_established': False}
