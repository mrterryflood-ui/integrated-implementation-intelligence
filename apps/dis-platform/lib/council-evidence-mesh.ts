/**
 * DIS federated evidence-assurance layer for Council source packets.
 *
 * This is an audit of DECLARED SOURCE METADATA, not an instrument validator,
 * a causal-inference engine, a numerical sensor-fusion model, or a verified
 * independent review. Even two genuinely different source domains do not
 * prove independent measurements, a shared construct, or corroboration.
 *
 * Source identity, reference period, observation time and retrieval time are
 * different things. No universally valid freshness window is invented.
 */
import type {EvidenceSource} from './evidence-integrity';

export type MeshIssue={
  code:'SOURCE_METADATA_MISSING'|'DUPLICATED_SOURCE_REFERENCE'|
       'POSSIBLY_REPUBLISHED_EXCERPT'|'REFERENCE_PERIOD_UNKNOWN'|
       'REFERENCE_PERIODS_DIFFER'|'GEOGRAPHY_UNKNOWN'|'GEOGRAPHIES_DIFFER'|
       'FUTURE_RECEIPT'|'SOURCE_TIME_UNVERIFIED'|'RECORDS_TRUNCATED';
  severity:'REVIEW'|'HOLD_INFERENCE';
  sourceIds:string[];
  explanation:string;
  nextCheck:string;
};
export type MeshSourceReview={
  id:string;kind:'SCHOLARLY_ABSTRACT'|'PRIMARY_PUBLIC_DOCUMENT'|'PLATFORM_PUBLIC_EXCERPT';
  origin:string;declaredScope:string|null;referencePeriod:string|null;
  retrievalTime:string|null;
  retrievalState:'RETRIEVED_BY_DECISION_TIME'|'UNKNOWN'|'AFTER_DECISION_TIME';
  instrumentValidation:'NOT_ESTABLISHED';
  claimVerification:'NOT_PERFORMED';
};
export type EvidenceMeshAssurance={
  schemaVersion:'dis-source-triangulation-v1';
  status:'NO_SOURCES'|'SOURCE_INPUT_REVIEW_REQUIRED';
  decisionAsOf:string;
  sourceRecordCount:number;
  reviewedRecordCount:number;
  sources:MeshSourceReview[];
  issues:MeshIssue[];
  repeatedReferenceGroups:string[][];
  independentlyVerifiedSourceCount:0;
  samePhenomenonVerified:false;
  geospatialTemporalAlignmentVerified:false;
  numericalPoolingAuthorized:false;
  actionAuthorized:false;
  independentEvidenceConclusion:'NOT_ESTABLISHED';
  operatingRule:string;
  nextDecision:string;
};

const normalize=(s:string)=>s.trim().toLowerCase().replace(/\s+/g,' ');
const identity=(s:EvidenceSource):string=>{
  if(s.doi){
    const d=s.doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/^doi:/,'');
    if(/^10\.\d{4,9}\/\S+/.test(d))return 'doi:'+d;
  }
  try{
    const u=new URL(s.url);
    if(u.protocol!=='https:')return '';
    u.hash='';
    // Tracking query strings are not measurement identity and should not
    // count the same publisher page as independent evidence.
    for(const key of [...u.searchParams.keys()])if(/^(utm_|fbclid$|gclid$|ref$)/i.test(key))u.searchParams.delete(key);
    u.hostname=u.hostname.toLowerCase().replace(/^www\./,'');
    u.pathname=u.pathname.replace(/\/+$/,'')||'/';
    return 'url:'+u.toString().replace(/\/$/,'');
  }catch{return ''}
};
const declaredKind=(s:EvidenceSource):MeshSourceReview['kind']=>
  s.evidenceKind==='PRIMARY_PUBLIC_DOCUMENT'?'PRIMARY_PUBLIC_DOCUMENT':
  s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'PLATFORM_PUBLIC_EXCERPT':'SCHOLARLY_ABSTRACT';
