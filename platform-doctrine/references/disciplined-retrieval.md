# Disciplined Retrieval (graph + passages): standing practice

Status: adopted amendment, 2026-09-30 (authorized by Terry Flood) · Companion to
`evidence-knowledge-graph.md` (K1–K8), which governs how the graph is populated.
This file governs how every advisor, assistant, search box or generated report
**retrieves** evidence and answers from it. Reference implementation: The Community
Violence Register, `server/evidence/graph.ts` (`retrieveEvidence`), merged 2026-09-30.

## Why
Ordinary RAG hands a model some similar-looking passages and lets it write. That
fails in three ways: it answers from memory when retrieval is thin, it blends
disagreeing sources into one confident number, and nobody can later see what was
retrieved. A disciplined system makes the retrieval path explicit, typed, cited,
logged and tested.

## The rules

| # | Rule | Minimum implementation |
|---|---|---|
| R1 | **Layered order: graph → passages → abstain.** Structured claims (quads) answer first. Ranked source passages are the fallback. If neither matches, the system abstains. Model memory is never a layer. | One retrieval function returns `layer: graph \| passage \| none`. The prompt forbids answering outside the returned layer. |
| R2 | **Passages are addressable.** Each chunk stores `source_id`, order, character offsets into the source text and a content hash. | Chunk table; offsets re-slice to the stored text (tested). |
| R3 | **Tier travels with every hit.** Graph claims and passages both return the source URL, title, date and tier. An answer inherits the weakest tier it uses. | Tier on every result object; K8 applies. |
| R4 | **Abstain honestly.** No match means "the platform holds no processed source for this". It is not "no", "zero" or "none happened". | `abstain: true` plus a meaning string. External search, where allowed, is labelled EXTERNAL. |
| R5 | **Conflicts are shown, not resolved.** Single-valued facts that disagree across sources come back side by side (K5). | `conflicts[]` in the graph result. |
| R6 | **Freshness is visible.** Every source records retrieved and published dates. Projects set a time-to-live, and stale hits are flagged. | Dates on sources; TTL per project in its profile. |
| R7 | **Every retrieval is logged.** Log the query, layer, hit IDs and whether it abstained, so answers can be audited later. | `retrieval_log` table (or an equivalent append-only log). |
| R8 | **Retrieval is tested.** CI covers the gates (verbatim quote, vocabulary, types), chunk offsets, abstention on empty input, and a small golden set of question → expected source for the project's own corpus. | Unit tests in the product repo, run before merge. |

## What does not change
- The graph is not the record of truth for measured data (K7). Official series keep their own tables and tools. Retrieval over text cross-checks them and never overrides them.
- Screening is not a determination. For products that screen (grants eligibility, hazard alerts, child-program compliance), retrieval surfaces what a source says. A human or the authoritative system decides.
- Mock, demo and illustrative data is never ingested as evidence.

## Per-product application (tracked in each repo)
Each product repo carries its own profile (predicates, tiers, TTL), its retrieval
function and its tests, and records its adoption in its own agent guide. Code does not
cross lanes; this doctrine is the only shared piece.
