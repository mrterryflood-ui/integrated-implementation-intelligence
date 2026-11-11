# Financing-matched numerical evidence

**Program date:** November 8, 2026 (America/Chicago). **Status:** Research candidate under existing PR #88 and DEN-01 through DEN-09, not an accepted patient-effect study.

This contribution builds on `ee46db8550d74619379d89007c9f53e1131e5d80`. It preserves that revision's state analysis, inputs, and earlier financing correction without edits. No merge, production or authentication change, clinical-record access, paid agent, site enrollment, or external outreach occurred.

## Conclusion

Public financing is an important comparison dimension, but it is not sufficient to establish comparable patients, benefits, services, or outcomes. The reviewed numbers show changes in apparent ranking after income stratification, trade-offs between financial protection and use, and differences within the same public program. They do not support a universal public-versus-private winner or establish a DIS clinical benefit.

## Published numerical findings

### Income stratification changes the apparent coverage ranking
MACPAC/SHADAC's 2023 NHIS estimates for adults aged 19–64 show usual-source-of-care percentages of 87.5, 88.6, and 56.9 for Medicaid, private coverage, and uninsured adults. At income at or below 138% of the federal poverty level, they are 86.6, 80.4, and 50.3. Medicaid minus private changes from −1.1 to +6.2 percentage points. This is descriptive stratification, not causal difference-in-differences. Low-income cost-delay estimates are 8.0%, 12.3%, and 30.9%; corresponding unmet-need estimates are 8.3%, 12.3%, and 30.0%. Figures 2 and 4 and Table 6 were visually checked.

Some medical-bill rows were excluded. An overall 12.2% and income-specific 75.7% and 64.6% cannot form a weighted mixture under identical exhaustive denominators. A conditional denominator or labeling difference remains possible; no source error or replacement value is asserted.

### Low-income veterans: preserve the reference and overlapping coverage
Govier and colleagues studied 2,468 veterans below 200% of the poverty level in 2015–2018 NHIS. Adjusted Table 3 changes from Medicare without VA were:

| Outcome | VA, percentage points (95% CI) | Medicaid without VA, percentage points (95% CI) |
|---|---:|---:|
| Out-of-pocket costs above 10% of income, excluding premiums | −8.13 (−14.09, −2.16) | −16.02 (−24.00, −8.03) |
| Cost-related delayed or forgone care | −6.72 (−12.80, −0.63) | −2.95 (−11.85, 5.96) |

The VA category includes overlapping coverage. Medicaid can include Medicare but excludes VA under this study's hierarchy. These are reference contrasts, not direct VA-versus-Medicaid confidence intervals. The covariance needed for a direct interval was not supplied; independent-standard-error combination would be unjustified.

### Similar income, two publicly supported pathways
Allen and colleagues compared 4,091 Medicaid-eligible and 4,091 subsidized-Marketplace-eligible Colorado adults with incomes at 134–143% of poverty in 2014–2015, using propensity matching. Adjusted annual outpatient visits were 1.73 versus 2.22; emergency visits 0.56 versus 0.36; total spending $2,484 versus $4,553; and patient charges $45 versus $569. Charges exclude premiums and are not verified payments. At common Medicaid prices, spending was $1,490 versus $1,642 (P=.17). This was not randomized and is not a comparison with unsubsidized insurance.

### Same dual eligibility, different hospital delivery
Chan's BMJ 2022 study included 583,248 veterans aged 65 or older with VA and Medicare, contributing 1,470,157 ambulance rides in 2001–2018. Adjusted 30-day mortality was 9.32 per 100 (95% CI 9.15–9.50) after VA transport versus 11.67 (11.58–11.76) after non-VA transport: a 2.35-point arithmetic contrast. The original abstract and figure descriptions were verified; complete full-text appraisal remains open. Do not confuse this study with the related AER 2023 instrumental-variable study retained by the concurrent lane. Overlapping lineage is not independent replication, and these estimates are not pooled.

### Differences within Medicaid
Geruso and colleagues used administrative random assignment of nearly 70,000 New York City beneficiaries among ten plans in 2008–2012. The lowest-spending plan generated at least 25% less spending and approximately five percentage points less monthly care use than the highest. Reductions included higher- and lower-value care. This natural experiment retains its instrumental-variable assumptions and is not a current plan ranking.

Peterson and colleagues compared 37,142 FQHC and 196,712 non-FQHC Medicaid patients with opioid use disorder using 2012 claims and overlap weighting. Non-FQHC/FQHC relative risks were 1.10 (95% CI 1.07–1.12) for timely medication, 0.90 (0.88–0.92) for behavioral therapy, and 1.35 (1.30–1.40) for potentially inappropriate opioid/benzodiazepine coprescribing. These mixed, historical adjusted associations do not identify a universal quality winner.

