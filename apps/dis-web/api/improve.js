import {council,retrieve} from "./ask.js";
const lenses={
industry:["Market structure and buyer alternatives","Regulatory and technology trends","Competitors and substitution"],
capabilities:["Current-state architecture and workflows","Security, performance and interoperability","Reuse versus replacement"],
needs:["Stakeholder needs and unmet outcomes","MAP–GAP and root causes","Known and unknown dependencies"],
experience:["User journey and accessibility","User-centered design and cognitive load","Adoption barriers and task completion"],
brand:["Value proposition and differentiation","Trust, clarity and consistency","Messaging and discoverability"],
operations:["Business model, pricing and total cost","Implementation ownership and change readiness","Monitoring, scalability and sustainability"]
};
export function plan(input,sources=[]){
 const question=String(input?.question||"").trim(),context=String(input?.context||"").trim();
 const depth=["Quick","Standard","Deep","Research"].includes(input?.depth)?input.depth:"Standard";
 const base=council(question+" "+context);
 const selection=depth==="Quick"?["needs","experience"]:depth==="Standard"?["needs","capabilities","experience","operations"]:Object.keys(lenses);
 const dimensions=selection.map(key=>({key,checks:lenses[key],status:"INVESTIGATION REQUIRED",findings:[]}));
 const missing=[
 "What are the intended outcomes, baseline and measurable acceptance criteria?",
 "In what ways does the existing system fail for actual users?",
 "What organizations, people and alternatives have not been considered?",
 "Which industry and regulatory sources are authoritative and current?",
 "What would falsify the preferred approach or justify doing nothing?",
 "Who can authorize changes, and what rollback and sustainment capacity exists?"
 ];
 const evidence=sources.map((s,i)=>({id:"S"+(i+1),title:s.title,url:s.url,year:s.year,claimStatus:"NOT APPRAISED"}));
 const gates=[
 {id:"G0",name:"Discovery and scope",pass:false,requires:"Verified existing system, mission, stakeholder map, baseline"},
 {id:"G1",name:"Research and challenge",pass:false,requires:"Source passages, alternatives, competing hypotheses and dissent"},
 {id:"G2",name:"Solution and design",pass:false,requires:"Traceable requirements, UX/UCD, architecture, cost and safety review"},
 {id:"G3",name:"Controlled implementation",pass:false,requires:"Authorized change, isolated branch, reproducible test results"},
 {id:"G4",name:"Acceptance and sustainability",pass:false,requires:"End-user tasks, operational metrics, buyer value, ownership and monitoring"}
 ];
 return {question,context,depth,domain:base.domain,council:base.perspectives,
 dimensions,missing,evidence,gates,
 hypotheses:["Improve the existing workflow before adding new features","Compare build, buy, integrate, partner and no-change alternatives","Prioritize improvements by verified user value, risk, cost and reversibility"],
 status:"DISCOVERY ONLY",conclusion:"No validated solution, independent council consensus or implemented repair is claimed.",limitations:"Source metadata is not claim-level evidence. No repository inspection, external company verification, human SME consultation, code execution or causal modeling was performed by this endpoint."};
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"POST required"});
 const question=String(req.body?.question||"").trim();
 const context=String(req.body?.context||"").trim();
 if(question.length<5||question.length>1500||context.length>8000)return res.status(400).json({error:"Question must be 5–1500 characters and context at most 8000"});
 const found=await retrieve(question.slice(0,250));
 return res.status(200).json({...plan({...req.body,question,context},found.sources),retrievalErrors:found.errors});
}
