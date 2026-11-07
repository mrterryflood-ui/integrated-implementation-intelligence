import {ContractError,emptyReceipt,type Capability,type CapabilityReceipt,type EngagementInput,type EvidenceItem} from './contracts';
import {NetworkBudget,asRecord,boundedText,publicHttps} from './transport';

const ORIGIN='https://hazardaware.vercel.app';
const PATH='/api/dis/hazards/location';
const FRESHNESS=new Set(['FRESH','STALE','UNKNOWN','UNAVAILABLE','NOT_CONFIGURED','NOT_COVERED']);

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
 for(const row of evidence)if(!publicHttps(row.source)||typeof row.publisher!=='string'||typeof row.label!=='string'||!FRESHNESS.has(String(row.freshness))||!validDate(row.retrievedAt)||
  ['issuedAt','validFrom','validThrough','validAt'].some(key=>row[key]!=null&&!validDate(row[key])))throw new ContractError('INVALID_HAZARD_RESPONSE','A hazard evidence lane lacks source, time or freshness provenance.');
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
   if(declarations.status==='live')add('fema-declarations','FEMA county declaration history',`FEMA returned ${declarations.rows.length} declaration row(s) for ${location}; this is administrative history, not a current warning.`, 'FEMA OpenFEMA',0,{kind:'historical-declarations',count:declarations.rows.length});
   if(assistance.status==='live')add('fema-assistance','FEMA public assistance context',`FEMA returned ${assistance.projects.length} public assistance project row(s); an obligation is not necessarily an expenditure or completed repair.`, 'FEMA OpenFEMA',1,{kind:'administrative-projects',count:assistance.projects.length});
   if(index.status==='live')add('fema-risk','FEMA National Risk Index reference',`The National Risk Index returned a modeled county reference for ${location}; it is not a current forecast or all-clear.`, 'FEMA National Risk Index',2,{kind:'modeled-reference',countyFips:g.countyFips});
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
