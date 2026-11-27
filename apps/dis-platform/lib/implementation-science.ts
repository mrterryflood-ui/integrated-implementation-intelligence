/** Planning inputs, not a validated assessment or evidence of implementation. */
export const IMPLEMENTATION_SCIENCE_SCHEMA = 'dis.implementation-science.v1' as const;
export const IMPLEMENTATION_FIELD_LIMIT = 12000;
export const IMPLEMENTATION_NOTICE = 'Recorded planning input. Source references require review. A completed plan does not establish adoption, effective delivery, beneficiary benefit, or authorization to act.';

export const IMPLEMENTATION_FIELDS = [
  {id:'approach', title:'The approach', question:'What practice, service, or change are we introducing, and for whom?', hint:'Describe what people would receive or experience. Keep the approach distinct from the actions used to introduce it.'},
  {id:'approachRationale', title:'Why this approach', question:'Why should this approach address the problem here?', hint:'Record relevant evidence, alternatives, assumptions, and what would challenge the proposed explanation.'},
  {id:'setting', title:'The setting', question:'Where will this operate, and how does work happen there today?', hint:'Describe the people, site, existing workflow, and differences between the intended, operational, and experienced situation.'},
  {id:'determinants', title:'Barriers and support', question:'What could help or hinder people using and delivering the approach?', hint:'Identify barriers and facilitators, their supporting evidence, and whose perspective is missing.'},
  {id:'strategies', title:'How people will adopt it', question:'What will help people take up and use the approach?', hint:'For each strategy, identify the barrier it addresses, actor, target behavior, timing or frequency, and why it may help. Training is a strategy, not evidence of adoption.'},
  {id:'delivery', title:'How it will be delivered', question:'Who will deliver what, to whom, where, and how often?', hint:'Describe the expected delivery behavior, sequence, dose or frequency where relevant, and how it fits the existing workflow.'},
  {id:'feasibility', title:'Capacity and burden', question:'Can the people and organization carry this out?', hint:'Consider staffing, time, skills, resources, authority, full costs, access, workload, and the people who carry the burden.'},
  {id:'fidelityAdaptation', title:'What stays and what can change', question:'Which core functions must remain, and what can be adapted?', hint:'Name the core functions and how delivery will be checked. Record proposed or actual changes separately, with rationale, who authorizes them, and how effects will be reviewed.'},
  {id:'implementationOutcomes', title:'Use and delivery', question:'How will we know people adopt and deliver the approach as intended?', hint:'Choose relevant measures of adoption, acceptability, appropriateness, feasibility, fidelity, cost, or sustainment. Define who is measured, the denominator, period, source, owner, baseline, and proposed target; leave unknown baselines unknown.'},
  {id:'serviceOutcomes', title:'Results for people', question:'How will we know the service or practice benefits the people it is intended to help?', hint:'Define service and beneficiary outcomes, access, equity, burden, and unintended effects separately from implementation measures. Delivered activity alone does not establish benefit.'},
  {id:'sustainment', title:'Keeping it working', question:'Who and what will keep the approach working after initial support ends?', hint:'Identify ongoing ownership, recurring resources, maintenance, handoffs, and conditions for scaling, transfer, or retirement.'},
  {id:'reviewTriggers', title:'When to reconsider', question:'What evidence or change would prompt adaptation, a pause, or stopping?', hint:'Record review dates or conditions, the question each review will answer, the responsible role, and what action the finding could change.'},
] as const;
export type ImplementationFieldId = typeof IMPLEMENTATION_FIELDS[number]['id'];
export const IMPLEMENTATION_GROUPS: ReadonlyArray<{id:string;title:string;fields:readonly ImplementationFieldId[]}> = [
  {id:'approach',title:'Choose the approach',fields:['approach','approachRationale']},
  {id:'fit',title:'Understand the fit here',fields:['setting','determinants']},
  {id:'delivery',title:'Plan adoption and delivery',fields:['strategies','delivery','feasibility']},
  {id:'measurement',title:'Learn what is working',fields:['implementationOutcomes','serviceOutcomes']},
  {id:'adaptation',title:'Preserve and adapt',fields:['fidelityAdaptation']},
  {id:'sustainment',title:'Sustain and review',fields:['sustainment','reviewTriggers']},
];
export type ImplementationSourceReference = {
  recordId:string;
  version:number;
  digest:string;
  passage?:{startOffset:number;endOffset:number;sha256:string};
};
export type ImplementationScience = {
  schemaVersion:typeof IMPLEMENTATION_SCIENCE_SCHEMA;
  fields:Record<ImplementationFieldId,string>;
  evidenceRefs?:Partial<Record<ImplementationFieldId,ImplementationSourceReference[]>>;
};
const fieldIds = new Set<string>(IMPLEMENTATION_FIELDS.map(field=>field.id));
const object = (value:unknown):value is Record<string,unknown> => Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const onlyKeys = (value:Record<string,unknown>,allowed:readonly string[],label:string) => {
  if(Object.keys(value).some(key=>!allowed.includes(key)))throw Error('Unknown '+label+' field; no content was discarded');
};
const sha256 = /^[a-f0-9]{64}$/;
const recordId = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export function emptyImplementationScience():ImplementationScience {
  return {schemaVersion:IMPLEMENTATION_SCIENCE_SCHEMA,fields:Object.fromEntries(IMPLEMENTATION_FIELDS.map(field=>[field.id,''])) as ImplementationScience['fields']};
}

