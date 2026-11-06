# DIS Inquiry Method — How to Look, Measure, Challenge and Validate

**Version:** 0.1.0 | **Status:** Research-method prototype, not an independently validated clinical, evaluation, or causal-inference instrument.

## Governing proposition

**Understand the phenomenon before choosing a measurement.** A measurement is an observation made by a particular instrument under particular conditions. It is not automatically the phenomenon itself, the underlying mechanism, or the relevant human outcome.

The familiar Sherlock Holmes formulation — eliminate the impossible, then examine what remains — is useful as an investigation discipline but can become misleading if the possibilities are not exhaustive or the claimed exclusion rests on a mistaken measure. DIS therefore applies a **bounded, open-world inquiry**: investigate competing explanations and what might distinguish them while preserving UNKNOWN as an admissible outcome. A synthetic persona, an untested inference, an absent observation, or the rejection of another explanation cannot certify a cause.

## Method — each question serves a decision

1. **Identify what is being sought.** Specify the phenomenon, decision, affected people, time/place, intended outcome, and the distinction between observed indicator and underlying process. A researcher should be free to determine the relevant question rather than select from a mandatory menu.
2. **Define what the available instruments can and cannot measure.** Record construct, unit, population, operational context, validation/calibration, error, limitation, lineage, observation time and receipt time. The same number can have different meaning when its sampling frame, instrument, or operational conditions change.
3. **Generate and compare explanations.** State an appealing explanation and serious competitors, including changing denominators, selection, confounding, instrument drift, missingness, competing pathophysiology or mechanisms, incentives, feedback and natural variation. Do not force a fixed list of causes.
4. **Specify discriminating observations and falsifiers before looking at results.** For each explanation, record a prediction, a result that would meaningfully challenge it, the instrument capable of detecting that result, and the conditions under which a false negative or positive is plausible.
5. **Evaluate evidence, independence and counterfactuals.** Check the actual original source rather than repeated URLs; check population, timing, sampling, measurement method, uncertainty and relevant comparator. Distinguish plausible mechanism, cross-sectional association, prognostic prediction, causally identified effect, and sustained human outcome.
6. **Only exclude hypotheses in a defined scope.** A proposed exclusion needs traceable evidence, a discriminating observation, scope boundary and limitations. The deterministic engine flags unsupported exclusions and keeps even complete-looking exclusions pending independent methodological adjudication.
7. **Choose action with restraint.** Compare competent existing practice, observation, further investigation, reversible pilots and alternative interventions. Include harm, equity, effort, reversibility, owner and review conditions. A proposed action is not authorization to treat, send, procure, deploy, or make a legal decision.
8. **Adapt as the system changes.** Re-evaluate world state, the evidence base, instrument/model fitness, and desired outcomes separately. Determine what should be sustained, maintained, stopped, or reconsidered the day after an initial target is achieved.

## What DIS must never claim

- A stable laboratory value alone proves stable disease; a low or high laboratory number alone establishes the disease mechanism; one test applies to every person.
- A biochemical mechanism, animal study, uncontrolled testimonial, or biomarker movement proves clinical benefit.
- Multiple measures, websites, AI opinions or generated personas constitute independent confirmation without shared-lineage assessment.
- All possible explanations have been enumerated; a missing alternative makes the remaining one true.
- A numerical score, clean checklist, synthetic test, merged PR, or successful build proves diagnostic accuracy, a product's effectiveness, institutional approval, or improved patient outcomes.

## Why this matters for kidney-claim analysis — synthetic methodological vignette

**Question:** A vendor argues that a measurement can be stable while damage progresses, then claims a proprietary substance corrects the hidden mechanism.

**Method:**
- Treat the distinction between filtration measurement and kidney damage markers as an appropriate diagnostic-method question.
- Ask what each measurement validly represents, what else influences it, and whether data about progression, causes, comparator, and adverse effects exist.
- Separate a plausible vascular mechanism from patient-level evidence of benefit.
- Check the actual formulation, exposure, trial design, sampling, timing, kidney outcomes, safety, study registration, competing explanation, and replication.
- Avoid an automated recommendation for any individual test, dietary change, medication, or supplement. Such decisions remain within actual clinical authority and patient-specific evaluation.

