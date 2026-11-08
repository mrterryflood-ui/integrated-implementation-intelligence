# Owner reproduction: DIS coupled research and implementation
Internal methods-development exercise, November 7, 2026. All nine fixtures are SYNTHETIC. No participants, patient records, external services, credentials, model inference or intervention are used.

## Run from the repository or archive root
Prerequisites: Node 22.16.0 or compatible newer Node with TypeScript stripping, and Python 3 with its standard library. Tested locally with Node 22.16.0. Type stripping may print an experimental-feature warning. Do not install packages to run these commands.

```bash
node --experimental-strip-types research/dis-double-helix-20261107/reproduce.mjs
python3 research/dis-double-helix-20261107/verify_results.py
```

Expected console results: nine synthetic scenarios pass; nine are cross-checked by Python rational arithmetic. Outputs are written to `research/dis-double-helix-20261107/results/results.json`. The output records SHA-256 hashes of fixture and production-module inputs. Save your output separately before modifying any fixture.

The reproduction imports the **actual pure modules** from `apps/dis-platform/lib/`: the new pretrend diagnostic and the already-existing outcome-equity assessor. It does not substitute an invented causal estimator or reimplement the whole platform. GitHub full application tests and browser acceptance remain separate.

The supplied archive also contains `tests/pretrend.test.mjs`, the locally executed 24-case negative-test companion, runnable as:

```bash
node --experimental-strip-types --test tests/pretrend.test.mjs
```

The equivalent native TypeScript tests are committed under `apps/dis-platform/tests/` and run through the existing application test workflow. The standalone archive is a reproduction subset, not a full application checkout. Full application dependencies and authentication are intentionally not included.

## What to examine
- Divergent preperiod slopes: treated +2 units/year, comparator 0, gap +2. This challenges a written declaration but is not a significance test.
- Constant observed gap: 0 slope and 0 range; parallel untreated postperiod outcomes remain unproven.
- Nonlinear gap: 0 linear slope but range 4 and nonzero residual variation. Zero slope is not absence of pattern.
- Uneven years: slope uses actual elapsed time rather than row number.
- Missing values: rejected rather than substituted with zero.
- Aggregate +10 percentage points while one subgroup falls 10 points: adverse signal preserved.
- Composition reversal: total 26% to 64% while both groups fall 10 percentage points. No equitable-success claim.
- Suppressed cell: no reconstruction.
- Changed measurement definition: reopen measurement before arithmetic.

## Your reproduction record
Record your environment, exact source revision or archive hash, commands, input hashes, output differences and interpretation. A clean rerun is computational reproducibility. A second language written by the same developer is a cross-check, not independent-investigator replication. No synthetic pass establishes field benefit, equitable outcomes, method superiority or validity of a cancer causal design.

The code emits `parallelTrendsEstablished:false`, `causalEffectEstablished:false`, and `equitableSuccessEstablished:false` where relevant. These are limits of the available evidence, not proof that any intervention is ineffective.

## Scope and provenance
Parent revision: `daaf915c5fe9eeb48945ee1b9519533876a5511f` on PR #75. Existing equity module Git blob: `898472e9eb6c0cee20638e1cce4282ce2c269530`. The new diagnostic is integrated through the existing counterfactual wrapper and existing UI issue list; no parallel dashboard or RPLICE algorithm is added.

Read `docs/dis/DOUBLE-HELIX-RESEARCH-IMPLEMENTATION-PROTOCOL-2026-11-07.md` for the prior-art map, equity and measurement contracts, three-arm protocol reconciliation, remaining gates and references. No Dartmouth or other external contact is authorized by these materials.
