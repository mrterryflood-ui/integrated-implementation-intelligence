import {investigateMethod,type Inquiry} from './dis-inquire';
import {researchPlanningDigest} from './research-planning-handoff';

/** Additive public metadata adapter. Original inquiry rules remain authoritative. */
export const RESEARCH_PROTOCOL_REVIEW_VERSION='dis.research-protocol-review.v1';
type Schema={
 type:'string'|'boolean'|'object'|'array'|readonly ['string','null'];
 properties?:Record<string,Schema>;required?:readonly string[];additionalProperties?:false;
 items?:Schema;maxItems?:number;minLength?:number;maxLength?:number;
 enum?:readonly string[];pattern?:string;
};
const text=(maxLength:number,minLength=0):Schema=>({type:'string',minLength,maxLength});
const texts=(maxItems=12,maxLength=400):Schema=>({type:'array',maxItems,items:text(maxLength)});
const object=(properties:Record<string,Schema>,required=Object.keys(properties)):Schema=>({type:'object',properties,required,additionalProperties:false});
const nullable=(maxLength:number):Schema=>({type:['string','null'],maxLength});
const id:Schema={...text(160,1),pattern:'^[A-Za-z0-9_.:@/-]+$'};
const digest:Schema={...text(64,64),pattern:'^[a-f0-9]{64}$'};
const hypothesis=object({
 id,explanation:text(1000),predictedObservations:texts(),disconfirmingObservations:texts(),alternativesConsidered:texts(),
 proposedExclusion:object({status:{type:'string',enum:['NOT_EXCLUDED','EXCLUDE_IN_DEFINED_SCOPE']},
  evidenceIds:texts(20,160),distinguishingObservation:text(1000),applicableScope:text(600),limitations:texts()})
},['id','explanation','predictedObservations','disconfirmingObservations','alternativesConsidered']);
const instrument=object({
 id,name:text(200),construct:text(600),unit:text(120),intendedScope:text(600),limitation:text(1000),
 sourceId:text(300),originalLineage:text(300),
 kind:{type:'string',enum:['MEASUREMENT','STUDY_REPORT','MODEL_OUTPUT','EXPERIENCE','SCENARIO','PERSONA_PROMPT']},
 observedAt:nullable(80),retrievedAt:nullable(80),validationEvidence:nullable(1000),fitForUseJustification:nullable(1000)
});
const evidence=object({
 id,claim:text(1200),kind:{type:'string',enum:['DESCRIPTIVE','MECHANISTIC','ASSOCIATIONAL','PREDICTIVE','CAUSAL','INTERVENTION_EFFECT']},
 instrumentIds:texts(20,160),targetOutcome:text(600),referencePopulation:text(600),
 comparison:nullable(1000),causalIdentification:nullable(1000),targetBenefitMeasured:{type:'boolean'},
 uncertaintyReported:{type:'boolean'},externalValidation:nullable(1000)
},['id','claim','kind','instrumentIds','targetOutcome','referencePopulation']);

export const RESEARCH_PROTOCOL_REVIEW_INPUT_SCHEMA=object({
 binding:object({runId:id,workflowId:id,protocolId:id,protocolVersion:text(80,1),protocolSha256:digest,sourceReceiptSha256:digest}),
 sourceClass:{type:'string',enum:['public_source']},
 inquiry:object({
  id,decisionAsOf:text(80),question:text(1200,8),intendedUse:text(600),decisionOwner:text(160),
  targetPopulation:text(600),targetOutcome:text(600),systemContext:text(1200),
  searchFrame:object({phenomenon:text(1000),constructsToDistinguish:texts(),discriminatingObservation:text(1000),
   scopeAndBoundaries:text(600),unresolvedPossibilities:texts()}),
  hypotheses:{type:'array',items:hypothesis,maxItems:12},
  instruments:{type:'array',items:instrument,maxItems:20},
  evidence:{type:'array',items:evidence,maxItems:20},
  proposedDecision:object({action:text(1000),options:texts(),currentPracticeComparator:nullable(1000),potentialHarms:texts(),
   measureOfSuccess:nullable(600),futureOwner:nullable(160),reviewOrStopTrigger:nullable(600)})
 },['id','decisionAsOf','question','intendedUse','decisionOwner','targetPopulation','targetOutcome','systemContext','hypotheses','instruments','evidence'])
});

