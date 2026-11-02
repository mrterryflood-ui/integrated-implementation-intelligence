-- Additive organizational workflow. Review and test before applying to production.
-- No existing workspace/document records are modified.
CREATE TABLE dis_organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160),
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 storage_quota_bytes bigint NOT NULL DEFAULT 107374182400 CHECK(storage_quota_bytes BETWEEN 104857600 AND 1099511627776)
);
CREATE TABLE dis_organization_members (
 organization_id uuid NOT NULL REFERENCES dis_organizations(id), subject_id text NOT NULL,
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 160),
 role text NOT NULL CHECK(role IN ('admin','facilitator','contributor','viewer')), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,subject_id)
);
CREATE FUNCTION dis_organization_role(p_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT role FROM public.dis_organization_members WHERE organization_id=p_id AND subject_id=current_setting('dis.subject_id',true) AND active
$$;
REVOKE ALL ON FUNCTION dis_organization_role(uuid) FROM PUBLIC;
CREATE TABLE dis_organization_requests (
 organization_id uuid NOT NULL REFERENCES dis_organizations(id),subject_id text NOT NULL,
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 1 AND 160), note text NOT NULL DEFAULT '' CHECK(length(note)<=1000),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','admitted','declined')),created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(organization_id,subject_id)
);
-- Read-only for the application. Deployment/operator provisioning must preserve the
-- organization's actual delegation evidence; an admin cannot grant this to themselves.
CREATE TABLE dis_organization_authority (
 organization_id uuid NOT NULL REFERENCES dis_organizations(id),subject_id text NOT NULL,
 scope text NOT NULL CHECK(scope IN ('governance','approve_plan')),authority_reference text NOT NULL CHECK(length(authority_reference)>8),
 verified_by text NOT NULL,verified_at timestamptz NOT NULL, expires_at timestamptz,
 PRIMARY KEY(organization_id,subject_id,scope),
 FOREIGN KEY(organization_id,subject_id) REFERENCES dis_organization_members(organization_id,subject_id)
);
CREATE TABLE dis_organization_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES dis_organizations(id),
 kind text NOT NULL CHECK(kind IN ('draft','submission','proposal','baseline','evidence','task','capability','council','governance','decision','preference')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180),owner_subject text NOT NULL,
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','organization')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),body jsonb NOT NULL CHECK(octet_length(body::text)<=1048576),
 digest text NOT NULL CHECK(digest ~ '^[a-f0-9]{64}$'),last_editor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,organization_id)
);
CREATE INDEX dis_org_record_page ON dis_organization_records(organization_id,kind,created_at DESC,id);
CREATE TABLE dis_organization_versions (
 record_id uuid NOT NULL REFERENCES dis_organization_records(id),organization_id uuid NOT NULL REFERENCES dis_organizations(id),
 version integer NOT NULL,title text NOT NULL,visibility text NOT NULL,body jsonb NOT NULL,digest text NOT NULL,
 author_subject text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(record_id,version),
 FOREIGN KEY(record_id,organization_id) REFERENCES dis_organization_records(id,organization_id)
);
CREATE FUNCTION dis_org_keep_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.organization_id<>OLD.organization_id OR NEW.owner_subject<>OLD.owner_subject OR NEW.kind<>OLD.kind OR NEW.version<>OLD.version+1) THEN RAISE EXCEPTION 'Invalid version transition'; END IF;
 IF TG_OP='UPDATE' AND OLD.kind IN ('baseline','council','decision','governance','submission') AND (NEW.body<>OLD.body OR NEW.title<>OLD.title OR NEW.digest<>OLD.digest) THEN RAISE EXCEPTION 'Immutable record'; END IF;
 INSERT INTO public.dis_organization_versions(record_id,organization_id,version,title,visibility,body,digest,author_subject)
 VALUES(NEW.id,NEW.organization_id,NEW.version,NEW.title,NEW.visibility,NEW.body,NEW.digest,NEW.last_editor);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION dis_org_keep_version() FROM PUBLIC;