**Outcome of this protocol:** A transparent research and evidence gap map, not a treatment recommendation or validated diagnosis.

## Explicit adoption map, not an assertion of release

| Platform | Source already inspected | Reuse instead of rebuild | Adoption gate |
|---|---|---|---|
| DIS Council | `integrated-implementation-intelligence`, Council evidence mesh, Decision Assurance Lab, versioned public agent standard | Use pure `dis-inquire.ts` method review alongside existing Council integrity and multi-instrument logic | Exact-revision TS, unit, browser and source verification; experimental output labeled not validated |
| AIDE-Core | `VAtool/artifacts/api-server/src/lib/investigation-preflight.ts`, existing AIDE DIS integration contract | Extend existing candidate preflight/claim graph with inquiry and elimination evidence prompts, without replacing its reviewer or grading gates | Preserve synthetic-only access, source-span provenance, operator authority, tenant isolation; AIDE dedicated tests and deployment review |
| HerHealth | `Herhealthcare` research and clinical-education components | Offer investigator-method learning and protocol/design review only; do not use it to order labs or advise treatment | No PHI in public UI; privacy/clinical safety and population-specific instrument review before any live clinical function |
| ThriveUp and care navigation | `Thriveup` existing partner/context workflows | Apply the method to resource, program, and outcome evidence, distinguishing referrals/process from benefit | Owner-approved integrations, record isolation and actual outcome validation |
| RPLICE/research implementation | Existing DIS source-integrity interface and separately operated RPLICE materials | Use inquiry schema for method and instrument selection, preregistration and comparative study design | Verify actual authoritative RPLICE repository/runtime before implementation; do not infer from a pitch deck |

The canonical owner-approved public DIS standards remain discoverable at https://dis-authenticated-platform.vercel.app/api/dis/standard. This research module does **not** change global ChatGPT instructions or automatically install itself into AIDE, HerHealth, ThriveUp, or RPLICE.

## Scientific and software assurance

The engine accepts a **bounded synthetic research packet**, returns methodological findings and next questions, and never performs patient-specific evaluation, retrieves protected sources, scores a study effect or authorizes actions. It explicitly distinguishes:
- QUESTION from MEASUREMENT;
- INSTRUMENT FIT from apparent precision;
- SOURCE REPETITION from independent confirmation;
- MECHANISM from causal intervention benefit;
- PROPOSED HYPOTHESIS EXCLUSION from scientifically justified rejection;
- COMPLETED TARGET from sustained benefit.

The 13+ synthetic unit tests check failures involving measurement validity, unmodeled possibilities, invalid hypothesis exclusion, double-counted evidence, hindsight timing, causal claims without counterfactuals, and absent successor planning. Passing tests verifies programmed behavior **only**, not clinical validity or comparative effectiveness.

## Pilot research validation

For independent study, ask domain-expert analysts to investigate unfamiliar decision cases using competent incumbent processes, established scientific methods, and DIS with equivalent information/time. Blinded adjudicators should compare material reasoning errors, premature closure, unrecognized alternatives, unsupported source/causal claims, time to actionable questions, actual decisions, workload, equity harms and ability to reopen a conclusion after conflicting evidence.

Use protocol registration and ethics review where warranted; set and justify effect thresholds and sample size before outcomes are examined. An independent scientific panel must be allowed to identify cases where DIS adds no value or increases delay, overconfidence or confusion.

## Current state

The canonical method implementation is in `apps/dis-platform/lib/dis-inquire.ts`, with tests in `apps/dis-platform/tests/dis-inquire.test.ts`. Until merged and deployed with receipts, this is a **research branch candidate** and not a released API, software intervention, or adopted external-agent capability.
