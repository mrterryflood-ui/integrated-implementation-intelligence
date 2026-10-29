-- DIS document deletion: reviewed least-privilege migration.
-- Apply to isolated Neon validation branch before production.
-- Safe additive permission only; no rows are changed by this migration.
-- RLS is FORCE-enabled on dis_documents and dis_workspaces.
BEGIN;
GRANT DELETE ON TABLE public.dis_documents TO dis_app_safe;
CREATE POLICY dis_documents_owner_delete
  ON public.dis_documents
  FOR DELETE TO dis_app_safe
  USING (
    owner_subject = current_setting('dis.subject_id', true)
    AND EXISTS (
      SELECT 1 FROM public.dis_workspaces w
      WHERE w.id = dis_documents.workspace_id
        AND w.owner_subject = current_setting('dis.subject_id', true)
    )
  );
COMMIT;
