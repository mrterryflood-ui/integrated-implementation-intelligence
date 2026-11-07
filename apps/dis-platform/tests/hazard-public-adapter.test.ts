import test from 'node:test';
import assert from 'node:assert/strict';
import {ECOSYSTEM_CAPABILITIES} from '../lib/ecosystem/catalog';
import {parseEngagement} from '../lib/ecosystem/contracts';
import {readHazardPublicLocation} from '../lib/ecosystem/hazard-public-adapter';
import {NetworkBudget} from '../lib/ecosystem/transport';
import {executeEngagement} from '../lib/ecosystem/orchestrator';

const cap=ECOSYSTEM_CAPABILITIES.find(c=>c.id==='location-hazard-intelligence')!;
const now=()=>new Date().toISOString();
const point={problem:'Assess current weather and fire hazards for a public point.',audience:'Local response team',geography:{kind:'point',latitude:34.1,longitude:-78.2},domains:['hazards'],externalConsent:true};
const county={...point,geography:{kind:'county',countyFips:'37047'}};
const response=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
function wire(kind:'point'|'county',overrides:Record<string,unknown>={}){
 const row=(publisher:string,source:string,label:string)=>({publisher,source,label,freshness:'UNKNOWN',retrievedAt:now()});
 return {schemaVersion:'dis-location-hazards-v1',capabilityId:'hazard-signals/location-hazards',status:'partial',generatedAt:now(),
  request:{geography:kind==='point'?{type:'point',lat:34.1,lon:-78.2}:{type:'county',fips:'37047'}},
  evidence:kind==='point'?[row('NOAA / National Weather Service','https://api.weather.gov/alerts/active','OFFICIAL'),{...row('NOAA / National Weather Service','https://api.weather.gov/','FORECAST'),observedAt:null,issuedAt:now(),validFrom:now(),validThrough:new Date(Date.now()+60*60_000).toISOString()},row('USFS / NIFC WFIGS','https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query','REPORTED'),row('NOAA / National Weather Service','https://api.weather.gov/alerts/active','OFFICIAL'),{...row('Copernicus CAMS via Open-Meteo','https://air-quality-api.open-meteo.com/v1/air-quality','MODELED'),freshness:'UNKNOWN',observedAt:null,issuedAt:null,validAt:now()},row('U.S. EPA AirNow','https://www.airnow.gov/','MEASURED')]:[row('FEMA OpenFEMA',"https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?%24filter=placeCode+eq+%2799047%27+and+state+eq+%27NC%27",'OFFICIAL / REPORTED'),row('FEMA OpenFEMA',"https://www.fema.gov/api/open/v2/PublicAssistanceFundedProjectsDetails?%24filter=countyCode+eq+%27047%27+and+stateNumberCode+eq+%2737%27",'OFFICIAL / REPORTED'),row('FEMA National Risk Index',"https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query?where=STCOFIPS%3D%2737047%27",'REFERENCE / MODELED')],
  signals:kind==='point'?{ember:{sourceStatus:{alerts:'available',wind:'available',fires:'unavailable'},observed:{fireWeatherAlerts:[{event:'Fire Weather Watch'}],wind:{sustainedMph:10,gustMph:18,asOf:now(),validThrough:new Date(Date.now()+60*60_000).toISOString(),gridUpdatedAt:now(),source:'NWS forecast grid (api.weather.gov gridpoint)'},nearbyFires:[]}},smoke:{sourceStatus:{officialAlerts:'available',modeled:'available',ground:'not_configured'},official:{airQualityAlerts:[]},modeled:{pm25:12,usAqi:48,source:'Copernicus CAMS global atmospheric model via Open-Meteo — MODEL'},ground:{state:'not_configured'}}}:{declarations:{status:'live',rows:[{}]},publicAssistance:{status:'live',projects:[{}]},nationalRiskIndex:{status:'live',county:{countyFips:'37047'}}},
  authority:{humanDecisionRequired:true,automatedAlerts:false,deviceControl:false},limits:['Interpret sources before action.'],...overrides};
}

