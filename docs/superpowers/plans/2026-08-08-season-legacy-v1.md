# Season Legacy V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn completed seasons into automatic lifetime progression that makes later seasons meaningfully smoother while preserving the core raising-game loop.

**Architecture:** Extend the existing season progression state with a small authoritative Legacy ledger and derived passive bonuses. Integrate bonuses into existing training/mastery/reward calculations and keep recap/UI as projections of state rather than separate progression systems.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing reducer/localStorage architecture.

## Global Constraints

- Preserve the existing save key and migrate old saves safely.
- Preserve monthly and season progression behavior.
- No spendable Legacy currency, skill tree, respec flow, separate shop, daily chores, or mandatory extra taps.
- Awards must be idempotent across reload/revisit.
- Passive bonuses must be bounded and must not trivialize training.
- Use TDD and independently reversible commits.
- Do not merge PR/main without explicit user instruction.
- Do not claim build/deploy success without verification.

---

### Task 1: Define Legacy state and migration

**Files:**
- Modify: `src/game.ts`
- Test: existing game/season tests

**Produces:** `LegacyState`, safe hydration defaults, completed-season ledger, derived milestone helpers.

- [ ] Add failing migration and malformed-state tests.
- [ ] Verify RED.
- [ ] Add Legacy defaults/sanitization and milestone derivation.
- [ ] Verify GREEN and commit.

### Task 2: Define idempotent season award calculation

**Files:**
- Modify: `src/game.ts`
- Test: season progression tests

**Produces:** deterministic Legacy Point award and season ledger behavior.

- [ ] Add failing tests for award inputs from completion, memories, mastery, quality, and keepsakes/collection.
- [ ] Add duplicate-award regression test.
- [ ] Verify RED.
- [ ] Implement deterministic capped award calculation.
- [ ] Verify GREEN and commit.

### Task 3: Integrate bounded passive bonuses

**Files:**
- Modify: `src/game.ts`
- Test: training/mastery/reward tests

**Produces:** passive training multiplier, mastery XP bonus, starting-condition/affection advantage, reward multiplier.

- [ ] Add threshold/bounds tests.
- [ ] Add score/mastery/reward integration tests.
- [ ] Verify RED.
- [ ] Apply bonuses inside existing calculations only.
- [ ] Verify GREEN and commit.

### Task 4: Build season recap snapshot

**Files:**
- Modify: `src/game.ts`
- Test: season rollover tests

**Produces:** `lastSeasonRecap` with season, earned/lifetime points, strongest mastery, memories/collection summary, milestone unlock, and next-season bonuses.

- [ ] Add failing rollover recap test.
- [ ] Verify RED.
- [ ] Build recap atomically during season rollover.
- [ ] Verify reload does not re-award Legacy Points.
- [ ] Verify GREEN and commit.

### Task 5: Surface Legacy progression with minimal UI

**Files:**
- Modify: `src/LayeredHome.tsx`
- Modify: relevant result/season recap component(s)
- Modify: existing CSS only as needed

- [ ] Show lifetime Legacy progress and next milestone compactly on home.
- [ ] Show one season recap surface at rollover without creating a permanent dense dashboard.
- [ ] Reuse existing visual language/assets.
- [ ] Verify mobile hierarchy and no overlap.
- [ ] Commit.

### Task 6: Full regression and deployment verification

- [ ] Run complete test suite.
- [ ] Run production build.
- [ ] Verify monthly loop through season rollover.
- [ ] Verify old save migration.
- [ ] Verify duplicate rollover/reload cannot duplicate rewards.
- [ ] Verify Vercel preview status and inspect build logs if needed.
- [ ] Keep PR/main unmerged.
