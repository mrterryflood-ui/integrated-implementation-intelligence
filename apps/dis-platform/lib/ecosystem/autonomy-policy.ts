/**
 * Human-directed autonomy policy. A client request cannot create an authorization grant.
 * Only a separately verified server-side grant can raise an actor's ceiling.
 */
export const AUTONOMY_LEVELS = ['advisory','collaborative','delegated','supervised','bounded-autonomous'] as const;
export type AutonomyLevel = typeof AUTONOMY_LEVELS[number];
export const OPERATIONS = ['plan','research-public','read-aggregate','council-review','draft-artifact','save-private','assign-task','modify-platform','send-external','spend','publish','access-protected','operate-device'] as const;
export type Operation = typeof OPERATIONS[number];
export type AuthorityGrant = {
  grantId:string; subjectId:string; tenantId:string; projectId:string;
  level:AutonomyLevel; allowedOperations:Operation[]; expiresAt:string;
  approvedBy:string; revokedAt?:string; maxSpendUsd?:number;
};
export type AutonomyRequest = {
  subjectId:string; tenantId:string; projectId:string;
  operation:Operation; requestedLevel:AutonomyLevel;
  externalConsent:boolean; amountUsd?:number;
};
export type AutonomyDecision = {
  outcome:'ALLOW'|'HUMAN_APPROVAL_REQUIRED'|'DENY';
  reason:string; effectiveLevel:AutonomyLevel; grantId:string|null;
  auditRequired:true; actionExecuted:false;
};
const levelIndex=(v:AutonomyLevel)=>AUTONOMY_LEVELS.indexOf(v);
const baseline=new Set<Operation>(['plan','draft-artifact']);
const collaborative=new Set<Operation>(['research-public','read-aggregate','council-review']);
const consequential=new Set<Operation>(['send-external','spend','publish','access-protected','operate-device']);
const permitted=(o:Operation,level:AutonomyLevel)=>{
 if(baseline.has(o))return true;
 if(collaborative.has(o))return levelIndex(level)>=1;
 if(o==='save-private')return levelIndex(level)>=1;
 if(o==='assign-task')return levelIndex(level)>=2;
 if(o==='modify-platform')return levelIndex(level)>=3;
 return false;
};
export function evaluateAutonomy(req:AutonomyRequest, grant:AuthorityGrant|null, now=new Date()):AutonomyDecision {
 const base={effectiveLevel:'collaborative' as AutonomyLevel,grantId:null,auditRequired:true as const,actionExecuted:false as const};
 if(!OPERATIONS.includes(req.operation)||!AUTONOMY_LEVELS.includes(req.requestedLevel)||
    !req.subjectId||!req.tenantId||!req.projectId||!Number.isFinite(now.getTime())||
    req.amountUsd!==undefined&&(!Number.isFinite(req.amountUsd)||req.amountUsd<0))
  return {...base,outcome:'DENY',reason:'Invalid actor, scope, operation, level or amount.'};
 const valid=grant!==null&&grant.subjectId===req.subjectId&&grant.tenantId===req.tenantId&&
 grant.projectId===req.projectId&&!!grant.approvedBy&&!!grant.grantId&&!grant.revokedAt&&
 Number.isFinite(Date.parse(grant.expiresAt))&&Date.parse(grant.expiresAt)>now.getTime()&&
 AUTONOMY_LEVELS.includes(grant.level)&&Array.isArray(grant.allowedOperations);
 const ceiling=valid?grant.level:'collaborative';
 const effectiveLevel=AUTONOMY_LEVELS[Math.min(levelIndex(req.requestedLevel),levelIndex(ceiling))];
 const scoped={...base,effectiveLevel,grantId:valid?grant.grantId:null};
 if(levelIndex(req.requestedLevel)>levelIndex(ceiling))
  return {...scoped,outcome:'HUMAN_APPROVAL_REQUIRED',reason:'Requested autonomy exceeds the independently authorized ceiling.'};
 if(consequential.has(req.operation))
  return {...scoped,outcome:'HUMAN_APPROVAL_REQUIRED',reason:'Consequential action requires an explicit transaction-specific approval; no blanket autonomy waiver.'};
 if(!permitted(req.operation,effectiveLevel))
  return {...scoped,outcome:'HUMAN_APPROVAL_REQUIRED',reason:'This operation requires a higher approved autonomy level.'};
 if(!baseline.has(req.operation)&&!req.externalConsent)
  return {...scoped,outcome:'HUMAN_APPROVAL_REQUIRED',reason:'External or protected work requires current, task-specific consent.'};
 if(!baseline.has(req.operation)&&(!valid||!grant.allowedOperations.includes(req.operation)))
  return {...scoped,outcome:'HUMAN_APPROVAL_REQUIRED',reason:'No active, actor-and-tenant-scoped grant authorizes this operation.'};
 return {...scoped,outcome:'ALLOW',reason:'Within the verified grant, level and operation boundary; downstream resource permissions still apply.'};
}
export function defaultAutonomy() {
 return {level:'collaborative' as const,scope:'plan-and-draft-only-without-a-server-grant',
  notice:'User-selected autonomy is a preference, not a credential. This evaluator never performs an action.'};
}
