# DIS × RPLICE — Internal Protocol and Code Exercise
**Date:** 2026-11-07  
**Exercise:** EX-01 through EX-08, synthetic fixtures plus a clearly identified historical NCI aggregate case  
**Governance:** DIS MAP–GAP; IRON-ENG-001; independent scientific review not yet performed  
**Research status:** INTERNAL ONLY — no outreach, recruitment, clinical action, partner claims or data sharing.

## End state and evidence ladder
Determine whether DIS can connect discovery → measurement → rival hypotheses → valid causal design → intervention choice → fidelity and outcome verification without mistaking *available metadata* for *demonstrated results*. This exercise is a deterministic code/protocol rehearsal, not a prospective scientific evaluation.

## Exercised scenarios and observed code contracts
| ID | Scenario | Expected bounded behavior | Open scientific obligation |
| --- | --- | --- | --- |
| EX-01 | Three curated NCI Hinds measures | Keep 30.4 per 100k, 63.3% staged-case share and 76 annual cases separate; no pooling | Independent NCI re-extraction and stage completeness |
| EX-02 | Underlying disease burden | Preserve missing all-stage incidence | Acquire comparable all-stage incidence and case definition |
| EX-03 | Duplicate NCI record | Identify common source lineage | Find truly independent measures |
| EX-04 | Divergent synthetic pre-intervention trends (treated slope +2/year, comparator 0/year) | Never claim a causal effect, even if a metadata-only screen returns a candidate | **Priority protocol defect:** current design screen does not numerically reject nonparallel trends; self-reported pretrend prose can satisfy metadata |
| EX-05 | One snapshot/no intervention date | No DID arithmetic | Real intervention timeline and multiple pre/post periods |
| EX-06 | Plausible self-reported correction receipt | Provisional completeness is not independently verified benefit or authorization | Signed provenance, issuer authentication, actual independent outcome review |
| EX-07 | Missing abnormal-result follow-up | Keep diagnostic-resolution and delivery gaps open | Eligible abnormal-result cohorts and completed diagnostic resolution |
| EX-08 | No stakeholder testimony or RPLICE execution | Never infer actual participation or specialist completion | Authorized study governance and human-selected specialist runs |

## New findings for protocol red team
1. **GAP-R1 — Parallel trends not operationally tested (high scientific priority).** A text declaration can satisfy the design preflight even when the supplied synthetic groups have visibly divergent pre-intervention trajectories. Current code returns only *candidate for independent design review* and never causal confirmation, which preserves the essential claim boundary. However, the next protocol revision must compute transparent pretrend diagnostics, investigate effect heterogeneity and staggered treatment, document visual and formal sensitivity analyses, and avoid a universal numeric threshold for validity. **Owner role:** biostatistician / causal-inference lead. **Closure:** reproducible diagnostics and adversarial counterexamples, independent sign-off.
2. **GAP-R2 — Source harmonization not independently authenticated (high scientific priority).** Manually transcribed records and OpenAlex abstracts cannot establish original source methods, actual sampling, independent lineage, stage completeness or measurement comparability. **Owner role:** research librarian and registry epidemiologist. **Closure:** original-release receipts, instrument/case definitions and independent extraction.
3. **GAP-R3 — Intervention execution and outcomes not durably linked (high implementation priority).** A local receipt preflight does not establish actual recipient completion, fidelity, authorization, independent outcome review or sustained effect. **Owner role:** implementation lead / platform data steward. **Closure:** authenticated tenant-owned versioned case event, reviewer verification and observed follow-up under lawful data governance.
4. **GAP-R4 — Contextual and experienced reality not observed (research priority).** STELLAR 1 and Council prompts represent frameworks, not lived experience from recruited participants. **Owner role:** community engagement and methods leads. **Closure:** consented, approved qualitative and operational evidence with provenance and dissent.
5. **GAP-R5 — Multi-geography case not populated (research priority).** Hinds county is curated; Harris and Colorado must not inherit it. **Owner role:** population-health analyst. **Closure:** source-aligned annual series, geographies, denominators, population characteristics, and boundary validation.
6. **GAP-R6 — Documentation drift (engineering priority).** The bridge handoff previously described a review branch after PR #62 merged. This exercise branch corrects that status; final main revision and deployment still require separate verification. **Owner role:** repository maintainer. **Closure:** merge, exact-SHA checks, and documentation parity.

## Our own critical challenge
The superficial question is, "Why are late-stage percentages almost the same?" A stronger question is, "What combination of underlying incidence, stage ascertainment, screening intensity, diagnostic resolution, biology, structural access, and coding practices could produce the observed joint pattern, and what source-specific observations would distinguish those mechanisms?" We should not choose one explanation until it survives discriminating tests.

## Research sequence after internal code acceptance
**Orient:** confirm mission, population, years, units, geography and target construct.  
**Audit:** independent NCI/CDC source re-extraction, source versions, stage completeness, eligible denominators.  
**Map:** Hinds, Harris and a justified Colorado comparison plus matched large counties; designed, operational and experienced realities.  
**Gap:** missing all-stage disease burden, abnormal-result resolution, exposures, policy timing, independent experiences and rivals.  
**Align:** select fit-for-purpose descriptive, multilevel, interrupted time-series or DID designs based on actual available data; do not force DID.  
**Act:** only authorized reversible improvement trials with clear core functions and adaptable forms.  
**Track:** incidence, screening, diagnostic completion, late-stage incidence, adverse effects, costs, reach, equity and fidelity separately.  
**Adapt / Share / Re-map:** independent review and documented limits before any external discussion.

## Acceptance and status
The test file `apps/dis-platform/tests/evidence-action-redteam-exercise.test.ts` asserts eight bounded contract scenarios. A passing test establishes that the current contract behaved as coded on synthetic/public-curated inputs; it **does not** close GAP-R1–R5 or validate an empirical method. No external conversation, medical data retrieval or production promotion is part of this branch.
