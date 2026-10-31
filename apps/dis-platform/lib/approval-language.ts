/** Preserve approval uncertainty and genuine warnings; reject asserted exemptions. */
export function assertsApprovalExemption(sentence:string):boolean{
 const approval='(?:ethics (?:reviews?|approvals?)|(?:external |institutional )?approvals?|consents?|permissions?)';
 return sentence.toLowerCase().split(/[;,]|\bbut\b|\bhowever\b/).some(clause=>{
  if(/\b(?:do not|don't|never|must not|cannot|can't|should not)\s+(?:ever\s+)?(?:assume|claim|say|state|act|proceed|collect|record|share|upload|send|process|use|recruit|publish)\b/.test(clause))return false;
  return new RegExp('\\b(?:without (?:(?:requiring|needing) )?|does not require |do not require |need not obtain )'+approval).test(clause)||new RegExp('\\bno '+approval+'(?: is| are)? (?:needed|required|necessary)\\b').test(clause);
 });
}
