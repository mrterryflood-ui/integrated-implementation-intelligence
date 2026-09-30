# Evidence Knowledge Graph (SPOC quads): standing practice

Status: adopted amendment, 2026-09-30 (authorized by Terry Flood) · Tool: `platform-doctrine/tools/spoc_kg.py`
Lineage: adapted from Iván Palomares Carrascosa, "Automating Knowledge Graph Population:
Extracting Entities and Triples from Unstructured Text with an LLM", MachineLearningMastery.com,
2026-09-29,
https://machinelearningmastery.com/automating-knowledge-graph-population-extracting-entities-and-triples-from-unstructured-text-with-an-llm/
First applied to The Community Violence Register (398 quads from 4 sources; 4 date conflicts
surfaced).

## Why
Every product in this portfolio turns unstructured text into claims: news, NOFOs, statutes,
dataset pages, meeting notes, research papers and field reports. Vector RAG retrieves passages
but not facts, so it cannot detect when two sources disagree. A graph of
(Subject, Predicate, Object, Context) quads, where Context is the source, gives agents
deterministic fact lookup, provenance for every claim, and conflict detection. That makes it
the population layer behind §9 (Truth, claims, and human authority).

## The rule
When an agent ingests unstructured text that will feed a claim, a figure, a decision or an
advisor answer, it populates the project's evidence graph with SPOC quads under these
invariants:

| # | Invariant | Enforcement in `spoc_kg.py` |
|---|---|---|
| K1 | **Evidence-bound.** Every quad carries a verbatim quote from its source. | Facts whose quote isn't found in the normalized source text are rejected and logged in `rejections`. |
| K2 | **Context is provenance.** C = `source_id`, linked to URL, title, published date, retrieved date, tier and extractor model. | The `sources` table; the tier must be in the controlled list. |
| K3 | **Controlled vocabulary.** Predicates come from the project's domain profile; anything else is flagged `unmapped` for review. | `PROFILES` (generic, violence, dataset, grants, hazard, workforce, early_childhood). |
| K4 | **Typed objects.** Dates, counts, money and units must match the predicate's type. | `CONSTRAINTS` + `check_constraint`; `revalidate()` re-applies them after rule changes. |
| K5 | **Conflicts are surfaced, never resolved by the model.** Different objects for a single-valued predicate across sources go to a human. | `conflicts()` |
| K6 | **One entity, one node.** Aliases are canonicalized. | The `aliases` table |
| K7 | **The graph is not the record of truth for measured data.** Official datasets stay in their own tables. Quads are for text-derived claims and metadata about datasets. | Doctrine rule |
| K8 | **Tier labels carry through to answers.** Anything that answers from the graph cites the quad's source URL and tier. | Doctrine rule; `query()` returns the tier and URL |

## Workflow (every project)
1. **Pick a profile** (or add a small one) in `PROFILES`. Keep the predicate lists short.
2. **Ingest:** `python spoc_kg.py ingest --db <project>_kg.sqlite --url <url> --tier <TIER> --profile <profile>`.
   The backend can be `ollama` (free and local, llama3.2, as in the article), `openai`
   (any compatible endpoint) or `pplx`.
3. **Review:** `conflicts`, unmapped predicates and `rejections`. Add aliases and adjust
   constraints, then run `revalidate()`.
4. **Use:** advisors query quads first (deterministic), then fall back to passage retrieval,
   and label the result.
5. **Record:** add the ingest counts (kept, rejected, unmapped, conflicts) to the Build Ledger.

## Where it applies (by product)
Product-specific profiles live in the product repos. This list shows intended use only:
- **Community Violence Register:** news and research figures, law effective dates, dataset
  coverage metadata.
- **Grant Path / Pursuits:** NOFO eligibility, deadlines, award ceilings, match requirements.
  Screening facts only, never an eligibility determination.
- **HazardAware / SHIELD-ATLAS:** alert issuers, event times, locations and magnitudes from
  bulletins. Tier OBSERVED vs MODELED is preserved.
- **LineReady:** skills, standards and credential alignment from curricula and job postings.
- **ChildCORE:** program capacity, funding and licensing facts from public reports. Mock or
  illustrative data is never ingested as fact.
- **Texas Minority Business Directory / ThriveUp:** business and organization attributes,
  but only from verifiable sources.

## Known limits (from the first run)
- LLMs pick the wrong predicate for numeric facts (for example, "115 orders issued" filed as
  `reported_homicides`). K4 catches this only for constrained predicates, so extend
  `CONSTRAINTS` as profiles grow.
- Qualifiers are free text. Conflict keys use time and place only, and ignore time for date
  predicates.
- Entity fragmentation (for example, "Colorado" vs "Colorado red-flag law") needs aliases or
  human review.
- Verbatim matching checks that the quote exists in the source, not that it supports the
  fact. Sample and review high-stakes quads.
