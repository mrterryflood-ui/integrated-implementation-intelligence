import {plan} from "./improve.js";
import {retrieve} from "./ask.js";
import {inspectRepository} from "./repository.js";
const tools=[
 {name:"dis.plan",description:"Build an evidence-limited investigation plan with council lenses and assurance gates.",inputSchema:{type:"object",properties:{question:{type:"string",minLength:5,maxLength:1500},context:{type:"string",maxLength:8000},depth:{type:"string",enum:["Quick","Standard","Deep","Research"]}},required:["question"],additionalProperties:false}},
 {name:"dis.scholar_search",description:"Discover scholarly records; not a full-text citation verification service.",inputSchema:{type:"object",properties:{query:{type:"string",minLength:5,maxLength:250}},required:["query"],additionalProperties:false}},
 {name:"dis.public_repo_inspect",description:"Bounded read-only public GitHub source inspection. Findings are unconfirmed heuristics.",inputSchema:{type:"object",properties:{repository:{type:"string",maxLength:180}},required:["repository"],additionalProperties:false}}
];
export async function dispatch(message,deps={retrieve,inspectRepository}){
 if(!message||message.jsonrpc!=="2.0"||typeof message.method!=="string")return {jsonrpc:"2.0",id:message?.id??null,error:{code:-32600,message:"Invalid Request"}};
 const id=message.id??null;
 if(message.method==="initialize")return {jsonrpc:"2.0",id,result:{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},serverInfo:{name:"dis-public-research",version:"0.1.0"}}};
 if(message.method==="notifications/initialized")return null;
 if(message.method==="ping")return {jsonrpc:"2.0",id,result:{}};
 if(message.method==="tools/list")return {jsonrpc:"2.0",id,result:{tools}};
 if(message.method!=="tools/call")return {jsonrpc:"2.0",id,error:{code:-32601,message:"Method not found"}};
 const name=message.params?.name,args=message.params?.arguments||{};
 const schema=tools.find(t=>t.name===name)?.inputSchema;
 if(!schema)return {jsonrpc:"2.0",id,error:{code:-32602,message:"Unknown tool"}};
 if(Object.keys(args).some(k=>!Object.hasOwn(schema.properties,k))||schema.required.some(k=>typeof args[k]!=="string"||args[k].length<(schema.properties[k].minLength||0)||args[k].length>(schema.properties[k].maxLength||Infinity))||Object.entries(args).some(([k,v])=>typeof v!=="string"||v.length>(schema.properties[k].maxLength||Infinity)||schema.properties[k].enum&&!schema.properties[k].enum.includes(v)))return {jsonrpc:"2.0",id,error:{code:-32602,message:"Invalid parameters"}};
 try{
  let result;
  if(name==="dis.plan")result=plan(args,[]);
  if(name==="dis.scholar_search")result={...(await deps.retrieve(args.query)),note:"Metadata discovery only; no claim-level verification."};
  if(name==="dis.public_repo_inspect")result=await deps.inspectRepository(args.repository);
  return {jsonrpc:"2.0",id,result:{content:[{type:"text",text:JSON.stringify(result)}],isError:false}};
 }catch(e){return {jsonrpc:"2.0",id,result:{content:[{type:"text",text:"Tool temporarily unavailable"}],isError:true}}}
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method==="GET")return res.status(405).json({error:"MCP requests require POST"});
 if(req.method!=="POST")return res.status(405).end();
 const payload=req.body;
 if(JSON.stringify(payload||{}).length>10000)return res.status(413).json({error:"Payload too large"});
 const reply=await dispatch(payload);
 if(reply===null)return res.status(202).end();
 return res.status(200).json(reply);
}
