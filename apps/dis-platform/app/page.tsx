import Link from "next/link";
import {auth} from "@clerk/nextjs/server";
import {SignInButton,UserButton} from "@clerk/nextjs";
import CouncilLab from "./council-lab";
import "./home.css";
export const dynamic="force-dynamic";

const examples=[
  {title:"Build a company",detail:"What might Ford's approach to operations reveal alongside Tesla-inspired engineering and a modern customer-first lens?"},
  {title:"Solve a difficult problem",detail:"Bring research, systems thinking, implementation science and lived experience into the same investigation."},
  {title:"Challenge a major decision",detail:"Assemble a second council to examine competing hypotheses, unintended consequences and alternatives."}
];
export default async function Home(){
 const {userId}=await auth();
 return <div className="dis-home">
  <header className="site-nav">
   <Link href="/" className="brand"><span className="brand-mark">DI</span><span>DYNAMIC INTELLIGENCE</span></Link>
   <nav aria-label="Primary"><a href="#story">The idea</a><a href="#examples">Explore possibilities</a><a href="#council">Assemble a council</a></nav>
   <div className="nav-actions">{userId?<><Link href="/workspace">My workspace</Link><UserButton/></>:<SignInButton mode="modal"><button className="nav-sign">Sign in</button></SignInButton>}<a href="#council" className="nav-start">Try DIS</a></div>
  </header>
  <main>
   <section className="hero" aria-labelledby="hero-title">
    <div className="hero-content">
     <span className="eyebrow">IMAGINE WHAT BECOMES POSSIBLE</span>
     <h1 id="hero-title">Imagine if you could get <em>advice and assistance</em> informed by some of the smartest minds in history.</h1>
     <p>What if you could develop a company with an AI council drawing on the thinking approaches of Henry Ford and the innovators behind Tesla? Or assemble your own council of scientists, entrepreneurs, engineers, educators and leaders to tackle almost any question?</p>
     <div className="hero-actions"><a className="hero-primary" href="#council">Assemble your council</a><a className="hero-secondary" href="#story">See how it works</a></div>
     <p className="hero-proof">PERSPECTIVES · EVIDENCE · CHALLENGE · ACTION</p>
    </div>
    <div className="hero-art" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="orbit three"/><div className="core">DI</div><div className="orbital-label a">?</div><div className="orbital-label b">∑</div><div className="orbital-label c">↗</div><div className="orbital-label d">∞</div></div>
   </section>
   <section className="manifesto" id="story"><span className="eyebrow">YOUR QUESTION. YOUR COUNCIL.</span><p>One perspective can spark an idea. Many disciplines can test it, refine it and help turn understanding into action.</p></section>
   <section className="story-section" id="examples"><div className="section-heading"><span className="eyebrow">WHAT WOULD YOU LIKE TO DO?</span><h2>From a single question to a world-changing ambition.</h2><p>Choose the perspectives you want—or let DIS select a topic-matched council and a separate challenge team.</p></div><div className="story-grid">{examples.map((item,i)=><article key={item.title}><span>0{i+1}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div></section>
   <CouncilLab/>
   <section className="closing"><h2>Big questions. Small questions.<br/><em>Better thinking, within reach.</em></h2><p>Start with curiosity. Examine what is known, what is missing, and what needs to be tested.</p><a href="#council" className="hero-primary">Bring your question</a></section>
  </main>
  <footer className="site-footer"><strong>Dynamic Intelligence</strong><p>Independent inquiry, rigorous challenge, practical implementation.</p><small>DIS uses educational analytical lenses inspired by publicly documented work. Its AI-generated perspectives are not actual statements, endorsements, affiliations, or consultations from the named individuals or companies. Independent multi-model debate and validated scholarly synthesis are not yet fully operational.</small></footer>
 </div>;
}
