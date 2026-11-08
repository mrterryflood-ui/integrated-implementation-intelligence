# CRC Original Archive Verification — Execution Receipt
**Date:** 2026-11-08. **Scope:** Original retained public aggregate archive, not new NCI extraction or patient-level records. Independent local verification by research execution agent, separate from independent judge.

## Source and integrity
- GitHub Actions artifact ID **13589404488** downloaded via authenticated GitHub connector; containing ZIP SHA256 **ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a**. This matches `replay_retained_county_archive.py` EXPECTED_ZIP_SHA256.
- ZIP contains 20 entries; 18 are listed in `MANIFEST_SHA256.json`; all 18 entry SHA256 checks passed. The manifest itself and `readiness.json` are protected by the outer ZIP hash, not individually listed in the internal manifest.
- Acquisition receipt revision: `73455a439f950ffa0644d5714843b06b173f029a`. **Do not silently substitute this for the workflow head revision** `312577b8e43efadaceb4b834dc524dc11368d3fe`; replay contract reports mismatch and preserves both.
- Four original HTML sources all have `ORIGINAL_BYTES_RETAINED` acquisition status and their hashes match the receipt:
  - hinds_all: `83484db2208ea5914aa588e19118ca150645d69fba35316aa9688198ce2f1aa6`
  - hinds_late: `130843a055b089fb0471ab559fb214ee3b7efda90b18f94727ef8e09d64226ca`
  - harris_all: `aec6d2b4d7e9c7ac7ddbf2a30c7d700286ac6eab4e8a0ff88ca4a1c983feb456`
  - harris_late: `a04b3b49759d680ccd4bb508e5bd68713e1a6516bb9c8c951c5c21a623522af3`
- Original HTML headings each confirm Colon & Rectum, All Stages or Late Stage, **2019–2023**. Extracted CSV county rows checked directly against retained originals via prior source parser contract (synthetic tests cover mismatch rejection); current execution independently checked original headings, CSV cells and source hashes.

## Reproduced retained county rows
| County | All-stage age-adjusted incidence/100k (95% CI) | Late-stage incidence/100k (95% CI) | All-stage avg annual cases | Late-stage avg annual cases | Reported late-stage case share |
|---|---|---|---:|---:|---:|
| Hinds MS | 46.4 (42.6–50.5) | 29.9 (26.8–33.2) | 118 | 75 | 63.7% |
| Harris TX | 38.0 (37.2–38.9) | 23.9 (23.3–24.6) | 1732 | 1098 | 63.4% |

Late-stage incidence gap = 6.0/100k; all-stage gap = 8.4/100k; reported late-stage share gap = 0.3 percentage points. Quotients of age-adjusted rates differ from case-based shares. Symmetric decomposition 5.34804 incidence contrast + 0.65196 rate-quotient contrast = 6.0; **descriptive algebra only**.

## Newly surfaced trajectory contrast
The retained **all-stage** CSV rows also report:
- Hinds: recent trend **falling**, 5-year incidence trend **−2.1%/year (95% CI −2.7 to −1.5)**.
- Harris: recent trend **rising**, 5-year incidence trend **+2.1%/year (95% CI +0.3 to +3.4)**.
These trends appear in the same 2019–2023 source tables; verify joinpoint model definition, underlying years, age/race stratification and whether trends are comparable before interpretation. **Do not infer a causal policy or clinical explanation.** This is an important new hypothesis generator and pressure test of static headline comparability.

## What is now established and what is not
**Established:** retained archive bytes match expected digest; all internal manifest hashes match; four original source hashes match acquisition receipt; archived 2019–2023 source headings and county data are reproduced. This is stronger than arithmetic from typed inputs alone.

**Not established:** fresh current NCI release; independent agency corroboration; statistical equivalence of stage shares; race/age subgroup mechanisms; first-signal clinical pathways; patient-level linkage; preventable late-stage outcomes; intervention effects; transfer to other diseases.

## Reproduce
1. Download GitHub Actions artifact 13589404488 from `mrterryflood-ui/integrated-implementation-intelligence`.
2. Confirm `sha256sum github-actions-artifact-13589404488.zip` equals the digest above.
3. Run `python research/fragmentation-harm/replay_retained_county_archive.py github-actions-artifact-13589404488.zip`.
4. Review output `revision_binding_state`, four county `results`, six `comparisons`, and original `acquisition_receipt.json`. Do not suppress revision mismatch.
5. For trend contrast inspect `extracted/hinds_all_table_0.csv` and `extracted/harris_all_table_0.csv`, columns `Recent Trend` and `Recent 5-Year Trend ...`.

## Next research questions
- Do opposing aggregate trends persist within age/race strata, or are they explained by population composition, ascertainment, screening, migration or period differences?
- Can we obtain valid denominators and first-warning-sign longitudinal evidence for historically admissible decisions?
- Which source releases and instruments were available at each relevant decision date?
- Does the early-to-late and all-stage outcome vector behave differently after accounting for competing mechanisms?
