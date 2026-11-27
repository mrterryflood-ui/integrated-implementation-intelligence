import PerspectiveStudio from "./perspective-studio";
import ConsultationStudio from "./consultation-studio";
import Link from "next/link";
import {auth} from "@clerk/nextjs/server";
import {SignInButton,UserButton} from "@clerk/nextjs";
import {productionIdentityBlocked,RELEASE_NOTICE} from "../lib/release-gates";
import CouncilLab from "./council-lab";
import {CONSULTATION_FOCUS_AREAS,consultationFocusHref} from "../lib/consultation-focus";
import {AUDIENCE_PATHS} from "../lib/audience-paths";
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
 <nav aria-label="Main navigation"><a href="#start">Find your starting point</a><Link href="/planning?view=meetings">Meetings &amp; decisions</Link><a href="#tools">Tools</a><Link href="/integrations">Integrations</Link></nav>
 <div className="nav-actions">{identityBlocked?<span className="nav-sign" title={RELEASE_NOTICE}>Private workspace pending</span>:userId?<><Link href="/workspace">My knowledge</Link><UserButton/></>:<SignInButton mode="modal"><button className="nav-sign">Sign in</button></SignInButton>}<a href="#council" className="nav-start">Ask DIS</a></div>
 </header>
 <main><section className="hero">
 <div className="hero-content">{identityBlocked&&<p role="status" style={{fontSize:14,maxWidth:580}}>Public research preview is available. Private accounts and uploads are pending production identity verification.</p>}<span className="eyebrow">DIS · DYNAMIC INTELLIGENCE</span><h1>Understand the question.<br/><em>Decide what comes next.</em></h1>
 <p>A connected workspace for exploring questions, comparing evidence, making decisions, and putting change into practice. Start with your purpose. Bring your own perspective.</p>
 <div className="hero-actions"><a className="hero-primary" href="#start">Find my starting point</a><Link className="hero-secondary" href="/planning?view=meetings">Open meetings &amp; decisions</Link></div>
 <p className="hero-caption">For individuals, teams, and organizations.</p></div>
 <aside className="home-workspace-preview" aria-label="How the DIS workspace connects your work"><p className="eyebrow">ONE CONNECTED WORKSPACE</p><h2>Keep the question and the work together.</h2><ol><li><strong>Explore</strong><span>Your question, documents, and perspectives.</span></li><li><strong>Decide</strong><span>Options, unresolved questions, and the human decision.</span></li><li><strong>Put it into practice</strong><span>The right setting, adoption, delivery, and resources.</span></li><li><strong>Learn and adapt</strong><span>What happened, for whom, and what should change.</span></li></ol><p>Use DIS on its own. Connect other services where they help.</p></aside>
 </section>
 <section id="start" className="audience-section"><div className="section-heading"><span className="eyebrow">START WITH WHAT YOU NEED</span><h2>What brings you here?</h2><p>Choose a starting point. You can use the other tools whenever your work calls for them.</p></div><div className="audience-grid">{AUDIENCE_PATHS.map(path=><a className="audience-card" key={path.id} href={path.href}><span>{path.audience}</span><h3>{path.title}</h3><p>{path.description}</p><small>{path.tools}</small><strong>{path.action} <span aria-hidden="true">→</span></strong></a>)}</div></section>
 <section id="tools" className="home-tool-section"><div className="section-heading"><span className="eyebrow">THE RIGHT TOOL FOR THE QUESTION</span><h2>Explore, compare, prepare, and follow through.</h2></div><div className="home-tool-links"><a href="#consult"><strong>Investigate a question</strong><span>Guided inquiry, public research, and source review.</span></a><a href="#perspectives"><strong>Understand other perspectives</strong><span>Explore how people may frame the same issue.</span></a><a href="#council"><strong>Challenge a proposed answer</strong><span>Examine assumptions, uncertainty, and alternatives.</span></a><Link href="/planning?view=meetings"><strong>Meetings and decisions</strong><span>Prepare an agenda item, a brief, and questions before voting.</span></Link><Link href="/planning?view=implementation"><strong>Implementation planning</strong><span>Setting, adoption, delivery, measures, and adaptation.</span></Link><Link href="/planning?view=knowledge"><strong>Ask your organization’s knowledge</strong><span>Inspect shared source passages; ask configured GPT or Gemini.</span></Link><Link href="/research-program"><strong>Research programs</strong><span>Explore a research-to-implementation case.</span></Link><Link href="/realty-atlas"><strong>Explore place and context</strong><span>Use the GIS Atlas to investigate geographic questions.</span></Link></div></section>
 <section className="manifesto"><span className="eyebrow">OUR BELIEF</span><p>Information is everywhere. <strong>Understanding takes perspective. Progress takes evidence, judgment, and action.</strong></p></section>
 <section id="approach" className="story-section"><div className="section-heading"><span className="eyebrow">THE DIS METHOD</span><h2>From “what if” to “how do we know?”</h2><p>Good questions deserve more than confident answers. They deserve investigation, independent challenge, and an honest account of what was tested.</p></div>
 <div className="story-grid">{steps.map(step=><article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div></section>
 <section className="interlude"><span className="eyebrow">THE POWER OF DIFFERENT THINKING</span><h2>One perspective can be insightful.<br/><em>Several can change the question.</em></h2><p>Our educational lenses draw on publicly documented intellectual approaches—not impersonations, endorsements, or claimed participation.</p></section>
 <section id="possibilities" className="possibilities"><div className="section-heading"><span className="eyebrow">YOUR CURIOSITY HAS NO CATEGORY</span><h2>Big problems. Small questions. Everything between.</h2><p>Choose an area to start a guided investigation. Your question and decisions remain yours.</p></div><div className="possibility-grid">{CONSULTATION_FOCUS_AREAS.map(area=><a className="possibility-card" key={area.id} href={consultationFocusHref(area.id)} aria-label={"Explore "+area.title+" in DIS consultation"}><h3>{area.title}</h3><p>{area.description}</p><span className="possibility-action">Start here <span aria-hidden="true">→</span></span></a>)}</div></section>
 <PerspectiveStudio privateReady={privateReady}/><ConsultationStudio privateReady={privateReady}/><CouncilLab privateReady={privateReady}/>
 <section className="closing"><span className="eyebrow">CURIOSITY IS THE BEGINNING</span><h2>Better questions.<br/><em>More thoughtful possibilities.</em></h2><p>Build understanding. Challenge the assumptions. Seek evidence. Make something better.</p><a className="hero-primary" href="#council">Start with a question</a></section></main>
 <footer className="site-footer"><strong>Dynamic Intelligence · dynamicintel.io</strong><p>Multidisciplinary intelligence for people and systems.</p><small>Historical and contemporary names identify educational reasoning lenses inspired by documented work. No endorsement, affiliation, exact personal simulation, or real-person consultation is implied. AI-generated deliberation remains preliminary until evidence and outcomes are independently verified.</small></footer>
 </div>
}