/** Syntactic binding only. The server must separately resolve current access and exact source versions. */
export function normalizeImplementationSourceReference(value:unknown):ImplementationSourceReference {
  if(!object(value))throw Error('An implementation source reference is required');
  onlyKeys(value,['recordId','version','digest','passage'],'implementation source reference');
  if(typeof value.recordId!=='string'||!recordId.test(value.recordId)||!Number.isSafeInteger(value.version)||Number(value.version)<1||typeof value.digest!=='string'||!sha256.test(value.digest))throw Error('An implementation source needs its record identifier, exact version, and SHA-256 digest');
  const reference:ImplementationSourceReference = {recordId:value.recordId,version:Number(value.version),digest:value.digest};
  if(value.passage!==undefined){
    if(!object(value.passage))throw Error('Invalid implementation passage reference');
    onlyKeys(value.passage,['startOffset','endOffset','sha256'],'implementation passage reference');
    const {startOffset,endOffset,sha256:hash}=value.passage;
    if(!Number.isSafeInteger(startOffset)||Number(startOffset)<0||!Number.isSafeInteger(endOffset)||Number(endOffset)<=Number(startOffset)||typeof hash!=='string'||!sha256.test(hash))throw Error('An implementation passage needs valid offsets and a SHA-256 digest');
    reference.passage={startOffset:Number(startOffset),endOffset:Number(endOffset),sha256:hash};
  }
  return reference;
}

export function normalizeImplementationScience(value:unknown):ImplementationScience|undefined {
  if(value===undefined)return undefined;
  if(!object(value)||value.schemaVersion!==IMPLEMENTATION_SCIENCE_SCHEMA||!object(value.fields))throw Error('Unsupported or incomplete implementation-science plan');
  onlyKeys(value,['schemaVersion','fields','evidenceRefs'],'implementation-science plan');
  if(Object.keys(value.fields).some(key=>!fieldIds.has(key)))throw Error('Unknown implementation field; no content was discarded');
  const incoming=value.fields;
  const fields=Object.fromEntries(IMPLEMENTATION_FIELDS.map(({id})=>{
    const entry=incoming[id]===undefined?'':incoming[id];
    if(typeof entry!=='string'||entry.length>IMPLEMENTATION_FIELD_LIMIT)throw Error('Invalid or oversized implementation field: '+id);
    return [id,entry.replace(/\r\n/g,'\n')];
  })) as ImplementationScience['fields'];
  const normalized:ImplementationScience={schemaVersion:IMPLEMENTATION_SCIENCE_SCHEMA,fields};
  if(value.evidenceRefs!==undefined){
    if(!object(value.evidenceRefs)||Object.keys(value.evidenceRefs).some(key=>!fieldIds.has(key)))throw Error('Invalid implementation evidence fields');
    const refs=value.evidenceRefs,evidenceRefs:ImplementationScience['evidenceRefs']={};let count=0;
    for(const {id} of IMPLEMENTATION_FIELDS){
      if(refs[id]===undefined)continue;
      if(!Array.isArray(refs[id])||refs[id].length>30)throw Error('Use at most thirty source references per implementation field');
      const entries=(refs[id] as unknown[]).map(normalizeImplementationSourceReference);
      count+=entries.length;if(count>100)throw Error('The implementation source selection exceeds one hundred references');
      if(new Set(entries.map(entry=>JSON.stringify(entry))).size!==entries.length)throw Error('Duplicate implementation source reference');
      if(entries.length)evidenceRefs[id]=entries;
    }
    if(Object.keys(evidenceRefs).length)normalized.evidenceRefs=evidenceRefs;
  }
  return normalized;
}

