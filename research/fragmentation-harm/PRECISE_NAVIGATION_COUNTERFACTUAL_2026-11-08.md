# Counterfactual triangulation: why a valid navigation effect is not the same as source integration (2026-11-08)

**Study:** Coronado et al., *Annals of Internal Medicine* 2025, PRECISE randomized trial, DOI 10.7326/ANNALS-24-01885. Primary original manuscript available at https://pmc.ncbi.nlm.nih.gov/articles/PMC13007779/ . Causal comparator for ChainWeb calibration cycle 1; relates to issue #81 and the clinical-pathway segment in PR #85.

## Correct causal estimand
The trial enrolled patients **after** an abnormal FIT result in the preceding month, then randomized them to telephone navigation or usual care. Of 985 originally randomized (489/496), 18 were subsequently excluded as randomized in error (10/8), yielding a **modified ITT sample of 967** (479 navigation; 488 control). The county-adjusted 12-month colonoscopy completion percentages were **55.1%** and **42.1%**, risk difference **+13.0 percentage points** (95% CI **+6.5 to +19.4**), adjusted OR **1.69** (95% CI 1.30–2.19). This is a credible causal test of assignment to a navigation package among the study's eligible patients, not an estimate of stage or mortality prevented, or the effect of cross-dataset integration alone.

Compare with Reuland et al. 2024 (DOI 10.1001/jamanetworkopen.2024.46693): the primary screening effect is randomized, but follow-up counts restricted to positive FIT are **postrandomization-selected** (33/48 vs 8/18), with non-significant CI including zero. The PRECISE population is explicitly eligible **before navigation randomization** and provides a more defensible follow-up-specific counterfactual. Distinguish the absolute +13.0pp one-year follow-up effect from Reuland +20.29pp 6-month any-screening effect; they are not pooled.

## Micro-level denominator and selection audit
The PRECISE manuscript states that 242 people (49.5%) received navigation, in a paragraph referencing 479 modified-ITT intervention participants. Yet **242/489 = 49.4888%**, consistent with the printed 49.5%, whereas **242/479 = 50.5219%**. The percentage appears calculated with the original randomized arm denominator. This is a small **label/denominator ambiguity**, not grounds to reject the primary adjusted randomized treatment effect. The observed 94.2% follow-up completion *among recipients* is not a randomized treatment effect because receipt depends on reachability, eligibility, preferences and engagement. Do not replace the 13.0pp randomized estimate with a recipient-only contrast.

The paper notes that intervention delivery during COVID involved interrupted GI services, staffing turnover and backlog. The outcome was colonoscopy completion, not prevented cancer mortality. Data access statement: the authors were not authorized to distribute patient-level research data.

## Interpretation and falsification
- **Supported:** assigned patient navigation after abnormal FIT can increase documented 12-month colonoscopy completion in studied FQHC sites.
- **Not isolated:** data interoperability or multi-source fusion alone causes this effect. Navigation is a human and operational intervention.
- **Untested:** Hinds/Harris local effects, actual stage reduction, broader SDOH gains, equity spillovers, cost savings and sustainment.
- **Decision:** keep ChainWeb pathway as two separable intervention targets: (1) eliminate false information loss and ascertainment errors; (2) improve intervention delivery through ownership, navigation and capacity. Test each independently and in combination before claiming synergy.

## Reproducibility
`navigation_counterfactual_validation.py` encodes the published trial denominators and adjusted effect without inventing patient-level raw counts; `test_navigation_counterfactual_validation.py` guards four common misinterpretations. Both are in scientific PR #85. No production authentication or live applications were modified.
