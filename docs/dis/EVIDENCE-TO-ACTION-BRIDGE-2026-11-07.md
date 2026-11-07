# DIS–RPLICE Evidence-to-Action Bridge — Engineering and Research Handoff
**Date:** 2026-11-07  
**State:** Review-branch implementation, not a completed empirical study, approved intervention, or production release.  
**Authority:** IRON-ENG-001 v1.0.0; AGENTS.md; human-controlled DIS and RPLICE methodological and consequence authority.  
**Baseline SHA:** `8f3a1bba5508fc8681f3347284c0d9f1fe7a5b43`  
**Branch:** `feat/dis-evidence-to-action-bridge-20261107`  
**Cost/security:** No Copilot or paid Replit agent; no protected patient records, new database, external communications, cross-tenant data, automatic RPLICE execution or public clinical recommendations.

## Before → Changed → Why
Preserve STELLAR 1, source mesh, INQUIRE/decision-assurance controls, ChainWeb, existing 20-phase implementation lifecycle, HIL RPLICE selection, longitudinal learning, source discovery, the NCI Hinds County colorectal case and published methods casebook. No parallel DIS service or reimplementation of RPLICE methods.

Added one explicitly limited vertical slice: **published measurement → typed construct/denominator association → distinct competing explanations → original-literature discovery leads → counterfactual feasibility audit → correction receipt preflight → visible MAP–GAP obligations**. The researcher-facing path is `/research-program/evidence-action`, linked from the existing Research Studio. Metadata discovery uses the existing six-year OpenAlex server adapter, only after a signed-in user explicitly initiates a request.

## Requirement and proof matrix
| ID | Requirement | Code and test acceptance |
| --- | --- | --- |
| EA-01 | Never pool related but different constructs | `lib/evidence-action-bridge.ts`; three Hinds measures generate three non-poolable links |
| EA-02 | No colorectal-to-other-condition leakage | `lib/evidence-action-colorectal.ts`; breast/general input fails colorectal crosswalk |
| EA-03 | Source lineage and no independent-confirmation inflation | DOI dedup; OpenAlex leads remain discovery-only |
| EA-04 | Competing explanations must be disconfirmable | Reuse existing hypothesis, rival, instrument and reviewer fields |
| EA-05 | No snapshot as causal DID | Treatment year, aligned cohorts, minimum declared observations, alternative events, trend review, separate comparator, unchanging measure version; all arithmetic labeled descriptive |
| EA-06 | No correction closed by self-report | Receipt fields and bounding checks; metadata completeness never becomes observed/independently verified outcome |
| EA-07 | A working internal investigator journey | Desktop and iPhone browser checks; offline synthetic panel; no unapproved external writes |
| EA-08 | Version-bound acceptance and source review | Typecheck, tests, built candidate, browser receipts, and independent review of exact final SHA before merge |

## The original colorectal case and scientific boundaries
The existing NCI historical **Hinds County, Mississippi** fixture for 2018–2022 reports **30.4 late-stage age-adjusted incidence per 100,000 annually (95% CI 27.3–33.8); 63.3% late-stage of staged incident colorectal cancers; and 76 average late-stage cases annually.** These values are neither Jackson city rates, current 2026 estimates, all-stage incidence, causal impacts, nor independent replications. They share lineage but differ in denominators. All values require independent source re-extraction before manuscript submission.

Harris County, TX and a defined Colorado comparison geography are **unpopulated** in this bridge until genuinely comparable source-matched measurements are acquired. The unreconciled GIS work is in PRs #57 and #58. PR #60 evaluates whether ChainWeb adds incremental value beyond competent CFIR, PRISM/RE-AIM, FRAME-IS and other established methods; none demonstrates comparative superiority. We preserve those branches and do not silently merge their uncertain claims or evidence into the causal model.

