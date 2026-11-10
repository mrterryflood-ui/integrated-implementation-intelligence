import Link from "next/link";

export const metadata = {
  title: "Wichita wraparound service model | DIS",
  description: "An explicitly synthetic, evidence-aware demonstration of coordinated community health, tobacco cessation, family stability, and economic mobility.",
};

const pathways = [
  {name:"Tobacco treatment",lead:"Michelle's qualified cessation team",action:"Individualized coaching, Kansas Quitline navigation, clinician-directed treatment where indicated",source:"https://www.kdhe.ks.gov/1800/Quitting-Tobacco"},
  {name:"Healthcare access",lead:"Authorized community health navigator",action:"Coverage and screening navigation, verified care connection and follow-up",source:"https://thrivingcommunitiesforall.com"},
  {name:"Behavioral health",lead:"Qualified providers and authorized navigator",action:"Participant-led care navigation, safe escalation and confirmation of connection",source:"https://lifetransitionsaid.org/resources"},
  {name:"Childcare and family",lead:"Community resource navigator",action:"Eligibility support and verified linkage to appropriate local programs",source:"https://www.211kansas.org"},
  {name:"Work and income",lead:"Workforce partner",action:"Training pathway, employment referral, and participant-reported progress with employer verification where authorized",source:"https://lifetransitionsaid.org/find-help?q=employment&state=KS"},
  {name:"Financial capability",lead:"Financial education navigator",action:"Budgeting and financial literacy, without financial-product sales or assumptions about creditworthiness",source:"https://finlitspark.vercel.app/"},
];

const indicators = [
  ["Referral delivery","Receiving party acknowledged request","Attempted, sent, accepted and closed are separate states; no synthetic delivery counts"],
  ["Tobacco cessation","7-day point-prevalence abstinence at defined 3- and 6-month follow-up","Specify response coverage and verification method; no presumption of abstinence from non-response"],
  ["Healthcare access","Completed verified connection or documented reason unresolved","A resource click is not an appointment or treatment"],
  ["Behavioral health","Voluntary, confirmed service linkage","No automated diagnosis or unsafe escalation by a general-purpose assistant"],
  ["Childcare stability","Assistance secured and participant reports access barriers reduced","Separate eligibility, approval, and actual available care"],
  ["Workforce and income","Training, placement, wage change, and retention as different measures","Employer or other corroboration only when consented and feasible"],
  ["Financial capability","Suitable validated financial capability and stability measures","Course completion alone does not establish improved finances"],
  ["Equity and reach","Who is eligible, reached, excluded, served and lost to follow-up","Respect self-identified groups, protect small cells, assess confounders"],
];

