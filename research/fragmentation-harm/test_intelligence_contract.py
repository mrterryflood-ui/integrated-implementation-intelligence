import pytest
from intelligence_contract import validate_evidence_event, validate_connection

def event():
    return dict(event_id="synthetic-1", source_id="published-aggregate", source_version="v1",
                source_extract_sha256="a"*64, construct_id="late-stage-incidence",
                denominator_definition="age-adjusted rate per 100000",
                event_time="2023-12-31T00:00:00+00:00",
                available_to_decision_time="2024-12-12T00:00:00+00:00",
                decision_time="2025-01-01T00:00:00+00:00",
                evidence_grade="supported")

def test_valid_event():
    assert validate_evidence_event(event())

def test_future_release_is_rejected():
    e=event();e["decision_time"]="2023-12-31T00:00:00+00:00"
    with pytest.raises(ValueError, match="future-information"):
        validate_evidence_event(e)

def test_missing_denominator_rejected():
    e=event();e["denominator_definition"]=""
    with pytest.raises(ValueError, match="denominator_definition"):
        validate_evidence_event(e)

def test_invalid_hash_rejected():
    e=event();e["source_extract_sha256"]="not-a-sha"
    with pytest.raises(ValueError, match="hash"):
        validate_evidence_event(e)

def test_timezone_required():
    e=event();e["event_time"]="2023-12-31"
    with pytest.raises(ValueError, match="timezone"):
        validate_evidence_event(e)

def test_hypothesis_edge():
    assert validate_connection(dict(edge_type="causal_hypothesis",source_id="doi:example",
                                    evidence_grade="hypothesis",disconfirmation_test="negative control"))

def test_causal_edge_requires_evidence():
    e=dict(edge_type="validated_causal_effect",source_id="doi:example",
           evidence_grade="verified",disconfirmation_test="negative control")
    with pytest.raises(ValueError,match="identification_design"):
        validate_connection(e)

def test_invalid_edge_type():
    with pytest.raises(ValueError,match="edge type"):
        validate_connection(dict(edge_type="proven_benefit"))
