"use client";
import {FOCAL_THREE_CANCER_COUNTIES} from "../../../lib/focal-three-cancer-counties";
import {ALL_STAGE_URBAN_RURAL_CONTEXT,NATIONAL_RACE_CONTEXT_2018_2022,NATIONAL_CANCER_CONTEXT_SOURCE} from "../../../lib/national-three-cancer-context";
import {useMemo,useState} from "react";
import Link from "next/link";
import {NATIONAL_THREE_CANCER_ROWS,nationalStateRows,pearsonNationalCancerCorrelation,THREE_CANCER_SOURCE_URLS,type CancerKey} from "../../../lib/national-three-cancer-reference";
const types:{key:CancerKey;label:string;pop:string}[]=[
 {key:"colorectal",label:"Colorectal",pop:"Both sexes"},
 {key:"lung",label:"Lung & bronchus",pop:"Both sexes"},
 {key:"breast",label:"Female breast",pop:"Female denominator"}
];
const focus=["Mississippi","Texas","Colorado"] as const;
type Metric="lateStageIncidencePer100k"|"lateStageSharePercent";
const fmt=(value:number)=>value.toFixed(1);
export default function NationalCancerThreeSite(){
 const [metric,setMetric]=useState<Metric>("lateStageIncidencePer100k");
 const [sort,setSort]=useState<CancerKey>("colorectal");
 const [filter,setFilter]=useState("");
 const sorted=useMemo(()=>nationalStateRows().filter(r=>r.geography.toLowerCase().includes(filter.toLowerCase()))
 .sort((a,b)=>b[sort][metric]-a[sort][metric]),[sort,metric,filter]);
 const max=Math.max(...sorted.flatMap(r=>types.map(t=>r[t.key][metric])),1);
 const values=focus.map(name=>NATIONAL_THREE_CANCER_ROWS.find(r=>r.geography===name)!);
 const useRate=metric==="lateStageIncidencePer100k";
 return <main style={{maxWidth:1220,margin:"0 auto",padding:"24px 16px",fontFamily:"system-ui,sans-serif",lineHeight:1.5}}>
 <p><Link href="/research-program">DIS Research Studio</Link> / <Link href="/research-program/exposome">Environmental GIS atlas</Link></p>
 <p style={{letterSpacing:1.5,fontSize:12,textTransform:"uppercase"}}>DIS · National evidence-to-action lab</p>
 <h1>Compare three cancers. Challenge the common explanation.</h1>
 <p>This is a versioned national public-reference dataset of <b>50 states</b> with District of Columbia, Puerto Rico and a national reference row shown separately. This is not a current live connection or a demonstrated cause. The original publishers are NCI and CDC, not DIS or RPLICE.</p>
 <div style={{border:"1px solid #d1dbe1",borderRadius:10,padding:16,margin:"16px 0"}}>
  <h2>What changes when we compare cancers?</h2>
  <p>Mississippi and Colorado have almost the same <b>colorectal stage share</b> (63.0% and 64.0%), yet late-stage population incidence differs by nearly 47%. Lung shows an even larger incidence contrast, but female breast late-stage incidence is relatively similar. Geographic risk cannot be inferred from stage percentage alone.</p>
  <label>Outcome measure <select value={metric} onChange={e=>setMetric(e.target.value as Metric)} style={{padding:8,margin:8}}>
  <option value="lateStageIncidencePer100k">Age-adjusted late-stage incidence / 100,000</option>
  <option value="lateStageSharePercent">Percent of diagnosed cases late-stage</option></select></label>
  <table style={{borderCollapse:"collapse",width:"100%",maxWidth:770}}>
  <caption style={{textAlign:"left"}}>Mississippi–Texas–Colorado, 2019–2023; regional or distant stage</caption>
  <thead><tr><th scope="col" style={{textAlign:"left"}}>Cancer site</th>{focus.map(x=><th key={x} scope="col">{x}</th>)}</tr></thead>
  <tbody>{types.map(t=><tr key={t.key}><th scope="row" style={{textAlign:"left"}}>{t.label}</th>{values.map(v=><td key={v.geography} style={{textAlign:"center",padding:5}}>{fmt(v[t.key][metric])}{useRate?"":"%"}</td>)}</tr>)}</tbody>
  </table>
  <p style={{fontSize:12}}>The breast cancer population rate denominator is female-only. Do not compare absolute rate sizes between female breast and both-sex cancer populations as though denominators were identical.</p>
 </div>
 <section style={{border:"1px solid #d1dbe1",borderRadius:10,padding:16,margin:"16px 0"}}>
 <h2>Return to the focal counties, on a single consistent 2018–2022 period</h2><p><b>Every cell is a separate source-checked county cancer measure:</b> age-adjusted late-stage incidence per 100,000 / percentage among diagnosed cases late-stage. Jackson and Houston refer to county proxies; Denver is a Colorado county comparator, not Colorado state.</p>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:640,borderCollapse:"collapse",fontSize:13}}><thead><tr><th style={{textAlign:"left"}}>Cancer</th>{FOCAL_THREE_CANCER_COUNTIES.map(s=><th scope="col" key={s.fips}>{s.county}</th>)}</tr></thead><tbody>{types.map(t=><tr key={t.key}><th scope="row" style={{textAlign:"left",padding:7}}>{t.label}</th>{FOCAL_THREE_CANCER_COUNTIES.map(s=><td style={{textAlign:"center",padding:7}} key={s.fips}><a target="_blank" rel="noreferrer" href={s.cancers[t.key].source}>{s.cancers[t.key].rate.toFixed(1)} per 100k / {s.cancers[t.key].lateStageShare.toFixed(1)}%</a></td>)}</tr>)}</tbody></table></div>
 <p>Compared with Colorado/Denver, Hinds has much greater colorectal, lung and female breast late-stage incidence, but the magnitude differs by cancer. The similar colorectal stage fractions persist locally and do not establish similar incidence or cause. The nine original NCI county-source links are available by selecting each cell.</p>
 <p><a href="https://www.gis.cancer.gov/canceratlas/" target="_blank" rel="noreferrer">Open NCI Cancer Atlas official GIS, tables and CSV exports</a> · <a href="https://ephtracking.cdc.gov/" target="_blank" rel="noreferrer">CDC Environmental Public Health Tracking</a></p>
 </section>
 <section style={{border:"1px solid #d1dbe1",borderRadius:10,padding:16,margin:"16px 0"}}>
  <h2>National pattern across 50 states</h2>
  <p>Rate correlation, colorectal–lung: <b>{pearsonNationalCancerCorrelation("colorectal","lung","lateStageIncidencePer100k").toFixed(3)}</b>; colorectal–breast: <b>{pearsonNationalCancerCorrelation("colorectal","breast","lateStageIncidencePer100k").toFixed(3)}</b>. Case-share correlation, colorectal–lung: <b>{pearsonNationalCancerCorrelation("colorectal","lung","lateStageSharePercent").toFixed(3)}</b>. These unadjusted ecological correlations do not establish causes.</p>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
   <label>Sort by <select value={sort} onChange={e=>setSort(e.target.value as CancerKey)} style={{padding:8,marginLeft:6}}>{types.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
   <label>Search states <input value={filter} onChange={e=>setFilter(e.target.value.slice(0,80))} placeholder="State name" style={{padding:8,marginLeft:6,border:"1px solid #879aa8"}}/></label>
  </div>
  <div style={{overflowX:"auto"}}>
   <table style={{borderCollapse:"collapse",width:"100%",fontSize:14}}>
    <thead><tr><th scope="col" style={{textAlign:"left"}}>State</th>{types.map(t=><th key={t.key} scope="col">{t.label}<div style={{fontSize:11,fontWeight:400}}>{t.pop}</div></th>)}</tr></thead>
    <tbody>{sorted.map(r=><tr key={r.geography} style={{borderTop:"1px solid #dde6eb",background:focus.includes(r.geography as typeof focus[number])?"#f4fafc":"transparent"}}>
     <th scope="row" style={{textAlign:"left",padding:8}}>{r.geography}</th>
     {types.map(t=><td key={t.key} style={{minWidth:150,padding:6}}>
      <div><b>{fmt(r[t.key][metric])}{useRate?"":"%"}</b></div>
      <div style={{height:6,background:"#e9f0f5",borderRadius:5}}><div style={{height:"100%",width:100*r[t.key][metric]/max+"%",background:t.key==="colorectal"?"#26637c":t.key==="lung"?"#8c4763":"#836028",borderRadius:5}}/></div>
     </td>)}
    </tr>)}</tbody>
   </table>
  </div>
  <p style={{fontSize:12}}>{sorted.length} of 50 states shown. Average annual counts are preserved in the source package; no subgroup, geographic or suppressed cell has been imputed.</p>
 </section>
 <section style={{padding:16,border:"1px solid #d1dbe1",borderRadius:10,margin:"16px 0"}}>
 <h2>National demographic and rural–urban cross-check</h2>
 <p>Independent ACS analysis of all-stage incidence, <b>2018–2022</b> (SEER-based study covering roughly 36.7% of the U.S. population). Do not pool this with the 2019–2023 late-stage table or interpret group rates as individual traits.</p>
 <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:610,textAlign:"center"}}><thead><tr><th style={{textAlign:"left"}}>Cancer</th><th>Large metro</th><th>Nonmetro</th><th>Non-Hisp White</th><th>Non-Hisp Black</th></tr></thead>
 <tbody>{types.map(t=><tr key={t.key}><th scope="row" style={{textAlign:"left"}}>{t.label}</th><td>{ALL_STAGE_URBAN_RURAL_CONTEXT[t.key].largeMetro.toFixed(1)}</td><td>{ALL_STAGE_URBAN_RURAL_CONTEXT[t.key].nonMetro.toFixed(1)}</td><td>{NATIONAL_RACE_CONTEXT_2018_2022[t.key].whiteNonHispanic.toFixed(1)}</td><td>{NATIONAL_RACE_CONTEXT_2018_2022[t.key].blackNonHispanic.toFixed(1)}</td></tr>)}</tbody></table></div>
 <p><b>Interpretation:</b> Lung and colorectal incidence are higher in nonmetro communities; female breast incidence is lower. This disease-specific contrast argues against a single universal mechanism. The combined-sex lung racial comparison masks opposing male and female contrasts. Examine lived experience, social systems, environmental dose and cancer biology together.</p>
 <a href={NATIONAL_CANCER_CONTEXT_SOURCE.url} target="_blank" rel="noreferrer">American Cancer Society published disparities research and methods</a>
 </section>
  <section style={{border:"1px solid #d1dbe1",padding:16,borderRadius:10}}>
  <h2>Follow the evidence across systems</h2>
  <p><b>Designed:</b> prevent new cancer; characterize exposures and inherited risk; offer appropriate early diagnosis. <b>Operational:</b> three types of cancer differ in exposures, biology, detection and screening eligibility. <b>Experienced:</b> race, income, employment, insurance, housing and historical exposures can create very different lived pathways within each state.</p>
  <p><b>Unanswered:</b> Does cross-cancer risk co-vary within age-, race-, insurance- and deprivation-matched counties? Do historical smoking and secondhand smoke, occupational carcinogens, water/air exposures, food/metabolic conditions or care systems explain spatial differences? Was the residence at diagnosis also the exposure residence 10–30 years earlier?</p>
  <p><b>Next methodological test:</b> combine compatible national all-stage incidence and stage data with original-source ACS, EPA, USDA and public-health histories, using a prespecified confounder/mediator map. Where record linkage or finer geography is unavailable, mark that relationship untested instead of projecting estimates onto people.</p>
  <p>Primary prevention outcome: <b>new disease incidence</b>. Secondary outcomes: regional/distant incidence, diagnostic timeliness, equitable reach, adverse effects and mortality.</p>
  <h3>Original sources</h3>
  <ul>{types.map(t=><li key={t.key}><a href={THREE_CANCER_SOURCE_URLS[t.key]} target="_blank" rel="noreferrer">NCI/CDC {t.label} published state table</a></li>)}</ul>
  <p style={{fontSize:12}}>Snapshot: NCI-SCP-2019-2023-Nov2025. No individual SEER records, private data, exposure–outcome join or patient-specific decision. Method selection stays human-controlled; DIS orchestrates and RPLICE remains specialist methodology owner.</p>
 </section>
 </main>;
}
