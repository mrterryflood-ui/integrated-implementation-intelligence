-- Synthetic test database only. Policies match the existing restricted runtime
-- case/workspace policies inspected on 2026-11-08; this is not a migration.
CREATE ROLE dis_app_safe NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE TABLE dis_subjects(subject_id text PRIMARY KEY);
CREATE TABLE dis_workspaces(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_subject text NOT NULL REFERENCES dis_subjects(subject_id),title text NOT NULL);
CREATE TABLE dis_casework(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),owner_subject text NOT NULL,title text NOT NULL,question text NOT NULL,report jsonb NOT NULL,playbook jsonb NOT NULL,version integer NOT NULL DEFAULT 1 CHECK(version>0),status text NOT NULL DEFAULT 'ACTIVE',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE dis_case_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),case_id uuid NOT NULL REFERENCES dis_casework(id),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),owner_subject text NOT NULL,event_type text NOT NULL CHECK(event_type IN ('CREATED','CHECKPOINT','REASSESSMENT','NOTE')),payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE dis_subjects ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_workspaces ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_casework ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_casework FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_case_events ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_case_events FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_subject_self_insert ON dis_subjects FOR INSERT TO dis_app_safe WITH CHECK(subject_id=current_setting('dis.subject_id',true));
CREATE POLICY dis_workspaces_owner_select ON dis_workspaces FOR SELECT TO dis_app_safe USING(owner_subject=current_setting('dis.subject_id',true));
CREATE POLICY dis_workspace_self_insert ON dis_workspaces FOR INSERT TO dis_app_safe WITH CHECK(owner_subject=current_setting('dis.subject_id',true));
CREATE POLICY dis_casework_select ON dis_casework FOR SELECT TO dis_app_safe USING(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_workspaces w WHERE w.id=dis_casework.workspace_id AND w.owner_subject=current_setting('dis.subject_id',true)));
CREATE POLICY dis_casework_insert ON dis_casework FOR INSERT TO dis_app_safe WITH CHECK(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_workspaces w WHERE w.id=dis_casework.workspace_id AND w.owner_subject=current_setting('dis.subject_id',true)));
CREATE POLICY dis_casework_update ON dis_casework FOR UPDATE TO dis_app_safe USING(owner_subject=current_setting('dis.subject_id',true)) WITH CHECK(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_workspaces w WHERE w.id=dis_casework.workspace_id AND w.owner_subject=current_setting('dis.subject_id',true)));
CREATE POLICY dis_case_events_select ON dis_case_events FOR SELECT TO dis_app_safe USING(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_casework c WHERE c.id=dis_case_events.case_id AND c.owner_subject=current_setting('dis.subject_id',true)));
CREATE POLICY dis_case_events_insert ON dis_case_events FOR INSERT TO dis_app_safe WITH CHECK(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_casework c WHERE c.id=dis_case_events.case_id AND c.owner_subject=current_setting('dis.subject_id',true)));
GRANT INSERT ON dis_subjects TO dis_app_safe;
GRANT SELECT,INSERT ON dis_workspaces TO dis_app_safe;
GRANT SELECT,INSERT,UPDATE ON dis_casework TO dis_app_safe;
GRANT SELECT,INSERT ON dis_case_events TO dis_app_safe;
