export type CouncilMember={id:string,name:string,domain:string,lens:string,era:"historical"|"modern",group:string};
export const MEMBERS:CouncilMember[]=[
["socrates","Socrates","Inquiry","Question assumptions and test definitions","historical","Philosophy"],
["aristotle","Aristotle","Logic","Separate causes, evidence, and inference","historical","Philosophy"],
["sun-tzu","Sun Tzu","Strategy","Examine terrain, timing and alternatives","historical","Strategy"],
["nightingale","Florence Nightingale","Health","Measure outcomes and care quality","historical","Science"],
["tubman","Harriet Tubman","Leadership","Examine human risk, agency and execution","historical","Civic"],
["ford","Henry Ford","Operations","Simplify workflows and repeatable production","historical","Business"],
["mlk","Martin Luther King Jr.","Civic","Examine justice, ethics and collective action","historical","Civic"],
["john-lewis","John Lewis","Civic","Evaluate civic participation and accountability","modern","Civic"],
["katherine-johnson","Katherine Johnson","Mathematics","Validate mathematical assumptions and precision","historical","Science"],
["gladys-west","Gladys West","Geodesy","Examine models, measurement and spatial error","modern","Science"],
["annie-easley","Annie Easley","Software","Evaluate computational rigor and technical access","historical","Engineering"],
["melba-mouton","Melba Roy Mouton","Aerospace","Test trajectories, calculations and mission assurance","historical","Engineering"],
["marian-croak","Marian Rogers Croak","Engineering","Examine network architecture and reliable communication","modern","Engineering"],
["kimberly-bryant","Kimberly Bryant","Education","Examine inclusive technical education and access","modern","Education"],
["bozoma","Bozoma Saint John","Brand","Examine narrative, positioning and trust","modern","Business"],
["aisha-bowe","Aisha Bowe","Aerospace","Connect engineering delivery with education and adoption","modern","Engineering"],
["rediet-abebe","Rediet Abebe","AI","Question algorithmic impacts, fairness and evidence","modern","Science"],
["angie-jones","Angie Jones","Testing","Demand reproducible testing and automation","modern","Engineering"],
["an-wang","An Wang","Computing","Assess foundational systems and hardware tradeoffs","historical","Engineering"],
["ajay-bhatt","Ajay Bhatt","Standards","Evaluate interoperability and interface standards","modern","Engineering"],
["vinod-khosla","Vinod Khosla","Venture","Stress-test technical risk and market assumptions","modern","Business"],
["sundar-pichai","Sundar Pichai","Platforms","Examine product ecosystems and scale","modern","Business"],
["satya-nadella","Satya Nadella","Enterprise","Examine platform adoption and organizational change","modern","Business"],
["jensen-huang","Jensen Huang","Computing","Examine computational constraints and infrastructure","modern","Engineering"],
["lisa-su","Lisa Su","Engineering","Assess engineering tradeoffs and product turnaround","modern","Engineering"],
["reshma-saujani","Reshma Saujani","Education","Examine access, confidence and workforce participation","modern","Education"],
["guillermo-diaz","Guillermo Diaz Jr.","Enterprise IT","Assess enterprise technology and workforce readiness","modern","Business"],
["marcelo-claure","Marcelo Claure","Operations","Examine market execution and operational scale","modern","Business"],
["lidiane-jones","Lidiane Jones","Products","Assess product leadership and customer outcomes","modern","Business"],
["diana-trujillo","Diana Trujillo","Aerospace","Examine mission constraints and operational resilience","modern","Engineering"],
["luis-von-ahn","Luis von Ahn","Education","Evaluate learning experience and engagement","modern","Education"],
["jordi-munoz","Jordi Muñoz","Robotics","Assess prototyping and open systems","modern","Engineering"],
["alba-colon","Alba Colón","Analytics","Examine telemetry, performance and decision speed","modern","Engineering"],
["warren-buffett","Warren Buffett","Finance","Evaluate incentives, durable value and downside risk","modern","Business"],
["barack-obama","Barack Obama","Governance","Evaluate coalitions, communication and institutional change","modern","Civic"],
["oprah","Oprah Winfrey","Communication","Examine audience understanding and human experience","modern","Brand"],
["sheryl-sandberg","Sheryl Sandberg","Operations","Examine growth systems and leadership execution","modern","Business"],
["steve-jobs","Steve Jobs","Design","Examine product simplicity and user comprehension","modern","Design"],
["jeff-bezos","Jeff Bezos","Customers","Start with customer needs and long-term operations","modern","Business"],
["bill-gates","Bill Gates","Technology","Examine software ecosystems and public value","modern","Engineering"],
["elon-musk","Elon Musk","Engineering","Challenge constraints and first-principles assumptions","modern","Engineering"],
["mark-cuban","Mark Cuban","Business","Examine practical market demand and economics","modern","Business"],
["mark-zuckerberg","Mark Zuckerberg","Platforms","Examine networks, scale and social tradeoffs","modern","Business"],
["mika-brzezinski","Mika Brzezinski","Media","Question framing and stakeholder communication","modern","Communication"],
["sarah-lord","Sarah Lord","Implementation","Examine adoption, implementation and sustainment","modern","Science"],
["an-wang","An Wang","Computing","Examine hardware and system reliability","historical","Engineering"],
["henry-kissinger","Henry Kissinger","Geopolitics","Examine negotiation, power and unintended consequences","modern","Strategy"],
["zbigniew-brzezinski","Zbigniew Brzezinski","Geopolitics","Examine systems, second-order effects and competing interests","modern","Strategy"],
["james-clapper","James Clapper","Intelligence","Challenge source reliability and analytic confidence","modern","Strategy"]
].map(([id,name,domain,lens,era,group])=>({id,name,domain,lens,era,group})) as CouncilMember[];
export const DEFAULT_RED=["henry-kissinger","zbigniew-brzezinski","james-clapper","rediet-abebe","angie-jones","gladys-west"];
const WORDS:Record<string,string[]>={
Engineering:["code","software","app","api","architecture","platform","security","system","aerospace","nasa","engineering","technology"],
Business:["grant","business","revenue","market","contract","customer","pricing","funding","company","rfp","sales"],
Civic:["city","voting","election","government","community","policy","public","equity","law"],
Science:["research","evidence","clinical","health","medicine","study","data","model","implementation"],
Design:["user","design","ux","brand","experience","website","interface"],
Education:["learn","training","teach","student","education","school"],
Strategy:["risk","conflict","global","war","strategy","scenario","adversarial"]
};
export function selectCouncil(prompt:string,count:number,selected:string[]=[],red=false){
 const n=Math.max(2,Math.min(16,Number.isFinite(count)?Math.floor(count):6));
 const words=prompt.toLowerCase();
 const unique=new Map(MEMBERS.map(m=>[m.id,m]));
 const explicit=[...new Set(selected)].map(id=>unique.get(id)).filter((m):m is CouncilMember=>!!m);
 const pool=MEMBERS.filter(m=>!explicit.some(x=>x.id===m.id));
 const score=(m:CouncilMember)=>{const terms=WORDS[m.group]||[];let s=terms.filter(t=>words.includes(t)).length*5; if(red&&DEFAULT_RED.includes(m.id))s+=20; if(m.id==="socrates"||m.id==="angie-jones")s+=2;return s};
 pool.sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name));
 return [...explicit,...pool].slice(0,n);
}
export function councilBrief(prompt:string,members:CouncilMember[],redMembers:CouncilMember[]){
 const question=prompt.trim();
 return {question,primary:members.map(m=>({id:m.id,name:m.name,perspective:m.lens,question:`From the ${m.domain.toLowerCase()} perspective, what evidence would support or challenge the proposed approach?`})),
 red: redMembers.map(m=>({id:m.id,name:m.name,challenge:`What might be wrong, missing, harmful or unstable when viewed through ${m.domain.toLowerCase()}?`})),
 stages:["Define mission, end state and 5Ws/H","Retrieve source evidence and verify claim-level support","Develop competing hypotheses and map stakeholders","Deliberate across perspectives and record dissent","Red team action → reaction → counteraction","Pilot, test, measure and refine","Report evidence, outcomes, limitations and sustainment"],
 state:"PRE-DELIBERATION",assurance:"No independent AI model execution or verified consensus has occurred. The selected names are conceptual lenses only, not endorsements or representations of actual statements."};
}
