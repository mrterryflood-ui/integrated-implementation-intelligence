export type Intake={mission:string,organization:string,audience:string,stage:string,alternatives:string,traction:string,resources:string,geography:string,desiredOutcome:string};
export type Deliverable={id:string,title:string,body:string,validation:"DRAFT"|"VERIFIED",note:string};
const text=(s:unknown)=>typeof s==="string"?s.trim().slice(0,1200):"";
export function sanitizeIntake(raw:Record<string,unknown>):Intake{
 const result={} as Intake;
 for(const key of ["mission","organization","audience","stage","alternatives","traction","resources","geography","desiredOutcome"] as const) result[key]=text(raw[key]);
 return result;
}
const placeholder=(v:string,request:string)=>v||("[RESEARCH REQUIRED: "+request+"]");
export function deliverables(input:Intake,council?:{deliberation?:{synthesis?:string,challenge?:string},sources?:{id:string,title:string,url:string}[]},mode:"startup"|"general"="startup"):Deliverable[]{
 const org=placeholder(input.organization,"confirm venture/legal identity");
 const problem=placeholder(input.mission,"clarify problem and expected improvement");
 const buyer=placeholder(input.audience,"interview target customers");
 const traction=placeholder(input.traction,"establish real traction and baseline");
 const rivals=placeholder(input.alternatives,"identify competing and substitute solutions");
 const stage=placeholder(input.stage,"verify MVP stage and usability");
 const geography=placeholder(input.geography,"identify target market geography");
 const baseline="No claim is independently validated unless supporting evidence is provided and checked.";
 const base=[
 {id:"brief",title:"Executive opportunity brief",body:`Venture: ${org}\nProblem: ${problem}\nWho experiences it: ${buyer}\nProposed solution and stage: ${stage}\nCurrent evidence: ${traction}\nTarget outcome: ${placeholder(input.desiredOutcome,"define measurable success")}\n\nCritical unresolved: customer interviews, willingness to pay, competitor data, feasibility, compliance and unit economics.`},
 {id:"pitch",title:"Investor pitch narrative and 12-slide blueprint",body:[`1. Title — ${org}`,`2. Problem — ${problem}`,`3. Customer — ${buyer}`,`4. Why now — [VERIFY current market shifts]`,`5. Solution and demonstration — ${stage}`,`6. Competition — ${rivals}`,`7. Defensible advantage — [PROVE distinct value]`,`8. Go-to-market — [TEST channels and customer acquisition]`,`9. Traction — ${traction}`,`10. Business model and unit economics — [VALIDATE]`,`11. Team and milestones — [VERIFY credentials, risks and timeline]`,`12. Funding ask and use of proceeds — [BUDGET, MILESTONES, INVESTOR MATCH TO VERIFY]`].join("\n")},
 {id:"competition",title:"Competitive analysis and blue-ocean strategy",body:`Market: ${geography}\nAlternatives to map: ${rivals}\n\nCompetition matrix: For each confirmed competitor, collect buyer, price, strengths, weaknesses, switching cost, distribution, cited source and retrieval date. No competitors have been independently verified by this package.\n\nBlue Ocean ERRC exercise\nELIMINATE — [Identify features/processes buyers do not value]\nREDUCE — [Identify costs, complexity or frictions above customer need]\nRAISE — [Identify valuable unmet customer needs]\nCREATE — [Validate genuinely differentiated new value]\n\nDisruption hypothesis: [COMPARE to existing solutions with customer evidence, not founder opinion].`},
 {id:"funding",title:"Funding fit and target-investor research brief",body:`Sector/problem: ${problem}\nStage: ${stage}\nGeography: ${geography}\n\nResearch categories to verify: non-dilutive grants, SBIR/STTR where eligible, foundations, accelerators, angel groups, venture capital and strategic partners.\n\nFor every proposed funder collect: organization; official source URL; published investment thesis or eligibility; active opportunity and deadline; typical ticket where publicly available; stage/geography alignment; exclusions; contact channel; source retrieval date.\n\nFunder matches: NONE VERIFIED. Do not represent investor interest or open application windows without direct checks.`},
 {id:"execution",title:"30/60/90-day validation and implementation plan",body:`0–30 days: Define outcome and baseline, interview users and buyers, inventory existing solutions and establish competitive evidence.\n31–60 days: Prototype or revise MVP, conduct task-based usability trials, test price/positioning, and document experiment outcomes and dissent.\n61–90 days: Run a controlled pilot, measure adoption, conversion, value and reliability; revise pitch and funding targeting based on observed evidence.\n\nOwners: [ASSIGN]\nBudget and constraints: ${placeholder(input.resources,"confirm capacity and financial resources")}\nSuccess metric and decision thresholds: [USER-APPROVED]\nRollback/no-go triggers: [DEFINE]`},
 {id:"council",title:"Council consultation and opposing analysis",body:`Council synthesis (preliminary, not verified):\n${council?.deliberation?.synthesis||"[NOT YET RUN — use the Council Studio for live research and deliberation]"}\n\nChallenge and dissent:\n${council?.deliberation?.challenge||"[NOT YET RUN]"}\n\nCitation audit: Source links alone are not proof. Validate claim-to-passage support before circulation.`}
 ];
 const generalTitles:Record<string,string>={brief:"Problem and stakeholder brief",pitch:"Decision and implementation presentation",competition:"Alternatives and systems-gap analysis",funding:"Resources, partners and external support",execution:"30/60/90-day implementation and evaluation plan",council:"Council critique and open questions"};
 if(mode==="general")for(const item of base)item.title=generalTitles[item.id]||item.title;
 return base.map(item=>({...item,validation:"DRAFT" as const,note:baseline}));
}
export function packageMarkdown(intake:Intake,items:Deliverable[]){
 return "# DIS Consultation Package — DRAFT / EVIDENCE GATES OPEN\n\nPrepared for: "+(intake.organization||"Unnamed project")+"\n\nEvery assertion, market datum, funding match and recommendation requires source and user approval before external use. No winner or funding is guaranteed.\n\n"+items.map((d,i)=>"## "+(i+1)+". "+d.title+"\n\n"+d.body+"\n\nValidation: "+d.validation+" — "+d.note).join("\n\n---\n\n");
}
