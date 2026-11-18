# Learner Methods — Portable Grade 4 Instructional Core

**Candidate, not released.** This is a reusable method module and executable test contract, not another consumer app, a verified PWA, an OCR service, a clinical assessment, or an approved deployment. The consumer learning product is WholeMind Learning (original Replit workspace “Education made easy”). Its canonical editable GitHub source and deployment parity still require reconciliation.

## What the candidate actually implements
- Grade 4 support without needing diagnosis or classifying a fixed learning style. Optional transient context such as dyslexia or auditory-processing difficulty suggests user-selectable supports, but no condition or person identifier is stored.
- Two-digit multiplication with correctly calculated four-cell area models; concrete → representation → place value → guided problem → independent problem → delayed revisit.
- An optional Turtlehead mnemonic as a procedural memory cue, not as a proven treatment or conceptual substitute.
- Feedback for missing tens rows, wrong operation or incomplete partial products, without speed-based ability judgments.
- Strict local photo/PDF file-type and size screening, accurate skill detection from typed/pasted worksheet text, and explicit refusal to pretend a photograph was read when OCR is absent.
- Independent practice and spaced-review scheduling with separate day and problem requirements; no inflated diagnostic or retention claims.

## Proof and limits
Run: node --test packages/learner-methods/core.test.mjs
Run: node --check packages/learner-methods/core.mjs
GitHub Actions workflow: .github/workflows/learner-methods.yml.

The core has **no network, identity, student file storage, school import, OCR, image assets, cross-device data persistence, or app interface**. Source tests cannot certify any of these or App Store readiness. Do not present it as finished WholeMind functionality.

## Reuse plan and separation
Extend existing WholeMind's math games, Pre-K–5 manipulatives, reading practice and actual parent flows; do not create a competing WholeMind instance. Adapt the same contract through product-owned integrations for Perfectly Different learning support and ChildCORE district learning, preserving separately authorized records and role boundaries. Do not deploy from Perfectly Different's preservation-only repository.

Before any production merge, map exact deployed/user source and in-flight changes, independently review child privacy, preserve identifiers, authenticate guardian/child ownership server-side, add private homework intake with authorized and correctable OCR, persist progress through an approved backend, and run actual iPad/iPhone/Android/Desktop browser tests plus ISS-EBEAS v1.1 and IRON-ENG-001 release gates. Native store packaging follows verified PWA acceptance.

Triage: L4 feature code, L2 unresolved privacy concerns for any production learner data. Owner: ISS product/release owner. Rollback: reject/revert this PR; no production changes made.
