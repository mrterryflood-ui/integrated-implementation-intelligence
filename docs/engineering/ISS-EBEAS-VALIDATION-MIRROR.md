# ISS-EBEAS: agnostic validation and mirror contract

**Version:** 1.1.0-evidence.3-validation. **Owner:** Terry Flood; implementation and independent verification roles are recorded per candidate. **Date:** November 23, 2026 (America/Chicago). This extends IRON-ENG-001 v1.0.0 and ISS-EBEAS without changing release, privacy or human-authority boundaries.

## Purpose and scope

The same evidence rules govern the same observable behavior across languages and platforms. ATLAS may exercise a TypeScript API and server-rendered or React view; EVERLINK may exercise Python services, Rust/Wasm cryptography and a browser view. Each keeps its existing runtime, interfaces, ownership and deployment. No shared React component, vendor, radio, database or computer becomes a universal product dependency.

The minimum supported journey remains explicit. An optional gateway, radio, sensor or power controller may extend that journey, but its absence must not falsely disable unrelated prepared local work. A prepared local message is useful work; delivery requires an available and authorized communication path. A test fixture does not establish a phone-only network, radio range or field operation.

## Validation inputs and evidence

For the new interpretation, declare `traceability.validationInputs` as a nonempty list of repository-relative paths to applicable tests, workflows, dependency locks and build/configuration files. The gate additionally inventories source roots, the root manifest, schema, its own tool directory, configured E2E suite, checklist and signer workflow. All file formats are hashed as raw bytes. Recognized-language heuristic scanning remains separate. A v3 Rust-only, Go-only or unfamiliar-language root is inventoried without pretending the heuristic understood it: zero recognized files reports `NOT_EVALUATED_NO_RECOGNIZED_FILES`. The all-format gate still rejects a truly empty source root. Legacy interpretations keep their existing source-scanner behavior.

`G4-VALIDATION-INPUTS` reports selected input paths, file count, exclusions and `validationDigest`. Missing, empty, unsafe or explicitly excluded required inputs fail. A directory containing only generated/dependency exclusions cannot pass as a test suite. Legitimate nested empty files remain in the inventory. Evidence and output files must not be included in their own source digest. Existing bounded-read and link protections remain in force.

The producer records the digest of the frozen inputs used for the result in `evidence.validationDigest`. Evidence and release gates recompute it and require an exact match. Changing a test, workflow, lockfile, schema, validator or unfamiliar source file invalidates the prior inventory. This check does not execute those inputs, interpret every language or authenticate a claim. A clean Git commit and verified provenance retain their separate roles. Recompute evidence after an applicable source change; do not update a digest while reusing results from different code.

Historical `evidence.1` and `evidence.2-static` receipts retain their original scope. They do not gain the new inventory by changing a version label. The existing anonymous/read-only WEB_STATIC boundary remains intact, including its applicability and release obligations.

## Mirror integrity

The canonical source is `mrterryflood-ui/integrated-implementation-intelligence`. Each adopted kit carries `tools/iss-ebeas/origin.json` with its canonical parent, interpretation and file digests. Run:

```sh
node tools/iss-ebeas/mirror-integrity.mjs
node --test tools/iss-ebeas/gate.test.mjs
```

The first command verifies recorded tool, schema and governing-document bytes. The second executes shared positive, negative, tampering, static-scope and inventory regressions. Match the complete origin file to the independently inspected canonical candidate when synchronizing mirrors; a locally editable hash list is not an authenticated update channel. Both commands remain unsigned local checks. Preserve separate signed provenance, independent review and authorized release gates.

Every mirror update must retain newer compatible canonical controls and run its repository's actual adapter/flow tests. Do not overwrite a more mature consumer with an older sample, import unrelated branches or infer adoption by other agents/products from this document.

## Cross-platform acceptance matrix

| Required invariant | Test at the actual changed boundary | Evidence limit |
| --- | --- | --- |
| Unknown differs from measured zero | Missing/invalid queue, power and health inputs remain unknown through API projection and rendered view. A measured zero remains zero. | Configuration, database record counts and refresh time are not sensor measurements or durable queue evidence. |
| Current availability is honest | Interrupt the transport while a higher-level object remains open; check availability, composing, sending and recovery. | A constructed channel is not an available peer; a software simulation is not RF validation. |
| Delivery stages remain separate | Exercise local persistence, transport submission, recipient persistence and authenticated acknowledgment independently; inject late and duplicate receipts. | Local save, send, relay acceptance, recipient receipt and human acknowledgment are distinct. |
| Provenance survives the full path | Exercise producer, registered response shape, consumer and display. Check missing, stale, conflicting and explicitly simulated input. | A display fixture with fields absent from the real response cannot close integration. |
| Failure is observable and bounded | Test startup, denied/unavailable inputs, interruption, retry and recovery without invoking unrelated consequential actions. | Empty, skipped, cancelled, timed-out and unstarted checks are not passes. |
| Evidence matches the tested version | Bind code, tests, configuration, logs, environment, commands and declared exclusions; challenge byte drift. | A digest is integrity metadata; only an executed test supplies an observed result. |
| Mirrored controls remain equivalent | Verify canonical file digests and execute the shared suite in each adopting repository, plus native adapter tests. | A shared version string proves no equivalence or deployment. |
| Physical and human claims have separate instruments | Retain device, phone, RF, power, accessibility/user and field trial records with actual equipment and conditions. | Synthetic permutations, assertions and modeled combinations cannot become field reliability percentages or a TRL claim. |

## Handoff, closure and sustainment

Record requirement, observed failure, root-cause alternatives, smallest correction, owned files, exact source, commands/results, independent findings, residuals and rollback. Builder and verifier are distinct roles; a provider quota or unavailable runner does not waive review. Repair the actual producer-to-consumer seam when a fixture misses it, retaining both the missed case and regression.

Close implementation, local verification, hosted CI, independent review, merge, deployment, device/field qualification and outcome measurement separately. Every material remaining gate needs an owner and the next observation that would resolve it. Repository maintainers own drift monitoring and rerun affected checks when contracts, dependencies, supported runtimes or evidence producers change. Terry retains consequential release and mission authority. Rollback is a reviewed revert of the scoped candidate, preserving failure and correction records.
