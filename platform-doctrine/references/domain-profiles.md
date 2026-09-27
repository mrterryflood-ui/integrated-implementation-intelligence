# Domain profiles

Pick the profile that matches the platform's environment. If none fits, build one (last section) and save it to `docs/domain.md`. A profile tunes feel, imagery, and authority limits. It never overrides truth or human-authority rules.

## Triage triggers apply to every profile

L1 to L4 triggers are domain-specific (ADIS deployment note): the protocol is universal, the triggers are indigenous. Never import them. Define them with the user in `docs/domain.md` before deployment, and stamp every surfaced signal with level, evidence, confidence, and limitations. Examples the constitution itself gives for L1: a child in imminent danger, suicidal ideation or an active self-harm signal, an acute patient crisis, a critical system failure affecting user safety, an active security breach. For a weather or hazard platform the L1 triggers look different from those in foster-care navigation.

## Workforce and 3D training
- **Feel:** a well-lit training bay. Capable, encouraging, unhurried. Big targets, short steps, captions (tablets, gloves, noise).
- **Stakeholders:** learner, instructor, employer, program administrator, funder, safety officer.
- **Visual:** photoreal equipment under real shop lighting. Neutral warm-industrial palette. Safety colors reserved for real safety content.
- **3D viewer:** orbit and zoom with limits, exploded view, x-ray, part hotspots (function, failure modes), scrubbable procedure animation. Measure tool only on dimensionally accurate models. Badge: Vendor CAD / Scan / Illustrative.
- **Assets:** vendor CAD or scans to GLB first. `generate3DModel` or Tripo3D for illustrative visuals. OpenSCAD only for parametric fixtures and jigs, never realistic machines.
- **Flow:** pre-brief → guided walkthrough → no-fail practice → assessed run → credential → next pathway. Automations: recert reminders, instructor alert when a learner stalls, employer notified of a credential only with consent.
- **Safety-critical steps** (lockout/tagout, PPE, guarding) come only from user-supplied SOPs, manuals, or cited regulations, with source and revision date. Flag "SME review required" until confirmed.
- **Truth:** never imply accreditation or employer recognition. Placement and wage figures need a source and date.
- **Measures:** completion, time-to-competency, error hotspots, credential earned, placement.

## Health
- **Feel:** calm, warm, clinical-grade trust. Plain language. Nothing alarming unless urgent.
- **Stakeholders:** patient, caregiver, clinician, community health worker, administrator, researcher.
- **Visual:** natural photography, diverse generated non-identifiable people. Accurate anatomy from licensed or user-supplied sources; if generated, label "Illustrative, not diagnostic" and require clinician review before public release. Red only for urgent states.
- **Behavior:** one idea per screen, saved progress, read-aloud, language options, about 6th to 8th grade reading level, a "why we ask", privacy cues at collection, visible human handoff and escalation path (crisis resources where warranted).
- **Triage:** confirmed child-safety or suicidal-ideation signals are L1: no observation window, immediate human escalation with crisis resources shown, single confirmed source is enough, every action logged. Education waits until after the crisis.
- **Truth:** clinical content only from user-approved cited sources. The UI never diagnoses or prescribes. No real PHI in prompts, logs, screenshots, or samples; use labeled synthetic data. Label EHR-derived data with source and freshness. Screening scores are not diagnoses.
- **Measures:** completion, time-to-care, burden, adoption by role, equity of use.

## Defense, emergency, weather, and hazard operations
- **Feel:** command-center calm. Decisive, answer-first, auditable.
- **Stakeholders:** operator or analyst, decision-maker, planner, administrator, assessor, partners.
- **BLUF:** every primary view opens with a Bottom line card: recommended action, confidence, time available, what would change the answer. Evidence classes, sources, assumptions one level down. Audit trail always available.
- **Visual:** dark default with a high-contrast light option. Map and sensor layers with licensed or user-supplied imagery. Generated scenes carry a persistent SIMULATED banner. Dense tables, keyboard shortcuts, severity triage (acknowledge, escalate, dismiss with reason).
- **Authority:** the system recommends, humans authorize. Fail closed. Failed or stale sources are shown as such, never as "no threat". Show latency and last update. Degraded and offline modes. Research programs (for example a research evidence track) stay isolated from operational alerting and action paths.
- **Never** add classification markings, accreditation, or authority-to-operate claims unless the user supplies them. No weapons-enabling detail.
- **Measures:** time-to-decision, decision quality on review, alert precision, override rate, time-to-correction.

## Finance
- **Feel:** dense, fast, trustworthy, with a Simple view over the same data.
- **Stakeholders:** household planner, family, advisor or coach, administrator.
- **Expert view:** tabular numerals, signed negatives (not color alone), keyboard command bar, split panes, watchlists, sparklines. Live tickers only with a real feed; otherwise Delayed or Sample with timestamp and source. No photography in data panels.
- **Simple view (toggle):** goal first, top three numbers, plain language, glossary on hover, one next step at a time.
- **Planner:** goal → current state → gap → options with tradeoffs → plan → automation → tracking. Money movement needs explicit confirmation.
- **Truth:** projections are Modeled with editable assumptions and ranges. Informational, not personalized advice. Reuse the `stock-analyzer` disclaimer on research outputs.
- **Measures:** goal progress, plan completion, time-to-first-plan, Simple-to-Expert adoption, drop-off by step.

## Building a new profile (grants, community, education, childcare, contracting, and others)
Write and save to `docs/domain.md`, then ask the user to confirm:
1. **Feel** (in feelings, not pixel specs).
2. **Stakeholders** and their decisions.
3. **Visual direction** and asset ladder specifics.
4. **Behavior:** workflow, wand action, automations.
5. **Authority limits:** what only humans decide.
6. **Truth risks:** what could be mislabeled, stale, or fabricated in this domain.
7. **Domain knowledge:** vocabulary, standards, cycles, and sources with dates (feeds the Oracle).
8. **Measures** and review cadence.
