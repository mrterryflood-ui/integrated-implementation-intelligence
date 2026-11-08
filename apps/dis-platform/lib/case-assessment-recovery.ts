import {CASE_PLAYBOOK_MAX_DB_BYTES,CASE_REPORT_MAX_CHARS,CasePayloadError,serializeCaseReport} from "./case-payload-capacity";

/** Restore only a report already archived by this case. This is recovery, not validation. */
export const CASE_RECOVERY_MAX_REPORT_BYTES=CASE_REPORT_MAX_CHARS*4;
const maxPlaybookBytes=CASE_PLAYBOOK_MAX_DB_BYTES;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export type AssessmentRestoreRequest={id:string;version:number;eventId:string};
export class AssessmentRecoveryError extends Error{
 constructor(message:string,readonly status:400|403|409|413|503){super(message);this.name="AssessmentRecoveryError";}
}
export function validateAssessmentOrigin(request:Request):void{
 if(request.headers.get("origin")!==new URL(request.url).origin)throw new AssessmentRecoveryError("Same-origin recovery request required",403);
}
export function assessmentRestoreRequest(input:unknown):AssessmentRestoreRequest{
 if(!input||typeof input!=="object"||Array.isArray(input))throw new AssessmentRecoveryError("Case recovery request required",400);
 const value=input as Record<string,unknown>;
 if(typeof value.id!=="string"||!uuid.test(value.id)||typeof value.eventId!=="string"||!uuid.test(value.eventId)||
    typeof value.version!=="number"||!Number.isSafeInteger(value.version)||value.version<1||value.version>=2147483647)
  throw new AssessmentRecoveryError("Valid case, current version and archived assessment required",400);
 // A caller cannot supply replacement evidence or restore another case's history.
 if(Object.keys(value).some(key=>!["id","version","eventId"].includes(key)))
  throw new AssessmentRecoveryError("Recovery accepts an archived event reference only",400);
 return {id:value.id,version:value.version,eventId:value.eventId};
}

const archiveJoin=`FROM dis_casework c JOIN dis_case_events e ON e.case_id=c.id AND e.workspace_id=c.workspace_id
 WHERE c.id=$1::uuid AND c.version=$2::integer AND e.id=$3::uuid AND e.event_type='REASSESSMENT'`;

/** Read sizes before returning legacy content; RLS applies to both original tables. */
export const CASE_ASSESSMENT_SOURCE_SQL=`SELECT c.version,
 octet_length(c.report::text) AS current_report_bytes,octet_length(c.playbook::text) AS playbook_bytes,
 octet_length((e.payload->'previousReport')::text) AS report_bytes,
 e.payload->>'previousVersion' AS previous_version,
 CASE WHEN octet_length((e.payload->'previousReport')::text)<=${CASE_RECOVERY_MAX_REPORT_BYTES}
 THEN (e.payload->'previousReport')::text ELSE NULL END AS report_text
 ${archiveJoin}`;

export function validateAssessmentSource(row:Record<string,unknown>|undefined,expectedVersion:number):void{
 if(!row)throw new AssessmentRecoveryError("Case changed, archived assessment unavailable, or access denied. Reload before retrying.",409);
 const previous=Number(row.previous_version),reportBytes=Number(row.report_bytes),currentBytes=Number(row.current_report_bytes),planBytes=Number(row.playbook_bytes);
 if(Number(row.version)!==expectedVersion||!Number.isSafeInteger(previous)||previous<1||previous>=expectedVersion)
  throw new AssessmentRecoveryError("Archived assessment version is invalid; nothing restored",409);
 if(!Number.isSafeInteger(reportBytes)||reportBytes<2||!Number.isSafeInteger(currentBytes)||currentBytes<2||!Number.isSafeInteger(planBytes)||planBytes<2)
  throw new AssessmentRecoveryError("Archived assessment is not a recoverable report",409);
 if(reportBytes>CASE_RECOVERY_MAX_REPORT_BYTES||currentBytes>CASE_RECOVERY_MAX_REPORT_BYTES||planBytes>maxPlaybookBytes)
  throw new AssessmentRecoveryError("Stored case exceeds bounded recovery capacity; nothing changed or truncated",413);
 if(typeof row.report_text!=="string"||Buffer.byteLength(row.report_text,"utf8")!==reportBytes)
  throw new AssessmentRecoveryError("Archived assessment content could not be verified",503);
 // Measure retained text before parsing: a huge JSON numeric token can become
 // Infinity/null in JavaScript and otherwise appear smaller on reserialization.
 // PostgreSQL's canonical whitespace may conservatively exclude a boundary-size
 // legacy report; preserve it and report the capacity gap rather than truncate.
 if(row.report_text.length>CASE_REPORT_MAX_CHARS)
  throw new AssessmentRecoveryError("Stored assessment text exceeds the bounded 128,000-character recovery capacity; nothing changed or truncated",413);
 try{serializeCaseReport(JSON.parse(row.report_text));}
 catch(e){if(e instanceof CasePayloadError)throw new AssessmentRecoveryError(e.message,e.status);throw new AssessmentRecoveryError("Archived assessment JSON is invalid",409);}
}

