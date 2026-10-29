"use client";
import {useEffect,useRef,useState} from "react";
type Place={name:string,county:string,lat:number,lon:number,level:string};
const places:Place[]=[
 {name:"Killeen",county:"Bell",lat:31.1171,lon:-97.7278,level:"Pilot"},
 {name:"Temple",county:"Bell",lat:31.0982,lon:-97.3428,level:"Pilot"},
 {name:"Waco",county:"McLennan",lat:31.5493,lon:-97.1467,level:"Pilot"},
 {name:"Austin",county:"Travis / Williamson",lat:30.2672,lon:-97.7431,level:"Pilot"},
 {name:"San Antonio",county:"Bexar",lat:29.4241,lon:-98.4936,level:"Expansion"},
 {name:"Houston",county:"Harris",lat:29.7604,lon:-95.3698,level:"Expansion"}
];
const sources=[
 ["Texas Geographic Information Office","https://geographic.texas.gov/stratmap/land-parcels","Statewide parcels: check coverage & dates"],
 ["Travis County parcel GIS","https://gis.traviscountytx.gov/server1/rest/services/Boundaries_and_Jurisdictions/TCAD_public/MapServer","Public reference geometry"],
 ["FEMA flood hazards","https://msc.fema.gov/portal/home","Flood maps and effective status"],
 ["USDA NRCS soils","https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey","Soils and land feasibility"],
 ["Texas Railroad Commission","https://www.rrc.texas.gov/resource-center/research/gis-viewer/","Wells and pipeline context"],
 ["Bell County records","https://bell.tx.publicsearch.us/","Recorded-property evidence"],
 ["McLennan foreclosure notices","https://www.mclennan.gov/173/Foreclosure-Sale-Site","Historical notice source"],
 ["Williamson trustee sales","https://apps.wilco.org/countyclerk/trustee_sales/","Public notices, check status"],
 ["Harris County foreclosure","https://cclerk.hctx.net/Applications/WebSearch/FRCL_R.aspx","Public records, check status"]
] as const;
const imagery={
 aerial:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
 topo:"https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}"
} as const;
export default function RealtyAtlasClient(){
 const mapElement=useRef<HTMLDivElement>(null),mapInstance=useRef<any>(null),leaflet=useRef<typeof import("leaflet")|null>(null),baseLayer=useRef<any>(null),parcelLayer=useRef<any>(null);
 const [city,setCity]=useState("Austin"),[layer,setLayer]=useState<keyof typeof imagery>("aerial"),[state,setState]=useState("Select Austin, then click a location to query a public Travis County parcel boundary."),[selected,setSelected]=useState<{lat:number,lon:number,provider:string}|null>(null),[loading,setLoading]=useState(false);
 useEffect(()=>{
  let live=true;
  async function init(){
   const L=await import("leaflet");if(!live||!mapElement.current||mapInstance.current)return;
   leaflet.current=L;
   const map=L.map(mapElement.current,{center:[30.55,-97.58],zoom:7,zoomControl:true,attributionControl:true,maxZoom:18});
   mapInstance.current=map;
   baseLayer.current=L.tileLayer(imagery.aerial,{attribution:"USGS The National Map · USDA NAIP and contributing imagery providers | historical imagery, date varies",maxZoom:18,maxNativeZoom:15,crossOrigin:true}).addTo(map);
   for(const p of places)L.circleMarker([p.lat,p.lon],{radius:8,fillColor:"#DBBD79",color:"#183A4B",weight:2,fillOpacity:0.93}).addTo(map).bindTooltip(p.name+" · "+p.county+" County · "+p.level);
   map.on("click",async(e:any)=>{
    setLoading(true);setState("Checking official public parcel geometry…");
    try{
     const res=await fetch("/api/realty/parcel?lat="+encodeURIComponent(e.latlng.lat.toFixed(6))+"&lon="+encodeURIComponent(e.latlng.lng.toFixed(6)));
     const data=await res.json();
     if(!res.ok)throw Error(data.error||"Provider unavailable");
     if(parcelLayer.current){map.removeLayer(parcelLayer.current);parcelLayer.current=null}
     if(data.geojson?.geometry&&data.status==="PUBLIC_GEOMETRY_FOUND"){
      parcelLayer.current=L.geoJSON(data.geojson,{style:{color:"#F0D18C",weight:3,opacity:1,fillColor:"#D7AF70",fillOpacity:0.18}}).addTo(map);
      setSelected({lat:e.latlng.lat,lon:e.latlng.lng,provider:"Travis County public GIS"});
      setState("Public parcel geometry returned. Not a legal survey, ownership confirmation, property valuation, or evidence of foreclosure. Date and conditions require verification.");
     }else{
      setSelected(null);setState(data.note||"No verified parcel result for this click.");
     }
    }catch{setSelected(null);setState("Parcel GIS service unavailable. No parcel was identified or verified.");}
    finally{setLoading(false)}
   });
  }
  void init();
  return ()=>{live=false;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;parcelLayer.current=null;baseLayer.current=null;leaflet.current=null}};
 },[]);
 useEffect(()=>{const m=mapInstance.current;if(!m)return;const p=places.find(x=>x.name===city);if(p){m.flyTo([p.lat,p.lon],city==="Austin"?12:10,{duration:.7});setSelected(null);setState(city==="Austin"?"Travis County live public parcel querying is available for map clicks in the supported area. Other counties currently show location context only.":"Public parcel polygon querying is not yet connected for "+p.county+" County. Open official sources below and verify source permissions.");if(parcelLayer.current){m.removeLayer(parcelLayer.current);parcelLayer.current=null}}},[city]);
 useEffect(()=>{const m=mapInstance.current,L=leaflet.current;if(!m||!L)return;if(baseLayer.current)m.removeLayer(baseLayer.current);baseLayer.current=L.tileLayer(imagery[layer],{attribution:"USGS The National Map · USDA NAIP and contributing orthoimagery; source date varies",maxZoom:18,maxNativeZoom:15,crossOrigin:true}).addTo(m)},[layer]);
 return <main className="realty-atlas"><header className="realty-atlas-header"><p className="eyebrow">DYNAMIC INTELLIGENCE / REALTY GIS SANDBOX</p><h1>From a map pin to an evidence-based decision.</h1><p>A real USGS aerial basemap, approximate regional market anchors, and a public Travis County parcel geometry test. No individual homeowner distress, financial data, call records, or mortgage payoff is collected or displayed.</p><a href="/#consult">← Return to DIS consultation</a></header>
 <div className="atlas-layout"><section className="atlas-map-panel"><div className="atlas-toolbar"><label>Focus market<select value={city} onChange={e=>setCity(e.target.value)}>{places.map(p=><option key={p.name}>{p.name}</option>)}</select></label><div role="group" aria-label="Imagery style"><button type="button" aria-pressed={layer==="aerial"} onClick={()=>setLayer("aerial")}>USGS aerial</button><button type="button" aria-pressed={layer==="topo"} onClick={()=>setLayer("topo")}>Imagery + topo</button></div></div>
 <div ref={mapElement} className="atlas-map" role="application" aria-label="Interactive USGS aerial map; select a city then click Travis County to inspect a public parcel boundary"/>
 <div className="atlas-status" role="status"><strong>{loading?"Loading official geometry":selected?"Reference geometry selected":"Source status"}</strong><p>{state}</p>{selected&&<p>Approximate click: {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)} · {selected.provider}</p>}</div>
 <p className="atlas-attribution">USGS NAIP imagery is historical; not a current inspection. Parcel polygons are reference representations, not surveys. County data terms and commercial-reuse rights require review.</p></section>
 <aside className="atlas-sidebar"><div className="atlas-legend"><h2>Truth over appearance</h2><p>Imagery and GIS are tools for investigation, not proof of title, current condition or owner hardship.</p><div><span className="atlas-swatch"/> Approximate market anchor</div><div><span className="atlas-swatch gold"/> Official reference parcel, Travis only</div><div><span className="atlas-swatch grey"/> Unconnected private or restricted data</div></div>
 <h3>Layer readiness</h3><ul className="atlas-layer-list"><li><strong>USGS aerial imagery</strong><span>Public basemap · connected</span></li><li><strong>Travis parcel geometry</strong><span>One-click public query · test</span></li><li><strong>Flood, soil, zoning, ETJ, utility and mineral rights</strong><span>Official source links, not overlaid</span></li><li><strong>MLS comparable sales</strong><span>Requires licensed data</span></li><li><strong>Homeowner call history</strong><span>Requires consented telephony integration</span></li><li><strong>Foreclosure notice verification</strong><span>Requires live county source + human review</span></li></ul>
 <h3>Official research starting points</h3><div className="atlas-sources">{sources.map(([name,url,desc])=><a key={name} href={url} target="_blank" rel="noopener noreferrer"><strong>{name}</strong><small>{desc}</small></a>)}</div>
 </aside></div>
 <p className="atlas-warning">This is a map-first research demonstrator, not an acquisition or outreach platform. No external messages or mortgage negotiations are performed. Public records may be stale or restricted by source terms. Any operational use requires licensing, legal review, source validation, and tenant-secure access.</p></main>
}
