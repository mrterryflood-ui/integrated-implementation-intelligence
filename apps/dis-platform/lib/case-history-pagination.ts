/** Bounded read transport only. Stored case/event JSON is never shortened or changed. */
export const CASE_HISTORY_MAX_RESPONSE_BYTES=3*1024*1024;
export const CASE_HISTORY_LIMIT=250;
/** Covers the complete outer JSON, cursor and coverage metadata before DB payload selection. */
export const CASE_HISTORY_ENVELOPE_RESERVE_BYTES=16*1024;
export const CASE_HISTORY_DB_PAYLOAD_BYTES=CASE_HISTORY_MAX_RESPONSE_BYTES-CASE_HISTORY_ENVELOPE_RESERVE_BYTES;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const EXACT_UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

export type CaseHistoryCursor={v:1;caseId:string;createdAt:string;id:string};
export type CaseHistoryDatabaseEvent={id:string;created_at:string;event_bytes:number|string;event_json:string|null};
export type CaseHistoryDatabasePage={case_json:string|null;case_json_bytes:number|string;case_version:number;history_rows:CaseHistoryDatabaseEvent[]};
export type CaseHistoryPageInfo={
 hasMore:boolean;nextCursor:string|null;incompleteCoverage:boolean;isFirstPage:boolean;
 returnedCount:number;limit:number;order:"created_at_desc_id_desc";maxResponseBytes:number;caseVersion:number;
};

export class CaseHistoryReadError extends Error{
 constructor(readonly status:400|413|503,readonly code:string,message:string,readonly gap?:Record<string,unknown>){super(message);this.name="CaseHistoryReadError";}
 responseBody(){return {
  error:this.message,code:this.code,
  ...(this.gap?{historyPage:{hasMore:this.gap.recordKind==="HISTORY_EVENT"?true:null,nextCursor:null,incompleteCoverage:true,blocked:true,maxResponseBytes:CASE_HISTORY_MAX_RESPONSE_BYTES},gap:this.gap}:{}),
 };}
}
const invalidSource=()=>new CaseHistoryReadError(503,"CASE_HISTORY_SOURCE_INVALID","Stored case history could not be read consistently; coverage remains unverified.");
function validTimestamp(value:unknown):value is string{
 if(typeof value!=="string"||!EXACT_UTC.test(value)||value.startsWith("0000-"))return false;
 const parsed=new Date(value);
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,19)===value.slice(0,19);
}
/** Opaque navigation state, not an authorization credential. Access remains enforced by RLS. */
export function encodeCaseHistoryCursor(value:Omit<CaseHistoryCursor,"v">):string{
 if(!UUID.test(value.caseId)||!UUID.test(value.id)||!validTimestamp(value.createdAt))throw invalidSource();
 return Buffer.from(JSON.stringify({v:1,caseId:value.caseId.toLowerCase(),createdAt:value.createdAt,id:value.id.toLowerCase()})).toString("base64url");
}
export function decodeCaseHistoryCursor(token:string|null,caseId:string):CaseHistoryCursor|null{
 if(token===null)return null;
 const bad=()=>new CaseHistoryReadError(400,"INVALID_HISTORY_CURSOR","Invalid history cursor for this case. Reload the first history page.");
 if(!token||token.length>512||!/^[A-Za-z0-9_-]+$/.test(token))throw bad();
 try{
  const bytes=Buffer.from(token,"base64url");
  if(bytes.toString("base64url")!==token)throw bad();
  const value:unknown=JSON.parse(bytes.toString("utf8"));
  if(!value||typeof value!=="object"||Array.isArray(value))throw bad();
  const c=value as Record<string,unknown>;
  if(Object.keys(c).sort().join(",")!=="caseId,createdAt,id,v"||c.v!==1||typeof c.caseId!=="string"||!UUID.test(c.caseId)||c.caseId.toLowerCase()!==caseId.toLowerCase()||typeof c.id!=="string"||!UUID.test(c.id)||!validTimestamp(c.createdAt))throw bad();
  return {v:1,caseId:c.caseId.toLowerCase(),createdAt:c.createdAt,id:c.id.toLowerCase()};
 }catch(e){if(e instanceof CaseHistoryReadError)throw e;throw bad();}
}
function capacityError(caseId:string,recordKind:"CASE"|"HISTORY_EVENT",requiredBytes:number,event?:CaseHistoryDatabaseEvent):CaseHistoryReadError{
 return new CaseHistoryReadError(413,"CASE_HISTORY_READ_CAPACITY_EXCEEDED",
  "Stored evidence cannot fit this bounded read page. No stored payload was changed or truncated; a complete retrieval requires case-owner and platform-maintainer review.",
  {state:"REVIEW_REQUIRED",recordKind,caseId,requiredRecordBytes:requiredBytes,ownerRole:"Case owner and platform maintainer",assignmentStatus:"NEEDS_DESIGNATION",...(event?{eventId:event.id,createdAt:event.created_at}:{}),continuationBlocked:true});
}
function positiveBytes(value:number|string):number{
 const bytes=Number(value);
 if(!Number.isSafeInteger(bytes)||bytes<0)throw invalidSource();
 return bytes;
}
function objectJSON(raw:string):Record<string,unknown>{
 try{const value:unknown=JSON.parse(raw);if(value&&typeof value==="object"&&!Array.isArray(value))return value as Record<string,unknown>;}catch{}
 throw invalidSource();
}
function strictlyOlder(a:CaseHistoryDatabaseEvent,b:CaseHistoryDatabaseEvent):boolean{
 return a.created_at<b.created_at||(a.created_at===b.created_at&&a.id.toLowerCase()<b.id.toLowerCase());
}

