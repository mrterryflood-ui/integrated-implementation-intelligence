"""Bind a claim to a trusted, version-pinned publication transcription.

This is a change-detection guard, not scientific review or clinical authorization.
The caller must authenticate/version-pin the expected transcription separately.
Never treat an expected record supplied by the claimant as an independent source.
"""
from __future__ import annotations
import json
from collections.abc import Mapping


def require_bound_context(claim: Mapping, expected: Mapping) -> None:
    """Reject altered fields, added claims, non-JSON values and type substitutions."""
    if not isinstance(claim, Mapping) or not isinstance(expected, Mapping):
        raise ValueError('claim and expected context must be mappings')
    if not isinstance(expected.get('id'), str) or not expected['id'].strip():
        raise ValueError('trusted transcription needs a nonempty claim ID')
    try:
        left = json.dumps(dict(claim), sort_keys=True, separators=(',', ':'), allow_nan=False)
        right = json.dumps(dict(expected), sort_keys=True, separators=(',', ':'), allow_nan=False)
    except (TypeError, ValueError) as exc:
        raise ValueError('claim context must contain finite JSON values') from exc
    if left != right:
        raise ValueError('UNBOUND_SOURCE_CONTEXT:' + expected['id'])
