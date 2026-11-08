import {NextResponse} from "next/server";
import {readBoundedJsonRequest,jsonRequestStatus} from "../../../lib/bounded-json-request";
import {dispatch,err} from "./dispatch";
export const runtime="nodejs";
export async function POST(request:Request){
 let body:any;try{body=await readBoundedJsonRequest(request,12000)}catch(e){const status=jsonRequestStatus(e);return NextResponse.json(err(null,status===413?-32600:-32700,status===413?"Payload too large":"Parse error"),{status});}
 const response=await dispatch(body);
 if(response===null)return new Response(null,{status:202});
 return NextResponse.json(response,{headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}
export async function GET(){return new Response("MCP stream is not offered; submit JSON-RPC requests via POST.",{status:405,headers:{allow:"POST","content-type":"text/plain"}})}
