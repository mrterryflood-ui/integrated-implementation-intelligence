/**
 * High-case-count focal county comparison. NCI/CDC State Cancer Profiles
 * 2018–2022 all ages, all races including Hispanic, late=regional or distant.
 * Hinds/Jackson and Harris/Houston are county PROXIES, not city incidence rates.
 * Denver is an example Colorado county, not a stand-in for Colorado statewide.
 * Rates are age-adjusted per 100,000 annually; female breast uses female denominator.
 * Case shares have a different case denominator. Original NCI county page per cell.
 */
export type CountyCancer="colorectal"|"lung"|"breast";
export type CountyCancerMeasure={rate:number;lateStageShare:number;annualLateCases:number;lowerCI:number;upperCI:number;source:string};
export type FocalCountyCancer={county:string;municipalAnchor:string;fips:string;period:"2018–2022";cancers:Record<CountyCancer,CountyCancerMeasure>};
const nci=(state:string,cancer:string,sex:string)=>"https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer="+cancer+"&race=00&ruralurban=0&sex="+sex+"&sortOrder=desc&sortVariableName=count&stage=211&statefips="+state+"&type=incd&year=0";
export const FOCAL_THREE_CANCER_COUNTIES:readonly FocalCountyCancer[]=[
 {county:"Hinds County, Mississippi",municipalAnchor:"Jackson",fips:"28049",period:"2018–2022",cancers:{
 colorectal:{rate:30.4,lateStageShare:63.3,annualLateCases:76,lowerCI:27.3,upperCI:33.8,source:nci("28","020","0")},
 lung:{rate:44.5,lateStageShare:65.2,annualLateCases:122,lowerCI:41.0,upperCI:48.3,source:nci("28","047","0")},
 breast:{rate:53.2,lateStageShare:37.7,annualLateCases:74,lowerCI:47.7,upperCI:59.1,source:nci("28","055","2")}
 }},
 {county:"Harris County, Texas",municipalAnchor:"Houston",fips:"48201",period:"2018–2022",cancers:{
 colorectal:{rate:23.3,lateStageShare:63.4,annualLateCases:1044,lowerCI:22.7,upperCI:23.9,source:nci("48","020","0")},
 lung:{rate:27.1,lateStageShare:67.1,annualLateCases:1179,lowerCI:26.4,upperCI:27.8,source:nci("48","047","0")},
 breast:{rate:43.0,lateStageShare:35.6,annualLateCases:1020,lowerCI:41.8,upperCI:44.2,source:nci("48","055","2")}
 }},
 {county:"Denver County, Colorado",municipalAnchor:"Denver",fips:"08031",period:"2018–2022",cancers:{
 colorectal:{rate:19.8,lateStageShare:61.6,annualLateCases:135,lowerCI:18.3,upperCI:21.4,source:nci("08","020","0")},
 lung:{rate:22.3,lateStageShare:59.5,annualLateCases:149,lowerCI:20.7,upperCI:24.0,source:nci("08","047","0")},
 breast:{rate:42.6,lateStageShare:32.2,annualLateCases:149,lowerCI:39.5,upperCI:45.8,source:nci("08","055","2")}
 }}
] as const;
export function getFocalCountyByFips(fips:string){return FOCAL_THREE_CANCER_COUNTIES.find(x=>x.fips===fips);}
export function focalCountyComparison(){
 return {schemaVersion:"national-cancer-3-focal-counties-v1",period:"2018–2022",source:"NCI/CDC State Cancer Profiles",
 stage:"REGIONAL_OR_DISTANT",claimOfCitySpecificRates:false,individualExposureLink:false,causalProof:false,
 purpose:"Descriptive high-count county counterpoint to separate 2019–2023 state-level national study",
 caveats:["Race/sex/age subgroup outcomes in these county totals have not been disaggregated.",
 "All-stage incidence, pollutants, residential/occupational history, genetics, income and screening are NOT joined to these nine cells.",
 "Breast is female-only; cross-cancer absolute rates have different populations.",
 "Percent diagnosed late and age-adjusted late-stage population incidence must never be conflated.",
 "County is not a municipality; a city center is not population- or exposure-weighted cancer geography."],
 rows:FOCAL_THREE_CANCER_COUNTIES};
}
