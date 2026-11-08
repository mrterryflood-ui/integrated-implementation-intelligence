# DIS–RPLICE Integrated Intelligence Operating Architecture — v0.1
2026-11-08. Research/implementation specification and evidence integration contract. **Not a claim of deployed clinical intelligence or patient-level validation.**

## Fixed mission and system-level decision
The platform must turn heterogeneous, historically admissible evidence into falsifiable understanding, context-appropriate prevention opportunities and accountable implementation. Dartmouth is one stakeholder; patients/communities are beneficiaries; health and public-health organizations are operational adopters. CRC is calibration, with endometriosis and autoimmune as owner-named scale-out priorities. Do not optimize for one screening metric or a single funder.

## Intelligence lifecycle and testable output at each transition
| Stage | Question | Inputs | Produced artifact | Failure mode to test |
|---|---|---|---|---|
| Observe | What signals existed, and when? | registries, longitudinal labs, symptoms, family history, encounters, exposures, SDOH, experience | versioned source inventory and event timeline | invisible or uncollected signals |
| Reconcile | Are constructs comparable? | source schema, denominator, geography, time, case definition, age standard | construct crosswalk and comparability verdict | false equivalence and silent denominator drift |
| Understand | What differs across systems? | harmonized cohorts, strata, qualitative experiences | disparities and mechanism map | ecological fallacy and missing subgroups |
| Explain | Which mechanisms fit evidence? | causal graph, alternative explanations, selection, capacity, policy | falsifiable hypothesis ledger | mistaking association for causation |
| Anticipate | What was knowable at decision time? | timestamped historical inputs, risk model and calibration | decision-time risk and uncertainty estimate | look-ahead leakage, poor subgroup calibration |
| Counterfactual | Would another feasible action change outcomes? | target-trial protocol, matched/weighted cohorts, controls | estimand, bias audit, sensitivity bounds | confounding, lead-time/length bias |
| Act | Who should do what and why? | evidence-qualified recommendation, patient preferences, resources | human-reviewed decision/action ledger | unsupported autonomous clinical action |
| Verify | Did action and patient outcomes change? | follow-up events, registries, patient reports, adverse events | multidimensional outcome dashboard | process completion mistaken for clinical benefit |
| Learn | Does benefit endure and transfer? | repeated cohorts, feedback, drift monitoring, external sites | versioned model change and transfer verdict | overfitting, unmeasured harm, scale drift |

## One canonical event/provenance contract — proposed fields
`event_id, subject_key_pseudonymous, population_id, condition_id, source_id, source_version, source_extract_sha256, event_type, event_time, documented_time, available_to_decision_time, decision_time, construct_id, unit, numerator_definition, denominator_definition, measurement_instrument, code_system, value, uncertainty, missingness_reason, provenance_locator, human_reviewer, consent_or_governance_basis, link_confidence, evidence_grade`.
No patient identifiers in public research repositories; subject keys and linkage only inside authorized secure environments. Null and not-applicable are distinct. Each event is append-only at the *intended storage layer* with amendment references and access audit; current GitHub documentation does not prove a durable production ledger exists.

## Two essential clocks
- **Clinical/experienced clock:** earliest patient-experienced symptom, first recorded signal, first available-to-clinician signal, recognition, decision, action, resolution, outcome. Never silently equate retrospective symptom onset with contemporaneously knowable evidence.
- **Evidence clock:** source collection period, release date, revision date, acquisition date, decision-date availability. A 2024-released 2019–2023 statistic cannot inform a 2023 decision. Every counterfactual excludes future-only data.

## Multidimensional outcome vector — owner adjudicated
CRC: early and late counts/rates, early:late ratio, all-stage incidence, late-stage incidence, mortality, emergency diagnosis, time to action, equity, false positives, capacity and quality of life. Endometriosis: diagnostic interval, pain/function, fertility, quality of life and care experience. Autoimmune: diagnostic interval, organ damage, function, quality of life and experience. No forced either/or metric choice; individual experiments prespecify estimands while preserving the full outcome vector.

