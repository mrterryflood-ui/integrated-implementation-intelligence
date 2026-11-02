import {createHash} from 'node:crypto';
import type {IntelligenceRecord} from './consultation-research';
export type WorkforceRoute={id:string;name:string;url:string;applicant:string;planningImplication:string;cycle:'VERIFY_CURRENT_NOTICE'|'2026_CLOSED';checkedAt:string;terms:string[]};
/** Public-source eligibility leads, not awards, available balances, or an applicant certification. */
export const TEXAS_WORKFORCE_ROUTES:WorkforceRoute[]=[
 {id:'LSWF',name:'Lone Star Workforce of the Future',url:'https://tcss.legis.texas.gov/resources/ED/htm/ED.134A.htm',applicant:'Qualifying nonprofit, public junior college or public technical institute',planningImplication:'Requires third-party validated recruitment, training and placement results; employer-aligned high-demand training; at least 40% non-state program funding. A new pilot must validate its track record or an eligible provider partnership. Statutory ceilings are not current grant-offer amounts.',cycle:'VERIFY_CURRENT_NOTICE',checkedAt:'2026-11-02',terms:['third-party','40 percent','high demand','self-sufficient','six months']},
 {id:'SDF',name:'Skills Development Fund',url:'https://tcss.legis.texas.gov/resources/LA/htm/LA.303.htm',applicant:'Eligible institutions; a community-based organization only through a qualifying partnership',planningImplication:'A community-based organization applies in partnership with an eligible community/technical college, TEES or TEEX. Do not equate any university partnership with this statutory route. Confirm employer demand, allowable training and current instructions.',cycle:'VERIFY_CURRENT_NOTICE',checkedAt:'2026-11-02',terms:['Sec. 303.003.','only in partnership','letter of support','high-demand fields']},
 {id:'JET',name:'Jobs and Education for Texans',url:'https://gov.texas.gov/news/post/governor-abbott-announces-over-20-million-in-career-training-grants-across-texas',applicant:'Eligible education/training institutions under the applicable solicitation',planningImplication:'Institution-led career-training equipment route. A nonprofit chapter may be an outreach/implementation partner, not the direct applicant. The October 12, 2026 announcement describes awards already made, not an uncommitted balance; verify the actual next solicitation.',cycle:'VERIFY_CURRENT_NOTICE',checkedAt:'2026-11-02',terms:['TWC will release the 2027','eligible applicants','JET grants']},
 {id:'TTC',name:'Texas Talent Connection',url:'https://gov.texas.gov/organization/twic/wagner_peyser_7b_program',applicant:'Eligible applicants and partnerships under the competition guidelines',planningImplication:'Federally funded, Texas-administered workforce grants. The 2026 competition closed March 31, 2026. Future dates are unconfirmed. Evaluate employment outcomes, renewal conditions and the eligible applicant; no automatic next-year award.',cycle:'2026_CLOSED',checkedAt:'2026-11-02',terms:['application period for the Texas Talent Connection','Wagner-Peyser','Funding is generally limited']},
 {id:'SSF',name:'Self-Sufficiency Fund',url:'https://tcss.legis.texas.gov/resources/LA/htm/LA.309.htm',applicant:'Eligible community-based nonprofits, public community/technical colleges or TEEX; confirm current TWC guidance',planningImplication:'Evaluate qualifying lower-income adult/parent or young-adult training, industry-recognized credentials and employment outcomes. Separate this pathway from school-age career exposure. Confirm participant criteria, current grant limits and available funding.',cycle:'VERIFY_CURRENT_NOTICE',checkedAt:'2026-11-02',terms:['Sec. 309.002.','support services','low-income','commission shall administer']},
];
export function needsTexasWorkforce(query:string){return /\b(texas|austin|houston|travis|harris)\b/i.test(query)&&/\b(workforce|training|career|employment|apprentice\w*|funding|grant\w*|credential\w*)\b/i.test(query);}
export function workforceReadiness(routeId:string,profile:{validatedOutcomes?:boolean;eligiblePartner?:boolean;employerDemand?:boolean;nonStateShare?:number;currentNoticeVerified?:boolean}){
 const gaps:string[]=[];
 if(!profile.currentNoticeVerified)gaps.push('Verify the current solicitation, deadline, available funds and applicable rules');
 if(!profile.employerDemand)gaps.push('Document local employer demand and the intended occupational pathway');
 if(routeId==='LSWF'){
  if(!profile.validatedOutcomes)gaps.push('Third-party validated recruitment, training and placement outcomes are not established');
  if(profile.nonStateShare===undefined||!Number.isFinite(profile.nonStateShare)||profile.nonStateShare<.4||profile.nonStateShare>1)gaps.push('At least 40% non-state share of total necessary program funding is not established');
 }
 if(['SDF','JET'].includes(routeId)&&!profile.eligiblePartner)gaps.push('Confirm the eligible applicant/provider partnership; a general partnership is not sufficient');
 return {routeId,qualification:'NOT_CERTIFIED',gaps};
}
async function boundedHtml(url:string,fetcher:typeof fetch){
 const r=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{accept:'text/html','user-agent':'DIS-public-research/1.0'}});
 if(!r.ok||!r.body)throw Error('Source HTTP '+r.status);
 if(!/text\/html|text\/plain/i.test(r.headers.get('content-type')||''))throw Error('Unsupported source type');
 if(Number(r.headers.get('content-length')||0)>1500000)throw Error('Source exceeds retrieval boundary');
 const reader=r.body.getReader();let total=0;const chunks:Uint8Array[]=[];
 try{while(true){const item=await reader.read();if(item.done)break;total+=item.value.byteLength;if(total>1500000)throw Error('Source exceeds retrieval boundary');chunks.push(item.value);}}finally{await reader.cancel().catch(()=>{});}
 const html=Buffer.concat(chunks).toString('utf8');
 if(/verify you are human|access denied|just a moment|captcha/i.test(html.slice(0,10000)))throw Error('Source access blocked; no claim verification');
 return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}
