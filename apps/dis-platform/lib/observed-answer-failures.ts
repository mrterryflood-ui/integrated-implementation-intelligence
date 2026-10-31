/** Targeted failures observed in actual runs; not a semantic truth verifier. */
export function observedAnswerFailures(text:string):string[]{
 const found=new Set<string>();
 for(const raw of text.split(/(?<=[.!?])\s+|\n+/u).filter(Boolean)){
  const s=raw.normalize('NFKC').toLowerCase().replace(/[\u2010-\u2015]/g,'-');
  if(/\b(?:no one|nobody)\s+needs?\s+to\s+(?:submit|seek|obtain|request)|\b(?:need not|don't need to|do not need to)\s+(?:submit|seek|obtain|request)/.test(s)&&/ethics|approval|consent|permission|review board/.test(s))found.add('UNVERIFIED_APPROVAL_EXEMPTION');
  if(/\b(?:synthetic|fictional|fictitious)\b/.test(s)&&/\b(?:must|required|need to)\b/.test(s)&&/ethics|review board|irb|privacy office/.test(s)&&!/\b(?:may|might|depending|check whether|local policy|not always)\b/.test(s))found.add('GOVERNANCE_OVERREACH');
  if(/\b(?:five|one|two|three|four|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|sixty)\s+(?:minutes?|hours?|days?|weeks?|months?|sessions?)\b/.test(s)&&!/\b(?:illustrative|optional example|for example|proposed|agree|choose|not prescribed)\b/.test(s))found.add('UNSUPPORTED_QUANTITY');
 }
 if(/only (?:structured )?field names.{0,45}no values|only field names, no values/.test(text.toLowerCase())&&/score each record|run (?:your |the )?audit algorithm|calculate.*agreement/.test(text.toLowerCase()))found.add('SCHEMA_IS_NOT_TEST_DATA');
 return [...found];
}