/**
 * Use the DB's original JSON text rather than parsing/re-stringifying payloads:
 * its measured UTF-8 representation (including numeric precision) is preserved.
 * The final complete envelope is measured again, independently of the DB budget.
 */
export function buildCaseHistoryPageBody(input:CaseHistoryDatabasePage,caseId:string,before:CaseHistoryCursor|null=null,maxResponseBytes=CASE_HISTORY_MAX_RESPONSE_BYTES):{body:string;historyPage:CaseHistoryPageInfo}{
 if(!UUID.test(caseId)||!Number.isSafeInteger(maxResponseBytes)||maxResponseBytes<512||maxResponseBytes>CASE_HISTORY_MAX_RESPONSE_BYTES)throw invalidSource();
 if(before&&before.caseId!==caseId.toLowerCase())throw invalidSource();
 const caseBytes=positiveBytes(input.case_json_bytes);
 if(typeof input.case_json!=="string"){
  if(caseBytes>CASE_HISTORY_DB_PAYLOAD_BYTES)throw capacityError(caseId,"CASE",caseBytes);
  throw invalidSource();
 }
 if(caseBytes!==Buffer.byteLength(input.case_json,"utf8"))throw invalidSource();
 if(caseBytes>maxResponseBytes)throw capacityError(caseId,"CASE",caseBytes);
 const record=objectJSON(input.case_json);
 if(typeof record.id!=="string"||record.id.toLowerCase()!==caseId.toLowerCase()||!Number.isSafeInteger(input.case_version)||input.case_version<1||record.version!==input.case_version||!Array.isArray(input.history_rows)||input.history_rows.length>CASE_HISTORY_LIMIT+1)throw invalidSource();
 const rows=input.history_rows;
 let previous:CaseHistoryDatabaseEvent|undefined;
 let payloadBlocked=false;
 for(const row of rows){
  if(!row||!UUID.test(row.id)||!validTimestamp(row.created_at))throw invalidSource();
  positiveBytes(row.event_bytes);
  if(previous&&!strictlyOlder(row,previous))throw invalidSource();
  if(before&&!strictlyOlder(row,{id:before.id,created_at:before.createdAt,event_bytes:0,event_json:null}))throw invalidSource();
  if(row.event_json===null)payloadBlocked=true;
  else if(typeof row.event_json!=="string"||payloadBlocked)throw invalidSource();
  previous=row;
 }
 const selected:CaseHistoryDatabaseEvent[]=[],rawEvents:string[]=[];
 const pageInfo=(count:number):CaseHistoryPageInfo=>{
  const hasMore=count<rows.length,last=selected[count-1];
  return {hasMore,nextCursor:hasMore&&last?encodeCaseHistoryCursor({caseId,createdAt:last.created_at,id:last.id}):null,
   incompleteCoverage:before!==null||hasMore,isFirstPage:before===null,returnedCount:count,limit:CASE_HISTORY_LIMIT,
   order:"created_at_desc_id_desc",maxResponseBytes,caseVersion:input.case_version};
 };
 const envelope=(history:string[],info:CaseHistoryPageInfo)=>`{"case":${input.case_json},"history":[${history.join(",")}],"historyLimit":${CASE_HISTORY_LIMIT},"historyPage":${JSON.stringify(info)}}`;
 if(Buffer.byteLength(envelope([],pageInfo(0)),"utf8")>maxResponseBytes)throw capacityError(caseId,"CASE",caseBytes);
 let eventBytes=0;
 for(const row of rows){
  if(row.event_json===null||selected.length===CASE_HISTORY_LIMIT)break;
  const bytes=Buffer.byteLength(row.event_json,"utf8");
  if(bytes!==positiveBytes(row.event_bytes))throw invalidSource();
  if(bytes>maxResponseBytes){if(!selected.length)throw capacityError(caseId,"HISTORY_EVENT",bytes,row);break;}
  const event=objectJSON(row.event_json);
  if(event.id!==row.id||event.created_at!==row.created_at||typeof event.event_type!=="string"||!Object.prototype.hasOwnProperty.call(event,"payload"))throw invalidSource();
  selected.push(row);
  const info=pageInfo(selected.length),outerBytes=Buffer.byteLength(envelope([],info),"utf8");
  if(outerBytes+eventBytes+bytes+Math.max(0,selected.length-1)>maxResponseBytes){selected.pop();break;}
  rawEvents.push(row.event_json);eventBytes+=bytes;
 }
 if(!selected.length&&rows.length)throw capacityError(caseId,"HISTORY_EVENT",positiveBytes(rows[0].event_bytes),rows[0]);
 const historyPage=pageInfo(selected.length),body=envelope(rawEvents,historyPage);
 if(Buffer.byteLength(body,"utf8")>maxResponseBytes)throw invalidSource();
 return {body,historyPage};
}

