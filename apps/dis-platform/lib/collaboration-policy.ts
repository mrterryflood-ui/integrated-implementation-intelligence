/** Shared by production council and evaluation: methods inform the answer, not a persona parade. */
export const COLLABORATION_RULES=`Be a thoughtful, candid collaborator. Start with a useful direct response in the user's language and level of detail; acknowledge their actual goal without canned empathy, flattery, or pretending to be human. Ask at most one decision-changing question per turn after providing the help possible now. Preserve the user's corrections and preferences. Explain disagreement respectfully and say what would change your view.
Use the council's relevant methods behind the scenes; do not force each named personality or discipline into the prose. Do not invent dialogue, participation, endorsement or independent agreement. Give two genuinely different options when there is a consequential choice, including a reversible step or no change where appropriate. Distinguish observed evidence, user reports, hypotheses and unknowns, but do not bury people in an UNKNOWN-filled template. Missing baseline data does not prohibit harmless information gathering or a proportionate reversible next step.
Tailor every action to the user's actual authority, resources, accessibility and needs. An individual cannot be assigned municipal policy powers; say whom they could approach instead. Do not assume stakeholder agreement or clinical/legal authority. State relevant boundaries warmly without lecturing or blocking legitimate collaboration. Keep consent, privacy and anti-abuse gates intact.
Explain which specific source passage supports each material empirical claim, using [S#]; state when the evidence is limited or inapplicable. Abstracts are discovery evidence, not full-text appraisal. Publication year is not a statute date. Never turn an article's year into a law's enactment date. Never equate reliability with validity, correlation with causation, or lack of statistical significance with proof of no effect. Never invent targets, percentages, schedules, validated instruments, measured outcomes or approvals. Proposed thresholds must be explicitly labeled illustrative and agreed before use.
Help the user choose an achievable next step, who would own it, what core function must be preserved, what can adapt, how to measure progress and unintended harm, and when to reconsider. Choose detail proportionate to the decision, not a compulsory report. End with one helpful invitation to refine, not a list of sales offers. Do not promise monitoring or future actions that have not been scheduled.`;
const TERMS:Record<string,RegExp>={
 'Geodesy':/\b(spatial|geospatial|coordinates?|mapping|gps|geodesy|surveying)\b/i,
 'Geopolitics':/\b(international|geopolitic\w*|diplomac\w*|war|borders?|sanctions?|treaty)\b/i,
 'Health':/\b(health|clinical|caregiver|patient|care|medical|wellness)\b/i,
 'Education':/\b(learn\w*|teach\w*|school|student|education|training|homework|coaching)\b/i,
 'Aerospace':/\b(aerospace|spacecraft|orbit|flight|nasa|aviation)\b/i,
 'Software':/\b(software|code|api|app|digital|programming)\b/i,
 'Computing':/\b(comput\w*|hardware|processor|server|memory)\b/i,
 'AI':/\b(ai|artificial intelligence|algorithm\w*|model fairness)\b/i,
 'Testing':/\b(test\w*|software|reproducib\w*|quality|reliability)\b/i,
 'Engineering':/\b(engineer\w*|technical|manufactur\w*|infrastructure|energy|water)\b/i,
 'Robotics':/\b(robot\w*|drone|prototype|autonomous)\b/i,
 'Standards':/\b(standard\w*|interoperab\w*|integration|interface|compliance)\b/i,
 'Finance':/\b(finance|budget|cost|investment|funding|money)\b/i,
 'Business':/\b(business|company|revenue|market|customer|sales|contract|grant)\b/i,
 'Venture':/\b(startup|venture|investor|market|fundrais\w*)\b/i,
 'Operations':/\b(operations?|process|workflow|service|deliver\w*|supply)\b/i,
 'Governance':/\b(govern\w*|policy|council|city|public|institution)\b/i,
 'Civic':/\b(community|civic|equity|justice|access|public|vot\w*)\b/i,
 'Design':/\b(design|user|accessib\w*|usability|experience)\b/i,
 'Communication':/\b(communication|audience|explain|engage\w*|family|people|individual)\b/i,
 'Media':/\b(media|podcast|journalis\w*|message|communication)\b/i,
 'Brand':/\b(brand|audience|story|marketing)\b/i,
 'Customers':/\b(customer|user|client|business|service)\b/i,
 'Products':/\b(product|customer|design|user)\b/i,
 'Platforms':/\b(platform|ecosystem|network|scale)\b/i,
 'Enterprise':/\b(enterprise|organization|change|adoption|university|business)\b/i,
 'Enterprise IT':/\b(enterprise|technology|workforce|digital)\b/i,
 'Technology':/\b(technology|software|digital|platform)\b/i,
 'Analytics':/\b(data|measure\w*|analysis|telemetry|outcome\w*)\b/i,
 'Mathematics':/\b(mathemat\w*|calculat\w*|quantit\w*|statistic\w*|probability)\b/i,
 'Strategy':/\b(strategy|options?|alternative|risk|decision|emergency)\b/i,
 'Intelligence':/\b(evidence|source|uncertain\w*|reliab\w*|information)\b/i,
 'Implementation':/\b(implement\w*|adoption|fidelity|improv\w*|sustain\w*|outcome\w*)\b/i,
 'Scientific inquiry':/\b(research|science|evidence|experiment|hypothes\w*)\b/i,
 'Quality systems':/\b(quality|process|variation|improv\w*|reliab\w*)\b/i,
 'Systems dynamics':/\b(system|complex|feedback|environment|community|policy)\b/i
};
export function lensFit(member:{domain:string},prompt:string){
 const match=TERMS[member.domain]?.test(prompt)||false;
 const general=['Inquiry','Logic','Leadership','Implementation','Quality systems','Communication','Systems dynamics'];
 return (match?20:0)+(general.includes(member.domain)?3:0);
}
export function conversationalTask(depth:string){return `Respond as a collaborator, not a committee transcript. ${depth==='Quick'?'Use about 150 words.':'Aim for about 350 words unless the question genuinely needs more.'} Give the useful answer first, then the important evidence/uncertainty and an achievable next step. Integrate relevant competing perspectives without announcing every lens. Do not repeat the question or force a 5Ws/H report. Preserve meaningful dissent and offer at most one useful follow-up question.`;}
