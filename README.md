# integrated-implementation-intelligence

Canonical doctrine for all agents: Integrated Implementation Intelligence (III).
Diagnostic Implementation Science, human-in-the-loop controls, evidence discipline,
local sovereignty, and connected implementation measurement.

## What lives here

- `doctrine/integrated-implementation-doctrine.md` — the full doctrine text: the
  lifecycle (attunement → verified execution → synthesis → homeostasis), the
  invariants, and the amendment rules.
- `doctrine/integrated-implementation-intelligence.md` — the III skill text: the
  operational instructions an agent follows to apply the doctrine.
- `platform-doctrine/` — the packaged, installable form (a single master skill:
  ADIS triage, Preflight, the C1–C9 invariants, builder/verifier separation,
  tiered audit, Build Ledger postflight) with references and templates.
- `PROVENANCE.md` — where every file came from, when it was canonicalized, and
  the rules of this repository.

## How it is consumed

- **Agents and skills:** install `platform-doctrine/` as a workspace skill; read
  `SKILL.md` first, every time, before touching code.
- **Products:** product repos carry their own distribution of the doctrine and
  their product-specific deltas. This repo is the source they synchronize from,
  not a place to add product content.
- **Enforcement:** the [Doctrine-Enforcer](https://github.com/mrterryflood-ui/Doctrine-Enforcer)
  compiles the invariants into executable scans and a fail-closed CI gate; the
  invariant definitions remain here.

## Status

Canonicalized 2026-09-27 from the HazardAware doctrine lineage (docs) and the
LineReady packaged platform-doctrine (zip). See `PROVENANCE.md` for the lineage
map and open items.
