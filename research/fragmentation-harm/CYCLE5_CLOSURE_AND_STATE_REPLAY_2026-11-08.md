# Cycle 5: tested closure correction and original-source state replay

November 8, 2026. Research/assurance contribution to the existing PR88 branch. Governing Rosetta contract: PR85 commit 18823969ffee9f6eb393891f65e00941e102b9d6. This contribution does not merge, deploy, change authentication, replace the lifecycle owner's implementation, close scientific gates or claim independent review.

## Executed, not merely assigned
The existing action_ledger.py was reconstructed and its original Git blob independently recomputed as 0d2eecadc549f8dd8382d456c45e3cdf5327fb80. Eight synthetic controls were admitted by the old validator: lone completed closure, missing action, missing outcome-status record, empty action receipt, empty closure receipt, unapproved no-action closure, unreviewed insufficiency closure and whitespace owner. All eight are rejected after the bounded correction. The original 12-test suite is unchanged and passes. Unknown outcomes and justified nonchange remain admissible; process completion is explicitly not clinical benefit. Receipt schema becomes 0.2; historical records and receipts are not rewritten. This is research-ledger enforcement, not a claim of production caller integration, authenticated owners or genuine real-world execution.

Local focused suite: 39 tests passed with zero skips in normal and optimized Python with the authorized original archive supplied. Without the archive, 34 passed and five correctly skipped. The full repository suite and exact-head hosted check are separate receipts.

## Replayed actual retained evidence
The original GitHub artifact 13589404488 was restored: 2,692,160 bytes, SHA256 ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a. All 18 manifest files matched. The public county reanalysis matched 672 HTML/CSV rows and 4,368 source cells across 336 counties. Normal and optimized outputs were byte-identical. The original archive and any reserved records are NOT committed or redistributed.

With the retained exploratory rules (case-share gap <=0.5 percentage points and late-stage-rate gap >=5/100,000):
| Quantity | Mississippi | Texas |
|---|---:|---:|
| Full county frame |82|254|
| Complete for required measures |75|179|
| Retained after annual late-stage count >=16 |15|72|
| Rural counties before / after that filter |57 / 6|103 / 16|
| Qualifying pairs before / after |65 / 0|377 / 63|
| Filtered qualifying pairs with disjoint marginal rate intervals |0|33|

Interpretation: the restriction substantially changes the observed populations. Mississippi's filtered null pattern is not proof of measurement equivalence; Texas's residual is not a causal effect. Pairs share counties and are not independent observations. Missingness is not zero, coverage is county-weighted rather than population-weighted, and the annual-count filter is NOT the source disclosure rule (<16 cases over the whole reporting period). Rounded annual counts cannot reconstruct exact case totals. This advances DEN03/06's descriptive evidence; it does not identify all causes of heterogeneity or close independent review.

## DEN01/02 remains specifically unresolved
The official State Cancer Profiles interpretation page states late-stage cases relative to all stages and suppression below 16 cases for the period. The retrieved live page describes 2018-2022, not the pinned 2019-2023 archive; it cannot silently replace that release. Its wording does not fully adjudicate the archived unknown-stage inclusion rule. NCI's standard-population page confirms the 19/20 age-band issue but does not provide the matched county stage-by-age case counts and person-time. Texas DSHS has an aggregate data request route; no request was sent, and access is not asserted. The supplied review package records an exact acquisition specification rather than fabricated inputs.

Official methods: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=020&graph=1&output=2&race=00&sex=0&sortOrder=asc&sortVariableName=name&stage=211&stateFIPS=00&type=incd&year=0 ; https://seer.cancer.gov/stdpopulations/ ; https://www.dshs.texas.gov/form/texas-cancer-registry-aggregate

## Reproduction and handoff boundary
From research/fragmentation-harm:
```
python -m unittest test_action_ledger test_action_ledger_closure test_state_sensitivity_replay -v
CHAINWEB_ARCHIVE=/authorized/original.zip python -O -m unittest test_action_ledger test_action_ledger_closure test_state_sensitivity_replay -v
python state_sensitivity_replay.py /authorized/original.zip --out /local/output
```

Expected local tested blobs: action_ledger.py 4451bc655f386d04875d1a75a6726f9df16ed646; test_action_ledger_closure.py ecf12e66cd408e87cbf5113ddd6cf21bc83bade3; state_sensitivity_replay.py 54ce2de945b01aa29bc47c9ae7e9cf2178292214; test_state_sensitivity_replay.py a1ca41914606d5f4b444dc6f02077e0cff37c846.

Designated reconciler must review and integrate; lifecycle owner still owns structured missingness and condition-adaptable saved-case behavior. Final current-revision PR87 correction/save/reopen/export witness is already recorded; do not repeat the stale pending-witness claim. This new research contribution still needs exact-head review. Scientific, human usability, integrated release, site authority, decision superiority and patient benefit remain distinct, unclosed requirements. A public clone failed DNS; no full local repository run is claimed.