## ChainWeb connection types — avoid misleading graph edges
1. **Observed association** (descriptive only);
2. **Measurement dependency** (e.g., CDM field versus raw EHR module);
3. **Operational dependency** (e.g., referral requires specialist capacity);
4. **Causal hypothesis** (explicit DAG and falsification);
5. **Validated causal effect** (design, population, interval, uncertainty and transportability recorded);
6. **Policy/resource constraint** (time-specific);
7. **Transfer hypothesis** (method shared, clinical threshold not presumed).
Each edge must have source and time validity, owner, confidence/grade, competing explanations, and a disconfirmation test. Do not automatically promote edge types.

## CRC calibration case — verified arithmetic, not causal conclusion
Retained Hinds/Harris 2019–2023 aggregates: 29.9 vs 23.9 late-stage incidence per 100k; 63.7% vs 63.4% late-stage case shares. Difference 6.0/100k. Symmetric decomposition using *age-adjusted rate quotients* yields 5.348 incidence component + 0.652 quotient component, **not** causal attribution and **not** a decomposition of reported case-based shares. Reproduction: `test_hinds_harris_symmetric_decomposition.py`. Raw registry reacquisition and denominator audit remain open.

## Implementation and integration interfaces
- **Research sources:** registry/public datasets, peer-reviewed original studies, EHR/claims/labs only when authorized, environmental and socioeconomic data, patient experience. Ingest adapters must preserve original content hash, license/access conditions, date and definitions.
- **DIS orchestrator:** source inventory -> construct crosswalk -> temporal filter -> analysis and falsification -> evidence/decision ledger -> human review -> outcome monitoring.
- **RPL ICE specialist:** method-selection and research analysis as explicitly chosen by HIL, not a blanket default HOLD; preserve specialist outputs and dissent.
- **HerHealth / men's health / Thriving Communities:** potential implementation consumers of validated findings, not presumed integrated or live; inspect actual APIs, authentication, data rights and tests before declaring connections.
- **Clinical partners:** adopt alongside existing care workflows, with accountable clinicians and secure patient data boundaries.
- **Engineering:** GitHub source of truth; verify CI and independent scientific review before merge; do not modify parallel login work; no paid agents or outbound commitments.

## Pressure-test matrix and release gates
G0 mission and use-case fit; G1 original source provenance; G2 construct/denominator comparability; G3 historical temporal admissibility; G4 independent arithmetic and contradictory evidence; G5 predictive discrimination AND calibration/decision-curve net benefit; G6 target-trial causal assumptions and sensitivity; G7 implementation capacity/clinical governance; G8 independent reviewer challenge; G9 reproducible integration/end-to-end tests; G10 real-world outcome monitoring and sustainment. Failures remain visible; no synthetic test can close G10.

## Next 15-minute sprints with accountable outputs
1. **Data/provenance lead:** inspect the archived registry files and document original row IDs, stage definition, release and denominators; reproduce CRC comparison from raw input rather than retained typed values. Exit: source-level reproducibility and checksum.
2. **Methods lead:** prespecify two CRC target trials: first warning-sign action versus usual care, and risk-adapted asymptomatic screening versus standard age policy. Separate confounders, harms, capacity and estimands.
3. **Cross-condition lead:** harmonize only event semantics, not clinical thresholds; pressure-test endometriosis and autoimmune earliest-signal data against patient experience.
4. **Engineering lead:** implement a non-PHI, versioned event and evidence-edge validator with tests for future-information leakage, denominator incompatibility, missing source hashes and ungraded causal edges. Do not claim a deployed storage service.
5. **Independent judge:** reproduce arithmetic and source definitions, challenge edge promotion and causal claims, adjudicate uncertain W8 entries.
6. **Synthesis lead:** maintain one living research dossier and stakeholder-specific views; Dartmouth read-ahead is one view, not the core program.

## Current assurance
Research and engineering workflows on commit `613495151f338349fbe51127f8b6f0304300434c` succeeded (runs 42498731968, 42498731728). New architecture specification itself has not yet been independently reviewed or validated. No claim of patient-level outcomes, durable storage deployment, live cross-platform integration, or cross-condition clinical transfer.