test('point execution preserves source, geographic, temporal and decision boundaries',async()=>{
 const calls:string[]=[];
 const fetcher:typeof fetch=async(raw,options)=>{const u=new URL(String(raw));calls.push(u.href);assert.equal(u.origin,'https://hazardaware.vercel.app');assert.equal(u.pathname,'/api/dis/hazards/location');assert.equal(u.searchParams.get('lat'),'34.1');assert.equal(u.searchParams.get('lon'),'-78.2');assert.equal(new Headers(options?.headers).has('authorization'),false);return response(wire('point'));};
 const r=await readHazardPublicLocation(cap,parseEngagement(point),new NetworkBudget(1,1000,100000,fetcher));
 assert.equal(calls.length,1);assert.equal(r.state,'RETURNED');assert.equal(r.requestCount,1);assert.equal(r.privateDataTransferred,false);
 assert.equal(r.items.find(i=>i.id==='hazard-nws-wind')?.url,'https://api.weather.gov/');
 assert.ok(Date.parse(String(r.items.find(i=>i.id==='hazard-nws-wind')?.data.validThrough))>Date.now());
 assert.equal(r.items.find(i=>i.id==='hazard-nws-wind')?.data.sourceObservedAt,null);
 assert.ok(r.items.find(i=>i.id==='hazard-nws-wind')?.data.sourceIssuedAt);
 assert.equal(r.items.find(i=>i.id==='hazard-modeled-air')?.data.sourceFreshness,'UNKNOWN');
 assert.ok(r.items.find(i=>i.id==='hazard-modeled-air')?.data.sourceValidAt);
 assert.equal(r.items.find(i=>i.id==='hazard-modeled-air')?.data.kind,'modeled-point');
 assert.equal(r.items.find(i=>i.id==='hazard-nws-fire')?.data.sourceFreshness,'UNKNOWN');
 assert.equal(r.items.some(i=>i.data.disInterpretation!=='SITUATIONAL_EVIDENCE_ONLY'),false);
 assert.match(r.limitations.join(' '),/did not send an alert/);
});

test('county history is never represented as a live warning or repair outcome',async()=>{
 const r=await readHazardPublicLocation(cap,parseEngagement(county),new NetworkBudget(1,1000,100000,async raw=>{assert.equal(new URL(String(raw)).searchParams.get('fips'),'37047');return response(wire('county'));}));
 assert.equal(r.state,'RETURNED');assert.ok(r.items.every(i=>i.geography==='County 37047'));
 assert.ok(r.items.every(i=>!String(i.data.kind).includes('current')));
 assert.match(r.items.find(i=>i.id==='hazard-fema-assistance')?.summary||'',/not necessarily an expenditure or completed repair/);
 assert.match(r.limitations.join(' '),/cannot answer whether an active NWS warning/);
});

test('mismatched geography, missing provenance and absent source lanes fail closed',async()=>{
 for(const altered of [wire('point',{request:{geography:{type:'point',lat:37,lon:-78.2}}}),wire('point',{evidence:[{publisher:'NOAA / National Weather Service',source:'http://invalid.example',label:'OFFICIAL',freshness:'FRESH',retrievedAt:now()}]})]){
  await assert.rejects(()=>readHazardPublicLocation(cap,parseEngagement(point),new NetworkBudget(1,1000,100000,async()=>response(altered))),/HazardAware|hazard evidence/i);
 }
 const empty=wire('point',{status:'unknown',signals:{}});
 const r=await readHazardPublicLocation(cap,parseEngagement(point),new NetworkBudget(1,1000,100000,async()=>response(empty)));
 assert.equal(r.state,'EMPTY_SOURCE_RESULT');assert.match(r.reason,/Unknown is not a low-risk/);
});

test('contradictory publisher lane and foreign county risk row are rejected',async()=>{
 const badPoint=wire('point');
 (badPoint.evidence[1] as Record<string,unknown>)={...(badPoint.evidence[1] as object),label:'MEASURED',source:'https://example.invalid/not-noaa',observedAt:{unexpected:'not-a-timestamp'}};
 await assert.rejects(()=>readHazardPublicLocation(cap,parseEngagement(point),new NetworkBudget(1,1000,100000,async()=>response(badPoint))),/hazard evidence lane/i);
 const badCounty=wire('county');
 (badCounty.signals as Record<string,unknown>).nationalRiskIndex={status:'live',county:{countyFips:'48491'}};
 await assert.rejects(()=>readHazardPublicLocation(cap,parseEngagement(county),new NetworkBudget(1,1000,100000,async()=>response(badCounty))),/does not verify the requested county/i);
});

test('DIS refuses a city-to-county substitution and requires external consent before retrieval',async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>{calls++;return response(wire('point'));};
 const city=await readHazardPublicLocation(cap,parseEngagement({...point,geography:{kind:'city',label:'Columbus',stateFips:'37',countyFips:'37149'}}),new NetworkBudget(1,1000,100000,fetcher));
 assert.equal(city.state,'NEEDS_CONTEXT');assert.equal(calls,0);
 const noConsent=await executeEngagement({...point,externalConsent:false},{kind:'PUBLIC_ONLY'},{fetcher});
 assert.ok(noConsent.receipts.some(r=>r.capabilityId===cap.id&&r.state==='CONSENT_REQUIRED'));assert.equal(calls,0);
});
