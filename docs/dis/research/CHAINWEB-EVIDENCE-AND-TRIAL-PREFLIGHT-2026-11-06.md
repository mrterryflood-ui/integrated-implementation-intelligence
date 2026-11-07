# ChainWeb independent method-validation preflight and reproducibility — 2026-11-06

This evidence package is **a preregistration-ready research-methods preflight, not an intervention-effect study or evidence that ChainWeb improves outcomes**.

## What has actually run
- Source-qualified selected casebook: 8 published cases (5 randomized intervention studies; 1 observational implementation/cost program; 1 observational PCOS underdiagnosis study; 1 FRAME-IS methodological application).
- 9 within-study numerical contrasts, preserved with endpoints, denominators, CIs and restrictions against pooling incompatible metrics.
- 9 deterministic evidence-integrity and false-claim tests: **PASS**.
- 7 paired trial-design integrity tests: **PASS**.
- 16 randomized, equal-evidence analyst packets (8 evidence cases × 2 methods) prepared with fixed seed **20261106**.
- Baseline: updated CFIR + iterative PRISM/RE-AIM + FRAME-IS, including appropriate causal tools and full expert support.
- Experimental: identical baseline **plus** ChainWeb evidence/uncertainty/dependency/corrective-action and sustainment logic.
- Researcher outputs: **NOT SUBMITTED**; independent adjudicators: **NONE**; independent gold labels: **NONE**; registered protocol: **NO**; comparative treatment-effect estimate: **NOT ESTIMABLE**.
- Executed remote RPLICE specialist methods: **NONE**; patient intervention/long-term outcome measurement: **NONE**.

## Local independent reproducibility
The downloadable evidence bundle contains `evidence_casebook.json`, `validate_casebook.py`, `test_casebook.py`, `comparative_trial.py`, `test_comparative_trial.py`, `comparative_study_packets/*`, and the full protocol. It uses only Python 3.10+ standard library.

```bash
python -m unittest -v test_casebook.py test_comparative_trial.py
python validate_casebook.py
python comparative_trial.py
```

16 tests pass on the package as frozen. Test pass means package/schema/claim guard integrity, **not** medical validity or superiority. No paid agents or network operations required.

## Source-of-truth receipts (SHA256 from local execution snapshot)

| Artifact | SHA256 |
|---|---|
| evidence_casebook.json | `8dfa849984ea88ac7c0cf4a7a3d7884496c9bc252f8b1d3b66ec254202759d4b` |
| validate_casebook.py | `88c2a2bffc79da7bfb6c8369960c6b64ef95cd95d0539f89c6b06ed701bc0727` |
| test_casebook.py | `4b1e7c63252339ac2aca86950fcf65d1d343f1a51459fb0379caa7e25f123bd5` |
| comparative_trial.py | `10763693f988783e252cab05203d963c7bc050b1804b9df816145034708a3f3c` |
| test_comparative_trial.py | `55196fa084a1674c4e2e4fbd783ffe7da36377d2f67e96bea603633994f6d5dc` |
| method_validation_protocol.md | `cfee702e97934b559103d4d71b139ce3436e25bc52711a4f8b2018671f5a3c46` |

## Acceptance obligations
G0 public studies independently source-verified and checked; G1 deterministic integrity; **G2** preregister study and establish independent expert reference labels; **G3** obtain blinded analyst outputs and independently adjudicate comparable methodological benefit/harm/cost; **G4** only then develop authorized actual site implementation; **G5** observe real sustainment and external transfer.

No material claims about ChainWeb superiority, clinical benefits, or implementation in a real setting are supportable until the relevant gates actually pass. This document does not authorize any participant recruitment, data sharing, external messages, clinical recommendations or platform deployment.

## Scope protection
Keep six-condition population-health inquiry, related open cancer/GIS PRs #57/#58 and the user's pinned later transfer into existing healthcare equity platforms separate from this methods validation. See [preservation register](./CHAINWEB-PRESERVATION-AND-TRANSFER-REGISTER-2026-11-06.md).
