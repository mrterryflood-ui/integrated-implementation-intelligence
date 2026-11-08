/** Exact-version research revision in the existing append-only case journal. */
export const CASE_RESEARCH_REVISION_SQL=`WITH prior AS MATERIALIZED (
 SELECT id,report,version,CASE WHEN jsonb_typeof(report->'retainedResearch')='object' THEN report->'retainedResearch' ELSE report END AS research_report
 FROM dis_casework WHERE id=$1::uuid AND version=$2::integer FOR UPDATE
), updated AS (
 UPDATE dis_casework c SET report=prior.research_report||jsonb_build_object(
 'workflow',$3::jsonb->'workflow','workflowBaselineGapIds',$3::jsonb->'workflowBaselineGapIds',
 'workflowBaselineNoteIds',$3::jsonb->'workflowBaselineNoteIds','workflowBaselineLeadIds',$3::jsonb->'workflowBaselineLeadIds',
 'gapIDs',$3::jsonb->'gapIDs','gapLedger',$3::jsonb->'gapLedger','taskProjection',$3::jsonb->'taskProjection',
 'investigation',(prior.research_report->'investigation')||jsonb_build_object(
   'literature',$3::jsonb->'investigation'->'literature','notes',$3::jsonb->'investigation'->'notes',
   'privacyStatus',$3::jsonb->'investigation'->'privacyStatus'),
 'actionPlan',(prior.research_report->'actionPlan')||jsonb_build_object('tasks',$3::jsonb->'actionPlan'->'tasks'),
 'noPatientData',NULL
 )||CASE WHEN prior.research_report ? 'decisionBrief' THEN jsonb_build_object('decisionBrief',
 (prior.research_report->'decisionBrief')||jsonb_build_object('openGapIds',$3::jsonb->'gapIDs')) ELSE '{}'::jsonb END,
 version=c.version+1,status='REVIEW',updated_at=now()
 FROM prior WHERE c.id=prior.id AND c.version=$2::integer
 RETURNING c.id,c.workspace_id,c.owner_subject,c.title,c.question,c.report,c.playbook,c.version,c.status,c.updated_at
), journal AS (
 INSERT INTO dis_case_events(case_id,workspace_id,owner_subject,event_type,payload)
 SELECT updated.id,updated.workspace_id,updated.owner_subject,'REASSESSMENT',jsonb_build_object(
 'previousVersion',prior.version,'previousReport',prior.report,'newVersion',updated.version,
 'revisionAction','RESEARCH_WORKFLOW_EDIT','evidenceState','DECLARED_INPUTS_NOT_INDEPENDENTLY_VERIFIED')
 FROM updated JOIN prior ON prior.id=updated.id RETURNING id
)
SELECT updated.id,updated.workspace_id,updated.title,updated.question,updated.report,updated.playbook,
 updated.version,updated.status,updated.updated_at,journal.id AS research_event_id
 FROM updated CROSS JOIN journal`;
