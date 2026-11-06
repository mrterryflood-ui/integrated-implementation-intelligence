/**
 * Independent, nationally published contextual contrasts for cancer mechanisms.
 * Source: Islami et al., ACS Cancer Disparities 2025 (published CA Cancer J Clin 2026)
 * https://doi.org/10.3322/caac.70045
 * Incidence period 2018–2022: SEER-based urbanicity sample covering ~36.7%
 * US population. DO NOT merge with NCI 2019–2023 cancer stage-rate rows.
 * Race is a recorded social demographic category, not an inherited gene marker.
 */
export const NATIONAL_CANCER_CONTEXT_SOURCE={
 title:"American Cancer Society report on the status of cancer disparities, 2025",
 url:"https://doi.org/10.3322/caac.70045",
 year:"2018–2022",coverage:"SEER registries (~36.7% of U.S. population), age-adjusted all-stage incidence",
 compatibleWithThreeCancerStageData:false
} as const;
export const ALL_STAGE_URBAN_RURAL_CONTEXT={
 colorectal:{largeMetro:34.2,smallerMetro:35.7,nonMetro:40.6,denominator:"both sexes"},
 lung:{largeMetro:43.9,smallerMetro:51.4,nonMetro:62.5,denominator:"both sexes"},
 breast:{largeMetro:132.3,smallerMetro:129.7,nonMetro:122.1,denominator:"females only"}
} as const;
export const NATIONAL_RACE_CONTEXT_2018_2022={
 colorectal:{whiteNonHispanic:34.7,blackNonHispanic:39.5},
 lung:{whiteNonHispanic:56.9,blackNonHispanic:54.0},
 breast:{whiteNonHispanic:137.4,blackNonHispanic:130.6},
 lungMale:{whiteNonHispanic:61.5,blackNonHispanic:67.5},
 lungFemale:{whiteNonHispanic:53.5,blackNonHispanic:44.6}
} as const;
export const NATIONAL_CONTEXT_PREVENTION_TESTS=[
 {hypothesis:"Shared geographic exposures and structural conditions affect colorectal and lung incidence more strongly than breast.",
  discriminatingEvidence:"Matched historical all-stage incidence by age, sex, race, smoking, obesity, occupations, industrial release and disease biology.",
  status:"UNTESTED_CROSS_SOURCE_HYPOTHESIS"},
 {hypothesis:"Differences in current or lifetime smoking contribute to the rural–urban lung gradient and some colorectal risk.",
  discriminatingEvidence:"Birth-cohort smoking history/pack-years, cessation, secondhand smoke, occupational and exposure histories; model latency.",
  status:"UNTESTED_CROSS_SOURCE_HYPOTHESIS"},
 {hypothesis:"Breast-specific inherited, reproductive, hormonal and biological mechanisms produce a different geographic profile.",
  discriminatingEvidence:"Tumor subtype and receptor status, reproductive history, genetic/familial risk, weight trajectories, screening ascertainment, insurance and historic exposure.",
  status:"UNTESTED_CROSS_SOURCE_HYPOTHESIS"},
 {hypothesis:"The relatively weak cross-cancer covariance in stage share reflects disease-specific detection systems, tumor biology and case composition.",
  discriminatingEvidence:"Cancer-specific stage-by-year, symptom-to-diagnosis and diagnostic follow-up cohorts plus validated screening criteria.",
  status:"UNTESTED_CROSS_SOURCE_HYPOTHESIS"}
] as const;
export const NATIONAL_CONTEXT_LIMITS=[
 "Race and ethnicity must remain within self-reported/registry definitions; county demographic averages are not characteristics of cancer cases.",
 "Lung sex-specific racial pattern reverses: combined rate conceals Black male excess and Black female lower incidence relative to White counterparts.",
 "Published urbanicity study incidence is 2018–2022, whereas separate NCI late-stage state matrix is 2019–2023. Compare as independent evidence, not pooled individual observations.",
 "Rural/urban cancer rates use SEER areas; don't label them a full 100% national geographic census.",
 "Unadjusted context tables do not establish that poverty, tobacco, pollution or any business caused cancer.",
 "Selection of a map point or a source is not a verified exposure, completed analysis, method invocation or authorized intervention."
] as const;
