import Link from "next/link";
import TrajectoryPanel from "./trajectory-panel";
import {NATIONAL_THREE_CANCER_ROWS} from "../../../lib/national-three-cancer-reference";
import {WOMENS_CONDITIONS,WOMENS_HEALTH_NCHS_SOURCE,STATE_WOMENS_CONDITION_STATUS,SIX_CONDITION_MEASUREMENT_RULES} from "../../../lib/six-condition-research";

export const metadata={title:"DIS | Six-condition comparative research",description:"Preventive, equity-sensitive comparison of three cancers and three gynecologic conditions, with explicit national and state evidence boundaries."};
const stateNames=["Mississippi","Texas","Colorado"] as const;
const diseaseNames=[["colorectal","Colorectal"],["lung","Lung and bronchus"],["breast","Female breast"]] as const;
export default function SixConditionResearch(){
 const cancer=stateNames.map(n=>NATIONAL_THREE_CANCER_ROWS.find(x=>x.geography===n)!);
 return <main style={{maxWidth:1120,margin:"0 auto",padding:"20px",lineHeight:1.55}}>
  <nav><Link href="/research-program">Research Studio</Link> · <Link href="/research-program/national-cancers">50-state three-cancer explorer</Link> · <Link href="/research-program/exposome">GIS and environmental research</Link></nav>
  <p style={{fontSize:12,letterSpacing:2,textTransform:"uppercase"}}>DIS × RPLICE · Cross-condition counterfactual research</p>
  <h1>Six conditions, three focal states, one national evidence standard</h1>
  <p>This investigation compares patterns of developing disease with patterns of getting a diagnosis. The <strong>three cancer measures</strong> are population incidence and stage among diagnosed cases, whereas the <strong>three gynecologic measures</strong> are self-reported lifetime diagnoses among women aged 20–49. They cannot be pooled as though they were the same outcome or observation period.</p>
  <section style={{padding:16,border:"1px solid #ccd5df",borderRadius:12,marginBlock:16}}>
   <h2>State comparisons we can actually support</h2>
   <p>Regional/distant-stage cancer incidence per 100,000, age-adjusted, 2019–2023. The female breast denominator is women; the others include both sexes.</p>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:550,textAlign:"left",borderCollapse:"collapse"}}>
    <thead><tr><th scope="col">Cancer</th>{stateNames.map(n=><th scope="col" key={n}>{n}</th>)}</tr></thead>
    <tbody>{diseaseNames.map(([k,name])=><tr key={k} style={{borderTop:"1px solid #ddd"}}><th scope="row" style={{padding:9}}>{name}</th>{cancer.map(x=><td key={x.geography} style={{padding:9}}>{x[k].lateStageIncidencePer100k.toFixed(1)} <small>({x[k].lateStageSharePercent.toFixed(1)}% late)</small></td>)}</tr>)}</tbody>
   </table></div>
  </section>
  <section style={{padding:16,border:"1px solid #ccd5df",borderRadius:12,marginBlock:16}}>
   <h2>National gynecologic evidence — a different measurement</h2>
   <p>CDC NSFG, 2022–2023; self-reported <strong>ever diagnosed</strong>, not actual disease prevalence or incident diagnoses. No MS, TX or CO state estimates exist in this cited national report.</p>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",minWidth:550,borderCollapse:"collapse",textAlign:"left"}}>
    <thead><tr><th scope="col">Condition</th><th scope="col">National</th><th scope="col">Non-Hispanic Black</th><th scope="col">Non-Hispanic White</th><th scope="col">Hypothesis to test</th></tr></thead>
    <tbody>{WOMENS_CONDITIONS.map(w=><tr key={w.id} style={{borderTop:"1px solid #ddd"}}><th scope="row" style={{padding:9}}>{w.name}</th><td>{w.nationalDiagnosedPercent.toFixed(1)}%</td><td>{w.nhBlackDiagnosedPercent.toFixed(1)}%</td><td>{w.nhWhiteDiagnosedPercent.toFixed(1)}%</td><td>{w.primaryPathwayToTest}</td></tr>)}</tbody>
   </table></div>
   <p>Differences in reported diagnoses can reflect both underlying disease occurrence and how people access diagnosis. Endometriosis is an inflammatory condition, not automatically an autoimmune disorder; a genuine autoimmune disease such as lupus should be a separate sensitivity comparison once comparable data are confirmed.</p>
   <a href={WOMENS_HEALTH_NCHS_SOURCE.url} target="_blank" rel="noreferrer">Read CDC primary survey source and methods</a>
  </section>
  <section style={{padding:16,border:"1px solid #ccd5df",borderRadius:12,marginBlock:16}}>
   <h2>Three-state evidence ledger</h2>
   <ul>{STATE_WOMENS_CONDITION_STATUS.map(s=><li key={s.code}><strong>{s.state}:</strong> cancer data present at state level; women’s condition-specific state diagnosis rates <strong>not reported in the cited national survey</strong>. Do not fill missing values with national rates.</li>)}</ul>
   <p>The correct next data bridge is appropriate, approved state survey or claims analyses with compatible definitions, not fabricated cross-condition correlations.</p>
   <h2>What could be a system-wide failure?</h2>
   <p>A recurring pattern of disease burden and underrecognition could reflect socioeconomic constraints, environmental and occupational histories, biological mechanisms, unequal diagnostic access, or incompatible measurement instruments. These hypotheses compete rather than prove one universal explanation. Map the full chain and explicitly disconfirm alternatives before prescribing interventions.</p>
   <h2>Research-to-action and critical review</h2>
   <p>Outcome hierarchy: fewer new disease cases where prevention is biologically feasible; clinically appropriate early detection, fewer avoidable delays, better quality of life, reduced inequity and long-term sustainment. Use HIL-selected RPLICE methods, a critical appraisal of each source's actual scope, and ethical, real stakeholder engagement. Record the counterfactual, resources, owners and future monitoring before claiming success.</p>
   <details><summary>Evidence incompatibility and protection rules</summary><ul>{SIX_CONDITION_MEASUREMENT_RULES.map(r=><li key={r}>{r}</li>)}</ul></details>
  </section>
  <TrajectoryPanel/>
  <p style={{fontSize:12}}>Source-qualified research demonstrator, not a complete matched 6-condition state dataset, independent replication, clinical advice or authorized implementation program.</p>
 </main>;
}
