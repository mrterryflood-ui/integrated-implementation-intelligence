import {publicPlan} from '../../../lib/ecosystem/planner';
import {ContractError} from '../../../lib/ecosystem/contracts';
import {NextResponse} from "next/server";
import {MEMBERS} from "../../../lib/council";
import {assemble} from "../../../lib/council-assembly";
import {sanitizeIntake} from "../../../lib/consultation";
import {buildPackage} from "../../../lib/consultation-package";
import {FEDERAL_REGISTRY} from "../../../lib/federal-sources";
export const runtime="nodejs";
const toolList=[
 {name:'dis_ecosystem_plan',description:'Plan the relevant owned-platform contributions for a stakeholder question, show technical gaps and ask at most one geographic clarification. No network calls, private data access or execution.',annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:'object',properties:{problem:{type:'string',minLength:8,maxLength:1200},audience:{type:'string',maxLength:180},geography:{type:'object'},domains:{type:'array',items:{type:'string'},maxItems:14}},required:['problem'],additionalProperties:false}},
 {name:"dis_consultation_plan",description:"Create a preliminary DIS consultation plan with draft artifact titles, questions and verified-versus-unknown status. Does NOT save user data, browse private accounts or make any external commitment.",annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:"object",properties:{problem:{type:"string",description:"The question or problem to address, 8-1200 characters"},organization:{type:"string"},audience:{type:"string"},stage:{type:"string"},geography:{type:"string"},mode:{type:"string",enum:["startup","general"]}},required:["problem"],additionalProperties:false}},
 {name:"dis_select_council",description:"Assemble educational intellectual lenses by topic, with an optional separately selected red team. This is NOT actual human expert participation or a finished AI deliberation.",annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:"object",properties:{question:{type:"string",minLength:5,maxLength:600},count:{type:"integer",minimum:2,maximum:12},redCount:{type:"integer",minimum:2,maximum:12},selectedIds:{type:"array",items:{type:"string"},maxItems:12}},required:["question"],additionalProperties:false}},
 {name:"dis_available_sources",description:"List official federal evidence repositories and their intended uses, with provenance and source-verification limitations.",annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:"object",properties:{topic:{type:"string",maxLength:100}},additionalProperties:false}},
 {name:"dis_handoff_template",description:"Return structured fields for carrying a user-approved consultation and evidence bundle from ChatGPT to dynamicintel.io. No private account access or saving is performed.",annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:"object",properties:{mode:{type:"string",enum:["startup","general"]}},additionalProperties:false}}
];
const rpc=(id:unknown,result:unknown)=>({jsonrpc:"2.0",id,result});
const err=(id:unknown,code:number,message:string)=>({jsonrpc:"2.0",id,error:{code,message}});
export async function dispatch(body:any){
 const id=body?.id??null;
 if(!body||body.jsonrpc!=="2.0"||typeof body.method!=="string")return err(id,-32600,"Invalid Request");
 if(body.method==="initialize")return rpc(id,{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},serverInfo:{name:"dynamic-intelligence-public",version:"0.3.0"}});
 if(body.method==="notifications/initialized")return null;
 if(body.method==="ping")return rpc(id,{});
 if(body.method==="tools/list")return rpc(id,{tools:toolList});
 if(body.method!=="tools/call")return err(id,-32601,"Method not found");
 const name=body.params?.name,args=body.params?.arguments||{},schema=toolList.find(t=>t.name===name)?.inputSchema;
 if(!schema||!args||typeof args!=="object"||Array.isArray(args))return err(id,-32602,"Unknown tool or invalid arguments");
 if(Object.keys(args).some(k=>!(k in schema.properties)))return err(id,-32602,"Unsupported argument");
 for(const [key,value] of Object.entries(args)){
  const spec=(schema.properties as Record<string,any>)[key];
  if(spec.type==="string"&&(typeof value!=="string"||value.length>1200||(spec.minLength&&value.length<spec.minLength)||(spec.maxLength&&value.length>spec.maxLength)||(spec.enum&&!spec.enum.includes(value))))return err(id,-32602,"Invalid argument "+key);
  if(spec.type==="integer"&&(!Number.isInteger(value)||Number(value)<spec.minimum||Number(value)>spec.maximum))return err(id,-32602,"Invalid argument "+key);
  if(spec.type==="array"&&(!Array.isArray(value)||value.length>spec.maxItems||value.some(x=>typeof x!=="string")))return err(id,-32602,"Invalid argument "+key);
 }
 if(schema.required?.some(key=>!(key in args)))return err(id,-32602,"Required argument missing");
 let answer:unknown;
 if(name==='dis_ecosystem_plan'){
  try{answer=publicPlan({...args,externalConsent:false})}catch(e){return err(id,-32602,e instanceof ContractError?e.message:'Invalid engagement');}
 }else if(name==="dis_consultation_plan"){
  const problem=(args.problem||"").trim();
  if(problem.length<8)return err(id,-32602,"The problem must be at least eight characters");
  const intake=sanitizeIntake({mission:problem,organization:args.organization||"",audience:args.audience||"",stage:args.stage||"",geography:args.geography||""});
  const pkg=buildPackage(intake,args.mode==="general"?"general":"startup");
  answer={state:"WORKING_DRAFT",organization:intake.organization||null,consultation:"Consultation → Evidence → Challenge → Design → Delivery",documents:pkg.documents.map(d=>({id:d.id,title:d.title,validation:d.validation})),slides:pkg.slides.map(s=>({id:s.id,title:s.title})),unresolved:pkg.quality.knownGaps,portal:"https://dynamicintel.io/#consult",warning:"No research, external source verification, investor match, or multi-agent deliberation has occurred in this tool."};
 }else if(name==="dis_select_council"){
  const roster=assemble({prompt:args.question,count:args.count||6,redCount:args.redCount||4,selected:args.selectedIds||[],primaryMode:Array.isArray(args.selectedIds)&&args.selectedIds.length?"manual":"auto"});
  answer={primary:roster.primary.map(m=>({name:m.name,field:m.domain,approach:roster.reasons[m.id]})),challenge:roster.red.map(m=>({name:m.name,field:m.domain,approach:roster.reasons[m.id]})),errors:roster.errors,scope:"EDUCATIONAL_ANALYTICAL_LENSES_ONLY",source:"https://dynamicintel.io/#council"};
 }else if(name==="dis_available_sources")answer={catalog:FEDERAL_REGISTRY.map(({id,name,topic,access,classification})=>({id,name,topic,access,classification})),governance:"Public index discovery only. Access rights, data quality, freshness, compliance and claim support must be verified per record.",portal:"https://dynamicintel.io/#consult"};
 else answer={schemaVersion:"dis-handoff-v1",mode:args.mode==="general"?"general":"startup",fields:["mission","organization","audience","stage","alternatives","traction","resources","geography","desiredOutcome"],evidenceFormat:{source:"official URL",retrievedAt:"ISO datetime",claim:"specific assertion",passage:"verified source excerpt",status:"VERIFIED | UNVERIFIED | CONFLICTED"},instructions:"User should review any transferred content. Import into a private DIS workspace only through the site's own verified identity and explicit permission. No ChatGPT plugin credentials are transferred automatically.",site:"https://dynamicintel.io/"};
 return rpc(id,{content:[{type:"text",text:JSON.stringify(answer)}],isError:false});
}
export async function POST(request:Request){
 if(Number(request.headers.get("content-length")||0)>12000)return NextResponse.json(err(null,-32600,"Payload too large"),{status:413});
 let body:any;try{body=await request.json()}catch{return NextResponse.json(err(null,-32700,"Parse error"))}
 const response=await dispatch(body);
 if(response===null)return new Response(null,{status:202});
 return NextResponse.json(response,{headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}
export async function GET(){return new Response("MCP stream is not offered; submit JSON-RPC requests via POST.",{status:405,headers:{allow:"POST","content-type":"text/plain"}})}
