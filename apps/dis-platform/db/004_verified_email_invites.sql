-- Pending organization membership by verified email. Never grants a chapter decision delegation.
-- Apply only after 003_organization_workflow.sql. No invitation emails are dispatched here.
CREATE TABLE dis_organization_email_invites (
  organization_id uuid NOT NULL REFERENCES dis_organizations(id),
  email_fingerprint text NOT NULL CHECK(email_fingerprint ~ '^[a-f0-9]{64}$'),
  approved_by text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  accepted_subject text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(organization_id,email_fingerprint),
  CHECK (accepted_subject IS NULL OR accepted_at IS NOT NULL)
);
CREATE INDEX dis_org_invites_by_fingerprint ON dis_organization_email_invites(email_fingerprint) WHERE active;
-- Invite data cannot be read by ordinary contributors. This table deliberately does not
-- FORCE RLS so its carefully restricted SECURITY DEFINER redemption can see pending rows.
ALTER TABLE dis_organization_email_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY dis_invite_admin_read ON dis_organization_email_invites FOR SELECT USING(dis_organization_role(organization_id)='admin');
CREATE POLICY dis_invite_admin_add ON dis_organization_email_invites FOR INSERT WITH CHECK(dis_organization_role(organization_id)='admin' AND approved_by=current_setting('dis.subject_id',true));
CREATE POLICY dis_invite_admin_update ON dis_organization_email_invites FOR UPDATE USING(dis_organization_role(organization_id)='admin') WITH CHECK(dis_organization_role(organization_id)='admin');
GRANT SELECT,INSERT,UPDATE(active) ON dis_organization_email_invites TO dis_app_safe;

-- The only self-enrollment route. The web service supplies this hash solely from a
-- verified PRIMARY Clerk email. Browser input is never accepted as the hash.
CREATE FUNCTION dis_redeem_verified_email_invites(p_hash text,p_subject text,p_display_name text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item record; accepted integer := 0; live boolean;
BEGIN
 IF p_subject IS DISTINCT FROM current_setting('dis.subject_id',true)
 OR length(p_subject)<1 OR length(p_subject)>200
 OR length(p_display_name)<1 OR length(p_display_name)>160
 OR p_hash !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'Invalid verified invitation context'; END IF;
 FOR item IN
   SELECT organization_id,accepted_subject
   FROM public.dis_organization_email_invites
   WHERE email_fingerprint=p_hash AND active
   FOR UPDATE
 LOOP
  IF item.accepted_subject IS NULL THEN
   INSERT INTO public.dis_organization_members(organization_id,subject_id,display_name,role)
   VALUES(item.organization_id,p_subject,p_display_name,'contributor')
   ON CONFLICT(organization_id,subject_id) DO NOTHING;
   UPDATE public.dis_organization_email_invites
    SET accepted_subject=p_subject,accepted_at=now()
    WHERE organization_id=item.organization_id AND email_fingerprint=p_hash AND accepted_subject IS NULL;
  END IF;
  IF item.accepted_subject IS NULL OR item.accepted_subject=p_subject THEN
   SELECT active INTO live FROM public.dis_organization_members
    WHERE organization_id=item.organization_id AND subject_id=p_subject;
   IF coalesce(live,false) THEN accepted := accepted+1; END IF;
  END IF;
 END LOOP;
 RETURN accepted;
END$$;
REVOKE ALL ON FUNCTION dis_redeem_verified_email_invites(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION dis_redeem_verified_email_invites(text,text,text) TO dis_app_safe;
