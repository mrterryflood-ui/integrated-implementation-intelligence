"""Deterministic invariants for decision-to-delivery authorization.
Does not certify source truth or scientific validity.
"""
from __future__ import annotations

def check_decision_artifact(decision: dict, artifact: dict) -> list[str]:
    faults = []
    scope = set(decision.get("approvedScope") or [])
    denied = set(decision.get("explicitlyDeniedScope") or [])
    actions = set(artifact.get("actions") or [])
    if actions - scope: faults.append("unapproved_scope")
    if actions & denied: faults.append("explicitly_denied")
    if any(a in actions for a in {"build", "release", "deploy", "send"}) and decision.get("approvalStatus") != "APPROVED":
        faults.append("execution_without_approval")
    for claim in artifact.get("claims") or []:
        if claim.get("epistemicState") == "OBSERVED" and not claim.get("sourceIds"):
            faults.append("observed_without_source")
        if claim.get("claimType") == "CAUSAL" and claim.get("mechanismTested") is not True:
            faults.append("causal_mechanism_unverified")
        if claim.get("claimType") == "REGULATORY_EXEMPTION" and not claim.get("scopedLegalBasis"):
            faults.append("unscoped_regulatory_exemption")
    if set(decision.get("materialDissentIds") or []) - set(artifact.get("preservedDissentIds") or []):
        faults.append("lost_dissent")
    return sorted(set(faults))