export type ResearchReviewBinding={
 runId:string;workflowId:string;protocolId:string;protocolVersion:string;protocolSha256:string;sourceReceiptSha256:string;
};
export type ResearchProtocolReviewInput={binding:ResearchReviewBinding;sourceClass:'public_source';inquiry:Inquiry};
export class ResearchProtocolReviewError extends Error {
 constructor(message:string){super(message);this.name='ResearchProtocolReviewError';}
}
function validate(value:unknown,schema:Schema,path:string):void{
 const fail=()=>{throw new ResearchProtocolReviewError('Invalid research review field: '+path);};
 if(Array.isArray(schema.type)){
  if(value===null)return;
  if(typeof value!=='string'||value.length>(schema.maxLength??Infinity))fail();
  return;
 }
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value))fail();
  const data=value as Record<string,unknown>,properties=schema.properties!;
  if(Object.keys(data).some(key=>!Object.hasOwn(properties,key)))fail();
  if(schema.required?.some(key=>!Object.hasOwn(data,key)))fail();
  for(const [key,item] of Object.entries(data))validate(item,properties[key],path+'.'+key);
 }else if(schema.type==='array'){
  if(!Array.isArray(value)||value.length>(schema.maxItems??0))fail();
  (value as unknown[]).forEach((item,index)=>validate(item,schema.items!,path+'['+index+']'));
 }else if(schema.type==='boolean'){
  if(typeof value!=='boolean')fail();
 }else{
  if(typeof value!=='string')fail();
  const s=value as string;
  if(s.length<(schema.minLength??0)||s.length>(schema.maxLength??Infinity)||
     ((schema.minLength??0)>0&&!s.trim())||
     (schema.enum&&!schema.enum.includes(s))||
     (schema.pattern&&!new RegExp(schema.pattern).test(s)))fail();
 }
}

export function reviewResearchProtocol(raw:unknown,now:()=>Date=()=>new Date()){
 // Dispatch is also directly consumed in tests; retain the registered route's
 // bound here rather than trusting caller-declared Content-Length.
 let bytes:number;
 try{bytes=Buffer.byteLength(JSON.stringify(raw),'utf8');}catch{throw new ResearchProtocolReviewError('Research review requires finite JSON metadata');}
 if(bytes>12000)throw new ResearchProtocolReviewError('Research review metadata exceeds 12000 bytes');
 validate(raw,RESEARCH_PROTOCOL_REVIEW_INPUT_SCHEMA,'request');
 const input=raw as ResearchProtocolReviewInput;
 if(input.inquiry.id!==input.binding.runId)throw new ResearchProtocolReviewError('Inquiry identity does not match the retained run');
 for(const records of [input.inquiry.hypotheses,input.inquiry.instruments,input.inquiry.evidence]){
  if(new Set(records.map(record=>record.id)).size!==records.length)throw new ResearchProtocolReviewError('Research review record identifiers must be unique');
 }
 const assessment=investigateMethod(input.inquiry);
 const contents={
  schemaVersion:RESEARCH_PROTOCOL_REVIEW_VERSION,
  binding:structuredClone(input.binding),
  inquirySha256:researchPlanningDigest(input.inquiry),
  reviewedAt:now().toISOString(),
  reviewKind:'DECLARED_METADATA_METHOD_REVIEW' as const,
  assessment,
  researchContinuation:'CONTINUE_WITH_QUALIFICATIONS' as const,
  authority:{actionAuthorized:false,independentValidationEstablished:false,humanApprovalRecorded:false},
  limitations:[
   'This checks declared research metadata with the existing DIS inquiry method; source truth and full-text appraisal are not established.',
   'The caller must compare this binding with its authoritative retained run and source receipt; supplied hashes do not authenticate evidence.',
   'Method findings qualify the affected inference. They do not impose a universal stop on authorized research preparation.',
   'A software method review does not record human approval, independent scientific validation, clinical benefit or action authority.'
  ]
 };
 return {...contents,reviewSha256:researchPlanningDigest(contents)};
}
