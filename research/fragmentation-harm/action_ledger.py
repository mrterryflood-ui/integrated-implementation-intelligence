"""Research evidence-to-action ledger. No PHI, network, or clinical recommendations.

Append-only event validation, explicit missingness, evidence provenance and action gates.
This module validates records; it does not execute clinical interventions.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any
import hashlib
import json

EVENTS = ("signal_detected", "comparability_reviewed", "evidence_corrobated",
          "owner_assigned", "action_authorized", "action_recorded",
          "outcome_observed", "case_closed")
# Historical misspelling in event names is not acceptable: use canonical form.
EVENTS = tuple("evidence_corroborated" if e == "evidence_corrobated" else e for e in EVENTS)
STATUS = {"PASS", "CONDITIONAL", "FAIL", "UNKNOWN"}
DECISIONS = {"proceed", "monitor", "defer", "reject"}
OUTCOMES = {"resolved", "unresolved", "unknown"}
REQUIRED = {"case_id", "event_id", "event_type", "occurred_at", "recorded_at",
            "actor_role", "evidence_refs", "source_type", "data_classification"}
SENSITIVE = {"name", "dob", "birth_date", "ssn", "email", "phone", "patient_id",
             "medical_record_number", "address", "free_text", "raw_note"}

def parse_time(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError("timestamp must be a string")
    d = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if d.tzinfo is None or d.utcoffset() is None:
        raise ValueError("timestamp must include a timezone")
    return d.astimezone(timezone.utc)

def validate(events: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    if not isinstance(events, list) or not events:
        return ["events must be a nonempty list"]
    seen_ids: set[str] = set()
    last_type: dict[str, int] = {}
    last_time: dict[str, datetime] = {}
    case_gates: dict[str, dict[str, bool]] = {}
    for n, e in enumerate(events):
        p = f"events[{n}]"
        if not isinstance(e, dict):
            errors.append(f"{p}: not an object")
            continue
        missing = REQUIRED - e.keys()
        if missing:
            errors.append(f"{p}: missing {sorted(missing)}")
            continue
        if SENSITIVE.intersection(e):
            errors.append(f"{p}: potentially identifying fields forbidden")
        if e["data_classification"] != "non_patient_research":
            errors.append(f"{p}: this ledger accepts non-patient research only")
        cid, eid, kind = e["case_id"], e["event_id"], e["event_type"]
        if not isinstance(cid, str) or not cid or not isinstance(eid, str) or not eid:
            errors.append(f"{p}: invalid identifiers")
            continue
        if eid in seen_ids:
            errors.append(f"{p}: duplicate event_id")
        seen_ids.add(eid)
        if kind not in EVENTS:
            errors.append(f"{p}: unknown event_type")
            continue
        if not isinstance(e["actor_role"], str) or not e["actor_role"].strip():
            errors.append(f"{p}: actor_role required")
        if not isinstance(e["evidence_refs"], list) or not all(
            isinstance(v, str) and v.strip() for v in e["evidence_refs"]
        ):
            errors.append(f"{p}: evidence_refs must be list of nonblank references")
        if not isinstance(e["source_type"], str) or not e["source_type"].strip():
            errors.append(f"{p}: source_type required")
        try:
            occurred, recorded = parse_time(e["occurred_at"]), parse_time(e["recorded_at"])
            if recorded < occurred:
                errors.append(f"{p}: recorded_at precedes occurred_at")
            if cid in last_time and occurred < last_time[cid]:
                errors.append(f"{p}: out-of-order case event time")
            last_time[cid] = occurred
        except (ValueError, TypeError, OverflowError):
            errors.append(f"{p}: invalid timezone-aware timestamp")
        idx = EVENTS.index(kind)
        if cid in last_type and idx <= last_type[cid]:
            errors.append(f"{p}: duplicate or regressing case stage")
        last_type[cid] = idx
        gates = case_gates.setdefault(cid, {"comparison": False, "owner": False, "authorization": False})
        if kind == "comparability_reviewed":
            if e.get("comparison_status") not in STATUS:
                errors.append(f"{p}: missing/invalid comparison_status")
            gates["comparison"] = e.get("comparison_status") == "PASS"
        if kind == "owner_assigned":
            if not e.get("decision_owner_role"):
                errors.append(f"{p}: accountable decision owner role required")
            else:
                gates["owner"] = True
        if kind == "action_authorized":
            if not gates["comparison"] or not gates["owner"]:
                errors.append(f"{p}: action authorization requires PASS comparability and assigned owner")
            if e.get("decision") not in DECISIONS:
                errors.append(f"{p}: explicit decision required")
            if e.get("human_approved") is not True:
                errors.append(f"{p}: explicit human approval required")
            gates["authorization"] = e.get("human_approved") is True
        if kind == "action_recorded" and not gates["authorization"]:
            errors.append(f"{p}: action recorded without prior authorization")
        if kind == "outcome_observed" and e.get("outcome_status") not in OUTCOMES:
            errors.append(f"{p}: outcome_status required; unknown is allowed")
        if kind == "case_closed" and e.get("closure_basis") not in {"completed", "no_action", "insufficient_evidence"}:
            errors.append(f"{p}: closure_basis required")
    return errors

def canonical_receipt(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Deterministic SHA-256 receipt, only after structural validation."""
    errors = validate(events)
    if errors:
        raise ValueError("; ".join(errors))
    data = json.dumps(events, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return {"schema_version": "0.1", "event_count": len(events),
            "sha256": hashlib.sha256(data.encode("utf-8")).hexdigest(),
            "contains_patient_data": False}

def case_summary(events: list[dict[str, Any]], case_id: str) -> dict[str, Any]:
    """Nonclinical process summary. Missing events are explicitly unknown."""
    errors = validate(events)
    if errors:
        raise ValueError("; ".join(errors))
    selected = [e for e in events if e["case_id"] == case_id]
    if not selected:
        raise ValueError("case not found")
    by_type = {e["event_type"]: e for e in selected}
    def interval(a: str, b: str) -> float | None:
        if a not in by_type or b not in by_type:
            return None
        return round((parse_time(by_type[b]["occurred_at"]) -
                      parse_time(by_type[a]["occurred_at"])).total_seconds() / 3600, 3)
    return {"case_id": case_id, "last_stage": selected[-1]["event_type"],
            "signal_to_action_hours": interval("signal_detected", "action_recorded"),
            "signal_to_authorization_hours": interval("signal_detected", "action_authorized"),
            "outcome": by_type.get("outcome_observed", {}).get("outcome_status", "unknown"),
            "causal_harm_established": False}
