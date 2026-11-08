"""Guardrail: evidence about process interventions cannot be silently pooled as a common effect.

This is a literature claim/transport contract, not an estimator of patient benefit.
"""
from dataclasses import dataclass
from math import isfinite

@dataclass(frozen=True)
class InterventionEvidence:
    source: str
    design: str
    setting: str
    population: str
    trigger: str
    intervention: str
    comparator: str
    outcome: str
    followup_months: int
    effect_pp: float
    lower_pp: float | None
    upper_pp: float | None

def validate_trial(t: InterventionEvidence) -> bool:
    if any(not getattr(t, k).strip() for k in ('source','design','setting','population','trigger','intervention','comparator','outcome')):
        raise ValueError('missing trial identity or construct')
    if t.followup_months <= 0:
        raise ValueError('invalid follow-up')
    if not isfinite(t.effect_pp):
        raise ValueError('effect must be finite')
    if (t.lower_pp is None) != (t.upper_pp is None):
        raise ValueError('incomplete interval')
    if t.lower_pp is not None and (not all(map(isfinite,(t.lower_pp,t.upper_pp))) or not t.lower_pp <= t.effect_pp <= t.upper_pp):
        raise ValueError('invalid interval')
    return True

def compatibility(a: InterventionEvidence,b: InterventionEvidence) -> dict:
    validate_trial(a);validate_trial(b)
    fields=('design','setting','population','trigger','intervention','comparator','outcome','followup_months')
    differences=[f for f in fields if getattr(a,f)!=getattr(b,f)]
    return {'status':'NOT_DIRECTLY_POOLABLE' if differences else 'DESCRIPTORS_MATCH_NOT_META_ANALYSIS',
            'differences':differences,'causal_transfer_established':False}

# Original-study contrasts, no derived clinical claim.
PRECISE=InterventionEvidence('doi:10.7326/ANNALS-24-01885','individual_randomized','Washington FQHC',
    'adults 50-75 abnormal FIT','positive FIT','bilingual telephone navigation','usual care',
    'colonoscopy completion within 12 months',12,13.0,6.5,19.4)
NC_FQHC=InterventionEvidence('PMID:41639370','RCT_positive_FIT_subanalysis','North Carolina FQHC',
    '89 positive FIT subgroup','positive FIT','centralized navigation','usual care',
    'colonoscopy completion within 12 months',12,30.3,None,None)
INTEGRATED=InterventionEvidence('PMID:34583969','individual_randomized','integrated health system',
    'adults 50-75 abnormal FIT and <=70% predicted adherence','positive FIT',
    'targeted navigation','usual care','colonoscopy completion within 6 months',6,11.0,None,None)