/**
 * Parameters: case UUID, exact UTC cursor timestamp/null, cursor UUID/null,
 * pre-payload byte budget, row limit. Subject-scoped RLS/set_config is supplied
 * by the route in the SAME transaction. No writes, payload shrinking or skips.
 * A single statement gives the case and ordered history one MVCC snapshot.
 */
export const CASE_HISTORY_PAGE_SQL=`
WITH case_record AS MATERIALIZED (
 SELECT c.id,c.workspace_id,c.title,c.question,c.report,c.playbook,c.version,c.status,
  to_char(c.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at,
  to_char(c.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at
 FROM dis_casework c WHERE c.id=$1::uuid LIMIT 1
), case_json AS MATERIALIZED (
 SELECT row_to_json(c)::text AS body,c.version FROM case_record c
), case_budget AS MATERIALIZED (
 SELECT body,version,octet_length(convert_to(body,'UTF8')) AS case_bytes,
  $4::bigint-octet_length(convert_to(body,'UTF8')) AS remaining_bytes FROM case_json
), candidate_keys AS MATERIALIZED (
 SELECT e.id,e.created_at FROM dis_case_events e CROSS JOIN case_budget b
 WHERE e.case_id=$1::uuid AND b.case_bytes<=$4::bigint
  AND ($2::timestamptz IS NULL OR (e.created_at,e.id)<($2::timestamptz,$3::uuid))
 ORDER BY e.created_at DESC,e.id DESC LIMIT ($5::int+1)
), event_json AS MATERIALIZED (
 SELECT k.id,k.created_at,
  jsonb_build_object('id',e.id,'event_type',e.event_type,'payload',e.payload,
   'created_at',to_char(e.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))::text AS body
 FROM candidate_keys k JOIN dis_case_events e ON e.id=k.id AND e.case_id=$1::uuid
), ranked AS MATERIALIZED (
 SELECT id,created_at,body,octet_length(convert_to(body,'UTF8')) AS event_bytes,
  row_number() OVER (ORDER BY created_at DESC,id DESC) AS ordinal,
  sum(octet_length(convert_to(body,'UTF8'))::bigint+1) OVER (ORDER BY created_at DESC,id DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS prefix_bytes
 FROM event_json
), history_page AS (
 SELECT jsonb_agg(jsonb_build_object('id',r.id,
  'created_at',to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
  'event_bytes',r.event_bytes,
  'event_json',CASE WHEN r.ordinal<=$5::int AND r.prefix_bytes<=b.remaining_bytes THEN r.body ELSE NULL END)
  ORDER BY r.created_at DESC,r.id DESC) AS rows
 FROM ranked r CROSS JOIN case_budget b
)
SELECT CASE WHEN b.case_bytes<=$4::bigint THEN b.body ELSE NULL END AS case_json,
 b.case_bytes AS case_json_bytes,b.version AS case_version,
 COALESCE((SELECT rows FROM history_page),'[]'::jsonb) AS history_rows
FROM case_budget b`;