CREATE TRIGGER dis_org_version_trigger AFTER INSERT OR UPDATE ON dis_organization_records FOR EACH ROW EXECUTE FUNCTION dis_org_keep_version();
CREATE TABLE dis_organization_consents (
 record_id uuid NOT NULL,organization_id uuid NOT NULL,version integer NOT NULL,digest text NOT NULL,
 subject_id text NOT NULL,allowed boolean NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(record_id,version,subject_id),FOREIGN KEY(record_id,organization_id) REFERENCES dis_organization_records(id,organization_id)
);
CREATE TABLE dis_organization_ballots (
 proposal_id uuid NOT NULL,organization_id uuid NOT NULL,proposal_digest text NOT NULL,policy_id uuid NOT NULL,
 subject_id text NOT NULL,decision text NOT NULL CHECK(decision IN ('approve','reject','abstain')),recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(proposal_id,proposal_digest,policy_id,subject_id),FOREIGN KEY(proposal_id,organization_id) REFERENCES dis_organization_records(id,organization_id),
 FOREIGN KEY(policy_id,organization_id) REFERENCES dis_organization_records(id,organization_id)
);
CREATE TABLE dis_organization_channels (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES dis_organizations(id),
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 80),created_by text NOT NULL,
 audience text[] NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,organization_id)
);
CREATE TABLE dis_organization_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES dis_organizations(id),channel_id uuid NOT NULL,
 author_subject text NOT NULL,body text NOT NULL CHECK(length(body) BETWEEN 1 AND 8000),
 parent_id uuid,linked_record_id uuid,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,channel_id),
 FOREIGN KEY(channel_id,organization_id) REFERENCES dis_organization_channels(id,organization_id),
 FOREIGN KEY(parent_id,channel_id) REFERENCES dis_organization_messages(id,channel_id),
 FOREIGN KEY(linked_record_id,organization_id) REFERENCES dis_organization_records(id,organization_id)
);
CREATE INDEX dis_org_message_page ON dis_organization_messages(channel_id,created_at DESC,id);
CREATE TABLE dis_organization_uploads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES dis_organizations(id),owner_subject text NOT NULL,
 filename text NOT NULL,media_type text NOT NULL,pathname text NOT NULL UNIQUE,
 expected_bytes bigint NOT NULL CHECK(expected_bytes BETWEEN 1 AND 104857600),actual_bytes bigint CHECK(actual_bytes>=0),
 status text NOT NULL DEFAULT 'RESERVED' CHECK(status IN ('RESERVED','TOKEN_ISSUED','ARCHIVED','REJECTED','DELETED')),
 scan_state text NOT NULL DEFAULT 'NOT_SCANNED' CHECK(scan_state IN ('NOT_SCANNED','CLEAN','REJECTED')),
 extraction_state text NOT NULL DEFAULT 'PENDING',extracted_text text CHECK(octet_length(extracted_text)<=1048576),sha256 text,
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','organization')),
 expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,
 CHECK(visibility='private' OR scan_state='CLEAN'),UNIQUE(id,organization_id)
);
CREATE INDEX dis_org_upload_owner ON dis_organization_uploads(organization_id,owner_subject,created_at DESC);
-- Defense in depth; service also checks actor, type, scope, authority and exact revision.
ALTER TABLE dis_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dis_organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_org_select ON dis_organizations FOR SELECT USING(dis_organization_role(id) IS NOT NULL OR created_by=current_setting('dis.subject_id',true));
CREATE POLICY dis_org_create ON dis_organizations FOR INSERT WITH CHECK(created_by=current_setting('dis.subject_id',true));
-- No application update/delete grants for organization quota or authority rows.
ALTER TABLE dis_organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY dis_member_read ON dis_organization_members FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL);
CREATE POLICY dis_member_add ON dis_organization_members FOR INSERT WITH CHECK(dis_organization_role(organization_id)='admin' OR (subject_id=current_setting('dis.subject_id',true) AND role='admin' AND EXISTS(SELECT 1 FROM dis_organizations o WHERE o.id=organization_id AND o.created_by=current_setting('dis.subject_id',true))));
CREATE POLICY dis_member_change ON dis_organization_members FOR UPDATE USING(dis_organization_role(organization_id)='admin') WITH CHECK(dis_organization_role(organization_id)='admin');
ALTER TABLE dis_organization_requests ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_request_read ON dis_organization_requests FOR SELECT USING(subject_id=current_setting('dis.subject_id',true) OR dis_organization_role(organization_id)='admin');
CREATE POLICY dis_request_add ON dis_organization_requests FOR INSERT WITH CHECK(subject_id=current_setting('dis.subject_id',true) AND state='pending');
CREATE POLICY dis_request_update ON dis_organization_requests FOR UPDATE USING(dis_organization_role(organization_id)='admin');
ALTER TABLE dis_organization_authority ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_authority FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_authority_read ON dis_organization_authority FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL);
ALTER TABLE dis_organization_records ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_records FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_record_read ON dis_organization_records FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL AND (owner_subject=current_setting('dis.subject_id',true) OR visibility='organization'));
CREATE POLICY dis_record_add ON dis_organization_records FOR INSERT WITH CHECK(dis_organization_role(organization_id) IN ('admin','facilitator','contributor') AND owner_subject=current_setting('dis.subject_id',true) AND last_editor=current_setting('dis.subject_id',true));
CREATE POLICY dis_record_change ON dis_organization_records FOR UPDATE USING(dis_organization_role(organization_id) IN ('admin','facilitator','contributor') AND (owner_subject=current_setting('dis.subject_id',true) OR (visibility='organization' AND kind IN ('proposal','task')))) WITH CHECK(last_editor=current_setting('dis.subject_id',true));
ALTER TABLE dis_organization_versions ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_version_read ON dis_organization_versions FOR SELECT USING(EXISTS(SELECT 1 FROM dis_organization_records r WHERE r.id=record_id AND r.organization_id=dis_organization_versions.organization_id AND (dis_organization_versions.visibility='organization' OR r.owner_subject=current_setting('dis.subject_id',true))));
ALTER TABLE dis_organization_consents ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_consents FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_consent_read ON dis_organization_consents FOR SELECT USING(EXISTS(SELECT 1 FROM dis_organization_records r WHERE r.id=record_id AND r.organization_id=dis_organization_consents.organization_id));
CREATE POLICY dis_consent_add ON dis_organization_consents FOR INSERT WITH CHECK(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
CREATE POLICY dis_consent_update ON dis_organization_consents FOR UPDATE USING(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
ALTER TABLE dis_organization_ballots ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_ballots FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_ballot_read ON dis_organization_ballots FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL);
CREATE POLICY dis_ballot_add ON dis_organization_ballots FOR INSERT WITH CHECK(subject_id=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_organization_authority a WHERE a.organization_id=dis_organization_ballots.organization_id AND a.subject_id=current_setting('dis.subject_id',true) AND a.scope='approve_plan' AND (a.expires_at IS NULL OR a.expires_at>now())));
CREATE POLICY dis_ballot_update ON dis_organization_ballots FOR UPDATE USING(subject_id=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL);
ALTER TABLE dis_organization_channels ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_channels FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_channel_read ON dis_organization_channels FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL AND (cardinality(audience)=0 OR current_setting('dis.subject_id',true)=ANY(audience)));
CREATE POLICY dis_channel_add ON dis_organization_channels FOR INSERT WITH CHECK(dis_organization_role(organization_id) IN ('admin','facilitator','contributor') AND created_by=current_setting('dis.subject_id',true) AND (cardinality(audience)=0 OR created_by=ANY(audience)));
ALTER TABLE dis_organization_messages ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_message_read ON dis_organization_messages FOR SELECT USING(EXISTS(SELECT 1 FROM dis_organization_channels c WHERE c.id=channel_id AND c.organization_id=dis_organization_messages.organization_id));
CREATE POLICY dis_message_add ON dis_organization_messages FOR INSERT WITH CHECK(author_subject=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IN ('admin','facilitator','contributor') AND EXISTS(SELECT 1 FROM dis_organization_channels c WHERE c.id=channel_id AND c.organization_id=dis_organization_messages.organization_id));
ALTER TABLE dis_organization_uploads ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_uploads FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_upload_read ON dis_organization_uploads FOR SELECT USING(dis_organization_role(organization_id) IS NOT NULL AND (owner_subject=current_setting('dis.subject_id',true) OR (visibility='organization' AND scan_state='CLEAN')));
CREATE POLICY dis_upload_add ON dis_organization_uploads FOR INSERT WITH CHECK(dis_organization_role(organization_id) IN ('admin','facilitator','contributor') AND owner_subject=current_setting('dis.subject_id',true) AND visibility='private' AND scan_state='NOT_SCANNED');
CREATE POLICY dis_upload_update ON dis_organization_uploads FOR UPDATE USING(dis_organization_role(organization_id) IS NOT NULL AND owner_subject=current_setting('dis.subject_id',true));
-- Aggregate quota is bounded to the actor's organization; reveals no private filenames or contents.
CREATE FUNCTION dis_org_storage_usage(p_org uuid) RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN public.dis_organization_role(p_org) IS NOT NULL THEN COALESCE(sum(GREATEST(expected_bytes,COALESCE(actual_bytes,0))) FILTER(WHERE status<>'DELETED' AND NOT (status='REJECTED' AND actual_bytes IS NULL)),0)::bigint ELSE NULL END FROM public.dis_organization_uploads WHERE organization_id=p_org
$$;
REVOKE ALL ON FUNCTION dis_org_storage_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dis_organization_role(uuid),dis_org_storage_usage(uuid) TO dis_app_safe;
GRANT SELECT,INSERT ON dis_organizations,dis_organization_channels,dis_organization_messages TO dis_app_safe;
GRANT SELECT,INSERT,UPDATE ON dis_organization_members,dis_organization_requests,dis_organization_records,dis_organization_consents,dis_organization_ballots TO dis_app_safe;
GRANT SELECT,INSERT ON dis_organization_uploads TO dis_app_safe;
GRANT UPDATE(status,actual_bytes,expires_at,extraction_state,extracted_text,sha256,completed_at) ON dis_organization_uploads TO dis_app_safe;
GRANT SELECT ON dis_organization_versions,dis_organization_authority TO dis_app_safe;
CREATE TABLE dis_organization_review_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES dis_organizations(id),owner_subject text NOT NULL,
 target_id uuid NOT NULL,target_version integer NOT NULL,transfer_hash text NOT NULL,request jsonb NOT NULL,
 state text NOT NULL DEFAULT 'PREPARED' CHECK(state IN ('PREPARED','CLAIMED','COMPLETED','FAILED')),
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,receipt_id uuid,
 FOREIGN KEY(target_id,organization_id) REFERENCES dis_organization_records(id,organization_id),
 FOREIGN KEY(receipt_id,organization_id) REFERENCES dis_organization_records(id,organization_id)
);
ALTER TABLE dis_organization_review_jobs ENABLE ROW LEVEL SECURITY;ALTER TABLE dis_organization_review_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY dis_review_jobs_owner ON dis_organization_review_jobs USING(owner_subject=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IS NOT NULL) WITH CHECK(owner_subject=current_setting('dis.subject_id',true) AND dis_organization_role(organization_id) IN ('admin','facilitator','contributor'));
GRANT SELECT,INSERT,UPDATE ON dis_organization_review_jobs TO dis_app_safe;
