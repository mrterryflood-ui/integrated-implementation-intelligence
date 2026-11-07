import {ContractError,emptyReceipt,type Capability,type CapabilityReceipt,type EngagementInput,type EvidenceItem} from './contracts';
import {NetworkBudget,asRecord,boundedText,publicHttps} from './transport';

const ORIGIN='https://hazardaware.vercel.app';
const PATH='/api/dis/hazards/location';
const FRESHNESS=new Set(['FRESH','STALE','UNKNOWN','UNAVAILABLE','NOT_CONFIGURED','NOT_COVERED']);
const POINT_LANES=[
 ['NOAA / National Weather Service','OFFICIAL','https://api.weather.gov/alerts/active'],
 ['NOAA / National Weather Service','FORECAST','https://api.weather.gov/'],
 ['USFS / NIFC WFIGS','REPORTED','https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query'],
 ['NOAA / National Weather Service','OFFICIAL','https://api.weather.gov/alerts/active'],
 ['Copernicus CAMS via Open-Meteo','MODELED','https://air-quality-api.open-meteo.com/v1/air-quality'],
 ['U.S. EPA AirNow','MEASURED','https://www.airnow.gov/'],
] as const;
const COUNTY_LANES=[
 ['FEMA OpenFEMA','OFFICIAL / REPORTED','/api/open/v2/DisasterDeclarationsSummaries'],
 ['FEMA OpenFEMA','OFFICIAL / REPORTED','/api/open/v2/PublicAssistanceFundedProjectsDetails'],
 ['FEMA National Risk Index','REFERENCE / MODELED','/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query'],
] as const;
const STATE_USPS:Record<string,string>={
 '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY','72':'PR','78':'VI','69':'MP','66':'GU','60':'AS',
};

function expectedLane(row:Record<string,unknown>,index:number,point:boolean,fips?:string):boolean{
 if(point){const lane=POINT_LANES[index];return !!lane&&row.publisher===lane[0]&&row.label===lane[1]&&row.source===lane[2];}
 const lane=COUNTY_LANES[index];if(!lane||row.publisher!==lane[0]||row.label!==lane[1])return false;
 const url=new URL(String(row.source));
 if(index===2)return url.origin==='https://services.arcgis.com'&&url.pathname===lane[2]&&url.searchParams.get('where')===`STCOFIPS='${fips}'`;
 if(url.origin!=='https://www.fema.gov'||url.pathname!==lane[2])return false;
 const filter=url.searchParams.get('$filter');
 return index===0?filter===`placeCode eq '99${fips?.slice(2)}' and state eq '${STATE_USPS[fips?.slice(0,2)||'']}'`:filter===`countyCode eq '${fips?.slice(2)}' and stateNumberCode eq '${fips?.slice(0,2)}'`;
}

/** HazardAware keeps its provider keys and raw signal acquisition. DIS receives only a
 * bounded, public projection with source labels; it never issues an operational alert. */