export async function texasWorkforceEvidence(fetcher:typeof fetch=fetch){
 const records:IntelligenceRecord[]=[],errors:string[]=[],receipts:{id:string;url:string;retrievedAt:string;sha256:string;passages:string[];qualification:string}[]=[];
 await Promise.all(TEXAS_WORKFORCE_ROUTES.map(async route=>{
  try{
   const text=await boundedHtml(route.url,fetcher),lower=text.toLowerCase();
   const passages=route.terms.flatMap(term=>{const i=lower.indexOf(term.toLowerCase());return i<0?[]:[text.slice(Math.max(0,i-120),i+420)];}).slice(0,5);
   if(!passages.length)throw Error('Expected program content absent; manual source review needed');
   const retrievedAt=new Date().toISOString(),sha256=createHash('sha256').update(text).digest('hex');
   records.push({id:'TX-'+route.id,kind:route.url.includes('tcss.legis.texas.gov')?'REGULATION':'TECHNICAL_REPORT',title:route.name+' — applicant and readiness review',url:route.url,source:'Texas public authority ('+new URL(route.url).hostname+')',sourceStatus:'OFFICIAL_RECORD',retrievedAt,summary:'PLANNING LEAD; ELIGIBILITY NOT CERTIFIED. Curated interpretation checked '+route.checkedAt+': '+route.planningImplication+' Retrieved passages: '+passages.join(' | '),eligibilityStatus:'UNVERIFIED'});
   receipts.push({id:'TX-'+route.id,url:route.url,retrievedAt,sha256,passages,qualification:'SOURCE_RETRIEVED_NOT_APPLICANT_CERTIFIED'});
  }catch(e){errors.push(route.name+': '+(e instanceof Error?e.message:'Unavailable'));}
 }));
 records.sort((a,b)=>a.id.localeCompare(b.id));receipts.sort((a,b)=>a.id.localeCompare(b.id));
 return {records,errors,receipts,notice:'Program existence, historical awards and source retrieval do not establish a current opening, remaining funds, local eligibility or partnership commitment.'};
}
