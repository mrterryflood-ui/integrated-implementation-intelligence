# ISS-EBEAS v1.1 experience primitives

## Purpose and scope

These components extend an existing React application's experience layer. They do not change authentication, authorization, data retention, routing, business logic, tenant ownership, native permissions, or deployment authority. An existing design-system component with equivalent verified behavior should be reused instead of adding a parallel implementation.

Production consumers copy `src/components/iss-hig/Primitives.tsx` and `styles/iss-hig-tokens.css`, import the stylesheet once, and wrap the current application content in `IssExperienceProvider`. Preserve the current auth, error, router, theme and data providers. The component stylesheet uses plain semantic classes rather than Tailwind-version-dependent arbitrary-opacity syntax. Existing Tailwind is compatible but not required.

The original component API is retained except `privacyGuarantee`, which becomes `privacyExplanation`: the UI must accurately explain actual collection, use, access and retention. An interface cannot promise privacy or zero trust merely by displaying text.

## Existing dependency boundary

The production component uses React and the existing `framer-motion` import path. The isolated verification fixture tests React 18.3.1 / framer-motion 12.23.24. Its test-only package and lockfile are not a replacement for any product's package/lockfile.

A fresh resolution of framer-motion 12.23.24 originally pulled motion-dom 12.43.0, which no longer exported `activeAnimations`; bundling failed. The fixture explicitly pins the matching motion-dom 12.23.23 and motion-utils 12.23.6. Preserve and test each product's own known-good locked dependency graph; do not install unpinned new dependencies across repositories.

## Consumer example

```tsx
import './styles/iss-hig-tokens.css';
import { IssExperienceProvider } from './components/iss-hig/Primitives';

// Inside the existing application providers; keep identity and routing unchanged.
<IssExperienceProvider>{existingApplication}</IssExperienceProvider>
```

Use `SpatialCard` for a semantic section with a correctly ranked heading, `NarrativeEmptyState` to explain the next useful action, and `PermissionPrimerSheet` only when the permission workflow needs contextual explanation. Components do not verify editorial accuracy or enforce the number of primary actions elsewhere in the application.

## Permission workflow

1. An explicit feature action identifies why a capability is useful.
2. Prefer a contextual OS request. Apple permits a custom pre-alert when extra explanation is essential; it should have one button such as Continue leading to the system alert.
3. For that essential native case use `mode="native-essential"`. Keep optional feature choices outside the pre-alert. The mode exposes one Continue button; a request failure changes it to a single recovery/close action.
4. `mode="web-optional"` offers a contextual web explanation with Not now and Continue. This is not asserted to be a native App Store pre-alert.
5. `onGrant` runs synchronously inside the click handler, before any await or animation, so the caller can preserve transient browser user activation. Rendering or opening the sheet never requests permission.
6. The consumer calls the actual API or native bridge and handles actual granted, denied, unsupported and revoked states. Returning/resolving the handler does not mean permission was granted. Callers close the controlled sheet by updating `isOpen`.
7. A rejected request exposes an error, keeps a recovery path and does not report successful consent. No browser permission/API capability, native application or store package is created by these primitives.

The modal uses `HTMLDialogElement.showModal` for native top-layer placement, inert background. An explicit Tab loop keeps forward/reverse navigation within the enabled action controls, with the heading as a focus anchor when the only button is pending. Initial focus and trigger restoration are explicit. Escape invokes the controlled dismissal handler. Unique `useId` values bind each title and description. Unsupported browsers display an explanatory error and dismissal action rather than requesting permission without the explanation.

## Accessibility and rendering

- Buttons are at least 44 × 44 CSS pixels with wrapping labels and visible keyboard focus.
- Typography uses rem units and document-appropriate heading levels; the provider sets a body-text floor of 15px and no supplied label token is below 13px at the default 16px browser root.
- Separate button-background/foreground tokens correct the original dark-theme white-on-blue contrast failure.
- Motion is conditional on `useReducedMotion`, including hover/tap. CSS also disables shared-component transforms, animations and transitions under `prefers-reduced-motion`.
- Springs are critically/overdamped by the declared physical parameters; they are visual defaults, not measured frame-rate guarantees.
- Glass has an opaque fallback and explicit reduced-transparency, increased-contrast and forced-colors treatment.
- The existing theme owner selects `.dark` or `data-iss-theme="dark"`; this package does not replace the application's saved/system-theme preference logic.

