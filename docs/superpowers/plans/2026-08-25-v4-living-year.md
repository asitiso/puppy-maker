# V4 Living Year Implementation Plan

> Execute inline in the single control-tower room. Use TDD for each behavior change and verification-before-completion before promotion.

**Goal:** Add a real four-week life-simulation cadence, weekly focus/events/NPC presence, and one authoritative Home next-action selector while preserving all V3 engines and old saves.

**Baseline:** `9b8715caa12e0f9cc5c989fc9f2c714bc4f0b6ce`

## Task 1 — Pure weekly contracts

Files:
- create `src/weekly-calendar.ts`
- create `src/weekly-calendar.test.ts`
- create `src/weekly-life.ts`
- create `src/weekly-life.test.ts`

Steps:
- RED tests for canonical week keys, 1→2→3→4→month/year rollover, malformed hydration, focus validation, deterministic event identity, one-shot event keys, bounded event effects.
- Implement pure calendar/life helpers only.
- Targeted GREEN.

## Task 2 — Living NPCs and Home selector

Files:
- create `src/living-npcs.ts`
- create `src/living-npcs.test.ts`
- create `src/hub-next-action.ts`
- create `src/hub-next-action.test.ts`

Steps:
- RED for campaign representative NPCs, NG+/True Lyra, Hollow Veyr, shared-world weekly rotation.
- RED selector priority: reward → completed week → choose focus → selected focus → schedule fallback.
- Implement without UI duplication of domain rules.
- Targeted GREEN.

## Task 3 — Integrate weekly state into authoritative game reducer

Files:
- modify `src/game.ts`
- create `src/v4-living-year-game.test.ts`

State:
- additive `weeklyLife` state with safe hydration defaults.

Actions:
- `SELECT_WEEKLY_FOCUS`
- `COMPLETE_WEEKLY_FOCUS`

Rules:
- completion requires a valid current-week focus;
- event/consequence applies once;
- weeks 1–3 increment week and reset weekly keys without changing month;
- week 4 delegates through existing month transition so month/season/archive rewards run once;
- NEW_RUN resets weeklyLife;
- legacy actions remain supported.

## Task 4 — Make existing weekly systems observe the real clock

Files:
- create `src/v4-weekly-boundaries.test.ts`
- only modify existing reducers if tests prove stale-progress leakage.

Cover:
- Weekly Directive new key
- Astral Rift weekly new key
- Convergence weekly new key
- reload on week boundary
- month/season boundary

Use minimum fixes; do not redesign Season/Astral systems.

## Task 5 — Weekly Planner UI and authoritative CTA

Files:
- create `src/WeeklyPlannerCard.tsx`
- create `src/weekly-planner-ui.test.tsx`
- modify `src/LayeredHome.tsx`
- modify `src/App.tsx` / `src/Root.tsx` only as required for callbacks
- modify `src/layered-home.css`

UI:
- show date, focus, living NPCs, event teaser
- focus choices before resolution
- completion/advance affordance
- primary CTA from `hubNextAction`
- 44px controls, wrapping, reduced motion, 360/390/430 safety.

## Task 6 — Persistence and soak

Files:
- create `src/v4-living-year-persistence.test.ts`
- create `src/v4-living-year-soak.test.ts`

Cover:
- old V3 save → V4 defaults
- malformed focus/key/event sanitation
- save/load/save idempotency
- 12+ consecutive weekly completions
- December/year rollover
- NEW_RUN reset
- normal → NG+ → True/Hollow state compatibility
- no duplicate weekly consequence.

## Task 7 — Backlog closure evidence

- Close #47 only after normal player-facing week 1→2→3→4 path and boundary tests are GREEN.
- Close #50 only after LayeredHome consumes `hubNextAction` and no local duplicate primary priority remains.
- Keep unrelated backlog open.

## Task 8 — Full Release Gate

Run fresh branch/PR CI:
- deterministic `npm ci`
- `npm audit --audit-level=high`
- full test suite
- Tactical AUTO 10/50/100 and Expedition stress via existing full suite
- V3 Campaign/NG+/True/Hollow regressions
- V4 12+ week soak/persistence/mobile/a11y
- `tsc -b && vite build`

Then:
- verify Vercel preview READY
- root 200
- `/api/client-telemetry` 200
- no preview runtime error/fatal
- exact tested tree → `integration/v3`
- fresh release PR/CI against `main`
- exact tree → `main`
- production root 200, telemetry API 200, error/fatal 0
- close #186 as completed.
