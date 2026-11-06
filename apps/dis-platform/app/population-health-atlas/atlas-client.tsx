"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {
 CURATED_COUNTIES,DISEASES,SOURCE_LINKS,COUNTERFACTUALS,COMPARATOR_MIN_ANNUAL,
 comparisonCohort,evidenceGate,findSimilarStageShares,
 type DiseaseId,type HealthObservation
} from "../../lib/population-health-atlas";
const EPA_ECHO="https://echogeo.epa.gov/arcgis/rest/services/ECHO/Facilities/MapServer";
const sourceNote="The EPA ECHO overlay maps regulated facilities and compliance context. It is NOT a verified personal exposure, dose, cancer cluster or causal relationship.";
function fmt(v:number){return v.toLocaleString("en-US",{maximumFractionDigits:1});}
export default function PopulationHealthAtlas(){
 const mapNode=useRef<HTMLDivElement|null>(null),mapRef=useRef<any>(null);
 const leafletRef=useRef<typeof import("leaflet")|null>(null),markersRef=useRef<any>(null),echoOverlayRef=useRef<any>(null);
 const [disease,setDisease]=useState<DiseaseId>("colorectal");
 const [anchorId,setAnchorId]=useState("hinds");
 const [metric,setMetric]=useState<"rate"|"share">("rate");
 const [minimum,setMinimum]=useState(COMPARATOR_MIN_ANNUAL);
 const [showEcho,setShowEcho]=useState(false);
 const [status,setStatus]=useState("This map compares published aggregate observations. County pins are approximate city anchors, not county polygons.");
 const [showRisk,setShowRisk]=useState(true);
 const anchor=CURATED_COUNTIES.find(x=>x.id===anchorId)||CURATED_COUNTIES[0];
 const cohort=useMemo(()=>comparisonCohort(CURATED_COUNTIES,minimum),[minimum]);
 const similar=useMemo(()=>findSimilarStageShares(anchor,CURATED_COUNTIES,1,minimum),[anchor,minimum]);
 const shown=useMemo(()=>disease==="colorectal"?[anchor,...cohort.filter(x=>x.id!==anchor.id)]:[],[disease,anchor,cohort]);
 const currentDisease=DISEASES.find(d=>d.id===disease)!;
 const currentGate=evidenceGate(disease,"incident-late-stage");
 useEffect(()=>{
  let active=true;
  const init=async()=>{
   const L=await import("leaflet");if(!active||!mapNode.current||mapRef.current)return;
   leafletRef.current=L;
   const map=L.map(mapNode.current,{center:[37.2,-97],zoom:4,zoomControl:true,attributionControl:true,minZoom:3,maxZoom:16});
   mapRef.current=map;
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
     attribution:'© OpenStreetMap contributors. Cancer rates: NCI/CDC. ECHO: US EPA.',maxZoom:18
   }).addTo(map);
   markersRef.current=L.layerGroup().addTo(map);
  };
  void init();
  return()=>{active=false;if(mapRef.current){mapRef.current.remove();mapRef.current=null;leafletRef.current=null;markersRef.current=null;echoOverlayRef.current=null;}};
 },[]);
 useEffect(()=>{
  const map=mapRef.current,L=leafletRef.current,group=markersRef.current;
  if(!map||!L||!group)return;
  group.clearLayers();
  if(disease!=="colorectal")return;
  for(const o of shown){
   const isAnchor=o.id===anchor.id;
   const n=metric==="rate"?o.value:o.lateStagePercent;
   if(n===null)continue;
   const radius=isAnchor?12:Math.max(7,Math.min(13,(n/ (metric==="rate"?3.2:7))));
   const point=L.circleMarker([o.lat,o.lon],{
      radius,color:isAnchor?"#1255a7":"#247b78",fillColor:isAnchor?"#1255a7":"#319995",weight:2,fillOpacity:.84
   });
   const label=o.county+", "+o.region;
   point.bindPopup("<strong>"+label+"</strong><p>Late-stage incidence: "+fmt(o.value)+"/100,000</p><p>Late-stage share: "+
      fmt(o.lateStagePercent??0)+"%</p><p>Average annual late-stage cases: "+fmt(o.averageAnnualCount??0)+
      "</p><p>County point is approximate; no environmental or individual attribution.</p>");
   point.on("click",()=>setAnchorId(o.id));
   point.bindTooltip(label);
   point.addTo(group);
  }
 },[shown,metric,disease,anchor.id]);
 useEffect(()=>{
  const map=mapRef.current,L=leafletRef.current;
  if(!map||!L)return;
  function update(){
   if(echoOverlayRef.current){map.removeLayer(echoOverlayRef.current);echoOverlayRef.current=null;}
   if(!showEcho)return;
   const bounds=map.getBounds(),bottom=L!.CRS.EPSG3857.project(bounds.getSouthWest()),top=L!.CRS.EPSG3857.project(bounds.getNorthEast());
   const size=map.getSize(),width=Math.max(100,Math.min(1500,Math.round(size.x))),height=Math.max(100,Math.min(1500,Math.round(size.y)));
   const query=new URLSearchParams({
     bbox:[bottom.x,bottom.y,top.x,top.y].join(","),bboxSR:"3857",imageSR:"3857",
     format:"png32",transparent:"true",size:width+","+height,layers:"show:0",f:"image"
   });
   const url=EPA_ECHO+"/export?"+query.toString();
   echoOverlayRef.current=L!.imageOverlay(url,bounds,{opacity:.75,interactive:false}).addTo(map);
  }
  update();
  map.on("moveend",update);
  return()=>{map.off("moveend",update);if(echoOverlayRef.current){map.removeLayer(echoOverlayRef.current);echoOverlayRef.current=null;}};
 },[showEcho,disease]);
 return <main className="pha-root">
  <header className="pha-head">
   <Link href="/research-program">DIS Research Program</Link>
   <span className="pha-eyebrow">DIFFERENCES IN SYSTEMS · POPULATION HEALTH + GIS</span>
   <h1>Prevent the disease. Understand the system. Test a better counterfactual.</h1>
   <p>Trace disease incidence and advanced diagnosis separately, compare statistically meaningful populations, examine environmental and social context, and design prevention-oriented experiments. Every layer identifies what it measures and what it cannot establish.</p>
   <p className="pha-alert"><strong>Evidence status:</strong> This first release is a curated 2018–2022 NCI colorectal cancer county cohort with optional EPA ECHO compliance map imagery. It is not a live national cancer registry, verified exposure analysis, or a causal model. Other diseases use the same contract but have not yet passed dataset ingestion.</p>
  </header>
  <section className="pha-controls" aria-label="Research comparison controls">
   <label>Disease or condition<select value={disease} onChange={e=>{setDisease(e.target.value as DiseaseId);setStatus("Disease change requires its own accepted primary incidence and staging data; colorectal rates are not reused.");}}>
    {DISEASES.map(d=><option key={d.id} value={d.id}>{d.name}{!d.observedCountyData?" — no verified cohort yet":""}</option>)}
   </select></label>
   <label>Anchor county<select value={anchorId} disabled={disease!=="colorectal"} onChange={e=>setAnchorId(e.target.value)}>
    {CURATED_COUNTIES.map(o=><option key={o.id} value={o.id}>{o.county}, {o.region}</option>)}
   </select></label>
   <label>Compare metric<select value={metric} onChange={e=>setMetric(e.target.value as typeof metric)}>
    <option value="rate">Late-stage incidence / 100,000</option><option value="share">Share of diagnosed cases late-stage (%)</option>
   </select></label>
   <label>Minimum comparator annual count<select value={minimum} onChange={e=>setMinimum(Number(e.target.value))}>
    <option value={50}>50 (≥250 five-year cases)</option><option value={100}>100 (≥500 five-year cases)</option><option value={250}>250 (≥1,250 five-year cases)</option>
   </select></label>
   <label className="pha-check"><input type="checkbox" checked={showEcho} onChange={e=>{setShowEcho(e.target.checked);setStatus(e.target.checked?sourceNote:"EPA facility layer hidden; historical cancer comparisons unchanged.");}}/> Overlay EPA ECHO regulated facilities (context only)</label>
   <label className="pha-check"><input type="checkbox" checked={showRisk} onChange={e=>setShowRisk(e.target.checked)}/> Display causal-uncertainty and prevention framework</label>
  </section>
  <section className="pha-main">
   <div className="pha-mapbox">
    <div ref={mapNode} className="pha-map" role="application" aria-label="Interactive map of source-identified county cancer observations with optional EPA ECHO facility overlay"/>
    <div className="pha-mapnote"><strong>Geographic fidelity:</strong> Approximate labeled city anchors, not county choropleth polygons. Source counts and rates refer to the county. The environmental overlay is separate; proximity does not equal exposure or cause.</div>
    <div className="pha-status" role="status">{status}</div>
   </div>
   <aside className="pha-panel">
    <h2>Mission: {currentDisease.name}</h2>
    <p><strong>Primary outcome:</strong> {currentDisease.primaryOutcome}</p>
    <p><strong>Research question:</strong> {currentDisease.preventionQuestion}</p>
    <p><strong>Observed data:</strong> {currentGate.status.replaceAll("_"," ").toLowerCase()}</p>
    {disease==="colorectal"?<>
     <div className="pha-statgrid">
      <article><small>Anchor late-stage incidence</small><strong>{fmt(anchor.value)}</strong><span>annual per 100,000</span></article>
      <article><small>Anchor late-stage share</small><strong>{fmt(anchor.lateStagePercent??0)}%</strong><span>of diagnosed colorectal cases</span></article>
      <article><small>Average annual late-stage cases</small><strong>{fmt(anchor.averageAnnualCount??0)}</strong><span>CI: {fmt(anchor.ciLow??0)}–{fmt(anchor.ciHigh??0)}</span></article>
      <article><small>Similar stage share</small><strong>{similar.length}</strong><span>large-county matches within ±1 percentage point</span></article>
     </div>
     <p>Matching share is descriptive only, not a validated statistical equivalence or shared etiology. The anchor remains visible even if its annual count falls below the comparator threshold.</p>
     <h3>Primary prevention measurement gap</h3>
     <p>All-stage colorectal incidence, precancerous lesion data and environmental exposure histories have not been ingested into this curated view. Until present, no prevention effect can be calculated. <a href="https://gis.cancer.gov/canceratlas/" target="_blank" rel="noreferrer">Use NCI Cancer Atlas for original all-stage maps</a>.</p>
    </>:<p className="pha-alert">No valid condition-specific county observations are loaded. <a href={currentDisease.canonicalSource} target="_blank" rel="noreferrer">Open the official disease atlas</a> and verify population, measure, time and source before entering this evidence.</p>}
    <h3>Analytic classification</h3><p><strong>Designed:</strong> prevention and reliable care.</p><p><strong>Operational:</strong> observed service and exposure conditions still need verification.</p><p><strong>Experienced:</strong> no actual community testimony was inferred from a GIS layer.</p>
    <p><Link href="/research-program">Open STELLAR, HIL SALP/CFIR and full research-to-action workflow</Link></p>
   </aside>
  </section>
  {disease==="colorectal"&&<section className="pha-section">
   <h2>Large-county comparisons: similarity and divergence</h2>
   <p>Same 2018–2022 disease and staging definition, original NCI source by state. The table is restricted to observed counts, age-adjusted rates and reported stage percentages. No exposures or service-access differences are asserted by this table.</p>
   <div className="pha-tablewrap"><table><thead><tr><th>County</th><th>Late-stage rate (95% CI)</th><th>Share late</th><th>Annual late-stage cases</th><th>Open original source</th></tr></thead>
    <tbody>{shown.sort((a,b)=>b.value-a.value).map(o=><tr key={o.id} data-anchor={o.id===anchor.id?"true":undefined}><td><button type="button" className="pha-linkbutton" onClick={()=>setAnchorId(o.id)}>{o.county}, {o.region}</button></td>
     <td>{fmt(o.value)} ({fmt(o.ciLow??0)}–{fmt(o.ciHigh??0)})</td><td>{fmt(o.lateStagePercent??0)}%</td><td>{fmt(o.averageAnnualCount??0)}</td>
     <td><a href={o.sourceUrl} target="_blank" rel="noreferrer">NCI registry table</a></td></tr>)}</tbody></table></div>
   <h3>Predeclared descriptive comparison with {anchor.county}</h3>
   <div className="pha-tablewrap"><table><thead><tr><th>Large-county match (within ±1 point)</th><th>Stage share difference</th><th>Relative incidence difference</th><th>95% incidence CI ranges</th></tr></thead><tbody>
   {similar.map(x=><tr key={x.county.id}><td>{x.county.county}, {x.county.region}</td><td>{fmt(x.shareDifferencePP)} percentage points</td><td>{fmt(x.rateDifferencePercent)}%</td><td>{x.nonoverlappingRateCIs?"Nonoverlapping":"May overlap"}; neither determines stage-share equivalence</td></tr>)}
   {!similar.length&&<tr><td colSpan={4}>No large-county match under the chosen annual-count threshold and one-point share tolerance.</td></tr>}
   </tbody></table></div>
  </section>}
  {showRisk&&<section className="pha-section">
   <h2>Whole-system prevention, counterfactuals and risk</h2>
   <p>DIS treats susceptibility, exposures, early lesions, access, diagnosis, intervention, cost and outcomes as different causal constructs. Race and geography are descriptors of population and structural conditions, not sufficient explanations of biology or individual risk.</p>
   <div className="pha-riskgrid">
    <article><h3>Predisposition and susceptibility</h3><p>Age; first-degree family history; Lynch syndrome/FAP; inflammatory bowel disease; personal history of CRC or high-risk adenomas. Genetic counseling and surveillance must be determined through qualified clinical care, not a county map.</p></article>
    <article><h3>Modifiable and contextual exposures</h3><p>Physical activity, obesity, alcohol, tobacco, dietary conditions and potential occupational/environmental agents. EPA ECHO represents facility regulation, not a measured resident dose; causal hypotheses require exposure history, latency and epidemiologic validation.</p></article>
    <article><h3>Interception before invasive disease</h3><p>Appropriate screening, detection and removal of precancerous polyps where indicated, and completed follow-up after positive stool tests. Screening uptake alone is not proof of decreased incident cancer.</p></article>
    <article><h3>System properties and lived experience</h3><p>Insurance, affordable care, site hours, navigator capacity, safe diagnostic access, referral closure, trust, transport, housing and food environment, incentives, policy and institutional accountability.</p></article>
   </div>
   <h3>Explicit counterfactual options</h3>
   <div className="pha-riskgrid">{COUNTERFACTUALS.map(x=><article key={x.id}><h4>{x.label}</h4><p>{x.design}</p></article>)}</div>
   <p className="pha-alert"><strong>Causal-evidence standard:</strong> none of the counterfactuals is assigned an effect size here. Compare against competent current practice, design exposure-appropriate follow-up and valid controls, and measure new disease occurrence. Mortality and late-stage diagnoses are secondary outcomes, not replacements.</p>
  </section>}
  <section className="pha-section">
   <h2>Federated research and GIS sources</h2>
   <p>Use existing specialized federal systems rather than duplicating them. Only the NCI curated sample and optional EPA ECHO map layer are connected in this release. Other rows describe evidence sources to federate; not silent completed integrations.</p>
   <div className="pha-sourcegrid">{SOURCE_LINKS.map(x=><article key={x.id}><h3><a href={x.url} target="_blank" rel="noreferrer">{x.name}</a></h3><small>{x.status.replaceAll("_"," ")}</small><p>{x.use}</p><p>Evidence class: {x.grade.replaceAll("_"," ")}</p></article>)}</div>
   <p><strong>Overlay limitation:</strong> {sourceNote}</p>
  </section>
 </main>;
}
