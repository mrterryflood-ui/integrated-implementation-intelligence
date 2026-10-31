import {ECOSYSTEM_CAPABILITIES} from './catalog';
import {parseEngagement,type EngagementInput,type Plan,type Domain} from './contracts';
const WORDS:Record<Domain,RegExp>={community:/\b(community|ceds|cdbg|municipal|neighbou?rhood|zip|population)\b/i,civic:/\b(civic|government|city|county|policy|governance)\b/i,funding:/\b(fund\w*|grant\w*|cdbg|proposal|procurement)\b/i,business:/\b(business|economic|entrepreneur\w*|commerce|workforce)\b/i,research:/\b(research|study|studies|evidence|implementation|fidelity|evaluation)\b/i,health:/\b(health\w*|women|maternal|mental|clinical|caregiver|benefits)\b/i,veterans:/\b(veteran\w*|military|transition)\b/i,'social-care':/\b(chw|311|housing|food|referral|transportation|wraparound|social care)\b/i,safety:/\b(violence|gun|crime|safety|prevention)\b/i,hazards:/\b(hazard\w*|wildfire|flood|weather|disaster|resilience)\b/i,defense:/\b(defense|atlas|military|emergency|continuity)\b/i,lunar:/\b(lunar|space|orbital|homeostasis)\b/i,education:/\b(education|school|learning|childcare|coaching|literacy)\b/i,security:/\b(security|agent|cyber|threat|identity)\b/i};
export function clarifyGeography(input:EngagementInput):string|null{
 const g=input.geography;
 if(g.kind==='postal-code')return 'Should this study use the Census ZIP Code Tabulation Area, a city boundary, or another defined area? Postal ZIPs and municipal boundaries are not interchangeable.';
 if(g.kind==='city'&&(!g.stateFips||(!g.placeFips&&!g.label)))return 'Which city and state should define the study boundary? A county or ZIP result will not be substituted for the city.';
 if(g.kind==='county'&&!g.countyFips)return 'Which county and state should define this study? Supply the five-digit county FIPS when available.';
 if(g.kind==='zcta'&&!g.zcta)return 'Which five-digit Census ZIP Code Tabulation Area should this study use?';
 if(g.kind==='point'&&(g.latitude===undefined||g.longitude===undefined))return 'Which public location coordinates should define the hazard or service-area inquiry?';
 return null;
}
export function planEngagement(value:unknown):Plan{
 const input=parseEngagement(value),domains=new Set(input.domains);
 for(const [domain,re]of Object.entries(WORDS))if(re.test(input.problem))domains.add(domain as Domain);
 if(/community impact|ceds|cdbg|economic development/i.test(input.problem)){domains.add('community');domains.add('civic');domains.add('funding');domains.add('business');domains.add('research');}
 const words=' '+input.problem.toLowerCase().replace(/[^a-z0-9]+/g,' ')+' ';
 const ranked=ECOSYSTEM_CAPABILITIES.map(cap=>({cap,score:cap.domains.filter(d=>domains.has(d)).length*3+cap.terms.filter(t=>words.includes(' '+t.toLowerCase()+' ')).length*2+(cap.technicalState==='BOUND_READ_CONTRACT'?1:0)})).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score||a.cap.id.localeCompare(b.cap.id));
 // Keep broad capability discovery, but limit execution to a bounded chosen set.
 const chosen:typeof ranked=[];
 // Preserve explicitly requested disciplinary coverage rather than filling the
 // budget with several tools from one platform.
 const home:Partial<Record<Domain,string>>={community:'community',civic:'civic',funding:'funding',business:'business',research:'research',health:'health',veterans:'veterans','social-care':'social-care',safety:'safety',hazards:'hazards',defense:'defense',lunar:'lunar',education:'education',security:'security'};
 for(const domain of domains){const entry=ranked.find(r=>r.cap.platformId===home[domain]&&r.cap.domains.includes(domain)&&!chosen.some(c=>c.cap.id===r.cap.id))||ranked.find(r=>r.cap.domains.includes(domain)&&!chosen.some(c=>c.cap.id===r.cap.id));if(entry&&chosen.length<8)chosen.push(entry);}
 for(const entry of ranked)if(chosen.length<8&&!chosen.some(c=>c.cap.id===entry.cap.id))chosen.push(entry);
 const selected=chosen.map(({cap})=>({...cap,reason:'Relevant to '+cap.domains.filter(d=>domains.has(d)).join(', ')+'; '+cap.purpose}));
 const needsPlace=selected.some(c=>c.requiresGeography)&&input.geography.kind==='unspecified';
 const question=clarifyGeography(input)||(needsPlace?'What geographic boundary should define this work: city, county, Census ZCTA, or public coordinates?':selected.length?null:'What decision or outcome should this engagement help you achieve?');
 return {schemaVersion:'dis-engagement-plan-v1',input,selected,deferred:ranked.filter(r=>!selected.some(c=>c.id===r.cap.id)).map(({cap})=>({capabilityId:cap.id,reason:'Relevant but deferred by the eight-capability request budget; no silent invocation.'})),question,steps:[{id:'context',title:'Confirm decision, stakeholder authority and geographic boundary',kind:'clarify',dependsOn:[],status:question?'NEEDS_CONTEXT':'PLANNED'},{id:'evidence',title:'Retrieve the relevant permitted specialist contributions in parallel',kind:'retrieve',dependsOn:['context'],status:'PLANNED'},{id:'challenge',title:'Check sources, contradictions, applicability and competing explanations',kind:'assess',dependsOn:['evidence'],status:'NOT_EXECUTED'},{id:'deliver',title:'Assemble the linked brief, source register, crosswalk and implementation package',kind:'deliver',dependsOn:['evidence','challenge'],status:'PLANNED'},{id:'measure',title:'Agree owners, baselines, fidelity, review triggers and outcomes',kind:'measure',dependsOn:['deliver'],status:'NOT_EXECUTED'}],budgets:{maxCapabilities:8,maxNetworkRequests:12,maxMilliseconds:30000,maxResponseBytes:262144},notice:'Owner integration authorization is established. Technical connectivity, data scope, source validity and production acceptance are reported separately. No source count or model output proves community impact.'};
}

export function publicPlan(value:unknown){const p=planEngagement(value);return {schemaVersion:p.schemaVersion,state:'PLAN_ONLY',question:p.question,selected:p.selected.map(c=>({id:c.id,platformId:c.platformId,label:c.label,purpose:c.purpose,ownerAuthorization:c.ownerAuthorization,technicalState:c.technicalState,reason:c.reason})),deferred:p.deferred,steps:p.steps,budgets:p.budgets,notice:p.notice,networkRequests:0};}