### Coordination and timing are endpoint-specific
Asfaw's 2024 evaluation covered approximately 3.1 million referrals in 2019–2022. Centralized physical-therapy community waiting time changed by +2.0 days (95% CI −4.8 to 8.8); centralized gastrointestinal waiting time changed by −15.2 days (−26.4 to −4.0). Most contrasts were uncertain. The clock ended on completion OR cancellation, not verified completed care.

The September 2026 VA OIG audit examined nearly 2.6 million additional-service requests from October 2024 through January 2026. Approximately 1.2 million had on-time decisions, approximately 1.4 million had notifications to either party, and average notification took about 12 days. These are not unique patients, all referrals, both-party acknowledgments, or a health-effect estimate.

### Contrary financial-intervention evidence
Two Kluender and colleagues debt-relief experiments relieved $169 million in face-value debt for 83,401 people without establishing average improvements in the studied health/utilization outcomes. The accessible 2024 primary working paper was inspected; final 2025 metadata and abstract were checked. Already-incurred debt at different collection stages is not upfront affordability. Treated reach is not the survey sample size.

## Reproducible delivery and code

The owner package contains 45 selected numeric rows, 11 primary/official source records, seven exceptions, the workbook, and a source-linked report. Input `analysis/financing_evidence.json` has SHA-256 `96a5076a306d91434dbb52c46fc1410c051e9ffcfb72514ea00fc93e3d0bed87`. This repository contribution adds the executed arithmetic consumer and portable tests; the complete curated input is in the delivered package, not a new production ingestion service.

Twenty-four software/semantic controls and five published-arithmetic methods passed: 29 tests, zero skips, in normal and optimized Python. Repeated modes are not additional methods. Arithmetic receipts were byte-identical. Full repository execution and hosted CI require separate receipts. No original microdata regression was rerun; direct-download DNS failures remain recorded.

Run from this directory:
```
python -m unittest test_financing_comparison_audit -v
python -O -m unittest test_financing_comparison_audit -v
python financing_comparison_audit.py /path/to/financing_evidence.json --out /local/receipt.json
```

The helper preserves unknown direct-contrast uncertainty, rejects same-time-only DiD classification and canceled-as-completed endpoint substitution, and rejects nonfinite numeric inputs. It does not authenticate sources, reviewers, or causal identification. Its fixed medical-bill probe is tied to this source/version, not a universal medical-debt rule. Independent acceptance remains open.

## Concurrent work and integration

The existing `health_wealth_public_analysis.py` and its inputs remain authoritative for the concurrent six-state panel; no parallel state collector was introduced. This lane checked the six 2024 colorectal-screening rates against original HRSA webpages, retaining the common 2024 column instead of mixing 2025 and 2024 page headers. The owner workbook carries a separately labeled corroborating appendix. State aggregates are not individual-clinic or risk-adjusted findings.

The designated reconciler must accept the exact integrated research revision. The lifecycle owner retains structured missingness, source-passport, and condition-adaptable saved-case responsibility. These research checks are not a production caller integration. Prior DEN exceptions, institutional authority, and observed patient outcomes remain separate requirements.

## Primary sources

- MACPAC/SHADAC, July 2025: https://www.macpac.gov/wp-content/uploads/2025/07/Access-in-Brief-Adults-Experiences-in-Accessing-Medical-Care.pdf
- Govier et al., 2023, doi:10.1016/j.amepre.2023.03.004: https://pmc.ncbi.nlm.nih.gov/articles/PMC13577317/
- Allen et al., 2021, doi:10.1001/jamanetworkopen.2020.32669: https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2774583
- Chan et al., BMJ 2022, doi:10.1136/bmj-2021-068099: https://pubmed.ncbi.nlm.nih.gov/35173019/
- Geruso et al., 2023, doi:10.1257/app.20210843: https://pmc.ncbi.nlm.nih.gov/articles/PMC10445793/
- Peterson et al., 2022, doi:10.1371/journal.pone.0276066: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0276066
- Asfaw et al., 2024, doi:10.1111/1475-6773.14303: https://pmc.ncbi.nlm.nih.gov/articles/PMC11063088/
- VA OIG, September 2026: https://vaoig.gov/reports/audit/audit-processing-community-care-requests-services
- Debt-relief working paper: https://files.consumerfinance.gov/f/documents/cfpb_kluender-effects-of-randomized-medical-debt-relief.pdf
- VA eligibility: https://www.va.gov/health-care/eligibility/priority-groups/
- Medicaid financing: https://www.medicaid.gov/medicaid/financial-management
- HRSA state pages: https://data.hrsa.gov/topics/healthcenters/uds/overview/state/TX and the corresponding MS, CO, NC, NY, and CA pages.
