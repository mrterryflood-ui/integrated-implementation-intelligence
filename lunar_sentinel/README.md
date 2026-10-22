# LUNAR SENTINEL / Mission Homeostasis for a Decades-Long Lunar Base

This branch contains a **bounded NIAC Step A research simulation package** for the concept tentatively titled **Mission Homeostasis for a Decades-Long Lunar Base**.

## Claim boundary

This package is **not** flight software, not a lunar digital twin, not certification evidence, not NASA endorsement, and not proof of 30-year safety. It is a reproducible toy-model simulation intended to support a TRL <= 2 NIAC Step A concept discussion with honest, bounded evidence.

## Today's execution objective

Produce a software package that is reproducible, explicit about assumptions, proposal-graphic ready, and aligned with the 30-year LUNAR SENTINEL end state without overclaiming maturity.

## Run

```bash
python -m lunar_homeostasis_sim.simulation results 12
```

Outputs:

- `results/results_manifest.json`
- `results/results_summary.md`
- `results/niac_overview_architecture.svg`
- `results/niac_service_tradeoff.svg`

## Strategic end state preserved

The 30-year LUNAR SENTINEL system remains the governing architecture: a modular, distributed, provenance-bound mission-resilience operating layer for lunar, cislunar, Mars-preparatory, and Earth-analog operations. Today's package is the bounded evidence kernel for NIAC Step A, not the full system.
