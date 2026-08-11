# Puppy Maker V2 Core Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the current monthly loop while adding condition, mastery, quality, personality, memories, save migration, and a compact growth report.

**Architecture:** Extend the existing pure reducer/helpers in `src/game.ts`, keep `App.tsx` as the existing flow UI, and surface only high-value state in `LayeredHome.tsx`. Save migration remains backward compatible with `puppy-maker-save`. The fragile Root DOM bridge is replaced only after the V2 state/UI flow is verified.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing CSS/assets.

## Global Constraints

- Preserve `hub -> schedule -> training -> dialogue -> result -> next month -> hub`.
- Preserve existing data and localStorage key.
- PR #1/main must not be merged.
- Use supplied image assets for decorative art; CSS only for layout/simple effects.
- TDD: tests before production behavior.
- Keep commits independently reversible.
- Do not claim build/deploy success without explicit verification.

---

### Task 1: Repository hygiene

**Files:** `.gitignore`, tracked dependency tree

- [ ] Ensure `node_modules/` is ignored.
- [ ] Remove accidentally tracked dependencies without changing manifests/lockfiles.
- [ ] Keep cleanup isolated.

### Task 2: Define V2 state behavior with tests

**Files:** `src/game.test.ts`

- [ ] Add failing tests for legacy/malformed hydration.
- [ ] Add failing tests for condition, quality, mastery, personality bounds, idempotent memories, dialogue effects, growth report, and next-month persistence.
- [ ] Run CI and confirm the new tests fail for missing V2 behavior (RED).

### Task 3: Implement V2 growth engine

**Files:** `src/game.ts`

**Produces:** `hydrateGameState`, quality/condition/mastery helpers, V2 state fields, reducer transitions.

- [ ] Add focused V2 types/defaults.
- [ ] Implement safe hydration/migration.
- [ ] Implement deterministic condition/quality/mastery helpers.
- [ ] Extend `FINISH_TRAINING`, `CHOOSE`, and `NEXT_MONTH` without replacing existing behavior.
- [ ] Award memories idempotently and build `lastGrowthReport`.
- [ ] Run tests and build until GREEN.

### Task 4: Surface growth feedback

**Files:** `src/App.tsx`, `src/LayeredHome.tsx`, existing CSS files

- [ ] Expand the existing result screen with grouped quality, improvement, mastery, personality, and at-most-one new-memory feedback.
- [ ] Add compact condition/recommendation information to LayeredHome without adding a dense permanent panel.
- [ ] Replace practical hard-coded home values with live state where existing interfaces allow.
- [ ] Keep vertical-phone readability and existing artwork hierarchy.
- [ ] Run tests/build.

### Task 5: Explicit home bridge

**Files:** `src/Root.tsx`, related tests/components only as needed

- [ ] Add a regression test for returning to layered home after next month.
- [ ] Replace MutationObserver/querySelector bridge with explicit shared screen-state integration.
- [ ] Verify full monthly flow before removing the old bridge.
- [ ] Run tests/build.

### Task 6: Final verification

- [ ] Verify `npm run test`.
- [ ] Verify `npm run build`.
- [ ] Verify layered home -> schedule -> training -> dialogue -> result -> next month -> layered home.
- [ ] Verify mobile overlap/cropping on preview.
- [ ] Verify Vercel deployment is READY.
- [ ] Leave PR #1 open and unmerged.
