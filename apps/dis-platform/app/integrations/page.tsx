import Link from "next/link";
import {CONNECTOR_REGISTRY,connectorSummary} from "../../lib/integration-registry";
const labels={PUBLIC_NO_KEY:"Public source · no key",OWN_OAUTH_REQUIRED:"Requires your permission",CHATGPT_PLUGIN_CONTEXT:"ChatGPT workflow",PARTNER_CREDENTIALS_REQUIRED:"DIS infrastructure"} as const;
export default function Integrations(){
 const overview=connectorSummary();
 return <main style={{maxWidth:1120,margin:"36px auto",padding:"24px",fontFamily:"system-ui",color:"#183449"}}>
 <header style={{display:"flex",gap:20,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
 <Link href="/" style={{color:"#174968"}}>← Back to Dynamic Intelligence</Link><strong>DIS / CONNECTION CENTER</strong></header>
 <h1 style={{fontSize:"clamp(34px,4.5vw,56px)",marginBottom:8}}>Knowledge without silos.</h1>
 <p style={{fontSize:18,lineHeight:1.6,maxWidth:780,color:"#576C7C"}}>Bring the research tools, documents and accounts that matter into a single evidence trail. Public repositories can be searched without a password; private accounts need your explicit authorization.</p>
 <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"30px 0"}}>
 <span style={{padding:15,borderRadius:12,background:"#E2F2EC"}}>{overview.publicConnected} public research sources configured</span>
 <span style={{padding:15,borderRadius:12,background:"#EAF0F6"}}>{overview.authenticatedInfrastructure} authenticated platform services</span>
 <span style={{padding:15,borderRadius:12,background:"#FFF1E0"}}>{overview.userOAuthConnected} external personal accounts linked</span></div>
 <section style={{background:"#112A3C",color:"white",padding:30,borderRadius:18,marginBottom:30}}>
 <p style={{color:"#D7BB83",letterSpacing:2,fontSize:12,fontWeight:700}}>CHATGPT + DIS</p>
 <h2 style={{marginTop:4}}>Make the council available inside ChatGPT.</h2>
 <p style={{lineHeight:1.6}}>DIS exposes a public read-only MCP endpoint for planning consultations, selecting analytical lenses, and discovering available source families. It never grants ChatGPT access to private DIS files or vice versa automatically.</p>
 <p style={{fontFamily:"monospace",wordBreak:"break-all",background:"#24445A",padding:14,borderRadius:9}}>https://www.dynamicintel.io/api/mcp</p>
 <p>On ChatGPT web, open <a href="https://chatgpt.com/plugins" target="_blank" rel="noopener noreferrer" style={{color:"#D9C391"}}>Plugins</a>, choose Add custom MCP server, enter the URL above and choose No authentication for the read-only public tools. Review the permissions, create the plugin, and install it.</p>
 <p style={{fontSize:13,color:"#C6D8E2"}}>Personal GitHub, Gmail, Google Drive or scholarly plugin data requires a separate consent and auth flow. DIS does not inherit or silently reuse a ChatGPT session's connected accounts.</p>
 </section>
 <h2>Source and connector catalog</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(265px,1fr))",gap:14}}>
 {CONNECTOR_REGISTRY.map(c=><article key={c.id} style={{padding:18,border:"1px solid #D9E2E8",borderRadius:13,background:"white"}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><strong>{c.name}</strong><span style={{fontSize:11,color:c.configured?"#15735A":"#9A672D",fontWeight:700}}>{c.configured?"Connected / configured":"Consent or setup needed"}</span></div>
 <p style={{fontSize:12,color:"#61788A"}}>{labels[c.access]} · {c.category}</p>
 <p style={{fontSize:13,lineHeight:1.55}}>{c.policy}</p>
 <a href={c.site} target="_blank" rel="noopener noreferrer" style={{color:"#205F82",fontSize:13}}>Provider documentation</a>
 </article>)}
 </div><p style={{color:"#6B7881",marginTop:28,fontSize:13}}>Integration catalog is a live development inventory, not an assertion that every third-party provider is authorized. Personal providers marked “setup needed” cannot read your data in this application until you connect them.</p></main>
}
