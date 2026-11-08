"""Minimal non-PHI evidence intelligence contract validator.

No storage, clinical decision engine, or patient-data integration is claimed.
"""
from datetime import datetime
from typing import Mapping

EVIDENCE_GRADES = {
    "verified", "supported", "inferred", "hypothesis", "contradicted", "unknown",
}
VALIDATED_CAUSAL_GRADES = {"verified", "supported"}

EDGE_TYPES = {
    "observed_association", "measurement_dependency", "operational_dependency",
    "causal_hypothesis", "validated_causal_effect", "policy_constraint",
    "transfer_hypothesis",
}

def _dt(s):
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if d.tzinfo is None:
            raise ValueError("timezone required")
        return d
    except (AttributeError, ValueError) as e:
        raise ValueError("invalid timestamp with timezone") from e

def validate_evidence_event(event: Mapping):
    required = ("event_id", "source_id", "source_version", "source_extract_sha256",
                "construct_id", "denominator_definition", "event_time",
                "available_to_decision_time", "decision_time", "evidence_grade")
    missing = [k for k in required if not event.get(k)]
    if missing:
        raise ValueError("missing evidence fields: " + ", ".join(missing))
    digest = event["source_extract_sha256"]
    if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("source hash must be lowercase sha256")
    event_t, available, decision = (_dt(event[k]) for k in
                                   ("event_time", "available_to_decision_time", "decision_time"))
    if event_t > available or available > decision:
        raise ValueError("future-information leakage or impossible availability sequence")
    if event["evidence_grade"] not in EVIDENCE_GRADES:
        raise ValueError("unrecognized evidence grade")
    return True

def validate_connection(edge: Mapping):
    if edge.get("edge_type") not in EDGE_TYPES:
        raise ValueError("edge type unrecognized")
    for key in ("source_id", "evidence_grade", "disconfirmation_test"):
        if not edge.get(key):
            raise ValueError("missing connection field: " + key)
    if edge["evidence_grade"] not in EVIDENCE_GRADES:
        raise ValueError("unrecognized evidence grade")
    if edge["edge_type"] == "validated_causal_effect":
        if edge["evidence_grade"] not in VALIDATED_CAUSAL_GRADES:
            raise ValueError("causal effect requires verified or supported evidence grade")
        for key in ("identification_design", "population", "effect_estimate",
                    "uncertainty", "time_window", "independent_review"):
            value = edge.get(key)
            if key == "effect_estimate" and value == 0 and not isinstance(value, bool):
                continue
            if not value:
                raise ValueError("causal effect missing validation: " + key)
    return True
