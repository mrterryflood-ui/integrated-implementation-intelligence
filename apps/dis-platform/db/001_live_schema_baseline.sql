-- Applied to Neon project shy-term-41145132 on 2026-10-29.
-- Source-controlled schema baseline; do not run against other databases without review.
CREATE TABLE IF NOT EXISTS dis_subjects(subject_id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS dis_workspaces(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),owner_subject text NOT NULL REFERENCES dis_subjects(subject_id),title text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,owner_subject));
CREATE TABLE IF NOT EXISTS dis_knowledge_nodes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),kind text NOT NULL CHECK(kind IN ('source','claim','question','stakeholder','organization','decision','test','outcome','concept')),label text NOT NULL,evidence_state text NOT NULL DEFAULT 'UNVALIDATED' CHECK(evidence_state IN ('OBSERVED','INFERRED','MODELED','UNVALIDATED')),metadata jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,workspace_id));
CREATE TABLE IF NOT EXISTS dis_knowledge_edges(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),from_node uuid NOT NULL,to_node uuid NOT NULL,relation text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(from_node,workspace_id) REFERENCES dis_knowledge_nodes(id,workspace_id),FOREIGN KEY(to_node,workspace_id) REFERENCES dis_knowledge_nodes(id,workspace_id),CHECK(from_node<>to_node));
CREATE TABLE IF NOT EXISTS dis_evidence_passages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),source_uri text NOT NULL,source_title text NOT NULL,excerpt text NOT NULL,content_hash text NOT NULL,retrieved_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,workspace_id));
CREATE TABLE IF NOT EXISTS dis_claim_support(workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),claim_node uuid NOT NULL,passage_id uuid NOT NULL,verdict text NOT NULL CHECK(verdict IN ('SUPPORTS','PARTIAL','CONTRADICTS','UNRESOLVED')),PRIMARY KEY(workspace_id,claim_node,passage_id),FOREIGN KEY(claim_node,workspace_id) REFERENCES dis_knowledge_nodes(id,workspace_id),FOREIGN KEY(passage_id,workspace_id) REFERENCES dis_evidence_passages(id,workspace_id));
CREATE TABLE IF NOT EXISTS dis_audit_log(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),subject_id text NOT NULL,operation text NOT NULL,recorded_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE dis_subjects ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_subjects FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_workspaces ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_knowledge_nodes ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_knowledge_nodes FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_knowledge_edges ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_knowledge_edges FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_evidence_passages ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_evidence_passages FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_claim_support ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_claim_support FORCE ROW LEVEL SECURITY;
ALTER TABLE dis_audit_log ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_audit_log FORCE ROW LEVEL SECURITY;
-- Policies are intentionally restrictive. Only subject/workspace insert and owner read enabled.
-- Runtime uses transaction-local set_config('dis.subject_id', verified_clerk_subject, true).
-- Apply policies from a reviewed migration system; do not duplicate them by re-running CREATE POLICY.
