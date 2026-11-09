# Original research investigation: observed data fragmentation mechanisms and limits of inference
Date: 2026-11-08. Scope: full-text extraction and critical cross-study synthesis, not a patient-level Hinds/Harris causal analysis. Scientific owner: DIS–RPLICE research, issue #81.

## Research question
Can documented differences between raw EHR, standardized common-data-model extracts, and population cancer registries produce materially different measurements, and which additional evidence is required to determine whether those measurement errors lead to missed interventions and harm?

## Empirical finding A: standardization can lose screening information
Conderino et al. (2022), full text: DOI 10.1186/s12911-022-01831-8. Scoping review screened 4,059 records and included 401 papers; empirical indicator validation used 1,844,491 INSIGHT patients and 604,699 NYU Langone patients. NYC residents with a 2018 ambulatory encounter were the analytic cohort, not a probability sample of all residents. The team developed 26 indicators using a PCORnet common data model (CDM) and compared them with raw EHR and external surveillance.

**Precision correction after November 8 primary full-text verification:** Conderino et al. report that, among NYU Langone patients, screenings documented in the health-maintenance module but absent from standard diagnosis/procedure codes corresponded to breast **13.8%**, cervical **14.5%**, and colorectal **15.9%**. Their prose describes *patients* rather than a percentage of screening-event records; do **not** label these 'percent of screening records lost,' or infer the exact indicator-eligible denominator without inspecting the source's operational definition and supplement. The INSIGHT common-data-model versus NYU Langone raw-EHR colorectal screening prevalence ratio **0.42** compares **different analytic patient samples**, not a matched within-person before/after CDM extraction; their NYC population comparisons and source coding differ. The external survey ratio **0.24** also crosses source/denominator/method differences. These ratios support a material measurement discrepancy and plausible coding omissions but **do not quantify a directly observed 58% within-person information loss**, a real screening deficit or patient harm. The published health-maintenance evidence is from NYU Langone; no Hinds/Harris raw EHR comparison was performed. Full text: https://doi.org/10.1186/s12911-022-01831-8, Methods and Results, screening/immunization sections. This correction supersedes any unqualified prior '15.9% of records' or 'internal paired extraction ratio' language. Race unknown/missing 32.0%, ethnicity 29.3%. Post-stratification omitted these dimensions.

Interpretation: a common data model can be syntactically standardized while clinically meaningful evidence is absent from the fields used to calculate measures. This is observed **measurement divergence**. Whether it generated any actual missed outreach, incorrect referral or harm was **not measured**.

## Empirical finding B: EHR coverage does not equal population representation
Thompson et al. (2020), full text: DOI 10.1158/1055-9965.EPI-19-0882. System-wide linkage of 4,816,898 adult EHR patients with California Cancer Registry; validation focused on 2012–2013 first primary cancers at four sites. Among 16,257 registry-linked validation cases, 12,280 (75.5%) had EHR evidence of cancer or care during the episode, and 3,977 did not. The episode-care EHR group represented 10,659 of 41,165 regional validation cancers (25.89%), not the entire regional cancer population. Catchment representation varied by county (5.30%–64.04%).

Compared with regional non-EHR cases, EHR cases differed by non-Hispanic Black race (proportion ratio 0.78; 95% CI 0.75–0.82), Hispanic ethnicity (0.74; 0.72–0.77), colorectal cancer site (0.89; 0.82–0.96), and insurance. These are **representation ratios**, not differences in cancer incidence or causal risk. Reweighting reduced some selection discrepancies but depends on measured selection variables and cannot repair all bias.

Interpretation: even valid individual records and linkage procedures may produce unrepresentative population-level estimates if the system's catchment, referral pathways and patient mobility differ. Neither an EHR cohort nor demographic homophily is proof of a comparable population.

## Empirical finding C: diagnostic handoffs fail for reasons beyond data exchange
Sharma et al. (2022 journal issue), full text: DOI 10.1097/PTS.0000000000000718. Qualitative root-cause study across five California safety-net systems used 12 cases of >6-month delayed colonoscopy after positive fecal testing; interviewed 11 PCPs and 5 patients. Themes included lost referral tracking, poor PCP–GI communication, staffing and appointment capacity, transport, preparation, work/childcare, fear, and understanding of test significance. Interview groups emphasized different barriers. The study did not estimate frequency or causal effect of individual barriers, and the tiny convenience sample is not representative. **Primary-full-text reconciliation (Nov 8):** the abstract, Results, and Discussion report 8 of 12 patients completed colonoscopy, but one Results sentence refers to 9 colonoscopies done. Patients and procedures are different units: this is an unresolved patient-versus-procedure denominator discrepancy, not a proved count contradiction. A repeat procedure is one possible explanation, not an observed fact; the aggregate Table 1 does not supply a patient/procedure crosswalk. The abstract reports 3 advanced adenomatous findings, while Results/Discussion describe 4 clinically significant or concerning adenomatous findings. The latter could reflect different classification rather than directly contradictory case counts. With no adjudicated participant-level tally, do not calculate an 'advanced adenoma rate' using 3/8, 3/9, 4/8 or 4/9; preserve the discrepancies and request supplementary case table or author correction. Primary full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC7688501/, Abstract, Results and Discussion. Themes remain qualitative evidence, not effect-size estimates.

