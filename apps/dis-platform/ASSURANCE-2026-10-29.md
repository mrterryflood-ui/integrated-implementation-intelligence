# DIS identity and data assurance — 2026-10-29

## Verified
- Dedicated Neon project: shy-term-41145132.
- Production runtime role: dis_app_safe, rolbypassrls=false, rolsuper=false.
- RLS forced on workspace and document tables.
- In isolated Neon test branch br-proud-lake-b8cwo2ty:
  - Alpha created a workspace with transaction-local subject.
  - Beta saw zero Alpha workspaces.
  - Beta's attempt to create a workspace owned by Alpha was denied by RLS.
- Original Neon-generated dis_runtime role was found to have BYPASSRLS=true. Its table privileges and schema usage were revoked. Vercel DIS_DATABASE_URL was rotated to dis_app_safe.
- Authentication subject comes from Clerk server auth, not user input.

## Not yet established
- Real Clerk login through browser, real private file upload and retrieval, and live provider email OAuth have not been end-to-end exercised.
- Private Blob storage is connected, but malware scanning and complex-format sandboxing are not yet implemented. Limit uploads to trusted beta users.
- Extraction from PDF/DOCX/text is a best-effort convenience, not scholarly verification.
- Cross-tenant graph write permissions are intentionally not enabled.
- Upload retention, deletion/export, provider-specific OAuth consent and independent agent runtime remain gated.

## Release conditions
Do not call this a fully accepted knowledge platform until authenticated upload, tenant isolation, search, privacy deletion, recovery and user acceptance are demonstrated on the exact production version.
