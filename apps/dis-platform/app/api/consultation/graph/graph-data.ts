type GraphNode={kind:string,label:string,metadata:Record<string,unknown>};
const clean=(x:unknown,n=250)=>typeof x==="string"?x.replace(/[\u0000-\u001f]/g," ").trim().slice(0,n):"";
export function buildGraphData(sessionId:string,intake:Record<string,unknown>,research:Record<string,unknown>):GraphNode[]{
 const base:GraphNode[]=[
  {kind:"question",label:clean(intake.mission,240),metadata:{role:"problem",consultationId:sessionId}},
  {kind:"organization",label:clean(intake.organization,160),metadata:{role:"organization",consultationId:sessionId}},
  {kind:"stakeholder",label:clean(intake.audience,180),metadata:{role:"customer",consultationId:sessionId}},
  {kind:"concept",label:clean(intake.stage,180),metadata:{role:"solution-stage",consultationId:sessionId}},
  {kind:"outcome",label:clean(intake.desiredOutcome,180),metadata:{role:"desired-outcome",consultationId:sessionId}}
 ].filter(x=>x.label);
 const records=Array.isArray(research.records)?research.records:[];
 for(const raw of records.slice(0,45)){
  if(!raw||typeof raw!=="object")continue;
  const r=raw as Record<string,unknown>,url=clean(r.url,450),title=clean(r.title,245);
  if(!title||!url.startsWith("https://"))continue;
  base.push({kind:"source",label:title,metadata:{role:"research-lead",sourceUrl:url,source:clean(r.source,100),recordKind:clean(r.kind,60),sourceStatus:clean(r.sourceStatus,50),retrievedAt:clean(r.retrievedAt,45),consultationId:sessionId,verification:"NOT_CLAIM_VERIFIED"}});
 }
 return base.slice(0,50);
}