export async function readHazardPublicLocation(cap:Capability,input:EngagementInput,budget:NetworkBudget):Promise<CapabilityReceipt>{
 const result=emptyReceipt(cap,'NEEDS_CONTEXT','A public point or exact county FIPS is required. A city or postal code is not silently converted into a point.');
 const g=input.geography;
 const point=g.kind==='point'&&g.latitude!==undefined&&g.longitude!==undefined;
 const county=g.kind==='county'&&!!g.countyFips;
 if(!point&&!county)return result;
 if(cap.endpoint!==ORIGIN+PATH)throw new ContractError('ENDPOINT_DENIED','Hazard location endpoint does not match the reviewed host and path.');
 const url=new URL(PATH,ORIGIN);
 if(point){url.searchParams.set('lat',String(g.latitude));url.searchParams.set('lon',String(g.longitude));}
 else url.searchParams.set('fips',g.countyFips!);
 const before=budget.requests,wire=await budget.request(url.href,{},ORIGIN);
 if(wire.status!==200)throw new ContractError(wire.status===401?'AUTHENTICATION_REQUIRED':wire.status===403?'SCOPE_DENIED':'UPSTREAM_HTTP_'+wire.status,'HazardAware returned HTTP '+wire.status+'.');
 const root=asRecord(wire.data),request=asRecord(root.request),geography=asRecord(request.geography);
 if(root.schemaVersion!=='dis-location-hazards-v1'||root.capabilityId!=='hazard-signals/location-hazards'||!['available','partial','unknown'].includes(String(root.status))||
   geography.type!==(point?'point':'county')||(point?(geography.lat!==g.latitude||geography.lon!==g.longitude):geography.fips!==g.countyFips)||
   !validDate(root.generatedAt)||!Array.isArray(root.evidence)||root.evidence.length>8||!Array.isArray(root.limits)||root.limits.length>12){
  throw new ContractError('INVALID_HAZARD_RESPONSE','HazardAware did not return the expected bounded geography and source contract.');
 }
 const authority=asRecord(root.authority);
 if(authority.humanDecisionRequired!==true||authority.automatedAlerts!==false||authority.deviceControl!==false)throw new ContractError('INVALID_HAZARD_RESPONSE','The publisher did not preserve the human decision boundary.');
 const evidence=root.evidence.map(asRecord);
 for(const [index,row] of evidence.entries())if(!publicHttps(row.source)||!expectedLane(row,index,point,g.countyFips)||!FRESHNESS.has(String(row.freshness))||!validDate(row.retrievedAt)||
  ['observedAt','issuedAt','validFrom','validThrough','validAt'].some(key=>row[key]!=null&&!validDate(row[key])))throw new ContractError('INVALID_HAZARD_RESPONSE','A hazard evidence lane lacks its expected publisher, source, label, time or freshness provenance.');
 const signals=asRecord(root.signals),generatedAt=String(root.generatedAt);
 const responseAgeMs=Date.now()-Date.parse(generatedAt);
 if(responseAgeMs < -5*60_000)throw new ContractError('INVALID_HAZARD_RESPONSE','HazardAware response time is implausibly in the future.');
 const location=point?`Point ${g.latitude}, ${g.longitude}`:`County ${g.countyFips}`;
 const items:EvidenceItem[]=[];
 const add=(id:string,title:string,summary:string,source:string,rowIndex:number,projection:Record<string,unknown>,referencePeriod:string|null=null)=>{
  const row=evidence[rowIndex];
  if(!row||row.publisher!==source)throw new ContractError('INVALID_HAZARD_RESPONSE','The signal does not match its designated evidence lane.');
  items.push({id:'hazard-'+id,title,summary,url:String(row.source),source,retrievedAt:String(row.retrievedAt),referencePeriod,geography:location,status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',data:{...projection,publisherGeneratedAt:generatedAt,sourceLabel:row.label,sourceFreshness:row.freshness,disResponseFreshness:responseAgeMs>10*60_000?'STALE_RESPONSE':'CURRENT_RESPONSE',sourceObservedAt:row.observedAt??null,sourceIssuedAt:row.issuedAt??null,sourceValidFrom:row.validFrom??null,sourceValidThrough:row.validThrough??null,sourceValidAt:row.validAt??null,sourceEvidenceState:row.evidenceState??null,sourceResponseSha256:wire.sha256,disInterpretation:'SITUATIONAL_EVIDENCE_ONLY'}});
 };
 if(point){
  const ember=signals.ember?asRecord(signals.ember):null,smoke=signals.smoke?asRecord(signals.smoke):null;
  if(ember){const status=asRecord(ember.sourceStatus),observed=asRecord(ember.observed),wind=asRecord(observed.wind);
   if(!Array.isArray(observed.fireWeatherAlerts)||observed.fireWeatherAlerts.length>20||!Array.isArray(observed.nearbyFires)||observed.nearbyFires.length>5)throw new ContractError('INVALID_HAZARD_RESPONSE','Fire and warning arrays exceed the reviewed projection.');
   if(status.alerts==='available')add('nws-fire','NWS fire weather alerts',`NWS returned ${observed.fireWeatherAlerts.length} fire weather alert record(s) for ${location}; inspect the publisher for warning text and applicability.`, 'NOAA / National Weather Service',0,{kind:'current-point-alerts',count:observed.fireWeatherAlerts.length,events:observed.fireWeatherAlerts.slice(0,5).map(v=>boundedText(asRecord(v).event,120))});
   if(status.wind==='available')add('nws-wind','NWS forecast wind',`Publisher forecast wind for ${location}; a forecast is not an observed condition.`, 'NOAA / National Weather Service',1,{kind:'point-forecast',sustainedMph:numberOrNull(wind.sustainedMph),gustMph:numberOrNull(wind.gustMph),validThrough:validDate(wind.validThrough)?wind.validThrough:null,gridUpdatedAt:validDate(wind.gridUpdatedAt)?wind.gridUpdatedAt:null});
   if(status.fires==='available'||status.fires==='partial')add('fire-incidents','Reported nearby fires',`The publisher returned ${observed.nearbyFires.length} nearby fire record(s); incident locations and updates require confirmation.`, 'USFS / NIFC WFIGS',2,{kind:'reported-incidents',count:observed.nearbyFires.length,coverage:status.fires});
  }
  if(smoke){const status=asRecord(smoke.sourceStatus),official=asRecord(smoke.official),modeled=asRecord(smoke.modeled),ground=asRecord(smoke.ground);
   if(!Array.isArray(official.airQualityAlerts)||official.airQualityAlerts.length>20)throw new ContractError('INVALID_HAZARD_RESPONSE','Air-quality alerts exceed the reviewed projection.');
   if(status.officialAlerts==='available')add('nws-air','NWS air quality alerts',`NWS returned ${official.airQualityAlerts.length} air quality alert record(s) for ${location}.`, 'NOAA / National Weather Service',3,{kind:'current-point-alerts',count:official.airQualityAlerts.length,events:official.airQualityAlerts.slice(0,5).map(v=>boundedText(asRecord(v).event,120))});
   if(status.modeled==='available')add('modeled-air','Modeled air quality',`Publisher model estimates for ${location}; a modeled value can miss local exposure.`, 'Copernicus CAMS via Open-Meteo',4,{kind:'modeled-point',pm25:numberOrNull(modeled.pm25),usAqi:numberOrNull(modeled.usAqi)});
   if(status.ground==='available'&&ground.state==='observed'){if(!Array.isArray(ground.monitors)||ground.monitors.length>20)throw new ContractError('INVALID_HAZARD_RESPONSE','Monitor list exceeds the reviewed projection.');add('measured-air','AirNow monitor observations',`AirNow returned ${ground.monitors.length} monitor record(s); they do not establish conditions at this exact point.`, 'U.S. EPA AirNow',5,{kind:'measured-monitor-context',count:ground.monitors.length});}
  }
 }else{
  // FEMA declarations and the National Risk Index describe historical or
  // reference context. They cannot stand in for a current NWS county warning.
  if(Object.keys(signals).length){
   const declarations=asRecord(signals.declarations),assistance=asRecord(signals.publicAssistance),index=asRecord(signals.nationalRiskIndex);
   if(!Array.isArray(declarations.rows)||declarations.rows.length>20||!Array.isArray(assistance.projects)||assistance.projects.length>20)throw new ContractError('INVALID_HAZARD_RESPONSE','County records exceed the reviewed projection.');
   if(index.status!=='live'||asRecord(index.county).countyFips!==g.countyFips)throw new ContractError('GEOGRAPHY_CONFLICT','The FEMA risk row does not verify the requested county.');
   if(declarations.status==='live')add('fema-declarations','FEMA county declaration history',`FEMA returned ${declarations.rows.length} declaration row(s) for ${location}; this is administrative history, not a current warning.`, 'FEMA OpenFEMA',0,{kind:'historical-declarations',count:declarations.rows.length});
   if(assistance.status==='live')add('fema-assistance','FEMA public assistance context',`FEMA returned ${assistance.projects.length} public assistance project row(s); an obligation is not necessarily an expenditure or completed repair.`, 'FEMA OpenFEMA',1,{kind:'administrative-projects',count:assistance.projects.length});
   add('fema-risk','FEMA National Risk Index reference',`The National Risk Index returned a modeled county reference for ${location}; it is not a current forecast or all-clear.`, 'FEMA National Risk Index',2,{kind:'modeled-reference',countyFips:g.countyFips});
  }
 }
 const limitations=[...root.limits.filter((v:unknown)=>typeof v==='string').map((v:string)=>v.slice(0,300)).slice(0,8),
  'This is a public evidence handoff. DIS did not send an alert, confirm receipt, make a referral, or measure a community outcome.',
  ...(responseAgeMs>10*60_000?['Publisher response was generated more than ten minutes ago; investigate delivery/cache freshness before an operational decision.']:[]),
  ...(county?['County FEMA records cannot answer whether an active NWS warning applies to a person or address.']:[])];
 return {...result,state:items.length?'RETURNED':'EMPTY_SOURCE_RESULT',finishedAt:new Date().toISOString(),requestCount:budget.requests-before,httpStatus:wire.status,sourceUrl:url.href,responseSha256:wire.sha256,items,reason:items.length?'Source-labeled public hazard context was retrieved; human review is required.':'No usable publisher lane was returned. Unknown is not a low-risk or zero-risk finding.',limitations};
}

function validDate(value:unknown):boolean{return typeof value==='string'&&Number.isFinite(Date.parse(value));}
function numberOrNull(value:unknown):number|null{return typeof value==='number'&&Number.isFinite(value)?value:null;}
