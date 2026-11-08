# DIS Explanation Observatory — Source discrepancy and mechanism ledger
**Revised 2026-11-07. Source inspection and arithmetic, not a causal estimate, independent human scientific review, or intervention recommendation.**

## Correction C-001: our prior Harris record mislabeled the observation window
The earlier version of this ledger described the Harris rate 23.9 (23.3–24.6), annual count 1,098 and case share 63.4% as 2018–2022. The retrieved NCI page explicitly labels these values **2019–2023**, based on the SEER November 2025 submission. Our earlier comparison of Hinds 30.4 (2018–2022) with Harris 23.9 (2019–2023), including the 6.5 rate difference and 27.2% relative difference, is **withdrawn as a matched-period comparison**. Git history retains the original error. It must not be propagated into analysis, simulations, public materials or recommendations.

The source-label error was ours; the source pages do not establish an NCI data error. Retrieved web representations may be cached. Original HTTP response bytes have not been archived in this run; source inspection is not a live ingestion or immutable-source-storage receipt.

### Two distinct source-reported county comparisons
| Observation period | County | Late-stage adjusted incidence per 100,000 annually (95% CI) | Average annual late-stage cases | Published late-stage share |
|---|---|---:|---:|---:|
| 2018–2022 | Hinds, Mississippi | 30.4 (27.3–33.8) | 76 | 63.3% |
| 2018–2022 | Harris, Texas | 23.3 (22.7–24.0) | 1,044 | 63.4% |
| 2019–2023 | Hinds, Mississippi | 29.9 (26.8–33.2) | 75 | 63.7% |
| 2019–2023 | Harris, Texas | 23.9 (23.3–24.6) | 1,098 | 63.4% |

Period-matched descriptive arithmetic is 7.1 per 100,000 and ratio 30.4/23.3 ≈ 1.305 for 2018–2022; 6.0 per 100,000 and ratio 29.9/23.9 ≈ 1.251 for 2019–2023. These are reported-rate contrasts, not individual risk ratios, effects of a program, or independent replications. The five-year windows overlap by four years and cannot establish an annual trend or treatment effect.

Original-source locations inspected on November 7, 2026:
- Hinds 2018–2022: https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&graph=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=count&stage=211&statefips=28&type=incd&year=0
- Harris 2018–2022: https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=name&stage=211&statefips=48&type=incd&year=0
- Hinds 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&stage=211&statefips=28&type=incd
- Harris 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&stage=211&statefips=48&type=incd

**Remaining scientific checks:** preserve original response bytes and parser versions; independently confirm rows; verify the exact published percentage denominator, including treatment of unknown stage; reconcile staging and age-standardization details across registry systems; obtain compatible all-stage and age-specific data. The inspected table notes define regional/distant late stage but do not by themselves establish the full percentage-denominator rule. Our synthetic 'late among staged' example is not proof that this is the NCI denominator. Hinds is not Jackson city; Harris is not Houston city.

**Source time model:** retain observation window, registry submission/release, page-render date, retrieval timestamp and decision/analysis time separately. A page creation date is not the registry release. New-window data are not a silent correction of an old-window observation.

## Discovery 002: national three-cancer coefficients
The prior pinned 50-state curated analysis reported colorectal–lung Pearson r near 0.735 for late-stage incidence rates versus 0.129 for late-stage case shares. These are different estimands. Two secondary figures remain disputed: colorectal–breast share Pearson 0.234 vs 0.231; lung–breast share Spearman 0.413 vs 0.410. This revision has not reproduced or independently source-adjudicated those coefficients. Reconstruct the original source rows, code, population filters, weighting, rounding and tied-rank rules before further inference.

**Decision:** preliminary descriptive results retained; no new correlation or mechanism claim. Require a complete, condition-specific 50-state matrix and explicit sampling/spatial assumptions before uncertainty calculations. Do not treat a national total, DC or Puerto Rico as additional states. Do not treat overlapping rolling windows as independent timepoints.

## Discovery 003: NSFG gynecologic diagnosis and ascertainment
NCHS Health E-Stat 121, July 2026, reports weighted ever-diagnosed estimates among female respondents ages 20–49: endometriosis 6.2%, PCOS 8.7%, fibroids 7.8%. These are reported diagnoses, not independently established biological prevalence. The report is bivariate and does not identify the cause of subgroup differences.
Source: https://www.cdc.gov/nchs/data/hestat/hestat121.htm

The verified NSFG file index offers a more precise research map:
- ENDO, PCOS and UF: ever-reported diagnoses; ENDOCURR and UFCURR: reported current status.
- UFSONO: reported ultrasound confirmation, not independently inspected imaging.
- ENDODIAG and UFDIAGNOS: time since diagnosis, **not** symptom-onset-to-diagnosis delay.
- ENDOLIM, UFLIMIT and condition-specific treatment fields: functional impact and reported treatment, subject to questionnaire routing.
- PCOSSYMP_1 through PCOSSYMP_7: reported basis of diagnosis, not an independently applied diagnostic standard.
- AGER, HISPRACE2, USUALCAR and MED_COST: potential age, race/Hispanic-origin and care-access context; time frames, coding and causal roles require review. Current or past-year access cannot automatically explain a lifetime diagnosis.

Index: https://www.cdc.gov/nchs/data/nsfg/fileindex/2022-2023-NSFG-FileIndex-FemRespPUF.pdf (printed pages 20, 21 and 24).
Design variables: VEST (stratum), VECL (cluster), WGT2022_2023 (weight). See https://www.cdc.gov/nchs/data/nsfg/varest/2022-2023-NSFG-DesignandWeightVariables.pdf and official variance examples at https://www.cdc.gov/nchs/data/nsfg/varest/2022-2023-NSFG-VarEst-all.pdf .

**Inference correction:** opposite observed diagnosis patterns do not prove that shared access mechanisms are absent; shared barriers can coexist with different underlying occurrence and recognition. Neither a universal common cause nor entirely separate causes are established. Disease occurrence, diagnosis opportunity and reporting remain competing and potentially interacting mechanisms. Full response coding/skip logic and design-weighted microdata replication remain open; the large codebook was not fully retrieved in this pass.

## Continuous-system acceptance
The architecture must retain source bytes, typed measure definitions, immutable observations, scope-specific analysis plans, reproducible runs, contestable claims, independently authenticated reviews, owner-authorized actions and outcomes. New data must trigger dependency-based reopening, not automatic replacement or clinical action. Source retrieval, descriptive replication, mechanism identification and operational benefit are separate completion states.

Continue in the existing draft PR and existing DIS/RPLICE boundaries. No production release, scheduled collector, external correspondence, institutional commitment, source independence, or health benefit is established by this ledger. The sustainable operating architecture and its coverage obligations are specified in THREE-STUDY-SUSTAINABLE-ARCHITECTURE-v0.2-2026-11-07.md.
