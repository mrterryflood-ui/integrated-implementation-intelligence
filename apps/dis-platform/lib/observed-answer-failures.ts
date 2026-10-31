/** Targeted failures observed in actual runs; not a semantic truth verifier. */
export function observedAnswerFailures(text:string,evidence:string=''):string[]{
 const found=new Set<string>();
 const numbers:Record<string,string>={one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10',eleven:'11',twelve:'12',fifteen:'15',twenty:'20',thirty:'30',sixty:'60'};
 const canon=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|sixty)\b/g,w=>numbers[w]).replace(/\s+/g,' ');
 const supported=canon(evidence);
 for(const raw of text.split(/(?<=[.!?])\s+|\n+/u).filter(Boolean)){
  const s=raw.normalize('NFKC').toLowerCase().replace(/[\u2010-\u2015]/g,'-');
  if(/\b(?:no one|nobody)\s+needs?\s+to\s+(?:submit|seek|obtain|request)|\b(?:need not|don't need to|do not need to)\s+(?:submit|seek|obtain|request)/.test(s)&&/ethics|approval|consent|permission|review board/.test(s))found.add('UNVERIFIED_APPROVAL_EXEMPTION');
  if(/\b(?:synthetic|fictional|fictitious)\b/.test(s)&&/\b(?:must|required|need to)\b/.test(s)&&/ethics|review board|irb|privacy office/.test(s)&&!/\b(?:may|might|depending|check whether|local policy|not always)\b/.test(s))found.add('GOVERNANCE_OVERREACH');
  const durations=s.match(/\b(?:five|one|two|three|four|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|sixty)\s+(?:minutes?|hours?|days?|weeks?|months?|sessions?)\b/g)||[];
  if(durations.some(d=>!supported.includes(canon(d)))&&!/\b(?:illustrative|optional example|for example|proposed|agree|choose|not prescribed)\b/.test(s))found.add('UNSUPPORTED_QUANTITY');
 }
 if(/only (?:structured )?field names.{0,45}no values|only field names, no values/.test(text.toLowerCase())&&/score each record|run (?:your |the )?audit algorithm|calculate.*agreement/.test(text.toLowerCase()))found.add('SCHEMA_IS_NOT_TEST_DATA');
 return [...found];
}
