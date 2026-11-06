# DIS Inquiry Integration — Council Research Workflow and Release Acceptance

**Date:** 2026-11-06 | **Release scope:** existing DIS Council research/consultation workflow only | **Status:** research-stage functionality; clinical and causal validation NOT established.

## Mission and counterfactual

Move the existing DIS INQUIRE methodology from a standalone tested library into the working Council research journey so that a human investigator can ask **what phenomenon is being examined, what each instrument measures, which competing explanations survive, and what would falsify the preferred account**.

Counterfactual: without this change, the researcher can read policy and use the separate Decision Lab, but the Council's actual research workflow does not present or enforce the Inquiry method's questions. With the change, Council model strands receive a server-computed method preflight, the decision receipt identifies open investigation gaps, the browser offers a local editable method studio, and draft exports retain the methodological qualifications.

## Reuse audit

Existing and preserved:
- `lib/dis-inquire.ts`: question-first method and falsifiable hypothesis engine; no clinical conclusions.
- `lib/council-evidence-mesh.ts`: time/scope/reference duplication and source metadata review; no independent claim verification.
- `lib/council-engine.ts`: five existing Council inference strands and authorization/quality gates. The method preflight is injected into the **same bounded prompts**, not new model invocations.
- `lib/council-engagement-assurance.ts`, `app/council-readiness.tsx`, and `lib/consultation-package.ts`: existing result/receipt/UI/export points.
- `app/consultation-studio.tsx`: user's actual research/consultation workspace, with explicit external research consent and existing protected-data boundaries.

New:
- `lib/council-inquiry-bridge.ts` maps the research question and retrieved bibliographic leads to a **preliminary method review**. Crucially it does **not** invent observations, instruments, a scientific cohort, a causal estimand, a successful treatment, or an approved decision from abstracts.
- `app/inquiry-method-studio.tsx` creates a local-only interactive investigation workflow for phenomena, alternatives, falsifiers, instruments, study claims, comparison and post-success stewardship. It neither fetches sources nor saves personal data nor invokes models.
- Tests confirm Council context, UI presence, source-state limits, exports, and actual desktop/iPhone browser interaction without an external model call.

## Distinct evidence rungs

| Rung | What it means | This change |
|---|---|---|
| Scientific method specified | Inquiry contract and questions defined | Existing and reused |
| Method integrated | Existing Council and research workflow consume it | Implemented; subject to exact-head acceptance |
| Engineering tested | Synthetic/negative tests and full browser path pass | Pending CI witness |
| Original source independently appraised | Source methods and claims checked outside the generated report | NOT DONE |
| Independent decision improvement observed | Blinded comparator evaluation and real meaningful outcomes | NOT DONE |
| Clinical safety or agency approval | Actual relevant authority and appropriately validated tools | NOT CLAIMED |
| Cross-product adoption | AIDE, HerHealth, ThriveUp, RPLICE each accept and test in their own source | NOT IMPLIED |

## Meaningful correctness constraints

1. Bibliographic evidence is a research lead, not an actual sensor/instrument. The bridge sets instruments and study effects empty until separately documented.
2. Multiple Council lenses are conceptual prompts, not independent human reviewers or additional data sources.
3. The Inquiry engine never chooses or eliminates a diagnosis, disease, theory, policy or source. Even a well-specified hypothesis exclusion needs external evidence adjudication.
4. A missing construct, falsifier, target outcome, future owner or counterfactual remains an open question. A clean deterministic assessment is **not certification**.
5. User-entered Inquiry notes remain browser-local; the researcher must explicitly elect to export. Do not place PHI or sensitive records in the scratch editor.
6. Existing Council external-research consent, authentication, provider quota and source audit stay in force. The editor can run locally even without external research consent.
7. No Copilot or paid Replit work, new databases, tenant-crossing connectors, schema migrations, clinical alerts or autonomous actions.
8. Production release must verify exact tested head, merge revision, Vercel target and live Council route; mock-only CI is not scientific validation.

## Cross-product next adoption

AIDE-Core in `mrterryflood-ui/VAtool` already has an investigation preflight and claim ledger; extend that, preserving claim-span provenance, tenants and synthetic-only evidence restrictions. HerHealth has separate clinical/privacy gates; adopt methodological questions in **research/education**, not patient-specific recommendations. RPLICE's authoritative standalone runtime should be identified before connecting; a pitch deck is not acceptance evidence. ThriveUp should link the same inquiry to program outcomes without converting service volume into demonstrated benefit.

**Release decision:** A clean branch may be merged and shipped as an investigational tool. It is neither a licensed diagnostic device nor evidence that DIS improves outcomes. Follow with a real independent method-comparison pilot before expanding high-stakes claims.
