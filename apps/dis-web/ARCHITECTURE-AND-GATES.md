# DIS research platform: identity, graph and MCP rollout
Status: v0.2 infrastructure scaffold, NOT production identity or persistent user memory.

## Operating doctrine
Use existing canonical III and R1–R8 retrieval. Distinguish evidence records, inferences, hypotheses, models and verified outcomes. Preserve dissent and authorization through implementation. No simulated SME is an actual consulted person.

## What is deployed
- Read-only JSON-RPC MCP endpoint at /api/mcp: initialize, tools/list, tools/call, ping. Three public bounded tools: dis.plan, dis.scholar_search, dis.public_repo_inspect.
- Public GitHub code inspection is a bounded static sample, not a complete audit.
- Account entry point clearly discloses that sign-in is not active.

## Identity and data roadmap (blocked until configured)
1. Provision a dedicated Clerk instance and server-side keys through Vercel Marketplace; do not reuse another product's credentials.
2. Migrate app to Next.js with Clerk server auth, protected routes, sessions, user settings, consent, and sign-out. Require server-verified subject IDs for all database access.
3. Provision dedicated Neon database; apply reviewed graph schema in db/001_knowledge_graph.sql after correcting cross-tenant foreign key integrity, complete RLS policies, and role permissions.
4. Test isolation with two independent tenants and malicious ID substitutions, consent/revocation, export/delete, backups, recovery and retention.
5. Store user workspaces, source provenance, passage offsets, nodes/edges, claims, council dissent, decisions, approvals, actions and outcomes.
6. Add authenticated MCP for user-specific knowledge; never expose private graph resources via the public MCP.
7. Add hybrid retrieval: graph facts -> passage citations -> abstention; embeddings only as candidate retrieval, never source of truth.
8. Add independent agent execution and claim-level source adjudication with raw traces, bounded budgets, provenance and rollback.
9. Add engineering agent isolated branch/PR with exact-SHA tests, security gates and explicit user approval before merge/deploy.

## Acceptance gates
- Auth provider connected and verified; no password collection by DIS.
- User and tenant authorization verified server-side.
- RLS isolation tests pass, including cross-table tenant FKs.
- Complete citation audit, source passage re-slicing and conflict reporting.
- Independent model runs distinguishable from simulated perspectives.
- No execution on private repositories without scoped installation authorization.
- No release of a verified result without evidence; no irreversible external action without authorization.

## Risks and limitations
Public MCP currently has no durable per-user rate limit; it must not expose costly agent execution or private data. Use provider-level limits before expanding. Metadata search is not source validation. GitHub rate limits and unavailable upstream APIs are surfaced, not hidden.
