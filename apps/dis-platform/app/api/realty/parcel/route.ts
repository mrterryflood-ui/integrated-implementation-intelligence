import {NextResponse} from "next/server";
export const runtime="nodejs";
export const maxDuration=18;
const TRAVIS="https://gis.traviscountytx.gov/server1/rest/services/Boundaries_and_Jurisdictions/TCAD_public/MapServer/0/query";
const VALID_LAT=[30.04,30.65],VALID_LON=[-98.28,-97.28];
export function validPoint(lat:number,lon:number){
 return Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=VALID_LAT[0]&&lat<=VALID_LAT[1]&&lon>=VALID_LON[0]&&lon<=VALID_LON[1];
}
export async function queryPublicParcel(lat:number,lon:number,fetcher:typeof fetch=fetch){
 if(!validPoint(lat,lon))return {status:"OUTSIDE_SUPPORTED_AREA" as const,geojson:null,note:"Only the Travis County public parcel layer is connected in this preview; this does not verify property ownership."};
 const params=new URLSearchParams({geometry:lon.toFixed(6)+","+lat.toFixed(6),geometryType:"esriGeometryPoint",inSR:"4326",spatialRel:"esriSpatialRelIntersects",returnGeometry:"true",outSR:"4326",outFields:"OBJECTID",resultRecordCount:"1",f:"geojson"});
 const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),8000);
 try{
  const r=await fetcher(TRAVIS+"?"+params.toString(),{signal:ac.signal,cache:"no-store"});
  if(!r.ok)return {status:"UNAVAILABLE" as const,geojson:null,note:"Travis GIS provider returned HTTP "+r.status};
  const data:any=await r.json();
  const feature=data?.features?.[0];
  if(!feature?.geometry||!(["Polygon","MultiPolygon"].includes(feature.geometry.type)))return {status:"NO_PARCEL" as const,geojson:null,note:"No parcel geometry returned for this coordinate. Do not infer the property is unowned or absent."};
  const geometry=feature.geometry;
  if(JSON.stringify(geometry).length>250000)return {status:"TOO_LARGE" as const,geojson:null,note:"Parcel requires simplified geometry review."};
  return {status:"PUBLIC_GEOMETRY_FOUND" as const,geojson:{type:"Feature" as const,geometry,properties:{source:"Travis County public parcel layer",sourceDate:"Provider current response, underlying appraisal date not independently confirmed"}},note:"Parcel polygon is cadastral/reference geometry, not a boundary survey, legal deed or verification of owner distress."};
 }catch{return {status:"UNAVAILABLE" as const,geojson:null,note:"Official public parcel query unavailable or timed out."}}finally{clearTimeout(timer)}
}
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const lat=Number(params.get("lat")),lon=Number(params.get("lon"));
 if(!params.has("lat")||!params.has("lon")||!Number.isFinite(lat)||!Number.isFinite(lon))return NextResponse.json({error:"Valid latitude and longitude required"},{status:400});
 const data=await queryPublicParcel(lat,lon);
 return NextResponse.json({...data,provider:"Travis County public GIS",url:TRAVIS.split("/query")[0],permission:"Public map access; commercial redistribution, bulk access and ownership data are not authorized by this endpoint.",rights:"Not a legal survey or zoning decision.",lat,lon},{headers:{"cache-control":"public, max-age=120","x-content-type-options":"nosniff"}});
}