/** Pure source-review function; callers supply decision time for reproducibility. */
export function assessEvidenceMesh(
  provided:readonly EvidenceSource[],decisionAsOf:string,
):EvidenceMeshAssurance{
  const asOfMs=Date.parse(decisionAsOf);
  if(!Number.isFinite(asOfMs)||!/([Zz]|[+-]\d\d:\d\d)$/.test(decisionAsOf))
    throw new Error('A decision-as-of timestamp with time zone is required for evidence review.');
  const src=provided.slice(0,32);
  const issues:MeshIssue[]=[];
  const add=(code:MeshIssue['code'],severity:MeshIssue['severity'],sourceIds:string[],explanation:string,nextCheck:string)=>{
    if(sourceIds.length)issues.push({code,severity,sourceIds:[...new Set(sourceIds)],explanation,nextCheck});
  };
  if(provided.length>src.length)add('RECORDS_TRUNCATED','HOLD_INFERENCE',provided.slice(src.length).map(s=>s.id),
    'Source review exceeded its 32-record bound; not all source claims were examined.','Narrow the decision or partition the review with traceable source batches.');
  const seenIds=new Set<string>();
  const indexes=new Map<string,string[]>();
  const excerptIndexes=new Map<string,string[]>();
  const unknownOrigins:string[]=[];
  const noTime:string[]=[];
  const future:string[]=[];
  const noPeriod:string[]=[];
  const noGeo:string[]=[];
  const periods=new Map<string,string[]>();
  const geos=new Map<string,string[]>();
  const reviews:MeshSourceReview[]=[];
  for(const s of src){
    const label=String(s.id||'').trim();
    const key=identity(s);
    if(!label||seenIds.has(label)||!key)unknownOrigins.push(label||'(unidentified)');
    if(label)seenIds.add(label);
    if(key)indexes.set(key,[...(indexes.get(key)||[]),label]);
    const excerpt=normalize(s.abstract||'');
    // Same excerpt reproduced under a second URL is an association to review,
    // not proof of plagiarism or common measurements.
    if(excerpt.length>=80)excerptIndexes.set(excerpt,[...(excerptIndexes.get(excerpt)||[]),label]);
    const retrievedAt=s.retrievedAt||null;
    const t=retrievedAt?Date.parse(retrievedAt):NaN;
    const valid=Number.isFinite(t)&&!!retrievedAt&&/([Zz]|[+-]\d\d:\d\d)$/.test(retrievedAt);
    if(!valid)noTime.push(label);
    else if(t>asOfMs)future.push(label);
    const period=s.referencePeriod?.trim()||null;
    if(!period)noPeriod.push(label);
    else periods.set(normalize(period),[...(periods.get(normalize(period))||[]),label]);
    const geo=s.geography?.trim()||null;
    if(!geo)noGeo.push(label);
    else geos.set(normalize(geo),[...(geos.get(normalize(geo))||[]),label]);
    reviews.push({
      id:label,kind:declaredKind(s),origin:key||'UNVERIFIED_ORIGIN',
      declaredScope:geo,referencePeriod:period,
      retrievalTime:valid?new Date(t).toISOString():null,
      retrievalState:!valid?'UNKNOWN':t>asOfMs?'AFTER_DECISION_TIME':'RETRIEVED_BY_DECISION_TIME',
      instrumentValidation:'NOT_ESTABLISHED',claimVerification:'NOT_PERFORMED'
    });
  }
  add('SOURCE_METADATA_MISSING','REVIEW',unknownOrigins,'A URL/DOI or unique record identifier is absent or duplicated.','Inspect primary URLs and record IDs; do not count unknown lineage as corroboration.');
  const repeats=[...indexes.values()].filter(x=>x.length>1);
  for(const group of repeats)add('DUPLICATED_SOURCE_REFERENCE','HOLD_INFERENCE',group,
    'More than one result points to the same declared publication or publisher URL. This is not independent confirmation.','Deduplicate source references and inspect the underlying measurement and publication.');
  for(const group of excerptIndexes.values())if(group.length>1&&!repeats.some(r=>group.every(id=>r.includes(id))))
    add('POSSIBLY_REPUBLISHED_EXCERPT','REVIEW',group,
      'Identical substantial text appears under different declared sources; shared upstream data may be present.','Trace source origin, author, study cohort and original instruments.');
  add('SOURCE_TIME_UNVERIFIED','REVIEW',noTime,
    'A source retrieval time with explicit time zone was not established. Publication year is not observation time.','Record retrieved-at and observed/published-at separately before time-sensitive inference.');
  add('FUTURE_RECEIPT','HOLD_INFERENCE',future,
    'These source records were retrieved after the chosen decision time and cannot justify that earlier decision.','Reconstruct what was knowable at the decision time without hindsight.');
  add('REFERENCE_PERIOD_UNKNOWN','REVIEW',noPeriod,
    'The underlying observation or study reference period is not declared.','Read the original methods and identify when the underlying phenomenon was measured.');
  if(periods.size>1)add('REFERENCE_PERIODS_DIFFER','REVIEW',[...periods.values()].flat(),
    'Declared reference periods differ. The sources may be complementary but are not automatically directly comparable.','Align periods, distinguish trend versus snapshot and check for structural change.');
  add('GEOGRAPHY_UNKNOWN','REVIEW',noGeo,
    'A local or target-population scope is not declared.','Check sample coverage and target population before transferring a finding.');
  if(geos.size>1)add('GEOGRAPHIES_DIFFER','REVIEW',[...geos.values()].flat(),
    'Sources cover different geographic or population scopes. This does not establish a matched comparison.','Review coordinate frames, denominators, populations and transportability assumptions.');
  return{
    schemaVersion:'dis-source-triangulation-v1',status:src.length?'SOURCE_INPUT_REVIEW_REQUIRED':'NO_SOURCES',
    decisionAsOf:new Date(asOfMs).toISOString(),sourceRecordCount:provided.length,reviewedRecordCount:src.length,
    sources:reviews,issues,repeatedReferenceGroups:repeats,
    independentlyVerifiedSourceCount:0,samePhenomenonVerified:false,
    geospatialTemporalAlignmentVerified:false,numericalPoolingAuthorized:false,actionAuthorized:false,
    independentEvidenceConclusion:'NOT_ESTABLISHED',
    operatingRule:'Do not conflate the number of URLs, reports, disciplines, instruments or personas with independent observations. Source excerpts are not validated measurements. Preserve origin, construct, scope, units, observed/published/retrieved/decision time, dependence, uncertainty and human authority. Fit-for-purpose instrument selection and any numerical fusion require separate evidence.',
    nextDecision:'Inspect original sources, identify the phenomenon and appropriate instruments, reconcile the distinct evidence/time/geographic scopes, and assign a human owner to review goals, consequences, alternatives and the day-after-success plan.'
  };
}
