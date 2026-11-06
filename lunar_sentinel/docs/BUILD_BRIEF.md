# Bounded Build Brief — Pending Final Proposal Integration

## Mission

Build a deterministic, reproducible research simulation — not operational flight software — to test whether a lunar habitat can retain an explicitly bounded operational safety argument when observations, local connectivity, and component configurations change.

## Core hypothesis

An evolving lunar habitat can retain an explicitly bounded operational safety argument when observations, local connectivity, and component configurations change, correctly declaring when its safety claim no longer applies without trusting expired evidence, spending the same resource twice, or extending a contract beyond its assumptions.

## Architecture rule

Two independent paths are required:

1. **Path A:** essential local protection using local measurements, validity checks, local safety monitor, preauthorized protective controller, and protected actuator gateway.
2. **Path B:** versioned sensor adapters, uncertainty estimates, cascade forecast/planner, action proposal, safety gate, authority/deadline arbitration, and discretionary action for crew approval.

Neither Path B nor the ledger may block urgent protection.

## Outputs

- Architecture SVG for chart center
- Service tradeoff SVG for technical narrative
- Results manifest JSON
- Results summary Markdown
- Claim ledger
