# V3 Expanded Polish / Release Readiness Design

**Status:** Approved C scope / single-room execution

**Authoritative baseline:** `integration/v3@542d1746fb4253a25222435e798d90c189df4d52`

## Goal

Make V3 feel materially more complete, readable, responsive and replayable while hardening persistence, long-run behavior, production reproducibility and release confidence. This Wave improves the existing game; it does not create V4.

## Product principles

1. **Polish existing systems before adding systems.** Reuse `campaignRun`, `worldHistory`, `characterBonds`, `legacy`, Tactical, Season and the current presentation surfaces.
2. **Semantic player information only.** Never expose raw affinity, danger scores, hidden thresholds, internal tiers or Legacy power calculations.
3. **Returning players should know what to do next within one screen.** Home must summarize the current route/season, recent meaningful result and the next useful action without modal spam.
4. **Repetition should preserve meaning, not friction.** NG+, True and Hollow repeat runs keep intended echoes while reducing redundant navigation and duplicate actions.
5. **Mobile is the primary constrained layout.** 360/390/430 widths, 9:16 height, safe areas, 44px targets, keyboard/focus behavior, Korean wrapping and reduced-motion remain hard requirements.
6. **Hardening is evidence-driven.** Save/runtime production changes occur only when a RED regression proves a gap.
7. **Release must be reproducible.** Clean install, tests, typecheck/build and the final tested Git tree must agree.

## Architecture

No new persistent subsystem is introduced. The existing authoritative state split remains:

- `campaignRun`: current-run campaign/route/season/danger/world/tactical authority
- `characterBonds`: current Character Bond authority
- `worldHistory`: current and inherited world records
- `legacy`: compact cross-run history/echoes

Expanded Polish adds a **pure derived presentation layer** for run guidance. It reads `GameState` and returns semantic display data only. The view does not mutate progression and is therefore safe across save migration and NG+.

A compact `RunGuidanceCard` is integrated into `LayeredHome` so first-run, active-run, returning-run and completed-run states all have a clear next-step summary. Existing Fifth/Hollow hubs keep their own route-specific presentation; the new guidance layer only provides the shared home-level context.

Persistence and long-run safety are strengthened primarily through regression/soak tests. Production state/sanitizer changes are permitted only for a reproduced failure.

## Player experience expansion

### Home guidance

The home surface gains a semantic guidance card with four modes:

- `first_run`: Spring has just begun; explain the immediate loop without exposing affinity thresholds.
- `active_run`: show campaign label, season label and route tone with the next meaningful action.
- `returning_run`: when Legacy already contains prior runs but the current run is early, acknowledge the new possibility and summarize the latest run result.
- `ready_for_new_run`: after a completed run, make the new-run transition obvious and show the most recent semantic outcome.

The card may show campaign/season/route labels and recent ending/career/world outcome text already available in semantic archives. It must never show hidden scores or thresholds.

### Campaign and route identity

Existing normal campaigns retain their established names and tone. `true_path` and Hollow use distinct semantic labels and emphasis, but do not change authoritative campaign/route state. Presentation classes are derived from public route/campaign identity.

### Feedback states

Shared surfaces should have intentional wording for locked, unavailable, completed and recoverable states rather than silent/blank presentation. New copy remains short and action-oriented.

### Small content additions

Small event/dialogue/presentation additions are allowed only when they reuse an existing trigger/action/state transition. They cannot introduce a new reward ledger, progression track, campaign or combat mechanic.

## Repeat-play QoL

- Prefer a clear current objective and recent result summary over extra clicks.
- Duplicate final actions, rewards, endings and NEW_RUN remain idempotent.
- Re-entry/reload must return to the correct semantic state without replaying one-shot presentation.
- Current-run danger/world/tactical state remains separate from inherited echoes.

## Persistence hardening

A dedicated Expanded Polish persistence suite will cover:

- malformed and partially missing V3 persistent objects
- duplicate evidence/history/echo data where sanitizers already define canonical behavior
- NaN/Infinity numeric contamination
- save → hydrate → save idempotency
- current/inherited separation through repeated NEW_RUN cycles
- completed True/Hollow run → reload → NEW_RUN behavior
- immediate second NEW_RUN no-op

No save schema expansion is required for the guidance UI because it is derived from existing state.

## Performance and production

Performance work is conservative and measurable by structure/build output:

- do not add memoization or lazy-loading unless an actual render/bundle hotspot is identified
- keep the new guidance derivation pure and small
- avoid duplicating large archived state into presentation state
- production build must remain successful and bundle/module output recorded

Reproducibility:

- CI uses the lockfile with `npm ci` rather than floating installation behavior
- package manifest/lockfile consistency is required
- dependency/security warnings are investigated from actual install logs; no blind major upgrades
- production routing/assets/error fallback are checked against the existing Vite/Vercel configuration

## Soak and release gate

The final soak covers the existing game rather than inventing a parallel simulation:

- all four normal campaigns
- NG+ transition
- Fifth/True
- Hollow accept/refuse and ending
- repeated save/reload/re-entry
- multiple NEW_RUN cycles
- Tactical stability and AUTO 10/50/100
- Expedition stress
- Season/meta regression
- mobile/accessibility regression

## Scope guard

Allowed: UX, presentation, semantic guidance, small existing-trigger events/dialogue, repeat-play QoL, save/runtime hardening, performance, dependency/security hygiene and production readiness.

Requires a separate approval: a new campaign, replacement combat engine, new major economy, new major meta system or any large subsystem that changes the V3 architecture.

## Release success criteria

Expanded Polish is complete only when:

1. new guidance/UX tests are GREEN;
2. persistence and soak suites are GREEN;
3. existing normal/NG+/True/Hollow/Tactical/Season/mobile regressions remain GREEN;
4. clean install succeeds from the committed lockfile;
5. full tests and `tsc -b && vite build` are GREEN;
6. security warnings are either safely resolved or explicitly classified with a non-runtime justification;
7. exact tested tree is recorded;
8. `integration/v3` advances exactly once, non-force, to the verified Release Candidate tree;
9. `main` and production remain untouched until separately authorized.
