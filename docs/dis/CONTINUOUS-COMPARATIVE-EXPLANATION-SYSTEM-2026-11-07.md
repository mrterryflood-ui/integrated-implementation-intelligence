# DIS–RPLICE Continuous Comparative Explanation System (CCES)
Version 0.1 — internal research design — 2026-11-07. Not a validated causal engine or operational clinical system.

## Mission
Explain on a recurring, source-traceable basis why observed health patterns differ, distinguish changes in disease from changes in detection/measurement/recording, and specify the next evidence needed to discriminate plausible mechanisms. The product is an *explanation with uncertainty*, not an automatically generated causal conclusion or treatment recommendation.

## Three bounded programs
1. CRC county comparison: Hinds County MS, Harris County TX, Colorado target geographies; distinguish late-stage share, late-stage population incidence, all-stage incidence, counts, stage completeness, screening eligibility/completion, abnormal-result resolution, mortality. Never relabel county as city. NCI release vintage and geography must match before pooling.
2. 50-state colorectal/lung/female-breast ecological comparison: use aligned release, age-standardization, stage definition, cancer-specific denominators; separate late-stage incidence-rate correlations from late-stage case-share correlations. Reproduce source input and code; resolve the earlier vs recomputed secondary coefficients before publishing. Model demographic, tobacco, screening, detection, registry, environmental and socioeconomic explanations as candidates, not proven causes. State-level associations cannot establish individual exposure.
3. Women's-health diagnosis visibility: endometriosis, PCOS, fibroids. Distinguish latent burden, symptom burden, care-seeking, clinician assessment, diagnostic criteria, recorded diagnosis, treatment and quality of life. NSFG ever-diagnosed survey percentages are not underlying disease incidence, 50-state prevalence or longitudinal follow-up; account for complex survey design, age frame and ascertainment.

## Durable record schema (proposal; no migration yet)
- research_program: ID, disease module, research question, beneficiary, intended decision, governance owner, protocol version, last review.
- evidence_source: original URL/DOI, author/publisher, table/figure/row, publication date, release/version, retrieval date, geography, population, sampling frame, quality, reviewer, reuse terms, hash/archival reference where authorized.
- measurement: construct, numerator definition, denominator definition, unit, age adjustment/weights, eligible population, geography/boundary vintage, sex/age strata, time window, missingness, suppression, stage/diagnosis definition, CI/SE, source ID, observation state.
- comparison: matched units, compatibility checks, confounders, ecological limitations, alternate stratifications, comparability verdict, reason not pooled.
- explanation_candidate: mechanism, DAG or causal pathway, designed/operational/experienced evidence, rival hypothesis, disconfirming observation, source IDs, status (proposed/supported/refuted/unresolved), human adjudicator.
- decision: action/no action, alternatives, mechanism-to-action justification, equity and harm assessment, feasibility, resources, authorization, method selection, version.
- outcome_followup: baseline and repeated measures, reach, fidelity, beneficiary outcome, subgroup harms, costs, unintended effects, sustainment, independent verification, re-open trigger.
- narrative: plain-language answer, observed facts, candidate explanations, rejected explanations, confidence boundaries, unknowns, recommended *research* action, evidence links, date/version.
Never put patient-level identifiers into a public research record; keep tenant/private authorization separate.

## Processing cycle
1. ORIENT: specify question and target construct, e.g., “why does late-stage incidence differ despite similar late-stage case share?”.
2. RETRIEVE: acquire primary NCI/CDC/NCHS source and methods, peer-reviewed context, release dates; log unavailable or changed sources rather than silently substitute.
3. VALIDATE: double-extract important numbers; compare methods, denominator, period, suppression, age adjustment, survey weights, source independence; mark noncomparable.
4. DECOMPOSE: observed burden vs underlying incidence vs detection/diagnosis/recording; distinguish rates, shares, counts and treatment outcomes.
5. EXPLAIN: generate at least two plausible competing mechanisms plus null/measurement artifact, each with a falsification test; record alternative causal diagrams.
6. CHALLENGE: independent council reviewer evaluates confounding, reverse causality, selection/collider bias, ecological inference, lag, missingness and equity harms. Specialist methods are human-selected; no automatic RPLICE invocation.
7. DECIDE: either “descriptive evidence only”, “needs new data”, “candidate design review”, or “field intervention requires authorization”. Never auto-promote descriptive association to cause.
8. COMMUNICATE: produce reproducible research memo and plain-language explanation with citations and dated uncertainty.
9. TRACK/RE-MAP: rerun only when source version changes, new evidence arrives or a review date is reached; diff the evidence, methods and explanation, not just chart values. Require human signoff before external sharing.