## Research next: return to empirical inquiry
1. **Reconstruct same-site measurements:** all-stage incidence and late-stage incidence, stage share, total cases, completeness, age/race/sex strata, geographic units, registry vintage, time series and uncertainty. Source each metric from authoritative registry releases rather than reverse-calculating all-stage incidence from incompatible adjusted and conditional values.
2. **Designed / Operational / Experienced:** compare guidelines/policy and intended delivery; real screening eligibility, referral, completion, diagnostic resolution, clinic capacity; and stakeholder experience from **actual** authorized observations, never personas represented as testimony.
3. **Compare Hinds, Harris, Colorado and larger counties:** predefine geography, enrollment/eligibility, same-site/population/period and statistical methods. State-county and clinic catchments are not interchangeable. GIS facility locations are context only—not chemical exposure, dose or cancer causation.
4. **Retain competing explanations:** underlying incidence vs later detection, diagnostic delays, screening intensity, case mix, race and structural factors, metabolic and environmental risks, registry coding and suppressed cells, access barriers, provider capacity, time lag and secular programs. Test null, reverse and unintended hypotheses.
5. **Causal design:** estimate a clearly specified intervention effect only after source-aligned longitudinal treatment and control panels, intervention timing, multiple preperiods, comparator validity, pretrends, interference/spillover, secular trends, cointerventions and sensitivity analyses have been independently reviewed. A computed DID contrast is descriptive arithmetic until justified; false assurance from textual self-declarations is not evidence.
6. **Implementation:** identify feasible non-automatic strategies; distinguish evidence-based **core functions** from adaptable delivery forms, name institutional owner and resources, then test reach, follow-through, fidelity, costs, burden, safety and equity in an authorized reversible pilot with actual recipients and independently reviewed results.
7. **Sustain and transfer:** follow through the existing longitudinal DIS checkpoints. Only condition-specific independently validated measurements and locally approved adaptations may later inform HerHealth, Thriving Communities or Mission Transition. No automatic clinical transport.

## Internal exercise and red-team scenarios
| Challenge | Required response |
| --- | --- |
| Same county, different denominator (30.4 vs 63.3 vs 76) | Recognize related phenomenon but reject mathematical pooling and causal equivalence |
| Source duplicate under same DOI | One literature lead, not independent confirmation |
| Breast/lung/endometriosis case bound to colorectal metric | Reject; request original condition-specific validation |
| Harris rate missing / suppressed subgroup / same-state snapshot | Preserve unknown; no zero substitution or DID |
| Pretrend poor, control mismatched, coincident intervention | Reject causal interpretation; require qualified design review |
| Strong screening improvement without confirmed diagnostic follow-up | No assertion of disease prevention or mortality benefit |
| Self-reported correction with numerator and metadata but no outcome adjudication | Conditional documentation only; no independently verified closure |
| RPLICE HIL method selection without call receipt | Selection only; no fabricated specialist execution |
| Model-produced stakeholder perspective | Analytical prompt, not actual human testimony |

## Unresolved acceptance gates and limitations
- **External-source audit:** original article/registry source inspection, DOI lineage, confidence intervals and method harmonization require independent verification. Abstract retrieval is not full-text evidence integration.
- **Causal adjudication:** pretrend data and review text can be self-declared. Current audit is a screening instrument, not a trained causal estimator, formal falsification test, statistical power analysis, or external scientific endorsement.
- **Correction follow-through:** local receipt review does not save a tenant-owned authoritative action or authenticate issuer identity. Durable audit events, authorizations and actual outcome review remain a downstream integration gate; do not mislabel them as complete.
- **GIS and full multi-state ingestion:** existing research PRs are separate and unmerged until their own tests, source semantics, browser checks and independent review pass.
- **Operational promotion:** signed-in live search, database persistence, browser UX, exact-head tests, security review, deployed revision and partner clinical permissions require distinct witnessed receipts. A merged PR is not proof of deployment.
- **Stakeholder research:** no participant recruitment, outreach, protected record use or external scientific conversation is authorized before owner-led internal exercise and protocol correction.

**Owner review exercise after engineering merge:** challenge measurement ontology, source completeness, counterfactual plausibility, fidelity, costs, privacy, and user journey; document root cause, evidence, correction, and new regression test for every material gap. Only then decide whether external methodological consultation is warranted.
