# Starlight Sanctuary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a permanent four-facility home-base progression system that spends accumulated gold and expedition materials while providing small bounded bonuses to raising and expedition play.

**Architecture:** Keep all Sanctuary definitions, costs, requirements, sanitization, and effect derivation in `src/starlight-sanctuary.ts`. Persist only facility levels in `GameState`; derive all bonuses at use sites. Integrate upgrades in the top-level `game.ts` wrapper and expose a dedicated home overlay through the existing App → Root callback bridge.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing reducer/localStorage architecture.

## Global Constraints

- Preserve the existing save key and all legacy saves safely.
- Do not modify or depend on `feat/season-legacy-v1` / PR #3 implementation details.
- Facility levels are permanent and irreversible in v1.
- No new premium currency, timers, daily chores, random construction failure, or respec flow.
- Regional renown is a gate only and is never consumed.
- Invalid, duplicate, unaffordable, or max-level upgrades return the same state object.
- Effects are bounded and additive.
- Reuse existing panel artwork; do not draw ornamental game art with CSS.
- Keep PR #2 draft and unmerged.
- Do not claim CI/build/deploy success without fresh verification.

---

### Task 1: Sanctuary domain and upgrade quotes

**Files:**
- Create: `src/starlight-sanctuary.ts`
- Create: `src/starlight-sanctuary.test.ts`

**Produces:**
- `SanctuaryFacilityId`
- `SanctuaryLevel`
- `SanctuaryLevels`
- `sanctuaryFacilities`
- `emptySanctuaryLevels()`
- `sanitizeSanctuaryLevels(raw)`
- `resolveSanctuaryUpgrade(input)`
- `sanctuaryEffects(levels)`

**Costs:**
- Training Hall: L1 500G + 3 star bark; L2 900G + 5 star bark + 2 wind pearl; L3 1600G + 7 star bark + 3 arcane shard + 3 wind pearl, starlight forest renown >= 3.
- Archive Library: L1 500G + 3 arcane shard; L2 900G + 5 arcane shard + 2 star bark; L3 1600G + 7 arcane shard + 3 star bark + 3 wind pearl, ancient city renown >= 3.
- Herb Garden: L1 450G + 3 wind pearl; L2 800G + 4 wind pearl + 2 star bark; L3 1400G + 6 wind pearl + 3 star bark + 3 arcane shard, wind lakes renown >= 3.
- Observatory: L1 600G + 2 of each material; L2 1100G + 4 of each; L3 1800G + 6 of each, all three regional renown >= 3.

- [ ] Write failing tests for safe empty levels, malformed level clamp, valid L1 quote, insufficient resources, L3 renown gate, max-level rejection, and bounded effects.
- [ ] Verify RED because `starlight-sanctuary.ts` does not exist.
- [ ] Implement the pure domain exactly to the contracts above.
- [ ] Verify tests/build and commit.

### Task 2: Persistent state and upgrade reducer

**Files:**
- Create: `src/sanctuary-progression.test.ts`
- Modify: `src/game.ts`

**Consumes:** `resolveSanctuaryUpgrade`, `sanitizeSanctuaryLevels`.

**Produces:**
- `GameState.sanctuaryLevels`
- action `{ type:'UPGRADE_SANCTUARY'; facility:SanctuaryFacilityId }`

- [ ] Write failing hydration tests: missing field → all zero, malformed values clamp to 0-3.
- [ ] Write failing reducer tests: exact gold/material deduction, duplicate/max/insufficient returns same object, L3 renown gate.
- [ ] Verify RED.
- [ ] Add state/action/hydration/preservation and upgrade reducer in the top wrapper only.
- [ ] Verify tests/build and commit.

### Task 3: Training Hall, Library, and Garden effects

**Files:**
- Create: `src/sanctuary-effects-progression.test.ts`
- Modify: `src/game.ts` or a thin new wrapper if touching existing branches risks regressions.

- [ ] Add failing test that Training Hall changes only completed-month growth by the bounded 1/2/3% level effect.
- [ ] Add failing test that Library L2 gives +1 mastery XP only for A/S months and L3 gives +1 on any completed month without stacking an extra second point.
- [ ] Add failing test that Garden adds monthly rollover recovery according to level with normal stat clamps preserved.
- [ ] Verify RED.
- [ ] Apply bonuses as additive post-processing after the existing monthly result calculation.
- [ ] Verify existing monthly progression/economy tests plus new tests and build.
- [ ] Commit.

### Task 4: Observatory expedition effect

**Files:**
- Extend: `src/sanctuary-effects-progression.test.ts`
- Modify: `src/game.ts`

- [ ] Add failing tests for +1/+2/+3 Season Journey points on successful expedition at Observatory L1/L2/L3.
- [ ] Add regression test that failed/rejected expedition gets no bonus.
- [ ] Verify RED.
- [ ] Add the bonus after the existing expedition Journey score but before tier crossing is finalized, so newly crossed tiers still pay once.
- [ ] Verify expedition/world/live-ops tests and build.
- [ ] Commit.

### Task 5: Sanctuary UI summary and overlay

**Files:**
- Create: `src/sanctuary-ui.ts`
- Create: `src/sanctuary-ui.test.ts`
- Create: `src/SanctuaryOverlay.tsx`
- Create: `src/sanctuary.css`
- Modify: `src/App.tsx`
- Modify: `src/Root.tsx`

**Produces:**
- `sanctuaryUiSummary(state)` with facility level, next cost, affordability, renown requirement, and current/next effect.
- App callback `onSanctuaryUpgradeReady`.

- [ ] Write failing UI-summary test for one affordable and one renown-blocked facility.
- [ ] Verify RED.
- [ ] Implement summary model.
- [ ] Build overlay using existing `/ui/popup_panel_frame.png`, code-rendered labels/progress/cost only.
- [ ] Expose `UPGRADE_SANCTUARY` callback from App and bridge it in Root.
- [ ] Add compact home entry; opening/closing overlay must not change game screen.
- [ ] Verify production build and commit.

### Task 6: Regression, PR, and deployment verification

- [ ] Run/fetch complete test suite and production build on the exact latest SHA.
- [ ] Record exact test file/test totals from CI logs when available.
- [ ] Confirm PR #2 remains draft/open/unmerged.
- [ ] Update PR #2 scope with Starlight Sanctuary and latest verified SHA.
- [ ] Check Vercel deployment feed for exact latest SHA; claim READY only on exact match.
- [ ] Do not merge PR #2 or PR #3.
