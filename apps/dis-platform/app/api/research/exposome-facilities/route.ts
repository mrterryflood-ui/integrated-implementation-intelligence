/** Public-source EPA ECHO geospatial research adapter.
 * Bounded FIPS county lookup is reusable across diseases. No patient-level data,
 * arbitrary URL proxy, inferential cancer attribution or secret is involved.
 */
import {NextResponse} from "next/server";

export const runtime="nodejs";
export const maxDuration=20;
const SOURCE="https://echogeo.epa.gov/arcgis/rest/services/ECHO/Facilities/MapServer/0";
const COUNTIES={
 hinds:{fips:"28049",label:"Hinds County, Mississippi"},
 harris:{fips:"48201",label:"Harris County, Texas"}
} as const;
type County=keyof typeof COUNTIES;
type Position=[number,number];

function safeFeature(raw:unknown){
 if(!raw||typeof raw!=="object")return null;
 const f=raw as {geometry?:{type?:unknown,coordinates?:unknown};properties?:Record<string,unknown>};
 if(f.geometry?.type!=="Point"||!Array.isArray(f.geometry.coordinates))return null;
 const p=f.geometry.coordinates as unknown[];
 if(typeof p[0]!=="number"||typeof p[1]!=="number"||!Number.isFinite(p[0])||!Number.isFinite(p[1])||
 Math.abs(p[0])>180||Math.abs(p[1])>90)return null;
 const props=f.properties??{};
 const text=(key:string,max=140)=>typeof props[key]==="string"?String(props[key]).slice(0,max):"";
 const xy:Position=[p[0],p[1]];
 return {type:"Feature" as const,geometry:{type:"Point" as const,coordinates:xy},
  properties:{name:text("FAC_NAME"),city:text("FAC_CITY"),state:text("FAC_STATE",2),
   county:text("FAC_COUNTY"),registryId:text("REGISTRY_ID",55),programIcon:text("FAC_MAP_ICON",28)}};
}
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const site=params.get("county");
 const named=(site==="hinds"||site==="harris")?COUNTIES[site as County]:null;
 const rawFips=params.get("countyFips");
 const fips=named?.fips||rawFips||"";
 if(!/^[0-9]{5}$/.test(fips)||fips==="00000"||fips.slice(2)==="000")
   return NextResponse.json({error:"Provide county=hinds/harris or a five-digit countyFips."},{status:400});
 const countyLabel=named?.label||"County FIPS "+fips;
 const rawOffset=params.get("offset")||"0";
 if(!/^[0-9]{1,5}$/.test(rawOffset)||Number(rawOffset)>10000)
   return NextResponse.json({error:"Invalid page offset."},{status:400});
 const offset=Number(rawOffset);
 const query=new URL(SOURCE+"/query");
 query.searchParams.set("where","FAC_DERIVED_STCTY_FIPS='"+fips+"'");
 query.searchParams.set("outFields","FAC_NAME,FAC_CITY,FAC_STATE,FAC_COUNTY,REGISTRY_ID,FAC_MAP_ICON");
 query.searchParams.set("returnGeometry","true");
 query.searchParams.set("outSR","4326");
 query.searchParams.set("resultRecordCount","250");
 query.searchParams.set("resultOffset",String(offset));
 query.searchParams.set("f","geojson");
 try{
  const res=await fetch(query.toString(),{signal:AbortSignal.timeout(10000),next:{revalidate:86400}});
  if(!res.ok)throw Error("EPA service did not return a successful response.");
  const raw=await res.text();
  if(raw.length>2400000)throw Error("EPA response exceeded bounded payload size.");
  const data:unknown=JSON.parse(raw);
  if(!data||typeof data!=="object"||!Array.isArray((data as {features?:unknown[]}).features))
   throw Error("EPA GeoJSON could not be verified.");
  const found=(data as {features:unknown[]}).features;
  const features=found.slice(0,250).map(safeFeature).filter((x):x is NonNullable<typeof x>=>x!==null);
  return NextResponse.json({
   schemaVersion:"dis-exposome-epa-v1",county:countyLabel,countyFips:fips,pageOffset:offset,nextOffset:found.length>=250?offset+250:null,
   source:SOURCE,sourceOwner:"U.S. EPA ECHO",sourceType:"REGULATED_FACILITY_LOCATION_NOT_EXPOSURE",
   sourcePeriod:"EPA current map service; check last refresh at original source",
   geometry:"POINT_LOCATION",facilityCountReturned:features.length,
   truncated:found.length>=250,
   comparability:"Facility discovery only; missing facilities and reporting conditions can vary. Count is not a cancer or exposure rate.",
   features
  },{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
 }catch{
  return NextResponse.json({error:"EPA ECHO location layer unavailable; no facilities have been inferred.",
   source:SOURCE,features:[],sourceType:"UNAVAILABLE"}, {status:503});
 }
}
