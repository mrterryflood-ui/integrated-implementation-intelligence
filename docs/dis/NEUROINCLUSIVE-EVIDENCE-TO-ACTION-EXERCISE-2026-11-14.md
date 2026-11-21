# Neuroinclusive health — connected evidence-to-action exercise

**Date:** 2026-11-14. **Owner:** ISS LLC. **Status:** source candidate on feature branch, synthetic demonstration only; no human/clinical acceptance, no patient data, no institutional contract or approved clinical intervention.

## Why this is a connected implementation experiment

Question → population → published comparative evidence and its limits → local measurement gap → competing explanations → affected stakeholder participation → proposed clinician-led intervention → clinical/privacy gates → responsible follow-through → comparator/outcomes/harms/cost → reassessment and sustainment.

This exercise extends, not replaces, the existing DIS research studio, the existing 20-stage implementation journey and the human-selected RPLICE specialist method handoff. It neither reimplements RPLICE algorithms nor transfers source data to RPLICE. A submitted study reference is NOT a measurement of a potential partner's patients.

## The ten research exercises and original publications

| Topic | DOI | Intervention gap to evaluate |
| --- | --- | --- |
| Autism, child constipation | 10.14309/ajg.0000000000003967 | Recognize concern, clinician-approved treatment support, reassessment |
| Autism, urinary/continence | 10.1007/s10803-024-06663-1 | Adapted continence assessment and safe follow-through |
| ADHD, constipation and fecal soiling | 10.1177/10870547261469626 | Co-occurring conditions and medication review under a clinical owner |
| ADHD, urinary symptoms | 10.3390/jcm11216393 | Distinguish claimed/observed symptoms and evaluation |
| Intellectual disability, colorectal screening | 10.1001/jamanetworkopen.2025.57013 | Complete eligible screening and actionable positive-result follow-up |
| Intellectual disability, bowel cancer evaluation | 10.1186/s12916-026-04906-9 | Appropriate symptomatic evaluation, diagnostic and treatment closure |
| Down syndrome/intellectual disability, multimorbidity | 10.1016/s2468-2667(23)00057-9 | Select one clinically appropriate condition pathway |
| Autistic adults, cardiometabolic | 10.1038/s44220-025-00546-9 | Access to existing guideline-based monitoring |
| Neurodevelopmental youth, sleep | 10.1111/jsr.13122 | Clinician-led sleep assessment and function |
| Intellectual disability, illness and behavior | 10.1136/bmjopen-2025-111117 | Consider physical health, environmental and other possible causes without presumption |

The cited studies use different populations, instruments, controls and observational designs. They do not collectively establish a common biological mechanism or clinical effect of ISS software. All site-specific baselines remain unmeasured; the exercise deliberately blocks a local-claim upgrade. No universal additional invasive testing or screening-age change is proposed.

## First implementation-ready use cases, subject to institutional approval

**Candidate A — pediatric bowel/bladder:** Accessible symptom observation by person or appropriately authorized supporter → clinician evaluation → care plan and needed navigation → clinician-directed follow-up and validated symptom/continence/quality-of-life measures → documented resolution, justified observation, or continuing plan. No automated diagnosis or medical treatment.

**Candidate B — adult intellectual disability colorectal-screening navigation:** Clinician-confirmed guideline eligibility or separate symptomatic evaluation → accessible patient-supported choice → appropriate screening and, if positive, clinical diagnostic follow-up → resolution or authorized care handoff. A test order is not closure; informed refusal is not a technical failure.

## 60-minute MAP–GAP implementation-design rehearsal

0–10: Mission, people, end state, competent current care and counterfactual.  
10–20: Published evidence, rival mechanisms, source units, and designed/operational/experienced reality.  
20–30: Actual workflow, service constraints and stakeholder power/consent map.  
30–40: Candidate intervention, source fit and clinical approval gate.  
40–50: Delivery owner, navigator, resources, financing path and safe escalation.  
50–60: Measures, denominators, comparator, participant experience, adverse effects, adaptation and closure criterion.

A 60-minute design session produces a *draft plan*, not a clinical implementation or patient benefit.

## Responsibilities and release gates

| Role | Required evidence | Current state |
| --- | --- | --- |
| ISS engineering lead | Exact-head unit/type/browser checks on real DIS UI; no new datastore or API | Candidate source committed; CI pending |
| Independent code reviewer | App behavior, source semantics and no-write/authority boundaries | Not yet performed |
| Pediatric and adult clinical owners | Signed clinical eligibility, safe triage and follow-up rules | Unassigned |
| Self-advocates and family representatives | Actual consented co-design and accessible comprehension | Not yet recruited |
| Independent methods lead | Define cohort, outcome, denominator, control, harms and effect estimand | Proposed only |
| Data controller and privacy counsel | IRB/QI review, DUA/BAA, role access, consent and security as applicable | Not obtained |
| Institutional buyer and ISS commercial lead | Genuine buyer problem, paid discovery SOW, delivery capacity, pricing, liability and IP/data rights | Not contracted |

**Measures:** eligible people and screened people separately, clinician-assessed concerns, appropriate disposition, referral/testing closure, 30/90/180-day follow-through where justified, condition-specific symptom/function, autonomy and equity, adverse events, overtesting, workload, security and incremental costs. Missing data cannot be scored as zero. Primary downstream impact requires comparative evidence and longer follow-up.

**Counterfactual:** competent existing clinical and navigation pathways. Select a justified randomized, staggered, matched or interrupted-time-series design. Do not claim causal savings or prevented deaths from a training completion, referral creation or faster dashboard workflow.

## Source and implementation acceptance

**Before:** Real DIS research studio, published Jackson cancer case, custom unsourced mode, twenty-stage journey, RPLICE HIL selection and bounded public research metadata. **No ten-topic neuroinclusive choice**.

**Change:** One source-bounded library of ten study-to-action cases, a select control in the existing UI, unit and browser acceptance tests. No new clinical model, server, patient database, credentials, automation, external messaging or EHR connection.

**Why:** Make the existing software exercise a second domain with clinical outcome concepts and an explicit evidence-to-implementation counterfactual, proving domain-agnostic reuse rather than building another research dashboard.

**Proof:** Exact-head GitHub PR CI must run TypeScript and test suite plus Chromium/iPhone rendered research program checks; independently review clinical and data authority before use. Passing source-code checks does not imply a live patient journey. Candidate read-only browser checks monitor HTTP writes.

**Release:** HOLD for merge, public deployment, live data, production integration, institutional outreach or commitments until the respective reviews and owner approval. Rollback is reversal of the additive source/UI/test change; no schema or patient data migration.

**Decision:** CONDITIONAL GO for synthetic demonstration and partner discovery preparation. Clinical use and claims of monetizable efficacy require pilot evidence, sponsor agreement and appropriate regulatory clearance.
