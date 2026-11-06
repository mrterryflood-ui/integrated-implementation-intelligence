/**
 * Public NCI/CDC State Cancer Profiles national reference snapshot, 2019–2023.
 * Data are manually transcribed from the official published state tables;
 * independently validate a programmatic export before research publication.
 * This is a matched national ALL-RACES *aggregate*, not race-stratified or county.
 * The breast denominator is females; lung and colorectal denominator is both sexes.
 * "Late stage" means regional or distant, NOT exclusively stage IV.
 * No SEER individual records, site-specific exposure measures or causality implied.
 */
export const THREE_CANCER_SOURCE_VERSION="NCI-SCP-2019-2023-Nov2025" as const;
export const THREE_CANCER_SOURCE_URLS={
 colorectal:"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=percentlate&stage=211&statefips=00&type=incd&year=0",
 lung:"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=047&datatype=01&race=00&ruralurban=0&sex=0&sortOrder=asc&sortVariableName=rate&stage=211&statefips=00&type=incd&year=0",
 breast:"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=055&race=00&sortOrder=desc&sortVariableName=percentlate&stage=211&statefips=00&type=incd&year=0",
} as const;
export type CancerKey="colorectal"|"lung"|"breast";
export type CancerMeasure={lateStageIncidencePer100k:number;averageAnnualLateStageCount:number;lateStageSharePercent:number};
export type NationalCancerRow={geography:string;colorectal:CancerMeasure;lung:CancerMeasure;breast:CancerMeasure};
const RAW=String.raw`Alabama|21.9,1371,53.8|33.5,2316,59.0|39.9,1263,29.3
Alaska|25.7,190,60.6|32.4,256,64.9|40.1,149,29.1
Arizona|19.2,1740,60.2|23.2,2360,59.8|37.9,1663,30.0
Arkansas|25.5,941,60.3|41.6,1695,60.7|39.9,734,30.1
California|19.6,8747,56.1|23.2,10790,64.8|42.3,9483,32.0
Colorado|19.7,1271,64.0|21.6,1472,60.2|42.8,1392,30.7
Connecticut|19.2,884,55.8|32.3,1635,61.0|41.2,939,26.5
Delaware|21.0,281,62.5|35.5,536,63.0|45.2,300,28.8
District of Columbia|18.5,124,52.2|27.5,187,59.8|47.7,171,33.7
Florida|22.7,6916,61.4|32.7,11267,62.4|43.3,6296,31.0
Georgia|24.2,2944,60.6|36.1,4633,67.0|47.0,2974,33.8
Hawaii|22.2,421,56.9|27.4,582,72.1|41.9,372,28.6
Idaho|21.7,473,62.0|29.2,693,67.4|42.6,455,30.2
Illinois|23.9,3665,60.6|37.0,6085,65.2|45.2,3458,31.6
Indiana|25.0,2013,62.2|43.7,3826,65.4|40.9,1644,30.2
Iowa|23.7,924,58.4|39.4,1706,66.1|43.5,825,29.7
Kansas|25.0,856,62.9|33.7,1268,64.0|42.2,719,30.0
Kentucky|27.5,1509,59.4|55.8,3366,66.9|42.4,1167,30.9
Louisiana|26.1,1422,58.0|43.1,2558,71.4|45.9,1279,33.8
Maine|21.7,422,59.0|40.6,912,62.5|41.7,396,28.0
Maryland|21.3,1579,61.0|30.5,2439,63.1|46.2,1758,31.4
Massachusetts|18.5,1598,57.4|33.0,3133,57.8|37.7,1632,24.9
Michigan|21.5,2720,60.4|37.9,5362,64.3|41.6,2582,29.6
Minnesota|21.0,1419,56.9|31.3,2345,59.4|42.5,1407,28.1
Mississippi|28.9,1030,63.0|44.2,1714,66.5|45.7,833,35.1
Missouri|25.7,1942,63.3|43.0,3607,63.8|45.4,1716,31.1
Montana|23.8,335,63.1|27.2,440,61.4|42.3,281,29.4
Nebraska|22.1,501,59.0|30.3,749,59.1|41.1,453,30.4
Nevada|20.5,773,58.4|25.1,1011,58.5|39.9,736,34.3
New Hampshire|20.8,389,60.0|35.6,750,61.2|40.2,366,26.5
New Jersey|22.8,2634,58.1|30.7,3749,64.2|44.0,2528,30.2
New Mexico|18.9,498,56.5|18.7,555,60.6|38.7,504,30.9
New York|20.7,5137,57.0|31.7,8493,61.3|41.4,5101,29.0
North Carolina|22.6,2864,63.1|40.0,5600,65.9|45.3,2919,29.7
North Dakota|23.9,209,59.7|32.2,308,62.4|40.7,167,29.5
Ohio|24.0,3534,62.4|40.2,6544,63.9|44.2,3237,31.2
Oklahoma|25.1,1155,60.0|39.3,1975,64.2|44.3,1025,33.0
Oregon|20.1,1054,62.4|27.1,1597,60.3|39.0,1019,28.3
Pennsylvania|23.6,4012,63.0|35.0,6600,62.9|41.9,3469,29.6
Puerto Rico|18.1,859,49.4|7.1,371,48.0|33.4,792,32.3
Rhode Island|20.1,279,62.1|33.2,508,56.2|39.5,267,25.6
South Carolina|23.2,1520,63.8|36.4,2685,64.5|44.8,1474,30.8
South Dakota|26.1,280,64.6|34.7,413,65.3|41.7,214,30.1
Tennessee|24.6,2070,63.2|41.2,3813,63.0|41.6,1777,31.1
Texas|23.7,7286,61.5|28.3,8901,64.8|42.9,6767,33.4
United States|22.3,89163,60.2|32.8,143021,63.5|42.6,84976,30.7
Utah|18.3,545,60.3|16.0,492,66.5|43.0,656,33.6
Vermont|18.4,161,57.4|32.6,328,60.8|37.6,157,25.9
Virginia|20.3,2081,60.4|30.8,3434,62.0|40.9,2135,29.6
Washington|21.4,1901,62.5|29.8,2886,64.1|44.4,1984,30.4
West Virginia|28.0,694,62.3|50.2,1377,66.2|42.5,498,31.0
Wisconsin|21.7,1585,61.5|35.0,2877,64.3|42.5,1514,29.0
Wyoming|22.1,158,63.8|23.2,183,60.4|43.2,145,32.5`;
const toMeasure=(text:string):CancerMeasure=>{
 const nums=text.split(",").map(Number);
 if(nums.length!==3||nums.some(x=>!Number.isFinite(x)||x<0)||nums[2]>100||!Number.isInteger(nums[1]))throw Error("Invalid NCI published cancer row");
 return {lateStageIncidencePer100k:nums[0],averageAnnualLateStageCount:nums[1],lateStageSharePercent:nums[2]};
};
export const NATIONAL_THREE_CANCER_ROWS:readonly NationalCancerRow[]=RAW.trim().split("\n").map(line=>{
 const cols=line.split("|");
 if(cols.length!==4)throw Error("Invalid national row shape");
 return {geography:cols[0],colorectal:toMeasure(cols[1]),lung:toMeasure(cols[2]),breast:toMeasure(cols[3])};
});
if(NATIONAL_THREE_CANCER_ROWS.length!==53||new Set(NATIONAL_THREE_CANCER_ROWS.map(x=>x.geography)).size!==53)throw Error("Expected 50 states, DC, Puerto Rico and national reference");
export function nationalStateRows():NationalCancerRow[]{
 return NATIONAL_THREE_CANCER_ROWS.filter(x=>!["United States","Puerto Rico","District of Columbia"].includes(x.geography));
}
export function pearsonNationalCancerCorrelation(a:CancerKey,b:CancerKey,metric:"lateStageIncidencePer100k"|"lateStageSharePercent"){
 const rows=nationalStateRows();
 const xx=rows.map(r=>r[a][metric]),yy=rows.map(r=>r[b][metric]);
 const avg=(arr:number[])=>arr.reduce((s,v)=>s+v,0)/arr.length;
 const mx=avg(xx),my=avg(yy),num=xx.reduce((s,v,i)=>s+(v-mx)*(yy[i]-my),0);
 const sx=Math.sqrt(xx.reduce((s,v)=>s+(v-mx)**2,0)),sy=Math.sqrt(yy.reduce((s,v)=>s+(v-my)**2,0));
 return num/(sx*sy);
}
export function nationalThreeCancerReference(){
 return {schemaVersion:"dis-rplice-public-three-cancers-v1",sourceVersion:THREE_CANCER_SOURCE_VERSION,
  period:"2019–2023",denominator:"Invasive incident cancers; population rate age-adjusted per 100,000; female-only population denominator for breast",
  stage:"REGIONAL_OR_DISTANT",raceEthnicity:"ALL_RACES_INCLUDING_HISPANIC",
  status:"CURATED_PUBLIC_AGGREGATE_NOT_LIVE_DATA_CONNECTION",geographies:NATIONAL_THREE_CANCER_ROWS.length,states:50,
  sourceUrls:THREE_CANCER_SOURCE_URLS,
  measurementLimits:["The three cancer types have different detection and progression pathways; comparisons should be within cancer first.",
   "Rate per 100,000 population and percent late among diagnosed cases are different denominators.",
   "No city/county, individual, genetic, race-stratified, food, pollutant or historical exposure linkage in this snapshot.",
   "Cross-state correlations are ecological associations, not estimates of causal effects.",
   "Population incidence of all stages is an independently required primary-prevention endpoint; do not calculate age-adjusted all-stage incidence by dividing late-stage rate by late-stage share."],
  rows:NATIONAL_THREE_CANCER_ROWS,
  correlations:{incidence:{colorectalLung:pearsonNationalCancerCorrelation("colorectal","lung","lateStageIncidencePer100k"),
   colorectalBreast:pearsonNationalCancerCorrelation("colorectal","breast","lateStageIncidencePer100k"),
   lungBreast:pearsonNationalCancerCorrelation("lung","breast","lateStageIncidencePer100k")},
  stageShare:{colorectalLung:pearsonNationalCancerCorrelation("colorectal","lung","lateStageSharePercent"),
   colorectalBreast:pearsonNationalCancerCorrelation("colorectal","breast","lateStageSharePercent"),
   lungBreast:pearsonNationalCancerCorrelation("lung","breast","lateStageSharePercent")}}};
}