/** Shared stakeholder UX council release evidence, applicable across domains.
 * A report is NOT evidence that a browser or human user test was executed.
 */
export const UX_PILLARS=['product-experience','engineering-scale','security-access','marketing-revenue','legal-privacy'] as const;
export type UXPillar=typeof UX_PILLARS[number];
export type Verification='PASS'|'FAIL'|'NOT_TESTED'|'NOT_APPLICABLE';
export type PageJourney={
 route:string;persona:string;purpose:string;functionExplanation:string;
 prerequisites:string;steps:string[];resultInterpretation:string;
 expectedOutcome:string;nextDecision:string;helpLocation:string;
 visuals:{description:string;relevance:string;caption:string;keyboardTouchDetails:boolean;illustrativeLabel?:string}[];
 measures:{name:string;unit:string;source:string;date:string;denominator:string;uncertainty:string;status:'MEASURED'|'NOT_MEASURED'|'SYNTHETIC'}[];
};
export type CouncilReview={discipline:string;reviewStatus:'SIMULATED_LENS'|'VERIFIED_HUMAN'|'MISSING';finding:string};
export type UXAcceptance={pages:PageJourney[];council:CouncilReview[];
 checks:{pillar:UXPillar;name:string;status:Verification;proof:string}[];
 chromium:Verification;iphoneWebkit:Verification;tablet:Verification;
 keyboard:Verification;touch:Verification;sourceRevision:string;productionRevision:string;
};
export function assessStakeholderUX(a:UXAcceptance){
 const gaps:string[]=[];
 if(!a.pages.length)gaps.push('No user journeys inspected.');
 for(const p of a.pages){
  if(!p.route||!p.persona||!p.purpose||!p.functionExplanation||!p.prerequisites||
    !p.steps.length||!p.resultInterpretation||!p.expectedOutcome||!p.nextDecision||!p.helpLocation)
   gaps.push('Incomplete walkthrough: '+(p.route||'unknown page'));
  for(const v of p.visuals)if(!v.relevance||!v.caption||!v.keyboardTouchDetails)
   gaps.push('Visual lacks relevant explanation or accessible interaction: '+p.route);
  for(const m of p.measures)if(m.status==='MEASURED'&&(!m.unit||!m.source||!m.date||!m.denominator||!m.uncertainty))
   gaps.push('Measured gauge lacks provenance or interpretation: '+p.route);
 }
 if(!a.council.length||a.council.some(x=>x.reviewStatus==='MISSING'))gaps.push('Required council expertise not covered.');
 for(const pillar of UX_PILLARS)if(!a.checks.some(c=>c.pillar===pillar))gaps.push('Missing pillar: '+pillar);
 if(a.checks.some(c=>c.status==='FAIL'||c.status==='NOT_TESTED'||c.status==='PASS'&&!c.proof))
  gaps.push('Verification failure, untested check, or unsupported pass.');
 for(const [name,value] of Object.entries({chromium:a.chromium,iphoneWebkit:a.iphoneWebkit,tablet:a.tablet,keyboard:a.keyboard,touch:a.touch}))
  if(value!=='PASS')gaps.push('Required device/accessibility test not passed: '+name);
 if(!/^[a-f0-9]{40}$/.test(a.sourceRevision)||a.sourceRevision!==a.productionRevision)
  gaps.push('Exact source-to-production revision not established.');
 return {accepted:gaps.length===0,gaps,reportFormat:'BEFORE → CHANGED → WHY → PROOF → LIMITS',
  warning:'A simulated council is not a contracted human reviewer. Missing metrics must not be fabricated.'};
}
