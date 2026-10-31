/** A warning that approval is unknown is not an assertion of exemption. */
export function assertsApprovalExemption(sentence:string):boolean{
 const s=sentence.toLowerCase();
 const approval='(?:ethics (?:review|approval)|(?:external |institutional )?approval|consent|permission)';
 if(/\b(?:do not|don't|never|must not|cannot|can't|should not)\b.{0,70}\b(?:assume|claim|say|state|act|proceed)\b/.test(s))return false;
 return new RegExp('\\b(?:without (?:requiring|needing) |does not require |do not require |need not obtain )'+approval).test(s)||new RegExp('\\bno '+approval+'(?: is| are)? (?:needed|required|necessary)\\b').test(s);
}