export function implementationEvidenceReferences(value:ImplementationScience|undefined):ImplementationSourceReference[] {
  const plan=normalizeImplementationScience(value);
  const unique=new Map<string,ImplementationSourceReference>();
  for(const refs of Object.values(plan?.evidenceRefs||{}))for(const ref of refs||[])unique.set(JSON.stringify(ref),ref);
  return [...unique.values()];
}

/** Missing-input prompts only; neither a readiness score nor a causal diagnosis. */
export function implementationReviewQuestions(value:ImplementationScience|undefined) {
  const plan=normalizeImplementationScience(value);
  return IMPLEMENTATION_FIELDS.filter(({id})=>!plan?.fields[id].trim()||plan.fields[id].trim().toUpperCase()==='UNKNOWN')
    .map(({id,question})=>({field:id,question}));
}

export function implementationSections(value:ImplementationScience|undefined) {
  const plan=normalizeImplementationScience(value);
  if(!plan)return [];
  return IMPLEMENTATION_FIELDS.map(({id,title})=>({id,title,text:plan.fields[id]||'Not supplied',evidenceRefs:plan.evidenceRefs?.[id]||[]}));
}

/** Explicit editable markers support old templates and preserve optional source metadata. */
export const IMPLEMENTATION_SCHEMA_FIELD='implementationScienceSchemaVersion';
export const IMPLEMENTATION_EVIDENCE_FIELD='implementationScienceEvidenceRefs';
export const implementationFieldMarker=(id:ImplementationFieldId)=>'implementationScience'+id[0].toUpperCase()+id.slice(1);
const markerIds=new Map(IMPLEMENTATION_FIELDS.map(({id})=>[implementationFieldMarker(id),id]));
export function isImplementationTextField(value:string){return value===IMPLEMENTATION_SCHEMA_FIELD||value===IMPLEMENTATION_EVIDENCE_FIELD||markerIds.has(value);}
export function implementationTextFields(value:ImplementationScience|undefined):Array<{id:string;title:string;text:string}> {
  const plan=normalizeImplementationScience(value);if(!plan)return [];
  return [
    {id:IMPLEMENTATION_SCHEMA_FIELD,title:'Implementation plan version',text:plan.schemaVersion},
    ...IMPLEMENTATION_FIELDS.map(({id,title})=>({id:implementationFieldMarker(id),title,text:plan.fields[id]})),
    ...(plan.evidenceRefs?[{id:IMPLEMENTATION_EVIDENCE_FIELD,title:'Source reference metadata — preserve record versions and passage locations',text:JSON.stringify(plan.evidenceRefs)}]:[]),
  ];
}
export function implementationFromTextFields(fields:Record<string,string>):ImplementationScience|undefined {
  if(!Object.keys(fields).some(isImplementationTextField))return undefined;
  if(fields[IMPLEMENTATION_SCHEMA_FIELD]!==IMPLEMENTATION_SCIENCE_SCHEMA)throw Error('The implementation plan version is missing or unsupported');
  let evidenceRefs:unknown;
  if(Object.hasOwn(fields,IMPLEMENTATION_EVIDENCE_FIELD)){
    try{evidenceRefs=JSON.parse(fields[IMPLEMENTATION_EVIDENCE_FIELD]);}catch{throw Error('Implementation source metadata is not valid JSON; inspect the original before importing');}
  }
  return normalizeImplementationScience({schemaVersion:IMPLEMENTATION_SCIENCE_SCHEMA,fields:Object.fromEntries(IMPLEMENTATION_FIELDS.map(({id})=>[id,fields[implementationFieldMarker(id)]??''])),...(evidenceRefs===undefined?{}:{evidenceRefs})});
}

export function implementationReferenceText(ref:ImplementationSourceReference){
  return `Record ${ref.recordId}, version ${ref.version}, digest ${ref.digest}`+(ref.passage?`; passage ${ref.passage.startOffset}–${ref.passage.endOffset}, digest ${ref.passage.sha256}`:'');
}
