# Bond, Collection, and Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Connect affection, memories, skills, mastery, and fixed achievement rewards into the existing layered-home quest/bond surfaces.

**Architecture:** Keep all progression rules as pure helpers in `src/game.ts`; persist only claimed achievement ids. `App` remains the owner of reducer state and exposes a narrow achievement-claim callback to `Root`, which passes it to `LayeredHome`. Existing popup art is reused; dynamic quest/bond rows are code-rendered.

**Tech Stack:** React, TypeScript, Vitest, Vite, localStorage.

## Global Constraints
- Work only on `feat/v2-core-growth`; no merge.
- No new permanent navigation tab or currency.
- Reuse existing popup/button image assets; no CSS-drawn decorative replacement art.
- Preserve monthly flow and legacy saves.
- TDD for progression behavior.

---

### Task 1: RED tests for relationship, collection, achievements

**Files:** `src/game.test.ts`

- [ ] Add relationship rank boundary tests.
- [ ] Add collection count tests.
- [ ] Add achievement eligibility tests.
- [ ] Add valid/duplicate/ineligible claim tests.
- [ ] Add hydration tests for `claimedAchievements`.
- [ ] Add first-skill and close-bond memory tests.
- [ ] Commit failing tests as `test: define bond collection achievement progression`.
- [ ] Verify CI fails only for missing new behavior.

### Task 2: Game engine implementation

**Files:** `src/game.ts`, `src/game.test.ts`

- [ ] Add `RelationshipRank`, `AchievementId`, `AchievementDefinition`.
- [ ] Add `relationshipRank`, `collectionProgress`, `eligibleAchievements` helpers.
- [ ] Add `claimedAchievements` state and hydration.
- [ ] Add `CLAIM_ACHIEVEMENT` reducer action with fixed rewards and idempotency.
- [ ] Add `first_skill` and `close_bond` memories exactly once when conditions first occur.
- [ ] Preserve random-event/skill report behavior.
- [ ] Verify all tests and build pass.
- [ ] Commit as `feat: add bond collection and achievement progression`.

### Task 3: Dynamic layered-home integration

**Files:** `src/App.tsx`, `src/Root.tsx`, `src/LayeredHome.tsx`, `src/home-panels.ts`

- [ ] Expose a narrow claim callback from `App` to `Root`.
- [ ] Pass `onClaimAchievement` to `LayeredHome`.
- [ ] Convert quest panel rows to state-driven achievements with claim/completed states.
- [ ] Convert bond button to preserve pet reaction and open relationship summary panel.
- [ ] Show relationship label in existing home dialogue without adding a new screen.
- [ ] Keep all other panels unchanged.
- [ ] Verify test/build CI.
- [ ] Commit as `feat: connect bond and achievement progress to layered home`.

### Task 4: Regression/deploy verification

- [ ] Verify monthly loop regression remains green.
- [ ] Verify duplicate reward cannot be claimed.
- [ ] Verify latest GitHub Actions run succeeds.
- [ ] Verify latest Vercel preview deployment reaches READY and matches head SHA.
- [ ] Review PR diff for unrelated scope or merges.