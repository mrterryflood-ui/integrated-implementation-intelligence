# ChainWeb: expanded empirical test, counterevidence and executed repairs

Executed November 8, 2026, on parent f19291fe47da0d9731831a38b504c12680f74e74. Public aggregate research; no clinical data, outbound messages, spending, login changes or production deployment. This advances Issue #81 H1/H2 and the cross-condition counterfactual question. It does not close H3/H4 or the independent-review gate.

## Original-source expansion actually executed
The retained original State Cancer Profiles tables contain all 82 Mississippi and 254 Texas counties. The analysis rehashed artifact 13589404488, SHA256 ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a, all 18 manifest members and four acquisition source hashes. It compared all **672 county-stage rows and 4,368 HTML/CSV cells**, with no disagreement. The period is 2019–2023, both sexes, all ages, all races. This is the accepted archive, not a fresh current release. Acquisition/workflow revision discrepancy remains unadjudicated.

Main exploratory contrast: within-state pairs with late-stage case shares within 0.5 percentage points but late-stage incidence differing by at least 5 per 100k. Thresholds are exploratory, not preregistered equivalence margins or clinical thresholds. Sensitivities use 0.3 and 1.0 points. County pairs are dependent; do not report them as independent replications.

| State | Counties | Complete | Near-share pairs | Pairs also meeting rate-gap threshold |
|---|---:|---:|---:|---:|
| MS |82|75|130|65|
| TX |254|179|844|377|

At windows 0.3/0.5/1.0, near-share pair counts are MS 84/130/238 and TX 551/844/1609; corresponding rate-gap counts are MS 42/65/129 and TX 234/377/738. One-decimal rounding-robust main contrasts: MS54, TX295.

**Adversarial result:** requiring both counties to have at least 16 average annual late-stage cases removes every MS main-window contrast, while leaving 63 in TX; 33 of those TX contrasts also have disjoint marginal rate confidence intervals. The count filter is an analyst sensitivity criterion, not the source suppression rule. Interval disjointness is not a multiplicity-adjusted test. The small-count sensitivity materially weakens generalization from the MS pairs and is retained.

Coverage is selective: 70/230 rural counties (30.43%) versus 12/106 urban counties (11.32%) lack complete comparison data. This is county-weighted, not resident-weighted; suppressed values are missing, never zero. A separate pandas HTML parser and Decimal pair loop reproduced all 36 state/threshold count checks; this is independent-by-implementation, not a second agent's approval.

## A source-meaning hazard now implemented as a guard
Original State Cancer Profiles late-stage numerator is regional + distant. NCI Cancer Trends Progress Report defines colon/rectum late-stage rates as distant only, whereas female breast uses regional + distant; periods and delay adjustments also differ. Primary official source checked: https://progressreport.cancer.gov/diagnosis/stage . Same label does not mean same numerator, and neither source need be erroneous. New `compare_measurement_constructs` checks the recorded stage/site/measure/denominator/age/sex/period/delay fields and labels mismatched data complementary-but-not-poolable. Contextual evidence remains usable; field agreement does not certify scientific comparability.

## Upstream and cross-condition counterfactual synthesis
The existing Chen risk-advancement transformation was checked against Tables 2–4 of the primary full text (doi:10.1001/jamanetworkopen.2023.39670; https://pmc.ncbi.nlm.nih.gov/articles/PMC10600582/). 27/36 cells satisfy the existing 0.575-year rounding envelope; nine remain outside. This is the pre-existing unresolved reproduction discrepancy, not a new author-error finding. Full-precision coefficients/rounding/author code remain needed. No new starting age is recommended.

BLOODTRACC full text (doi:10.1186/s12885-026-16179-9) reports 24,517 primary outcomes and 26,342 with broader outcome ascertainment in the same reported sex cohorts: +1,825 (+7.44%). Capture improvement is not earlier diagnosis or prevention. Changed washout/eligibility in sensitivity models cannot be treated as a like-for-like intervention effect. https://link.springer.com/article/10.1186/s12885-026-16179-9

Autoimmune prevention now includes direct intervention evidence, not only descriptions of diagnostic delay. TREAT EARLIER 5-year report (2026; doi:10.1016/S2665-9913(26)00109-8; primary abstract https://pubmed.ncbi.nlm.nih.gov/42392130/) reports overall RA development 26/119 vs31/117, HR0.79 (0.47–1.34), but a selected ACPA-negative increased-risk subgroup 3/35 vs10/31, HR0.24 (0.07–0.87). Do not generalize a subgroup to all early symptoms or count repeated follow-ups as independent trials.

ALTO (2026; doi:10.1016/S2665-9913(25)00371-6; primary abstract https://pubmed.ncbi.nlm.nih.gov/41576971/) reports a 4.9-month arthritis-free restricted-mean-survival advantage at four years (CI0.1–9.6), diminishing over time, without persistent patient-reported outcome differences after treatment. Extension enrollment was143/213 original participants. This is a selected-population delay effect, not permanent prevention or proof of ChainWeb.

NICE NG73 (official indexed recommendations, amended2024; full-page access restricted) cautions that normal examination/ultrasound does not exclude endometriosis: https://www.nice.org.uk/guidance/ng73/chapter/Recommendations . Transferable test: persistent first-signal evidence must not be discarded by an imperfect normal test. Guidance is not an observed intervention effect; endometriosis requires pain/function/fertility/experience outcomes rather than cancer stage measures.

## Reproduced defects and repairs
Prior `validate_connection` rejected effect_estimate=0 as missing and accepted independent_review='not reviewed' as sufficient. Both were executed and reproduced. Repair permits finite zero/negative effects, validates effect measure and intervals, requires structured approved-review metadata, and preserves null/mixed/contradicted/inconclusive results. Metadata still cannot authenticate review or establish causality; no PHI filter is claimed.

Local test execution: **37 passed, zero skipped**, comprising29 new tests (including8 actual archive integration tests) plus8 legacy scenarios. CI lacking the original archive must explicitly skip those8 integration tests; CI success must not be called source replay. Scientific independent review remains pending for this batch.

## Reproduce and handoff
```bash
python research/fragmentation-harm/expanded_county_test.py archive.zip --out results
CHAINWEB_ARCHIVE=/absolute/path/archive.zip python -m unittest discover -s research/fragmentation-harm -p 'test_*.py' -v
```
Outputs: `expanded_county_results.json`, `county_extract.csv`, `within_state_near_share_pairs.csv`. The downloadable execution packet contains the original archive, second implementation, before/after defect evidence, full report, local test log and SHA256 manifest.

Research lead: retain this snapshot and multidimensional outcomes. Independent judge: challenge selection/suppression sensitivity, stage-numerator crosswalk and unresolved RAP cells. Decision-study lead: test integrated vs equal-time standard-evidence views with prespecified adjudication, including justified nonchange; real historical cases require the actual dated decision/input records, otherwise label research scenarios. Authorized clinical/data steward: establish governance and operational first-signal-to-outcome data. Roles are proposed, not accepted institutional commitments.

**Conclusion:** broader evidence supports the measurement question and specifies where integration can mislead; current intervention evidence demands population/outcome/time-specific inference. Local decision improvement, patient harm prevention and transferable ChainWeb benefit remain untested. No mission change or scientific-completion claim.
