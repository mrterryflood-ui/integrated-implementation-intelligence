import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {GET} from "../app/api/research/exposome-facilities/route";

test("EPA GIS endpoint rejects unsafe countyFips and page offsets without fetching",async()=>{
 const bad=[
 "https://local.invalid/api/research/exposome-facilities?countyFips=48201%27%20OR%201%3D1",
 "https://local.invalid/api/research/exposome-facilities?countyFips=28000",
 "https://local.invalid/api/research/exposome-facilities?countyFips=48201&offset=-1",
 "https://local.invalid/api/research/exposome-facilities?countyFips=48201&offset=10001"
 ];
 for(const url of bad){
  const response=await GET(new Request(url));
  assert.equal(response.status,400);
 }
});
test("EPA point conversion is source-grounded and never equates a facility to exposure or cancer",async()=>{
 const original=globalThis.fetch;
 let requested="";
 globalThis.fetch=(async(input:RequestInfo|URL)=>{
  requested=String(input);
  return new Response(JSON.stringify({type:"FeatureCollection",features:[
   {type:"Feature",geometry:{type:"Point",coordinates:[-95.34,29.74]},properties:{FAC_NAME:"Registered site",FAC_CITY:"Houston",FAC_STATE:"TX",REGISTRY_ID:"EPAref"}},
   {type:"Feature",geometry:{type:"Polygon",coordinates:[]},properties:{FAC_NAME:"Not a point"}}
  ]}),{status:200,headers:{"Content-Type":"application/geo+json"}});
 }) as typeof fetch;
 try{
  const response=await GET(new Request("https://local.invalid/api/research/exposome-facilities?countyFips=48201"));
  assert.equal(response.status,200);
  const data=await response.json();
  assert.match(requested,/FAC_DERIVED_STCTY_FIPS/);
  assert.match(requested,/48201/);
  assert.equal(data.facilityCountReturned,1);
  assert.equal(data.sourceType,"REGULATED_FACILITY_LOCATION_NOT_EXPOSURE");
  assert.equal(data.features[0].properties.name,"Registered site");
  assert.ok(!JSON.stringify(data).includes("cancerCaused"));
 }finally{globalThis.fetch=original;}
});
test("research studio links existing GIS and preserves original epidemiologic context",()=>{
 const source=readFileSync("app/research-program/page.tsx","utf8");
 assert.match(source,/href="\/research-program\/exposome"/);
 const atlas=readFileSync("app/research-program/exposome/exposome-atlas.tsx","utf8");
 assert.match(atlas,/2019–2023/);
 assert.match(atlas,/2018–2022/);
 assert.match(atlas,/REGULATED_FACILITY_LOCATION_NOT_EXPOSURE|not a measured exposure|neither a complete landfill inventory/i);
});