These properties support accessibility. They do not certify WCAG conformance, dynamic type across native platforms, actual screen-reader behavior, readability on every background, or the full application's task experience.

## Verification and outstanding acceptance

Historical local preparation results (before canonical adoption):

- `npm run typecheck`: PASS, zero TypeScript errors.
- `npm run build:fixture`: PASS after correcting the fixture-only transitive dependency mismatch.
- `npm run test:dom`: PASS, eleven React lifecycle, control-flow and explicit Tab-handler tests; exact cases in `tests/dom-receipt.json`.
- Numeric contrast checks: see `tests/contrast-receipt.json` for declared token pairs. These are not rendered/composited browser measurements.

Browser verification history and current component evidence:

- `npm test` runs a real Chromium fixture including light/dark axe scans, tab containment, background inertness, Escape/trigger restoration, actual user activation, duplicate-request prevention, native pre-alert button count, mobile/reflow, reduced motion and forced colors.
- During local preparation, Chromium launch failed before any browser case because that execution environment denied the required process-singleton socket (`Operation not permitted`). The Playwright CDN also returned an invalid archive. That local attempt established no browser, screenshot or native inertness pass. The browser receipt records setup/assertion failures as FAIL, never PASS.
- Run the suite in authorized CI using `ISS_TEST_CHROMIUM=/path/to/chromium` when a system browser is used; otherwise omit that variable and use the Playwright-managed browser. Install browser dependencies through the existing CI process.
- Initial hosted attempts on candidate `aad9603f138fd0920a9cb0a614d0ddd95bae64b6` reached Chromium but failed the first contrast scan during an entrance animation. The scan now waits for actual opacity/transform settlement; no contrast rule is disabled. Forward and reverse Tab containment are both asserted. The subsequent hosted run below verified these corrections within the synthetic component fixture.
- At candidate `d231c7e4d3522daca1dfc3b2d0ef55246f52fede`, [hosted run 44298349350](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/44298349350) passed 11 DOM/control-flow cases, 12 numerical contrast pairs and 14 real Chromium cases, with [revision-bound receipts](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/44298349350/artifacts/14424677840). The [canonical adoption record](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/d1182ce3dcb7eff94929334142d7e9006ecac4f3/docs/engineering/ISS-EBEAS-ADOPTION-2026-11-18.md) records this later evidence. These are synthetic component results; they do not establish whole-product, actual-user, clinical, native-store or production acceptance.
- Receipts observe the actual checked-out Git HEAD. Partial source snapshots explicitly report Git revision unavailable and retain file hashes; a pull request event merge SHA is not substituted for the tested head.
- Each integrated application still needs its exact-revision build, relevant user journeys, keyboard/screen-reader/mobile checks, store/privacy artifact validation, three actual unassisted first-time users per primary persona, and deployment receipts. Performance budgets require measured device/network/workload-specific evidence.

## Authoritative design references

- Apple Human Interface Guidelines, Privacy: https://developer.apple.com/design/human-interface-guidelines/privacy
- WAI-ARIA Authoring Practices, Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Motion accessibility guidance: https://motion.dev/docs/react-accessibility
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

## Policy receipt

Loaded canonical `AGENTS.md` at blob `d0d0e4bddc0c43dcfc00b1ce737a1e8c4c0d0514`, IRON-ENG-001 v1.0.0 at blob `00e0b3d8583c4248743518e403bc5d4598c1cfe4`, and stack-agnostic inquiry protocol v0.1.0 at blob `f2aa0492a27a201bdddf05fc4e0c63d945aefe5d` from `mrterryflood-ui/integrated-implementation-intelligence`. These policy-source receipts describe the original preparation. Canonical source adoption and independent exact-revision review were subsequently recorded in [PR #99](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/pull/99), merged as `d1182ce3dcb7eff94929334142d7e9006ecac4f3`. Product-specific integration, production deployment, native-store acceptance and actual-user outcomes still require their own evidence; this package does not establish them.