const panel: React.CSSProperties={background:"#fff",border:"1px solid #dce5ea",borderRadius:16,padding:20};
const muted: React.CSSProperties={color:"#536575",fontSize:14,lineHeight:1.6};
export default function WichitaWraparound() {
 return <main style={{minHeight:"100vh",background:"#f3f7f8",color:"#102b38",padding:"28px max(18px, calc((100vw - 1100px)/2)) 72px",fontFamily:"system-ui, sans-serif"}}>
   <nav aria-label="Breadcrumb" style={{marginBottom:22,fontSize:14}}><Link href="/" style={{color:"#086b75"}}>DIS home</Link> / Implementation demonstrations</nav>
   <header style={{maxWidth:900,marginBottom:28}}>
     <p style={{fontSize:12,letterSpacing:2,textTransform:"uppercase",fontWeight:800,color:"#086b75"}}>Differences-in-Systems · MAP–GAP · RPLICE</p>
     <h1 style={{fontSize:"clamp(30px, 5vw, 51px)",lineHeight:1.12,letterSpacing:-1.2,margin:"12px 0"}}>One person. Connected needs. Accountable services.</h1>
     <p style={{fontSize:18,lineHeight:1.7,maxWidth:800}}>Wichita community health and economic mobility: a transparent demonstration of how two distinct community organizations can coordinate services without dissolving their identities or treating referrals as outcomes.</p>
     <p role="status" style={{padding:14,background:"#fff2d6",borderLeft:"5px solid #ad6a00",borderRadius:6,fontWeight:700,fontSize:14}}>SYNTHETIC DEMONSTRATION — NOT LIVE CLIENT DATA, NOT A VERIFIED KANSAS SERVICE INTEGRATION, AND NOT EVIDENCE OF CLINICAL EFFECTIVENESS.</p>
   </header>
   <section aria-labelledby="platforms" style={{marginBottom:30}}>
     <h2 id="platforms">Two platforms; one governed coordination pattern</h2>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:14}}>
       <article style={panel}><h3>Sistahs Can We Talk</h3><p style={muted}>Distinct campaigns, prevention education, culturally responsive tobacco outreach, women's health advocacy, and participant engagement.</p><a href="https://sistahscanwetalk.com/" target="_blank" rel="noopener noreferrer">Existing community site</a></article>
       <article style={panel}><h3>The Center</h3><p style={muted}>Separate family and community services identity for coordinated support, health navigation, education, youth opportunity, and economic mobility.</p><a href="https://www.thecenterict.org/" target="_blank" rel="noopener noreferrer">The Center</a></article>
       <article style={panel}><h3>Shared ISS capability</h3><p style={muted}>Thriving Communities and Life Transitions Aid resource navigation, HerHealth, financial literacy, service-plan coordination, and explicit DIS–RPLICE learning contracts. Not blanket cross-tenant data sharing.</p><a href="https://thrivingcommunitiesforall.com/" target="_blank" rel="noopener noreferrer">Thriving Communities</a></article>
     </div>
   </section>
   <section aria-labelledby="journey" style={{marginBottom:30}}>
     <h2 id="journey">Synthetic participant journey</h2>
     <div style={panel}>
       <p><strong>Illustrative scenario:</strong> A Wichita mother joins a tobacco cessation program and identifies unstable work shifts, childcare obstacles, overdue preventive care, and financial pressure. These are hypothetical, not observations about Michelle's clients.</p>
       <ol style={{lineHeight:1.9,paddingLeft:22}}>
         <li><strong>Orient:</strong> Ask the person what matters to them, gather strengths and goals, and request specific, revocable consent.</li>
         <li><strong>Audit:</strong> Identify actual available programs, partner capacity, waiting lists, geographic coverage, and service constraints.</li>
         <li><strong>Map:</strong> Distinguish the person's priorities from assumptions; trace which barriers compound others.</li>
         <li><strong>Gap:</strong> Contrast intended services with completed handoffs and the participant's experience.</li>
         <li><strong>Align and act:</strong> Assign a responsible human navigator, a specialty service owner, and deadlines for each consented referral.</li>
         <li><strong>Track:</strong> Record attempted, submitted, acknowledged, attended, resolved, and participant-confirmed states separately.</li>
         <li><strong>Adapt and re-map:</strong> Revisit needs after services, examine unintended harms or exclusions, and update the plan.</li>
       </ol>
     </div>
   </section>
   <section aria-labelledby="reality" style={{marginBottom:30}}>
      <h2 id="reality">The three realities DIS must compare</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        <article style={panel}><h3>Designed</h3><p style={muted}>Program eligibility, intended service pathways, staffed capacity, treatment standards, referral targets, and documented assumptions.</p></article>
        <article style={panel}><h3>Operational</h3><p style={muted}>Actual staff availability, appointment capacity, links that work, partner acknowledgement, completion rates, system and data quality.</p></article>
        <article style={panel}><h3>Experienced</h3><p style={muted}>Burden of repeated storytelling, time and transportation costs, respectful treatment, perceived usefulness, sustained change, and unmet needs.</p></article>
      </div>
   </section>
   <section aria-labelledby="pathways" style={{marginBottom:30}}>
    <h2 id="pathways">Coordinated lines of effort and existing resource connections</h2>
    <p style={muted}>These are public discovery links, not contracted service providers or automated case referrals. A user may choose a location; no address, diagnosis, or client identifier belongs in a URL.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12}}>
    {pathways.map(p=><article key={p.name} style={panel}><h3 style={{marginTop:0}}>{p.name}</h3><p><strong>Accountable role:</strong> {p.lead}</p><p style={muted}>{p.action}</p><a href={p.source} target="_blank" rel="noopener noreferrer">Explore available public resources</a></article>)}
    </div>
   </section>
   <section aria-labelledby="measurement" style={{marginBottom:30}}>
    <h2 id="measurement">An outcome-first measurement guide</h2>
    <p style={muted}>These definitions are proposed instrumentation, not reported program performance. Define numerator, denominator, cohort, follow-up clock, provenance and missingness before producing a rate.</p>
    <div style={{overflowX:"auto",background:"#fff",borderRadius:16,border:"1px solid #dce5ea"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:640,textAlign:"left"}}>
        <thead style={{background:"#e8f1f3"}}><tr><th style={{padding:13}}>Domain</th><th style={{padding:13}}>Measure</th><th style={{padding:13}}>Assurance question</th></tr></thead>
        <tbody>{indicators.map(([domain,measure,caution])=><tr key={domain} style={{borderTop:"1px solid #dce5ea"}}><th scope="row" style={{padding:13,verticalAlign:"top"}}>{domain}</th><td style={{padding:13,verticalAlign:"top"}}>{measure}</td><td style={{padding:13,verticalAlign:"top",color:"#536575"}}>{caution}</td></tr>)}</tbody>
      </table>
    </div>
   </section>
   <section aria-labelledby="adaptation" style={{marginBottom:30}}>
    <h2 id="adaptation">Culturally responsive tobacco treatment: adapt delivery, not evidence standards</h2>
    <div style={panel}>
      <p>Investigate community-specific history, targeted menthol marketing, availability of approved treatments, trusted messenger preferences, time and transportation barriers, and lived experience. Do not infer personal preferences, smoking behavior, or health risk from race alone.</p>
      <p>Co-design outreach and coaching with participant representatives and qualified tobacco specialists. Offer established treatment and the Kansas Quitline as available options; prescribing and diagnostic decisions remain with qualified professionals.</p>
      <p>Compare reach, voluntary enrollment, treatment engagement, abstinence with specified follow-up and missingness, participant burden, adverse effects, and sustained access across meaningful strata. Document design, rival explanations, denominators, and constraints before interpreting differences.</p>
      <a href="https://www.kdhe.ks.gov/1800/Quitting-Tobacco" target="_blank" rel="noopener noreferrer">Kansas Department of Health & Environment — quitting tobacco</a>
    </div>
   </section>
   <section aria-labelledby="release" style={panel}>
    <h2 id="release">Implementation and live-data release gate</h2>
    <p>Public education and generic resource discovery may operate without a participant record. A live individual or household record requires verified identity, organization-scoped authorization, informed purpose-specific consent and revocation, clinical boundaries, tested referral status reconciliation, audit logging, backup/restore, and negative tenant-isolation tests.</p>
    <p><strong>Sandbox and production must be separate data stores.</strong> A visual switch alone is not a sufficient privacy or authorization boundary. Synthetic demonstration records cannot be quietly relabeled as real clients. Do not represent issued referrals, service delivery, improved mobility, or partner commitments without external proof.</p>
    <p style={muted}>Evidence status: implementation specification and illustrative scenario. Actual integration, security, operator and client outcomes require testing on their own exact revisions and service environments.</p>
   </section>
 </main>
}
