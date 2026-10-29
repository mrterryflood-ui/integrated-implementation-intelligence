# DIS authenticated workspace
Staged Next.js/Clerk/Neon implementation. Not deployed until dedicated Clerk credentials, least-privilege Neon role, RLS tenant tests, and build verification are complete.

## Safety
- Server-side Clerk identity required for /workspace and /api/workspaces.
- No browser-supplied subject IDs.
- Dedicated DIS_DATABASE_URL must use a restricted application role, not Neon owner.
- PostgreSQL RLS policies require session identity; current stateless Neon HTTP calls do not set dis.subject_id. Therefore workspaces are not operational until the database access layer is updated to set verified subject context transactionally and full RLS write policies are added.
- Never weaken RLS or use privileged database credentials to bypass this gate.