## Explainability output contract (same for every case)
- **Question**: population, geography, period, construct.
- **Observed**: exact source measurements, uncertainty and compatible comparisons.
- **Why this is surprising**: describe the denominator or mechanism distinction.
- **Candidate mechanisms**: ranked only when evidence permits, each with supporting and conflicting data.
- **Alternative interpretations**: at least two; what would falsify each.
- **What cannot be concluded**: ecological, cross-sectional, survey, source and causal limitations.
- **Evidence to collect next**: prioritized, with owner role, data rights, instrument, test, acceptance criterion.
- **Decision status**: DESCRIPTIVE / INVESTIGATE / DESIGN_REVIEW / AUTHORIZED_IMPLEMENTATION; never conflate with successful outcomes.
- **Change log**: source release, previous explanation, new evidence, changed conclusions, review signature.

## Specific recurring audits
- CRC: release/vintage drift; stage completeness; county-city mismatch; late-stage share vs rate; numerator/denominator validation; eligible screening and abnormal-result completion.
- Three cancers: state list, weighting and standardization; cancer-specific stage definitions; correlations with uncertainty; sensitivity to outliers, time period and confounders; ecological fallacy; reconcile prior r=0.234 vs new r≈0.231 and prior Spearman 0.413 vs new ≈0.410 from pinned table before a definitive coefficient claim.
- Women's health: diagnostic criteria version; ever-diagnosed vs current condition; age and survey design weights; health-seeking/recognition bias; symptoms and treatment access; no invented state estimates.
- Cross-program: same construct names do not imply comparable instruments; different constructs cannot be pooled; no default cancer screening ontology in endometriosis/PCOS/fibroids.

## Demonstration scenarios and expected results
A. CRC late-stage shares 63.3% vs 63.4%, population late-stage rates 30.4 vs 23.3: narrative must explicitly explain distinct denominators, not call equal disease burden.
B. Three-cancer correlations 0.735 (rate) vs 0.129 (case share): explain differing constructs; no common cause assertion.
C. Lower recorded endometriosis diagnoses in one group: cannot conclude lower disease prevalence without ascertainment review.
D. New NCI release changes one county time window: freeze old version, mark comparison incompatible, do not silently redraw causal story.
E. Aggregate improvement with subgroup deterioration: flag harm/disparity and require independent review.
F. A false/duplicate/missing source or ambiguous measure: quarantine and request independent verification.
G. A new finding contradicts a previous narrative: preserve original, create explicit revision and reviewer disposition.
H. Source unavailable or no live feed: mark stale/unverified, never claim continuous surveillance.

## Engineering integration plan (not yet implemented)
- Reuse current `apps/dis-platform/lib/evidence-action-bridge.ts`, `evidence-action-case-handoff.ts`, `outcome-equity-assurance.ts`, `/api/cases`, Research Studio and source-search route. Do not create a parallel platform or database.
- Add **condition modules** (CRC, lung, breast, endometriosis, PCOS, fibroids) with typed measurement ontology and test fixtures.
- Add a **source/version registry and comparability engine**, then a **mechanism-and-falsification ledger**; human-reviewed explanation builder is downstream.
- Add source-refresh diff and review queue. Schedule only with explicit review of recurring tool/provider costs; a trigger is not proof of fresh data.
- Add case-level “Why do these numbers differ?” interface: evidence cards, denominator comparison, rival explanations, what changes the conclusion, and accessible provenance.
- Build exact-source and negative tests; require GitHub PR checks, signed-in persistence witness, authorization/security tests, independent methods review before production claims.

## Gate for Jeremiah collaboration
No external email or implied endorsement. First show Terry: (1) source-vintage and denominator reconciliations, (2) first three case narratives and rival hypotheses, (3) working demonstration with provenance and uncertainty, (4) specific unresolved data-access/scientific design questions. Then draft the scientific consultation package for explicit approval.
