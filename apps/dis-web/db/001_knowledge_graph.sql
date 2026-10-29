-- DIS knowledge graph, PostgreSQL/Neon proposal v0.1. NOT MIGRATED.
-- Identity subject must be a server-verified identity-provider user ID.
-- Never trust tenant_id or actor_id supplied by browser input.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS dis_tenants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dis_memberships (
 tenant_id uuid NOT NULL REFERENCES dis_tenants(id), subject_id text NOT NULL,
 role text NOT NULL CHECK(role IN ('owner','editor','reader')),
 PRIMARY KEY(tenant_id,subject_id)
);
CREATE TABLE IF NOT EXISTS dis_workspaces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 title text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dis_sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 uri text NOT NULL, title text NOT NULL, publisher text, published_at timestamptz,
 retrieved_at timestamptz NOT NULL DEFAULT now(),content_sha256 text,license text,
 source_type text NOT NULL CHECK(source_type IN ('public','user_uploaded','connector')),
 UNIQUE(tenant_id,uri,content_sha256)
);
CREATE TABLE IF NOT EXISTS dis_passages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 source_id uuid NOT NULL REFERENCES dis_sources(id),start_offset integer NOT NULL CHECK(start_offset>=0),
 end_offset integer NOT NULL CHECK(end_offset>start_offset), content_sha256 text NOT NULL,
 excerpt text NOT NULL
);
CREATE TABLE IF NOT EXISTS dis_nodes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 workspace_id uuid REFERENCES dis_workspaces(id),kind text NOT NULL
 CHECK(kind IN ('organization','person','concept','problem','stakeholder','requirement','claim','decision','intervention','outcome','metric')),
 label text NOT NULL, attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
 epistemic_state text NOT NULL DEFAULT 'UNVALIDATED'
 CHECK(epistemic_state IN ('OBSERVED','INFERRED','MODELED','UNVALIDATED')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dis_edges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 from_node uuid NOT NULL REFERENCES dis_nodes(id),to_node uuid NOT NULL REFERENCES dis_nodes(id),
 predicate text NOT NULL,confidence numeric CHECK(confidence BETWEEN 0 AND 1),
 asserted_at timestamptz NOT NULL DEFAULT now(), CHECK(from_node<>to_node)
);
CREATE TABLE IF NOT EXISTS dis_claim_evidence (
 tenant_id uuid NOT NULL REFERENCES dis_tenants(id),claim_id uuid NOT NULL REFERENCES dis_nodes(id),
 passage_id uuid NOT NULL REFERENCES dis_passages(id),verdict text NOT NULL
 CHECK(verdict IN ('SUPPORTS','PARTIAL','CONTRADICTS','UNRESOLVED')),
 reviewed_at timestamptz,reviewer_subject text,
 PRIMARY KEY(claim_id,passage_id)
);
CREATE TABLE IF NOT EXISTS dis_deliberations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 workspace_id uuid NOT NULL REFERENCES dis_workspaces(id), perspective text NOT NULL,
 runtime_identity text, independent_execution boolean NOT NULL DEFAULT false,
 evidence jsonb NOT NULL DEFAULT '[]'::jsonb,dissent jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS dis_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 workspace_id uuid NOT NULL REFERENCES dis_workspaces(id), approved_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
 denied_scope jsonb NOT NULL DEFAULT '[]'::jsonb,decision_state text NOT NULL DEFAULT 'DRAFT'
 CHECK(decision_state IN ('DRAFT','APPROVED','REJECTED','SUPERSEDED')),
 approved_by text,approved_at timestamptz, dissent jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE IF NOT EXISTS dis_audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES dis_tenants(id),
 subject_id text NOT NULL,operation text NOT NULL,resource_id text,
 evidence_hash text,recorded_at timestamptz NOT NULL DEFAULT now()
);
-- Default deny: application must SET LOCAL dis.subject_id to verified ID in a transaction.
-- Membership creation requires separate trusted provisioning; not exposed as an API.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['dis_tenants','dis_memberships','dis_workspaces','dis_sources','dis_passages','dis_nodes','dis_edges','dis_claim_evidence','dis_deliberations','dis_decisions','dis_audit_events']
 LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
-- Cross-table tenant consistency must be enforced by composite tenant FKs or DB triggers
-- before writes are enabled. Do not grant application INSERT/UPDATE/DELETE until implemented.
CREATE POLICY dis_workspace_read ON dis_workspaces FOR SELECT USING (
 EXISTS(SELECT 1 FROM dis_memberships m WHERE m.tenant_id=dis_workspaces.tenant_id AND m.subject_id=current_setting('dis.subject_id',true))
);
CREATE POLICY dis_membership_read ON dis_memberships FOR SELECT USING(subject_id=current_setting('dis.subject_id',true));
CREATE POLICY dis_node_read ON dis_nodes FOR SELECT USING (
 EXISTS(SELECT 1 FROM dis_memberships m WHERE m.tenant_id=dis_nodes.tenant_id AND m.subject_id=current_setting('dis.subject_id',true))
);
-- Additional policies deliberately omitted: fail closed until tenancy integrity and auth tests pass.
