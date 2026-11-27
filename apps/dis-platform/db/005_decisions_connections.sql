-- Optional, personal Decisions connections. Review/test before any authorized deployment.
-- Requires 003_organization_workflow.sql; no production migration is run at startup.
CREATE TABLE dis_organization_decisions_connections (
 organization_id uuid NOT NULL REFERENCES dis_organizations(id), subject_id text NOT NULL,
 generation uuid NOT NULL, state text NOT NULL CHECK(state IN ('DISCONNECTED','AUTHORIZATION_PENDING','AUTHORIZED','REAUTHORIZATION_REQUIRED')),
 credentials_ciphertext text CHECK(octet_length(credentials_ciphertext)<=90000), access_expires_at timestamptz,
 authorized_at timestamptz, pending_state_hash text UNIQUE CHECK(pending_state_hash ~ '^[a-f0-9]{64}$'),
 pending_ciphertext text CHECK(octet_length(pending_ciphertext)<=12000), pending_expires_at timestamptz,
 discovery jsonb CHECK(octet_length(discovery::text)<=524288), last_discovered_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,subject_id),
 FOREIGN KEY(organization_id,subject_id) REFERENCES dis_organization_members(organization_id,subject_id),
 CHECK((credentials_ciphertext IS NULL)=(access_expires_at IS NULL)),
 CHECK(state<>'AUTHORIZED' OR (credentials_ciphertext IS NOT NULL AND authorized_at IS NOT NULL)),
 CHECK((pending_state_hash IS NULL)=(pending_ciphertext IS NULL)),
 CHECK((pending_state_hash IS NULL)=(pending_expires_at IS NULL))
);
ALTER TABLE dis_organization_decisions_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dis_organization_decisions_connections FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_decisions_connection_owner ON dis_organization_decisions_connections
 USING(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL)
 WITH CHECK(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
GRANT SELECT,INSERT,UPDATE ON dis_organization_decisions_connections TO dis_app_safe;

-- Secret-free, append-only connector lifecycle receipts. No meeting contents or OAuth
-- codes/state/tokens are included. Organization admins cannot inspect another member's connection.
CREATE TABLE dis_organization_decisions_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, subject_id text NOT NULL,
 generation uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('AUTHORIZATION_STARTED','AUTHORIZATION_CONSUMED','AUTHORIZED','AUTHORIZATION_FAILED','TOKEN_REFRESHED','REAUTHORIZATION_REQUIRED','DISCOVERED','READ_STARTED','READ_RETURNED','READ_FAILED','DISCONNECTED')),
 tool_name text CHECK(length(tool_name)<=128), created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,subject_id) REFERENCES dis_organization_members(organization_id,subject_id)
);
ALTER TABLE dis_organization_decisions_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dis_organization_decisions_events FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_decisions_event_read ON dis_organization_decisions_events FOR SELECT
 USING(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
CREATE POLICY dis_decisions_event_add ON dis_organization_decisions_events FOR INSERT
 WITH CHECK(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
GRANT SELECT,INSERT ON dis_organization_decisions_events TO dis_app_safe;
CREATE INDEX dis_decisions_event_owner ON dis_organization_decisions_events(organization_id,subject_id,created_at DESC);
