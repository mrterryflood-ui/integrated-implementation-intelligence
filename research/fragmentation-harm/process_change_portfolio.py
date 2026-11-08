"""Evidence-to-process-change analysis contract for DIS/RPLICE.

Research-only. No patient triage, no clinical recommendation, no causal estimate.
Every candidate change requires a comparator, mechanism, and falsification test.
"""
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass(frozen=True)
class ProcessChange:
    id: str
    condition: str
    context: str
    first_signal: str
    source_url: str
    source_scope: str
    observed_failure: Optional[str]
    hypothesized_mechanism: str
    proposed_change: str
    comparator: str
    process_outcome: str
    patient_outcome: str
    harm_or_spillover: str
    rival_explanation: str
    falsification_test: str
    causal_status: str = "HYPOTHESIS_NOT_LOCAL_EFFECT"
    local_site_accepted: bool = False

def validate(x: ProcessChange) -> dict:
    required = ("id","condition","context","first_signal","source_url","source_scope",
                "hypothesized_mechanism","proposed_change","comparator","process_outcome",
                "patient_outcome","harm_or_spillover","rival_explanation","falsification_test")
    missing=[f for f in required if not isinstance(getattr(x,f),str) or not getattr(x,f).strip()]
    if missing: raise ValueError("missing or malformed: "+", ".join(missing))
    if not x.source_url.startswith(("https://doi.org/","https://pubmed.ncbi.nlm.nih.gov/",
                                    "https://www.nice.org.uk/","https://pmc.ncbi.nlm.nih.gov/")):
        raise ValueError("source needs a recognized direct primary/guideline URL; not source verification")
    if x.causal_status != "HYPOTHESIS_NOT_LOCAL_EFFECT":
        raise ValueError("local effect cannot be asserted by a candidate record")
    if x.local_site_accepted: raise ValueError("site acceptance requires separate verified receipt")
    return {"status":"RESEARCH_CANDIDATE_REQUIRES_REVIEW",
            "clinical_effect_established":False,"independent_review":False,
            "source_authenticity_verified":False,"data":asdict(x)}

CANDIDATES=(
    ProcessChange(
        id="CRC-01",condition="colorectal_cancer",context="symptomatic younger adult in primary care",
        first_signal="documented rectal bleeding, with onset and clinician availability kept distinct",
        source_url="https://pubmed.ncbi.nlm.nih.gov/38522331/",
        source_scope="Research hypothesis; this paper is an expert-network comparator, not CRC-specific evidence",
        observed_failure=None,hypothesized_mechanism="screening eligibility misapplied to symptom evaluation",
        proposed_change="versioned screening-vs-diagnostic scope check with clinician review",
        comparator="competent existing symptomatic diagnostic evaluation",
        process_outcome="appropriate assessment within prespecified interval",
        patient_outcome="diagnostic resolution and stage-specific outcomes if disease develops",
        harm_or_spillover="unnecessary investigation and specialist queue displacement",
        rival_explanation="severity, alternative diagnoses, patient preference, referral capacity",
        falsification_test="blind review of actual dated symptomatic records; assess justified nonchange and false escalation"),
    ProcessChange(
        id="CRC-02",condition="colorectal_cancer",context="positive stool test and cross-system follow-up",
        first_signal="abnormal FIT result known to the ordering team",
        source_url="https://pmc.ncbi.nlm.nih.gov/articles/PMC10565610/",
        source_scope="randomized trial of overdue abnormal cancer-screening results, mixed cancers",
        observed_failure=None,hypothesized_mechanism="EHR reminder does not ensure accountable completion",
        proposed_change="outreach and tracked diagnostic resolution, with navigation when justified",
        comparator="existing reminders and outreach, not merely usual care",
        process_outcome="completed diagnostic follow-up within 120 days",
        patient_outcome="disease-specific morbidity, stage, experience and costs in separate evaluation",
        harm_or_spillover="navigation staffing, diagnostic bottlenecks and burden on nonparticipants",
        rival_explanation="baseline outreach performance and access/capacity differences",
        falsification_test="compare outreach-plus-navigation vs outreach alone; retain null-compatible +0.4pp contrast"),
    ProcessChange(
        id="ENDO-01",condition="endometriosis",context="persistent pelvic symptoms with normal ultrasound",
        first_signal="persistent symptom report with documented function impact",
        source_url="https://www.nice.org.uk/guidance/ng73/chapter/Recommendations",
        source_scope="UK guidance, not US clinical mandate or observed intervention effect",
        observed_failure=None,hypothesized_mechanism="negative imperfect test prematurely closes investigation",
        proposed_change="retain unresolved symptom trajectory and criteria-based referral review",
        comparator="existing follow-up and appropriate differential assessment",
        process_outcome="appropriate diagnostic assessment and completed referral where indicated",
        patient_outcome="pain, functioning, diagnostic interval, fertility concerns and experience",
        harm_or_spillover="unnecessary procedures, specialist wait times and patient burden",
        rival_explanation="alternative diagnoses, symptom fluctuation, preferences and capacity",
        falsification_test="review cases with normal imaging and persistent symptoms including appropriate nonreferrals"),
    ProcessChange(
        id="RA-01",condition="rheumatoid_arthritis",context="suspected persistent synovitis in primary care",
        first_signal="clinician-available persistent synovitis findings",
        source_url="https://www.nice.org.uk/guidance/ng100/chapter/Recommendations",
        source_scope="UK guideline with specific qualifying criteria; not nonspecific fatigue",
        observed_failure=None,hypothesized_mechanism="negative markers misused to override clinical referral criteria",
        proposed_change="qualifying clinical-criteria and uncertainty review with specialist handoff tracking",
        comparator="existing evidence-informed assessment and referral",
        process_outcome="appropriate referral and time to specialist evaluation",
        patient_outcome="function, symptoms, disease progression and adverse treatment effects",
        harm_or_spillover="over-referral and constrained specialist capacity",
        rival_explanation="differential diagnosis, acuity and access",
        falsification_test="evaluate eligible synovitis cases and negative controls without qualifying findings"),
)

def portfolio():
    return [validate(c) for c in CANDIDATES]