Interpretation: these reported barriers support testing data exchange together with accountable follow-up and patient support. This qualitative study does not compare those interventions or establish their causal effects.

## Cross-study triangulation: designed / operational / experienced
| Layer | Designed | Operational evidence | Experienced evidence |
|---|---|---|---|
| Standardized surveillance | CDM enables comparable coding | Some actual screenings omitted from CDM-coded fields [Con22b] | No direct patient experience data in study |
| Population research | EHR captures relevant cases | EHR case mix and county coverage differ from registry population [Tho20] | Patients move between systems; experience not directly measured |
| Diagnostic follow-up | Positive result leads to colonoscopy | Referral tracking and capacity failures described [Sha20b] | Patient interviews identify practical and communication barriers [Sha20b] |

## Causal mechanism map and what remains untested
1. **Record translation loss -> distorted measured screening**: documented in one setting [Con22b]. Distorted policy allocation or patient harm: untested.
2. **Population selection -> biased inference**: documented EHR-registry differences [Tho20]. Biased Hinds/Harris decisions: untested.
3. **Disconnected referral ownership -> delayed follow-up**: reported qualitative mechanisms [Sha20b]. Attributable patient harm and intervention effect in those cases: untested.
4. **Multilevel outreach/navigation -> improved completion**: RCT evidence [Atl23, Cor25]. Direct causal impact of data integration alone on cancer mortality: untested.

## Falsification and red-team conditions
- Compare full raw EHR and standardized extract on **the same denominator and period**, with adjudicated patient-level concordance. If no meaningful misclassification exists, the proposed local translation-loss mechanism is not supported.
- Compare EHR cohort to registry universe by county and strata. If differences disappear after valid weighting, remaining selection-bias claims require further evidence.
- Observe whether a documented positive screening signal was available, actionable and not followed up; distinguish insufficient capacity or patient preference from information failure.
- Measure whether a linked workflow changes completion compared with existing care, not merely whether it creates alerts.
- Predefine adverse effects: false alerts, over-referral, workload, privacy harms and inequitable targeting.

## Hinds/Harris application and data acquisition gates
Current 2019–2023 public registry aggregate rates **cannot** identify patient-level screening or referral failures. Hinds all-stage 46.4, late-stage 29.9 per 100,000 and 63.7% late share; Harris 38.0, 23.9 and 63.4%. Similar shares do not imply equivalent disease burden, but the contrast cannot attribute differences to fragmented information.

For original site-specific study, request separately from approved stewards: (1) screening eligibility and positive tests, (2) referrals/orders, (3) GI scheduling and colonoscopy completion, (4) pathology/registry diagnosis, (5) timestamped outreach and closed-loop communication, (6) EHR-to-registry linkage and denominator audit, (7) patient navigation/access barriers and patient-reported experience. Before requesting any PHI, define lawful access, privacy/IRB determination, data-use agreement, patient/community governance, and selection strategy. **No such linked patient data have been obtained or analyzed here.**

## Scientific decision
**GO:** measure semantic loss and population selection as separately testable mechanisms; prioritize a process-level follow-up outcome with explicit accountability.
**CONDITIONAL:** extend findings to Hinds/Harris after local provenance, comparability, and access audits.
**HOLD causal claim:** fragmentation caused late-stage disparities or preventable patient harm. No patient-level causal data or identified counterfactual currently supports it.

## Sources
[Con22b] Conderino et al. BMC Med Inform Decis Mak (2022). doi:10.1186/s12911-022-01831-8.
[Tho20] Thompson et al. Cancer Epidemiol Biomarkers Prev (2020). doi:10.1158/1055-9965.EPI-19-0882.
[Sha20b; legacy key retained] Sharma et al. J Patient Saf. 2022;18(1):e163–e171. doi:10.1097/PTS.0000000000000718. PMID 32467445. Earlier PubMed indexing in 2020 is distinct from the final issue year; the exact online-first publication date was not independently established in this audit.
[Atl23] Atlas et al. JAMA (2023). doi:10.1001/jama.2023.18755.
[Cor25] Coronado et al. Ann Intern Med (2025). doi:10.7326/ANNALS-24-01885.