/**
 * The database copies JSONB directly, so stored numeric precision never passes
 * through JavaScript parsing. Current report + restore reference are journaled
 * atomically. Existing action plan, baseline events and source event are retained.
 */
export const CASE_ASSESSMENT_RESTORE_SQL=`WITH source AS MATERIALIZED (
 SELECT c.id,c.report AS displaced_report,c.version AS displaced_version,e.id AS source_event_id,
 e.payload->'previousVersion' AS restored_from_version,e.payload->'previousReport' AS restored_report
 ${archiveJoin}
 AND jsonb_typeof(e.payload->'previousReport')='object'
 AND octet_length((e.payload->'previousReport')::text)<=${CASE_RECOVERY_MAX_REPORT_BYTES}
 AND octet_length(c.report::text)<=${CASE_RECOVERY_MAX_REPORT_BYTES}
 AND octet_length(c.playbook::text)<=${maxPlaybookBytes}
 FOR UPDATE OF c
), revised AS (
 UPDATE dis_casework c SET report=source.restored_report,version=c.version+1,status='REVIEW',updated_at=now()
 FROM source WHERE c.id=source.id AND c.version=$2::integer
 RETURNING c.id,c.workspace_id,c.owner_subject,c.title,c.question,c.report,c.playbook,c.version,c.status,c.updated_at
), archived AS (
 INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload)
 SELECT revised.id,revised.workspace_id,revised.owner_subject,'REASSESSMENT',jsonb_build_object(
 'previousVersion',source.displaced_version,'previousReport',source.displaced_report,
 'newVersion',revised.version,'revisionAction','RESTORE_PRIOR_ASSESSMENT',
 'restoredFromEvent',source.source_event_id,'restoredFromVersion',source.restored_from_version,
 'evidenceState','RESTORED_NOT_INDEPENDENTLY_VERIFIED')
 FROM revised JOIN source ON source.id=revised.id RETURNING id
)
SELECT json_build_object('id',revised.id,'workspace_id',revised.workspace_id,'title',revised.title,
 'question',revised.question,'report',revised.report,'playbook',revised.playbook,'version',revised.version,
 'status',revised.status,'updated_at',revised.updated_at)::text AS case_json,
 archived.id AS restoration_event_id FROM revised CROSS JOIN archived`;

export function assessmentRestoreResponse(row:{case_json?:unknown;restoration_event_id?:unknown}|undefined,eventId:string):string{
 if(!row)throw new AssessmentRecoveryError("Case changed or access denied; assessment was not restored. Reload before retrying.",409);
 if(typeof row.case_json!=="string"||typeof row.restoration_event_id!=="string"||!uuid.test(row.restoration_event_id))
  throw new AssessmentRecoveryError("Recovery receipt unavailable; reload the case before retrying",503);
 const receipt=JSON.stringify({historyRecorded:true,restoredFromEvent:eventId,restorationEventId:row.restoration_event_id,
  note:"Earlier assessment restored as a new review revision. The displaced assessment, original baseline and current action plan are retained. Restoration does not establish independent validation."});
 return '{"case":'+row.case_json+','+receipt.slice(1);
}
