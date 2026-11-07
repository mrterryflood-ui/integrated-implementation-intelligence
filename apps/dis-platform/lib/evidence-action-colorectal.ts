/**
 * Colorectal evidence-to-action pilot: existing Hinds County curated data.
 * Values and source limitations remain in jackson-cancer-case.ts.
 * Do not invent Harris County, Colorado, city-level or longitudinal values.
 * No cross-disease mapping is inherited from this study.
 */
import {jacksonCancerCase} from "./jackson-cancer-case";
import {buildResearchProgram} from "./research-program";
import {reviewEvidenceToAction,type MeasureBinding} from "./evidence-action-bridge";
import type {IntelligenceRecord} from "./consultation-research";

export const COLORECTAL_CROSSWALK:readonly MeasureBinding[]=[
  {indicatorId:"CRC-LATE-INC",condition:"colorectal",
   construct:"LATE_STAGE_INCIDENCE",denominatorClass:"AGE_STANDARDIZED_RESIDENT_POPULATION",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 county rate"},
  {indicatorId:"CRC-LATE-SHARE",condition:"colorectal",
   construct:"LATE_STAGE_CASE_SHARE",denominatorClass:"STAGED_INCIDENT_COLORECTAL_CASES",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 staged-case share"},
  {indicatorId:"CRC-LATE-COUNT",condition:"colorectal",
   construct:"LATE_STAGE_CASE_COUNT",denominatorClass:"AVERAGE_ANNUAL_LATE_STAGE_CASES",
   populationFrame:"Hinds County residents; both sexes; NCI site definition; 2018–2022",
   methodVersion:"NCI State Cancer Profiles 2018–2022 annual case count"}
] as const;
export const COLORECTAL_COMPARISON_SITES=[
  {site:"Hinds County, Mississippi",state:"CURATED_HISTORICAL_COUNTY_BASELINE"},
  {site:"Harris County, Texas",state:"SOURCE_AND_TIME_SERIES_RECONCILIATION_REQUIRED"},
  {site:"Colorado county or state",state:"TARGET_GEOGRAPHY_AND_MATCHED_DATA_REQUIRED"}
] as const;

export function colorectalEvidenceAction(leads:readonly IntelligenceRecord[]=[]){
  const program=buildResearchProgram(jacksonCancerCase("colorectal"));
  return {program,bridge:reviewEvidenceToAction(program,COLORECTAL_CROSSWALK,leads),
    comparisonSites:COLORECTAL_COMPARISON_SITES};
}
