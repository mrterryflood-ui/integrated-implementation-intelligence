import {validatePlaybook} from "./decision-playbook";
/** Bounded authenticated case transport, not a database durability claim. */
export const CASE_PLAYBOOK_MAX_CHARS=250000;
/** Stored JSONB has canonical spacing and UTF-8 bytes unlike compact JS JSON.
 * Keep the existing recovery allowance separate from the submitted size limit. */
export const CASE_PLAYBOOK_MAX_DB_BYTES=CASE_PLAYBOOK_MAX_CHARS*4;
/** Full research provenance plus the existing bounded investigation notes.
 * Shared by create, recheck and client preflight; transport remains 1 MiB. */
export const CASE_REPORT_MAX_CHARS=128000;
/** Stored JSONB expands whitespace and encodes Unicode as UTF-8. This bounded
 * read allowance is separate from (and does not raise) compact admission. */
export const CASE_REPORT_MAX_DB_BYTES=CASE_REPORT_MAX_CHARS*4;
export const CASE_REQUEST_MAX_BYTES=1048576;
export class CasePayloadError extends Error{constructor(message:string,readonly status:400|413){super(message);this.name="CasePayloadError";}}
export function serializeCaseReport(value:unknown):string{
 if(!value||typeof value!=="object"||Array.isArray(value))throw new CasePayloadError("Case report object required",400);
 const body=JSON.stringify(value);
 if(body.length>CASE_REPORT_MAX_CHARS)throw new CasePayloadError("Complete case report exceeds the bounded 128,000-character capacity; nothing saved or truncated. Split into linked review cases.",413);
 return body;
}
export function serializeCasePlaybook(value:unknown):string{
 if(!validatePlaybook(value))throw new CasePayloadError("Invalid case playbook",400);
 const body=JSON.stringify(value);
 if(body.length>CASE_PLAYBOOK_MAX_CHARS)throw new CasePayloadError("Case evidence exceeds the bounded update capacity. Split the investigation into linked cases; no content was discarded.",413);
 return body;
}
/** Enforce actual bytes, including chunked bodies with no Content-Length. */
export async function readBoundedCaseJson(request:Request):Promise<Record<string,unknown>>{
 const declared=Number(request.headers.get("content-length")||0);
 if(Number.isFinite(declared)&&declared>CASE_REQUEST_MAX_BYTES)throw new CasePayloadError("Case request exceeds transport capacity",413);
 if(!request.body)throw new CasePayloadError("Case JSON body required",400);
 const reader=request.body.getReader(),decoder=new TextDecoder("utf-8",{fatal:true});let bytes=0,text="";
 try{
  while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
   if(bytes>CASE_REQUEST_MAX_BYTES){await reader.cancel();throw new CasePayloadError("Case request exceeds transport capacity",413);}
   text+=decoder.decode(value,{stream:true});
  }
  text+=decoder.decode();const parsed:unknown=JSON.parse(text);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new CasePayloadError("Case JSON object required",400);
  return parsed as Record<string,unknown>;
 }catch(e){if(e instanceof CasePayloadError)throw e;throw new CasePayloadError("Invalid case JSON",400);}
 finally{reader.releaseLock();}
}
