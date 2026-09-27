# Provenance

This repository is the canonical home of Integrated Implementation Intelligence (III).
Every file here was copied from a product lineage on **2026-09-27**. This record states
where each artifact came from so the canonical copy can be distinguished from the
product-local copies it supersedes.

| Canonical path | Source lineage | Source path | Notes |
| --- | --- | --- | --- |
| `doctrine/integrated-implementation-doctrine.md` | HazardAware (newest doctrine text) | `hazardaware/docs/integrated-implementation-doctrine.md` | The full doctrine text (971 lines). HazardAware carries the newest lineage as of 2026-09-27. |
| `doctrine/integrated-implementation-intelligence.md` | HazardAware (newest doctrine text) | `hazardaware/docs/integrated-implementation-intelligence.md` | The III skill text (470 lines). |
| `platform-doctrine/SKILL.md` | LineReady (packaged form) | `lineready/attached_assets/platform-doctrine_1789862589945.zip` | The installable single-master-doctrine skill (ADIS triage, Preflight, C1–C9 invariants, Build Ledger). Packaged 2026-09-19. |
| `platform-doctrine/references/*` | LineReady (packaged form) | same zip | ADIS-AAP technical report, ADIS constitution v2 (JSON), DIS doctrine, domain profiles, audit notes, open items. |
| `platform-doctrine/templates/*` | LineReady (packaged form) | same zip | Build Ledger and Situation Model templates. |

## Rules of the canonical repo

1. **This repo is the source of truth.** Product-local copies (HazardAware docs,
   LineReady's attached zip, any skill checkout) are distributions. When the doctrine
   changes, it changes here first and propagates outward.
2. **No product-specific content.** The doctrine stays product-neutral; product
   doctrine deltas live in the product repos, not here.
3. **Changes are pull requests with a stated lineage reason.** Follow the doctrine's
   own amendment rules (see the ADIS constitution in `platform-doctrine/references/`).
4. **Dates are load-bearing.** When updating a file, update this table and the date
   of record for that artifact.

## Open items

- The product lineages have drifted in ways not yet reconciled here; see
  `platform-doctrine/references/OPEN-ITEMS.md` for known open questions carried
  from the packaged form.
- The Doctrine-Enforcer (ADIS Enforcer) repo executes invariants against code;
  this repo defines them. Keep invariant wording changes here synchronized with
  the Enforcer's detectors.
