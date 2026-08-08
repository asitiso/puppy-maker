# Sanctuary Specialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add permanent Lv.3 sanctuary specializations, derived synergies, bounded gameplay effects, persistence, and Sanctuary UI controls.

**Architecture:** Keep current `starlight-sanctuary.ts` facility upgrades unchanged. Add a focused pure specialization module, persist only the chosen specialization per facility in the top-level `game.ts` meta wrapper, derive synergies/effects, and surface selections through the existing Sanctuary UI bridge.

**Tech Stack:** TypeScript, React, Vitest, Vite, GitHub Actions.

## Global Constraints
- Existing facility upgrade/contract/prestige/weekly chest behavior must remain unchanged.
- One permanent specialization per facility, only after facility level 3.
- No new currency or illustrated asset.
- Invalid/duplicate/conflicting selection returns the exact same state object.
- No affection bonus through balanced training schedules.
- PR #2 remains draft and unmerged.

---

### Task 1: Pure Specialization Domain

**Files:**
- Create: `src/sanctuary-specializations.ts`
- Create: `src/sanctuary-specializations.test.ts`

**Interfaces:**
- Produces: `SanctuarySpecializationId`, `SanctuarySpecializationState`, `sanctuarySpecializations`, `resolveSanctuarySpecialization`, `sanctuarySpecializationEffects`, `sanctuarySpecializationSynergies`.

- [ ] Write tests asserting eight definitions, Lv.3 gate, same-facility mutual exclusion, duplicate rejection, and four pair synergies.
- [ ] Run CI and confirm only the new tests fail because the module is missing.
- [ ] Implement the minimum data model and pure resolvers.
- [ ] Run CI and confirm test/build GREEN.
- [ ] Commit.

### Task 2: Persistent Selection State

**Files:**
- Create: `src/sanctuary-specialization-progression.test.ts`
- Modify: `src/game.ts`

**Interfaces:**
- Consumes: `resolveSanctuarySpecialization()`.
- Produces: `GameState.sanctuarySpecializations` and action `{ type:'SET_SANCTUARY_SPECIALIZATION'; specialization:SanctuarySpecializationId }`.

- [ ] Write tests for legacy hydration to `{}`, sanitizing invalid facility/options, successful Lv.3 selection, conflicting same-facility no-op, duplicate exact same-state no-op, and state preservation across unrelated actions.
- [ ] Confirm RED.
- [ ] Add sanitizer, persistent meta field, action routing, and initial state.
- [ ] Confirm all tests/build GREEN.
- [ ] Commit.

### Task 3: Gameplay Effects

**Files:**
- Create: `src/sanctuary-specialization-effects.test.ts`
- Modify: the smallest existing wrapper layer that owns each affected post-processing path; do not rewrite `game-sanctuary-base.ts` wholesale.

**Interfaces:**
- Consumes: `sanctuarySpecializationEffects(state.sanctuarySpecializations)`.

- [ ] Write RED tests for bounded training, mastery, recovery, outing/gift bond, expedition Journey, weekly token effects, plus synergy bonuses.
- [ ] Verify existing behavior is unchanged when no specialization is selected.
- [ ] Add additive post-processing only after existing base calculations.
- [ ] Verify full test/build GREEN.
- [ ] Commit.

### Task 4: Sanctuary UI Summary

**Files:**
- Create or modify the focused Sanctuary UI summary module already used by the Sanctuary overlay.
- Add/modify its Vitest file.

**Interfaces:**
- Produces per-facility `specializations`, `selected`, `canChoose`, effect labels, and active synergy list.

- [ ] Write RED summary tests for a level-3 selectable facility and a permanently selected facility.
- [ ] Implement summary mapping using pure definitions/effects.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 5: UI Callback and Controls

**Files:**
- Modify: existing Sanctuary overlay component.
- Modify: `src/App.tsx` and `src/Root.tsx` only for the one specialization callback bridge.
- Modify: existing Sanctuary CSS; reuse existing image art.

**Interfaces:**
- App callback dispatches `SET_SANCTUARY_SPECIALIZATION`.
- Sanctuary overlay calls it with a `SanctuarySpecializationId`.

- [ ] Add the callback and render two choices for each Lv.3 unselected facility.
- [ ] Render selected permanent specialization and active synergy block.
- [ ] Keep functional layout CSS only; no decorative CSS art.
- [ ] Run full test/build.
- [ ] Commit.

### Task 6: Final Regression and Delivery Verification

**Files:**
- Modify: PR #2 description only after a verified GREEN head.

- [ ] Query push CI for the exact final SHA and confirm tests and build are successful.
- [ ] Record exact test-file/test counts from logs.
- [ ] Check Vercel status for exact final SHA; claim READY only when exact SHA matches.
- [ ] Update Draft PR #2 scope/verification, keeping it draft/unmerged.
