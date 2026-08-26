# Puppy Maker V10 Guided Play & Action-First UX Implementation Plan

Tracking: #204

Baseline: `integration/v3@0ef2dc1d2058d6bb54014dee8288ddcccec6f4f5`
Branch: `work/v10-guided-play-ux`
Design: `docs/superpowers/specs/2026-08-26-puppy-maker-v10-guided-play-action-first-ux-design.md`

## Execution rules

- TDD for every behavior package: test-only RED commit first, observe GitHub Actions failure for the intended missing/incorrect contract, then implement the minimum production change and observe GREEN.
- Preserve V8/V9 router and `MobilePageShell` semantics.
- Do not change save schema, economy/progression formulas, reward calculations, Tactical engine, or create a second navigation reducer.
- UI consumes authoritative selectors/adapters; it does not reimplement domain truth.
- Prefer small new modules/components and narrow edits over rewriting large synthesis files.
- No force push. Promotion is work → integration/v3 → main → production.

## Package A — Guidance Model

### RED
Create `src/v10-guided-actions.test.ts` importing a not-yet-existing `src/guided-actions.ts` and asserting:
- deterministic priority order,
- one primary plus at most two secondary actions,
- duplicate routes avoided when another useful route exists,
- blocked reason is preserved,
- resolution route is optional and never invented.

Run/observe branch CI and require failure attributable to the missing guidance module.

### GREEN
Create `src/guided-actions.ts` with reusable `GuidedAction`, `GuidedActionState`, `GuidedActionRoute`, and `GuidedActionStack` contracts plus a pure stack builder.

Refactor `src/hub-next-action.ts` without changing existing `hubNextAction` behavior:
- collect current authoritative reward/weekly/focus candidates,
- expose a guided Home stack,
- keep `hubNextAction(state)` as compatibility access to the primary action,
- retain a safe schedule fallback,
- do not duplicate reward or progression formulas.

Add/update focused selector tests.

## Package B — Home Command Center and Category Hierarchy

### RED
Add focused component/contract tests proving:
- Home renders one primary action and no more than two secondary actions,
- action labels/details come from guidance data,
- category recommendation is optional and does not hide normal feature navigation,
- route callbacks are existing callbacks rather than direct state mutation.

### GREEN
Add a small reusable `GuidedActionCard` / Command Center presentation component and minimally wire it into `LayeredHome`.

Identify the actual V9 category dashboard component from the repository tree and add one optional recommended-action slot there. Do not create a parallel category shell.

Keep Run Guidance as contextual information rather than a competing primary CTA.

## Package C — Weekly and Prerequisite UX

### RED
Add tests proving:
- all seven Weekly focus choices remain available,
- high-value factual recommendations can appear above the grid,
- recommendation buttons call the same `onSelectFocus` path,
- blocked guidance shows a reason,
- direct prerequisite routing exists only when supplied by authoritative guidance.

### GREEN
Add a pure weekly recommendation adapter using existing factual state signals. Start conservatively: recommend only when the reason is clear enough to state without claiming an unproven optimum.

Update `WeeklyPlannerCard` to render a compact recommendation group above the unchanged seven-choice grid.

Reuse the guided-action blocked/resolution presentation for prerequisite help; never enable a blocked domain action or bypass eligibility.

## Package D — Action and Result Flow

### RED
Identify existing high-value action/result surfaces and add tests for:
- primary action accessibility without long-scroll search on selected action-oriented pages,
- result presentation showing supplied/observed authoritative deltas before totals,
- continuation invoking existing router/domain callbacks,
- Expedition/Tactical return semantics unchanged.

### GREEN
Use existing `MobilePageShell.stickyAction` selectively where a primary CTA is otherwise meaningfully buried.

Add a small result-summary component/adapter that accepts authoritative result or pre/post delta inputs. Do not reproduce reward formulas.

Wire only surfaces with reliable existing result data/context. Where reliable delta evidence is absent, keep authoritative existing result copy instead of guessing.

## Package E — Responsive, Accessibility, and Regression Final Pass

### RED
Add V10 responsive/a11y contract tests covering:
- 360×640,
- 390×844,
- 430px,
- sticky action bottom safe area,
- scroll reachability / no nested vertical scroll trap,
- 44px+ controls,
- visible `:focus-visible`,
- reduced motion,
- long Korean wrapping.

### GREEN
Add the smallest V10 CSS layer necessary and adjust existing V9 classes only where safe.

Preserve one primary page scroll region and existing guarded-play navigation.

## Final Gate

On the exact final source head:
1. V10 targeted suites GREEN.
2. V8/V9/router compatibility GREEN.
3. Tactical/Expedition compatibility GREEN.
4. Full test GREEN with exact file/test counts from CI.
5. TypeScript GREEN.
6. Production build GREEN with actual transformed-module count if emitted.
7. `npm audit` evidence GREEN / exact status.
8. PR review threads clear and Vercel preview inspected.
9. Merge exact source head to `integration/v3` with expected-head guard.
10. Integration CI GREEN.
11. Release PR `integration/v3` → `main` and merge exact integration head.
12. Main CI GREEN.
13. Vercel production READY with `githubCommitRef=main` and exact main SHA.
14. Production root HTTP GREEN.
15. `/api/client-telemetry` GREEN.
16. Runtime fatal/error log inspection GREEN.

If browser automation is unavailable in this environment, do not claim live mobile clicking, scrolling, or screenshots; rely on component/CSS contracts, CI, deployment metadata, HTTP, and runtime logs and state the limitation explicitly.
