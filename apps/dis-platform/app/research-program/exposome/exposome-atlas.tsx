"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";

const sites={
 hinds:{name:"Hinds County, Mississippi",city:"Jackson",lat:32.2988,lng:-90.1848,share:63.3,rate:30.4},
 harris:{name:"Harris County, Texas",city:"Houston",lat:29.7604,lng:-95.3698,share:63.4,rate:23.3}
} as const;
type Site=keyof typeof sites;
type Facility={type:"Feature";geometry:{type:"Point";coordinates:[number,number]};properties:{name:string;city:string;state:string;registryId:string}};
type FacilityResponse={features:Facility[];facilityCountReturned:number;truncated:boolean};
const states=[
 {name:"Mississippi",share:63.0,rate:28.9},{name:"Missouri",share:63.3,rate:25.7},
 {name:"Colorado",share:64.0,rate:19.7},{name:"North Carolina",share:63.1,rate:22.6},
 {name:"Texas",share:61.5,rate:23.7},{name:"Alabama",share:53.8,rate:21.9},
 {name:"California",share:56.1,rate:19.6},{name:"United States",share:60.2,rate:22.3}
];
const sources=[
 ["EPA ECHO regulated facilities","https://echo.epa.gov/tools/map-service","Map points available here; not measured pollution or exposure"],
 ["EPA Superfund sites","https://www.epa.gov/superfund/superfund-national-priorities-list-npl","Site boundaries, media and operating years require independent linkage"],
 ["EPA Toxics Release Inventory","https://www.epa.gov/toxics-release-inventory-tri-program","Chemicals, quantities, facilities and historical release periods require linkage"],
 ["EPA Air Quality System","https://www.epa.gov/aqs","Monitoring and exposure modeling require historical matching"],
 ["USGS water quality","https://www.usgs.gov/mission-areas/water-resources/science/water-quality","Groundwater and drinking-water pathways require supply-system linkage"],
 ["USDA Food Environment Atlas","https://www.ers.usda.gov/data-products/food-environment-atlas","County restaurant, grocery and food context; not dietary consumption"],
 ["USDA Food Access Research Atlas","https://www.ers.usda.gov/data-products/food-access-research-atlas","Tract retail access with census vintage and year controls"],
 ["Census American Community Survey","https://data.census.gov","Population age, housing, occupation and mobility context"],
 ["NCI State Cancer Profiles","https://statecancerprofiles.cancer.gov","Published stage and incidence; all-stage incidence also needed"],
 ["NCI genetics of colorectal cancer","https://www.cancer.gov/types/colorectal/hp/colorectal-genetics-pdq","Inherited predisposition evidence; individual genotype never inferred"]
] as const;
export default function ExposomeAtlas(){
 const element=useRef<HTMLDivElement>(null),m=useRef<import("leaflet").Map|null>(null),
  Lref=useRef<typeof import("leaflet")|null>(null),group=useRef<import("leaflet").LayerGroup|null>(null);
 const [site,setSite]=useState<Site>("hinds"),[show,setShow]=useState(true);
 const [facilities,setFacilities]=useState<FacilityResponse|null>(null);
 const [message,setMessage]=useState("The public layer has not been queried.");
 const [metric,setMetric]=useState<"share"|"rate">("rate");
 useEffect(()=>{let alive=true;(async()=>{
  if(!element.current)return;const L=await import("leaflet");
  if(!alive||!element.current||m.current)return;
  Lref.current=L;const map=L.map(element.current,{center:[sites.hinds.lat,sites.hinds.lng],zoom:10,preferCanvas:true});
  m.current=map;
  L.tileLayer("https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}",{
   attribution:"USGS The National Map · imagery dates vary",maxZoom:17,maxNativeZoom:15
  }).addTo(map);
  group.current=L.layerGroup().addTo(map);
 })();return()=>{alive=false;m.current?.remove();m.current=null;group.current=null;Lref.current=null};},[]);
 useEffect(()=>{m.current?.flyTo([sites[site].lat,sites[site].lng],10,{duration:.3});},[site]);
 useEffect(()=>{let alive=true;setFacilities(null);setMessage("Checking EPA ECHO facility locations.");
 (async()=>{try{
   const r=await fetch("/api/research/exposome-facilities?county="+site,{cache:"no-store"});
   if(!alive)return;const data=await r.json() as FacilityResponse;
   if(!r.ok||!Array.isArray(data.features))throw Error("Unavailable");
   setFacilities(data);setMessage("EPA returned "+data.facilityCountReturned+" facility map points"+(data.truncated?" (250-result cap; incomplete)":"")+". A facility is not evidence of measured exposure or cancer causation.");
  }catch{if(alive){setFacilities(null);setMessage("EPA ECHO query unavailable. No data inferred.");}}})();
 return()=>{alive=false};
 },[site]);
 useEffect(()=>{const L=Lref.current,g=group.current;if(!L||!g)return;g.clearLayers();
 if(!show||!facilities)return;
 for(const f of facilities.features){
  const [lng,lat]=f.geometry.coordinates;
  if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
  const marker=L.circleMarker([lat,lng],{radius:4,color:"#853857",weight:1,fillOpacity:.5});
  const scrub=(s:string)=>s.replace(/[&<>"']/g,"");
  marker.bindTooltip(scrub(f.properties.name||"EPA registered facility")+" · "+scrub(f.properties.city||""));
  marker.addTo(g);
 }
 },[facilities,show]);
 const chosen=sites[site],arr=[...states].sort((a,b)=>b[metric]-a[metric]),max=Math.max(...arr.map(s=>s[metric]));
 return <main style={{maxWidth:1180,margin:"0 auto",padding:"24px 16px",fontFamily:"system-ui,sans-serif",color:"#1d3340",lineHeight:1.55}}>
  <Link href="/research-program">← Research-to-Implementation Studio</Link> <span> · </span><Link href="/research-program/national-cancers">National comparison: colorectal, lung, breast (50 states)</Link>
  <p style={{letterSpacing:2,textTransform:"uppercase",fontSize:12}}>DIS · Exposome and primary prevention research</p>
  <h1>Locate the questions. Investigate exposures. Prevent disease.</h1>
  <p>This is a reusable place-based research atlas. It displays official EPA facility *locations* and published colorectal cancer aggregates. It does not infer individual exposure, risk, residence, industrial causation, or the effectiveness of a prevention program. Industrial sites, food establishments, genetics and care pathways must be investigated jointly, with competing explanations.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(325px,1fr))",gap:16}}>
   <section style={{padding:14,border:"1px solid #b8cad3",borderRadius:10}}>
    <h2>Official EPA facility points</h2>
    <label htmlFor="county">Reference county</label>
    <select id="county" value={site} onChange={e=>setSite(e.target.value as Site)} style={{display:"block",width:"100%",padding:8,margin:"8px 0"}}>
     {Object.entries(sites).map(([key,s])=><option key={key} value={key}>{s.name}</option>)}
    </select>
    <label><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Show regulated-facility locations</label>
    <div ref={element} role="application" aria-label="EPA ECHO point locations on a USGS imagery map" style={{height:390,background:"#e2e8eb",marginTop:12,borderRadius:6}}/>
    <p role="status">{message}</p>
    <p>{chosen.city} is the reference city. County diagnosis share: <b>{chosen.share}%</b>; county late-stage incidence: <b>{chosen.rate}</b> per 100,000 annually (2018–2022).</p>
    <p style={{fontSize:12}}>County statistics describe residents across the county, not pinpointed cases. EPA ECHO points are neither a complete landfill inventory nor a substitute for chemical release, wind, water, historical exposure and latency models.</p>
   </section>
   <section style={{padding:14,border:"1px solid #b8cad3",borderRadius:10}}>
    <h2>Find similar outcomes and divergence</h2>
    <p style={{fontSize:13}}>Selected state populations; 2019–2023 NCI late-stage colorectal figures. Keep this series separate from 2018–2022 county observations.</p>
    <fieldset style={{display:"flex",gap:16,flexWrap:"wrap",border:0,padding:0}}>
     <legend>Measurement</legend>
     <label><input type="radio" checked={metric==="rate"} onChange={()=>setMetric("rate")}/> Incidence per 100,000</label>
     <label><input type="radio" checked={metric==="share"} onChange={()=>setMetric("share")}/> Share of diagnosed cases late-stage</label>
    </fieldset>
    <div style={{display:"grid",gap:9,marginTop:14}}>
    {arr.map(s=><div key={s.name} style={{display:"grid",gridTemplateColumns:"110px minmax(85px,1fr) 52px",gap:8,alignItems:"center"}}>
     <span style={{fontSize:12}}>{s.name}</span><div style={{background:"#e0e9eb",height:14,borderRadius:4,overflow:"hidden"}}>
      <div style={{width:(s[metric]/max*100)+"%",height:"100%",background:s.name==="Mississippi"||s.name==="Texas"?"#a16e32":"#316781"}}/>
     </div><b>{s[metric]}{metric==="share"?"%":""}</b>
    </div>)}</div>
    <p style={{fontSize:12}}>A matched share does not identify shared causes. A stage *fraction* is not a measure of acquiring cancer. Examine all-stage age-standardized incidence and site-specific case mix before interpretation.</p>
   </section>
  </div>
  <h2>Connect research layers across diseases</h2>
  <p>The source catalog below is available for any disease question. Only the EPA ECHO facility-point layer is displayed in this first public view. Other layers are <b>discovery leads</b>, not falsely labeled as joined datasets.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
   {sources.map(([name,url,description])=><article key={name} style={{border:"1px solid #d1dce0",borderRadius:8,padding:12}}>
    <h3 style={{fontSize:15,margin:"0 0 5px"}}><a href={url} target="_blank" rel="noopener noreferrer">{name}</a></h3>
    <p style={{fontSize:12,margin:0}}>{description}</p>
   </article>)}
  </div>
  <h2>From current system to counterfactual system</h2>
  <ol>
   <li><b>Prevent acquisition:</b> quantify all-stage incidence, possible harmful exposures, inherited predisposition, preventable adenoma pathways, and protective factors over appropriate life-course windows.</li>
   <li><b>Understand progression:</b> examine tumor biology, symptom onset and interval cancers independently from screening participation and healthcare access.</li>
   <li><b>Evaluate detection:</b> identify appropriate screening eligibility, symptomatic pathways, diagnostic timeliness and stage reporting.</li>
   <li><b>Compare fair counterfactuals:</b> match places or intervention cohorts on baseline incidence, age, deprivation, care access, smoking, obesity, environmental history and registry completeness; use prospective pre-specified comparisons.</li>
   <li><b>Interpret the map cautiously:</b> model migration, facility operation dates, wind and water pathways, geocoding accuracy, latency, uncertainty, spatial autocorrelation and selection bias. Never call a facility a cause on proximity alone.</li>
   <li><b>Adapt and sustain:</b> use human-selected RPLICE methods via the existing MCP boundary, community co-design, validated prevention outcomes and repeated source refreshes.</li>
  </ol>
  <p style={{fontSize:12}}>Status: Public-source demonstrator. Neither an exposure linkage study nor a site intervention has been completed; no protected health or genetic data are accessed.</p>
 </main>;
}
