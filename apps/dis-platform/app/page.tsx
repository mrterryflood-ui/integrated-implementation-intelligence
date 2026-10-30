import ConsultationStudio from "./consultation-studio";
import Link from "next/link";
import {auth} from "@clerk/nextjs/server";
import {SignInButton,UserButton} from "@clerk/nextjs";
import {productionIdentityBlocked,RELEASE_NOTICE} from "../lib/release-gates";
import CouncilLab from "./council-lab";
import {CONSULTATION_FOCUS_AREAS,consultationFocusHref} from "../lib/consultation-focus";
export const dynamic="force-dynamic";
const steps=[
 ["01","Start with the real question","A new business needs its first customer. A researcher sees an unanswered question. A community faces a problem no single expert can solve."],
 ["02","See through other perspectives","Bring engineering, ethics, science, design, human experience, leadership, markets, and implementation into the same investigation."],
 ["03","Challenge the conclusion","A distinct set of challenge perspectives asks what is missing, who might be harmed, and what could disprove the leading theory. Independent model execution is reported separately."],
 ["04","Make understanding useful","Investigate evidence, test alternatives, document uncertainty, and design a pathway to measurable, enduring improvement."]
];

export default async function Home(){
 const identityBlocked=productionIdentityBlocked(process.env);
 // Public features should never advertise private services as ready based only
 // on a preview environment where productionIdentityBlocked deliberately returns false.
 const privateReady=!identityBlocked&&Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_live_")&&process.env.CLERK_SECRET_KEY?.startsWith("sk_live_"));
 const {userId}=identityBlocked?{userId:null}:await auth();
 return <div className="dis-home">
 <header className="site-nav">
 <Link href="/" className="brand"><span className="brand-mark">D·I</span><span>DYNAMIC INTELLIGENCE</span></Link>
 <nav aria-label="Main navigation"><a href="#approach">The approach</a><a href="#possibilities">Possibilities</a><a href="#consult">Consultation studio</a><a href="/realty-atlas">GIS Atlas</a><Link href="/integrations">Integrations</Link><a href="#council">Council studio</a></nav>
 <div className="nav-actions">{identityBlocked?<span className="nav-sign" title={RELEASE_NOTICE}>Private workspace pending</span>:userId?<><Link href="/workspace">My knowledge</Link><UserButton/></>:<SignInButton mode="modal"><button className="nav-sign">Sign in</button></SignInButton>}<a href="#council" className="nav-start">Ask DIS</a></div>
 </header>
 <main><section className="hero">
 <div className="hero-content">{identityBlocked&&<p role="status" style={{fontSize:14,maxWidth:580}}>Public research preview is available. Private accounts and uploads are pending production identity verification.</p>}<span className="eyebrow">INTRODUCING A DIFFERENT WAY TO THINK</span><h1>What if your next <em>great idea</em> had a council behind it?</h1>
 <p>One question can change a life, a business, or an entire system. Dynamic Intelligence brings diverse reasoning perspectives together to help investigate it—and understand what to do next.</p>
 <div className="hero-actions"><a className="hero-primary" href="#council">Convene your council</a><a href="#approach">Discover the method ↓</a></div>
 <div className="hero-proof">RESEARCH FIRST <span>·</span> CHALLENGE ASSUMPTIONS <span>·</span> ACT WITH EVIDENCE</div></div>
 <div className="hero-art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="orbit three"/><div className="core">DI</div><div className="orbital-label a">?</div><div className="orbital-label b">∑</div><div className="orbital-label c">↗</div><div className="orbital-label d">∞</div></div>
 </section>
 <section className="manifesto"><span className="eyebrow">OUR BELIEF</span><p>Information is everywhere. <strong>Understanding takes perspective. Progress takes evidence, judgment, and action.</strong></p></section>
 <section id="approach" className="story-section"><div className="section-heading"><span className="eyebrow">THE DIS METHOD</span><h2>From “what if” to “how do we know?”</h2><p>Good questions deserve more than confident answers. They deserve investigation, independent challenge, and an honest account of what was tested.</p></div>
 <div className="story-grid">{steps.map(step=><article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div></section>
 <section className="interlude"><span className="eyebrow">THE POWER OF DIFFERENT THINKING</span><h2>One perspective can be insightful.<br/><em>Several can change the question.</em></h2><p>Our educational lenses draw on publicly documented intellectual approaches—not impersonations, endorsements, or claimed participation.</p></section>
 <section id="possibilities" className="possibilities"><div className="section-heading"><span className="eyebrow">YOUR CURIOSITY HAS NO CATEGORY</span><h2>Big problems. Small questions. Everything between.</h2><p>Choose an area to start a guided investigation. Your question and decisions remain yours.</p></div><div className="possibility-grid">{CONSULTATION_FOCUS_AREAS.map(area=><a className="possibility-card" key={area.id} href={consultationFocusHref(area.id)} aria-label={"Explore "+area.title+" in DIS consultation"}><h3>{area.title}</h3><p>{area.description}</p><span className="possibility-action">Start here <span aria-hidden="true">→</span></span></a>)}</div></section>
 <ConsultationStudio privateReady={privateReady}/><CouncilLab privateReady={privateReady}/>
 <section className="closing"><span className="eyebrow">CURIOSITY IS THE BEGINNING</span><h2>Better questions.<br/><em>More thoughtful possibilities.</em></h2><p>Build understanding. Challenge the assumptions. Seek evidence. Make something better.</p><a className="hero-primary" href="#council">Start with a question</a></section></main>
 <footer className="site-footer"><strong>Dynamic Intelligence · dynamicintel.io</strong><p>Multidisciplinary intelligence for people and systems.</p><small>Historical and contemporary names identify educational reasoning lenses inspired by documented work. No endorsement, affiliation, exact personal simulation, or real-person consultation is implied. AI-generated deliberation remains preliminary until evidence and outcomes are independently verified.</small></footer>
 </div>
}
